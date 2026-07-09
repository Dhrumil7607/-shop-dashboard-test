/**
 * SellerSettings.jsx — /seller/settings
 *
 * Fully connected store & account settings for the logged-in seller.
 * Reads/writes the single source of truth (shopStore, localStorage key
 * "slb_shops") so every change persists across refresh/logout/login and
 * reflects on /seller/dashboard, /shops, /shops/:slug, /live-shopping and
 * the admin panel.
 *
 * Access: sellers only. Guarded by SellerLayout + local checks.
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, Store, Building2, Eye, Loader2, CheckCircle2,
  AlertCircle, Power, Radio, CalendarCheck, Plane,
} from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "@/components/ImageUpload";
import ChangePasswordCard from "@/components/ChangePasswordCard";

const SELLER_STORE_ID = "shop-heritage-couture";

function slugify(str) {
  return String(str || "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Field({ label, children, hint, required, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9B8B7A" }}>
        {label} {required && <span style={{ color: "#C0392B" }}>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs mt-1" style={{ color: "#B5A896" }}>{hint}</p>}
      {error && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#C0392B" }}><AlertCircle size={11} /> {error}</p>}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300";
const inputStyle = { borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" };

function Toggle({ on, onChange, color = "#2D7A3A" }) {
  return (
    <button type="button" onClick={onChange}
      className="relative flex-shrink-0 rounded-full"
      style={{ width: 48, height: 26, padding: 0, border: "none", cursor: "pointer",
        backgroundColor: on ? color : "#D1CFC9", transition: "background-color 0.2s ease" }}
      aria-pressed={on}>
      <span className="rounded-full"
        style={{ position: "absolute", top: 3, left: 3, width: 20, height: 20,
          backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          transform: on ? "translateX(22px)" : "translateX(0)", transition: "transform 0.2s ease" }} />
    </button>
  );
}

export default function SellerSettings() {
  const { isLoggedIn, isSeller, user } = useAuth();
  const navigate = useNavigate();
  const storeId = user?.store_id || SELLER_STORE_ID;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [savedAt, setSavedAt] = useState(null);
  const [completion, setCompletion] = useState(null); // from backend after save

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/seller/login", { replace: true }); return; }
    (async () => {
      try {
        const { getSellerShop } = await import("@/lib/api");
        const shop = await getSellerShop().catch(() => null) || {};
        setCompletion(shop.completion || null);
        setForm({
          // Store profile
          name: shop.name || user?.store_name || "",
          slug: shop.slug || "",
          description: shop.description || "",
          image_url: shop.image_url || "",
          banner_image: shop.banner_image || "",
          specialty: shop.specialty || "",
          city: shop.city || "",
          state: shop.state || "",
          country: shop.country || "India",
          contact_email: shop.contact_email || shop.owner_email || user?.email || "",
          phone: shop.phone || "",
          instagram_url: shop.instagram_url || "",
          website_url: shop.website_url || "",
          return_policy: shop.return_policy || "",
          shipping_policy: shop.shipping_policy || "",
          live_instructions: shop.live_instructions || "",
          // Business / account
          owner_name: shop.owner_name || user?.name || "",
          business_name: shop.business_name || "",
          gst_number: shop.gst_number || "",
          payout_account: shop.payout_account || "",
          notification_email: shop.notification_email || shop.owner_email || user?.email || "",
          // Visibility
          online: shop.online !== false,
          liveShoppingEnabled: shop.liveShoppingEnabled !== false,
          acceptsLiveBookings: shop.acceptsLiveBookings === true,
          vacation_mode: shop.vacation_mode === true,
        });
      } catch {
        toast.error("Could not load store settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, isSeller, navigate, storeId, user]);

  const validate = useCallback(async () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Store name is required";
    if (!form.slug?.trim()) e.slug = "Store URL slug is required";
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = "Use only lowercase letters, numbers and hyphens";
    // Slug uniqueness is checked server-side on save (409 response)
    if (form.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contact_email)) e.contact_email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, storeId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await validate();
      if (!ok) { setSaving(false); toast.error("Please fix the highlighted fields"); return; }

      // Vacation mode forces the store offline for visibility purposes
      const effectiveOnline = form.vacation_mode ? false : form.online;

      // Save to backend (single source of truth)
      try {
        const { updateSellerShop } = await import("@/lib/api");
        await updateSellerShop({
          name: form.name.trim(), slug: form.slug.trim().toLowerCase(),
          description: form.description, image_url: form.image_url, banner_image: form.banner_image,
          specialty: form.specialty, city: form.city, state: form.state, country: form.country,
          contact_email: form.contact_email, owner_email: form.contact_email, phone: form.phone,
          instagram_url: form.instagram_url, website_url: form.website_url,
          return_policy: form.return_policy, shipping_policy: form.shipping_policy,
          live_instructions: form.live_instructions, owner_name: form.owner_name,
          business_name: form.business_name, gst_number: form.gst_number,
          payout_account: form.payout_account, notification_email: form.notification_email,
          online: effectiveOnline, liveShoppingEnabled: form.liveShoppingEnabled,
          acceptsLiveBookings: form.acceptsLiveBookings, vacation_mode: form.vacation_mode,
          is_active: true,
        });
      } catch (err) {
        if (err?.response?.status === 409) {
          setErrors(e => ({ ...e, slug: "This store URL is already taken" }));
          setSaving(false);
          toast.error("That store URL is already taken");
          return;
        }
        throw err;
      }

      setSavedAt(Date.now());
      // Re-fetch completion status from backend response
      try {
        const { getSellerShop } = await import("@/lib/api");
        const updated = await getSellerShop().catch(() => null);
        if (updated?.completion) setCompletion(updated.completion);
      } catch {}
      if (completion && !completion.profile_complete) {
        toast.warning("Profile saved but incomplete — complete all required fields to go public.");
      } else {
        toast.success("Settings saved");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn || !isSeller) return null;

  if (loading || !form) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin" style={{ color: "#C9A84C" }} />
        </div>
      </SellerLayout>
    );
  }

  const publicUrl = `/shops/${form.slug}`;

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">

          <div className="flex items-center gap-4 mb-8">
            <Link to="/seller/dashboard" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ChevronLeft size={20} style={{ color: "#6B5E52" }} />
            </Link>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>SELLER PORTAL</p>
              <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>Store Settings</h1>
            </div>
            <Link to={publicUrl} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border"
              style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
              <Eye size={14} /> View store
            </Link>
          </div>

          {/* ── PROFILE COMPLETION BANNER ─────────────────────────── */}
          {completion && !completion.profile_complete && (
            <div className="mb-6 rounded-2xl p-5" style={{ backgroundColor: "#FFFBEB", border: "2px solid #FCD34D" }}>
              <p className="font-bold text-sm mb-2" style={{ color: "#92400E" }}>
                ⚠ Your store is not visible to customers yet
              </p>
              <p className="text-xs mb-3" style={{ color: "#92400E" }}>
                Complete all required fields below and add at least 3 products to appear on /shops, marketplace, and live booking.
              </p>
              <div className="flex flex-wrap gap-2">
                {(completion.missing_fields || []).map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                    Missing: {f.replace(/_/g, " ")}
                  </span>
                ))}
                {!completion.meets_product_minimum && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                    Need {completion.products_needed} more product{completion.products_needed !== 1 ? "s" : ""} ({completion.valid_products}/3 valid)
                  </span>
                )}
              </div>
            </div>
          )}
          {completion && completion.profile_complete && completion.meets_product_minimum && (
            <div className="mb-6 rounded-2xl p-4 flex items-center gap-2" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
              <CheckCircle2 size={16} style={{ color: "#2D7A3A" }} />
              <p className="text-sm font-medium" style={{ color: "#166534" }}>
                Profile complete — your store is live and visible to customers.
              </p>
            </div>
          )}

          {/* ── STORE VISIBILITY ─────────────────────────────────────── */}
          <section className="rounded-2xl border p-6 mb-6" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
            <div className="flex items-center gap-2 mb-5">
              <Power size={16} style={{ color: "#2D7A3A" }} />
              <h2 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>Store Visibility</h2>
            </div>
            <div className="space-y-4">
              {[
                { k: "online", label: "Store Online", desc: "Visible to customers in /shops and store page", color: "#2D7A3A", icon: Power },
                { k: "liveShoppingEnabled", label: "Live Shopping Enabled", desc: "Appears in /live-shopping when you have available future slots", color: "#C0392B", icon: Radio },
                { k: "acceptsLiveBookings", label: "Accept Bookings Without Slots", desc: "Let customers request live sessions even if you haven't published slots", color: "#1B2A6B", icon: CalendarCheck },
                { k: "vacation_mode", label: "Vacation Mode", desc: "Temporarily hide the store from all public pages", color: "#9B7520", icon: Plane },
              ].map(({ k, label, desc, color, icon: Icon }) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Icon size={16} style={{ color }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{label}</p>
                      <p className="text-xs" style={{ color: "#9B8B7A" }}>{desc}</p>
                    </div>
                  </div>
                  <Toggle on={form[k]} color={color} onChange={() => set(k, !form[k])} />
                </div>
              ))}
            </div>
          </section>

          {/* ── STORE PROFILE ─────────────────────────────────────────── */}
          <section className="rounded-2xl border p-6 mb-6" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
            <div className="flex items-center gap-2 mb-5">
              <Store size={16} style={{ color: "#A2466B" }} />
              <h2 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>Store Profile</h2>
            </div>
            <div className="space-y-4">
              <Field label="Store Name" required error={errors.name}>
                <input className={inputCls} style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} />
              </Field>
              <Field label="Public Store URL" required error={errors.slug}
                hint={`shoplivebharat.com${publicUrl}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "#9B8B7A" }}>/shops/</span>
                  <input className={inputCls} style={inputStyle} value={form.slug}
                    onChange={e => set("slug", slugify(e.target.value))}
                    onBlur={() => validate()} />
                </div>
              </Field>
              <Field label="Description" required hint="Minimum 10 characters — describe your store">
                <textarea rows={3} className={inputCls} style={inputStyle} value={form.description}
                  onChange={e => set("description", e.target.value)} placeholder="Tell customers about your store…" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload
                  label="Logo Image *"
                  hint="Required — appears in store cards and your seller profile"
                  value={form.image_url}
                  onUpload={url => set("image_url", url)}
                />
                <ImageUpload
                  label="Banner Image *"
                  hint="Required — header banner shown on your store page"
                  value={form.banner_image}
                  onUpload={url => set("banner_image", url)}
                />
              </div>
              <Field label="Category / Specialty" required hint="e.g. Lehengas, Sarees, Bridal">
                <input className={inputCls} style={inputStyle} value={form.specialty} onChange={e => set("specialty", e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="City" required><input className={inputCls} style={inputStyle} value={form.city} onChange={e => set("city", e.target.value)} /></Field>
                <Field label="State"><input className={inputCls} style={inputStyle} value={form.state} onChange={e => set("state", e.target.value)} /></Field>
                <Field label="Country"><input className={inputCls} style={inputStyle} value={form.country} onChange={e => set("country", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Email" error={errors.contact_email}>
                  <input className={inputCls} style={inputStyle} value={form.contact_email} onChange={e => set("contact_email", e.target.value)} />
                </Field>
                <Field label="Phone / WhatsApp" required>
                  <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Instagram URL"><input className={inputCls} style={inputStyle} value={form.instagram_url} onChange={e => set("instagram_url", e.target.value)} /></Field>
                <Field label="Website URL"><input className={inputCls} style={inputStyle} value={form.website_url} onChange={e => set("website_url", e.target.value)} /></Field>
              </div>
              <Field label="Return / Exchange Policy" required hint="Required to go public">
                <textarea rows={2} className={inputCls} style={inputStyle} value={form.return_policy} onChange={e => set("return_policy", e.target.value)} />
              </Field>
              <Field label="Shipping Policy" required hint="Required to go public">
                <textarea rows={2} className={inputCls} style={inputStyle} value={form.shipping_policy} onChange={e => set("shipping_policy", e.target.value)} />
              </Field>
              <Field label="Live Shopping Instructions">
                <textarea rows={2} className={inputCls} style={inputStyle} value={form.live_instructions} onChange={e => set("live_instructions", e.target.value)} placeholder="What customers can expect in a live session…" />
              </Field>
            </div>
          </section>

          {/* ── BUSINESS / ACCOUNT ────────────────────────────────────── */}
          <section className="rounded-2xl border p-6 mb-6" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={16} style={{ color: "#1B2A6B" }} />
              <h2 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>Business & Account</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Owner Name"><input className={inputCls} style={inputStyle} value={form.owner_name} onChange={e => set("owner_name", e.target.value)} /></Field>
                <Field label="Business Name"><input className={inputCls} style={inputStyle} value={form.business_name} onChange={e => set("business_name", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="GST / Tax ID"><input className={inputCls} style={inputStyle} value={form.gst_number} onChange={e => set("gst_number", e.target.value)} /></Field>
                <Field label="Payout Account" hint="Bank account or UPI for payouts">
                  <input className={inputCls} style={inputStyle} value={form.payout_account} onChange={e => set("payout_account", e.target.value)} />
                </Field>
              </div>
              <Field label="Notification Email">
                <input className={inputCls} style={inputStyle} value={form.notification_email} onChange={e => set("notification_email", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* ── SAVE BAR ──────────────────────────────────────────────── */}
          <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-lg"
            style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
            <p className="text-xs" style={{ color: "#9B8B7A" }}>
              {savedAt && completion ? (
                completion.profile_complete && completion.meets_product_minimum ? (
                  <span className="inline-flex items-center gap-1" style={{ color: "#2D7A3A" }}>
                    <CheckCircle2 size={13} /> Store is live and visible to customers
                  </span>
                ) : (
                  <span style={{ color: "#92400E" }}>
                    ⚠ Saved but incomplete — {completion.missing_fields?.length > 0 ? `missing: ${completion.missing_fields.join(", ")}` : ""}{!completion.meets_product_minimum ? ` · need ${completion.products_needed} more product(s)` : ""}
                  </span>
                )
              ) : savedAt ? (
                <span className="inline-flex items-center gap-1" style={{ color: "#2D7A3A" }}>
                  <CheckCircle2 size={13} /> Saved
                </span>
              ) : "Complete all required (*) fields to appear publicly."}
            </p>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: "#1a1a1a" }}>
              {saving ? (<><Loader2 size={15} className="animate-spin" /> Saving…</>) : "Save Changes"}
            </button>
          </div>

          {/* ── ACCOUNT SECURITY ──────────────────────────────────────── */}
          <div className="mt-6">
            <ChangePasswordCard />
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
