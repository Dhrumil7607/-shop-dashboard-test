/**
 * notify.jsx — ShopLiveBharat premium notification system.
 *
 * Drop-in replacement for `sonner` (aliased in craco.config.js), so every
 * existing `import { toast } from "sonner"` and `<Toaster/>` keeps working but
 * renders this luxury notification UI instead.
 *
 * Design: white card, #ECE8E1 border, 20px radius, gold top accent, soft shadow,
 * animated Lucide icon, title + description, bottom progress bar. Top-center on
 * desktop, top on mobile. Max 3, newest on top. Hover pauses timer, swipe to
 * dismiss (mobile), ESC closes latest. Framer Motion only, ≤180ms, GPU transforms.
 */
import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShoppingBag, Heart, Video, Truck, CreditCard, CheckCircle2,
  AlertTriangle, XCircle, Loader2, Info, PartyPopper, ShieldCheck,
} from "lucide-react";

// ── Store ─────────────────────────────────────────────────────────────────────
const MAX = 3;
let items = [];
let counter = 0;
const listeners = new Set();
const emit = () => { const snap = [...items]; listeners.forEach((l) => l(snap)); };
const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
const getSnapshot = () => items;

function upsert(n) {
  const id = n.id != null ? n.id : ++counter;
  const idx = items.findIndex((x) => x.id === id);
  if (idx >= 0) {
    items = items.map((x, i) => (i === idx ? { ...x, ...n, id, key: x.key } : x));
  } else {
    items = [{ id, key: `${id}-${Date.now()}`, createdAt: Date.now(), ...n }, ...items].slice(0, MAX);
  }
  emit();
  return id;
}
function remove(id) { items = items.filter((x) => x.id !== id); emit(); }

// ── toast API (sonner-compatible) ──────────────────────────────────────────────
const DEFAULT_DURATION = 4200;
function make(type, message, opts = {}) {
  const duration = type === "loading" ? (opts.duration ?? Infinity) : (opts.duration ?? DEFAULT_DURATION);
  return upsert({
    type,
    title: typeof message === "string" ? message : (opts.title || ""),
    node: typeof message !== "string" ? message : null,
    description: opts.description,
    duration,
    icon: opts.icon,
    href: opts.href,
    action: opts.action,
    id: opts.id,
  });
}
export const toast = (message, opts) => make("default", message, opts);
toast.success = (m, o) => make("success", m, o);
toast.error = (m, o) => make("error", m, o);
toast.warning = (m, o) => make("warning", m, o);
toast.info = (m, o) => make("info", m, o);
toast.message = (m, o) => make("default", m, o);
toast.loading = (m, o) => make("loading", m, o);
toast.custom = (m, o) => make("default", m, o);
toast.dismiss = (id) => { if (id == null) { items = []; emit(); } else remove(id); };
toast.promise = (promise, msgs = {}) => {
  const id = make("loading", msgs.loading || "Working…");
  Promise.resolve(promise)
    .then((v) => make("success", typeof msgs.success === "function" ? msgs.success(v) : (msgs.success || "Done"), { id }))
    .catch((e) => make("error", typeof msgs.error === "function" ? msgs.error(e) : (msgs.error || "Something went wrong"), { id }));
  return promise;
};

// ── Type → visual config ───────────────────────────────────────────────────────
const CONFIG = {
  success: { Icon: CheckCircle2, iconColor: "#2D7A3A", accent: "#C8A146" },
  error:   { Icon: XCircle,      iconColor: "#C0392B", accent: "#C0392B" },
  warning: { Icon: AlertTriangle,iconColor: "#B7791F", accent: "#D9A441" },
  loading: { Icon: Loader2,      iconColor: "#2563EB", accent: "#C8A146" },
  info:    { Icon: Info,         iconColor: "#4A3F35", accent: "#C8A146" },
  default: { Icon: ShoppingBag,  iconColor: "#4A3F35", accent: "#C8A146" },
};
// Keyword → icon so common actions get the right glyph automatically.
const KEYWORD_ICONS = [
  [/shopping bag|added to (your )?cart|cart/i, ShoppingBag],
  [/wishlist|saved|heart/i, Heart],
  [/live shopping|session|packing video|video/i, Video],
  [/shipp|dispatch|delivered|order (placed|shipped|delivered)|track/i, Truck],
  [/payment|razorpay|checkout|card/i, CreditCard],
  [/approved|verified|welcome/i, ShieldCheck],
  [/congrat|success|confirmed/i, PartyPopper],
];
function resolveIcon(type, title, custom) {
  if (custom) return custom;
  if (type === "success" && title) {
    for (const [re, Ic] of KEYWORD_ICONS) if (re.test(title)) return Ic;
  }
  return CONFIG[type]?.Icon || CONFIG.default.Icon;
}

// ── Single notification card ─────────────────────────────────────────────────
function Card({ n, onClose, reduce }) {
  const cfg = CONFIG[n.type] || CONFIG.default;
  const IconCmp = resolveIcon(n.type, n.title, typeof n.icon === "function" ? n.icon : null);
  const [progress, setProgress] = useState(100);
  const paused = useRef(false);
  const startRef = useRef(Date.now());
  const remainingRef = useRef(n.duration);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isFinite(n.duration)) return; // loading / persistent
    const tick = () => {
      if (!paused.current) {
        const elapsed = Date.now() - startRef.current;
        const pct = Math.max(0, 100 - (elapsed / n.duration) * 100);
        setProgress(pct);
        if (pct <= 0) { onClose(); return; }
      } else {
        startRef.current = Date.now() - (n.duration - remainingRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [n.duration, onClose]);

  const onEnter = () => {
    paused.current = true;
    remainingRef.current = n.duration * (progress / 100);
  };
  const onLeave = () => {
    paused.current = false;
    startRef.current = Date.now() - (n.duration - remainingRef.current);
  };

  const clickable = !!(n.href || n.action);
  const handleClick = () => {
    if (n.action?.onClick) n.action.onClick();
    else if (n.href && typeof window !== "undefined") window.location.href = n.href;
    if (clickable) onClose();
  };

  return (
    <motion.div
      layout
      role="status"
      aria-live={n.type === "error" ? "assertive" : "polite"}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
      drag={typeof window !== "undefined" && window.innerWidth < 640 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 80) onClose(); }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={clickable ? handleClick : undefined}
      className="pointer-events-auto relative w-full overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid #ECE8E1",
        borderRadius: 20,
        boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
        cursor: clickable ? "pointer" : "default",
        willChange: "transform, opacity",
      }}
    >
      {/* Gold accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}55)` }} />
      <div className="flex items-start gap-3 px-4 py-3.5">
        <motion.span
          initial={reduce ? false : { scale: 1 }}
          animate={reduce ? {} : { scale: [1, 1.08, 1] }}
          transition={{ duration: 0.16 }}
          className="flex-shrink-0 mt-0.5"
          style={{ color: cfg.iconColor }}
        >
          <IconCmp size={20} className={n.type === "loading" ? "animate-spin" : ""} />
        </motion.span>
        <div className="min-w-0 flex-1">
          {n.title && <p className="text-[15px] font-semibold leading-snug" style={{ color: "#1a1a1a" }}>{n.title}</p>}
          {n.description && <p className="text-[13px] mt-0.5 leading-snug" style={{ color: "#8B8074" }}>{n.description}</p>}
          {n.node}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-full transition hover:bg-black/5"
        >
          <XCircle size={15} style={{ color: "#C4BBAE" }} />
        </button>
      </div>
      {/* Progress bar */}
      {isFinite(n.duration) ? (
        <div style={{ height: 2, background: "#F3EFE8" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: cfg.accent, transition: "width 80ms linear" }} />
        </div>
      ) : n.type === "loading" ? (
        <div style={{ height: 2, background: "#F3EFE8", overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", width: "40%", background: cfg.accent }}
            animate={reduce ? {} : { x: ["-40%", "260%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      ) : null}
    </motion.div>
  );
}

// ── Toaster (renders the stack) ─────────────────────────────────────────────
export function Toaster() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const reduce = useReducedMotion();
  const close = useCallback((id) => remove(id), []);

  // ESC closes the latest
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && items.length) remove(items[0].id); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      aria-live="polite"
      className="fixed left-1/2 z-[9999] flex w-full max-w-[420px] -translate-x-1/2 flex-col gap-2.5 px-4 pointer-events-none top-4 sm:top-8"
    >
      <AnimatePresence initial={false}>
        {list.map((n) => (
          <Card key={n.key} n={n} onClose={() => close(n.id)} reduce={reduce} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default toast;
