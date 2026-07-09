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

from fastapi import FastAPI, APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from dotenv import load_dotenv
import os, re, logging, uuid
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
_COLLECTIONS = ["users", "shops", "products", "orders", "carts", "wishlists", "bookings", "waitlist", "slots", "seller_applications", "coupons", "returns", "email_log", "shipments", "categories", "_meta"]

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

# ── Razorpay ──────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

# ── Helpers ───────────────────────────────────────────────────────────────────
def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _slugify(v: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", v.lower()).strip("-") or str(uuid.uuid4())[:8]

def _send_email(to: str, subject: str, body: str, kind: str = "generic") -> dict:
    """Send an email via Resend if configured, else record in the email log (test mode).
    Always logs to the in-memory email_log so the UI can show delivery status.
    Never raises — email must never block a core flow.
    """
    resend_key = os.environ.get("RESEND_API_KEY", "").strip()
    status = "sent" if resend_key else "test_mode"
    provider_id = None
    if resend_key:
        try:
            import resend as _resend
            _resend.api_key = resend_key
            sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
            name = os.environ.get("SENDER_NAME", "ShopLiveBharat")
            resp = _resend.Emails.send({
                "from": f"{name} <{sender}>", "to": [to],
                "subject": subject, "html": f"<div>{body}</div>",
            })
            provider_id = resp.get("id") if isinstance(resp, dict) else getattr(resp, "id", None)
        except Exception as e:
            status = "failed"
            logger.warning(f"[EMAIL] send failed to {to}: {e}")
    entry = {
        "id": str(uuid.uuid4()), "to": to, "subject": subject, "kind": kind,
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
    # Uses HASH_SALT (not JWT_SECRET) so password hashes are stable
    # even when JWT_SECRET is rotated.
    return hashlib.sha256((pw + HASH_SALT).encode()).hexdigest()

def _check_pw(pw: str, hashed: str) -> bool:
    return hmac.compare_digest(_hash_pw(pw), hashed)

def _make_token(user_id: str, role: str) -> str:
    import base64, json
    payload = {"sub": user_id, "role": role,
               "exp": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)).isoformat()}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()

def _decode_token(token: str) -> Optional[dict]:
    try:
        import base64, json
        payload = json.loads(base64.urlsafe_b64decode(token + "==").decode())
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
    return payload

async def optional_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    if not creds:
        return None
    payload = _decode_token(creds.credentials)
    return payload

def require_admin(x_admin_key: Optional[str] = Header(default=None)):
    if x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid admin key")

async def require_seller(payload: dict = Depends(get_current_user)):
    if payload.get("role") not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Seller access required")
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
    product_id: str; quantity: int = 1; size: str = ""; color: str = ""

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
        if pw:
            correct = _hash_pw(pw)
            if u.get("password_hash") != correct:
                u["password_hash"] = correct
                changed = True
    if changed:
        logger.info("[DB] Repaired seed account password hashes (admin/customer)")
    return changed

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

# ── Health ────────────────────────────────────────────────────────────────────
@api.get("/")
def root():
    return {
        "service": "ShopLiveBharat API v2",
        "status": "ok",
        "db": "memory" if USE_MEMORY_DB else ("mongodb" if _mongo_db is not None else "memory-fallback"),
    }

# ── Razorpay: server-side order creation + verification ───────────────────────
@api.get("/razorpay/config")
def razorpay_config():
    """Public: returns key_id + whether payments are configured."""
    return {"key_id": RAZORPAY_KEY_ID, "configured": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)}

@api.post("/razorpay/order")
def razorpay_create_order(body: dict):
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
async def razorpay_checkout_link(body: CheckoutLinkIn, payload: Optional[dict] = Depends(optional_user)):
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
    if ok and razorpay_payment_link_status == "paid" and order and order.get("payment_status") != "paid":
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
            _send_email(to=to_email, subject=f"Order confirmed — {order['id']}",
                        body=f"Thank you for your order {order['id']}. Total: ₹{order.get('total',0):,}.",
                        kind="order_placed")
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

# ── Auth ──────────────────────────────────────────────────────────────────────
@api.post("/auth/register", status_code=201)
def register(body: RegisterIn):
    email = body.email.lower()
    if mem_first("users", email=email):
        raise HTTPException(409, "This email is already in use. Please log in or use Forgot Password.")
    user = {
        "id": str(uuid.uuid4()), "name": body.name,
        "email": email, "password_hash": _hash_pw(body.password),
        "role": body.role if body.role in ("customer","seller") else "customer",
        "phone": "", "city": "", "created_at": _now(),
    }
    mem_insert("users", user)
    token = _make_token(user["id"], user["role"])
    return {"token": token, "user": UserOut(**user)}

@api.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn):
    user = mem_first("users", email=body.email.lower())
    if not user or not _check_pw(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = _make_token(user["id"], user["role"])
    return {"token": token, "user": UserOut(**{k:v for k,v in user.items() if k != "password_hash"})}

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

@api.post("/auth/forgot-password")
def forgot_password(body: dict):
    email = (body.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(400, "Email is required")
    user = mem_first("users", email=email)
    if not user:
        # Don't reveal if email exists for security; always return success
        return {"success": True, "message": "If this email exists, a reset link has been sent."}
    # Generate a temp reset token (in production this would be emailed)
    reset_token = "reset-" + uuid.uuid4().hex[:12]
    user["reset_token"] = reset_token
    return {"success": True, "message": "If this email exists, a reset link has been sent.",
            "test_mode_token": reset_token}

@api.post("/auth/reset-password")
def reset_password(body: dict):
    token = body.get("token", "")
    new_password = body.get("password", "")
    if not token or not new_password or len(new_password) < 6:
        raise HTTPException(400, "Token and password (min 6 chars) required")
    user = next((u for u in mem["users"] if u.get("reset_token") == token), None)
    if not user:
        raise HTTPException(400, "Invalid or expired reset token")
    user["password_hash"] = _hash_pw(new_password)
    user.pop("reset_token", None)
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
        if buyer and buyer.get("email"):
            _send_email(to=buyer["email"], subject=f"Order {order_id} is now {order['status']}",
                        body=f"Your order {order_id} status changed to '{order['status']}'."
                             + (f" Tracking: {order.get('tracking_number')}" if order.get("tracking_number") else ""),
                        kind="order_status")
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
        apps = [a for a in apps if a["status"] == status]
    return sorted(apps, key=lambda a: a["submitted_at"], reverse=True)

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
               "is_featured","badge"}
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
    booking.update(patch)
    booking["updated_at"] = _now()
    # Send confirmation email when status changes to confirmed
    if patch.get("status") == "confirmed":
        booking["confirmation_email_status"] = "sent"
        booking["confirmation_email_sent_at"] = _now()
        # In test mode, log to console. In production, integrate real email service.
        logger.info(f"[EMAIL] Booking confirmed → customer {booking.get('customer_email')} for {booking.get('store_name')} on {booking.get('date')}")
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
        }
    }

@api.patch("/admin/sellers/{shop_id}/live-override", dependencies=[Depends(require_admin)])
def admin_live_override(shop_id: str, body: dict):
    """Admin override for live shopping eligibility flags."""
    shop = mem_first("shops", id=shop_id)
    if not shop:
        raise HTTPException(404, "Shop not found")
    allowed = {"acceptsLiveBookings", "admin_live_disabled", "liveShoppingEnabled", "online"}
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

# ── Image upload (stores base64 as data-url or accepts an external URL) ─────
# In production replace the base64 store with an S3/Cloudinary upload.
# Max ~4 MB per image (browser should pre-resize before sending).
@api.post("/upload-image", status_code=201)
def upload_image(body: dict, payload: dict = Depends(get_current_user)):
    """Accept { data_url, filename } or { url } and return a usable image URL."""
    if body.get("url"):
        # Caller is providing an already-hosted URL (e.g. Cloudinary)
        return {"url": body["url"], "source": "external"}
    data_url = body.get("data_url", "")
    if not data_url.startswith("data:image/"):
        raise HTTPException(400, "Provide a valid data_url (data:image/...) or a hosted url")
    # Store the data-url directly in memory (fine for dev; swap for S3 in prod)
    image_id = "img-" + uuid.uuid4().hex[:12]
    mem.setdefault("image_store", {})[image_id] = {"url": data_url, "uploaded_at": _now(), "by": payload["sub"]}
    return {"url": data_url, "image_id": image_id, "source": "data_url"}

@api.post("/admin/upload-image", status_code=201, dependencies=[Depends(require_admin)])
def admin_upload_image(body: dict):
    """Admin version — same logic, no auth token required."""
    if body.get("url"):
        return {"url": body["url"], "source": "external"}
    data_url = body.get("data_url", "")
    if not data_url.startswith("data:image/"):
        raise HTTPException(400, "Provide a valid data_url or a hosted url")
    image_id = "img-" + uuid.uuid4().hex[:12]
    mem.setdefault("image_store", {})[image_id] = {"url": data_url, "uploaded_at": _now(), "by": "admin"}
    return {"url": data_url, "image_id": image_id, "source": "data_url"}

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

# ── Email log (test-mode visibility for admin) ────────────────────────────────
@api.get("/admin/email-log", dependencies=[Depends(require_admin)])
def admin_email_log(limit: int = Query(100, le=1000)):
    log = sorted(mem.get("email_log", []), key=lambda e: e.get("created_at", ""), reverse=True)
    resend_configured = bool(os.environ.get("RESEND_API_KEY", "").strip())
    return {"configured": resend_configured,
            "mode": "live" if resend_configured else "test",
            "emails": log[:limit]}

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
    _send_email(to=shop.get("owner_email",""), subject="Your ShopLiveBharat store has been suspended",
                body=f"Your store '{shop.get('name','')}' has been suspended. Reason: {reason}. Contact support to resolve.",
                kind="seller_suspended")
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
    # Delete all products belonging to this shop
    mem["products"] = [p for p in mem.get("products", []) if p.get("shop_id") != shop_id]
    # Delete all slots
    mem["slots"] = [s for s in mem.get("slots", []) if s.get("shop_id") != shop_id]
    # Remove the seller user
    mem["users"] = [u for u in mem.get("users", []) if u.get("store_id") != shop_id or u.get("role") != "seller"]
    # Remove the shop itself
    mem["shops"] = [s for s in mem.get("shops", []) if s.get("id") != shop_id]
    # Mark related seller applications as deleted
    for app in mem.get("seller_applications", []):
        if app.get("store_id") == shop_id:
            app["status"] = "deleted"
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
        mem["products"] = [p for p in mem.get("products", []) if p.get("shop_id") != shop_id]
        mem["slots"] = [s for s in mem.get("slots", []) if s.get("shop_id") != shop_id]
        mem["users"] = [u for u in mem.get("users", []) if u.get("store_id") != shop_id or u.get("role") != "seller"]
        mem["shops"] = [s for s in mem.get("shops", []) if s.get("id") != shop_id]
        for app in mem.get("seller_applications", []):
            if app.get("store_id") == shop_id:
                app["status"] = "deleted"
        deleted.append(shop_id)
    _persist_db()
    return {"success": True, "deleted": deleted, "skipped": skipped}

# ── Mount app ─────────────────────────────────────────────────────────────────
app.include_router(api)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
