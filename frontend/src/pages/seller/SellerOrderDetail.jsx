/**
 * SellerOrderDetail.jsx — /seller/orders/:orderId
 *
 * Full order view for the logged-in seller: customer contact + shipping
 * address, this seller's line items, order total, status control, and an
 * AWB / tracking number input. All changes persist to the backend
 * (PATCH /api/seller/orders/{id}).
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, User, Mail, Phone, MapPin, Package, Truck,
  Loader2, CheckCircle2, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getSellerOrder, sellerUpdateOrder } from "@/lib/api";

const STATUS_OPTS = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_STYLE = {
  pending:    { bg: "rgba(201,168,76,0.12)", text: "#9B7520" },
  processing: { bg: "rgba(27,42,107,0.1)",  text: "#1B2A6B" },
  confirmed:  { bg: "rgba(45,122,58,0.1)",  text: "#2D7A3A" },
  shipped:    { bg: "rgba(162,70,107,0.1)", text: "#A2466B" },
  delivered:  { bg: "rgba(45,122,58,0.15)", text: "#1A6B2A" },
  cancelled:  { bg: "rgba(139,58,58,0.1)",  text: "#8B3A3A" },
};

const COURIERS = ["", "Delhivery", "Blue Dart", "DTDC", "Ekart", "India Post", "Shiprocket", "FedEx", "DHL", "Other"];

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} style={{ color: "#9B8B7A" }} className="mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9B8B7A" }}>{label}</p>
        <p className="text-sm" style={{ color: "#1a1a1a" }}>{value}</p>
      </div>
    </div>
  );
}

export default function SellerOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isSeller } = useAuth();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [status, setStatus] = useState("pending");
  const [awb, setAwb] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const o = await getSellerOrder(orderId);
      setOrder(o);
      setStatus(o.status || "pending");
      setAwb(o.tracking_number || o.awb || "");
      setCourier(o.courier || "");
      setTrackingUrl(o.tracking_url || "");
      setNotes(o.seller_notes || "");
    } catch (err) {
      if (err?.response?.status === 403) toast.error("This order isn't part of your store");
      else if (err?.response?.status === 404) toast.error("Order not found");
      else toast.error("Could not load order");
      navigate("/seller/orders", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/seller/login", { replace: true }); return; }
    load();
  }, [isLoggedIn, isSeller, navigate, load]);

  const save = async () => {
    if (["shipped", "delivered"].includes(status) && !awb.trim()) {
      toast.error("Enter an AWB / tracking number before marking shipped");
      return;
    }
    setSaving(true);
    try {
      const updated = await sellerUpdateOrder(orderId, {
        status,
        tracking_number: awb.trim(),
        awb: awb.trim(),
        courier,
        tracking_url: trackingUrl.trim(),
        seller_notes: notes,
      });
      setOrder(updated);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to save — order not updated");
    } finally {
      setSaving(false);
    }
  };

  const copyAwb = () => { if (awb) { navigator.clipboard.writeText(awb); toast.success("AWB copied"); } };

  if (!isLoggedIn || !isSeller) return null;

  if (loading || !order) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin" style={{ color: "#C9A84C" }} />
        </div>
      </SellerLayout>
    );
  }

  const badge = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
  const items = order.items || [];
  const sellerTotal = order.seller_total ?? items.reduce((s, i) => s + (i.line_total || (i.price || 0) * (i.quantity || 1)), 0);

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/seller/orders" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ChevronLeft size={20} style={{ color: "#6B5E52" }} />
            </Link>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>SELLER PORTAL · ORDER</p>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl md:text-3xl font-mono" style={{ color: "#1a1a1a", fontWeight: 400 }}>{order.id}</h1>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize"
                  style={{ backgroundColor: badge.bg, color: badge.text }}>{order.status}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#9B8B7A" }}>
                Placed {order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "—"}
                {order.payment_status ? ` · Payment: ${order.payment_status}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: items + customer */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items */}
              <section className="rounded-2xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Package size={16} style={{ color: "#A2466B" }} />
                  <h2 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>Your Items ({items.length})</h2>
                </div>
                <div className="space-y-3">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#FAF9F6" }}>
                      {it.image_url && (
                        <img src={it.image_url} alt={it.product_name}
                          className="w-14 h-16 rounded-lg object-cover flex-shrink-0" style={{ backgroundColor: "#F0EBE3" }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>{it.product_name}</p>
                        <p className="text-xs" style={{ color: "#9B8B7A" }}>
                          Qty {it.quantity}{it.size ? ` · Size ${it.size}` : ""}{it.color ? ` · ${it.color}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                        {formatPrice(it.line_total || (it.price || 0) * (it.quantity || 1))}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "#E8E4DF" }}>
                  <span className="text-sm" style={{ color: "#6B5E52" }}>Your items total</span>
                  <span className="text-lg font-bold" style={{ color: "#1a1a1a" }}>{formatPrice(sellerTotal)}</span>
                </div>
              </section>

              {/* Customer + shipping */}
              <section className="rounded-2xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                <div className="flex items-center gap-2 mb-4">
                  <User size={16} style={{ color: "#1B2A6B" }} />
                  <h2 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>Customer & Shipping</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Row icon={User} label="Name" value={order.customer_name} />
                  <Row icon={Mail} label="Email" value={order.customer_email} />
                  <Row icon={Phone} label="Phone" value={order.customer_phone} />
                  <Row icon={MapPin} label="Shipping Address" value={order.customer_address} />
                </div>
              </section>
            </div>

            {/* RIGHT: status + AWB */}
            <div className="space-y-6">
              {/* Status */}
              <section className="rounded-2xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                <h2 className="font-semibold text-base mb-4" style={{ color: "#1a1a1a" }}>Order Status</h2>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none capitalize"
                  style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" }}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <p className="text-xs mt-2" style={{ color: "#9B8B7A" }}>
                  Marking as shipped/delivered requires an AWB number.
                </p>
              </section>

              {/* Shipping / AWB */}
              <section className="rounded-2xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Truck size={16} style={{ color: "#2D7A3A" }} />
                  <h2 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>Shipment / AWB</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9B8B7A" }}>Courier</label>
                    <select value={courier} onChange={e => setCourier(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" }}>
                      {COURIERS.map(c => <option key={c} value={c}>{c || "Select courier"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9B8B7A" }}>AWB / Tracking Number</label>
                    <div className="flex gap-2">
                      <input value={awb} onChange={e => setAwb(e.target.value)}
                        placeholder="e.g. 1234567890123"
                        className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none font-mono"
                        style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" }} />
                      {awb && (
                        <button onClick={copyAwb} className="px-3 rounded-xl border" style={{ borderColor: "#E8E4DF" }} title="Copy AWB">
                          <Copy size={15} style={{ color: "#6B5E52" }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9B8B7A" }}>Tracking URL (optional)</label>
                    <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)}
                      placeholder="https://…"
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" }} />
                    {trackingUrl && (
                      <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-1" style={{ color: "#A2466B" }}>
                        <ExternalLink size={11} /> Open tracking
                      </a>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9B8B7A" }}>Internal notes</label>
                    <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" }} />
                  </div>
                </div>
              </section>

              <button onClick={save} disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "#1a1a1a" }}>
                {saving ? (<><Loader2 size={15} className="animate-spin" /> Saving…</>) : (<><CheckCircle2 size={15} /> Save Order</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
