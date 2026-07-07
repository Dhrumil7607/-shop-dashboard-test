/**
 * SellerLive.jsx — /seller/live
 * Seller-controlled live-shopping availability. Create / edit / pause / remove
 * slots. Each slot has date, start/end time, timezone, capacity, and status.
 * Slots flow directly into the public /live-shopping booking system.
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Plus, ChevronLeft, Calendar, Clock, Users,
  Pause, Play, Trash2, CheckCircle2, XCircle, Ban,
} from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSellerSlots, sellerCreateSlot, sellerUpdateSlot, sellerDeleteSlot, getSellerShop,
} from "@/lib/api";

const STATUS_STYLE = {
  available: { bg: "rgba(45,122,58,0.1)",  text: "#2D7A3A", label: "Available" },
  booked:    { bg: "rgba(27,42,107,0.1)",  text: "#1B2A6B", label: "Booked" },
  blocked:   { bg: "rgba(155,139,122,0.15)", text: "#6B5E52", label: "Paused" },
  completed: { bg: "rgba(45,122,58,0.15)", text: "#1A6B2A", label: "Completed" },
  cancelled: { bg: "rgba(139,58,58,0.1)",  text: "#8B3A3A", label: "Cancelled" },
};

function SlotModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    date: "", start_time: "", end_time: "", timezone: "Asia/Kolkata",
    one_on_one: true, max_bookings: 1,
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.date || !form.start_time || !form.end_time) {
      toast.error("Date, start and end time are required"); return;
    }
    if (form.end_time <= form.start_time) {
      toast.error("End time must be after start time"); return;
    }
    onSave(form);
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: "white" }}>
        <h3 className="font-serif text-xl mb-5" style={{ color: "#1a1a1a" }}>
          {initial ? "Edit Slot" : "New Availability Slot"}
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Start</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>End</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Timezone</label>
            <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }}>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (ET)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AET)</option>
            </select>
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: "#E8E4DF" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>1-on-1 session</p>
              <p className="text-xs" style={{ color: "#9B8B7A" }}>Off = group session with capacity</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, one_on_one: !f.one_on_one }))}
              className="relative flex-shrink-0 rounded-full"
              style={{ width: 48, height: 26, padding: 0, border: "none", cursor: "pointer",
                backgroundColor: form.one_on_one ? "#2D7A3A" : "#D1CFC9", transition: "background-color 0.2s ease" }}>
              <span className="rounded-full"
                style={{ position: "absolute", top: 3, left: 3, width: 20, height: 20,
                  backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  transform: form.one_on_one ? "translateX(22px)" : "translateX(0)",
                  transition: "transform 0.2s ease" }} />
            </button>
          </div>
          {!form.one_on_one && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Max bookings</label>
              <input type="number" min="1" value={form.max_bookings}
                onChange={e => setForm(f => ({ ...f, max_bookings: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#C0392B" }}>
              {initial ? "Save Changes" : "Create Slot"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm border" style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function SellerLive() {
  const { isLoggedIn, isSeller } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState(null);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [adminDisabled, setAdminDisabled] = useState(false);

  const canGoPublic = completion
    ? (completion.profile_complete && completion.meets_product_minimum)
    : true;

  const refresh = useCallback(async () => {
    try {
      const [list, shop] = await Promise.all([
        getSellerSlots(),
        getSellerShop().catch(() => null),
      ]);
      setSlots(Array.isArray(list) ? list : []);
      if (shop) {
        setCompletion(shop.completion || null);
        setLiveEnabled(shop.liveShoppingEnabled !== false);
        setAdminDisabled(shop.admin_live_disabled === true);
      }
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/login", { replace: true }); return; }
    refresh();
  }, [isLoggedIn, isSeller, navigate, refresh]);

  const handleSave = async (form) => {
    try {
      if (editing) {
        await sellerUpdateSlot(editing.id, form);
        toast.success("Slot updated");
      } else {
        await sellerCreateSlot({ ...form });
        toast.success("Slot created — now visible in Live Shopping");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save slot to server");
      return;
    }
    setEditing(null);
    await refresh();
  };

  const doPause  = async (id) => { try { await sellerUpdateSlot(id, { status: "blocked" }); await refresh(); toast.success("Slot paused"); } catch { toast.error("Failed"); } };
  const doResume = async (id) => { try { await sellerUpdateSlot(id, { status: "available" }); await refresh(); toast.success("Slot available again"); } catch { toast.error("Failed"); } };
  const doRemove = async (id) => { if (!window.confirm("Remove this slot?")) return; try { await sellerDeleteSlot(id); await refresh(); toast.success("Slot removed"); } catch { toast.error("Failed"); } };
  const doStatus = async (id, s) => { try { await sellerUpdateSlot(id, { status: s }); await refresh(); toast.success(`Slot marked ${s}`); } catch { toast.error("Failed"); } };

  if (!isLoggedIn || !isSeller) return null;

  const openNew  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (slot) => { setEditing(slot); setShowModal(true); };

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">

          <div className="flex items-center gap-4 mb-8">
            <Link to="/seller/dashboard" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ChevronLeft size={20} style={{ color: "#6B5E52" }} />
            </Link>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>SELLER PORTAL</p>
              <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>Live Shopping Availability</h1>
            </div>
            <button onClick={openNew} disabled={!canGoPublic}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#C0392B" }}
              title={canGoPublic ? "Add a slot" : "Complete your profile first"}>
              <Plus size={15} /> Add Slot
            </button>
          </div>

          {/* Profile-completion lock */}
          {completion && !canGoPublic && (
            <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FCD34D" }}>
              <p className="font-semibold text-sm mb-1" style={{ color: "#92400E" }}>Complete your profile first</p>
              <p className="text-xs mb-3" style={{ color: "#92400E" }}>
                You must complete your store profile and add at least 3 valid products before creating live slots.
              </p>
              <Link to="/seller/settings" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white inline-block" style={{ backgroundColor: "#92400E" }}>
                Go to Store Settings
              </Link>
            </div>
          )}

          {/* Admin disabled live video */}
          {adminDisabled && (
            <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5" }}>
              <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
                Live video shopping has been disabled for your store by the admin. Your store will not appear in Live Shopping.
              </p>
            </div>
          )}

          {/* Live enabled status */}
          {canGoPublic && !adminDisabled && (
            <div className="rounded-2xl p-4 mb-6 flex items-center gap-2" style={{ backgroundColor: liveEnabled ? "#F0FDF4" : "#F5F5F4", border: `1px solid ${liveEnabled ? "#86EFAC" : "#E8E4DF"}` }}>
              <Radio size={16} style={{ color: liveEnabled ? "#2D7A3A" : "#9B8B7A" }} />
              <p className="text-sm font-medium" style={{ color: liveEnabled ? "#166534" : "#6B5E52" }}>
                Live video shopping is {liveEnabled ? "enabled" : "disabled"}.
                {liveEnabled ? " Available future slots make your store appear in Live Shopping." : " Enable it from your dashboard to appear in Live Shopping."}
              </p>
            </div>
          )}

          <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(135deg, rgba(192,57,43,0.06), rgba(162,70,107,0.06))", border: "1px solid rgba(192,57,43,0.15)" }}>
            <p className="font-semibold text-sm mb-2" style={{ color: "#C0392B" }}>How availability works</p>
            <ol className="space-y-1 text-sm" style={{ color: "#6B5E52" }}>
              <li>1. Add slots with a date, time window, and timezone.</li>
              <li>2. Available slots make your store appear in <strong>/live-shopping</strong>.</li>
              <li>3. Customers book an available slot — it locks so no one double-books.</li>
              <li>4. Pause a slot to hide it temporarily, or mark it completed/cancelled.</li>
            </ol>
          </div>

          {slots.length === 0 ? (
            <div className="text-center py-16">
              <Radio size={40} style={{ color: "#E8E4DF" }} className="mx-auto mb-3" />
              <p style={{ color: "#9B8B7A" }}>No slots yet. Add your first availability slot to appear in Live Shopping.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {slots.map((s, i) => {
                  const badge = STATUS_STYLE[s.status] || STATUS_STYLE.available;
                  return (
                    <motion.div key={s.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border"
                      style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "rgba(201,168,76,0.1)" }}>
                        <Calendar size={20} style={{ color: "#C9A84C" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EBE3", color: "#6B5E52" }}>
                            {s.one_on_one ? "1-on-1" : `Group · ${s.bookings_count || 0}/${s.max_bookings}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                            <Calendar size={12} style={{ color: "#9B8B7A" }} /> {s.date}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm" style={{ color: "#6B5E52" }}>
                            <Clock size={12} style={{ color: "#9B8B7A" }} /> {s.start_time}–{s.end_time}
                          </span>
                          <span className="text-xs" style={{ color: "#9B8B7A" }}>{s.timezone}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {s.status === "available" && (
                          <button onClick={() => doPause(s.id)} className="p-2 rounded-xl hover:bg-stone-50 transition" title="Pause slot">
                            <Pause size={16} style={{ color: "#9B8B7A" }} />
                          </button>
                        )}
                        {s.status === "blocked" && (
                          <button onClick={() => doResume(s.id)} className="p-2 rounded-xl hover:bg-green-50 transition" title="Make available">
                            <Play size={16} style={{ color: "#2D7A3A" }} />
                          </button>
                        )}
                        {(s.status === "available" || s.status === "booked" || s.status === "blocked") && (
                          <button onClick={() => doStatus(s.id, "completed")} className="p-2 rounded-xl hover:bg-green-50 transition" title="Mark completed">
                            <CheckCircle2 size={16} style={{ color: "#2D7A3A" }} />
                          </button>
                        )}
                        {s.status !== "cancelled" && s.status !== "completed" && (
                          <button onClick={() => doStatus(s.id, "cancelled")} className="p-2 rounded-xl hover:bg-red-50 transition" title="Cancel slot">
                            <Ban size={16} style={{ color: "#8B3A3A" }} />
                          </button>
                        )}
                        <button onClick={() => openEdit(s)} className="p-2 rounded-xl hover:bg-stone-50 transition" title="Edit slot">
                          <Clock size={16} style={{ color: "#6B5E52" }} />
                        </button>
                        <button onClick={() => doRemove(s.id)} className="p-2 rounded-xl hover:bg-red-50 transition" title="Remove slot">
                          <Trash2 size={16} style={{ color: "#C0392B" }} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Link to="/seller/bookings" className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: "#A2466B" }}>
              View bookings →
            </Link>
            <Link to="/live-shopping" className="text-sm inline-flex items-center gap-1" style={{ color: "#6B5E52" }}>
              Preview public Live Shopping ↗
            </Link>
          </div>
        </div>
      </div>

      {showModal && (
        <SlotModal
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
          initial={editing ? {
            date: editing.date, start_time: editing.start_time, end_time: editing.end_time,
            timezone: editing.timezone, one_on_one: editing.one_on_one, max_bookings: editing.max_bookings,
          } : null}
        />
      )}
    </SellerLayout>
  );
}
