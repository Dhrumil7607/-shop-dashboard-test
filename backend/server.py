"""
ShopLiveBharat — Complete Backend API
FastAPI + in-memory DB (or MongoDB when MONGO_URL set)

Routes:
  Auth:     POST /api/auth/register, /api/auth/login, GET /api/auth/me
  Shops:    GET /api/shops, POST/PATCH/DELETE /api/admin/shops/:id
  Products: GET /api/products, POST/PATCH/DELETE /api/admin/products/:id
  Cart:     GET/POST/PATCH/DELETE /api/cart
  Wishlist: GET/POST/DELETE /api/wishlist
  Orders:   GET/POST /api/orders, PATCH /api/admin/orders/:id
  Bookings: GET/POST /api/bookings
  Seller:   GET /api/seller/me, GET /api/seller/products, GET /api/seller/orders
  Admin:    Full CRUD on all entities
"""

from fastapi import FastAPI, APIRouter, Depends, Header, HTTPException, Query, Request, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import os, re, logging, uuid, math
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
import hashlib, hmac

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("shoplivebharat")

# ── DB setup ──────────────────────────────────────────────────────────────────
mongo_url = os.environ.get("MONGO_URL", "")
USE_MEMORY_DB = os.environ.get("USE_MEMORY_DB", "0") == "1"

import json as _json

_mongo_client = None
_mongo_db = None

# Skip MongoDB entirely if using memory DB or no URL provided
if not USE_MEMORY_DB and mongo_url:
    try:
        # Lazy import pymongo only when needed
        from pymongo import MongoClient as _MongoClient
        import certifi
        # Use certifi's CA bundle for robust TLS on all Python versions/platforms.
        # tlsCAFile=certifi.where() ensures Atlas TLS certificates are validated correctly.
        _mongo_client = _MongoClient(
            mongo_url,
            serverSelectionTimeoutMS=15000,
            connectTimeoutMS=15000,
            socketTimeoutMS=15000,
            tls=True,
            tlsCAFile=certifi.where(),
        )
        _mongo_client.admin.command("ping")
        _mongo_db = _mongo_client[os.environ.get("DB_NAME", "shoplivebharat")]
        logger.info("[DB] Connected to MongoDB Atlas")
    except Exception as e:
        logger.warning(f"[DB] MongoDB connection failed: {e}. Using in-memory.")
        _mongo_db = None
else:
    logger.info("[DB] Using in-memory database")

# ── MongoDB-backed persistence ────────────────────────────────────────────────
_COLLECTIONS = ["users", "shops", "products", "orders", "carts", "wishlists", "bookings", "waitlist", "slots", "seller_applications", "coupons", "returns", "email_log", "shipments", "categories", "ai_generations", "size_profiles", "ai_training", "_meta"]

def _load_from_mongo() -> Optional[Dict[str, list]]:
    """Load all collections from MongoDB."""
    if _mongo_db is None:
        return None
    try:
        data = {}
        for coll in _COLLECTIONS:
            docs = list(_mongo_db[coll].find({}, {"_id": 0}))
            data[coll] = docs
        if any(len(v) > 0 for v in data.values()):
            logger.info(f"[DB] Loaded from MongoDB: {', '.join(k+'='+str(len(v)) for k,v in data.items() if v)}")
            return data
    except Exception as e:
        logger.warning(f"[DB] MongoDB load error: {e}")
    return None

def _persist_to_mongo():
    """Write all in-memory state to MongoDB — runs in background thread."""
    if _mongo_db is None:
        return
    try:
        for coll in _COLLECTIONS:
            docs = mem.get(coll, [])
            _mongo_db[coll].delete_many({})
            if docs:
                _mongo_db[coll].insert_many([{k: v for k, v in d.items() if k != "_id"} for d in docs])
    except Exception as e:
        logger.warning(f"[DB] MongoDB persist error: {e}")

def _persist_collection(coll_name: str):
    """Persist a single collection to MongoDB — faster than full persist."""
    if _mongo_db is None:
        return
    try:
        docs = mem.get(coll_name, [])
        _mongo_db[coll_name].delete_many({})
        if docs:
            _mongo_db[coll_name].insert_many([{k: v for k, v in d.items() if k != "_id"} for d in docs])
    except Exception as e:
        logger.warning(f"[DB] MongoDB persist error ({coll_name}): {e}")

def _persist_db():
    """Persist state in a background thread — never blocks the API response."""
    import threading
    import json as _json
    # Use a lock to prevent concurrent persist threads overwriting each other
    if not hasattr(_persist_db, "_lock"):
        _persist_db._lock = threading.Lock()
    if not _persist_db._lock.acquire(blocking=False):
        return  # A persist is already running — skip this one
    def _do_persist():
        try:
            _persist_to_mongo()
            try:
                _db_path = os.path.join(os.path.dirname(__file__), "db.json")
                with open(_db_path, "w") as f:
                    _json.dump(mem, f, default=str)
            except Exception as e:
                logger.warning(f"[DB] db.json write error: {e}")
        finally:
            _persist_db._lock.release()
    threading.Thread(target=_do_persist, daemon=True).start()

# Try loading from MongoDB first, then db.json, then empty
_persisted = _load_from_mongo()
if not _persisted:
    try:
        import json as _json
        _db_path = os.path.join(os.path.dirname(__file__), "db.json")
        if os.path.exists(_db_path):
            with open(_db_path, "r") as f:
                _persisted = _json.load(f)
            logger.info(f"[DB] Loaded from db.json: {', '.join(k+'='+str(len(v)) for k,v in _persisted.items() if v)}")
    except Exception as e:
        logger.warning(f"[DB] db.json load error: {e}")
        _persisted = None

if _persisted:
    mem: Dict[str, list] = _persisted
else:
    mem: Dict[str, list] = {
        "users": [], "shops": [], "products": [],
        "orders": [], "carts": [], "wishlists": [],
        "bookings": [], "waitlist": [], "slots": [],
        "seller_applications": [], "coupons": [], "returns": [],
        "email_log": [], "shipments": [], "categories": [], "_meta": [],
        "size_profiles": [], "ai_training": [],
    }

ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "shoplivebharat-admin")
JWT_SECRET    = os.environ.get("JWT_SECRET", "slb-secret-2026")
# HASH_SALT is intentionally separate from JWT_SECRET so password hashes remain
# consistent across deployments regardless of JWT_SECRET rotation.
# On Railway/production, set HASH_SALT to a fixed value and never change it.
HASH_SALT     = os.environ.get("HASH_SALT", "slb-pw-salt-fixed-2026")
# Public site URL used for Razorpay redirect/callback flows (must be the domain
# customers actually browse — its /api proxies to this backend).
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "https://build-blush-eta.vercel.app").rstrip("/")
JWT_ALGO      = "HS256"
JWT_EXPIRE_HOURS = 72

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "972995084399-tpmb1vpe26imufiia9t966rgr9aqs090.apps.googleusercontent.com")

# ── Razorpay ──────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

# ── Helpers ───────────────────────────────────────────────────────────────────
def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _slugify(v: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", v.lower()).strip("-") or str(uuid.uuid4())[:8]

def _email_template(subject: str, body_html: str) -> str:
    """Wrap message content in a branded, email-client-safe HTML shell."""
    site = PUBLIC_BASE_URL
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#FAF9F6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #E8E4DF;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#1a1a1a;padding:22px 32px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">ShopLive<span style="color:#C9A84C;">Bharat</span></span>
            <div style="font-size:11px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">From India's Streets To Your Home</div>
          </td></tr>
          <tr><td style="padding:32px;color:#4A3F35;font-size:15px;line-height:1.6;">
            <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 16px;font-weight:600;">{subject}</h1>
            {body_html}
          </td></tr>
          <tr><td style="padding:20px 32px;background:#FAF9F6;border-top:1px solid #E8E4DF;color:#9B8B7A;font-size:12px;line-height:1.6;">
            <a href="{site}" style="color:#8B3A3A;text-decoration:none;font-weight:600;">Visit ShopLiveBharat</a><br>
            You're receiving this email because you have an account or placed an order with ShopLiveBharat.<br>
            &copy; ShopLiveBharat — Authentic Indian fashion, delivered worldwide.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>"""

def _notify_seller_status(shop: dict, action: str, reason: str = "") -> None:
    """Email a store owner when their store is suspended/archived/deleted/restored."""
    to = (shop or {}).get("owner_email", "")
    if not to:
        return
    name = shop.get("name", "your store")
    templates = {
        "suspended": (
            "Your ShopLiveBharat store has been suspended",
            f"<p>Your store <strong>{name}</strong> has been <strong>suspended</strong> and is no longer "
            f"visible to customers. Your seller portal access is paused.</p>"
            + (f"<p><strong>Reason:</strong> {reason}</p>" if reason else "")
            + "<p>Please contact ShopLiveBharat support to resolve this.</p>",
        ),
        "archived": (
            "Your ShopLiveBharat store has been archived",
            f"<p>Your store <strong>{name}</strong> has been <strong>archived</strong>. It is hidden from "
            f"customers, your products are unpublished, and seller portal access is disabled.</p>"
            "<p>Your data is retained. Contact support if you'd like it restored.</p>",
        ),
        "deleted": (
            "Your ShopLiveBharat store has been removed",
            f"<p>Your store <strong>{name}</strong> has been <strong>permanently removed</strong> from "
            f"ShopLiveBharat, along with its products and seller access.</p>"
            "<p>If you believe this was a mistake, please contact ShopLiveBharat support.</p>",
        ),
        "restored": (
            "Your ShopLiveBharat store has been restored",
            f"<p>Good news — your store <strong>{name}</strong> has been <strong>restored</strong>. "
            f"Your seller portal access is active again and your store can return to normal visibility.</p>",
        ),
    }
    subject, body = templates.get(action, ("ShopLiveBharat store update", f"<p>Your store {name} was updated.</p>"))
    _send_email(to=to, subject=subject, body=body, kind=f"seller_{action}")

def _send_welcome_email(to: str, name: str) -> dict:
    """Send a premium, beautifully designed welcome email to new customers."""
    first = (name or "there").split()[0]
    site = PUBLIC_BASE_URL
    body = f"""\
<div style="text-align:center;margin-bottom:28px;">
  <img src="https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=600&q=80&auto=format"
       alt="Indian Fashion" style="width:100%;max-width:520px;height:200px;object-fit:cover;border-radius:12px;" />
</div>

<p style="font-size:22px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;color:#1a1a1a;margin:0 0 4px;">
  Welcome, <span style="color:#8B3A3A;font-style:italic;">{first}</span>.
</p>
<p style="font-size:13px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px;font-weight:600;">
  Your journey into authentic Indian fashion starts now
</p>

<p style="font-size:15px;line-height:1.7;color:#4A3F35;">
  Thank you for joining <strong>ShopLiveBharat</strong> — India's premium live-shopping marketplace.
  We connect you directly with trusted local stores across India, bringing sarees, lehengas, kurtas,
  sherwanis, and wedding collections to your doorstep, anywhere in the world.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="padding:16px 20px;background:#FAF9F6;border-radius:12px;border:1px solid #E8E4DF;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#9B8B7A;border-bottom:1px solid #E8E4DF;" width="30">✦</td>
          <td style="padding:8px 0;font-size:14px;color:#4A3F35;border-bottom:1px solid #E8E4DF;">
            <strong>Shop from India's finest local stores</strong> — authentic, handcrafted pieces
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#9B8B7A;border-bottom:1px solid #E8E4DF;">✦</td>
          <td style="padding:8px 0;font-size:14px;color:#4A3F35;border-bottom:1px solid #E8E4DF;">
            <strong>Live video shopping</strong> — see products in real time, ask questions, get styling advice
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#9B8B7A;border-bottom:1px solid #E8E4DF;">✦</td>
          <td style="padding:8px 0;font-size:14px;color:#4A3F35;border-bottom:1px solid #E8E4DF;">
            <strong>Worldwide delivery</strong> — USA, UK, Canada, Australia, UAE & 50+ countries
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#9B8B7A;">✦</td>
          <td style="padding:8px 0;font-size:14px;color:#4A3F35;">
            <strong>Secure payments</strong> — Razorpay, UPI, cards & international wallets
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:32px 0;">
  <a href="{site}/marketplace"
     style="background:#C9A84C;color:#1a1a1a;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;letter-spacing:0.5px;">
    Explore Collections →
  </a>
</div>

<div style="text-align:center;margin:24px 0 8px;">
  <a href="{site}/live-shopping" style="color:#8B3A3A;text-decoration:none;font-size:13px;font-weight:600;">
    Book a Live Shopping Session
  </a>
  <span style="color:#E8E4DF;margin:0 12px;">|</span>
  <a href="{site}/shops" style="color:#8B3A3A;text-decoration:none;font-size:13px;font-weight:600;">
    Browse Stores
  </a>
  <span style="color:#E8E4DF;margin:0 12px;">|</span>
  <a href="{site}/account" style="color:#8B3A3A;text-decoration:none;font-size:13px;font-weight:600;">
    My Account
  </a>
</div>

<p style="font-size:14px;line-height:1.6;color:#9B8B7A;margin-top:28px;font-style:italic;text-align:center;">
  "From India's streets to your home."
</p>

<p style="font-size:14px;color:#4A3F35;margin-top:20px;">
  Welcome aboard,<br>
  <strong style="color:#1a1a1a;">The ShopLiveBharat Team</strong>
</p>
"""
    return _send_email(to=to, subject=f"Welcome to ShopLiveBharat, {first} ✨", body=body, kind="welcome")

def _sender_for_kind(kind: str) -> tuple:
    """Pick the right From address + display name based on the email kind.
    Addresses are overridable via env vars; all must be on a verified domain.
      • orders / returns  → orders@shoplivebharat.com
      • seller / staff    → sellers@shoplivebharat.com
      • booking           → bookings@shoplivebharat.com
      • everything else   → support@shoplivebharat.com
    """
    k = (kind or "").lower()
    default_sender = os.environ.get("SENDER_EMAIL", "support@shoplivebharat.com")
    default_name = os.environ.get("SENDER_NAME", "ShopLiveBharat")
    if k.startswith("order") or k.startswith("return"):
        return (os.environ.get("ORDERS_EMAIL", "orders@shoplivebharat.com"),
                os.environ.get("ORDERS_NAME", "ShopLiveBharat Orders"))
    if k.startswith("seller") or k.startswith("staff"):
        return (os.environ.get("SELLERS_EMAIL", "sellers@shoplivebharat.com"),
                os.environ.get("SELLERS_NAME", "ShopLiveBharat Sellers"))
    if k.startswith("booking"):
        return (os.environ.get("BOOKINGS_EMAIL", "bookings@shoplivebharat.com"),
                os.environ.get("BOOKINGS_NAME", "ShopLiveBharat Bookings"))
    return (default_sender, default_name)

def _send_email(to: str, subject: str, body: str, kind: str = "generic") -> dict:
    """Send an email via Resend if configured, else record in the email log (test mode).
    Always logs to the in-memory email_log so the UI can show delivery status.
    Never raises — email must never block a core flow.
    """
    if not to:
        return {"status": "skipped", "reason": "no recipient"}
    resend_key = os.environ.get("RESEND_API_KEY", "").strip()
    status = "sent" if resend_key else "test_mode"
    provider_id = None
    html = _email_template(subject, body)
    sender, name = _sender_for_kind(kind)
    if resend_key:
        try:
            import resend as _resend
            _resend.api_key = resend_key
            resp = _resend.Emails.send({
                "from": f"{name} <{sender}>", "to": [to],
                "reply_to": os.environ.get("SUPPORT_EMAIL", "support@shoplivebharat.com"),
                "subject": subject, "html": html,
            })
            provider_id = resp.get("id") if isinstance(resp, dict) else getattr(resp, "id", None)
        except Exception as e:
            status = "failed"
            logger.warning(f"[EMAIL] send failed to {to}: {e}")
    entry = {
        "id": str(uuid.uuid4()), "to": to, "from": sender, "subject": subject, "kind": kind,
        "status": status, "provider_id": provider_id, "created_at": _now(),
    }
    try:
        mem.setdefault("email_log", []).append(entry)
    except Exception:
        pass
    if status != "sent":
        logger.info(f"[EMAIL:{status}] to={to} subject={subject!r}")
    return entry

def _hash_pw(pw: str) -> str:
    """Hash a password with bcrypt (industry standard, salted per-password).
    Falls back to a salted SHA-256 only if bcrypt is unavailable."""
    try:
        import bcrypt as _bcrypt
        return _bcrypt.hashpw(pw.encode("utf-8"), _bcrypt.gensalt(rounds=12)).decode("utf-8")
    except Exception:  # pragma: no cover — should not happen in prod
        return "sha256$" + hashlib.sha256((pw + HASH_SALT).encode()).hexdigest()

def _legacy_sha256(pw: str) -> str:
    return hashlib.sha256((pw + HASH_SALT).encode()).hexdigest()

def _check_pw(pw: str, hashed: str) -> bool:
    """Verify a password against a stored hash. Supports bcrypt (new) and the
    legacy salted-SHA256 hashes so existing accounts keep working."""
    if not hashed:
        return False
    if hashed.startswith("$2"):  # bcrypt
        try:
            import bcrypt as _bcrypt
            return _bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False
    # Legacy salted SHA-256 (optionally "sha256$"-prefixed)
    candidate = hashed.split("$", 1)[1] if hashed.startswith("sha256$") else hashed
    return hmac.compare_digest(_legacy_sha256(pw), candidate)

def _needs_rehash(hashed: str) -> bool:
    """True if the stored hash is a legacy (non-bcrypt) hash and should be upgraded."""
    return not (hashed or "").startswith("$2")

def _maybe_upgrade_hash(user: dict, pw: str) -> None:
    """Transparently migrate a legacy hash to bcrypt after a successful login."""
    try:
        if user and _needs_rehash(user.get("password_hash", "")):
            user["password_hash"] = _hash_pw(pw)
            user["updated_at"] = _now()
            _persist_db()
    except Exception:
        pass

def _validate_password_strength(pw: str) -> None:
    """Enforce a strong password policy. Raises HTTPException(400) on failure."""
    pw = pw or ""
    problems = []
    if len(pw) < 8:
        problems.append("at least 8 characters")
    if not re.search(r"[a-z]", pw):
        problems.append("a lowercase letter")
    if not re.search(r"[A-Z]", pw):
        problems.append("an uppercase letter")
    if not re.search(r"\d", pw):
        problems.append("a number")
    if not re.search(r"[^A-Za-z0-9]", pw):
        problems.append("a special character")
    if len(pw) > 128:
        problems.append("no more than 128 characters")
    if problems:
        raise HTTPException(400, "Password must contain " + ", ".join(problems) + ".")

# ── Signed, tamper-proof tokens (HMAC-SHA256 over the payload) ─────────────────
def _b64u(data: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

def _b64u_decode(s: str) -> bytes:
    import base64
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def _make_token(user_id: str, role: str) -> str:
    import json
    payload = {"sub": user_id, "role": role,
               "exp": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)).isoformat()}
    body = _b64u(json.dumps(payload).encode())
    sig = _b64u(hmac.new(JWT_SECRET.encode(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"

def _decode_token(token: str) -> Optional[dict]:
    try:
        import json
        if not token or "." not in token:
            return None  # reject legacy/unsigned tokens — they can be forged
        body, sig = token.split(".", 1)
        expected = _b64u(hmac.new(JWT_SECRET.encode(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(expected, sig):
            return None  # signature mismatch → forged/tampered
        payload = json.loads(_b64u_decode(body).decode())
        exp = datetime.fromisoformat(payload["exp"])
        if exp < datetime.now(timezone.utc):
            return None
        return payload
    except Exception:
        return None

# ── Memory CRUD helpers ───────────────────────────────────────────────────────
def mem_get(store: str, **filters):
    docs = mem[store]
    for k, v in filters.items():
        docs = [d for d in docs if d.get(k) == v]
    return docs

def mem_first(store: str, **filters):
    results = mem_get(store, **filters)
    return results[0] if results else None

def mem_insert(store: str, doc: dict) -> dict:
    mem[store].append(doc)
    _persist_db()
    return doc

def mem_update(store: str, doc_id: str, changes: dict) -> Optional[dict]:
    for doc in mem[store]:
        if doc.get("id") == doc_id:
            doc.update(changes)
            _persist_db()
            return doc
    return None

def mem_delete(store: str, doc_id: str) -> bool:
    before = len(mem[store])
    mem[store] = [d for d in mem[store] if d.get("id") != doc_id]
    if len(mem[store]) < before:
        _persist_db()
        return True
    return False

# ── App ───────────────────────────────────────────────────────────────────────
import asyncio

# ── Background keep-alive (prevents Railway from sleeping) ───────────────────
async def _keepalive_loop():
    """Ping MongoDB every 4 minutes to keep the connection alive and prevent Railway idle shutdown."""
    while True:
        await asyncio.sleep(240)  # 4 minutes
        try:
            if _mongo_db is not None:
                _mongo_db.command("ping")
                logger.debug("[keepalive] MongoDB ping ok")
        except Exception:
            pass

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    # Start keep-alive background task
    task = asyncio.create_task(_keepalive_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="ShopLiveBharat API", version="2.1.0", lifespan=lifespan)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
def _get_real_ip(request: Request) -> str:
    """Extract the real client IP from X-Forwarded-For (Vercel proxy adds it)."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)

limiter = Limiter(key_func=_get_real_ip, default_limits=["120/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS (restricted to actual domains) ───────────────────────────────────────
_ALLOWED_ORIGINS = [
    "https://www.shoplivebharat.com",
    "https://shoplivebharat.com",
    "https://build-blush-eta.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request body size limit (prevents payload-based DoS) ──────────────────────
# Image uploads are base64 data URLs, so allow a generous 12MB ceiling.
_MAX_BODY_BYTES = int(os.environ.get("MAX_BODY_BYTES", str(12 * 1024 * 1024)))

@app.middleware("http")
async def _limit_body_size(request: Request, call_next):
    cl = request.headers.get("content-length")
    if cl:
        try:
            if int(cl) > _MAX_BODY_BYTES:
                return JSONResponse(status_code=413, content={"detail": "Request body too large."})
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length."})
    return await call_next(request)

api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

# ── Auth dependencies ─────────────────────────────────────────────────────────
async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = _decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token expired or invalid")
    # Always verify the user still exists in the database (works for both mem and MongoDB)
    user = mem_first("users", id=payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    # Suspended accounts (customer or seller) lose access immediately, even mid-session
    if user.get("is_suspended") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact ShopLiveBharat support.")
    return payload

async def optional_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    if not creds:
        return None
    payload = _decode_token(creds.credentials)
    return payload

def require_admin(x_admin_key: Optional[str] = Header(default=None),
                  creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    # Accept the shared admin key (legacy) …
    if x_admin_key and hmac.compare_digest(x_admin_key, ADMIN_API_KEY):
        return
    # … or a valid, signed admin-role JWT (preferred — no shared secret in the frontend)
    if creds:
        payload = _decode_token(creds.credentials)
        if payload and payload.get("role") == "admin":
            user = mem_first("users", id=payload.get("sub"))
            if user and user.get("role") == "admin" and not user.get("is_suspended"):
                return
    raise HTTPException(status_code=401, detail="Admin authentication required")

async def require_seller(payload: dict = Depends(get_current_user)):
    if payload.get("role") not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Seller access required")
    # Revoke portal access for suspended / archived sellers (admins are exempt)
    if payload.get("role") == "seller":
        user = mem_first("users", id=payload["sub"])
        if user and (user.get("is_suspended") or user.get("is_archived")):
            raise HTTPException(
                status_code=403,
                detail="Your seller account is no longer active. Please contact ShopLiveBharat support.",
            )
    return payload


def _seller_ai_enabled(seller_id: str) -> bool:
    """True when a seller's shop has AI Studio enabled by admin, or it's the
    ShopLiveBharat main/admin store (always enabled)."""
    user = mem_first("users", id=seller_id) or {}
    shop = mem_first("shops", id=user.get("store_id")) if user.get("store_id") else None
    if not shop:
        return False
    return bool(shop.get("ai_studio_enabled") or shop.get("is_admin_store") or shop.get("id") == "shop-shoplivebharat")


async def require_ai_seller(payload: dict = Depends(require_seller)):
    """Gate AI Studio generation endpoints: admins always pass; sellers must have
    the admin-granted `ai_studio_enabled` flag (the main store is always on)."""
    if payload.get("role") == "admin":
        return payload
    if not _seller_ai_enabled(payload["sub"]):
        raise HTTPException(
            status_code=403,
            detail="AI Studio is not enabled for your store yet. Please contact ShopLiveBharat to request access.",
        )
    return payload

# ── Pydantic models ───────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = Field(default="customer")  # customer | seller

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str; name: str; email: str; role: str; phone: str = ""
    city: str = ""; store_id: Optional[str] = None; store_name: Optional[str] = None

class TokenOut(BaseModel):
    token: str; user: UserOut

class ShopIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=2)
    owner_name: str = Field(min_length=2)
    owner_email: EmailStr
    city: str = Field(min_length=2)
    country: str = "India"
    specialty: str = Field(min_length=2)
    description: str = Field(min_length=10)
    image_url: str = ""
    instagram_url: str = ""
    is_active: bool = True

class ShopOut(ShopIn):
    id: str; slug: str; created_at: str; updated_at: str
    rating: float = 4.8; followers: int = 0; productCount: int = 0; verified: bool = True
    online: bool = True; status: str = "active"; liveShoppingEnabled: bool = True

class ProductIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    shop_id: str; name: str = Field(min_length=1); category: str = ""
    description: str = ""
    price: int = Field(default=0, ge=0); compare_at_price: Optional[int] = None
    currency: str = "INR"; image_url: str = ""; hover_image_url: str = ""
    stock: int = 0; badge: str = ""; is_featured: bool = False; is_active: bool = True
    color: str = ""; ready_to_ship: bool = False
    size_options: str = ""   # comma-separated sizes e.g. "XS,S,M,L,XL" or custom
    sku: str = ""            # seller SKU reference
    images: List[str] = []   # gallery images (first = primary); image_url stays as primary
    weight_grams: int = 0    # shipping weight; 0 → derive default from category
    # Seller size catalogue for AI size recommendation:
    #   {"unit": "in"|"cm", "sizes": [{"size":"M","chest":38,"waist":32,"hip":40,
    #     "shoulder":14.5,"sleeve":22,"length":40}, ...]}
    size_chart: Optional[dict] = None

class ProductOut(ProductIn):
    id: str; slug: str; shop_name: str = ""; created_at: str; updated_at: str
    status: str = "live"  # live | hidden | out_of_stock | removed | draft

class CartItemIn(BaseModel):
    product_id: str; quantity: int = 1; size: str = ""; color: str = ""

class CartItemOut(BaseModel):
    id: str; product_id: str; product_name: str; image_url: str
    price: int; quantity: int; size: str = ""; color: str = ""
    availability: str = "available"  # available | out_of_stock | unavailable

class CartOut(BaseModel):
    items: List[CartItemOut] = []; total: int = 0

class OrderItemIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str; quantity: int = 1; size: str = ""; color: str = ""
    custom_measurements: dict = {}

class OrderIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: List[OrderItemIn]
    shipping_address: dict
    payment_method: str = "razorpay"
    coupon_code: str = ""
    coupon_discount: float = 0
    currency: str = "INR"
    razorpay_payment_id: str = ""
    razorpay_order_id: str = ""
    razorpay_signature: str = ""
    size_profile_id: str = ""

class OrderOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str; user_id: str; items: list; total: int
    status: str; payment_status: str; shipping_address: dict
    created_at: str; updated_at: str

class BookingIn(BaseModel):
    store_id: str; store_name: str = ""
    selected_products: list = []
    date: str; time: str; timezone: str = "IST"
    session_fee: int = 2999

class WishlistItemIn(BaseModel):
    product_id: str

# ── Seed data ─────────────────────────────────────────────────────────────────
_SEED_VERSION = "v3-clean"  # Bump this to force re-seed (clears old data)

def _seed():
    """Seed only admin + customer accounts. All sellers come through application flow."""
    # Check if we need to re-seed (version mismatch or empty)
    current_version = mem.get("_meta", [{}])[0].get("seed_version") if mem.get("_meta") else None
    if current_version == _SEED_VERSION and mem.get("users"):
        return  # Already seeded with current version

    # Clear everything and re-seed fresh
    for k in list(mem.keys()):
        mem[k] = []

    # Only admin and customer — no pre-created sellers
    mem["users"] = [
        {"id":"demo_admin","name":"Admin","email":"admin@shoplivebharat.com",
         "password_hash":_hash_pw("admin123"),"role":"admin","phone":"","city":"","created_at":_now()},
        {"id":"demo_customer","name":"Priya Mehta","email":"customer@shoplivebharat.com",
         "password_hash":_hash_pw("customer123"),"role":"customer","phone":"+91 98765 00003",
         "city":"Delhi","created_at":_now()},
    ]
    # Only ShopLiveBharat admin store — seller stores created via approval flow
    mem["shops"] = [
        {"id":"shop-shoplivebharat","slug":"shoplivebharat-exclusive","name":"ShopLive Bharat",
         "owner_name":"ShopLive Bharat","owner_email":"admin@shoplivebharat.com","city":"Mumbai",
         "country":"India","specialty":"Exclusive curated Indian fashion",
         "description":"Handpicked exclusive collections curated by ShopLive Bharat.",
         "image_url":"https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=800&q=80",
         "banner_image":"https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=1200&q=80",
         "instagram_url":"","is_active":True,"is_admin_store":True,
         "online":True,"status":"active","liveShoppingEnabled":True,
         "acceptsLiveBookings":True,
         "show_in_booking_page":True,  # admin store always shown in Book a Session
         "display_order":1,
         "source":"exclusive","rating":5.0,"followers":0,"productCount":0,"verified":True,
         "return_policy":"Easy 7-day returns on all exclusive products.",
         "shipping_policy":"Free worldwide shipping on all ShopLive Bharat exclusive orders.",
         "created_at":_now(),"updated_at":_now()},
    ]
    mem["products"] = []
    mem["slots"] = []
    mem["orders"] = []
    mem["bookings"] = []
    mem["carts"] = []
    mem["wishlists"] = []
    mem["waitlist"] = []
    mem["seller_applications"] = []
    mem["coupons"] = []
    mem["returns"] = []
    mem["email_log"] = []
    mem["shipments"] = []
    mem["categories"] = [
        {"id":"cat-1","slug":"sarees","label":"Sarees","caption":"Draped in tradition","image_url":"https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=800&q=80","display_order":1,"visible":True,"created_at":_now(),"updated_at":_now()},
        {"id":"cat-2","slug":"lehengas","label":"Lehengas","caption":"For the grandest moments","image_url":"https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=800&q=80","display_order":2,"visible":True,"created_at":_now(),"updated_at":_now()},
        {"id":"cat-3","slug":"kurtas","label":"Kurtas","caption":"Everyday elegance","image_url":"https://images.unsplash.com/photo-1744551358303-46edae8b374b?w=800&q=80","display_order":3,"visible":True,"created_at":_now(),"updated_at":_now()},
        {"id":"cat-4","slug":"sherwanis","label":"Sherwanis","caption":"The groom's finest","image_url":"https://images.unsplash.com/photo-1760080838961-4208536db385?w=800&q=80","display_order":4,"visible":True,"created_at":_now(),"updated_at":_now()},
        {"id":"cat-5","slug":"chaniya-choli","label":"Chaniya Choli","caption":"Celebrate in colour","image_url":"https://images.unsplash.com/photo-1668371679302-a8ec781e876e?w=800&q=80","display_order":5,"visible":True,"created_at":_now(),"updated_at":_now()},
        {"id":"cat-6","slug":"kids-traditional","label":"Kids Traditional","caption":"Little ones, big style","image_url":"https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?w=800&q=80","display_order":6,"visible":True,"created_at":_now(),"updated_at":_now()},
        {"id":"cat-7","slug":"wedding-collection","label":"Wedding Collection","caption":"A lifetime of memories","image_url":"https://images.unsplash.com/photo-1703045199207-5312874d9e54?w=800&q=80","display_order":7,"visible":True,"created_at":_now(),"updated_at":_now()},
        {"id":"cat-8","slug":"festival-collection","label":"Festival Collection","caption":"Celebrate every season","image_url":"https://images.unsplash.com/photo-1468234847176-28606331216a?w=800&q=80","display_order":8,"visible":True,"created_at":_now(),"updated_at":_now()},
    ]
    # Store version marker
    mem["_meta"] = [{"seed_version": _SEED_VERSION, "seeded_at": _now()}]
    logger.info(f"[DB] Fresh seed applied (version {_SEED_VERSION})")

def _dedup_collections():
    """Remove duplicate documents (same id) from all collections — fixes MongoDB race condition duplicates."""
    deduped = 0
    for coll in _COLLECTIONS:
        docs = mem.get(coll, [])
        seen = set()
        unique = []
        for doc in docs:
            key = doc.get("id") or doc.get("_id") or id(doc)
            if key not in seen:
                seen.add(key)
                unique.append(doc)
        removed = len(docs) - len(unique)
        if removed > 0:
            mem[coll] = unique
            deduped += removed
    if deduped:
        logger.info(f"[DB] Deduplication removed {deduped} duplicate document(s)")
    return deduped

_DEFAULT_CATEGORIES = [
    {"id":"cat-1","slug":"sarees","label":"Sarees","caption":"Draped in tradition","image_url":"https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=800&q=80","display_order":1,"visible":True},
    {"id":"cat-2","slug":"lehengas","label":"Lehengas","caption":"For the grandest moments","image_url":"https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=800&q=80","display_order":2,"visible":True},
    {"id":"cat-3","slug":"kurtas","label":"Kurtas","caption":"Everyday elegance","image_url":"https://images.unsplash.com/photo-1744551358303-46edae8b374b?w=800&q=80","display_order":3,"visible":True},
    {"id":"cat-4","slug":"sherwanis","label":"Sherwanis","caption":"The groom's finest","image_url":"https://images.unsplash.com/photo-1760080838961-4208536db385?w=800&q=80","display_order":4,"visible":True},
    {"id":"cat-5","slug":"chaniya-choli","label":"Chaniya Choli","caption":"Celebrate in colour","image_url":"https://images.unsplash.com/photo-1668371679302-a8ec781e876e?w=800&q=80","display_order":5,"visible":True},
    {"id":"cat-6","slug":"kids-traditional","label":"Kids Traditional","caption":"Little ones, big style","image_url":"https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?w=800&q=80","display_order":6,"visible":True},
    {"id":"cat-7","slug":"wedding-collection","label":"Wedding Collection","caption":"A lifetime of memories","image_url":"https://images.unsplash.com/photo-1703045199207-5312874d9e54?w=800&q=80","display_order":7,"visible":True},
    {"id":"cat-8","slug":"festival-collection","label":"Festival Collection","caption":"Celebrate every season","image_url":"https://images.unsplash.com/photo-1468234847176-28606331216a?w=800&q=80","display_order":8,"visible":True},
]

def _ensure_seed_account_passwords():
    """Self-heal: guarantee the documented seed accounts can always log in with
    their known passwords. Stored hashes can become stale if they were created
    under a different HASH_SALT (e.g. before HASH_SALT was configured on the
    server), which locks out admin@shoplivebharat.com / customer@shoplivebharat.com
    even though the auth system itself is fine. This re-syncs them on startup."""
    known = {
        "admin@shoplivebharat.com": "admin123",
        "customer@shoplivebharat.com": "customer123",
    }
    changed = False
    for u in mem.get("users", []):
        pw = known.get((u.get("email") or "").lower())
        # Never override a password the user has deliberately changed.
        if u.get("password_customized"):
            continue
        # Only reset if the documented password does NOT currently verify
        # (bcrypt hashes differ every time, so compare via _check_pw, not ==).
        if pw and not _check_pw(pw, u.get("password_hash", "")):
            u["password_hash"] = _hash_pw(pw)
            changed = True
    if changed:
        logger.info("[DB] Repaired seed account password hashes (admin/customer)")
    return changed

def _ensure_main_store():
    """Self-heal: guarantee the ShopLiveBharat admin/head store always exists.
    Also ensure there's a seller user account for it (for seller portal access)."""
    shops = mem.get("shops", [])
    main = next((s for s in shops if s.get("id") == "shop-shoplivebharat"), None)
    if not main:
        main = {
            "id": "shop-shoplivebharat", "slug": "shoplivebharat-exclusive",
            "name": "ShopLive Bharat", "owner_name": "ShopLive Bharat",
            "owner_email": "admin@shoplivebharat.com", "city": "Mumbai",
            "country": "India", "specialty": "Exclusive curated Indian fashion",
            "description": "Handpicked exclusive collections curated by ShopLive Bharat.",
            "image_url": "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=800&q=80",
            "banner_image": "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=1200&q=80",
            "instagram_url": "", "is_active": True, "is_admin_store": True,
            "online": True, "status": "active", "liveShoppingEnabled": True,
            "acceptsLiveBookings": True, "show_in_booking_page": True,
            # Main store: AI Studio always enabled + unlimited usage.
            "ai_studio_enabled": True, "plan": "unlimited",
            "display_order": 1, "source": "exclusive",
            "rating": 5.0, "followers": 0, "productCount": 0, "verified": True,
            "return_policy": "Easy 7-day returns on all exclusive products.",
            "shipping_policy": "Free worldwide shipping on all ShopLive Bharat exclusive orders.",
            "created_at": _now(), "updated_at": _now(),
        }
        mem.setdefault("shops", []).append(main)
        logger.info("[DB] Restored main store (shop-shoplivebharat)")
    else:
        # Ensure existing main store always has AI Studio on + unlimited usage.
        if not main.get("ai_studio_enabled") or main.get("plan") != "unlimited":
            main["ai_studio_enabled"] = True
            main["plan"] = "unlimited"
            main["is_admin_store"] = True
            main["updated_at"] = _now()
    # Ensure a seller user exists for the main store (for seller portal login)
    seller = next((u for u in mem.get("users", []) if u.get("store_id") == "shop-shoplivebharat" and u.get("role") == "seller"), None)
    if not seller:
        seller = {
            "id": "seller-main-store", "name": "ShopLive Bharat",
            "email": "store@shoplivebharat.com",
            "password_hash": _hash_pw("ShopLive@2026!"),
            "role": "seller", "phone": "", "city": "Mumbai",
            "store_name": "ShopLive Bharat", "store_id": "shop-shoplivebharat",
            "created_at": _now(),
        }
        mem.setdefault("users", []).append(seller)
        logger.info("[DB] Created seller account for main store (store@shoplivebharat.com)")
    return True

def _ensure_default_categories():
    """Self-heal: if the categories collection is empty (e.g. on a live DB seeded
    before categories existed), populate the 8 default homepage categories so the
    admin panel and homepage 'Shop by Category' section stay in sync."""
    cats = mem.setdefault("categories", [])
    if len(cats) == 0:
        for c in _DEFAULT_CATEGORIES:
            cats.append({**c, "created_at": _now(), "updated_at": _now()})
        logger.info(f"[DB] Seeded {len(_DEFAULT_CATEGORIES)} default categories (collection was empty)")
        return True
    return False

# Run dedup first, then seed on startup
_dedup_collections()
_seed()
_ensure_main_store()
_ensure_default_categories()
_ensure_seed_account_passwords()
_persist_db()

# Log startup environment clearly so local/live differences are obvious in logs
_db_mode = "memory+db.json" if USE_MEMORY_DB else ("MongoDB" if _mongo_db is not None else "memory-only (no MongoDB)")
logger.info(f"[STARTUP] DB mode: {_db_mode}")
logger.info(f"[STARTUP] Admin key configured: {bool(ADMIN_API_KEY)}")
logger.info(f"[STARTUP] JWT secret is default: {JWT_SECRET == 'slb-secret-2026'}")
logger.info(f"[STARTUP] Hash salt is default: {HASH_SALT == 'slb-pw-salt-fixed-2026'}")
if USE_MEMORY_DB:
    logger.warning("[STARTUP] USE_MEMORY_DB=1 — data resets on every restart. Set MONGO_URL for persistence.")
else:
    # Fail-fast: refuse to run production with default/weak secrets
    if JWT_SECRET == "slb-secret-2026":
        logger.critical("[SECURITY] ⚠ JWT_SECRET is the default value! Set a strong random JWT_SECRET on Railway.")
    if ADMIN_API_KEY == "shoplivebharat-admin":
        logger.warning("[SECURITY] ⚠ ADMIN_API_KEY is the default value. Rotate it for production security.")

# ── Health ────────────────────────────────────────────────────────────────────
@api.get("/")
def root():
    return {
        "service": "ShopLiveBharat API v2",
        "status": "ok",
        "db": "memory" if USE_MEMORY_DB else ("mongodb" if _mongo_db is not None else "memory-fallback"),
    }

# ── Homepage Ticker (admin-editable marquee text) ─────────────────────────────
@api.get("/ticker")
def get_ticker():
    """Public: return the ticker items for the homepage marquee banner."""
    items = mem.get("_ticker", None)
    if not items:
        return {"items": [
            "FREE WORLDWIDE SHIPPING OVER ₹15,000",
            "100% AUTHENTIC FROM LOCAL INDIAN STORES",
            "SECURE PAYMENTS — RAZORPAY, PAYPAL, STRIPE",
            "RETURNS & REFUNDS — EASY & TRANSPARENT",
        ]}
    return {"items": items}

@api.put("/admin/ticker", dependencies=[Depends(require_admin)])
def update_ticker(body: dict):
    """Admin: update the homepage ticker text. Body: { "items": ["text1", "text2", ...] }"""
    items = body.get("items", [])
    if not isinstance(items, list) or len(items) == 0:
        raise HTTPException(400, "Provide a non-empty 'items' array of strings")
    items = [str(i).strip() for i in items if str(i).strip()]
    if not items:
        raise HTTPException(400, "At least one non-empty ticker item is required")
    mem["_ticker"] = items
    _persist_db()
    return {"success": True, "items": items}

# ── Google Places: address autocomplete (key stays server-side) ───────────────
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

def _places_request(url: str, method: str = "GET", body: Optional[dict] = None, field_mask: Optional[str] = None) -> dict:
    """Call the Google Places API (New) and return parsed JSON. Never raises.
    The API key travels in the X-Goog-Api-Key header (kept server-side)."""
    import urllib.request as _u, json as _j
    headers = {"Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY}
    if field_mask:
        headers["X-Goog-FieldMask"] = field_mask
    data = _j.dumps(body).encode("utf-8") if body is not None else None
    try:
        req = _u.Request(url, data=data, headers=headers, method=method)
        with _u.urlopen(req, timeout=8) as resp:
            return _j.loads(resp.read().decode("utf-8"))
    except Exception as e:
        logger.warning(f"[PLACES] request failed: {e}")
        return {}

@api.get("/places/autocomplete")
def places_autocomplete(input: str = Query("", min_length=0), payload: dict = Depends(get_current_user)):
    """Address autocomplete restricted to India (Places API New). Returns up to
    5 predictions with only description + place_id. Key never exposed to client."""
    q = (input or "").strip()
    if not GOOGLE_MAPS_API_KEY or len(q) < 3:
        return {"predictions": []}
    data = _places_request(
        "https://places.googleapis.com/v1/places:autocomplete",
        method="POST",
        body={"input": q, "includedRegionCodes": ["in"], "languageCode": "en"},
    )
    preds = []
    for s in (data.get("suggestions") or [])[:5]:
        pp = s.get("placePrediction") or {}
        text = (pp.get("text") or {}).get("text", "")
        pid = pp.get("placeId", "")
        if text and pid:
            preds.append({"description": text, "place_id": pid})
    return {"predictions": preds}

@api.get("/places/details")
def places_details(place_id: str = Query("", min_length=1), payload: dict = Depends(get_current_user)):
    """Resolve a place_id to a structured address (line1, city, state, pincode)."""
    pid = (place_id or "").strip()
    if not GOOGLE_MAPS_API_KEY or not pid:
        return {"address": "", "city": "", "state": "", "pincode": ""}
    data = _places_request(
        f"https://places.googleapis.com/v1/places/{pid}",
        method="GET",
        field_mask="addressComponents,formattedAddress",
    )
    comps = data.get("addressComponents") or []
    def _find(*types):
        for c in comps:
            if any(t in (c.get("types") or []) for t in types):
                return c.get("longText") or c.get("shortText") or ""
        return ""
    street_number = _find("street_number")
    route = _find("route")
    sublocality = _find("sublocality", "sublocality_level_1", "sublocality_level_2", "neighborhood")
    line1_parts = [x for x in [street_number, route] if x]
    line1 = " ".join(line1_parts).strip()
    if not line1:
        line1 = _find("premise") or sublocality or ""
    elif sublocality and sublocality not in line1:
        line1 = f"{line1}, {sublocality}"
    return {
        "address": line1,
        "city": _find("locality", "postal_town", "administrative_area_level_3") or sublocality,
        "state": _find("administrative_area_level_1"),
        "pincode": _find("postal_code"),
        "formatted_address": data.get("formattedAddress", ""),
    }

# ── Razorpay: server-side order creation + verification ───────────────────────
@api.get("/razorpay/config")
def razorpay_config():
    """Public: returns key_id + whether payments are configured."""
    return {"key_id": RAZORPAY_KEY_ID, "configured": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)}

@api.post("/razorpay/order")
@limiter.limit("10/minute")
def razorpay_create_order(request: Request, body: dict):
    """Create a Razorpay order server-side (required for reliable checkout)."""
    import base64 as _b64, json as _json2, urllib.request, urllib.error
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(503, "Razorpay is not configured on the server.")
    amount = int(body.get("amount", 0))            # in paise
    currency = body.get("currency", "INR")
    if amount <= 0:
        raise HTTPException(400, "Invalid amount")
    payload = _json2.dumps({
        "amount": amount, "currency": currency,
        "payment_capture": 1,
        "notes": {"source": "shoplivebharat"},
    }).encode()
    auth = _b64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
    req = urllib.request.Request("https://api.razorpay.com/v1/orders", data=payload, method="POST")
    req.add_header("Authorization", f"Basic {auth}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = _json2.loads(resp.read().decode())
        return {"id": data["id"], "amount": data["amount"], "currency": data["currency"], "key_id": RAZORPAY_KEY_ID}
    except urllib.error.HTTPError as e:
        detail = e.read().decode() if hasattr(e, "read") else str(e)
        logger.warning(f"[Razorpay] order create failed: {detail}")
        raise HTTPException(502, "Could not create payment order. Please try again.")
    except Exception as e:
        logger.warning(f"[Razorpay] order error: {e}")
        raise HTTPException(502, "Payment gateway unavailable. Please try again.")

@api.post("/razorpay/verify")
def razorpay_verify(body: dict):
    """Verify the Razorpay payment signature after checkout."""
    order_id  = body.get("razorpay_order_id", "")
    payment_id = body.get("razorpay_payment_id", "")
    signature = body.get("razorpay_signature", "")
    if not (order_id and payment_id and signature and RAZORPAY_KEY_SECRET):
        raise HTTPException(400, "Missing payment verification data")
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    if hmac.compare_digest(expected, signature):
        return {"verified": True}
    raise HTTPException(400, "Payment signature verification failed")

# ── Razorpay Payment Link (full-page hosted checkout) ─────────────────────────
# This avoids the in-page checkout iframe entirely: we create a hosted payment
# link, redirect the whole browser to Razorpay, and Razorpay redirects back to
# our callback. Robust against any in-page iframe/extension/analytics issues.
_ALLOWED_RETURN_ORIGINS = {
    "https://shoplivebharat.com",
    "https://www.shoplivebharat.com",
    "https://build-blush-eta.vercel.app",
}

def _return_base(origin: str) -> str:
    origin = (origin or "").rstrip("/")
    return origin if origin in _ALLOWED_RETURN_ORIGINS else PUBLIC_BASE_URL

class CheckoutLinkIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: List[OrderItemIn]
    shipping_address: dict
    amount_paise: int
    currency: str = "INR"
    description: str = "ShopLiveBharat Order"
    size_profile_id: str = ""
    return_origin: str = ""

@api.post("/razorpay/checkout-link")
@limiter.limit("10/minute")
async def razorpay_checkout_link(request: Request, body: CheckoutLinkIn, payload: Optional[dict] = Depends(optional_user)):
    """Create a pending order + a Razorpay hosted payment link, return its URL.
    Login is optional — guests can check out (customer info comes from the
    shipping address), so checkout is never blocked by an auth issue."""
    import base64 as _b64, json as _json2, urllib.request, urllib.error
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(503, "Razorpay is not configured on the server.")

    # Validate items (mirror create_order) and build the line items
    subtotal = 0
    items_out = []
    for item in body.items:
        prod = mem_first("products", id=item.product_id)
        if not prod:
            raise HTTPException(404, f"Product {item.product_id} not found")
        status_ = prod.get("status", "live")
        if status_ in ("hidden", "removed", "draft"):
            raise HTTPException(400, f"Product '{prod['name']}' is unavailable and cannot be purchased")
        if status_ == "out_of_stock" or prod.get("stock", 1) <= 0:
            raise HTTPException(400, f"Product '{prod['name']}' is out of stock")
        shop = mem_first("shops", id=prod.get("shop_id"))
        if shop and not _shop_is_public(shop):
            raise HTTPException(400, f"Product '{prod['name']}' is currently unavailable (store offline)")
        line_total = prod["price"] * item.quantity
        subtotal += line_total
        items_out.append({
            "product_id": item.product_id, "product_name": prod["name"],
            "image_url": prod["image_url"], "price": prod["price"],
            "quantity": item.quantity, "size": item.size, "color": item.color,
            "custom_measurements": item.custom_measurements or {},
            "line_total": line_total,
        })

    amount_paise = int(body.amount_paise)
    if amount_paise <= 0:
        raise HTTPException(400, "Invalid amount")

    # Create the order in a pending state (stock is decremented only once paid).
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    addr0 = body.shipping_address or {}
    user_id = payload["sub"] if payload else (f"guest:{addr0.get('email','')}" or "guest")
    buyer = (mem_first("users", id=user_id) if payload else None) or {}
    return_base = _return_base(body.return_origin)
    order = {
        "id": order_id, "user_id": user_id, "items": items_out,
        "total": round(amount_paise / 100), "status": "pending_payment",
        "payment_status": "pending", "shipping_address": body.shipping_address,
        "payment_method": "razorpay", "currency": body.currency,
        "razorpay_payment_id": "", "razorpay_order_id": "",
        "return_base": return_base,
        "created_at": _now(), "updated_at": _now(),
    }
    mem_insert("orders", order)

    addr = body.shipping_address or {}
    link_payload = _json2.dumps({
        "amount": amount_paise,
        "currency": body.currency or "INR",
        "accept_partial": False,
        "description": (body.description or "ShopLiveBharat Order")[:255],
        "reference_id": order_id,
        "customer": {
            "name": addr.get("name") or buyer.get("name", "Customer"),
            "email": addr.get("email") or buyer.get("email", ""),
            "contact": addr.get("phone") or buyer.get("phone", ""),
        },
        "notify": {"sms": False, "email": False},
        "reminder_enable": False,
        "callback_url": f"{return_base}/api/razorpay/pl-callback",
        "callback_method": "get",
    }).encode()
    auth = _b64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
    req = urllib.request.Request("https://api.razorpay.com/v1/payment_links", data=link_payload, method="POST")
    req.add_header("Authorization", f"Basic {auth}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = _json2.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode() if hasattr(e, "read") else str(e)
        logger.warning(f"[Razorpay] payment link failed: {detail}")
        raise HTTPException(502, "Could not start payment. Please try again.")
    except Exception as e:
        logger.warning(f"[Razorpay] payment link error: {e}")
        raise HTTPException(502, "Payment gateway unavailable. Please try again.")

    order["razorpay_payment_link_id"] = data.get("id", "")
    _persist_db()
    return {"short_url": data.get("short_url"), "order_id": order_id, "payment_link_id": data.get("id")}

def _record_payment_alert(order_id: str, paid_paise: int, expected_paise: int, status: str) -> None:
    """Record a payment anomaly for fraud analysis. Stores NO PII — only the
    order id, amounts, and status."""
    try:
        mem.setdefault("payment_alerts", []).append({
            "id": str(uuid.uuid4()), "order_id": order_id,
            "paid_paise": paid_paise, "expected_paise": expected_paise,
            "status": status, "created_at": _now(),
        })
        _persist_db()
    except Exception:
        pass

def _razorpay_fetch_payment(payment_id: str) -> dict:
    """Fetch a payment from Razorpay to confirm the real captured amount.
    Returns {} on any failure (caller decides how strict to be)."""
    if not (payment_id and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET):
        return {}
    try:
        auth = _b64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
        req = urllib.request.Request(f"https://api.razorpay.com/v1/payments/{payment_id}", method="GET")
        req.add_header("Authorization", f"Basic {auth}")
        with urllib.request.urlopen(req, timeout=15) as resp:
            return _json2.loads(resp.read().decode())
    except Exception as e:
        logger.warning(f"[Razorpay] fetch payment failed: {e}")
        return {}

@api.get("/razorpay/pl-callback")
def razorpay_pl_callback(
    razorpay_payment_id: str = Query(default=""),
    razorpay_payment_link_id: str = Query(default=""),
    razorpay_payment_link_reference_id: str = Query(default=""),
    razorpay_payment_link_status: str = Query(default=""),
    razorpay_signature: str = Query(default=""),
):
    """Razorpay redirects the browser here after a hosted payment link is paid."""
    order_id = razorpay_payment_link_reference_id
    # Verify the payment-link signature
    msg = f"{razorpay_payment_link_id}|{razorpay_payment_link_reference_id}|{razorpay_payment_link_status}|{razorpay_payment_id}"
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
    ok = bool(razorpay_signature) and hmac.compare_digest(expected, razorpay_signature)

    order = mem_first("orders", id=order_id) if order_id else None

    # Server-side amount confirmation: fetch the real payment from Razorpay and
    # confirm the captured amount matches the order total. Never trust the
    # client/redirect amount. If it doesn't match, treat as a failed/fraudulent
    # attempt and do NOT fulfil the order.
    amount_ok = True
    if ok and razorpay_payment_link_status == "paid" and order and razorpay_payment_id:
        pay = _razorpay_fetch_payment(razorpay_payment_id)
        if pay:
            paid_paise = int(pay.get("amount") or 0)
            expected_paise = int(round(float(order.get("total", 0)) * 100))
            paid_status = pay.get("status", "")
            # Allow a ₹1 rounding tolerance; require captured/authorized status.
            if abs(paid_paise - expected_paise) > 100 or paid_status not in ("captured", "authorized"):
                amount_ok = False
                logger.warning(
                    f"[FRAUD] Payment amount mismatch order={order_id} "
                    f"paid={paid_paise} expected={expected_paise} status={paid_status}"
                )
                _record_payment_alert(order_id, paid_paise, expected_paise, paid_status)

    if ok and amount_ok and razorpay_payment_link_status == "paid" and order and order.get("payment_status") != "paid":
        order["status"] = "confirmed"
        order["payment_status"] = "paid"
        order["razorpay_payment_id"] = razorpay_payment_id
        order["razorpay_order_id"] = razorpay_payment_link_id
        order["updated_at"] = _now()
        # Decrement stock now that payment is confirmed
        for it in order.get("items", []):
            prod = mem_first("products", id=it.get("product_id"))
            if prod:
                new_stock = max(0, prod.get("stock", 0) - it.get("quantity", 1))
                prod["stock"] = new_stock
                if new_stock == 0:
                    prod["status"] = "out_of_stock"
                prod["updated_at"] = _now()
        # Clear the buyer's cart
        cart = mem_first("carts", user_id=order.get("user_id"))
        if cart:
            cart["items"] = []
        buyer = mem_first("users", id=order.get("user_id"))
        to_email = (buyer or {}).get("email") or (order.get("shipping_address") or {}).get("email")
        if to_email:
            rows = "".join(
                f"<tr><td style='padding:6px 0;'>{it.get('product_name','Item')} × {it.get('quantity',1)}</td>"
                f"<td style='padding:6px 0;text-align:right;'>₹{it.get('line_total', it.get('price',0)):,}</td></tr>"
                for it in order.get("items", [])
            )
            _send_email(
                to=to_email, subject=f"Order confirmed — {order['id']}",
                body=(
                    f"<p>Thank you for your order! Your payment was received and your order "
                    f"<strong>{order['id']}</strong> is confirmed.</p>"
                    "<table role='presentation' width='100%' style='border-top:1px solid #E8E4DF;"
                    "border-bottom:1px solid #E8E4DF;margin:16px 0;font-size:14px;'>"
                    f"{rows}"
                    f"<tr><td style='padding:10px 0;font-weight:700;'>Total</td>"
                    f"<td style='padding:10px 0;text-align:right;font-weight:700;'>₹{order.get('total',0):,}</td></tr>"
                    "</table>"
                    f"<p>Payment ID: <code>{razorpay_payment_id}</code></p>"
                    "<p>We'll email you again when your items ship. Thank you for shopping with ShopLiveBharat!</p>"
                ),
                kind="order_placed",
            )
        _persist_db()
        base = order.get("return_base") or PUBLIC_BASE_URL
        return RedirectResponse(url=f"{base}/checkout?paid={order_id}", status_code=303)

    # Failed / unverified → send back to checkout with an error flag
    base = (order.get("return_base") if order else None) or PUBLIC_BASE_URL
    return RedirectResponse(url=f"{base}/checkout?payment_failed=1", status_code=303)

@api.get("/orders/{order_id}/summary")
def order_summary(order_id: str):
    """Public, minimal order info for the post-payment confirmation screen
    (works for guest checkouts that have no auth token)."""
    o = mem_first("orders", id=order_id)
    if not o:
        raise HTTPException(404, "Order not found")
    return {
        "id": o["id"], "total": o.get("total", 0),
        "status": o.get("status"), "payment_status": o.get("payment_status"),
        "items": o.get("items", []),
        "email": (o.get("shipping_address") or {}).get("email", ""),
        "razorpay_payment_id": o.get("razorpay_payment_id", ""),
    }

# ── Razorpay hosted checkout for a Live Shopping booking (session fee) ─────────
class BookingLinkIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slot_id: Optional[str] = None
    store_id: str
    store_name: str = ""
    selected_products: list = []
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    date: str = ""
    time: str = ""
    timezone: str = "IST"
    amount_paise: int = 69900
    return_origin: str = ""

@api.post("/razorpay/booking-link")
@limiter.limit("10/minute")
async def razorpay_booking_link(request: Request, body: BookingLinkIn, payload: Optional[dict] = Depends(optional_user)):
    """Create a pending booking + a Razorpay hosted payment link for the session fee."""
    import base64 as _b64, json as _json2, urllib.request, urllib.error
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(503, "Razorpay is not configured on the server.")
    # Validate slot availability (reserved only after payment)
    slot = None
    if body.slot_id:
        slot = mem_first("slots", id=body.slot_id)
        if not slot:
            raise HTTPException(404, "Slot not found")
        if slot.get("status") != "available":
            raise HTTPException(409, "Slot no longer available")
    amount_paise = int(body.amount_paise or 69900)
    if amount_paise <= 0:
        raise HTTPException(400, "Invalid amount")

    user = mem_first("users", id=payload["sub"]) if payload else None
    booking_id = f"BK-{uuid.uuid4().hex[:6].upper()}"
    return_base = _return_base(body.return_origin)
    cust_email = body.customer_email or (user or {}).get("email", "")
    booking = {
        "id": booking_id, "bookingId": booking_id,
        "user_id": (payload or {}).get("sub") or (f"guest:{cust_email}" if cust_email else "guest"),
        "slot_id": body.slot_id,
        "store_id": body.store_id, "store_name": body.store_name,
        "shop_id": body.store_id, "shop_name": body.store_name,
        "selected_products": body.selected_products,
        "customer_name": body.customer_name or (user or {}).get("name", ""),
        "customer_email": cust_email,
        "customer_phone": body.customer_phone or (user or {}).get("phone", ""),
        "date": body.date, "time": body.time, "timezone": body.timezone,
        "session_fee": round(amount_paise / 100),
        "status": "pending_payment", "payment_status": "pending",
        "google_meet_link": None,
        "appointmentIST": f"{body.date}T{body.time}:00.000+05:30",
        "return_base": return_base,
        "created_at": _now(), "updated_at": _now(),
    }
    mem_insert("bookings", booking)

    link_payload = _json2.dumps({
        "amount": amount_paise, "currency": "INR", "accept_partial": False,
        "description": f"Live Shopping Session — {body.store_name or 'Store'}"[:255],
        "reference_id": booking_id,
        "customer": {"name": booking["customer_name"] or "Customer", "email": cust_email, "contact": booking["customer_phone"]},
        "notify": {"sms": False, "email": False}, "reminder_enable": False,
        "callback_url": f"{return_base}/api/razorpay/booking-callback",
        "callback_method": "get",
    }).encode()
    auth = _b64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
    req = urllib.request.Request("https://api.razorpay.com/v1/payment_links", data=link_payload, method="POST")
    req.add_header("Authorization", f"Basic {auth}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = _json2.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        logger.warning(f"[Razorpay] booking link failed: {e.read().decode() if hasattr(e,'read') else e}")
        raise HTTPException(502, "Could not start payment. Please try again.")
    except Exception as e:
        logger.warning(f"[Razorpay] booking link error: {e}")
        raise HTTPException(502, "Payment gateway unavailable. Please try again.")

    booking["razorpay_payment_link_id"] = data.get("id", "")
    _persist_db()
    return {"short_url": data.get("short_url"), "booking_id": booking_id}

@api.get("/razorpay/booking-callback")
def razorpay_booking_callback(
    razorpay_payment_id: str = Query(default=""),
    razorpay_payment_link_id: str = Query(default=""),
    razorpay_payment_link_reference_id: str = Query(default=""),
    razorpay_payment_link_status: str = Query(default=""),
    razorpay_signature: str = Query(default=""),
):
    """Razorpay redirects here after a booking session fee is paid."""
    booking_id = razorpay_payment_link_reference_id
    msg = f"{razorpay_payment_link_id}|{razorpay_payment_link_reference_id}|{razorpay_payment_link_status}|{razorpay_payment_id}"
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
    ok = bool(razorpay_signature) and hmac.compare_digest(expected, razorpay_signature)

    booking = mem_first("bookings", id=booking_id) if booking_id else None
    if ok and razorpay_payment_link_status == "paid" and booking and booking.get("payment_status") != "paid":
        booking["status"] = "pending"  # awaiting seller confirmation
        booking["payment_status"] = "paid"
        booking["razorpay_payment_id"] = razorpay_payment_id
        booking["razorpay_order_id"] = razorpay_payment_link_id
        booking["updated_at"] = _now()
        # Reserve the slot now that payment is confirmed
        if booking.get("slot_id"):
            slot = mem_first("slots", id=booking["slot_id"])
            if slot and slot.get("status") == "available":
                slot["bookings_count"] = slot.get("bookings_count", 0) + 1
                slot["booking_id"] = booking_id
                if slot["bookings_count"] >= slot.get("max_bookings", 1):
                    slot["status"] = "booked"
                slot["updated_at"] = _now()
        if booking.get("customer_email"):
            _send_email(
                to=booking["customer_email"],
                subject=f"Live shopping session booked — {booking_id}",
                body=(
                    f"<p>Your live shopping session with <strong>{booking.get('store_name') or 'the store'}</strong> "
                    f"is booked for <strong>{booking.get('date')} {booking.get('time')} ({booking.get('timezone')})</strong>.</p>"
                    f"<p>Payment ID: <code>{razorpay_payment_id}</code></p>"
                    "<p>You'll receive the meeting link once the seller confirms your session.</p>"
                ),
                kind="booking_confirmed",
            )
        _persist_db()
        base = booking.get("return_base") or PUBLIC_BASE_URL
        return RedirectResponse(url=f"{base}/booking-confirmation?paid={booking_id}", status_code=303)

    base = (booking.get("return_base") if booking else None) or PUBLIC_BASE_URL
    return RedirectResponse(url=f"{base}/live-shopping?payment_failed=1", status_code=303)

@api.get("/bookings/{booking_id}/summary")
def booking_summary(booking_id: str):
    """Public, minimal booking info for the post-payment confirmation screen."""
    b = mem_first("bookings", id=booking_id)
    if not b:
        raise HTTPException(404, "Booking not found")
    return {
        "id": b["id"], "bookingId": b.get("bookingId", b["id"]),
        "store_name": b.get("store_name", ""), "store_id": b.get("store_id", ""),
        "date": b.get("date", ""), "time": b.get("time", ""), "timezone": b.get("timezone", "IST"),
        "session_fee": b.get("session_fee", 699),
        "status": b.get("status"), "payment_status": b.get("payment_status"),
        "selected_products": b.get("selected_products", []),
        "customer_email": b.get("customer_email", ""),
        "appointmentIST": b.get("appointmentIST", ""),
        "razorpay_payment_id": b.get("razorpay_payment_id", ""),
    }

# ── Auth ──────────────────────────────────────────────────────────────────────
@api.post("/auth/register", status_code=201)
@limiter.limit("3/minute")
def register(request: Request, body: RegisterIn):
    email = body.email.lower()
    if mem_first("users", email=email):
        raise HTTPException(409, "This email is already in use. Please log in or use Forgot Password.")
    _validate_password_strength(body.password)
    user = {
        "id": str(uuid.uuid4()), "name": body.name,
        "email": email, "password_hash": _hash_pw(body.password),
        "role": body.role if body.role in ("customer","seller") else "customer",
        "phone": "", "city": "", "created_at": _now(),
        "last_login_at": None,
    }
    mem_insert("users", user)
    # Welcome email on profile creation
    _send_welcome_email(user["email"], user["name"])
    token = _make_token(user["id"], user["role"])
    return {"token": token, "user": UserOut(**user)}

@api.post("/auth/login", response_model=TokenOut)
@limiter.limit("5/minute")
def login(request: Request, body: LoginIn):
    user = mem_first("users", email=body.email.lower())
    if not user or not _check_pw(body.password, user["password_hash"]):
        # Server-side failed attempt tracking + lockout
        if user:
            user["failed_login_count"] = (user.get("failed_login_count") or 0) + 1
            user["last_failed_login"] = _now()
            if user["failed_login_count"] >= 10:
                user["is_locked"] = True
                user["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        raise HTTPException(401, "Invalid email or password")
    # Check lockout
    if user.get("is_locked"):
        locked_until = user.get("locked_until")
        if locked_until:
            try:
                if datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
                    raise HTTPException(429, "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.")
            except (ValueError, TypeError):
                pass
        # Lockout expired — clear it
        user["is_locked"] = False
        user.pop("locked_until", None)
        user["failed_login_count"] = 0
    if user.get("role") == "seller" and (user.get("is_suspended") or user.get("is_archived")):
        raise HTTPException(403, "Your seller account is no longer active. Please contact ShopLiveBharat support.")
    if user.get("role") == "customer" and user.get("is_suspended"):
        raise HTTPException(403, "Your account has been suspended. Please contact ShopLiveBharat support.")
    # Successful login — reset failed attempts
    user["failed_login_count"] = 0
    user.pop("is_locked", None)
    user.pop("locked_until", None)
    # Transparently upgrade legacy password hashes to bcrypt on successful login
    _maybe_upgrade_hash(user, body.password)
    # Record last login for admin visibility
    user["last_login_at"] = _now()
    _persist_db()
    token = _make_token(user["id"], user["role"])
    return {"token": token, "user": UserOut(**{k:v for k,v in user.items() if k != "password_hash"})}

@api.post("/auth/google")
@limiter.limit("10/minute")
def google_login(request: Request, body: dict):
    """Sign in / sign up with a Google ID token (Google Identity Services).
    Verifies the token with Google, then finds-or-creates a customer account
    and returns our own signed JWT — no Google client secret is involved."""
    import urllib.request, urllib.parse, json as _j2
    id_token = body.get("credential") or body.get("id_token") or ""
    if not id_token:
        raise HTTPException(400, "Missing Google credential")
    # Verify the ID token directly with Google (validates signature + expiry)
    try:
        url = "https://oauth2.googleapis.com/tokeninfo?" + urllib.parse.urlencode({"id_token": id_token})
        with urllib.request.urlopen(url, timeout=15) as r:
            claims = _j2.loads(r.read().decode())
    except Exception:
        raise HTTPException(401, "Could not verify Google sign-in. Please try again.")
    # The token must have been issued for OUR app
    if GOOGLE_CLIENT_ID and claims.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(401, "This Google sign-in was not issued for ShopLiveBharat.")
    if str(claims.get("email_verified")).lower() != "true":
        raise HTTPException(401, "Your Google email is not verified.")
    email = (claims.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(401, "Your Google account has no email address.")
    name = claims.get("name") or email.split("@")[0]

    user = mem_first("users", email=email)
    if not user:
        user = {
            "id": str(uuid.uuid4()), "name": name, "email": email,
            "password_hash": "",  # Google-only account — no local password
            "role": "customer", "phone": "", "city": "",
            "auth_provider": "google", "avatar": claims.get("picture", ""),
            "created_at": _now(), "last_login_at": _now(),
        }
        mem_insert("users", user)
        _send_welcome_email(email, name)
    else:
        # Respect suspension/archival just like password login
        if user.get("role") == "seller" and (user.get("is_suspended") or user.get("is_archived")):
            raise HTTPException(403, "Your seller account is no longer active. Please contact ShopLiveBharat support.")
        if user.get("is_suspended") and user.get("role") != "admin":
            raise HTTPException(403, "Your account has been suspended. Please contact ShopLiveBharat support.")
        user["last_login_at"] = _now()
        if not user.get("auth_provider"):
            user["auth_provider"] = "google"
        if not user.get("avatar") and claims.get("picture"):
            user["avatar"] = claims.get("picture")
        _persist_db()
    token = _make_token(user["id"], user["role"])
    return {"token": token, "user": UserOut(**{k: v for k, v in user.items() if k != "password_hash"})}

@api.get("/auth/me", response_model=UserOut)
def me(payload: dict = Depends(get_current_user)):
    user = mem_first("users", id=payload["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    return UserOut(**{k:v for k,v in user.items() if k != "password_hash"})

@api.patch("/auth/profile", response_model=UserOut)
def update_profile(changes: dict, payload: dict = Depends(get_current_user)):
    safe = {k: v for k, v in changes.items() if k in ("name","phone","city")}
    user = mem_update("users", payload["sub"], safe)
    if not user:
        raise HTTPException(404, "User not found")
    return UserOut(**{k:v for k,v in user.items() if k != "password_hash"})

@api.post("/auth/change-password")
@limiter.limit("5/minute")
def change_password(request: Request, body: dict, payload: dict = Depends(get_current_user)):
    """Authenticated password change — requires the current password.
    Works for admin, seller and customer accounts."""
    current = body.get("current_password") or body.get("currentPassword") or ""
    new_password = body.get("new_password") or body.get("newPassword") or ""
    user = mem_first("users", id=payload["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    if not _check_pw(current, user.get("password_hash", "")):
        raise HTTPException(400, "Your current password is incorrect.")
    if _check_pw(new_password, user.get("password_hash", "")):
        raise HTTPException(400, "New password must be different from your current password.")
    _validate_password_strength(new_password)
    user["password_hash"] = _hash_pw(new_password)
    user["password_customized"] = True
    user["updated_at"] = _now()
    _persist_db()
    if user.get("email"):
        _send_email(to=user["email"], subject="Your ShopLiveBharat password was changed",
                    body=("<p>Your account password was just changed. If this was you, no action is needed.</p>"
                          "<p>If you did <strong>not</strong> make this change, please contact "
                          "<a href='mailto:support@shoplivebharat.com'>support@shoplivebharat.com</a> immediately.</p>"),
                    kind="password_changed")
    return {"success": True, "message": "Password updated successfully."}

@api.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, body: dict):
    email = (body.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(400, "Email is required")
    user = mem_first("users", email=email)
    # Always return the same response so we never reveal whether an email exists.
    generic = {"success": True, "message": "If an account exists for this email, a reset link has been sent."}
    if not user:
        return generic
    # Secure single-use token with a 1-hour expiry
    reset_token = uuid.uuid4().hex + uuid.uuid4().hex
    user["reset_token"] = reset_token
    user["reset_token_exp"] = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    _persist_db()
    reset_link = f"{PUBLIC_BASE_URL}/reset-password?token={reset_token}"
    _send_email(
        to=email, subject="Reset your ShopLiveBharat password",
        body=(
            f"<p>Hi {user.get('name','there')},</p>"
            "<p>We received a request to reset your ShopLiveBharat password. "
            "Click the button below to choose a new one. This link expires in 1 hour.</p>"
            f"<p style='margin:24px 0;'><a href='{reset_link}' style='background:#C9A84C;color:#1a1a1a;"
            "text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;display:inline-block;'>"
            "Reset Password</a></p>"
            f"<p style='font-size:12px;color:#9B8B7A;'>Or paste this link into your browser:<br>{reset_link}</p>"
            "<p>If you didn't request this, you can safely ignore this email.</p>"
        ),
        kind="password_reset",
    )
    return generic

@api.post("/auth/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, body: dict):
    token = body.get("token", "")
    new_password = body.get("password", "") or body.get("new_password", "")
    if not token:
        raise HTTPException(400, "Reset token is required")
    _validate_password_strength(new_password)
    user = next((u for u in mem["users"] if u.get("reset_token") == token), None)
    if not user:
        raise HTTPException(400, "Invalid or expired reset link. Please request a new one.")
    exp = user.get("reset_token_exp")
    try:
        if exp and datetime.fromisoformat(exp) < datetime.now(timezone.utc):
            user.pop("reset_token", None); user.pop("reset_token_exp", None)
            raise HTTPException(400, "This reset link has expired. Please request a new one.")
    except HTTPException:
        raise
    except Exception:
        pass
    user["password_hash"] = _hash_pw(new_password)
    user["password_customized"] = True
    user["updated_at"] = _now()
    user.pop("reset_token", None)
    user.pop("reset_token_exp", None)
    _persist_db()
    if user.get("email"):
        _send_email(to=user["email"], subject="Your ShopLiveBharat password was reset",
                    body="<p>Your password was successfully reset. You can now log in with your new password.</p>",
                    kind="password_reset_done")
    return {"success": True, "message": "Password reset successfully. You can now log in."}

# ── Shops ─────────────────────────────────────────────────────────────────────
@api.get("/shops")
def list_shops(active_only: bool = True, q: Optional[str] = None, limit: int = Query(200, le=1000)):
    shops = mem["shops"]
    if active_only:
        # Public visibility: approved + complete profile + 3 products + online
        shops = [s for s in shops if _shop_is_public(s)]
    if q:
        ql = q.lower().strip()
        shops = [s for s in shops if ql in " ".join(str(s.get(k, "")).lower() for k in
                 ("name", "owner_name", "specialty", "city", "description", "slug"))]
    # When active_only=false, return ALL shops (admin view)
    return shops[:limit]

@api.post("/admin/shops", status_code=201, dependencies=[Depends(require_admin)])
def create_shop(body: ShopIn):
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "slug": _slugify(body.name),
                "rating": 4.8, "followers": 0, "productCount": 0, "verified": False,
                "created_at": _now(), "updated_at": _now()})
    mem_insert("shops", doc)
    return ShopOut(**doc)

@api.patch("/admin/shops/{shop_id}", dependencies=[Depends(require_admin)])
def update_shop(shop_id: str, changes: dict):
    changes["updated_at"] = _now()
    # Keep is_active / online / status coherent
    if "online" in changes:
        if changes["online"] is True:
            changes.setdefault("is_active", True)
            changes.setdefault("status", "active")
        else:
            changes.setdefault("status", "offline")
    if "is_active" in changes:
        if changes["is_active"] is False:
            changes.setdefault("online", False)
    if changes.get("status") == "suspended":
        changes["online"] = False
        changes["is_active"] = False
        changes["isSuspended"] = True
    # Admin can explicitly approve a shop for public listing (bypasses profile gate)
    if changes.get("admin_approved_public") is True:
        changes.setdefault("online", True)
        changes.setdefault("is_active", True)
        changes.setdefault("status", "active")
    doc = mem_update("shops", shop_id, changes)
    if not doc:
        raise HTTPException(404, "Shop not found")
    return doc

@api.delete("/admin/shops/{shop_id}", dependencies=[Depends(require_admin)])
def archive_shop(shop_id: str):
    doc = mem_update("shops", shop_id, {"is_active": False, "updated_at": _now()})
    if not doc:
        raise HTTPException(404, "Shop not found")
    return {"success": True}

# ══════════════════════════════════════════════════════════════════════════════
# SHIPPING — weight-based, destination-aware. Backend is the source of truth;
# the frontend only displays the quoted amount. Admin-editable config.
# ══════════════════════════════════════════════════════════════════════════════
_DEFAULT_SHIPPING_CONFIG = {
    "currency": "INR",
    "free_over_inr": 15000,   # domestic (India) free-shipping threshold
    "domestic_flat": 499,     # India flat rate below the threshold
    # Weight tiers (grams ceiling) → price per destination (INR).
    "tiers": [
        {"max_grams": 500,  "USA": 1999, "Canada": 2199, "UK": 1799},
        {"max_grams": 750,  "USA": 2499, "Canada": 2699, "UK": 2199},
        {"max_grams": 1000, "USA": 2799, "Canada": 2999, "UK": 2499},
        {"max_grams": 2000, "USA": 3999, "Canada": 4299, "UK": 3499},
        {"max_grams": 3000, "USA": 5499, "Canada": 5799, "UK": 4499},
    ],
    # For weight beyond the top tier, add per additional kg.
    "overflow_per_kg": {"USA": 1500, "Canada": 1500, "UK": 1000},
}

def _shipping_config() -> dict:
    return mem.get("_shipping_config") or _DEFAULT_SHIPPING_CONFIG

# Default weights (grams) by category keyword — used when a product has none set.
def _default_weight(category: str) -> int:
    c = (category or "").lower()
    table = [
        (("dupatta", "shawl", "scarf"), 400),
        (("saree",), 900),
        (("lehenga", "chaniya", "choli", "sherwani", "bridal", "wedding"), 2000),
        (("gown", "anarkali", "dress", "jumpsuit", "romper", "coat"), 800),
        (("jacket", "blazer", "hoodie", "sweatshirt"), 800),
        (("jeans", "trouser", "cargo", "jogger", "leggings"), 700),
        (("kurta", "kurti", "shirt", "t-shirt", "tshirt", "polo", "top", "blouse", "tank", "crop", "salwar", "suit"), 400),
        (("footwear", "sneaker", "boot", "sandal", "heel", "flat"), 900),
        (("bag", "backpack", "handbag"), 700),
        (("jewellery", "jewelry", "accessor", "wallet", "belt", "cap", "sock", "innerwear", "nightwear"), 150),
    ]
    for keys, grams in table:
        if any(k in c for k in keys):
            return grams
    return 500

def _product_weight(product: dict) -> int:
    w = int(product.get("weight_grams") or 0)
    return w if w > 0 else _default_weight(product.get("category", ""))

def _normalize_country(country: str) -> str:
    c = (country or "").strip().lower()
    if c in ("usa", "us", "united states", "united states of america", "america"):
        return "USA"
    if c in ("canada", "ca"):
        return "Canada"
    if c in ("uk", "gb", "united kingdom", "england", "britain", "great britain"):
        return "UK"
    if c in ("india", "in", "bharat", ""):
        return "India"
    return "OTHER"

def _quote_shipping(items: list, country: str, subtotal_inr: int = 0) -> dict:
    cfg = _shipping_config()
    total_grams = 0
    for it in items or []:
        prod = mem_first("products", id=(it.get("product_id") or it.get("id")))
        if not prod:
            continue
        qty = int(it.get("quantity") or 1)
        total_grams += _product_weight(prod) * max(1, qty)
    dest = _normalize_country(country)
    amount = 0
    if dest in ("India",):
        if subtotal_inr and subtotal_inr >= cfg.get("free_over_inr", 15000):
            amount = 0
        else:
            amount = cfg.get("domestic_flat", 499)
    else:
        key = dest if dest in ("USA", "Canada", "UK") else "USA"  # OTHER → USA rate
        tiers = sorted(cfg.get("tiers", []), key=lambda t: t["max_grams"])
        chosen = None
        for t in tiers:
            if total_grams <= t["max_grams"]:
                chosen = t
                break
        if chosen:
            amount = int(chosen.get(key, 0))
        elif tiers:
            top = tiers[-1]
            amount = int(top.get(key, 0))
            extra_kg = max(0, (total_grams - top["max_grams"] + 999) // 1000)
            amount += extra_kg * int(cfg.get("overflow_per_kg", {}).get(key, 1500))
    return {"amount": int(amount), "currency": cfg.get("currency", "INR"),
            "weight_grams": total_grams, "country": dest,
            "free": amount == 0}

@api.post("/shipping/quote")
def shipping_quote(body: dict):
    """Public: quote shipping for a cart. Body: { items:[{product_id,quantity}],
    country, subtotal }. Backend is authoritative; the frontend only displays this."""
    items = body.get("items") or []
    country = body.get("country") or "India"
    subtotal = int(body.get("subtotal") or 0)
    return _quote_shipping(items, country, subtotal)

@api.get("/admin/shipping-config", dependencies=[Depends(require_admin)])
def admin_get_shipping_config():
    return _shipping_config()

@api.put("/admin/shipping-config", dependencies=[Depends(require_admin)])
def admin_update_shipping_config(body: dict):
    """Admin: replace the shipping config (tiers + rates). Validates structure."""
    cfg = dict(_DEFAULT_SHIPPING_CONFIG)
    cfg.update({k: v for k, v in body.items() if k in _DEFAULT_SHIPPING_CONFIG})
    if not isinstance(cfg.get("tiers"), list) or not cfg["tiers"]:
        raise HTTPException(400, "tiers must be a non-empty list")
    mem["_shipping_config"] = cfg
    _persist_db()
    return {"success": True, "config": cfg}

# ── Products ──────────────────────────────────────────────────────────────────
@api.get("/products")
def list_products(shop_id: Optional[str]=None, category: Optional[str]=None,
                  featured: Optional[bool]=None, active_only: bool=True,
                  q: Optional[str]=None, limit: int=Query(200, le=2000)):
    prods = mem["products"]
    if active_only:
        prods = [p for p in prods if p.get("is_active", True)
                 and p.get("status", "live") not in ("hidden", "removed", "draft")]
        # Only show products whose parent shop is publicly visible
        # (approved + active + online + not suspended). This makes going a
        # store offline immediately hide all of its products from the collection.
        public_ids = {s["id"] for s in mem["shops"] if _shop_is_public(s)}
        prods = [p for p in prods if p.get("shop_id") in public_ids]
    if shop_id:     prods = [p for p in prods if p.get("shop_id") == shop_id]
    if category:    prods = [p for p in prods if p.get("category","").lower() == category.lower()]
    if featured is not None: prods = [p for p in prods if bool(p.get("is_featured")) == featured]
    if q:
        ql = q.lower().strip()
        prods = [p for p in prods if ql in " ".join(str(p.get(k, "")).lower() for k in
                 ("name", "category", "description", "shop_name", "color", "badge"))]
    return prods[:limit]

@api.post("/admin/products", status_code=201, dependencies=[Depends(require_admin)])
def create_product(body: ProductIn):
    # Admin products default to ShopLiveBharat exclusive store
    shop_id = body.shop_id if body.shop_id else "shop-shoplivebharat"
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(400, "Shop not found")
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "slug": _slugify(body.name),
                "shop_id": shop_id,
                "shop_name": shop["name"],
                "source": "exclusive" if shop.get("is_admin_store") else "partner",
                "status": "live", "created_at": _now(), "updated_at": _now()})
    mem_insert("products", doc)
    shop["productCount"] = shop.get("productCount", 0) + 1
    return doc

@api.patch("/admin/products/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
def update_product(product_id: str, changes: dict):
    changes["updated_at"] = _now()
    # Keep is_active and status coherent
    if "status" in changes:
        s = changes["status"]
        if s in ("hidden", "removed", "draft"):
            changes["is_active"] = False
        elif s == "live":
            changes["is_active"] = True
        if s == "out_of_stock":
            changes["stock"] = 0
    if "is_active" in changes and "status" not in changes:
        changes["status"] = "live" if changes["is_active"] else "hidden"
    doc = mem_update("products", product_id, changes)
    if not doc:
        raise HTTPException(404, "Product not found")
    return ProductOut(**doc)

@api.delete("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
def archive_product(product_id: str):
    doc = mem_update("products", product_id, {"is_active": False, "updated_at": _now()})
    if not doc:
        raise HTTPException(404, "Product not found")
    return {"success": True}

# ── Cart ──────────────────────────────────────────────────────────────────────
@api.get("/cart", response_model=CartOut)
def get_cart(payload: dict = Depends(get_current_user)):
    cart = mem_first("carts", user_id=payload["sub"])
    if not cart:
        return CartOut()
    items = []
    total = 0
    for item in cart.get("items", []):
        prod = mem_first("products", id=item["product_id"])
        if not prod:
            # Product deleted — mark unavailable
            ci = CartItemOut(id=item["id"], product_id=item["product_id"],
                             product_name=item.get("product_name", "Unknown Product"),
                             image_url="", price=0, quantity=item["quantity"],
                             availability="unavailable")
            items.append(ci)
            continue
        # Determine availability
        avail = "available"
        status = prod.get("status", "live")
        shop = mem_first("shops", id=prod.get("shop_id"))
        if status in ("hidden", "removed", "draft"):
            avail = "unavailable"
        elif status == "out_of_stock" or prod.get("stock", 1) <= 0:
            avail = "out_of_stock"
        elif shop and not _shop_is_public(shop):
            avail = "unavailable"
        ci = CartItemOut(id=item["id"], product_id=item["product_id"],
                         product_name=prod["name"], image_url=prod.get("image_url", ""),
                         price=prod["price"], quantity=item["quantity"],
                         size=item.get("size",""), color=item.get("color",""),
                         availability=avail)
        items.append(ci)
        if avail == "available":
            total += prod["price"] * item["quantity"]
    return CartOut(items=items, total=total)

@api.post("/cart", response_model=CartOut, status_code=201)
def add_to_cart(body: CartItemIn, payload: dict = Depends(get_current_user)):
    prod = mem_first("products", id=body.product_id)
    if not prod:
        raise HTTPException(404, "Product not found")
    cart = mem_first("carts", user_id=payload["sub"])
    if not cart:
        cart = {"id": str(uuid.uuid4()), "user_id": payload["sub"], "items": []}
        mem_insert("carts", cart)
    # Update qty if same product+size+color exists
    for item in cart["items"]:
        if item["product_id"] == body.product_id and item.get("size") == body.size:
            item["quantity"] += body.quantity
            break
    else:
        cart["items"].append({"id": str(uuid.uuid4()), "product_id": body.product_id,
                               "quantity": body.quantity, "size": body.size, "color": body.color})
    return get_cart(payload)

@api.delete("/cart/{item_id}")
def remove_from_cart(item_id: str, payload: dict = Depends(get_current_user)):
    cart = mem_first("carts", user_id=payload["sub"])
    if cart:
        cart["items"] = [i for i in cart["items"] if i["id"] != item_id]
    return {"success": True}

@api.post("/cart/{item_id}/move-to-wishlist")
def move_cart_to_wishlist(item_id: str, payload: dict = Depends(get_current_user)):
    """Remove item from cart and add it to wishlist."""
    cart = mem_first("carts", user_id=payload["sub"])
    product_id = None
    if cart:
        item = next((i for i in cart["items"] if i["id"] == item_id), None)
        if item:
            product_id = item["product_id"]
            cart["items"] = [i for i in cart["items"] if i["id"] != item_id]
    if product_id:
        wl = mem_first("wishlists", user_id=payload["sub"])
        if not wl:
            wl = {"id": str(uuid.uuid4()), "user_id": payload["sub"], "product_ids": []}
            mem_insert("wishlists", wl)
        if product_id not in wl["product_ids"]:
            wl["product_ids"].append(product_id)
    return {"success": True, "moved_product_id": product_id}

@api.delete("/cart")
def clear_cart(payload: dict = Depends(get_current_user)):
    cart = mem_first("carts", user_id=payload["sub"])
    if cart:
        cart["items"] = []
    return {"success": True}

# ── Wishlist ──────────────────────────────────────────────────────────────────
@api.get("/wishlist")
def get_wishlist(payload: dict = Depends(get_current_user)):
    wl = mem_first("wishlists", user_id=payload["sub"])
    if not wl:
        return {"items": []}
    items = []
    for pid in wl.get("product_ids", []):
        prod = mem_first("products", id=pid)
        if prod:
            items.append(prod)
    return {"items": items}

@api.post("/wishlist", status_code=201)
def add_to_wishlist(body: WishlistItemIn, payload: dict = Depends(get_current_user)):
    wl = mem_first("wishlists", user_id=payload["sub"])
    if not wl:
        wl = {"id": str(uuid.uuid4()), "user_id": payload["sub"], "product_ids": []}
        mem_insert("wishlists", wl)
    if body.product_id not in wl["product_ids"]:
        wl["product_ids"].append(body.product_id)
    return {"success": True}

@api.delete("/wishlist/{product_id}")
def remove_from_wishlist(product_id: str, payload: dict = Depends(get_current_user)):
    wl = mem_first("wishlists", user_id=payload["sub"])
    if wl:
        wl["product_ids"] = [p for p in wl["product_ids"] if p != product_id]
    return {"success": True}

# ── Orders ────────────────────────────────────────────────────────────────────
@api.get("/orders")
def list_orders(payload: dict = Depends(get_current_user)):
    user_orders = mem_get("orders", user_id=payload["sub"])
    return {"orders": user_orders}

@api.post("/orders", response_model=OrderOut, status_code=201)
def create_order(body: OrderIn, payload: dict = Depends(get_current_user)):
    total = 0
    items_out = []
    for item in body.items:
        prod = mem_first("products", id=item.product_id)
        if not prod:
            raise HTTPException(404, f"Product {item.product_id} not found")
        # Block checkout for unavailable/out-of-stock products
        status = prod.get("status", "live")
        if status in ("hidden", "removed", "draft"):
            raise HTTPException(400, f"Product '{prod['name']}' is unavailable and cannot be purchased")
        if status == "out_of_stock" or prod.get("stock", 1) <= 0:
            raise HTTPException(400, f"Product '{prod['name']}' is out of stock")
        shop = mem_first("shops", id=prod.get("shop_id"))
        if shop and not _shop_is_public(shop):
            raise HTTPException(400, f"Product '{prod['name']}' is currently unavailable (store offline)")
        line_total = prod["price"] * item.quantity
        total += line_total
        items_out.append({
            "product_id": item.product_id, "product_name": prod["name"],
            "image_url": prod["image_url"], "price": prod["price"],
            "quantity": item.quantity, "size": item.size, "color": item.color,
            "custom_measurements": item.custom_measurements or {},
            "line_total": line_total,
        })
    order = {
        "id": f"ORD-{uuid.uuid4().hex[:8].upper()}",
        "user_id": payload["sub"], "items": items_out,
        "total": total, "status": "confirmed", "payment_status": "paid",
        "shipping_address": body.shipping_address,
        "payment_method": body.payment_method,
        "currency": body.currency,
        "razorpay_payment_id": body.razorpay_payment_id,
        "razorpay_order_id": body.razorpay_order_id,
        "created_at": _now(), "updated_at": _now(),
    }
    mem_insert("orders", order)
    # ── Decrement stock for each item ordered ──────────────────────────────
    for item in body.items:
        prod = mem_first("products", id=item.product_id)
        if prod:
            new_stock = max(0, prod.get("stock", 0) - item.quantity)
            prod["stock"] = new_stock
            if new_stock == 0:
                prod["status"] = "out_of_stock"
            prod["updated_at"] = _now()
    # Clear cart after order
    cart = mem_first("carts", user_id=payload["sub"])
    if cart:
        cart["items"] = []
    # Order confirmation email
    buyer = mem_first("users", id=payload["sub"])
    if buyer and buyer.get("email"):
        _send_email(to=buyer["email"], subject=f"Order confirmed — {order['id']}",
                    body=f"Thank you for your order {order['id']}. Total: ₹{total:,}. "
                         f"We'll email you when your items ship.",
                    kind="order_placed")
    return OrderOut(**order)

@api.patch("/admin/orders/{order_id}", dependencies=[Depends(require_admin)])
def update_order_status(order_id: str, changes: dict):
    order = None
    for o in mem["orders"]:
        if o["id"] == order_id:
            order = o
            break
    if not order:
        raise HTTPException(404, "Order not found")
    allowed = {"status","payment_status","tracking_number"}
    prev_status = order.get("status")
    order.update({k: v for k, v in changes.items() if k in allowed})
    order["updated_at"] = _now()
    _persist_db()
    # Email customer on meaningful status change
    if "status" in changes and changes["status"] != prev_status:
        buyer = mem_first("users", id=order.get("user_id"))
        to_email = (buyer or {}).get("email") or (order.get("shipping_address") or {}).get("email")
        if to_email:
            track = order.get("tracking_number")
            _send_email(
                to=to_email, subject=f"Order {order_id} is now {order['status'].title()}",
                body=(
                    f"<p>Hi, an update on your order <strong>{order_id}</strong>:</p>"
                    f"<p>Status: <strong style='text-transform:capitalize;'>{order['status']}</strong></p>"
                    + (f"<p>Tracking number: <code>{track}</code></p>" if track else "")
                    + "<p>Thank you for shopping with ShopLiveBharat!</p>"
                ),
                kind="order_status",
            )
    return order

# ── Bookings ──────────────────────────────────────────────────────────────────
@api.get("/bookings")
def list_bookings(payload: dict = Depends(get_current_user)):
    role = payload.get("role", "customer")
    if role in ("admin",):
        return {"bookings": mem["bookings"]}
    if role == "seller":
        user = mem_first("users", id=payload["sub"])
        store_id = user.get("store_id") if user else None
        filtered = [b for b in mem["bookings"] if b.get("store_id") == store_id]
        return {"bookings": filtered}
    user_bookings = mem_get("bookings", user_id=payload["sub"])
    return {"bookings": user_bookings}

@api.post("/bookings", status_code=201)
def create_booking(body: BookingIn, payload: dict = Depends(get_current_user)):
    booking = {
        "id": f"BK-{uuid.uuid4().hex[:6].upper()}",
        "bookingId": f"BK-{uuid.uuid4().hex[:6].upper()}",
        "user_id": payload["sub"], "store_id": body.store_id,
        "store_name": body.store_name, "selected_products": body.selected_products,
        "date": body.date, "time": body.time, "timezone": body.timezone,
        "session_fee": body.session_fee, "status": "pending",
        "payment_status": "paid", "google_meet_link": None,
        "created_at": _now(), "updated_at": _now(),
        "appointmentIST": f"{body.date}T{body.time}:00.000+05:30",
    }
    mem_insert("bookings", booking)
    return booking

# ── Seller endpoints ──────────────────────────────────────────────────────────
@api.get("/seller/me")
def seller_me(payload: dict = Depends(require_seller)):
    user = mem_first("users", id=payload["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    shop = mem_first("shops", id=user.get("store_id")) if user.get("store_id") else None
    return {"user": UserOut(**{k:v for k,v in user.items() if k != "password_hash"}),
            "shop": shop}

@api.get("/seller/products")
def seller_products(payload: dict = Depends(require_seller)):
    user = mem_first("users", id=payload["sub"])
    if not user or not user.get("store_id"):
        return {"products": []}
    return {"products": mem_get("products", shop_id=user["store_id"])}

@api.get("/seller/orders")
def seller_orders(payload: dict = Depends(require_seller)):
    user = mem_first("users", id=payload["sub"])
    if not user or not user.get("store_id"):
        return {"orders": []}
    store_id = user["store_id"]
    shop = mem_first("shops", id=store_id)
    if not shop:
        return {"orders": []}
    shop_product_ids = {p["id"] for p in mem_get("products", shop_id=store_id)}
    orders = []
    for o in mem["orders"]:
        has_my_product = any(i["product_id"] in shop_product_ids for i in o.get("items", []))
        if has_my_product:
            orders.append(_enrich_order(o))
    return {"orders": orders}

@api.get("/seller/bookings")
def seller_bookings(payload: dict = Depends(require_seller)):
    return list_bookings(payload)

# ── Admin stats ───────────────────────────────────────────────────────────────
@api.get("/admin/stats", dependencies=[Depends(require_admin)])
def admin_stats():
    return {
        "users":    len(mem["users"]),
        "shops":    len([s for s in mem["shops"] if s.get("is_active",True)]),
        "products": len([p for p in mem["products"] if p.get("is_active",True)]),
        "orders":   len(mem["orders"]),
        "revenue":  sum(o.get("total",0) for o in mem["orders"]),
        "bookings": len(mem["bookings"]),
    }

@api.get("/admin/users", dependencies=[Depends(require_admin)])
def admin_users():
    return [UserOut(**{k:v for k,v in u.items() if k != "password_hash"}) for u in mem["users"]]

@api.patch("/admin/users/{user_id}/password", dependencies=[Depends(require_admin)])
def admin_reset_user_password(user_id: str, body: dict):
    """Admin: reset any user's password by user ID or email."""
    new_password = body.get("password", "").strip()
    if not new_password or len(new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    # Allow lookup by id or email
    user = mem_first("users", id=user_id) or mem_first("users", email=user_id.lower())
    if not user:
        raise HTTPException(404, "User not found")
    user["password_hash"] = _hash_pw(new_password)
    user["updated_at"] = _now()
    _persist_db()
    return {"success": True, "message": f"Password updated for {user.get('email')}"}

@api.get("/admin/orders", dependencies=[Depends(require_admin)])
def admin_orders():
    return {"orders": [_enrich_order(o) for o in mem["orders"]]}

@api.get("/admin/bookings", dependencies=[Depends(require_admin)])
def admin_bookings():
    return {"bookings": mem["bookings"]}

@api.get("/marketplace/stats")
def marketplace_stats():
    return {"shops": len(mem["shops"]), "products": len(mem["products"]),
            "featured_products": len([p for p in mem["products"] if p.get("is_featured")]),
            "waitlist_members": 10000}

@api.get("/waitlist/stats")
def waitlist_stats():
    return {"total_members": 10000 + len(mem["waitlist"]),
            "stores_joining": 250, "premium_collections": 50}

@api.post("/waitlist", status_code=201)
def join_waitlist(body: dict):
    entry = {**body, "id": str(uuid.uuid4()), "created_at": _now()}
    mem_insert("waitlist", entry)
    return {"success": True, "message": "You're officially on the waitlist"}

# ── Seller Applications ───────────────────────────────────────────────────────
if "seller_applications" not in mem:
    mem["seller_applications"] = []

@api.post("/seller-applications", status_code=201)
def submit_seller_application(body: dict):
    apps = mem["seller_applications"]
    email = body.get("applicant_email", "").lower()
    if any(a["applicant_email"] == email and a["status"] != "rejected" for a in apps):
        raise HTTPException(409, "A registration with this email already exists.")
    app = {
        **body,
        "id": "app-" + str(uuid.uuid4())[:8],
        "applicant_email": email,
        "status": "pending_review",
        "submitted_at": _now(),
        "updated_at": _now(),
        "admin_notes": [],
        "history": [{"from_status": None, "to_status": "pending_review",
                     "actor_type": "applicant", "created_at": _now()}],
    }
    mem["seller_applications"].append(app)
    _persist_db()
    return app

@api.get("/seller-applications/{app_id}")
def get_seller_application(app_id: str):
    app = next((a for a in mem["seller_applications"] if a["id"] == app_id), None)
    if not app:
        raise HTTPException(404, "Application not found")
    return app

@api.patch("/seller-applications/{app_id}")
def update_seller_application(app_id: str, body: dict, payload: dict = Depends(get_current_user)):
    app = next((a for a in mem["seller_applications"] if a["id"] == app_id), None)
    if not app:
        raise HTTPException(404, "Application not found")
    app.update({**body, "status": "pending_review", "updated_at": _now()})
    return app

@api.get("/admin/seller-applications", dependencies=[Depends(require_admin)])
def admin_list_applications(status: Optional[str] = None):
    apps = mem["seller_applications"]
    if status and status != "all":
        apps = [a for a in apps if a.get("status") == status]
    else:
        # Hide orphaned applications whose store was deleted
        apps = [a for a in apps if a.get("status") != "deleted"]
    return sorted(apps, key=lambda a: a.get("submitted_at", ""), reverse=True)

@api.post("/admin/seller-applications/{app_id}/approve", dependencies=[Depends(require_admin)])
def approve_application(app_id: str):
    app = next((a for a in mem["seller_applications"] if a["id"] == app_id), None)
    if not app:
        raise HTTPException(404, "Application not found")
    app["status"] = "approved"
    app["updated_at"] = _now()

    email = app.get("applicant_email", "")
    store_info = app.get("store_information", {}) or {}
    store_name = store_info.get("store_name") or app.get("applicant_name", "Store")

    # 1) Create/link the shop (idempotent by application_id)
    shop = next((s for s in mem["shops"] if s.get("application_id") == app_id), None)
    if not shop:
        shop_id = "shop-" + app_id.replace("app-", "")
        base_slug = _slugify(store_name)
        slug = base_slug if not any(s.get("slug") == base_slug for s in mem["shops"]) else f"{base_slug}-{app_id[-4:]}"
        shop = {
            "id": shop_id, "slug": slug, "name": store_name,
            "owner_name": app.get("applicant_name", ""), "owner_email": email,
            "city": store_info.get("city", ""), "country": "India",
            "specialty": store_info.get("specialty", "") or app.get("product_categories", {}).get("primary_category", ""),
            "description": store_info.get("description", ""),
            # No pre-filled placeholder images — seller must upload their own
            "image_url": store_info.get("image_url", ""),
            "banner_image": store_info.get("banner_image", ""),
            "instagram_url": "", "is_active": True, "status": "active",
            # ALL public/live features default OFF — seller must complete profile first
            "online": False, "liveShoppingEnabled": False,
            "acceptsLiveBookings": False,
            "admin_live_disabled": False,
            # AI Studio is a premium feature — admin grants access per store.
            "ai_studio_enabled": False,
            "verified": False, "rating": 0, "followers": 0, "productCount": 0,
            "return_policy": "", "shipping_policy": "",
            "display_order": 9999,   # for admin-controlled store ordering
            "show_in_booking_page": False,
            "application_id": app_id, "created_at": _now(), "updated_at": _now(),
        }
        mem_insert("shops", shop)

    # 2) Provision seller account (idempotent by email), generate temp password
    temp_password = "slb-" + uuid.uuid4().hex[:6]
    user = mem_first("users", email=email)
    if not user:
        user = {
            "id": str(uuid.uuid4()), "name": app.get("applicant_name", ""),
            "email": email, "password_hash": _hash_pw(temp_password),
            "role": "seller", "phone": app.get("business_details", {}).get("phone", ""),
            "city": store_info.get("city", ""),
            "store_name": store_name, "store_id": shop["id"], "created_at": _now(),
        }
        mem_insert("users", user)
    else:
        # Ensure linkage
        user["role"] = "seller"; user["store_id"] = shop["id"]; user["store_name"] = store_name
        user["password_hash"] = _hash_pw(temp_password)

    # 3) Email the seller their login credentials
    email_result = _send_email(
        to=email,
        subject="Your ShopLiveBharat Seller Account is Approved 🎉",
        body=(f"Welcome {app.get('applicant_name','')}! Your store '{store_name}' is approved.<br>"
              f"Login at /seller/login<br>Email: {email}<br>Temporary password: {temp_password}<br>"
              f"Please complete your store profile and add at least 3 products to go live."),
        kind="seller_approval",
    )

    # 4) Expose credentials on the application for the admin panel
    app["seller_credentials"] = {
        "email": email, "temp_password": temp_password,
        "login_url": "/seller/login", "credential_status": "created",
        "email_status": email_result["status"],
    }
    app["store_id"] = shop["id"]
    _persist_db()
    return app

@api.post("/admin/seller-applications/{app_id}/reject", dependencies=[Depends(require_admin)])
def reject_application(app_id: str, body: dict = {}):
    app = next((a for a in mem["seller_applications"] if a["id"] == app_id), None)
    if not app:
        raise HTTPException(404, "Application not found")
    app.update({"status": "rejected", "rejection_reason": body.get("reason",""), "updated_at": _now()})
    return app

@api.post("/admin/seller-applications/{app_id}/suspend", dependencies=[Depends(require_admin)])
def suspend_application(app_id: str, body: dict = {}):
    app = next((a for a in mem["seller_applications"] if a["id"] == app_id), None)
    if not app:
        raise HTTPException(404, "Application not found")
    app.update({"status": "suspended", "suspension_reason": body.get("reason",""), "updated_at": _now()})
    return app

@api.post("/admin/seller-applications/{app_id}/request-changes", dependencies=[Depends(require_admin)])
def request_changes(app_id: str, body: dict = {}):
    app = next((a for a in mem["seller_applications"] if a["id"] == app_id), None)
    if not app:
        raise HTTPException(404, "Application not found")
    app.update({"status": "needs_changes", "changes_requested": body.get("changes_requested",""), "updated_at": _now()})
    return app

# ══════════════════════════════════════════════════════════════════════════════
# SELLER SHOP SETTINGS, PRODUCTS, SLOTS, BOOKINGS — server-backed
# ══════════════════════════════════════════════════════════════════════════════

def _seller_ctx(payload: dict):
    """Return (user, store_id) for the current seller, 404 if missing."""
    user = mem_first("users", id=payload["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    return user, user.get("store_id")

def _slot_is_future(slot: dict) -> bool:
    try:
        end = slot.get("end_time") or slot.get("start_time") or "23:59"
        dt = datetime.fromisoformat(f"{slot['date']}T{end}:00+00:00")
        return dt >= datetime.now(timezone.utc)
    except Exception:
        return True

def _shop_has_available_slot(shop_id: str) -> bool:
    return any(s.get("shop_id") == shop_id and s.get("status") == "available" and _slot_is_future(s)
               for s in mem["slots"])

# ── Public visibility: profile completion + product gating ────────────────────
# Required seller profile fields for public listing.
_REQUIRED_SHOP_FIELDS = ("name", "description", "image_url", "city", "specialty")
_MIN_PUBLIC_PRODUCTS = 3

def _product_is_valid(p: dict) -> bool:
    """A product counts toward public listing only if it has real details."""
    if p.get("status") not in ("live", "out_of_stock"):
        return False
    if not p.get("name"):
        return False
    if not p.get("image_url"):
        return False
    if not p.get("description"):
        return False
    if not p.get("category"):
        return False
    if not (isinstance(p.get("price"), (int, float)) and p["price"] > 0):
        return False
    return True

def _shop_valid_product_count(shop_id: str) -> int:
    return sum(1 for p in mem["products"] if p.get("shop_id") == shop_id and _product_is_valid(p))

def _shop_profile_complete(s: dict) -> bool:
    """Admin store is always complete. Otherwise all required fields + banner + seller phone."""
    if s.get("is_admin_store"):
        return True
    for f in _REQUIRED_SHOP_FIELDS:
        if not str(s.get(f, "")).strip():
            return False
    if len(str(s.get("description", ""))) < 10:
        return False
    if not str(s.get("banner_image", "")).strip():
        return False
    # return/refund + shipping policy required
    if not str(s.get("return_policy", "")).strip():
        return False
    if not str(s.get("shipping_policy", s.get("shipping_details", ""))).strip():
        return False
    # linked seller must have a phone
    seller = next((u for u in mem["users"] if u.get("store_id") == s.get("id") and u.get("role") == "seller"), None)
    phone = (seller or {}).get("phone") or s.get("phone")
    if not str(phone or "").strip():
        return False
    return True

def _shop_can_go_public(s: dict) -> bool:
    """True only if the shop may enable public/live features:
    complete profile AND at least the minimum valid products."""
    if s.get("is_admin_store"):
        return True
    return _shop_profile_complete(s) and _shop_valid_product_count(s.get("id")) >= _MIN_PUBLIC_PRODUCTS

def _shop_completion_report(s: dict) -> dict:
    """Detailed completeness report used by the seller dashboard/onboarding UI."""
    missing = []
    if not s.get("is_admin_store"):
        for f in _REQUIRED_SHOP_FIELDS:
            if not str(s.get(f, "")).strip():
                missing.append(f)
        if len(str(s.get("description", ""))) < 10:
            if "description" not in missing:
                missing.append("description")
        if not str(s.get("banner_image", "")).strip():
            missing.append("banner_image")
        if not str(s.get("return_policy", "")).strip():
            missing.append("return_policy")
        if not str(s.get("shipping_policy", s.get("shipping_details", ""))).strip():
            missing.append("shipping_policy")
        seller = next((u for u in mem["users"] if u.get("store_id") == s.get("id") and u.get("role") == "seller"), None)
        if not str((seller or {}).get("phone") or s.get("phone") or "").strip():
            missing.append("phone")
    valid_products = _shop_valid_product_count(s.get("id"))
    return {
        "profile_complete": len(missing) == 0,
        "missing_fields": missing,
        "valid_products": valid_products,
        "products_needed": max(0, _MIN_PUBLIC_PRODUCTS - valid_products),
        "meets_product_minimum": valid_products >= _MIN_PUBLIC_PRODUCTS,
    }

# ── Public: shops with full visibility rules ──────────────────────────────────
def _shop_is_public(s: dict) -> bool:
    # Admin/exclusive store is always public.
    if s.get("is_admin_store"):
        return s.get("is_active", True) and s.get("status") not in ("suspended", "draft")
    if not s.get("is_active", True):
        return False
    if s.get("status") in ("suspended", "draft", "archived"):
        return False
    if s.get("online", True) is False and s.get("showWhileOffline") is not True:
        return False
    # NEW: must have a complete profile AND at least 3 valid products.
    # Admin can bypass the profile/product gate for stores they've explicitly approved
    if s.get("admin_approved_public") or s.get("created_by") == "admin":
        return True
    if not _shop_profile_complete(s):
        return False
    if _shop_valid_product_count(s.get("id")) < _MIN_PUBLIC_PRODUCTS:
        return False
    return True

@api.get("/public/shops")
def public_shops(limit: int = Query(200, le=2000)):
    shops = [s for s in mem["shops"] if _shop_is_public(s)]
    # Admin-controlled ordering
    shops.sort(key=lambda s: (s.get("display_order", 9999), s.get("name", "")))
    return shops[:limit]

@api.get("/live-shopping/shops")
def live_shopping_shops(booking_page_only: bool = False, limit: int = Query(200, le=2000)):
    out = []
    for s in mem["shops"]:
        if s.get("is_admin_store"):
            # Admin store shows in live shopping if it has slots/accepts bookings and live is enabled
            if s.get("liveShoppingEnabled", True) and (_shop_has_available_slot(s["id"]) or s.get("acceptsLiveBookings") is True):
                out.append(s)
            continue
        if not s.get("is_active", True) or s.get("status") in ("suspended", "draft"):
            continue
        if s.get("admin_live_disabled") is True:  # admin kill-switch
            continue
        if s.get("online", True) is False:
            continue
        if s.get("liveShoppingEnabled", True) is False:
            continue
        # Live sellers must also meet the public bar (complete profile + 3 products)
        if not _shop_profile_complete(s) or _shop_valid_product_count(s["id"]) < _MIN_PUBLIC_PRODUCTS:
            continue
        if _shop_has_available_slot(s["id"]) or s.get("acceptsLiveBookings") is True:
            out.append(s)
    # Admin-controlled: booking_page_only filters to stores admin opted into
    if booking_page_only:
        out = [s for s in out if s.get("show_in_booking_page")]
    # Booking page only shows sellers that admin has opted in
    out.sort(key=lambda s: (s.get("display_order", 9999), s.get("name", "")))
    return {"shops": out[:limit]}

# ── Seller: own shop (get + update settings) ──────────────────────────────────
@api.get("/seller/shop")
def get_seller_shop(payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    shop = mem_first("shops", id=store_id) if store_id else None
    if not shop:
        raise HTTPException(404, "No store linked to this seller")
    # Attach live completion + public-visibility status (source of truth)
    report = _shop_completion_report(shop)
    return {**shop, "completion": report, "is_public": _shop_is_public(shop)}

_SHOP_EDITABLE = {
    "name", "slug", "description", "image_url", "banner_image", "specialty",
    "city", "state", "country", "contact_email", "owner_email", "phone",
    "instagram_url", "website_url", "return_policy", "shipping_policy",
    "live_instructions", "owner_name", "business_name", "gst_number",
    "payout_account", "notification_email", "online", "liveShoppingEnabled",
    "acceptsLiveBookings", "vacation_mode", "is_active",
}
@api.patch("/seller/shop")
def update_seller_shop(changes: dict, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    shop = mem_first("shops", id=store_id) if store_id else None
    if not shop:
        raise HTTPException(404, "No store linked to this seller")
    # Slug uniqueness
    new_slug = changes.get("slug")
    if new_slug:
        new_slug = _slugify(new_slug)
        if any(s.get("slug") == new_slug and s.get("id") != store_id for s in mem["shops"]):
            raise HTTPException(409, "This store URL is already taken")
        changes["slug"] = new_slug
    safe = {k: v for k, v in changes.items() if k in _SHOP_EDITABLE}
    # Vacation mode forces offline
    if safe.get("vacation_mode") is True:
        safe["online"] = False
    safe["updated_at"] = _now()
    shop.update(safe)
    # ── Profile-completion lock ───────────────────────────────────────────────
    # A seller cannot be online / live-enabled / accept bookings until the
    # profile is complete AND there are >= 3 valid products. We coerce these
    # flags off (backend is source of truth) and report why.
    locked = not _shop_can_go_public(shop)
    if locked:
        shop["online"] = False
        shop["liveShoppingEnabled"] = False
        shop["acceptsLiveBookings"] = False
    # Admin kill-switch always wins over seller preference
    if shop.get("admin_live_disabled") is True:
        shop["liveShoppingEnabled"] = False
    shop["updated_at"] = _now()
    _persist_db()
    report = _shop_completion_report(shop)
    return {**shop, "completion": report, "is_public": _shop_is_public(shop),
            "profile_locked": locked}

# ── Seller: products (ownership enforced) ─────────────────────────────────────
def _owns_product(store_id: str, product_id: str):
    prod = mem_first("products", id=product_id)
    if not prod:
        raise HTTPException(404, "Product not found")
    if prod.get("shop_id") != store_id:
        raise HTTPException(403, "You do not own this product")
    return prod

@api.post("/seller/products", status_code=201)
def seller_create_product(body: dict, payload: dict = Depends(require_seller)):
    user, store_id = _seller_ctx(payload)
    if not store_id:
        raise HTTPException(400, "No store linked to this seller")
    shop = mem_first("shops", id=store_id)
    doc = {
        **body,
        "id": body.get("id") or ("prod-" + uuid.uuid4().hex[:10]),
        "shop_id": store_id,                      # forced — cannot spoof another shop
        "shop_name": shop["name"] if shop else body.get("shop_name", ""),
        "slug": _slugify(body.get("name", "product")),
        "source": "partner",                      # seller products are always "Partnered Store"
        "status": body.get("status", "live"),
        "is_active": True,
        "stock": int(body.get("stock", 0) or 0),
        "created_at": _now(), "updated_at": _now(),
    }
    mem_insert("products", doc)
    if shop:
        shop["productCount"] = len([p for p in mem_get("products", shop_id=store_id)
                                    if p.get("status", "live") not in ("removed", "hidden", "draft")])
    return doc

@api.patch("/seller/products/{product_id}")
def seller_update_product(product_id: str, changes: dict, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    prod = _owns_product(store_id, product_id)
    allowed = {"name","category","description","price","compare_at_price","image_url",
               "hover_image_url","stock","status","is_active","color","ready_to_ship",
               "is_featured","badge","size_options","sku","images","weight_grams","size_chart"}
    patch = {k: v for k, v in changes.items() if k in allowed}
    # Keep stock/status coherent
    if patch.get("status") == "out_of_stock":
        patch["stock"] = 0
    if "stock" in patch and prod.get("status") not in ("hidden", "removed", "draft"):
        patch["status"] = "out_of_stock" if int(patch["stock"] or 0) <= 0 else "live"
    patch["updated_at"] = _now()
    prod.update(patch)
    _persist_db()
    return prod

@api.delete("/seller/products/{product_id}")
def seller_delete_product(product_id: str, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    prod = _owns_product(store_id, product_id)
    prod.update({"status": "removed", "is_active": False, "updated_at": _now()})
    shop = mem_first("shops", id=store_id)
    if shop:
        shop["productCount"] = len([p for p in mem_get("products", shop_id=store_id)
                                    if p.get("status", "live") not in ("removed", "hidden", "draft")])
    return {"success": True}

# ── Slots ─────────────────────────────────────────────────────────────────────
@api.get("/shops/{shop_id}/slots")
def public_shop_slots(shop_id: str):
    """Available future slots for a shop (customer-facing)."""
    slots = [s for s in mem["slots"] if s.get("shop_id") == shop_id
             and s.get("status") == "available" and _slot_is_future(s)]
    slots.sort(key=lambda s: f"{s.get('date')}T{s.get('start_time')}")
    return {"slots": slots}

@api.get("/seller/slots")
def seller_list_slots(payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    slots = [s for s in mem["slots"] if s.get("shop_id") == store_id]
    slots.sort(key=lambda s: f"{s.get('date')}T{s.get('start_time')}")
    return {"slots": slots}

@api.post("/seller/slots", status_code=201)
def seller_create_slot(body: dict, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    if not store_id:
        raise HTTPException(400, "No store linked to this seller")
    shop = mem_first("shops", id=store_id)
    if shop and not _shop_can_go_public(shop):
        raise HTTPException(403, "Complete your store profile and add at least 3 valid products before creating live slots.")
    one_on_one = body.get("one_on_one", True)
    slot = {
        "id": "slot-" + uuid.uuid4().hex[:10],
        "shop_id": store_id,
        "date": body.get("date"),
        "start_time": body.get("start_time"),
        "end_time": body.get("end_time"),
        "timezone": body.get("timezone", "Asia/Kolkata"),
        "one_on_one": one_on_one,
        "max_bookings": 1 if one_on_one else max(1, int(body.get("max_bookings", 1) or 1)),
        "bookings_count": 0,
        "status": "available",
        "booking_id": None,
        "created_at": _now(), "updated_at": _now(),
    }
    if not slot["date"] or not slot["start_time"] or not slot["end_time"]:
        raise HTTPException(400, "date, start_time and end_time are required")
    mem_insert("slots", slot)
    return slot

@api.patch("/seller/slots/{slot_id}")
def seller_update_slot(slot_id: str, changes: dict, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    slot = mem_first("slots", id=slot_id)
    if not slot:
        raise HTTPException(404, "Slot not found")
    if slot.get("shop_id") != store_id:
        raise HTTPException(403, "You do not own this slot")
    allowed = {"date","start_time","end_time","timezone","one_on_one","max_bookings","status"}
    slot.update({k: v for k, v in changes.items() if k in allowed})
    slot["updated_at"] = _now()
    return slot

@api.delete("/seller/slots/{slot_id}")
def seller_delete_slot(slot_id: str, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    slot = mem_first("slots", id=slot_id)
    if not slot:
        raise HTTPException(404, "Slot not found")
    if slot.get("shop_id") != store_id:
        raise HTTPException(403, "You do not own this slot")
    mem_delete("slots", slot_id)
    return {"success": True}

# ── Bookings (slot-aware, with customer contact) ──────────────────────────────
class LiveBookingIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slot_id: Optional[str] = None
    store_id: str
    store_name: str = ""
    selected_products: list = []
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    customer_address: str = ""
    date: str = ""
    time: str = ""
    timezone: str = "IST"
    session_fee: int = 699
    razorpay_payment_id: str = ""
    razorpay_order_id: str = ""
    razorpay_signature: str = ""

@api.post("/live-bookings", status_code=201)
def create_live_booking(body: LiveBookingIn, payload: dict = Depends(get_current_user)):
    slot = None
    if body.slot_id:
        slot = mem_first("slots", id=body.slot_id)
        if not slot:
            raise HTTPException(404, "Slot not found")
        if slot.get("status") != "available":
            raise HTTPException(409, "Slot no longer available")  # prevents double-booking
    booking_id = f"BK-{uuid.uuid4().hex[:6].upper()}"
    user = mem_first("users", id=payload["sub"])
    booking = {
        "id": booking_id, "bookingId": booking_id,
        "user_id": payload["sub"],
        "slot_id": body.slot_id,
        "store_id": body.store_id, "store_name": body.store_name,
        "shop_id": body.store_id, "shop_name": body.store_name,
        "selected_products": body.selected_products,
        "customer_name": body.customer_name or (user or {}).get("name", ""),
        "customer_email": body.customer_email or (user or {}).get("email", ""),
        "customer_phone": body.customer_phone or (user or {}).get("phone", ""),
        "customer_address": body.customer_address,
        "date": body.date or (slot or {}).get("date", ""),
        "time": body.time or (slot or {}).get("start_time", ""),
        "timezone": body.timezone,
        "session_fee": body.session_fee,
        "status": "pending", "payment_status": "paid",
        "google_meet_link": None,
        "appointmentIST": f"{body.date or (slot or {}).get('date','')}T{body.time or (slot or {}).get('start_time','')}:00.000+05:30",
        "created_at": _now(), "updated_at": _now(),
    }
    # Reserve the slot atomically
    if slot:
        slot["bookings_count"] = slot.get("bookings_count", 0) + 1
        slot["booking_id"] = booking_id
        if slot["bookings_count"] >= slot.get("max_bookings", 1):
            slot["status"] = "booked"
        slot["updated_at"] = _now()
    mem_insert("bookings", booking)
    _persist_db()
    # Booking confirmation email to the customer
    if booking.get("customer_email"):
        _send_email(to=booking["customer_email"],
                    subject=f"Live shopping session booked — {booking_id}",
                    body=f"Your live session with {booking.get('store_name') or 'the store'} is booked for "
                         f"{booking.get('date')} {booking.get('time')} ({booking.get('timezone')}). "
                         f"You'll receive the meeting link once the seller confirms.",
                    kind="booking_confirmed")
    return booking

def _can_manage_booking(payload: dict, booking: dict) -> bool:
    role = payload.get("role")
    if role == "admin":
        return True
    if role == "seller":
        user = mem_first("users", id=payload["sub"])
        return bool(user and user.get("store_id") == booking.get("store_id"))
    return booking.get("user_id") == payload["sub"]

@api.patch("/bookings/{booking_id}")
def update_booking(booking_id: str, changes: dict, payload: dict = Depends(get_current_user)):
    booking = next((b for b in mem["bookings"] if b.get("id") == booking_id or b.get("bookingId") == booking_id), None)
    if not booking:
        raise HTTPException(404, "Booking not found")
    if not _can_manage_booking(payload, booking):
        raise HTTPException(403, "Not allowed to modify this booking")
    allowed = {"status", "google_meet_link", "googleMeetLink", "payment_status", "date", "time", "appointmentIST"}
    patch = {k: v for k, v in changes.items() if k in allowed}
    if "googleMeetLink" in patch:
        patch["google_meet_link"] = patch.pop("googleMeetLink")

    prev_meet_link = booking.get("google_meet_link") or ""
    prev_status = booking.get("status", "")

    booking.update(patch)
    booking["updated_at"] = _now()

    cust_email = booking.get("customer_email") or ""
    store_name = booking.get("store_name") or "the store"
    bk_date = booking.get("date") or ""
    bk_time = booking.get("time") or ""
    bk_tz = booking.get("timezone") or "IST"

    # ── Email: Google Meet link added or updated ───────────────────────────────
    new_meet_link = patch.get("google_meet_link", "")
    if new_meet_link and new_meet_link != prev_meet_link and cust_email:
        _send_email(
            to=cust_email,
            subject=f"Your live shopping session link is ready — {booking_id}",
            body=(
                f"<p>Hi {booking.get('customer_name') or 'there'},</p>"
                f"<p>Great news! Your live shopping session with <strong>{store_name}</strong> "
                f"on <strong>{bk_date} at {bk_time} ({bk_tz})</strong> is confirmed.</p>"
                f"<p style='margin:24px 0;'>"
                f"<a href='{new_meet_link}' style='background:#C9A84C;color:#1a1a1a;"
                "text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;"
                "font-size:14px;display:inline-block;'>Join Google Meet →</a></p>"
                f"<p style='font-size:13px;color:#9B8B7A;'>Or paste this link: {new_meet_link}</p>"
                "<p>See you there!</p>"
            ),
            kind="booking_meet_link",
        )

    # ── Email: Booking confirmed ───────────────────────────────────────────────
    if patch.get("status") == "confirmed" and prev_status != "confirmed":
        booking["confirmation_email_status"] = "sent"
        booking["confirmation_email_sent_at"] = _now()
        if cust_email and not new_meet_link:
            _send_email(
                to=cust_email,
                subject=f"Live shopping session confirmed — {booking_id}",
                body=(
                    f"<p>Your live shopping session with <strong>{store_name}</strong> "
                    f"on <strong>{bk_date} at {bk_time} ({bk_tz})</strong> has been confirmed.</p>"
                    "<p>You'll receive the Google Meet link shortly before your session.</p>"
                ),
                kind="booking_confirmed",
            )

    # ── Email: Booking postponed ───────────────────────────────────────────────
    if patch.get("status") == "postponed" and prev_status != "postponed" and cust_email:
        new_date = patch.get("date") or booking.get("date") or "TBD"
        new_time = patch.get("time") or booking.get("time") or ""
        _send_email(
            to=cust_email,
            subject=f"Your live shopping session has been rescheduled — {booking_id}",
            body=(
                f"<p>Hi {booking.get('customer_name') or 'there'},</p>"
                f"<p>Your live shopping session with <strong>{store_name}</strong> has been <strong>postponed</strong>.</p>"
                f"<p><strong>New date:</strong> {new_date} {new_time} ({bk_tz})</p>"
                "<p>We'll send you a new Google Meet link closer to the session. "
                "If you have questions, contact support.</p>"
            ),
            kind="booking_postponed",
        )

    # Release slot on cancel
    if patch.get("status") in ("cancelled", "refunded") and booking.get("slot_id"):
        slot = mem_first("slots", id=booking["slot_id"])
        if slot:
            slot["bookings_count"] = max(0, slot.get("bookings_count", 1) - 1)
            slot["booking_id"] = None
            if slot.get("status") == "booked":
                slot["status"] = "available"
            slot["updated_at"] = _now()
    _persist_db()
    return booking

# ── Seller order status update (ownership enforced) ───────────────────────────
@api.get("/seller/orders/{order_id}")
def seller_get_order(order_id: str, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    order = next((o for o in mem["orders"] if o.get("id") == order_id), None)
    if not order:
        raise HTTPException(404, "Order not found")
    shop_product_ids = {p["id"] for p in mem_get("products", shop_id=store_id)}
    if not any(i.get("product_id") in shop_product_ids for i in order.get("items", [])):
        raise HTTPException(403, "This order does not belong to your store")
    # Only expose this seller's own line items
    own = {**_enrich_order(order)}
    own["items"] = [i for i in order.get("items", []) if i.get("product_id") in shop_product_ids]
    own["seller_total"] = sum(i.get("line_total", i.get("price", 0) * i.get("quantity", 1)) for i in own["items"])
    return own

@api.patch("/seller/orders/{order_id}")
def seller_update_order(order_id: str, changes: dict, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    order = next((o for o in mem["orders"] if o.get("id") == order_id), None)
    if not order:
        raise HTTPException(404, "Order not found")
    shop_product_ids = {p["id"] for p in mem_get("products", shop_id=store_id)}
    if not any(i.get("product_id") in shop_product_ids for i in order.get("items", [])):
        raise HTTPException(403, "This order does not belong to your store")
    allowed = {"status", "tracking_number", "courier", "awb", "tracking_url", "seller_notes"}
    order.update({k: v for k, v in changes.items() if k in allowed})
    order["updated_at"] = _now()
    return _enrich_order(order)

# ── Enrich orders with customer contact (name/email/phone/address) ────────────
def _enrich_order(o: dict) -> dict:
    user = mem_first("users", id=o.get("user_id"))
    addr = o.get("shipping_address", {}) or {}
    return {
        **o,
        "customer_name": addr.get("name") or (user or {}).get("name", ""),
        "customer_email": (user or {}).get("email", ""),
        "customer_phone": addr.get("phone") or (user or {}).get("phone", ""),
        "customer_address": ", ".join(filter(None, [
            addr.get("address"), addr.get("city"), addr.get("state"),
            addr.get("country"), addr.get("pincode") or addr.get("zip"),
        ])),
    }

# ── Admin: seller detail (merged shop/products/orders/bookings/revenue) ────────
@api.get("/admin/sellers/{shop_id}", dependencies=[Depends(require_admin)])
def admin_seller_detail(shop_id: str):
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Seller/shop not found")
    # Find the seller user
    seller = next((u for u in mem["users"] if u.get("store_id") == shop_id and u.get("role") == "seller"), None)
    # Products
    products = mem_get("products", shop_id=shop_id)
    # Orders (items belonging to this shop's products)
    shop_product_ids = {p["id"] for p in products}
    orders = [_enrich_order(o) for o in mem["orders"]
              if any(i.get("product_id") in shop_product_ids for i in o.get("items", []))]
    # Bookings
    bookings = [b for b in mem["bookings"] if b.get("store_id") == shop_id or b.get("shop_id") == shop_id]
    # Slots
    slots = [s for s in mem["slots"] if s.get("shop_id") == shop_id]
    # Revenue
    delivered_revenue = sum(o.get("total", 0) for o in orders if o.get("status") == "delivered")
    total_revenue = sum(o.get("total", 0) for o in orders if o.get("status") in ("confirmed", "shipped", "delivered"))
    pending_revenue = sum(o.get("total", 0) for o in orders if o.get("status") in ("pending", "processing"))
    # Stats
    stats = {
        "total_orders": len(orders),
        "pending_orders": len([o for o in orders if o.get("status") in ("pending", "processing")]),
        "shipped_orders": len([o for o in orders if o.get("status") == "shipped"]),
        "delivered_orders": len([o for o in orders if o.get("status") == "delivered"]),
        "cancelled_orders": len([o for o in orders if o.get("status") == "cancelled"]),
        "total_products": len(products),
        "live_products": len([p for p in products if p.get("status") == "live"]),
        "hidden_products": len([p for p in products if p.get("status") == "hidden"]),
        "oos_products": len([p for p in products if p.get("status") == "out_of_stock"]),
        "total_bookings": len(bookings),
        "total_slots": len(slots),
        "available_slots": len([s for s in slots if s.get("status") == "available"]),
        "total_revenue": total_revenue,
        "delivered_revenue": delivered_revenue,
        "pending_revenue": pending_revenue,
    }
    # Credentials from application if available
    app = next((a for a in mem.get("seller_applications", []) if a.get("store_id") == shop_id), None)
    credentials = app.get("seller_credentials") if app else None

    return {
        "shop": shop,
        "seller": {k: v for k, v in (seller or {}).items() if k != "password_hash"} if seller else None,
        "credentials": credentials,
        "products": products,
        "orders": orders,
        "bookings": bookings,
        "slots": slots,
        "stats": stats,
    }

# ── Admin: live shopping eligibility diagnostic ────────────────────────────────
@api.get("/admin/sellers/{shop_id}/live-eligibility", dependencies=[Depends(require_admin)])
def admin_live_eligibility(shop_id: str):
    """Return a full diagnostic of why a shop passes or fails live shopping eligibility."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")

    is_admin_store = shop.get("is_admin_store", False)
    checks = []

    if is_admin_store:
        checks.append({"key": "admin_store", "label": "Admin store (bypasses most checks)", "pass": True, "detail": "Admin stores skip profile/product/slot gating."})
        live_enabled = shop.get("liveShoppingEnabled", True)
        has_slot = _shop_has_available_slot(shop_id)
        accepts_bookings = shop.get("acceptsLiveBookings") is True
        checks.append({"key": "liveShoppingEnabled", "label": "Live Shopping Enabled", "pass": live_enabled, "detail": str(shop.get("liveShoppingEnabled"))})
        checks.append({"key": "slot_or_accepts", "label": "Has available slot OR acceptsLiveBookings=True", "pass": has_slot or accepts_bookings,
                        "detail": f"has_slot={has_slot}, acceptsLiveBookings={accepts_bookings}"})
    else:
        is_active = shop.get("is_active", True)
        status_ok = shop.get("status") not in ("suspended", "draft")
        admin_kill = shop.get("admin_live_disabled") is True
        online = shop.get("online", True)
        live_enabled = shop.get("liveShoppingEnabled", True) is not False
        profile_complete = _shop_profile_complete(shop)
        valid_products = _shop_valid_product_count(shop_id)
        has_slot = _shop_has_available_slot(shop_id)
        accepts_bookings = shop.get("acceptsLiveBookings") is True

        # Profile missing fields detail
        missing_fields = [f for f in _REQUIRED_SHOP_FIELDS if not str(shop.get(f, "")).strip()]
        if len(str(shop.get("description", ""))) < 10:
            missing_fields.append("description (too short)")
        if not str(shop.get("banner_image", "")).strip():
            missing_fields.append("banner_image")
        if not str(shop.get("return_policy", "")).strip():
            missing_fields.append("return_policy")
        if not str(shop.get("shipping_policy", shop.get("shipping_details", ""))).strip():
            missing_fields.append("shipping_policy")
        seller = next((u for u in mem["users"] if u.get("store_id") == shop_id and u.get("role") == "seller"), None)
        phone = (seller or {}).get("phone") or shop.get("phone")
        if not str(phone or "").strip():
            missing_fields.append("seller phone")

        checks.append({"key": "is_active", "label": "Store active (not suspended/draft)", "pass": is_active and status_ok,
                        "detail": f"is_active={is_active}, status={shop.get('status')}"})
        checks.append({"key": "admin_live_disabled", "label": "Not admin-disabled", "pass": not admin_kill,
                        "detail": f"admin_live_disabled={admin_kill}"})
        checks.append({"key": "online", "label": "Store is Online", "pass": bool(online),
                        "detail": f"online={online}"})
        checks.append({"key": "liveShoppingEnabled", "label": "Live Shopping Enabled by seller", "pass": live_enabled,
                        "detail": f"liveShoppingEnabled={shop.get('liveShoppingEnabled')}"})
        checks.append({"key": "profile_complete", "label": f"Profile complete ({len(missing_fields)} missing fields)", "pass": profile_complete,
                        "detail": f"Missing: {missing_fields}" if missing_fields else "All required fields present"})
        checks.append({"key": "product_count", "label": f"At least {_MIN_PUBLIC_PRODUCTS} valid products (has {valid_products})", "pass": valid_products >= _MIN_PUBLIC_PRODUCTS,
                        "detail": f"{valid_products}/{_MIN_PUBLIC_PRODUCTS} valid products. A valid product needs: name, image, description, category, price>0, status=live/out_of_stock"})
        checks.append({"key": "slot_or_accepts", "label": "Has available slot OR acceptsLiveBookings=True", "pass": has_slot or accepts_bookings,
                        "detail": f"has_future_slot={has_slot}, acceptsLiveBookings={accepts_bookings}"})

    all_pass = all(c["pass"] for c in checks)
    return {
        "shop_id": shop_id,
        "shop_name": shop.get("name"),
        "eligible": all_pass,
        "checks": checks,
        "overrides": {
            "acceptsLiveBookings": shop.get("acceptsLiveBookings", False),
            "admin_live_disabled": shop.get("admin_live_disabled", False),
            "liveShoppingEnabled": shop.get("liveShoppingEnabled", False),
            "online": shop.get("online", False),
            "show_in_booking_page": shop.get("show_in_booking_page", False),
            "ai_studio_enabled": shop.get("ai_studio_enabled", False),
        }
    }

@api.patch("/admin/sellers/{shop_id}/live-override", dependencies=[Depends(require_admin)])
def admin_live_override(shop_id: str, body: dict):
    """Admin override for live shopping eligibility flags."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    allowed = {"acceptsLiveBookings", "admin_live_disabled", "liveShoppingEnabled", "online", "show_in_booking_page", "ai_studio_enabled"}
    safe = {k: v for k, v in body.items() if k in allowed and isinstance(v, bool)}
    if not safe:
        raise HTTPException(400, "No valid boolean fields provided. Allowed: " + ", ".join(allowed))
    safe["updated_at"] = _now()
    doc = mem_update("shops", shop_id, safe)
    return {"success": True, "shop_id": shop_id, "updated": safe, "shop": doc}

# ── Admin: list all sellers (merged view) ──────────────────────────────────────
@api.get("/admin/sellers", dependencies=[Depends(require_admin)])
def admin_list_sellers(status: Optional[str] = None):
    """Returns all shops with their seller user + stats for the merged Sellers view.
    Optional ?status filter: pending|approved|active|suspended|archived|rejected
    """
    result = []
    for shop in mem["shops"]:
        # Admin/head store is included — shown with special badge in admin panel
        shop_status = shop.get("status", "active")
        if shop.get("is_admin_store"):
            shop_status = "head_store"
        elif shop.get("is_archived"):
            shop_status = "archived"
        elif shop.get("isSuspended"):
            shop_status = "suspended"

        seller = next((u for u in mem["users"] if u.get("store_id") == shop["id"] and u.get("role") == "seller"), None)
        products = mem_get("products", shop_id=shop["id"])
        shop_product_ids = {p["id"] for p in products}
        orders = [o for o in mem["orders"] if any(i.get("product_id") in shop_product_ids for i in o.get("items", []))]
        bookings = [b for b in mem["bookings"] if b.get("store_id") == shop["id"] or b.get("shop_id") == shop["id"]]
        app = next((a for a in mem.get("seller_applications", []) if a.get("store_id") == shop["id"]), None)

        row = {
            "shop": {**shop, "shop_status": shop_status},
            "seller": {k: v for k, v in (seller or {}).items() if k != "password_hash"} if seller else None,
            "application": app,
            "stats": {
                "products": len(products),
                "live_products": len([p for p in products if p.get("status") == "live"]),
                "orders": len(orders),
                "bookings": len(bookings),
                "revenue": sum(o.get("total", 0) for o in orders if o.get("status") in ("confirmed", "shipped", "delivered")),
            },
        }
        if status and status != "all":
            # Map filter values to shop statuses
            if status == "active" and shop_status not in ("active", "offline"):
                continue
            elif status == "suspended" and shop_status != "suspended":
                continue
            elif status == "archived" and shop_status != "archived":
                continue
            elif status == "approved" and app and app.get("status") not in ("approved",):
                continue
        result.append(row)

    # Include pending/rejected applications that don't have a shop yet
    for app in mem.get("seller_applications", []):
        if app.get("store_id") and any(r["shop"]["id"] == app["store_id"] for r in result if r.get("shop")):
            continue
        if not app.get("store_id"):
            app_status = app.get("status", "pending_review")
            if status and status != "all":
                if status == "pending" and app_status not in ("pending_review", "pending"):
                    continue
                elif status == "rejected" and app_status != "rejected":
                    continue
                elif status not in ("pending", "rejected", "all", None):
                    continue
            result.append({
                "shop": None,
                "seller": None,
                "application": app,
                "stats": {"products": 0, "live_products": 0, "orders": 0, "bookings": 0, "revenue": 0},
            })
    return result

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN: MANUAL SELLER ADD  (creates account + shop + credentials + email)
# ══════════════════════════════════════════════════════════════════════════════
@api.post("/admin/sellers", status_code=201, dependencies=[Depends(require_admin)])
def admin_add_seller(body: dict):
    email = (body.get("email") or body.get("owner_email") or "").lower().strip()
    phone = str(body.get("phone") or "").strip()
    name = body.get("owner_name") or body.get("name") or ""
    store_name = body.get("store_name") or body.get("name") or "Store"
    if not email:
        raise HTTPException(400, "Seller email is required")
    # Duplicate email/phone checks across users
    if mem_first("users", email=email):
        raise HTTPException(409, "This email is already in use.")
    if phone and any(u.get("phone") == phone for u in mem["users"]):
        raise HTTPException(409, "This phone number is already in use.")

    shop_id = "shop-" + str(uuid.uuid4())[:8]
    base_slug = _slugify(store_name)
    slug = base_slug if not any(s.get("slug") == base_slug for s in mem["shops"]) else f"{base_slug}-{shop_id[-4:]}"
    now = _now()
    shop = {
        "id": shop_id, "slug": slug, "name": store_name,
        "owner_name": name, "owner_email": email,
        "city": body.get("city", ""), "country": body.get("country", "India"),
        "specialty": body.get("specialty", ""), "description": body.get("description", ""),
        "image_url": body.get("image_url", ""),
        "banner_image": body.get("banner_image", ""),
        "return_policy": body.get("return_policy", ""), "shipping_policy": body.get("shipping_policy", ""),
        "instagram_url": "", "is_active": True, "status": "active",
        # All public/live features default OFF — seller must complete profile first
        "online": False, "liveShoppingEnabled": False,
        "acceptsLiveBookings": False, "admin_live_disabled": False,
        "verified": False, "rating": 0, "followers": 0, "productCount": 0,
        "display_order": 9999, "show_in_booking_page": False,
        "created_by": "admin", "created_at": now, "updated_at": now,
    }
    mem_insert("shops", shop)

    temp_password = "slb-" + uuid.uuid4().hex[:6]
    user = {
        "id": str(uuid.uuid4()), "name": name, "email": email,
        "password_hash": _hash_pw(temp_password), "role": "seller",
        "phone": phone, "city": body.get("city", ""),
        "store_name": store_name, "store_id": shop_id, "created_at": now,
    }
    mem_insert("users", user)

    email_result = _send_email(
        to=email, subject="Your ShopLiveBharat Seller Account",
        body=(f"Hi {name}, an account has been created for your store '{store_name}'.<br>"
              f"Login at /seller/login<br>Email: {email}<br>Temporary password: {temp_password}<br>"
              f"Complete your profile and add at least 3 products to go live."),
        kind="seller_manual_add",
    )
    return {
        "shop": shop,
        "seller": {k: v for k, v in user.items() if k != "password_hash"},
        "credentials": {"email": email, "temp_password": temp_password,
                        "email_status": email_result["status"]},
    }

# ══════════════════════════════════════════════════════════════════════════════
# RETURNS + REFUNDS
# ══════════════════════════════════════════════════════════════════════════════
def _order_shop_ids(order: dict) -> set:
    ids = set()
    for it in order.get("items", []):
        prod = mem_first("products", id=it.get("product_id"))
        if prod and prod.get("shop_id"):
            ids.add(prod["shop_id"])
    return ids

@api.post("/returns", status_code=201)
def create_return(body: dict, payload: dict = Depends(get_current_user)):
    order_id = body.get("order_id")
    order = mem_first("orders", id=order_id)
    if not order or order.get("user_id") != payload["sub"]:
        raise HTTPException(404, "Order not found")
    if not body.get("reason"):
        raise HTTPException(400, "A return reason is required")
    shop_ids = list(_order_shop_ids(order))
    user = mem_first("users", id=payload["sub"])
    now = _now()
    ret = {
        "id": "RET-" + str(uuid.uuid4())[:8].upper(),
        "order_id": order_id, "user_id": payload["sub"],
        "customer_name": (user or {}).get("name", ""), "customer_email": (user or {}).get("email", ""),
        "shop_ids": shop_ids,
        "items": body.get("items", order.get("items", [])),
        "reason": body.get("reason", ""), "details": body.get("details", ""),
        "photos": body.get("photos", []),
        "status": "requested",  # requested|approved|rejected|received|refunded
        "refund_amount": None, "refund_method": None, "refund_status": "pending",
        "refund_reference": None, "refund_timeline": None,
        "created_at": now, "updated_at": now,
    }
    mem_insert("returns", ret)
    _send_email(to=ret["customer_email"], subject=f"Return request received — {ret['id']}",
                body=f"We received your return request for order {order_id}. Status: requested.",
                kind="return_requested")
    return ret

@api.get("/returns")
def list_my_returns(payload: dict = Depends(get_current_user)):
    return {"returns": mem_get("returns", user_id=payload["sub"])}

@api.get("/admin/returns", dependencies=[Depends(require_admin)])
def admin_list_returns(status: Optional[str] = None):
    rets = mem["returns"]
    if status and status != "all":
        rets = [r for r in rets if r.get("status") == status]
    return sorted(rets, key=lambda r: r.get("created_at", ""), reverse=True)

@api.patch("/admin/returns/{return_id}", dependencies=[Depends(require_admin)])
def admin_update_return(return_id: str, changes: dict):
    allowed = {"status", "refund_amount", "refund_method", "refund_status",
               "refund_reference", "refund_timeline", "admin_note"}
    safe = {k: v for k, v in changes.items() if k in allowed}
    safe["updated_at"] = _now()
    ret = mem_update("returns", return_id, safe)
    if not ret:
        raise HTTPException(404, "Return not found")
    # Notify customer on status changes
    if "status" in safe or "refund_status" in safe:
        _send_email(to=ret.get("customer_email", ""),
                    subject=f"Return {ret['id']} update: {ret.get('status')}",
                    body=(f"Your return {ret['id']} is now '{ret.get('status')}'. "
                          f"Refund: {ret.get('refund_status')}"
                          f"{(' ₹' + str(ret.get('refund_amount'))) if ret.get('refund_amount') else ''}"
                          f"{(' ref ' + ret.get('refund_reference')) if ret.get('refund_reference') else ''}."),
                    kind="return_update")
    return ret

@api.get("/seller/returns")
def seller_list_returns(payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    return {"returns": [r for r in mem["returns"] if store_id in (r.get("shop_ids") or [])]}

@api.patch("/seller/returns/{return_id}")
def seller_update_return(return_id: str, changes: dict, payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    ret = mem_first("returns", id=return_id)
    if not ret or store_id not in (ret.get("shop_ids") or []):
        raise HTTPException(404, "Return not found")
    # Seller may only mark received/inspected or add a note (not issue refunds)
    safe = {k: v for k, v in changes.items() if k in ("status", "seller_note")}
    if safe.get("status") not in (None, "received", "inspected", "approved", "rejected"):
        raise HTTPException(400, "Sellers cannot set that status")
    safe["updated_at"] = _now()
    return mem_update("returns", return_id, safe)

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN STAFF / ROLES (RBAC)
# ══════════════════════════════════════════════════════════════════════════════
STAFF_PERMISSIONS = [
    "orders", "bookings", "sellers", "products", "returns", "shipping", "reports_only",
]

@api.get("/admin/staff", dependencies=[Depends(require_admin)])
def admin_list_staff():
    staff = [u for u in mem["users"] if u.get("role") in ("admin", "staff") and u.get("is_staff")]
    return [{k: v for k, v in u.items() if k != "password_hash"} for u in staff]

@api.post("/admin/staff", status_code=201, dependencies=[Depends(require_admin)])
def admin_create_staff(body: dict):
    email = (body.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(400, "Email is required")
    if mem_first("users", email=email):
        raise HTTPException(409, "This email is already in use.")
    perms = [p for p in (body.get("permissions") or []) if p in STAFF_PERMISSIONS]
    temp_password = body.get("password") or ("slb-" + uuid.uuid4().hex[:6])
    user = {
        "id": str(uuid.uuid4()), "name": body.get("name", ""), "email": email,
        "password_hash": _hash_pw(temp_password), "role": "staff", "is_staff": True,
        "permissions": perms, "phone": body.get("phone", ""), "created_at": _now(),
    }
    mem_insert("users", user)
    _send_email(to=email, subject="Your ShopLiveBharat Staff Account",
                body=f"You have staff access with permissions: {', '.join(perms) or 'none'}. "
                     f"Login email: {email}, temporary password: {temp_password}.",
                kind="staff_invite")
    return {**{k: v for k, v in user.items() if k != "password_hash"},
            "temp_password": temp_password}

@api.patch("/admin/staff/{staff_id}", dependencies=[Depends(require_admin)])
def admin_update_staff(staff_id: str, changes: dict):
    safe = {}
    if "permissions" in changes:
        safe["permissions"] = [p for p in changes["permissions"] if p in STAFF_PERMISSIONS]
    for k in ("name", "phone", "is_staff"):
        if k in changes:
            safe[k] = changes[k]
    user = mem_update("users", staff_id, safe)
    if not user:
        raise HTTPException(404, "Staff user not found")
    return {k: v for k, v in user.items() if k != "password_hash"}

@api.delete("/admin/staff/{staff_id}", dependencies=[Depends(require_admin)])
def admin_delete_staff(staff_id: str):
    if not mem_delete("users", staff_id):
        raise HTTPException(404, "Staff user not found")
    return {"success": True}

@api.get("/admin/permissions", dependencies=[Depends(require_admin)])
def admin_list_permissions():
    return {"permissions": STAFF_PERMISSIONS}

# ══════════════════════════════════════════════════════════════════════════════
# SHIPROCKET (test-mode when credentials absent; keys server-side only)
# ══════════════════════════════════════════════════════════════════════════════
def _shiprocket_configured() -> bool:
    return bool(os.environ.get("SHIPROCKET_EMAIL", "").strip()
                and os.environ.get("SHIPROCKET_PASSWORD", "").strip())

def _create_shipment_record(order, shop_id, actor):
    now = _now()
    test_mode = not _shiprocket_configured()
    awb = ("TEST" if test_mode else "SR") + uuid.uuid4().hex[:10].upper()
    ship = {
        "id": "SHIP-" + str(uuid.uuid4())[:8].upper(),
        "order_id": order.get("id"), "shop_id": shop_id,
        "awb": awb, "courier": "TestCourier" if test_mode else "Shiprocket",
        "label_url": f"/shipments/{awb}/label.pdf",
        "status": "created", "test_mode": test_mode,
        "tracking": [{"status": "created", "at": now}],
        "created_by": actor, "created_at": now, "updated_at": now,
    }
    mem_insert("shipments", ship)
    # reflect on the order
    mem_update("orders", order["id"], {"tracking_number": awb, "shipment_status": "created", "updated_at": now})
    return ship

@api.get("/shiprocket/status")
def shiprocket_status():
    return {"configured": _shiprocket_configured(),
            "mode": "live" if _shiprocket_configured() else "test"}

@api.post("/admin/shipments", status_code=201, dependencies=[Depends(require_admin)])
def admin_create_shipment(body: dict):
    order = mem_first("orders", id=body.get("order_id"))
    if not order:
        raise HTTPException(404, "Order not found")
    return _create_shipment_record(order, body.get("shop_id"), "admin")

@api.get("/admin/shipments", dependencies=[Depends(require_admin)])
def admin_list_shipments():
    return {"shipments": sorted(mem["shipments"], key=lambda s: s.get("created_at", ""), reverse=True)}

@api.post("/seller/shipments", status_code=201)
def seller_create_shipment(body: dict, payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    order = mem_first("orders", id=body.get("order_id"))
    if not order:
        raise HTTPException(404, "Order not found")
    if store_id not in _order_shop_ids(order):
        raise HTTPException(403, "This order does not belong to your store")
    return _create_shipment_record(order, store_id, "seller")

@api.get("/seller/shipments")
def seller_list_shipments(payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    return {"shipments": [s for s in mem["shipments"] if s.get("shop_id") == store_id]}

@api.get("/shipments/{awb}/track")
def track_shipment(awb: str):
    ship = next((s for s in mem["shipments"] if s.get("awb") == awb), None)
    if not ship:
        raise HTTPException(404, "Shipment not found")
    return {"awb": awb, "status": ship.get("status"), "tracking": ship.get("tracking", []),
            "test_mode": ship.get("test_mode", True)}

@api.patch("/shipments/{ship_id}/status")
def update_shipment_status(ship_id: str, changes: dict, payload: dict = Depends(get_current_user)):
    ship = mem_first("shipments", id=ship_id)
    if not ship:
        raise HTTPException(404, "Shipment not found")
    new_status = changes.get("status")
    if new_status:
        ship["status"] = new_status
        ship.setdefault("tracking", []).append({"status": new_status, "at": _now()})
        ship["updated_at"] = _now()
        mem_update("orders", ship["order_id"], {"shipment_status": new_status})
        _persist_db()
    return ship

# ── Cloudinary integration (optional, activates when credentials are set) ─────
# Configure via EITHER a single CLOUDINARY_URL (cloudinary://key:secret@cloud)
# OR the three separate vars CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY /
# CLOUDINARY_API_SECRET. When configured, uploaded + AI-generated images are
# stored on Cloudinary (keeping MongoDB lean) instead of as base64 data URLs.
_CLOUDINARY_READY = {"checked": False, "ok": False}

def _cloudinary_configure() -> bool:
    """Configure the Cloudinary SDK once. Returns True if usable."""
    if _CLOUDINARY_READY["checked"]:
        return _CLOUDINARY_READY["ok"]
    _CLOUDINARY_READY["checked"] = True
    try:
        import cloudinary  # type: ignore
        url = os.environ.get("CLOUDINARY_URL", "").strip()
        cloud = os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip()
        key = os.environ.get("CLOUDINARY_API_KEY", "").strip()
        secret = os.environ.get("CLOUDINARY_API_SECRET", "").strip()
        # If only the single URL is provided, parse it into its parts. The SDK's
        # cloudinary_url= kwarg is not reliably parsed, so we do it explicitly.
        if url and not (cloud and key and secret):
            try:
                from urllib.parse import urlparse
                p = urlparse(url)  # cloudinary://<key>:<secret>@<cloud_name>
                key = key or (p.username or "")
                secret = secret or (p.password or "")
                cloud = cloud or (p.hostname or "")
            except Exception as pe:
                logger.warning(f"[CLOUDINARY] URL parse failed: {pe}")
        if cloud and key and secret:
            cloudinary.config(cloud_name=cloud, api_key=key, api_secret=secret, secure=True)
            _CLOUDINARY_READY["ok"] = True
        else:
            _CLOUDINARY_READY["ok"] = False
    except Exception as e:
        logger.warning(f"[CLOUDINARY] configure failed: {e}")
        _CLOUDINARY_READY["ok"] = False
    return _CLOUDINARY_READY["ok"]

def _cloudinary_configured() -> bool:
    return _cloudinary_configure()

def _cloudinary_upload(source: str, folder: str = "shoplivebharat/products") -> Optional[str]:
    """Upload a data URL or hosted URL to Cloudinary and return the secure URL.
    Returns None if Cloudinary is not configured or the upload fails."""
    if not _cloudinary_configure():
        return None
    try:
        import cloudinary.uploader  # type: ignore
        res = cloudinary.uploader.upload(
            source, folder=folder, resource_type="image",
            quality="auto:good", fetch_format="auto",
        )
        return res.get("secure_url")
    except Exception as e:
        logger.warning(f"[CLOUDINARY] upload failed: {e}")
        return None

def _store_image(data_url: str, by: str, folder: str = "shoplivebharat/products") -> dict:
    """Store an uploaded image. Prefers Cloudinary; falls back to the in-memory
    data-URL store so the app keeps working without Cloudinary configured."""
    hosted = _cloudinary_upload(data_url, folder=folder)
    if hosted:
        return {"url": hosted, "source": "cloudinary"}
    image_id = "img-" + uuid.uuid4().hex[:12]
    mem.setdefault("image_store", {})[image_id] = {"url": data_url, "uploaded_at": _now(), "by": by}
    return {"url": data_url, "image_id": image_id, "source": "data_url"}

# ── Cloudinary PRIVATE video (AI Try-On training data) ───────────────────────
# Videos are uploaded as `authenticated` assets so their delivery URLs require a
# signature — they are never publicly guessable and never exposed to customers.
def _cloudinary_upload_video_file(path: str, folder: str = "shoplivebharat/ai-training") -> Optional[dict]:
    if not _cloudinary_configure():
        return None
    try:
        import cloudinary.uploader  # type: ignore
        res = cloudinary.uploader.upload_large(
            path, resource_type="video", type="authenticated",
            folder=folder, chunk_size=20_000_000,
        )
        return {"public_id": res.get("public_id"), "bytes": res.get("bytes", 0),
                "duration": res.get("duration"), "format": res.get("format")}
    except Exception as e:
        logger.warning(f"[CLOUDINARY] video upload failed: {e}")
        return None

def _cloudinary_signed_url(public_id: str, fmt: str = "mp4", **opts) -> Optional[str]:
    if not public_id or not _cloudinary_configure():
        return None
    try:
        import cloudinary.utils  # type: ignore
        url, _ = cloudinary.utils.cloudinary_url(
            public_id, resource_type="video", type="authenticated",
            sign_url=True, format=fmt, secure=True, **opts,
        )
        return url
    except Exception as e:
        logger.warning(f"[CLOUDINARY] signed url failed: {e}")
        return None

def _cloudinary_video_frame_urls(public_id: str, duration: Optional[float], count: int = 6) -> list:
    """Signed still-frame JPG URLs sampled across the video (private)."""
    if not public_id:
        return []
    if duration and duration > 0:
        offsets = [round(duration * (i + 1) / (count + 1), 2) for i in range(count)]
    else:
        offsets = [1, 3, 5, 7, 9, 11][:count]
    urls = []
    for off in offsets:
        u = _cloudinary_signed_url(public_id, fmt="jpg", start_offset=str(off),
                                   transformation=[{"width": 640, "crop": "limit"}])
        if u:
            urls.append(u)
    return urls

def _cloudinary_delete_video(public_id: str) -> bool:
    if not public_id or not _cloudinary_configure():
        return False
    try:
        import cloudinary.uploader  # type: ignore
        cloudinary.uploader.destroy(public_id, resource_type="video", type="authenticated")
        return True
    except Exception as e:
        logger.warning(f"[CLOUDINARY] video delete failed: {e}")
        return False

# ── Image upload (Cloudinary when configured, else base64 data-url fallback) ──
# Max ~10 MB per image (browser should pre-resize before sending).
@api.post("/upload-image", status_code=201)
def upload_image(body: dict, payload: dict = Depends(get_current_user)):
    """Accept { data_url, filename } or { url } and return a usable image URL."""
    if body.get("url"):
        # Caller is providing an already-hosted URL (e.g. Cloudinary)
        return {"url": body["url"], "source": "external"}
    data_url = body.get("data_url", "")
    if not data_url.startswith("data:image/"):
        raise HTTPException(400, "Provide a valid data_url (data:image/...) or a hosted url")
    return _store_image(data_url, by=payload["sub"], folder="shoplivebharat/products")

@api.post("/admin/upload-image", status_code=201, dependencies=[Depends(require_admin)])
def admin_upload_image(body: dict):
    """Admin version — same logic, no auth token required."""
    if body.get("url"):
        return {"url": body["url"], "source": "external"}
    data_url = body.get("data_url", "")
    if not data_url.startswith("data:image/"):
        raise HTTPException(400, "Provide a valid data_url or a hosted url")
    return _store_image(data_url, by="admin", folder="shoplivebharat/products")

@api.get("/admin/cloudinary-status", dependencies=[Depends(require_admin)])
def admin_cloudinary_status():
    """Report whether Cloudinary is configured (no secrets returned)."""
    ok = _cloudinary_configured()
    cloud = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    if not cloud:
        url = os.environ.get("CLOUDINARY_URL", "")
        if "@" in url:
            cloud = url.rsplit("@", 1)[-1]
    return {"configured": ok, "cloud_name": cloud, "mode": "cloudinary" if ok else "data_url"}

# ── Admin: store display order + booking-page visibility ─────────────────────
@api.patch("/admin/shops/{shop_id}/order", dependencies=[Depends(require_admin)])
def admin_set_shop_order(shop_id: str, body: dict):
    """Set display_order (int, lower = higher) and show_in_booking_page (bool)."""
    allowed = {"display_order", "show_in_booking_page", "is_featured", "trending", "admin_approved_public", "is_premium", "homepage_order"}
    safe = {k: v for k, v in body.items() if k in allowed}
    safe["updated_at"] = _now()
    doc = mem_update("shops", shop_id, safe)
    if not doc:
        raise HTTPException(404, "Shop not found")
    return doc

@api.get("/admin/shops/order", dependencies=[Depends(require_admin)])
def admin_list_shops_ordered():
    """Return all shops sorted by display_order for the admin ordering UI."""
    shops = sorted(mem["shops"], key=lambda s: (s.get("display_order", 9999), s.get("name", "")))
    return shops

# ── CSP violation reports (browsers POST here on policy violations) ───────────
@api.post("/csp-report")
async def csp_report(request: Request):
    """Receive CSP violation reports. Kept lightweight and capped so it can't be
    abused as a log-flooding vector."""
    try:
        raw = await request.body()
        if len(raw) <= 8192:
            data = _json2.loads(raw.decode("utf-8") or "{}")
            report = data.get("csp-report") or data
            blocked = report.get("blocked-uri") or report.get("blockedURL") or ""
            directive = report.get("violated-directive") or report.get("effectiveDirective") or ""
            logger.warning(f"[CSP] violation directive={directive!r} blocked={blocked!r}")
            alerts = mem.setdefault("csp_reports", [])
            alerts.append({"directive": directive, "blocked": blocked, "created_at": _now()})
            del alerts[:-200]  # keep only the most recent 200
    except Exception:
        pass
    return JSONResponse(status_code=204, content=None)

@api.get("/admin/csp-reports", dependencies=[Depends(require_admin)])
def admin_csp_reports(limit: int = Query(100, le=200)):
    reports = list(reversed(mem.get("csp_reports", [])))
    return {"reports": reports[:limit], "total": len(mem.get("csp_reports", []))}

# ── Payment fraud alerts (amount mismatches, without PII) ─────────────────────
@api.get("/admin/payment-alerts", dependencies=[Depends(require_admin)])
def admin_payment_alerts(limit: int = Query(100, le=1000)):
    alerts = sorted(mem.get("payment_alerts", []), key=lambda a: a.get("created_at", ""), reverse=True)
    return {"alerts": alerts[:limit], "total": len(alerts)}

# ── Email log (test-mode visibility for admin) ────────────────────────────────
@api.get("/admin/email-log", dependencies=[Depends(require_admin)])
def admin_email_log(limit: int = Query(100, le=1000)):
    log = sorted(mem.get("email_log", []), key=lambda e: e.get("created_at", ""), reverse=True)
    resend_configured = bool(os.environ.get("RESEND_API_KEY", "").strip())
    return {"configured": resend_configured,
            "mode": "live" if resend_configured else "test",
            "sender": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
            "emails": log[:limit]}

@api.post("/admin/email-test", dependencies=[Depends(require_admin)])
def admin_email_test(body: dict):
    """Send a test email to verify Resend is connected. Body: { "to": "you@example.com" }"""
    to = (body.get("to") or "").strip()
    if not to:
        raise HTTPException(400, "Provide a 'to' email address")
    result = _send_email(
        to=to, subject="ShopLiveBharat — test email ✅",
        body="<p>This is a test email from ShopLiveBharat. If you can read this, Resend is connected and working. 🎉</p>",
        kind="test",
    )
    return {"result": result, "configured": bool(os.environ.get("RESEND_API_KEY", "").strip())}

# ── Coupons ───────────────────────────────────────────────────────────────────
def _coupon_public(c: dict) -> dict:
    return {k: v for k, v in c.items()}

def _normalize_coupon_in(body: dict) -> dict:
    ctype = body.get("type", "percent")
    if ctype not in ("percent", "flat", "fixed"):
        ctype = "percent"
    if ctype == "fixed":
        ctype = "flat"
    return {
        "code": str(body.get("code", "")).strip().upper(),
        "type": ctype,
        "value": float(body.get("value", 0) or 0),
        "min_order": float(body.get("min_order", body.get("minOrder", 0)) or 0),
        "max_uses": int(body.get("max_uses", body.get("maxUses", 0)) or 0),
        "expiry": body.get("expiry", body.get("expires", "")) or "",
        "active": bool(body.get("active", True)),
    }

# Admin coupon management (scope=admin)
@api.get("/admin/coupons", dependencies=[Depends(require_admin)])
def admin_list_coupons():
    return [c for c in mem.setdefault("coupons", []) if c.get("scope") == "admin"]

@api.post("/admin/coupons", status_code=201, dependencies=[Depends(require_admin)])
def admin_create_coupon(body: dict):
    data = _normalize_coupon_in(body)
    if not data["code"]:
        raise HTTPException(400, "Coupon code is required")
    if any(c.get("code") == data["code"] for c in mem.setdefault("coupons", [])):
        raise HTTPException(409, "Coupon code already exists")
    doc = {**data, "id": str(uuid.uuid4()), "scope": "admin", "shop_id": None,
           "used": 0, "created_at": _now(), "updated_at": _now()}
    return mem_insert("coupons", doc)

@api.patch("/admin/coupons/{coupon_id}", dependencies=[Depends(require_admin)])
def admin_update_coupon(coupon_id: str, changes: dict):
    safe = {k: v for k, v in changes.items() if k in ("code", "type", "value", "min_order", "max_uses", "expiry", "active")}
    if "code" in safe:
        safe["code"] = str(safe["code"]).strip().upper()
    safe["updated_at"] = _now()
    doc = mem_update("coupons", coupon_id, safe)
    if not doc:
        raise HTTPException(404, "Coupon not found")
    return doc

@api.delete("/admin/coupons/{coupon_id}", dependencies=[Depends(require_admin)])
def admin_delete_coupon(coupon_id: str):
    if not mem_delete("coupons", coupon_id):
        raise HTTPException(404, "Coupon not found")
    return {"success": True}

# Seller coupon management (scope=seller, scoped to own shop)
@api.get("/seller/coupons")
def seller_list_coupons(payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    return [c for c in mem.setdefault("coupons", []) if c.get("shop_id") == store_id]

@api.post("/seller/coupons", status_code=201)
def seller_create_coupon(body: dict, payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    if not store_id:
        raise HTTPException(400, "No store linked to this seller")
    data = _normalize_coupon_in(body)
    if not data["code"]:
        raise HTTPException(400, "Coupon code is required")
    if any(c.get("code") == data["code"] for c in mem.setdefault("coupons", [])):
        raise HTTPException(409, "Coupon code already exists")
    doc = {**data, "id": str(uuid.uuid4()), "scope": "seller", "shop_id": store_id,
           "used": 0, "created_at": _now(), "updated_at": _now()}
    return mem_insert("coupons", doc)

@api.patch("/seller/coupons/{coupon_id}")
def seller_update_coupon(coupon_id: str, changes: dict, payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    coupon = mem_first("coupons", id=coupon_id)
    if not coupon or coupon.get("shop_id") != store_id:
        raise HTTPException(404, "Coupon not found")
    safe = {k: v for k, v in changes.items() if k in ("code", "type", "value", "min_order", "max_uses", "expiry", "active")}
    if "code" in safe:
        safe["code"] = str(safe["code"]).strip().upper()
    safe["updated_at"] = _now()
    return mem_update("coupons", coupon_id, safe)

@api.delete("/seller/coupons/{coupon_id}")
def seller_delete_coupon(coupon_id: str, payload: dict = Depends(require_seller)):
    _user, store_id = _seller_ctx(payload)
    coupon = mem_first("coupons", id=coupon_id)
    if not coupon or coupon.get("shop_id") != store_id:
        raise HTTPException(404, "Coupon not found")
    mem_delete("coupons", coupon_id)
    return {"success": True}

# Public: validate a coupon code against an order subtotal
@api.post("/coupons/validate")
def validate_coupon(body: dict):
    code = str(body.get("code", "")).strip().upper()
    subtotal = float(body.get("subtotal", 0) or 0)
    coupon = next((c for c in mem.setdefault("coupons", []) if c.get("code") == code), None)
    if not coupon:
        raise HTTPException(404, "Invalid coupon code")
    if not coupon.get("active", True):
        raise HTTPException(400, "This coupon is not active")
    expiry = coupon.get("expiry")
    if expiry:
        try:
            if datetime.fromisoformat(expiry) < datetime.now():
                raise HTTPException(400, "This coupon has expired")
        except ValueError:
            pass
    if coupon.get("max_uses") and coupon.get("used", 0) >= coupon["max_uses"]:
        raise HTTPException(400, "This coupon has reached its usage limit")
    if subtotal < coupon.get("min_order", 0):
        raise HTTPException(400, f"Minimum order of ₹{coupon['min_order']:.0f} required")
    discount = subtotal * coupon["value"] / 100 if coupon["type"] == "percent" else coupon["value"]
    discount = min(discount, subtotal)
    return {"valid": True, "code": coupon["code"], "type": coupon["type"],
            "value": coupon["value"], "discount": round(discount, 2)}

# ── Categories (admin editable, public readable) ──────────────────────────────
@api.get("/categories")
def list_categories():
    """Public: return visible categories sorted by display_order."""
    cats = sorted(
        [c for c in mem.setdefault("categories", []) if c.get("visible", True)],
        key=lambda c: c.get("display_order", 9999)
    )
    return cats

@api.get("/admin/categories", dependencies=[Depends(require_admin)])
def admin_list_categories():
    cats = sorted(mem.setdefault("categories", []), key=lambda c: c.get("display_order", 9999))
    return cats

@api.post("/admin/categories", status_code=201, dependencies=[Depends(require_admin)])
def admin_create_category(body: dict):
    if not body.get("label"):
        raise HTTPException(400, "label is required")
    cat = {
        "id": "cat-" + uuid.uuid4().hex[:8],
        "slug": _slugify(body.get("label", "")),
        "label": body.get("label", ""),
        "caption": body.get("caption", ""),
        "image_url": body.get("image_url", ""),
        "display_order": int(body.get("display_order", 99) or 99),
        "visible": bool(body.get("visible", True)),
        "created_at": _now(), "updated_at": _now(),
    }
    mem.setdefault("categories", []).append(cat)
    _persist_db()
    return cat

@api.patch("/admin/categories/{cat_id}", dependencies=[Depends(require_admin)])
def admin_update_category(cat_id: str, body: dict):
    cats = mem.setdefault("categories", [])
    cat = next((c for c in cats if c.get("id") == cat_id), None)
    if not cat:
        raise HTTPException(404, "Category not found")
    allowed = {"label","caption","image_url","display_order","visible","slug"}
    for k, v in body.items():
        if k in allowed:
            cat[k] = v
    cat["updated_at"] = _now()
    _persist_db()
    return cat

@api.delete("/admin/categories/{cat_id}", dependencies=[Depends(require_admin)])
def admin_delete_category(cat_id: str):
    cats = mem.setdefault("categories", [])
    before = len(cats)
    mem["categories"] = [c for c in cats if c.get("id") != cat_id]
    if len(mem["categories"]) == before:
        raise HTTPException(404, "Category not found")
    _persist_db()
    return {"success": True}

# ── Admin: Suspend / Archive / Restore seller ─────────────────────────────────
@api.post("/admin/sellers/{shop_id}/suspend", dependencies=[Depends(require_admin)])
def admin_suspend_seller(shop_id: str, body: dict = {}):
    """Suspend a seller shop — removes from public frontend."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    reason = body.get("reason", "Suspended by admin")
    doc = mem_update("shops", shop_id, {
        "status": "suspended",
        "is_active": False,
        "online": False,
        "isSuspended": True,
        "suspension_reason": reason,
        "updated_at": _now(),
    })
    # Also disable the seller user account
    seller = next((u for u in mem["users"] if u.get("store_id") == shop_id and u.get("role") == "seller"), None)
    if seller:
        seller["is_suspended"] = True
        _persist_db()
    _notify_seller_status(shop, "suspended", reason)
    return {"success": True, "shop": doc}

@api.post("/admin/sellers/{shop_id}/unsuspend", dependencies=[Depends(require_admin)])
def admin_unsuspend_seller(shop_id: str):
    """Unsuspend a seller shop — restores according to normal visibility rules."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    doc = mem_update("shops", shop_id, {
        "status": "active",
        "is_active": True,
        "isSuspended": False,
        "suspension_reason": None,
        "updated_at": _now(),
    })
    seller = next((u for u in mem["users"] if u.get("store_id") == shop_id and u.get("role") == "seller"), None)
    if seller:
        seller["is_suspended"] = False
        _persist_db()
    _notify_seller_status(shop, "restored")
    return {"success": True, "shop": doc}

@api.post("/admin/sellers/{shop_id}/archive", dependencies=[Depends(require_admin)])
def admin_archive_seller(shop_id: str):
    """Archive/soft-delete a seller — removes from public, keeps history."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    doc = mem_update("shops", shop_id, {
        "status": "archived",
        "is_active": False,
        "online": False,
        "is_archived": True,
        "updated_at": _now(),
    })
    # Disable seller products
    for prod in mem.get("products", []):
        if prod.get("shop_id") == shop_id and prod.get("status") not in ("removed",):
            prod["_archived_status"] = prod.get("status")
            prod["status"] = "hidden"
            prod["is_active"] = False
    # Disable seller user
    seller = next((u for u in mem["users"] if u.get("store_id") == shop_id and u.get("role") == "seller"), None)
    if seller:
        seller["is_archived"] = True
        seller["is_suspended"] = True
    _persist_db()
    _notify_seller_status(shop, "archived")
    return {"success": True, "shop": doc}

@api.post("/admin/sellers/{shop_id}/restore", dependencies=[Depends(require_admin)])
def admin_restore_seller(shop_id: str):
    """Restore an archived seller — returns to active status with normal visibility rules."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    doc = mem_update("shops", shop_id, {
        "status": "active",
        "is_active": True,
        "is_archived": False,
        "isSuspended": False,
        "updated_at": _now(),
    })
    # Restore seller products to their previous statuses
    for prod in mem.get("products", []):
        if prod.get("shop_id") == shop_id and "_archived_status" in prod:
            prod["status"] = prod.pop("_archived_status")
            prod["is_active"] = prod["status"] == "live"
    # Restore seller user
    seller = next((u for u in mem["users"] if u.get("store_id") == shop_id and u.get("role") == "seller"), None)
    if seller:
        seller["is_archived"] = False
        seller["is_suspended"] = False
    _persist_db()
    _notify_seller_status(shop, "restored")
    return {"success": True, "shop": doc}

@api.delete("/admin/sellers/{shop_id}", dependencies=[Depends(require_admin)])
def admin_delete_seller(shop_id: str):
    """Permanently delete a seller — removes shop, user, products, slots, bookings.
    Cannot delete the admin/head store."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    if shop.get("is_admin_store"):
        raise HTTPException(400, "Cannot delete the admin store")
    # Notify the seller before we remove their data
    _notify_seller_status(shop, "deleted")
    # Delete all products belonging to this shop
    mem["products"] = [p for p in mem.get("products", []) if p.get("shop_id") != shop_id]
    # Delete all slots
    mem["slots"] = [s for s in mem.get("slots", []) if s.get("shop_id") != shop_id]
    # Remove the seller user
    mem["users"] = [u for u in mem.get("users", []) if u.get("store_id") != shop_id or u.get("role") != "seller"]
    # Remove the shop itself
    mem["shops"] = [s for s in mem.get("shops", []) if s.get("id") != shop_id]
    # Remove related seller applications so no orphaned records linger in the UI
    mem["seller_applications"] = [a for a in mem.get("seller_applications", []) if a.get("store_id") != shop_id]
    _persist_db()
    return {"success": True, "deleted_shop_id": shop_id}

@api.post("/admin/sellers/bulk-delete", dependencies=[Depends(require_admin)])
def admin_bulk_delete_sellers(body: dict):
    """Permanently delete multiple sellers at once.
    Body: { "shop_ids": ["shop-xxx", "shop-yyy"] }"""
    shop_ids = body.get("shop_ids", [])
    if not shop_ids:
        raise HTTPException(400, "No shop_ids provided")
    deleted = []
    skipped = []
    for shop_id in shop_ids:
        shop = mem_first("shops", id=shop_id)
        if not shop:
            skipped.append(shop_id)
            continue
        if shop.get("is_admin_store"):
            skipped.append(shop_id)
            continue
        _notify_seller_status(shop, "deleted")
        mem["products"] = [p for p in mem.get("products", []) if p.get("shop_id") != shop_id]
        mem["slots"] = [s for s in mem.get("slots", []) if s.get("shop_id") != shop_id]
        mem["users"] = [u for u in mem.get("users", []) if u.get("store_id") != shop_id or u.get("role") != "seller"]
        mem["shops"] = [s for s in mem.get("shops", []) if s.get("id") != shop_id]
        mem["seller_applications"] = [a for a in mem.get("seller_applications", []) if a.get("store_id") != shop_id]
        deleted.append(shop_id)
    _persist_db()
    return {"success": True, "deleted": deleted, "skipped": skipped}

# ══════════════════════════════════════════════════════════════════════════════
# SELLER AI STUDIO (Virtual Try-On + Product Image Generator via Gemini)
# Key is stored ONLY in env vars (Railway + local .env) — never in frontend/git.
# ══════════════════════════════════════════════════════════════════════════════
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
_AI_TRYON_DAILY_LIMIT = 10
_AI_PRODUCT_IMG_DAILY_LIMIT = 15

# ── Crafted prompts that produce distinct, high-quality results ──────────────
_TRYON_PROMPTS = {
    "saree": "Create a photo-realistic full-body image of a {model} model gracefully draping this exact saree. Show the pallu draped over the left shoulder, the pleats perfectly arranged at the front. Studio lighting with a soft cream background. The model should be standing in a natural pose with traditional Indian jewelry (gold necklace, jhumka earrings, bangles). Preserve EVERY color, border pattern, and motif of the original saree fabric EXACTLY.",
    "lehenga": "Create a photo-realistic full-body image of a {model} model wearing this exact lehenga set. Show the full skirt, choli blouse, and dupatta styled elegantly. The model should be in a graceful twirl or three-quarter pose in a palatial/wedding venue setting with warm golden lighting. Preserve ALL embroidery, zari work, colors, and design details of the original lehenga EXACTLY.",
    "kurta": "Create a photo-realistic full-body image of a {model} model wearing this exact kurta. Style it with matching bottoms (churidar for women, pajama for men). The model should be in a relaxed standing pose against a clean white/cream studio backdrop. Natural soft lighting. Preserve the exact fabric texture, print pattern, neckline design, and colors of the original kurta.",
    "sherwani": "Create a photo-realistic full-body image of a {model} model wearing this exact sherwani for a wedding. Style with churidar bottoms, mojari shoes, and a turban/safa. The model should be in a confident standing pose against a regal/palatial backdrop with warm dramatic lighting. Preserve ALL embroidery details, buttons, collar style, and fabric color EXACTLY.",
    "jewellery": "Create a photo-realistic close-up portrait of a {model} model wearing this exact piece of jewelry. If it's a necklace, show neck/collarbone area. If earrings, show the face from a slight angle. If a bracelet/bangle, show the wrist elegantly. Soft studio lighting with a blurred dark background. The jewelry must match the EXACT design, stones, metalwork, and proportions of the original image.",
    "western": "Create a photo-realistic full-body image of a {model} model wearing this exact western outfit. The model should be in a confident fashion-editorial pose against an urban/minimalist backdrop. Professional studio lighting. Preserve the exact cut, color, pattern, and styling details of the original garment.",
    "accessory": "Create a photo-realistic styled shot of a {model} model using/wearing this exact accessory. Show it in context — if a bag show it held or on the shoulder, if sunglasses show on the face, if a scarf show it draped. Clean background, editorial lighting. Preserve the exact color, material, hardware, and design details.",
    "chaniya choli": "Create a photo-realistic full-body image of a {model} model wearing this exact chaniya choli for Navratri/Garba. Show the flared skirt in motion (mid-twirl), the blouse/choli fitted perfectly, and the dupatta flowing. Festive colorful background with mirror work/lantern bokeh. Preserve ALL mirror work, embroidery, colors, and patterns EXACTLY.",
    "anarkali": "Create a photo-realistic full-body image of a {model} model wearing this exact Anarkali suit. Show the floor-length flared silhouette with the dupatta draped elegantly. Graceful standing pose against a soft palatial backdrop with warm lighting. Preserve ALL embroidery, colors, print and fabric of the original EXACTLY.",
    "gown": "Create a photo-realistic full-body image of a {model} model wearing this exact gown. Show the full length and silhouette with an elegant evening pose against a refined studio/hall backdrop with soft cinematic lighting. Preserve the exact colour, embellishment, drape and fabric of the original EXACTLY.",
    "salwar": "Create a photo-realistic full-body image of a {model} model wearing this exact salwar suit (kameez, bottoms and dupatta). Neat standing pose against a clean cream studio backdrop with soft natural lighting. Preserve the exact print, embroidery, neckline, colours and fabric of the original EXACTLY.",
    "suit": "Create a photo-realistic full-body image of a {model} model wearing this exact suit set styled with matching bottoms and dupatta. Elegant standing pose, clean studio backdrop, soft lighting. Preserve the exact colours, print, embroidery and fabric of the original EXACTLY.",
    "kurti": "Create a photo-realistic full-body image of a {model} model wearing this exact kurti styled with fitted bottoms. Relaxed contemporary pose against a minimal studio backdrop. Preserve the exact print, neckline, colours and fabric of the original EXACTLY.",
    "blouse": "Create a photo-realistic image of a {model} model wearing this exact blouse styled with a plain complementary saree/skirt so the blouse is the clear focus. Studio lighting, elegant pose. Preserve the EXACT colour, neckline, sleeve style, embroidery and fabric of the original blouse.",
    "dupatta": "Create a photo-realistic image of a {model} model draping this exact dupatta over a plain neutral outfit so the dupatta is the hero. Soft studio lighting, graceful drape across the shoulder. Preserve the EXACT colour, border, motif and fabric of the original dupatta.",
    "gharara": "Create a photo-realistic full-body image of a {model} model wearing this exact gharara/sharara set. Show the wide flared legs and short kurti with dupatta, festive elegant pose, warm palatial lighting. Preserve ALL embroidery, colours and patterns of the original EXACTLY.",
    "indo-western": "Create a photo-realistic full-body image of a {model} model wearing this exact indo-western outfit. Modern confident fashion-editorial pose against a minimalist urban backdrop, professional studio lighting. Preserve the exact cut, colour, drape and detailing of the original EXACTLY.",
    "dress": "Create a photo-realistic full-body image of a {model} model wearing this exact dress. Confident editorial pose against a clean modern backdrop with soft studio lighting. Preserve the exact cut, colour, print and fabric of the original EXACTLY.",
    "co-ord": "Create a photo-realistic full-body image of a {model} model wearing this exact co-ord set. Relaxed contemporary pose against a minimal studio backdrop, soft daylight. Preserve the exact print, colour and fabric of the original EXACTLY.",
    "kids": "Create a photo-realistic full-body image of a {model} child model wearing this exact outfit. Cheerful natural pose against a soft, bright studio backdrop. Preserve the exact colours, print, embroidery and fabric of the original EXACTLY.",
}

# Extra instruction appended per requested view (front vs back look).
_TRYON_VIEWS = {
    "front": " Photograph the model from the FRONT, facing the camera, so the full front of the outfit is clearly visible.",
    "back": " Photograph the model from BEHIND (back view), so the entire BACK of the outfit — back neckline, closures and any back detailing — is clearly visible. Keep the same model, outfit, colours and setting.",
}

_PRODUCT_PROMPTS = {
    "hero": {
        "studio_white": "Professional e-commerce hero product photograph of this {category} on a pure white seamless backdrop. Front-facing, perfectly centered, with soft diffused studio lighting from above and sides. No model, just the product laid flat or on an invisible mannequin. Sharp focus, high-resolution, clean shadows. The product fills 80% of the frame.",
        "lifestyle_warm": "Professional e-commerce hero shot of this {category} in a warm lifestyle setting. Draped on a vintage wooden surface or marble counter with golden-hour warm natural light streaming from the left. Soft depth-of-field background with dried flowers or brass decor. Product is the clear hero, sharp and prominent.",
        "dark_luxury": "Professional e-commerce hero shot of this {category} against a rich dark velvet/black marble backdrop. Dramatic single spotlight from above creating elegant shadows. Gold accent light from the side. The product glows against the dark background. Luxury jewelry-brand aesthetic.",
        "outdoor_natural": "Professional e-commerce hero shot of this {category} in a natural outdoor setting. Draped on a stone surface or hung on a rustic wooden stand in a garden/terrace. Soft natural daylight, slight bokeh greenery in background. Fresh, airy, organic aesthetic.",
    },
    "detail": {
        "studio_white": "Extreme close-up macro photograph of this {category} showing fabric texture, weave pattern, or craftsmanship details. White background, ring-light illumination revealing every thread and stitch. Focus stacking for maximum sharpness. Show the quality of material — if silk show the sheen, if embroidered show the thread work.",
        "lifestyle_warm": "Close-up detail shot of this {category} with warm-toned side lighting revealing texture. Show embroidery stitches, fabric weave, button details, or hardware close-up. Shallow depth of field with warm bokeh. The craftsmanship should be the star.",
        "dark_luxury": "Close-up detail shot of this {category} with dramatic lighting on dark background. A single beam of light catches the metallic threads, sequins, or zari work. The darkness around makes the details pop. Luxury watch-ad level close-up photography.",
        "outdoor_natural": "Close-up detail shot of this {category} in natural daylight. Lay the fabric detail section on a stone or leaf, showing texture against nature. Macro lens with shallow DOF. The natural light brings out true colors.",
    },
    "lifestyle": {
        "studio_white": "Lifestyle context shot: this {category} folded neatly in a premium gift box with tissue paper, as if being unboxed. Clean white surface, overhead shot angle. A hand reaching to pick it up. Premium unboxing experience aesthetic.",
        "lifestyle_warm": "Lifestyle context shot: this {category} draped over the arm of a person walking through a sunlit Indian marketplace/haveli corridor. Motion blur on the background, product sharp. The story of the product in its cultural context.",
        "dark_luxury": "Lifestyle context shot: this {category} displayed on a dark wooden mannequin bust or hanger in a luxury boutique setting. Moody ambient lighting, other premium items slightly visible in background. Exclusive boutique feel.",
        "outdoor_natural": "Lifestyle context shot: this {category} hanging on a clothesline or draped over a balcony railing with a beautiful Indian cityscape/landscape behind. Morning light, gentle breeze making fabric flutter slightly. Aspirational lifestyle image.",
    },
    "front": {
        "studio_white": "Professional e-commerce FRONT-VIEW product photograph of this {category} shown from the front on an invisible mannequin against a pure white seamless backdrop. Perfectly centered and symmetrical, soft diffused studio lighting, sharp focus. The full front of the garment is clearly visible.",
        "lifestyle_warm": "Front-view product shot of this {category} on an invisible mannequin in a warm-toned studio, golden natural light from the left. The complete front of the garment is clearly and symmetrically visible, sharp and prominent.",
        "dark_luxury": "Front-view product shot of this {category} on an invisible mannequin against a rich dark backdrop with a dramatic spotlight. The full front of the garment glows, elegant luxury aesthetic.",
        "outdoor_natural": "Front-view product shot of this {category} on an invisible mannequin in a soft natural outdoor setting. The complete front of the garment is clearly visible with fresh daylight.",
    },
    "back": {
        "studio_white": "Professional e-commerce BACK-VIEW product photograph of this {category} shown from BEHIND on an invisible mannequin against a pure white seamless backdrop. Show the complete BACK of the garment — back neckline, back panel, closures, and any back detailing. Perfectly centered, soft studio lighting, sharp focus. Preserve the exact colours, prints and fabric of the original.",
        "lifestyle_warm": "Back-view product shot of this {category} photographed from behind on an invisible mannequin, warm studio lighting. Show the entire BACK of the garment and its detailing clearly, preserving the original colours and fabric.",
        "dark_luxury": "Back-view product shot of this {category} from behind on an invisible mannequin against a dark luxury backdrop with a spotlight. The full BACK of the garment is clearly visible, preserving the original design and colours.",
        "outdoor_natural": "Back-view product shot of this {category} from behind on an invisible mannequin in a natural outdoor setting with soft daylight. The complete BACK of the garment is clearly shown, true to the original colours.",
    },
}

def _get_tryon_prompt(category: str, model_type: str, view: str = "front") -> str:
    model_desc = model_type.replace("_", " ")
    cat = category.lower().strip()
    template = _TRYON_PROMPTS.get(cat, _TRYON_PROMPTS.get("western"))
    prompt = template.format(model=model_desc)
    return prompt + _TRYON_VIEWS.get(view, _TRYON_VIEWS["front"])

def _get_product_prompt(shot_type: str, style: str, category: str) -> str:
    style_prompts = _PRODUCT_PROMPTS.get(shot_type, _PRODUCT_PROMPTS["hero"])
    template = style_prompts.get(style, style_prompts.get("studio_white"))
    scene = template.format(category=category)
    # Preservation preamble — the model must keep the EXACT uploaded product
    # (same colours, patterns, fabric, design) and only restyle the scene/lighting.
    return (
        "Using the product in the uploaded image, create a new photograph. "
        "Preserve the EXACT same product — identical colours, prints, patterns, "
        "embroidery, fabric, texture and design details. Do NOT invent a different "
        "product or change its appearance. Only change the scene, background, "
        "lighting and composition as follows: " + scene +
        " No text, no watermark, no logo. Photorealistic, high resolution."
    )

def _ai_usage_today(seller_id: str) -> dict:
    """Count today's AI generations for a seller.
    Premium / the ShopLiveBharat main store get UNLIMITED usage (no caps)."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    gens = mem.get("ai_generations", [])
    tryon = sum(1 for g in gens if g.get("seller_id") == seller_id and g.get("type") == "tryon" and (g.get("created_at") or "").startswith(today))
    product_img = sum(1 for g in gens if g.get("seller_id") == seller_id and g.get("type") == "product_images" and (g.get("created_at") or "").startswith(today))
    # Unlimited for our own store / premium sellers.
    if _seller_is_premium(seller_id):
        return {"unlimited": True,
                "tryon_used": tryon, "tryon_limit": None, "tryon_remaining": None,
                "product_img_used": product_img, "product_img_limit": None, "product_img_remaining": None}
    return {"unlimited": False,
            "tryon_used": tryon, "tryon_limit": _AI_TRYON_DAILY_LIMIT, "tryon_remaining": max(0, _AI_TRYON_DAILY_LIMIT - tryon),
            "product_img_used": product_img, "product_img_limit": _AI_PRODUCT_IMG_DAILY_LIMIT, "product_img_remaining": max(0, _AI_PRODUCT_IMG_DAILY_LIMIT - product_img)}

# Candidate image-EDITING models (accept an input image → preserve the product).
# Used for Virtual Try-On. Tried in order; the winner is cached.
_GEMINI_IMAGE_MODELS = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-3-pro-image",
]
# Imagen 4 Fast — text-to-image, used for the Product Image generator.
_IMAGEN_MODEL = os.environ.get("IMAGEN_MODEL", "imagen-4.0-fast-generate-001")
# Text models for the analysis fallback (in priority order).
_GEMINI_TEXT_MODELS = [
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]
_GEMINI_IMAGE_MODEL_CACHE = {"name": None}
_GEMINI_TEXT_MODEL_CACHE = {"name": None}

def _call_gemini_image(prompt: str, image_bytes: bytes, mime_type: str) -> Optional[str]:
    """Call a Gemini image-generation model using the google-genai SDK.
    Tries several known image-capable models until one returns an image, and
    caches the working model name. Returns base64-encoded PNG/JPEG bytes or None."""
    import base64 as _b64_ai
    try:
        from google import genai
        from google.genai import types
    except Exception as e:
        logger.warning(f"[AI] google-genai SDK import failed: {e}")
        return None
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        cfg = types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
        # Try the cached model first, then the rest.
        cached = _GEMINI_IMAGE_MODEL_CACHE.get("name")
        order = ([cached] if cached else []) + [m for m in _GEMINI_IMAGE_MODELS if m != cached]
        last_err = None
        for model_name in order:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[prompt, image_part],
                    config=cfg,
                )
                if response.candidates:
                    for part in response.candidates[0].content.parts:
                        inline = getattr(part, "inline_data", None)
                        if inline and getattr(inline, "data", None):
                            _GEMINI_IMAGE_MODEL_CACHE["name"] = model_name
                            data = inline.data
                            # SDK may already return bytes; ensure base64 str
                            if isinstance(data, (bytes, bytearray)):
                                return _b64_ai.b64encode(bytes(data)).decode()
                            return data if isinstance(data, str) else _b64_ai.b64encode(bytes(data)).decode()
                # No image in a successful response — try next model.
            except Exception as inner:
                last_err = inner
                msg = str(inner)
                # 404 / not-supported → try the next candidate model.
                if "404" in msg or "not found" in msg.lower() or "not supported" in msg.lower():
                    continue
                # Other errors (quota, safety) — stop trying more models.
                break
        if last_err:
            logger.warning(f"[AI] Gemini image gen failed on all models. Last error: {last_err}")
    except Exception as e:
        logger.warning(f"[AI] Gemini image gen failed: {e}")
    return None

def _call_gemini_image_multi(prompt: str, images: list) -> Optional[str]:
    """Gemini image-editing with MULTIPLE input images (e.g. person + garment).
    `images` is a list of (bytes, mime_type). Returns base64 image or None."""
    import base64 as _b64_ai
    try:
        from google import genai
        from google.genai import types
    except Exception as e:
        logger.warning(f"[AI] google-genai SDK import failed: {e}")
        return None
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        parts = [prompt] + [types.Part.from_bytes(data=b, mime_type=m) for (b, m) in images]
        cfg = types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
        cached = _GEMINI_IMAGE_MODEL_CACHE.get("name")
        order = ([cached] if cached else []) + [m for m in _GEMINI_IMAGE_MODELS if m != cached]
        last_err = None
        for model_name in order:
            try:
                response = client.models.generate_content(model=model_name, contents=parts, config=cfg)
                if response.candidates:
                    for part in response.candidates[0].content.parts:
                        inline = getattr(part, "inline_data", None)
                        if inline and getattr(inline, "data", None):
                            _GEMINI_IMAGE_MODEL_CACHE["name"] = model_name
                            data = inline.data
                            if isinstance(data, (bytes, bytearray)):
                                return _b64_ai.b64encode(bytes(data)).decode()
                            return data if isinstance(data, str) else _b64_ai.b64encode(bytes(data)).decode()
            except Exception as inner:
                last_err = inner
                msg = str(inner)
                if "404" in msg or "not found" in msg.lower() or "not supported" in msg.lower():
                    continue
                break
        if last_err:
            logger.warning(f"[AI] Gemini multi-image gen failed on all models. Last error: {last_err}")
    except Exception as e:
        logger.warning(f"[AI] Gemini multi-image gen error: {e}")
    return None

def _call_imagen(prompt: str) -> Optional[str]:
    """Generate a fresh image from a text prompt using Imagen 4 Fast.
    Returns base64-encoded image bytes or None. (Text-to-image: does not take
    an input photo, so it produces a new studio-quality render of the prompt.)"""
    import base64 as _b64_ai
    try:
        from google import genai
        from google.genai import types
    except Exception as e:
        logger.warning(f"[AI] google-genai SDK import failed: {e}")
        return None
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        resp = client.models.generate_images(
            model=_IMAGEN_MODEL,
            prompt=prompt,
            config=types.GenerateImagesConfig(number_of_images=1),
        )
        imgs = getattr(resp, "generated_images", None) or []
        if imgs:
            data = getattr(imgs[0].image, "image_bytes", None)
            if data:
                if isinstance(data, (bytes, bytearray)):
                    return _b64_ai.b64encode(bytes(data)).decode()
                return data if isinstance(data, str) else _b64_ai.b64encode(bytes(data)).decode()
    except Exception as e:
        logger.warning(f"[AI] Imagen generation failed: {e}")
    return None

def _call_gemini_text(prompt_parts) -> Optional[str]:
    """Call a Gemini text model for the analysis fallback, trying candidates."""
    try:
        from google import genai
    except Exception:
        return None
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        cached = _GEMINI_TEXT_MODEL_CACHE.get("name")
        order = ([cached] if cached else []) + [m for m in _GEMINI_TEXT_MODELS if m != cached]
        for model_name in order:
            try:
                resp = client.models.generate_content(model=model_name, contents=prompt_parts)
                if resp and resp.text:
                    _GEMINI_TEXT_MODEL_CACHE["name"] = model_name
                    return resp.text
            except Exception as inner:
                msg = str(inner)
                if "404" in msg or "not found" in msg.lower() or "not supported" in msg.lower():
                    continue
                break
    except Exception as e:
        logger.warning(f"[AI] Gemini text gen failed: {e}")
    return None

# ══════════════════════════════════════════════════════════════════════════════
# SMART SIZE RECOMMENDATION
# Customer enters height + weight and records a guided 360° scan. We estimate
# body measurements (Gemini vision anchored on height/weight, with a
# deterministic anthropometric fallback), compare against the seller's size
# chart, and return a recommended size + confidence + expected fit.
# Body-profile data is encrypted at rest; scan frames are NEVER stored and
# NEVER shared with sellers.
# ══════════════════════════════════════════════════════════════════════════════

def _size_fernet():
    """Derive a stable Fernet key from the server secret (no extra env needed)."""
    try:
        import hashlib as _hl, base64 as _b64
        from cryptography.fernet import Fernet
        digest = _hl.sha256((JWT_SECRET + "|" + HASH_SALT + "|bodyprofile").encode()).digest()
        return Fernet(_b64.urlsafe_b64encode(digest))
    except Exception as e:
        logger.warning(f"[SIZE] Fernet unavailable ({e}); using obfuscated fallback.")
        return None

def _encrypt_profile(data: dict) -> str:
    import json as _json, base64 as _b64
    raw = _json.dumps(data).encode()
    f = _size_fernet()
    if f:
        return "f1:" + f.encrypt(raw).decode()
    return "b64:" + _b64.b64encode(raw).decode()

def _decrypt_profile(token: str) -> Optional[dict]:
    import json as _json, base64 as _b64
    try:
        if token.startswith("f1:"):
            f = _size_fernet()
            return _json.loads(f.decrypt(token[3:].encode()).decode()) if f else None
        if token.startswith("b64:"):
            return _json.loads(_b64.b64decode(token[4:]).decode())
    except Exception as e:
        logger.warning(f"[SIZE] decrypt error: {e}")
    return None

def _clamp(v, lo, hi):
    return max(lo, min(hi, v))

def _to_cm(value: float, unit: str) -> float:
    return value * 2.54 if unit == "in" else value

def _to_in(value: float, unit: str) -> float:
    return value / 2.54 if unit == "cm" else value

def _norm_gender(g: str) -> str:
    g = (g or "").lower()
    if g.startswith("m"):
        return "male"
    return "female"

def _estimate_body_from_hw(height_cm: float, weight_kg: float, gender: str) -> dict:
    """Deterministic anthropometric estimate (inches). Monotonic in height &
    weight and clamped to plausible adult ranges. Used as a prior/fallback."""
    h_m = max(1.2, height_cm / 100.0)
    bmi = _clamp(weight_kg / (h_m * h_m), 14, 45)
    if _norm_gender(gender) == "male":
        chest = _clamp(34 + (bmi - 18) * 1.05, 32, 56)
        waist = _clamp(chest - 8 + (bmi - 22) * 0.55, 26, 52)
        hip = _clamp(chest - 2 + (bmi - 22) * 0.25, 30, 54)
        shoulder = _clamp(16 + (height_cm - 160) * 0.03, 15, 20)
        sleeve = _clamp(height_cm * 0.156 / 2.54, 22, 28)
    else:
        chest = _clamp(30 + (bmi - 17) * 0.98, 28, 52)
        waist = _clamp(chest - 10 + (bmi - 21) * 0.45, 22, 48)
        hip = _clamp(chest + 2 + (bmi - 21) * 0.25, 30, 56)
        shoulder = _clamp(13 + (height_cm - 150) * 0.03, 12.5, 18)
        sleeve = _clamp(height_cm * 0.145 / 2.54, 18, 26)
    length = _clamp(height_cm * 0.42 / 2.54, 30, 60)
    return {
        "chest": round(chest, 1), "bust": round(chest, 1), "waist": round(waist, 1),
        "hip": round(hip, 1), "shoulder": round(shoulder, 1), "sleeve": round(sleeve, 1),
        "length": round(length, 1),
    }

def _analyze_scan_with_gemini(frames: list, height_cm: float, weight_kg: float, gender: str) -> Optional[dict]:
    """Ask Gemini to estimate body measurements + quality flags from scan frames.
    Returns dict with measurements (cm) and flags, or None if unavailable."""
    if not GEMINI_API_KEY or not frames:
        return None
    try:
        import json as _json
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=GEMINI_API_KEY)
        parts = [(
            "You are a body-measurement estimation assistant for apparel sizing. "
            f"The person is {height_cm:.0f} cm tall and weighs {weight_kg:.0f} kg, gender {_norm_gender(gender)}. "
            "These frames are a guided 360-degree body scan (front, sides, back). "
            "Estimate their body measurements in CENTIMETRES using the height as a scale reference. "
            "Also judge scan quality. Respond with ONLY strict minified JSON, no prose, in this exact shape: "
            '{"body_visible":true,"lighting_ok":true,"fitted_clothing":true,'
            '"chest_cm":0,"waist_cm":0,"hip_cm":0,"shoulder_cm":0,"sleeve_cm":0,'
            '"confidence":0.0}. confidence is 0..1.'
        )]
        for fb, mime in frames[:6]:
            parts.append(types.Part.from_bytes(data=fb, mime_type=mime))
        cached = _GEMINI_TEXT_MODEL_CACHE.get("name")
        order = ([cached] if cached else []) + [m for m in _GEMINI_TEXT_MODELS if m != cached]
        for model_name in order:
            try:
                resp = client.models.generate_content(model=model_name, contents=parts)
                if resp and resp.text:
                    _GEMINI_TEXT_MODEL_CACHE["name"] = model_name
                    txt = resp.text.strip()
                    s, e = txt.find("{"), txt.rfind("}")
                    if s >= 0 and e > s:
                        return _json.loads(txt[s:e + 1])
            except Exception as inner:
                msg = str(inner)
                if "404" in msg or "not found" in msg.lower() or "not supported" in msg.lower():
                    continue
                break
    except Exception as e:
        logger.warning(f"[SIZE] Gemini scan error: {e}")
    return None

def _blend_measurements(est: dict, gem: Optional[dict]) -> tuple:
    """Blend Gemini estimate (cm) with the anthropometric prior (inches).
    Returns (measurements_in_inches, confidence_str, source)."""
    if not gem:
        return est, "medium", "estimate"
    keys = [("chest", "chest_cm"), ("waist", "waist_cm"), ("hip", "hip_cm"), ("shoulder", "shoulder_cm"), ("sleeve", "sleeve_cm")]
    out = dict(est)
    agree = 0
    counted = 0
    for ik, ck in keys:
        gv_cm = gem.get(ck)
        if not gv_cm or gv_cm <= 0:
            continue
        gv_in = gv_cm / 2.54
        prior = est.get(ik, gv_in)
        counted += 1
        # Reject wild hallucinations: keep within ±35% of the prior.
        lo, hi = prior * 0.65, prior * 1.35
        if lo <= gv_in <= hi:
            out[ik] = round(0.6 * gv_in + 0.4 * prior, 1)
            if abs(gv_in - prior) <= prior * 0.12:
                agree += 1
        else:
            out[ik] = round(prior, 1)
    out["bust"] = out.get("chest", out.get("bust"))
    gem_conf = float(gem.get("confidence") or 0)
    quality_ok = bool(gem.get("body_visible")) and bool(gem.get("lighting_ok"))
    if quality_ok and gem_conf >= 0.7 and counted and agree >= max(1, counted - 1):
        conf = "high"
    elif quality_ok and counted:
        conf = "medium"
    else:
        conf = "low"
    return out, conf, "scan"

# ── Backend size charts (fallback when a seller hasn't uploaded one) ──────────
def _backend_size_type(category: str) -> str:
    c = (category or "").lower()
    if any(k in c for k in ["jewel", "accessor", "bag", "wallet", "belt", "cap", "sock", "home", "fabric", "dupatta", "shawl", "footwear", "saree"]):
        return "none"
    if any(k in c for k in ["sherwani", "kurta", "shirt", "jacket", "waistcoat", "blazer", "men"]):
        return "men"
    if "kid" in c:
        return "kids"
    return "women"

def _default_size_chart(category: str) -> Optional[dict]:
    """A reasonable garment chart (inches) per category, monotonic across sizes."""
    t = _backend_size_type(category)
    if t == "none":
        return None
    if t == "men":
        base = [("S", 38), ("M", 40), ("L", 42), ("XL", 44), ("XXL", 46)]
        sizes = [{"size": s, "chest": ch, "waist": ch - 6, "hip": ch - 2,
                  "shoulder": round(16 + i * 0.4, 1), "sleeve": round(23 + i * 0.4, 1),
                  "length": round(28 + i * 0.6, 1)} for i, (s, ch) in enumerate(base)]
    elif t == "kids":
        base = [("2-3Y", 22), ("4-5Y", 24), ("6-7Y", 26), ("8-9Y", 28), ("10-11Y", 30)]
        sizes = [{"size": s, "chest": ch, "waist": ch - 2, "hip": ch + 2,
                  "shoulder": round(10 + i * 0.4, 1), "length": round(20 + i * 3, 1)} for i, (s, ch) in enumerate(base)]
    else:
        base = [("XS", 32), ("S", 34), ("M", 36), ("L", 38), ("XL", 40), ("XXL", 42)]
        sizes = [{"size": s, "bust": b, "chest": b, "waist": b - 4, "hip": b + 2,
                  "shoulder": round(13 + i * 0.35, 1), "sleeve": round(18 + i * 0.3, 1),
                  "length": round(38 + i * 0.5, 1)} for i, (s, b) in enumerate(base)]
    return {"unit": "in", "sizes": sizes}

def _chart_rows_in_inches(chart: dict) -> list:
    """Normalise a chart's rows to inches, keeping only measured girths."""
    unit = (chart.get("unit") or "in").lower()
    rows = []
    for row in chart.get("sizes", []):
        label = row.get("size") or row.get("label")
        if not label:
            continue
        r = {"size": str(label)}
        for k in ("chest", "bust", "waist", "hip", "shoulder", "sleeve", "length"):
            v = row.get(k)
            try:
                if v not in (None, "", 0, "0"):
                    r[k] = _to_in(float(v), unit)
            except (TypeError, ValueError):
                continue
        rows.append(r)
    return rows

def _recommend_size(measurements_in: dict, chart: dict, category: str) -> Optional[dict]:
    """Compare body girths (inches) to a garment chart (inches) and pick a size.
    Uses ease allowances on the primary girths (bust/chest, waist, hip)."""
    rows = _chart_rows_in_inches(chart or {})
    if not rows:
        return None
    gender = "male" if _backend_size_type(category) == "men" else "female"
    primary = "chest" if gender == "male" else "bust"
    # metric -> (ideal ease inches, weight)
    metric_cfg = {primary: (2.5, 3.0), "waist": (2.0, 2.0), "hip": (2.5, 2.0)}
    body = dict(measurements_in)
    body.setdefault("bust", body.get("chest"))
    body.setdefault("chest", body.get("bust"))

    scored = []
    for row in rows:
        total_w = 0.0
        total_score = 0.0
        too_tight = False
        eases = {}
        for metric, (ideal, w) in metric_cfg.items():
            g = row.get(metric)
            b = body.get(metric)
            if g is None or b is None:
                continue
            ease = g - b
            eases[metric] = ease
            # Gaussian closeness to the ideal ease; hard penalty if garment < body.
            if ease < 0:
                too_tight = True
                s = max(0.0, 1.0 - (abs(ease) / 3.0)) * 0.35
            else:
                s = math.exp(-((ease - ideal) ** 2) / (2 * (2.2 ** 2)))
            total_score += s * w
            total_w += w
        if total_w == 0:
            continue
        scored.append({"size": row["size"], "score": total_score / total_w,
                       "primary_ease": eases.get(primary), "too_tight": too_tight})
    if not scored:
        return None
    order = [r["size"] for r in rows]
    scored.sort(key=lambda x: x["score"], reverse=True)
    best = scored[0]
    second = scored[1] if len(scored) > 1 else None

    # Expected fit from ease on the primary girth.
    pe = best.get("primary_ease")
    if pe is None:
        fit = "Regular"
    elif pe < 1.5:
        fit = "Slim"
    elif pe <= 4.5:
        fit = "Regular"
    else:
        fit = "Loose"

    # Confidence from score strength + separation from the runner-up.
    margin = (best["score"] - second["score"]) if second else 0.4
    if best["score"] >= 0.7 and margin >= 0.12 and not best["too_tight"]:
        confidence = "High"
    elif best["score"] >= 0.45 and not best["too_tight"]:
        confidence = "Medium"
    else:
        confidence = "Low"

    # Alternative: one size up for a looser fit (or down if already loose).
    idx = order.index(best["size"]) if best["size"] in order else -1
    alt = None
    if idx >= 0:
        if fit in ("Slim", "Regular") and idx + 1 < len(order):
            alt = {"size": order[idx + 1], "note": "for a looser fit"}
        elif fit == "Loose" and idx - 1 >= 0:
            alt = {"size": order[idx - 1], "note": "for a slimmer fit"}
    return {"recommended_size": best["size"], "confidence": confidence,
            "fit": fit, "alternative": alt, "score": round(best["score"], 3)}


class SizeRecommendIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: Optional[str] = None
    category: Optional[str] = None
    measurements: Optional[dict] = None   # inches; if omitted, uses saved profile
    size_chart: Optional[dict] = None     # optional inline chart override


@api.post("/size/scan")
@limiter.limit("20/minute")
async def size_scan(request: Request,
                    height: float = Form(...), weight: float = Form(...),
                    height_unit: str = Form("cm"), weight_unit: str = Form("kg"),
                    gender: str = Form("female"), consent_save: bool = Form(False),
                    frames: List[UploadFile] = File(default=[]),
                    payload: Optional[dict] = Depends(optional_user)):
    """Estimate body measurements from a guided 360° scan + height/weight."""
    if height_unit == "ft":
        height_cm = float(height) * 30.48      # value given in decimal feet
    elif height_unit == "in":
        height_cm = float(height) * 2.54
    else:
        height_cm = float(height)
    weight_kg = float(weight) * 0.453592 if weight_unit == "lbs" else float(weight)
    if not (120 <= height_cm <= 220):
        raise HTTPException(400, "Please enter a valid height.")
    if not (25 <= weight_kg <= 250):
        raise HTTPException(400, "Please enter a valid weight.")

    # Read + lightly validate frames (never stored).
    frame_data = []
    dark_frames = 0
    for f in frames[:8]:
        if f.content_type not in ("image/jpeg", "image/png", "image/webp"):
            continue
        b = await f.read()
        if not b or len(b) > 5 * 1024 * 1024:
            continue
        frame_data.append((b, f.content_type))
        try:
            from PIL import Image as _PILImage
            import io as _io
            im = _PILImage.open(_io.BytesIO(b)).convert("L").resize((64, 64))
            px = list(im.getdata())
            if (sum(px) / len(px)) < 42:
                dark_frames += 1
        except Exception:
            pass

    if frame_data and dark_frames >= max(2, len(frame_data) - 1):
        return {"ok": False, "retry": True,
                "reason": "The scan looks too dark. Please move to a well-lit area and try again."}

    est = _estimate_body_from_hw(height_cm, weight_kg, gender)
    gem = _analyze_scan_with_gemini(frame_data, height_cm, weight_kg, gender) if frame_data else None
    if gem and (gem.get("body_visible") is False):
        return {"ok": False, "retry": True,
                "reason": "We couldn't see your full body. Stand 2–3 m back so your whole body is visible, then rescan."}
    measurements, confidence, source = _blend_measurements(est, gem)

    saved = False
    if payload and consent_save:
        profile = {
            "measurements": measurements, "confidence": confidence, "source": source,
            "height_cm": round(height_cm, 1), "weight_kg": round(weight_kg, 1),
            "gender": _norm_gender(gender), "updated_at": _now(),
        }
        existing = mem_first("size_profiles", user_id=payload["sub"])
        enc = _encrypt_profile(profile)
        if existing:
            mem_update("size_profiles", existing["id"], {"enc": enc, "updated_at": _now()})
        else:
            mem_insert("size_profiles", {"id": str(uuid.uuid4()), "user_id": payload["sub"],
                                         "enc": enc, "updated_at": _now()})
        saved = True

    return {"ok": True, "measurements": measurements, "confidence": confidence,
            "source": source, "saved": saved}


@api.post("/size/recommend")
async def size_recommend(body: SizeRecommendIn, payload: Optional[dict] = Depends(optional_user)):
    """Return a size recommendation for a product given body measurements."""
    measurements = body.measurements
    if not measurements and payload:
        prof = mem_first("size_profiles", user_id=payload["sub"])
        if prof:
            dec = _decrypt_profile(prof.get("enc", ""))
            if dec:
                measurements = dec.get("measurements")
    if not measurements:
        raise HTTPException(400, "No measurements provided. Please run a scan first.")

    category = body.category or ""
    chart = body.size_chart if (body.size_chart and body.size_chart.get("sizes")) else None
    used_seller_chart = bool(chart)
    if not chart and body.product_id:
        prod = mem_first("products", id=body.product_id)
        if prod:
            category = category or prod.get("category", "")
            pc = prod.get("size_chart")
            if isinstance(pc, dict) and pc.get("sizes"):
                chart = pc
                used_seller_chart = True
    if not chart:
        chart = _default_size_chart(category)
        used_seller_chart = False
    if not chart:
        raise HTTPException(400, "This product category does not use sizes.")

    result = _recommend_size(measurements, chart, category)
    if not result and used_seller_chart:
        # Seller chart had no usable girths — fall back to the category default.
        dc = _default_size_chart(category)
        if dc:
            result = _recommend_size(measurements, dc, category)
            used_seller_chart = False
    if not result:
        raise HTTPException(422, "Could not compute a recommendation for this size chart.")
    result["used_seller_chart"] = used_seller_chart
    return result


# ── Customer AI Try-On ───────────────────────────────────────────────────────
# The customer uploads their own photo; we dress them in this product using
# Gemini image-editing, prioritising the seller's private 360° garment profile.
# The uploaded photo is processed only and NEVER stored.
@api.post("/try-on")
@limiter.limit("6/minute")
async def customer_try_on(request: Request, image: UploadFile = File(...),
                          product_id: str = Form(...),
                          payload: Optional[dict] = Depends(optional_user)):
    if not GEMINI_API_KEY:
        raise HTTPException(503, "AI Try-On isn’t available right now. Please try later.")
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Please upload a JPEG, PNG or WebP photo.")
    person = await image.read()
    if not person:
        raise HTTPException(400, "The photo appears to be empty.")
    if len(person) > 10 * 1024 * 1024:
        raise HTTPException(400, "Photo must be under 10MB.")
    prod = mem_first("products", id=product_id)
    if not prod:
        raise HTTPException(404, "Product not found.")
    garment_url = prod.get("image_url") or (prod.get("images") or [None])[0]
    if not garment_url:
        raise HTTPException(422, "This product has no image to try on.")
    garment = _fetch_url_bytes(garment_url)
    if not garment:
        raise HTTPException(422, "Couldn’t load the product image. Please try again.")
    category = prod.get("category", "outfit")
    snippet = _ai_training_prompt_snippet(product_id)
    prompt = (
        snippet +
        f"Create a photorealistic image of the PERSON in the FIRST image wearing the exact {category} "
        "shown in the SECOND image. Keep the person's face, hair, body shape, skin tone and pose "
        "unchanged — replace ONLY their clothing with this garment. Preserve the garment's EXACT colours, "
        "prints, patterns, embroidery, fabric, texture and design. Ensure a natural, realistic fit and drape. "
        "Full-body composition, clean lighting. No text, no watermark, no logo."
    )
    result = _call_gemini_image_multi(prompt, [(person, image.content_type), (garment, "image/jpeg")])
    if not result:
        raise HTTPException(422, "Our AI couldn’t create a try-on from this photo. Try a clear, well-lit full-body photo.")
    # Note: the customer photo is intentionally NOT stored.
    return {"image": result, "generated": True, "ai_optimized": bool(snippet)}


@api.get("/size/profile")
async def size_get_profile(payload: dict = Depends(get_current_user)):
    """Return the caller's saved body profile (measurements only — never images)."""
    prof = mem_first("size_profiles", user_id=payload["sub"])
    if not prof:
        return {"exists": False}
    dec = _decrypt_profile(prof.get("enc", "")) or {}
    return {"exists": True, "profile": dec, "updated_at": prof.get("updated_at")}


@api.delete("/size/profile")
async def size_delete_profile(payload: dict = Depends(get_current_user)):
    """Delete the caller's saved body profile permanently."""
    prof = mem_first("size_profiles", user_id=payload["sub"])
    if prof:
        mem_delete("size_profiles", prof["id"])
    return {"success": True, "deleted": bool(prof)}


@api.get("/seller/ai/usage")
async def ai_usage(payload: dict = Depends(require_seller)):
    u = _ai_usage_today(payload["sub"])
    u["enabled"] = payload.get("role") == "admin" or _seller_ai_enabled(payload["sub"])
    return u

@api.post("/seller/ai/tryon")
@limiter.limit("10/minute")
async def ai_tryon(request: Request, image: UploadFile = File(...), model_type: str = Form("female_indian"), category: str = Form("saree"), product_id: str = Form(""), payload: dict = Depends(require_ai_seller)):
    """Generate a virtual try-on image using Gemini."""
    if not GEMINI_API_KEY:
        raise HTTPException(503, "AI Studio is not configured. Contact admin.")
    usage = _ai_usage_today(payload["sub"])
    if usage["tryon_remaining"] is not None and usage["tryon_remaining"] <= 0:
        raise HTTPException(429, f"Daily limit reached ({_AI_TRYON_DAILY_LIMIT} try-ons/day). Try again tomorrow.")
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are accepted.")
    content = await image.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 10MB.")
    # Prioritise the seller's private 360° garment study when available.
    profile_snippet = _ai_training_prompt_snippet(product_id)
    # Generate a FRONT look and a BACK look of the model wearing the garment.
    views = ["front", "back"]
    try:
        import base64 as _b64_ai
        images = []
        captions = []
        real_count = 0
        text_analysis = None
        for view in views:
            prompt = profile_snippet + _get_tryon_prompt(category, model_type, view)
            img = _call_gemini_image(prompt, content, image.content_type)
            if img:
                images.append(img)
                captions.append(f"{view.title()} look — {category.title()} on a {model_type.replace('_', ' ')} model")
                real_count += 1
            else:
                # Fallback: original image + a one-time text styling analysis.
                if text_analysis is None:
                    from google.genai import types as _genai_types
                    image_part = _genai_types.Part.from_bytes(data=content, mime_type=image.content_type)
                    txt = _call_gemini_text([
                        f"Analyze this {category} product image. Describe how it would look on a {model_type.replace('_', ' ')} model, "
                        f"front and back. Include styling, draping, color harmony, and suggested accessories. Be specific and vivid.",
                        image_part
                    ])
                    text_analysis = txt if txt else "AI analysis complete."
                images.append(_b64_ai.b64encode(content).decode())
                captions.append(f"{view.title()} look (styling guide)")
    except Exception as e:
        logger.warning(f"[AI] Gemini tryon error: {e}")
        raise HTTPException(422, "Our AI couldn't process this image. Please try a different photo or category.")
    generated = real_count > 0
    caption = captions[0] if generated else (text_analysis or "AI analysis complete.")
    # Record generation (a single try-on request = one usage unit)
    gen = {"id": str(uuid.uuid4()), "seller_id": payload["sub"], "type": "tryon",
           "model_type": model_type, "category": category, "caption": caption[:500],
           "ai_optimized": bool(profile_snippet), "created_at": _now()}
    mem.setdefault("ai_generations", []).append(gen)
    _persist_db()
    return {"image": images[0], "images": images, "captions": captions,
            "caption": caption, "generated": generated,
            "ai_optimized": bool(profile_snippet), "usage": _ai_usage_today(payload["sub"])}

@api.post("/seller/ai/product-images")
@limiter.limit("10/minute")
async def ai_product_images(request: Request, image: UploadFile = File(...), style: str = Form("studio_white"), category: str = Form("saree"), product_id: str = Form(""), payload: dict = Depends(require_ai_seller)):
    """Generate 3 professional product images using Gemini with distinct prompts."""
    if not GEMINI_API_KEY:
        raise HTTPException(503, "AI Studio is not configured. Contact admin.")
    usage = _ai_usage_today(payload["sub"])
    if usage["product_img_remaining"] is not None and usage["product_img_remaining"] <= 0:
        raise HTTPException(429, f"Daily limit reached ({_AI_PRODUCT_IMG_DAILY_LIMIT} sets/day). Try again tomorrow.")
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are accepted.")
    content = await image.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 10MB.")
    # Prioritise the seller's private 360° garment study when available.
    profile_snippet = _ai_training_prompt_snippet(product_id)
    # Front, back and a close-up detail shot
    shot_types = ["front", "back", "detail"]
    prompts = [profile_snippet + _get_product_prompt(st, style, category) for st in shot_types]
    try:
        import base64 as _b64_ai
        images = []
        captions = []
        real_count = 0
        for i, prompt in enumerate(prompts):
            # Primary: Gemini image-editing model — it takes the UPLOADED product
            # as input and preserves it, so all 3 shots show the seller's real
            # product (Imagen is text-to-image and would invent unrelated items).
            img = _call_gemini_image(prompt, content, image.content_type)
            if img:
                images.append(img)
                real_count += 1
                captions.append(f"{shot_types[i].title()} shot ({style.replace('_', ' ')})")
            else:
                # Fallback: get text description using text model
                try:
                    from google.genai import types as _genai_types
                    image_part = _genai_types.Part.from_bytes(data=content, mime_type=image.content_type)
                    txt = _call_gemini_text([
                        f"You are a professional product photographer. Describe in detail how you would photograph "
                        f"this {category} for a {shot_types[i]} shot with {style.replace('_', ' ')} styling. "
                        f"Include lighting setup, angles, props, and mood.",
                        image_part
                    ])
                    captions.append(txt[:200] if txt else f"{shot_types[i].title()} shot")
                except Exception:
                    captions.append(f"{shot_types[i].title()} shot")
                images.append(_b64_ai.b64encode(content).decode())
    except Exception as e:
        logger.warning(f"[AI] Gemini product-images error: {e}")
        raise HTTPException(422, "Our AI couldn't process this image. Please try a different photo or category.")
    generated = real_count > 0
    gen = {"id": str(uuid.uuid4()), "seller_id": payload["sub"], "type": "product_images",
           "style": style, "category": category, "image_count": len(images), "created_at": _now()}
    mem.setdefault("ai_generations", []).append(gen)
    _persist_db()
    return {"images": images, "captions": captions, "style": style, "generated": generated, "usage": _ai_usage_today(payload["sub"])}

# ══════════════════════════════════════════════════════════════════════════════
# PRIVATE AI TRY-ON DATA — optional seller 360° garment video
# The video is stored as a Cloudinary AUTHENTICATED (private) asset. It is never
# shown on the product page, never in galleries, never downloadable by customers.
# In the background we sample frames and build a garment "profile" (fabric,
# embroidery, colour, drape, sleeve/neck/border details) that enriches AI try-on
# prompts for more realistic results. Only sellers (own product) and admins can
# manage or preview it.
# ══════════════════════════════════════════════════════════════════════════════
_AI_VIDEO_MAX_BYTES = 200 * 1024 * 1024
_AI_VIDEO_MAX_DURATION = 65          # seconds (30–60s recommended)
_AI_VIDEO_FRAMES = 6

def _fetch_url_bytes(url: str, timeout: int = 25) -> Optional[bytes]:
    try:
        import urllib.request
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.read()
    except Exception as e:
        logger.warning(f"[AI-TRAIN] frame fetch failed: {e}")
        return None

def _build_garment_profile(frame_urls: list, category: str) -> Optional[dict]:
    """Analyse sampled frames with Gemini and return a structured garment profile."""
    if not GEMINI_API_KEY or not frame_urls:
        return None
    try:
        import json as _json
        from google.genai import types as _t
        parts = [(
            "You are a senior fashion garment analyst. These frames come from a private 360° "
            f"studio video of a single {category or 'garment'}. Describe the garment precisely for an "
            "AI try-on system. Respond with ONLY strict minified JSON in this shape: "
            '{"fabric_texture":"","embroidery":"","color":"","shine":"","pattern":"",'
            '"garment_shape":"","sleeve_design":"","neck_design":"","border_work":"","drape":"",'
            '"prompt_snippet":""}. "prompt_snippet" must be one vivid sentence (max 40 words) '
            "capturing the most important visual details to preserve during try-on."
        )]
        added = 0
        for u in frame_urls[:_AI_VIDEO_FRAMES]:
            b = _fetch_url_bytes(u)
            if b:
                parts.append(_t.Part.from_bytes(data=b, mime_type="image/jpeg"))
                added += 1
        if added == 0:
            return None
        txt = _call_gemini_text(parts)
        if not txt:
            return None
        s, e = txt.find("{"), txt.rfind("}")
        if s >= 0 and e > s:
            return _json.loads(txt[s:e + 1])
    except Exception as ex:
        logger.warning(f"[AI-TRAIN] profile build failed: {ex}")
    return None

def _process_ai_training(record_id: str):
    """Background: sample frames + build the garment profile."""
    rec = mem_first("ai_training", id=record_id)
    if not rec:
        return
    mem_update("ai_training", record_id, {"status": "processing", "error": None, "updated_at": _now()})
    try:
        frames = _cloudinary_video_frame_urls(rec.get("video_public_id"), rec.get("duration"), _AI_VIDEO_FRAMES)
        profile = _build_garment_profile(frames, rec.get("category", ""))
        if profile:
            mem_update("ai_training", record_id, {
                "status": "ready", "profile": profile, "frame_count": len(frames),
                "processed_at": _now(), "updated_at": _now(), "error": None,
            })
        else:
            mem_update("ai_training", record_id, {
                "status": "failed", "updated_at": _now(),
                "error": "AI analysis is unavailable right now. You can reprocess later.",
            })
    except Exception as ex:
        logger.warning(f"[AI-TRAIN] processing error: {ex}")
        mem_update("ai_training", record_id, {"status": "failed", "error": str(ex)[:200], "updated_at": _now()})

def _ai_training_public(rec: dict, include_preview: bool = False) -> dict:
    """Safe representation — never leaks the raw asset publicly."""
    out = {
        "id": rec.get("id"), "product_id": rec.get("product_id"),
        "status": rec.get("status"), "optimized": rec.get("status") == "ready",
        "duration": rec.get("duration"), "bytes": rec.get("bytes", 0),
        "has_profile": bool(rec.get("profile")), "updated_at": rec.get("updated_at"),
    }
    if include_preview and rec.get("video_public_id"):
        out["preview_url"] = _cloudinary_signed_url(rec["video_public_id"], fmt="mp4")
    return out

def _ai_training_prompt_snippet(product_id: str) -> str:
    """Prompt enrichment from a product's ready garment profile (private)."""
    if not product_id:
        return ""
    rec = mem_first("ai_training", product_id=product_id)
    if not rec or rec.get("status") != "ready":
        return ""
    prof = rec.get("profile") or {}
    snip = (prof.get("prompt_snippet") or "").strip()
    if not snip:
        bits = [f"{k.replace('_', ' ')}: {v}" for k, v in prof.items()
                if isinstance(v, str) and v and k != "prompt_snippet"]
        snip = "; ".join(bits[:8])
    if not snip:
        return ""
    return ("Using the seller's private 360° garment study, preserve these EXACT details: " + snip + ". ")


@api.post("/seller/products/{product_id}/ai-video")
async def seller_upload_ai_video(product_id: str, video: UploadFile = File(...), payload: dict = Depends(require_seller)):
    """Upload an optional private 360° garment video for AI try-on training."""
    _, store_id = _seller_ctx(payload)
    prod = _owns_product(store_id, product_id)
    if not _cloudinary_configured():
        raise HTTPException(503, "Private video storage isn't configured yet. Please contact ShopLiveBharat.")
    if video.content_type not in ("video/mp4", "video/quicktime", "video/x-quicktime", "video/mov"):
        raise HTTPException(400, "Only MP4 or MOV videos are accepted.")
    import tempfile, os as _os, threading as _threading
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".vid")
    size = 0
    try:
        while True:
            chunk = await video.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > _AI_VIDEO_MAX_BYTES:
                tmp.close(); _os.unlink(tmp.name)
                raise HTTPException(400, "Video must be under 200MB.")
            tmp.write(chunk)
        tmp.close()
        up = _cloudinary_upload_video_file(tmp.name)
    finally:
        try: _os.unlink(tmp.name)
        except Exception: pass
    if not up or not up.get("public_id"):
        raise HTTPException(422, "We couldn't process this video. Please try a different file.")
    dur = up.get("duration")
    if dur and dur > _AI_VIDEO_MAX_DURATION:
        _cloudinary_delete_video(up["public_id"])
        raise HTTPException(400, "Please keep the video under 60 seconds.")
    existing = mem_first("ai_training", product_id=product_id)
    if existing and existing.get("video_public_id"):
        _cloudinary_delete_video(existing["video_public_id"])
    rec_id = existing["id"] if existing else str(uuid.uuid4())
    rec = {
        "id": rec_id, "product_id": product_id, "seller_id": payload["sub"],
        "shop_id": store_id, "category": prod.get("category", ""),
        "video_public_id": up["public_id"], "bytes": up.get("bytes", 0), "duration": dur,
        "status": "queued", "profile": None, "error": None,
        "created_at": (existing or {}).get("created_at") or _now(), "updated_at": _now(),
    }
    if existing:
        mem_update("ai_training", rec_id, rec)
    else:
        mem_insert("ai_training", rec)
    _threading.Thread(target=_process_ai_training, args=(rec_id,), daemon=True).start()
    return {"exists": True, **_ai_training_public(rec, include_preview=True)}

@api.get("/seller/products/{product_id}/ai-video")
def seller_get_ai_video(product_id: str, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    _owns_product(store_id, product_id)
    rec = mem_first("ai_training", product_id=product_id)
    if not rec:
        return {"exists": False}
    return {"exists": True, **_ai_training_public(rec, include_preview=True)}

@api.delete("/seller/products/{product_id}/ai-video")
def seller_delete_ai_video(product_id: str, payload: dict = Depends(require_seller)):
    _, store_id = _seller_ctx(payload)
    _owns_product(store_id, product_id)
    rec = mem_first("ai_training", product_id=product_id)
    if not rec:
        return {"success": True, "deleted": False}
    if rec.get("video_public_id"):
        _cloudinary_delete_video(rec["video_public_id"])
    mem_delete("ai_training", rec["id"])
    return {"success": True, "deleted": True}

@api.get("/seller/products/ai-status")
def seller_ai_status_map(payload: dict = Depends(require_seller)):
    """Map of {product_id: {status, optimized}} for the seller's AI badges."""
    _, store_id = _seller_ctx(payload)
    out = {}
    for r in mem_get("ai_training", shop_id=store_id):
        out[r["product_id"]] = {"status": r.get("status"), "optimized": r.get("status") == "ready"}
    return out

@api.get("/admin/ai-training/stats", dependencies=[Depends(require_admin)])
def admin_ai_training_stats():
    from collections import Counter
    recs = mem.get("ai_training", [])
    counts = Counter(r.get("status", "unknown") for r in recs)
    total_bytes = sum((r.get("bytes", 0) or 0) for r in recs)
    return {
        "total": len(recs), "total_bytes": total_bytes,
        "total_mb": round(total_bytes / 1048576, 1),
        "by_status": dict(counts),
        "queue": counts.get("queued", 0) + counts.get("processing", 0),
        "cloudinary": _cloudinary_configured(),
    }

@api.get("/admin/ai-training", dependencies=[Depends(require_admin)])
def admin_ai_training_list():
    items = []
    for r in mem.get("ai_training", []):
        prod = mem_first("products", id=r.get("product_id")) or {}
        shop = mem_first("shops", id=r.get("shop_id")) or {}
        items.append({
            **_ai_training_public(r, include_preview=True),
            "product_name": prod.get("name", ""), "shop_name": shop.get("name", ""),
            "seller_id": r.get("seller_id"), "error": r.get("error"),
            "created_at": r.get("created_at"),
        })
    items.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return {"items": items}

@api.post("/admin/ai-training/{rec_id}/reprocess", dependencies=[Depends(require_admin)])
def admin_ai_training_reprocess(rec_id: str):
    import threading as _threading
    rec = mem_first("ai_training", id=rec_id)
    if not rec:
        raise HTTPException(404, "Record not found")
    mem_update("ai_training", rec_id, {"status": "queued", "error": None, "updated_at": _now()})
    _threading.Thread(target=_process_ai_training, args=(rec_id,), daemon=True).start()
    return {"success": True}

@api.delete("/admin/ai-training/{rec_id}", dependencies=[Depends(require_admin)])
def admin_ai_training_delete(rec_id: str):
    rec = mem_first("ai_training", id=rec_id)
    if not rec:
        return {"success": True, "deleted": False}
    if rec.get("video_public_id"):
        _cloudinary_delete_video(rec["video_public_id"])
    mem_delete("ai_training", rec_id)
    return {"success": True, "deleted": True}

@api.get("/seller/ai/gallery")
async def ai_gallery(page: int = Query(1, ge=1), payload: dict = Depends(require_seller)):
    gens = [g for g in mem.get("ai_generations", []) if g.get("seller_id") == payload["sub"]]
    gens.sort(key=lambda g: g.get("created_at", ""), reverse=True)
    per_page = 12
    start = (page - 1) * per_page
    return {"generations": gens[start:start + per_page], "total": len(gens), "page": page, "per_page": per_page}

# ══════════════════════════════════════════════════════════════════════════════
# AI MODEL GENERATOR — "Generate AI Model wearing this clothing"
# Uses gemini-2.5-flash-image (image-editing) because it PRESERVES the uploaded
# garment. Imagen 4 is text-to-image and cannot preserve the exact product, so
# it is intentionally not used here. Generated images are attached to the product.
# ══════════════════════════════════════════════════════════════════════════════
_AI_MODEL_FREE_MONTHLY_LIMIT = int(os.environ.get("AI_MODEL_FREE_LIMIT", "5"))

# The exact, locked preservation prompt. Model attributes are appended per request.
_AI_MODEL_BASE_PROMPT = (
    "You are a professional fashion photography AI. Generate a photorealistic fashion "
    "model wearing the uploaded clothing.\n"
    "Rules:\n"
    "• Preserve the exact colour.\n• Preserve embroidery.\n• Preserve texture.\n"
    "• Preserve neckline.\n• Preserve sleeve design.\n• Preserve borders.\n"
    "• Preserve stitching.\n• Preserve patterns.\n• Preserve print.\n• Preserve fabric.\n"
    "• Preserve fitting.\n"
    "DO NOT modify the clothing. Only replace the invisible mannequin/product background "
    "with a realistic human model.\n"
    "Use soft luxury studio lighting. Generate premium e-commerce catalogue quality. "
    "Ultra realistic skin. Natural hands. Natural face. Natural pose. Professional photography. "
    "No jewellery unless visible in original image. No accessories. No watermark. No text. "
    "No logo. 4K quality."
)
_AI_GENDER = {"female": "adult woman", "male": "adult man", "kids_girl": "young girl child", "kids_boy": "young boy child"}
_AI_AGE = {"teen": "teenage", "young_adult": "young adult", "adult": "adult", "mature": "mature"}
_AI_BODY = {"slim": "slim", "regular": "regular", "athletic": "athletic", "plus_size": "plus-size"}
_AI_SKIN = {"fair": "fair", "wheatish": "wheatish", "brown": "brown", "dark": "dark"}
_AI_POSE = {"standing": "standing straight", "front": "facing the camera front-on", "side": "a three-quarter side profile", "walking": "walking naturally"}
_AI_BG = {
    "white_studio": "a clean white seamless studio background",
    "luxury_studio": "a luxury studio with soft warm accent lighting",
    "lifestyle_indoor": "a tasteful lifestyle indoor setting",
    "outdoor": "a natural outdoor setting with soft daylight",
}

def _build_ai_model_prompt(s: dict) -> str:
    gender = _AI_GENDER.get((s.get("gender") or "female").lower(), "adult woman")
    age = _AI_AGE.get((s.get("age") or "adult").lower(), "adult")
    body = _AI_BODY.get((s.get("body_type") or "regular").lower(), "regular")
    skin = _AI_SKIN.get((s.get("skin_tone") or "wheatish").lower(), "wheatish")
    pose = _AI_POSE.get((s.get("pose") or "standing").lower(), "standing straight")
    bg = _AI_BG.get((s.get("background") or "white_studio").lower(), "a clean white seamless studio background")
    return (
        f"{_AI_MODEL_BASE_PROMPT}\n"
        f"Model: an {age} {gender} of Indian ethnicity, {body} build, {skin} skin tone, in {pose}. "
        f"Background: {bg}."
    )

def _seller_is_premium(seller_id: str) -> bool:
    user = mem_first("users", id=seller_id) or {}
    shop = mem_first("shops", id=user.get("store_id")) if user.get("store_id") else None
    plan = (user.get("plan") or (shop or {}).get("plan") or "free").lower()
    return plan in ("premium", "pro", "unlimited") or bool(user.get("is_premium"))

def _ai_model_usage(seller_id: str) -> dict:
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    gens = mem.get("ai_model_generations", [])
    used = sum(1 for g in gens if g.get("seller_id") == seller_id
               and g.get("status") == "completed" and (g.get("created_at") or "").startswith(month))
    premium = _seller_is_premium(seller_id)
    limit = None if premium else _AI_MODEL_FREE_MONTHLY_LIMIT
    remaining = None if premium else max(0, _AI_MODEL_FREE_MONTHLY_LIMIT - used)
    return {"used": used, "limit": limit, "remaining": remaining, "premium": premium}

def _decode_data_url(data_url: str):
    """Return (raw_bytes, mime) from a data:image/...;base64,... URL, else (None, None)."""
    import base64 as _b64
    try:
        if not data_url.startswith("data:image/"):
            return None, None
        header, b64 = data_url.split(",", 1)
        mime = header.split(";")[0].replace("data:", "")
        return _b64.b64decode(b64), mime
    except Exception:
        return None, None

class AIModelIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    image_data_url: str = ""
    product_id: Optional[str] = None
    gender: str = "female"
    age: str = "adult"
    body_type: str = "regular"
    skin_tone: str = "wheatish"
    pose: str = "standing"
    background: str = "white_studio"

def _generate_ai_model(body: AIModelIn, seller_id: str, regenerate: bool = False) -> dict:
    if not GEMINI_API_KEY:
        raise HTTPException(503, "AI Studio is not configured. Contact admin.")
    usage = _ai_model_usage(seller_id)
    if usage["limit"] is not None and usage["remaining"] <= 0:
        raise HTTPException(429, f"Monthly AI limit reached ({usage['limit']} generations). Upgrade to Premium for unlimited.")

    raw, mime = _decode_data_url(body.image_data_url)
    if not raw:
        raise HTTPException(400, "Provide a valid product image (data URL).")
    if mime not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise HTTPException(400, "Only JPG, JPEG, PNG or WEBP images are accepted.")
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 10MB.")

    settings = {"gender": body.gender, "age": body.age, "body_type": body.body_type,
                "skin_tone": body.skin_tone, "pose": body.pose, "background": body.background}
    prompt = _build_ai_model_prompt(settings)
    gen_id = "aim-" + uuid.uuid4().hex[:12]
    # normalise jpg → jpeg for the SDK
    call_mime = "image/jpeg" if mime in ("image/jpg", "image/jpeg") else mime
    b64_img = _call_gemini_image(prompt, raw, call_mime)
    status = "completed" if b64_img else "failed"
    if not b64_img:
        raise HTTPException(422, "Our AI couldn't process this image. Please try a different photo or settings.")
    generated_url = f"data:image/png;base64,{b64_img}"
    # Optional Cloudinary offload if configured (keeps DB lean in production)
    generated_url = _maybe_offload_image(generated_url)

    record = {
        "id": gen_id, "seller_id": seller_id, "product_id": body.product_id,
        "generated_image": generated_url, "settings": settings,
        "status": status, "is_primary": False, "created_at": _now(),
    }
    mem.setdefault("ai_model_generations", []).append(record)
    _persist_db()
    return {"id": gen_id, "image": generated_url, "status": status,
            "settings": settings, "usage": _ai_model_usage(seller_id)}

def _maybe_offload_image(data_url: str) -> str:
    """Upload AI-generated images to Cloudinary (folder shoplivebharat/ai-models)
    when configured; otherwise keep the data URL. Uses the central helper defined
    below so configuration logic lives in one place."""
    try:
        hosted = _cloudinary_upload(data_url, folder="shoplivebharat/ai-models")
        return hosted or data_url
    except Exception:
        return data_url

@api.get("/ai/model-usage")
def ai_model_usage(payload: dict = Depends(require_seller)):
    return _ai_model_usage(payload["sub"])

@api.get("/ai/model-images")
def ai_model_images(product_id: Optional[str] = None, payload: dict = Depends(require_seller)):
    gens = [g for g in mem.get("ai_model_generations", []) if g.get("seller_id") == payload["sub"]]
    if product_id:
        gens = [g for g in gens if g.get("product_id") == product_id]
    gens.sort(key=lambda g: g.get("created_at", ""), reverse=True)
    return {"images": gens}

@api.get("/ai/status/{gen_id}")
def ai_model_status(gen_id: str, payload: dict = Depends(require_seller)):
    g = next((x for x in mem.get("ai_model_generations", [])
              if x.get("id") == gen_id and x.get("seller_id") == payload["sub"]), None)
    if not g:
        raise HTTPException(404, "Generation not found")
    return {"id": g["id"], "status": g.get("status"), "image": g.get("generated_image"),
            "is_primary": g.get("is_primary", False), "settings": g.get("settings", {})}

@api.post("/ai/generate-model")
@limiter.limit("10/minute")
def ai_generate_model(request: Request, body: AIModelIn, payload: dict = Depends(require_ai_seller)):
    return _generate_ai_model(body, payload["sub"], regenerate=False)

@api.post("/ai/regenerate-model")
@limiter.limit("10/minute")
def ai_regenerate_model(request: Request, body: AIModelIn, payload: dict = Depends(require_ai_seller)):
    return _generate_ai_model(body, payload["sub"], regenerate=True)

@api.delete("/ai/model-image/{gen_id}")
def ai_delete_model_image(gen_id: str, payload: dict = Depends(require_seller)):
    gens = mem.get("ai_model_generations", [])
    before = len(gens)
    mem["ai_model_generations"] = [g for g in gens
                                   if not (g.get("id") == gen_id and g.get("seller_id") == payload["sub"])]
    if len(mem["ai_model_generations"]) == before:
        raise HTTPException(404, "Generation not found")
    _persist_db()
    return {"success": True, "deleted": gen_id}

@api.post("/ai/model-image/{gen_id}/primary")
def ai_set_primary_model_image(gen_id: str, payload: dict = Depends(require_seller)):
    """Mark a generated image as the primary AI image for its product."""
    target = next((g for g in mem.get("ai_model_generations", [])
                   if g.get("id") == gen_id and g.get("seller_id") == payload["sub"]), None)
    if not target:
        raise HTTPException(404, "Generation not found")
    for g in mem.get("ai_model_generations", []):
        if g.get("seller_id") == payload["sub"] and g.get("product_id") == target.get("product_id"):
            g["is_primary"] = (g["id"] == gen_id)
    _persist_db()
    return {"success": True, "primary": gen_id, "image": target.get("generated_image")}

@api.post("/admin/change-password", dependencies=[Depends(require_admin)])
def admin_change_password(body: dict):
    """Change an admin account password (admin auth is key-based, so this is
    guarded by the admin key and additionally verifies the current password)."""
    email = (body.get("email") or "admin@shoplivebharat.com").lower().strip()
    current = body.get("current_password") or body.get("currentPassword") or ""
    new_password = body.get("new_password") or body.get("newPassword") or ""
    user = mem_first("users", email=email)
    if not user or user.get("role") != "admin":
        raise HTTPException(404, "Admin account not found")
    if not _check_pw(current, user.get("password_hash", "")):
        raise HTTPException(400, "Your current password is incorrect.")
    _validate_password_strength(new_password)
    user["password_hash"] = _hash_pw(new_password)
    user["password_customized"] = True
    user["updated_at"] = _now()
    _persist_db()
    if user.get("email"):
        _send_email(to=user["email"], subject="Your ShopLiveBharat admin password was changed",
                    body="<p>Your admin account password was changed. If this wasn't you, contact support immediately.</p>",
                    kind="password_changed")
    return {"success": True, "message": "Admin password updated."}

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN: CUSTOMER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════
def _customer_bookings(u: dict) -> list:
    uid = u.get("id"); email = (u.get("email") or "").lower()
    return [b for b in mem.get("bookings", [])
            if b.get("user_id") == uid or (email and (b.get("customer_email") or "").lower() == email)]

def _customer_row(u: dict) -> dict:
    uid = u.get("id")
    orders = [o for o in mem.get("orders", []) if o.get("user_id") == uid]
    spent = sum(o.get("total", 0) for o in orders if o.get("status") not in ("cancelled", "pending_payment"))
    return {
        "id": uid, "name": u.get("name", ""), "email": u.get("email", ""),
        "phone": u.get("phone", ""), "city": u.get("city", ""),
        "created_at": u.get("created_at"), "last_login_at": u.get("last_login_at"),
        "is_suspended": bool(u.get("is_suspended")),
        "order_count": len(orders), "booking_count": len(_customer_bookings(u)),
        "total_spent": spent,
    }

@api.get("/admin/customers", dependencies=[Depends(require_admin)])
def admin_list_customers(q: Optional[str] = None, status: Optional[str] = None, limit: int = Query(1000, le=5000)):
    custs = [u for u in mem.get("users", []) if u.get("role") == "customer"]
    if q:
        ql = q.lower().strip()
        custs = [u for u in custs if ql in f"{u.get('name','')} {u.get('email','')} {u.get('phone','')}".lower()]
    if status == "suspended":
        custs = [u for u in custs if u.get("is_suspended")]
    elif status == "active":
        custs = [u for u in custs if not u.get("is_suspended")]
    rows = [_customer_row(u) for u in custs]
    rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    return {"customers": rows[:limit], "total": len(rows)}

@api.get("/admin/customers/{user_id}", dependencies=[Depends(require_admin)])
def admin_customer_detail(user_id: str):
    u = mem_first("users", id=user_id)
    if not u or u.get("role") != "customer":
        raise HTTPException(404, "Customer not found")
    orders = [_enrich_order(o) for o in mem.get("orders", []) if o.get("user_id") == user_id]
    orders.sort(key=lambda o: o.get("created_at", ""), reverse=True)
    bookings = _customer_bookings(u)
    wl = mem_first("wishlists", user_id=user_id)
    wishlist = []
    for pid in (wl or {}).get("product_ids", []):
        p = mem_first("products", id=pid)
        if p:
            wishlist.append({"id": p["id"], "name": p.get("name"), "price": p.get("price"), "image_url": p.get("image_url")})
    # Saved addresses derived from the customer's order shipping addresses (deduped)
    seen, addresses = set(), []
    for o in orders:
        a = o.get("shipping_address") or {}
        if a:
            key = _json.dumps(a, sort_keys=True, default=str)
            if key not in seen:
                seen.add(key); addresses.append(a)
    return {
        "customer": {k: v for k, v in u.items() if k not in ("password_hash", "reset_token", "reset_token_exp")},
        "orders": orders,
        "bookings": bookings,
        "wishlist": wishlist,
        "addresses": addresses,
        "size_profiles": u.get("size_profiles", []),
        "stats": {
            "order_count": len(orders),
            "booking_count": len(bookings),
            "wishlist_count": len(wishlist),
            "total_spent": sum(o.get("total", 0) for o in orders if o.get("status") not in ("cancelled", "pending_payment")),
        },
    }

@api.post("/admin/customers/{user_id}/suspend", dependencies=[Depends(require_admin)])
def admin_suspend_customer(user_id: str, body: dict = {}):
    u = mem_first("users", id=user_id)
    if not u or u.get("role") != "customer":
        raise HTTPException(404, "Customer not found")
    u["is_suspended"] = True; u["updated_at"] = _now(); _persist_db()
    if u.get("email"):
        _send_email(to=u["email"], subject="Your ShopLiveBharat account has been suspended",
                    body="<p>Your ShopLiveBharat account has been suspended. If you think this is a mistake, "
                         "please contact <a href='mailto:support@shoplivebharat.com'>support@shoplivebharat.com</a>.</p>",
                    kind="customer_suspended")
    return {"success": True, "is_suspended": True}

@api.post("/admin/customers/{user_id}/reactivate", dependencies=[Depends(require_admin)])
def admin_reactivate_customer(user_id: str):
    u = mem_first("users", id=user_id)
    if not u or u.get("role") != "customer":
        raise HTTPException(404, "Customer not found")
    u["is_suspended"] = False; u["updated_at"] = _now(); _persist_db()
    if u.get("email"):
        _send_email(to=u["email"], subject="Your ShopLiveBharat account has been reactivated",
                    body="<p>Good news — your ShopLiveBharat account is active again. Welcome back!</p>",
                    kind="customer_reactivated")
    return {"success": True, "is_suspended": False}

@api.patch("/admin/customers/{user_id}/password", dependencies=[Depends(require_admin)])
def admin_reset_customer_password(user_id: str, body: dict):
    new_pw = (body.get("password") or "").strip()
    u = mem_first("users", id=user_id)
    if not u or u.get("role") != "customer":
        raise HTTPException(404, "Customer not found")
    _validate_password_strength(new_pw)
    u["password_hash"] = _hash_pw(new_pw); u["updated_at"] = _now(); _persist_db()
    if u.get("email"):
        _send_email(to=u["email"], subject="Your ShopLiveBharat password was reset by support",
                    body="<p>An administrator reset your password. If you didn't request this, contact support immediately.</p>",
                    kind="admin_password_reset")
    return {"success": True, "message": f"Password reset for {u.get('email')}"}

@api.delete("/admin/customers/{user_id}", dependencies=[Depends(require_admin)])
def admin_delete_customer(user_id: str):
    u = mem_first("users", id=user_id)
    if not u or u.get("role") != "customer":
        raise HTTPException(404, "Customer not found")
    email = u.get("email")
    mem["users"] = [x for x in mem.get("users", []) if x.get("id") != user_id]
    mem["wishlists"] = [w for w in mem.get("wishlists", []) if w.get("user_id") != user_id]
    mem["carts"] = [c for c in mem.get("carts", []) if c.get("user_id") != user_id]
    _persist_db()
    if email:
        _send_email(to=email, subject="Your ShopLiveBharat account has been removed",
                    body="<p>Your ShopLiveBharat account has been removed. If this was a mistake, "
                         "contact <a href='mailto:support@shoplivebharat.com'>support@shoplivebharat.com</a>.</p>",
                    kind="customer_deleted")
    return {"success": True, "deleted": user_id}

@api.get("/admin/customers-export", dependencies=[Depends(require_admin)])
def admin_export_customers():
    import io, csv
    from starlette.responses import Response
    rows = [_customer_row(u) for u in mem.get("users", []) if u.get("role") == "customer"]
    rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "name", "email", "phone", "city", "created_at", "last_login_at",
                "is_suspended", "order_count", "booking_count", "total_spent"])
    for r in rows:
        w.writerow([r["id"], r["name"], r["email"], r["phone"], r["city"], r.get("created_at", ""),
                    r.get("last_login_at", ""), r["is_suspended"], r["order_count"], r["booking_count"], r["total_spent"]])
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=shoplivebharat-customers.csv"})

# ── Mount app ─────────────────────────────────────────────────────────────────
app.include_router(api)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
