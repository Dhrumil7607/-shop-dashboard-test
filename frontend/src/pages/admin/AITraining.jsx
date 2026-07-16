/**
 * AITraining.jsx — /admin/ai-training
 * Admin management of private AI Try-On 360° videos:
 * processing status, storage usage, queue, reprocess & delete.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Video, RefreshCw, Trash2, HardDrive, Loader2, CheckCircle2, AlertTriangle, Clock, Database } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import { adminAiTrainingList, adminAiTrainingStats, adminReprocessAiTraining, adminDeleteAiTraining } from "@/lib/api";

const STATUS_STYLE = {
  queued:     { label: "Queued",       cls: "bg-stone-100 text-stone-600", Icon: Clock },
  processing: { label: "Processing",   cls: "bg-amber-100 text-amber-700", Icon: Loader2 },
  ready:      { label: "AI Optimized", cls: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  failed:     { label: "Failed",       cls: "bg-red-100 text-red-700",     Icon: AlertTriangle },
};

function fmtMB(bytes) {
  if (!bytes) return "0 MB";
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function AdminAITraining() {
  const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([adminAiTrainingList(adminKey), adminAiTrainingStats(adminKey)]);
      setItems(list); setStats(s);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh while anything is in the queue.
  useEffect(() => {
    if (!stats.queue) return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [stats.queue, load]);

  const reprocess = async (id) => {
    setBusy(id);
    try { await adminReprocessAiTraining(id, adminKey); toast.success("Reprocessing started"); await load(); }
    catch { toast.error("Could not reprocess"); }
    finally { setBusy(""); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this AI video and its processed data? This cannot be undone.")) return;
    setBusy(id);
    try { await adminDeleteAiTraining(id, adminKey); toast.success("Deleted"); await load(); }
    catch { toast.error("Could not delete"); }
    finally { setBusy(""); }
  };

  const cards = [
    { label: "Total videos", value: stats.total ?? 0, Icon: Video },
    { label: "Storage used", value: `${stats.total_mb ?? 0} MB`, Icon: Database },
    { label: "In queue", value: stats.queue ?? 0, Icon: Clock },
    { label: "Optimized", value: stats.by_status?.ready ?? 0, Icon: CheckCircle2 },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">AI Try-On Training</h1>
            <p className="text-sm text-stone-500">Private 360° garment videos — processing status &amp; storage.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50" style={{ borderColor: "#E8E4DF" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {!stats.cloudinary && (
          <div className="mb-5 flex items-center gap-2 rounded-xl p-3 text-sm" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
            <AlertTriangle size={15} /> Cloudinary isn’t configured — video uploads are disabled until credentials are set.
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {cards.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E8E4DF" }}>
              <Icon size={16} style={{ color: "#C9A84C" }} />
              <p className="mt-2 text-2xl font-bold text-stone-800">{value}</p>
              <p className="text-xs text-stone-500">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-stone-500 py-16 justify-center"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "#E8E4DF" }}>
            <HardDrive className="mx-auto mb-3 text-stone-300" size={32} />
            <p className="text-stone-500">No AI training videos uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const st = STATUS_STYLE[it.status] || STATUS_STYLE.queued;
              const StIcon = st.Icon;
              return (
                <motion.div key={it.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                  className="flex flex-col md:flex-row md:items-center gap-4 rounded-2xl border bg-white p-4" style={{ borderColor: "#E8E4DF" }}>
                  <div className="flex-shrink-0">
                    {it.preview_url ? (
                      <video src={it.preview_url} className="rounded-xl bg-black" style={{ width: 120, height: 80, objectFit: "cover" }} muted />
                    ) : (
                      <div className="flex items-center justify-center rounded-xl bg-stone-100" style={{ width: 120, height: 80 }}>
                        <Video size={22} className="text-stone-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                        <StIcon size={11} className={it.status === "processing" ? "animate-spin" : ""} /> {st.label}
                      </span>
                      <p className="font-semibold text-stone-800 truncate">{it.product_name || it.product_id}</p>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{it.shop_name}</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      {fmtMB(it.bytes)}{it.duration ? ` · ${Math.round(it.duration)}s` : ""}{it.has_profile ? " · profile ready" : ""}
                    </p>
                    {it.status === "failed" && it.error && (
                      <p className="text-[11px] text-red-600 mt-1">{it.error}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button disabled={busy === it.id} onClick={() => reprocess(it.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50" style={{ borderColor: "#E8E4DF" }}>
                      <RefreshCw size={13} /> Reprocess
                    </button>
                    <button disabled={busy === it.id} onClick={() => remove(it.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50" style={{ borderColor: "#E8E4DF" }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
