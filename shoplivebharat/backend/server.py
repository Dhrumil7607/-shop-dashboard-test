"""ShopLiveBharat — Luxury Coming Soon API

Endpoints
- GET  /api/                           Health
- GET  /api/launch-info                Returns persisted launch_date (30 days from first call)
- POST /api/waitlist                   Register waitlist user (dedupe by email, phone validation)
- GET  /api/waitlist/stats             Public counts
- GET  /api/admin/waitlist             Admin list (placeholder)
- POST /api/admin/trigger-launch-email Mock SMTP burst at launch
"""

from fastapi import FastAPI, APIRouter, Depends, Header, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
import os
import re
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import email_service  # noqa: E402  (must load AFTER dotenv)
import pdf_reports  # noqa: E402

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("shoplivebharat")

# Mongo. MongoDB creates the configured database and collections on first write.
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
USE_MEMORY_DB = os.environ.get("USE_MEMORY_DB") == "1" or (
    bool(os.environ.get("VERCEL")) and "localhost" in mongo_url
) or (
    "MONGO_URL" not in os.environ and "localhost" in mongo_url
)
client = None if USE_MEMORY_DB else AsyncIOMotorClient(mongo_url)
db = None if USE_MEMORY_DB else client[os.environ.get("DB_NAME", "shoplivebharat")]
memory_waitlist = []
memory_shops = []
memory_products = []
memory_launch_date: Optional[datetime] = None
configured_launch_date = os.environ.get("LAUNCH_DATE", "").strip()
DEFAULT_LAUNCH_DATE = datetime.fromisoformat("2026-06-28T00:00:00+05:30")
LAUNCH_DAYS_TOTAL = 15

app = FastAPI(title="ShopLiveBharat API", version="1.0.0")
api_router = APIRouter(prefix="/api")


# ----------------------------- Models -----------------------------
class WaitlistCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    country_code: str = Field(min_length=2, max_length=6)
    phone: str = Field(min_length=4, max_length=20)
    source: Optional[str] = Field(default="landing")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 6 or len(digits) > 15:
            raise ValueError("Phone number must contain 6-15 digits")
        return digits

    @field_validator("country_code")
    @classmethod
    def validate_country_code(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\+?\d{1,5}$", v):
            raise ValueError("Country code must look like +91 or 91")
        return v if v.startswith("+") else f"+{v}"


class WaitlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    full_name: str
    email: EmailStr
    country_code: str
    phone: str
    source: str
    created_at: datetime
    launch_email_sent: bool = False


class WaitlistResponse(BaseModel):
    success: bool
    message: str
    entry: WaitlistEntry


class WaitlistStats(BaseModel):
    total_members: int
    stores_joining: int
    premium_collections: int


class LaunchInfo(BaseModel):
    launch_date: datetime
    days_total: int = LAUNCH_DAYS_TOTAL


class MockEmailResult(BaseModel):
    success: bool
    sent_count: int
    skipped: int
    message: str


class ShopBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=120)
    slug: Optional[str] = Field(default=None, max_length=140)
    owner_name: str = Field(min_length=2, max_length=100)
    owner_email: EmailStr
    city: str = Field(min_length=2, max_length=80)
    country: str = Field(default="India", min_length=2, max_length=80)
    specialty: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=10, max_length=800)
    image_url: Optional[str] = Field(default="", max_length=500)
    instagram_url: Optional[str] = Field(default="", max_length=500)
    is_active: bool = True


class ShopCreate(ShopBase):
    pass


class ShopUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    slug: Optional[str] = Field(default=None, max_length=140)
    owner_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    owner_email: Optional[EmailStr] = None
    city: Optional[str] = Field(default=None, min_length=2, max_length=80)
    country: Optional[str] = Field(default=None, min_length=2, max_length=80)
    specialty: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, min_length=10, max_length=800)
    image_url: Optional[str] = Field(default=None, max_length=500)
    instagram_url: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None


class Shop(ShopBase):
    model_config = ConfigDict(extra="ignore")

    id: str
    slug: str
    created_at: datetime
    updated_at: datetime


class ProductBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    shop_id: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=160)
    slug: Optional[str] = Field(default=None, max_length=180)
    category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=10, max_length=1000)
    price: int = Field(ge=0)
    compare_at_price: Optional[int] = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    image_url: str = Field(min_length=1, max_length=500)
    hover_image_url: Optional[str] = Field(default="", max_length=500)
    stock: int = Field(default=0, ge=0)
    badge: Optional[str] = Field(default="", max_length=40)
    is_featured: bool = False
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    shop_id: Optional[str] = Field(default=None, min_length=2, max_length=80)
    name: Optional[str] = Field(default=None, min_length=2, max_length=160)
    slug: Optional[str] = Field(default=None, max_length=180)
    category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, min_length=10, max_length=1000)
    price: Optional[int] = Field(default=None, ge=0)
    compare_at_price: Optional[int] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    image_url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    hover_image_url: Optional[str] = Field(default=None, max_length=500)
    stock: Optional[int] = Field(default=None, ge=0)
    badge: Optional[str] = Field(default=None, max_length=40)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")

    id: str
    slug: str
    shop_name: Optional[str] = ""
    created_at: datetime
    updated_at: datetime


class MarketplaceStats(BaseModel):
    shops: int
    products: int
    featured_products: int
    waitlist_members: int

# ----------------------------- Helpers -----------------------------
async def _get_or_create_launch_date() -> datetime:
    """Persist a single launch_date that is 30 days from the first request.

    Stored in db.app_config under key='launch_meta'. Idempotent.
    """
    if configured_launch_date:
        return datetime.fromisoformat(configured_launch_date.replace("Z", "+00:00"))

    global memory_launch_date
    if USE_MEMORY_DB:
        if not memory_launch_date:
            memory_launch_date = DEFAULT_LAUNCH_DATE
        return memory_launch_date

    doc = await db.app_config.find_one({"key": "launch_meta"}, {"_id": 0})
    if doc and "launch_date" in doc:
        try:
            return datetime.fromisoformat(doc["launch_date"])
        except Exception:
            logger.warning("Stored launch_date unparseable; recomputing")

    launch_date = DEFAULT_LAUNCH_DATE
    await db.app_config.update_one(
        {"key": "launch_meta"},
        {"$set": {"key": "launch_meta", "launch_date": launch_date.isoformat()}},
        upsert=True,
    )
    return launch_date


def _entry_from_doc(doc: dict) -> WaitlistEntry:
    doc.setdefault("id", str(uuid.uuid4()))
    doc.setdefault("source", "landing")
    doc.setdefault("launch_email_sent", False)
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return WaitlistEntry(**doc)


async def _backfill_waitlist_ids():
    cursor = db.waitlist.find({"id": {"$exists": False}}, {"_id": 1})
    async for doc in cursor:
        await db.waitlist.update_one(
            {"_id": doc["_id"]},
            {"$set": {"id": str(uuid.uuid4()), "source": "landing"}},
        )


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or str(uuid.uuid4())[:8]


def _clean_doc(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    for key in ("created_at", "updated_at"):
        if isinstance(doc.get(key), str):
            doc[key] = datetime.fromisoformat(doc[key])
    return doc


def _require_admin(x_admin_key: Optional[str] = Header(default=None)):
    expected = os.environ.get("ADMIN_API_KEY", "shoplivebharat-admin")
    if x_admin_key != expected:
        raise HTTPException(status_code=401, detail="Invalid admin key")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _shop_exists(shop_id: str) -> bool:
    if USE_MEMORY_DB:
        return any(s["id"] == shop_id for s in memory_shops)
    return bool(await db.shops.find_one({"id": shop_id, "is_active": {"$ne": False}}))


async def _seed_marketplace():
    seed_shops = [
        {
            "id": "shop-jaipur-atelier",
            "name": "Jaipur Atelier House",
            "slug": "jaipur-atelier-house",
            "owner_name": "Aarav Mehta",
            "owner_email": "aarav@example.com",
            "city": "Jaipur",
            "country": "India",
            "specialty": "Festive lehengas and mirrorwork jackets",
            "description": "A family-run atelier curating festive silhouettes, light occasion wear and handcrafted embellishment for live video discovery.",
            "image_url": "/shop-assets/banner-1.jpg",
            "instagram_url": "",
            "is_active": True,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        },
        {
            "id": "shop-banaras-edit",
            "name": "The Banaras Edit",
            "slug": "the-banaras-edit",
            "owner_name": "Meera Shah",
            "owner_email": "meera@example.com",
            "city": "Varanasi",
            "country": "India",
            "specialty": "Silk drapes, jewellery and wedding guest edits",
            "description": "A curated saree and accessory house focused on timeless wedding wardrobes for Indians shopping from abroad.",
            "image_url": "/shop-assets/womens-banner.jpg",
            "instagram_url": "",
            "is_active": True,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        },
    ]
    seed_products = [
        {
            "id": "prod-kantha-wrap-jacket",
            "shop_id": "shop-jaipur-atelier",
            "shop_name": "Jaipur Atelier House",
            "name": "Kantha Wrap Jacket",
            "slug": "kantha-wrap-jacket",
            "category": "Outerwear",
            "description": "A hand-finished wrap jacket for festive layering and destination wedding wardrobes.",
            "price": 6490,
            "compare_at_price": 8290,
            "currency": "INR",
            "image_url": "/shop-assets/products/jacket-3.jpg",
            "hover_image_url": "/shop-assets/products/jacket-4.jpg",
            "stock": 8,
            "badge": "Live Pick",
            "is_featured": True,
            "is_active": True,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        },
        {
            "id": "prod-rose-gold-jhumkas",
            "shop_id": "shop-banaras-edit",
            "shop_name": "The Banaras Edit",
            "name": "Rose Gold Jhumkas",
            "slug": "rose-gold-jhumkas",
            "category": "Jewellery",
            "description": "Lightweight rose gold-toned jhumkas selected for mehendi and wedding guest looks.",
            "price": 2490,
            "compare_at_price": 3190,
            "currency": "INR",
            "image_url": "/shop-assets/products/jewellery-1.jpg",
            "hover_image_url": "/shop-assets/products/jewellery-2.jpg",
            "stock": 14,
            "badge": "Bestseller",
            "is_featured": True,
            "is_active": True,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        },
        {
            "id": "prod-mirror-work-lehenga",
            "shop_id": "shop-jaipur-atelier",
            "shop_name": "Jaipur Atelier House",
            "name": "Mirror Work Lehenga",
            "slug": "mirror-work-lehenga",
            "category": "Lehenga",
            "description": "Stunning lehenga with mirror work embellishment. Perfect for festivals.",
            "price": 8990,
            "compare_at_price": 11990,
            "currency": "INR",
            "image_url": "/shop-assets/products/jacket-3.jpg",
            "hover_image_url": "/shop-assets/products/jacket-4.jpg",
            "stock": 5,
            "badge": "Premium",
            "is_featured": True,
            "is_active": True,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        },
        {
            "id": "prod-festive-dupatta",
            "shop_id": "shop-jaipur-atelier",
            "shop_name": "Jaipur Atelier House",
            "name": "Traditional Festive Dupatta",
            "slug": "festive-dupatta",
            "category": "Accessories",
            "description": "Hand-embroidered festive dupatta with traditional patterns.",
            "price": 2490,
            "compare_at_price": 3490,
            "currency": "INR",
            "image_url": "/shop-assets/products/jacket-3.jpg",
            "hover_image_url": "/shop-assets/products/jacket-4.jpg",
            "stock": 15,
            "badge": None,
            "is_featured": False,
            "is_active": True,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        },
        {
            "id": "prod-silk-saree",
            "shop_id": "shop-banaras-edit",
            "shop_name": "The Banaras Edit",
            "name": "Handwoven Silk Saree",
            "slug": "handwoven-silk-saree",
            "category": "Saree",
            "description": "Traditional handwoven silk saree with zari embroidery.",
            "price": 12990,
            "compare_at_price": 15990,
            "currency": "INR",
            "image_url": "/shop-assets/products/jewellery-1.jpg",
            "hover_image_url": "/shop-assets/products/jewellery-2.jpg",
            "stock": 3,
            "badge": "Exclusive",
            "is_featured": True,
            "is_active": True,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        },
    ]

    if USE_MEMORY_DB:
        if not memory_shops:
            memory_shops.extend(seed_shops)
        if not memory_products:
            memory_products.extend(seed_products)
        return

    if await db.shops.count_documents({}) == 0:
        await db.shops.insert_many(seed_shops)
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many(seed_products)


# ----------------------------- Routes -----------------------------
@api_router.get("/")
async def root():
    return {"service": "ShopLiveBharat API", "status": "ok"}


@api_router.get("/launch-info", response_model=LaunchInfo)
async def launch_info():
    launch_date = await _get_or_create_launch_date()
    return LaunchInfo(launch_date=launch_date, days_total=LAUNCH_DAYS_TOTAL)


@api_router.post("/waitlist", response_model=WaitlistResponse, status_code=201)
async def join_waitlist(payload: WaitlistCreate):
    # Dedupe (case-insensitive email)
    if USE_MEMORY_DB:
        existing_memory = next(
            (entry for entry in memory_waitlist if entry.get("email") == payload.email.lower()),
            None,
        )
        if existing_memory:
            raise HTTPException(
                status_code=409,
                detail="This email is already on the waitlist. Stay tuned for launch.",
            )
        now = datetime.now(timezone.utc)
        entry = WaitlistEntry(
            id=str(uuid.uuid4()),
            full_name=payload.full_name,
            email=payload.email.lower(),
            country_code=payload.country_code,
            phone=payload.phone,
            source=payload.source or "landing",
            created_at=now,
            launch_email_sent=False,
        )
        doc = entry.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        memory_waitlist.append(doc)
        await email_service.send_welcome_email(entry.full_name, entry.email)
        return WaitlistResponse(
            success=True,
            message="You're officially on the waitlist",
            entry=entry,
        )

    existing = await db.waitlist.find_one(
        {"email": payload.email.lower()}, {"_id": 0}
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This email is already on the waitlist. Stay tuned for launch.",
        )

    now = datetime.now(timezone.utc)
    entry = WaitlistEntry(
        id=str(uuid.uuid4()),
        full_name=payload.full_name,
        email=payload.email.lower(),
        country_code=payload.country_code,
        phone=payload.phone,
        source=payload.source or "landing",
        created_at=now,
        launch_email_sent=False,
    )
    doc = entry.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.waitlist.insert_one(doc)

    # Real welcome email via Resend (falls back to MOCK if RESEND_API_KEY unset)
    welcome_id = await email_service.send_welcome_email(entry.full_name, entry.email)
    if welcome_id and not USE_MEMORY_DB:
        await db.waitlist.update_one(
            {"id": entry.id},
            {"$set": {"welcome_email_id": welcome_id}},
        )

    # Every Nth signup → send founder a PDF batch report
    await _maybe_send_admin_batch()

    return WaitlistResponse(
        success=True,
        message="You're officially on the waitlist ✨",
        entry=entry,
    )


ADMIN_BATCH_SIZE = int(os.environ.get("ADMIN_BATCH_SIZE", "5"))


async def _maybe_send_admin_batch():
    """Send a PDF founder-brief every `ADMIN_BATCH_SIZE` un-reported signups."""
    if USE_MEMORY_DB:
        return

    pending_filter = {"admin_reported": {"$ne": True}, "id": {"$exists": True}}
    pending_count = await db.waitlist.count_documents(pending_filter)
    if pending_count < ADMIN_BATCH_SIZE:
        return

    cursor = (
        db.waitlist.find(pending_filter, {"_id": 0})
        .sort("created_at", 1)
        .limit(ADMIN_BATCH_SIZE)
    )
    batch = await cursor.to_list(length=ADMIN_BATCH_SIZE)
    if not batch:
        return

    total_so_far = await db.waitlist.count_documents({})
    pdf_bytes = pdf_reports.build_waitlist_pdf(
        batch,
        batch_label=f"Members {total_so_far - ADMIN_BATCH_SIZE + 1} – {total_so_far}",
        total_so_far=total_so_far,
    )
    notif_id = await email_service.send_admin_batch_notification(
        batch, total_so_far, pdf_bytes
    )

    ids = [b["id"] for b in batch]
    await db.waitlist.update_many(
        {"id": {"$in": ids}},
        {"$set": {"admin_reported": True, "admin_report_id": notif_id or ""}},
    )


@api_router.get("/waitlist/stats", response_model=WaitlistStats)
async def waitlist_stats():
    real_count = (
        len(memory_waitlist)
        if USE_MEMORY_DB
        else await db.waitlist.count_documents({})
    )
    # Curated hype baseline + actual signups
    return WaitlistStats(
        total_members=10000 + real_count,
        stores_joining=250,
        premium_collections=50,
    )


@api_router.get("/marketplace/stats", response_model=MarketplaceStats)
async def marketplace_stats():
    waitlist_count = (
        len(memory_waitlist)
        if USE_MEMORY_DB
        else await db.waitlist.count_documents({})
    )
    if USE_MEMORY_DB:
        active_shops = [s for s in memory_shops if s.get("is_active", True)]
        active_products = [p for p in memory_products if p.get("is_active", True)]
        featured = [p for p in active_products if p.get("is_featured")]
        return MarketplaceStats(
            shops=len(active_shops),
            products=len(active_products),
            featured_products=len(featured),
            waitlist_members=10000 + waitlist_count,
        )

    return MarketplaceStats(
        shops=await db.shops.count_documents({"is_active": {"$ne": False}}),
        products=await db.products.count_documents({"is_active": {"$ne": False}}),
        featured_products=await db.products.count_documents({"is_active": {"$ne": False}, "is_featured": True}),
        waitlist_members=10000 + waitlist_count,
    )


@api_router.get("/shops", response_model=List[Shop])
async def list_shops(active_only: bool = True, limit: int = Query(default=100, ge=1, le=200)):
    if USE_MEMORY_DB:
        docs = memory_shops
        if active_only:
            docs = [s for s in docs if s.get("is_active", True)]
        return [Shop(**_clean_doc(d)) for d in docs[:limit]]

    filter_doc = {"is_active": {"$ne": False}} if active_only else {}
    cursor = db.shops.find(filter_doc, {"_id": 0}).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [Shop(**_clean_doc(d)) for d in docs]


@api_router.get("/products", response_model=List[Product])
async def list_products(
    shop_id: Optional[str] = None,
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    active_only: bool = True,
    limit: int = Query(default=100, ge=1, le=200),
):
    if USE_MEMORY_DB:
        docs = memory_products
        if active_only:
            docs = [p for p in docs if p.get("is_active", True)]
        if shop_id:
            docs = [p for p in docs if p.get("shop_id") == shop_id]
        if category:
            docs = [p for p in docs if p.get("category", "").lower() == category.lower()]
        if featured is not None:
            docs = [p for p in docs if bool(p.get("is_featured")) == featured]
        return [Product(**_clean_doc(d)) for d in docs[:limit]]

    filter_doc = {}
    if active_only:
        filter_doc["is_active"] = {"$ne": False}
    if shop_id:
        filter_doc["shop_id"] = shop_id
    if category:
        filter_doc["category"] = {"$regex": f"^{re.escape(category)}$", "$options": "i"}
    if featured is not None:
        filter_doc["is_featured"] = featured

    cursor = db.products.find(filter_doc, {"_id": 0}).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [Product(**_clean_doc(d)) for d in docs]


@api_router.post("/admin/shops", response_model=Shop, status_code=201, dependencies=[Depends(_require_admin)])
async def create_shop(payload: ShopCreate):
    now = _now_iso()
    shop_id = str(uuid.uuid4())
    slug = _slugify(payload.slug or payload.name)
    doc = payload.model_dump()
    doc.update({"id": shop_id, "slug": slug, "created_at": now, "updated_at": now})

    if USE_MEMORY_DB:
        if any(s["slug"] == slug for s in memory_shops):
            raise HTTPException(status_code=409, detail="A shop with this slug already exists")
        memory_shops.append(doc)
        return Shop(**_clean_doc(doc))

    if await db.shops.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="A shop with this slug already exists")
    await db.shops.insert_one(doc)
    return Shop(**_clean_doc(doc))


@api_router.patch("/admin/shops/{shop_id}", response_model=Shop, dependencies=[Depends(_require_admin)])
async def update_shop(shop_id: str, payload: ShopUpdate):
    changes = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "slug" in changes:
        changes["slug"] = _slugify(changes["slug"])
    elif "name" in changes:
        changes["slug"] = _slugify(changes["name"])
    changes["updated_at"] = _now_iso()

    if USE_MEMORY_DB:
        for shop in memory_shops:
            if shop["id"] == shop_id:
                shop.update(changes)
                for product in memory_products:
                    if product.get("shop_id") == shop_id:
                        product["shop_name"] = shop["name"]
                return Shop(**_clean_doc(shop))
        raise HTTPException(status_code=404, detail="Shop not found")

    result = await db.shops.find_one_and_update(
        {"id": shop_id},
        {"$set": changes},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Shop not found")
    if "name" in changes:
        await db.products.update_many({"shop_id": shop_id}, {"$set": {"shop_name": result["name"]}})
    return Shop(**_clean_doc(result))


@api_router.delete("/admin/shops/{shop_id}", dependencies=[Depends(_require_admin)])
async def archive_shop(shop_id: str):
    if USE_MEMORY_DB:
        for shop in memory_shops:
            if shop["id"] == shop_id:
                shop["is_active"] = False
                shop["updated_at"] = _now_iso()
                for product in memory_products:
                    if product.get("shop_id") == shop_id:
                        product["is_active"] = False
                return {"success": True, "message": "Shop archived"}
        raise HTTPException(status_code=404, detail="Shop not found")

    result = await db.shops.update_one(
        {"id": shop_id},
        {"$set": {"is_active": False, "updated_at": _now_iso()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    await db.products.update_many({"shop_id": shop_id}, {"$set": {"is_active": False, "updated_at": _now_iso()}})
    return {"success": True, "message": "Shop archived"}


@api_router.post("/admin/products", response_model=Product, status_code=201, dependencies=[Depends(_require_admin)])
async def create_product(payload: ProductCreate):
    if not await _shop_exists(payload.shop_id):
        raise HTTPException(status_code=400, detail="Select a valid active shop first")

    now = _now_iso()
    product_id = str(uuid.uuid4())
    slug = _slugify(payload.slug or payload.name)
    doc = payload.model_dump()
    doc.update({"id": product_id, "slug": slug, "created_at": now, "updated_at": now})

    if USE_MEMORY_DB:
        shop = next(s for s in memory_shops if s["id"] == payload.shop_id)
        doc["shop_name"] = shop["name"]
        if any(p["slug"] == slug for p in memory_products):
            raise HTTPException(status_code=409, detail="A product with this slug already exists")
        memory_products.append(doc)
        return Product(**_clean_doc(doc))

    shop = await db.shops.find_one({"id": payload.shop_id}, {"_id": 0})
    doc["shop_name"] = shop["name"]
    if await db.products.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="A product with this slug already exists")
    await db.products.insert_one(doc)
    return Product(**_clean_doc(doc))


@api_router.patch("/admin/products/{product_id}", response_model=Product, dependencies=[Depends(_require_admin)])
async def update_product(product_id: str, payload: ProductUpdate):
    changes = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "slug" in changes:
        changes["slug"] = _slugify(changes["slug"])
    elif "name" in changes:
        changes["slug"] = _slugify(changes["name"])
    if "shop_id" in changes:
        if not await _shop_exists(changes["shop_id"]):
            raise HTTPException(status_code=400, detail="Select a valid active shop first")
        if USE_MEMORY_DB:
            changes["shop_name"] = next(s["name"] for s in memory_shops if s["id"] == changes["shop_id"])
        else:
            shop = await db.shops.find_one({"id": changes["shop_id"]}, {"_id": 0})
            changes["shop_name"] = shop["name"]
    changes["updated_at"] = _now_iso()

    if USE_MEMORY_DB:
        for product in memory_products:
            if product["id"] == product_id:
                product.update(changes)
                return Product(**_clean_doc(product))
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.products.find_one_and_update(
        {"id": product_id},
        {"$set": changes},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**_clean_doc(result))


@api_router.delete("/admin/products/{product_id}", dependencies=[Depends(_require_admin)])
async def archive_product(product_id: str):
    if USE_MEMORY_DB:
        for product in memory_products:
            if product["id"] == product_id:
                product["is_active"] = False
                product["updated_at"] = _now_iso()
                return {"success": True, "message": "Product archived"}
        raise HTTPException(status_code=404, detail="Product not found")

    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_active": False, "updated_at": _now_iso()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "message": "Product archived"}


@api_router.get("/admin/waitlist", response_model=List[WaitlistEntry])
async def admin_list_waitlist(limit: int = 100):
    if USE_MEMORY_DB:
        docs = sorted(memory_waitlist, key=lambda d: d["created_at"], reverse=True)[:limit]
        return [_entry_from_doc(d.copy()) for d in docs]

    cursor = db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_entry_from_doc(d) for d in docs]


@api_router.post("/admin/send-batch-now")
async def send_batch_now(size: int = 5, to: Optional[str] = None):
    """Force-send the next pending batch as a PDF brief.

    Optional `to` overrides ADMIN_NOTIFICATION_EMAIL — useful during Resend
    testing-mode when only your verified Resend signup email can receive.
    Marks the batched entries as `admin_reported=True`.
    """
    if USE_MEMORY_DB:
        batch = memory_waitlist[-max(1, size):]
        if not batch:
            raise HTTPException(status_code=404, detail="No waitlist entries to report yet.")

        pdf_bytes = pdf_reports.build_waitlist_pdf(
            batch,
            batch_label=f"Manual brief · {len(batch)} member(s)",
            total_so_far=len(memory_waitlist),
        )
        notif_id = await email_service.send_admin_batch_notification(
            batch, len(memory_waitlist), pdf_bytes, override_to=to
        )
        return {
            "success": bool(notif_id),
            "sent_count": len(batch) if notif_id else 0,
            "email_id": notif_id,
            "admin_email": (to or email_service.ADMIN_NOTIFICATION_EMAIL),
            "pdf_bytes": len(pdf_bytes),
        }

    cursor = (
        db.waitlist.find({"admin_reported": {"$ne": True}}, {"_id": 0})
        .sort("created_at", 1)
        .limit(max(1, size))
    )
    batch = await cursor.to_list(length=max(1, size))
    if not batch:
        # Fall back to the most-recent entries so a test always returns something
        cursor = db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).limit(max(1, size))
        batch = await cursor.to_list(length=max(1, size))

    if not batch:
        raise HTTPException(status_code=404, detail="No waitlist entries to report yet.")

    total = await db.waitlist.count_documents({})
    pdf_bytes = pdf_reports.build_waitlist_pdf(
        batch, batch_label=f"Manual brief · {len(batch)} member(s)", total_so_far=total
    )
    notif_id = await email_service.send_admin_batch_notification(
        batch, total, pdf_bytes, override_to=to
    )

    if notif_id and not notif_id.startswith("mock"):
        ids = [b["id"] for b in batch]
        await db.waitlist.update_many(
            {"id": {"$in": ids}},
            {"$set": {"admin_reported": True, "admin_report_id": notif_id}},
        )

    return {
        "success": bool(notif_id),
        "sent_count": len(batch) if notif_id else 0,
        "email_id": notif_id,
        "admin_email": (to or email_service.ADMIN_NOTIFICATION_EMAIL),
        "pdf_bytes": len(pdf_bytes),
    }


@api_router.post(
    "/admin/trigger-launch-email",
    response_model=MockEmailResult,
)
async def trigger_launch_email():
    """Launch-day email burst via Resend.

    Sends the branded launch email to every waitlist member who hasn't received
    it yet. Marks `launch_email_sent=True` so users are never double-sent.
    If RESEND_API_KEY is missing, email_service silently falls back to MOCK.
    """
    subject = "ShopLiveBharat Is Now Live ✨"

    sent = 0
    failed = 0
    if USE_MEMORY_DB:
        for doc in memory_waitlist:
            if doc.get("launch_email_sent"):
                continue
            email_id = await email_service.send_launch_email(
                doc.get("full_name", ""), doc.get("email", "")
            )
            if email_id:
                doc["launch_email_sent"] = True
                doc["launch_email_id"] = email_id
                sent += 1
            else:
                failed += 1
        return MockEmailResult(
            success=True,
            sent_count=sent,
            skipped=failed,
            message=f"Launch dispatch complete. Subject: {subject}. Failed: {failed}",
        )

    cursor = db.waitlist.find({"launch_email_sent": {"$ne": True}}, {"_id": 0})
    async for doc in cursor:
        email_id = await email_service.send_launch_email(
            doc.get("full_name", ""), doc.get("email", "")
        )
        if email_id:
            await db.waitlist.update_one(
                {"id": doc["id"]},
                {"$set": {"launch_email_sent": True, "launch_email_id": email_id}},
            )
            sent += 1
        else:
            failed += 1

    return MockEmailResult(
        success=True,
        sent_count=sent,
        skipped=failed,
        message=f"Launch dispatch complete. Subject: {subject}. Failed: {failed}",
    )


# Mount router FIRST (before static files)
app.include_router(api_router)

# Mount static files (images, assets) from frontend public folder
static_files_path = ROOT_DIR.parent / "frontend" / "public"
if static_files_path.exists():
    app.mount("/", StaticFiles(directory=str(static_files_path), html=True), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    if USE_MEMORY_DB:
        await _get_or_create_launch_date()
        await _seed_marketplace()
        logger.warning("Using ephemeral in-memory data store; configure MongoDB Atlas for persistence")
        return

    # Ensure unique index on email and pre-create launch date
    await _backfill_waitlist_ids()
    await db.waitlist.create_index("email", unique=True)
    await db.shops.create_index("slug", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("shop_id")
    await _seed_marketplace()
    await _get_or_create_launch_date()
    logger.info("ShopLiveBharat API started")


@app.on_event("shutdown")
async def on_shutdown():
    if client:
        client.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
