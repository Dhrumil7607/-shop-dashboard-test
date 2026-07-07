/**
 * MensSizeGuideModal.jsx
 *
 * Luxury premium size guide for men's ethnic wear categories.
 * Features:
 * - Multi-section tabs: Shirt, Kurta, Sherwani, Jacket, Trouser
 * - cm / inch toggle
 * - No women's measurements, no body profile creation
 * - Clean, immersive luxury design
 */

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Size data (inches) — converted on demand ──────────────────────────────────

const SECTIONS = [
  {
    id: "shirt",
    label: "Shirt",
    emoji: "👔",
    headers: ["Size", "Chest", "Waist", "Shoulder", "Sleeve", "Length"],
    rows: [
      ["38", '38"', '32"', '16.5"', '23"',   '30"'],
      ["40", '40"', '34"', '17"',   '23.5"', '30.5"'],
      ["42", '42"', '36"', '17.5"', '24"',   '31"'],
      ["44", '44"', '38"', '18"',   '24.5"', '31.5"'],
      ["46", '46"', '40"', '18.5"', '25"',   '32"'],
    ],
    note: "Measured on flat garment. Chest measured at underarm. Sleeve from shoulder seam to wrist.",
  },
  {
    id: "kurta",
    label: "Kurta",
    emoji: "🧥",
    headers: ["Size", "Chest", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
    rows: [
      ["38", '38"', '32"', '39"', '16.5"', '42"', '23"'],
      ["40", '40"', '34"', '41"', '17"',   '43"', '23.5"'],
      ["42", '42"', '36"', '43"', '17.5"', '44"', '24"'],
      ["44", '44"', '38"', '45"', '18"',   '44"', '24.5"'],
      ["46", '46"', '40"', '47"', '18.5"', '45"', '25"'],
    ],
    note: "Kurta length from shoulder to hem. Straight-cut style. Pairs with churidar or straight pants.",
  },
  {
    id: "sherwani",
    label: "Sherwani",
    emoji: "✨",
    headers: ["Size", "Chest", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
    rows: [
      ["36", '36"', '30"', '37"', '16.5"', '44"', '24"'],
      ["38", '38"', '32"', '39"', '17"',   '45"', '24.5"'],
      ["40", '40"', '34"', '41"', '17.5"', '46"', '25"'],
      ["42", '42"', '36"', '43"', '18"',   '47"', '25.5"'],
      ["44", '44"', '38"', '45"', '18.5"', '47"', '26"'],
      ["46", '46"', '40"', '47"', '19"',   '48"', '26"'],
    ],
    note: "Sherwani length from shoulder to hem. Worn with churidar. Free alterations ±1\" within 7 days.",
  },
  {
    id: "jacket",
    label: "Jacket",
    emoji: "🪡",
    headers: ["Size", "Chest", "Waist", "Shoulder", "Length", "Sleeve"],
    rows: [
      ["38", '38"', '32"', '16.5"', '26"', '22.5"'],
      ["40", '40"', '34"', '17"',   '27"', '23"'],
      ["42", '42"', '36"', '17.5"', '27.5"', '23.5"'],
      ["44", '44"', '38"', '18"',   '28"', '24"'],
      ["46", '46"', '40"', '18.5"', '28.5"', '24.5"'],
    ],
    note: "Nehru jacket / waistcoat length from shoulder to bottom hem.",
  },
  {
    id: "trouser",
    label: "Trouser",
    emoji: "👖",
    headers: ["Size", "Waist", "Hip", "Inseam", "Outseam", "Thigh"],
    rows: [
      ["28", '28"', '36"', '30"', '40"', '22"'],
      ["30", '30"', '38"', '30"', '41"', '23"'],
      ["32", '32"', '40"', '31"', '42"', '24"'],
      ["34", '34"', '42"', '31"', '43"', '25"'],
      ["36", '36"', '44"', '32"', '44"', '26"'],
      ["38", '38"', '46"', '32"', '45"', '27"'],
    ],
    note: "Waist relaxed measurement. Inseam from crotch to ankle. For churidar, order 2 sizes smaller in length.",
  },
];

// Conversion: inches → cm
const IN_TO_CM = 2.54;

function convertValue(valStr, unit) {
  if (unit === "in") return valStr;
  // Parse the number, convert, re-format
  const match = valStr.match(/^([\d.]+)"$/);
  if (!match) return valStr;
  const cm = (parseFloat(match[1]) * IN_TO_CM).toFixed(1);
  return `${cm} cm`;
}

function convertRow(row, unit) {
  return row.map((cell, idx) => (idx === 0 ? cell : convertValue(cell, unit)));
}

function convertHeaders(headers, unit) {
  return headers.map((h) =>
    h === "Size" ? h : unit === "cm" ? `${h} (cm)` : `${h} (in)`
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MensSizeGuideModal({ category, shopName, onClose }) {
  const [activeSection, setActiveSection] = useState("kurta");
  const [unit, setUnit] = useState("in"); // "in" | "cm"

  // Pre-select section based on product category
  useEffect(() => {
    if (!category) return;
    const lower = category.toLowerCase();
    if (lower.includes("sherwani")) setActiveSection("sherwani");
    else if (lower.includes("shirt")) setActiveSection("shirt");
    else if (lower.includes("jacket") || lower.includes("blazer") || lower.includes("waistcoat"))
      setActiveSection("jacket");
    else if (lower.includes("trouser") || lower.includes("pant") || lower.includes("dhoti"))
      setActiveSection("trouser");
    else setActiveSection("kurta");
  }, [category]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const section = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mens-size-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: "white" }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 px-7 pt-7 pb-5 border-b"
          style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full transition hover:bg-stone-100"
            aria-label="Close size guide"
          >
            <X size={18} style={{ color: "#1a1a1a" }} />
          </button>

          {shopName && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
              style={{ color: "#C9A84C" }}>
              {shopName}
            </p>
          )}

          <h2
            id="mens-size-guide-title"
            className="font-serif text-2xl md:text-3xl mb-1"
            style={{ color: "#1a1a1a", fontWeight: 400 }}
          >
            Men's Size Guide
          </h2>
          <p className="text-sm mb-4" style={{ color: "#6B5E52" }}>
            Professional measurements for every ethnic silhouette.
          </p>

          {/* Section tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{
                  backgroundColor: activeSection === sec.id ? "#1a1a1a" : "#F0EBE3",
                  color: activeSection === sec.id ? "white" : "#3C3027",
                  border: activeSection === sec.id ? "2px solid #1a1a1a" : "2px solid transparent",
                }}
              >
                <span aria-hidden="true">{sec.emoji}</span>
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="px-7 py-6 space-y-6">

          {/* Unit toggle */}
          <div className="flex items-center justify-end">
            <div
              className="flex rounded-lg overflow-hidden border"
              style={{ borderColor: "#E8E4DF" }}
            >
              {["in", "cm"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="px-4 py-2 text-sm font-medium transition-colors min-h-[36px]"
                  style={{
                    backgroundColor: unit === u ? "#1a1a1a" : "white",
                    color: unit === u ? "white" : "#6B5E52",
                  }}
                >
                  {u === "in" ? "inches" : "cm"}
                </button>
              ))}
            </div>
          </div>

          {/* Animated section content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              {/* Size table */}
              <div
                className="rounded-xl overflow-hidden border mb-4"
                style={{ borderColor: "#E8E4DF" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#1a1a1a" }}>
                      {convertHeaders(section.headers, unit).map((h, i) => (
                        <th
                          key={h}
                          className={`py-3.5 text-left font-semibold text-white ${i === 0 ? "pl-5" : "px-3"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-t"
                        style={{
                          borderColor: "#E8E4DF",
                          backgroundColor: ri % 2 === 0 ? "white" : "#FDFCFA",
                        }}
                      >
                        {convertRow(row, unit).map((cell, ci) => (
                          <td
                            key={ci}
                            className={`py-3.5 ${ci === 0 ? "pl-5 font-bold text-base" : "px-3"}`}
                            style={{
                              color: ci === 0 ? "#1a1a1a" : "#4A3F35",
                              fontFamily: ci === 0 ? "'Cormorant Garamond', serif" : undefined,
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Note */}
              {section.note && (
                <div
                  className="flex items-start gap-3 rounded-xl p-4 text-sm"
                  style={{ backgroundColor: "#FAF9F6", color: "#6B5E52" }}
                >
                  <span
                    className="flex-shrink-0 mt-0.5 text-base"
                    style={{ color: "#C9A84C" }}
                    aria-hidden="true"
                  >
                    ⓘ
                  </span>
                  <span>{section.note}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* How to measure — men's version */}
          <div
            className="rounded-xl p-5 text-sm border"
            style={{ backgroundColor: "#FAF9F6", borderColor: "#E8E4DF" }}
          >
            <p className="font-bold mb-3" style={{ color: "#1a1a1a" }}>
              How to measure yourself
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6"
              style={{ color: "#6B5E52" }}>
              {[
                ["Chest", "Around the fullest part of your chest, arms relaxed"],
                ["Waist", "Around the narrowest part of your torso"],
                ["Hip", "Around the fullest part of your hips"],
                ["Shoulder", "From one shoulder edge to the other across the back"],
                ["Sleeve", "From shoulder seam to wrist, arm slightly bent"],
                ["Length", "From highest shoulder point to the desired hem"],
                ["Inseam", "From crotch seam to ankle bone"],
                ["Thigh", "Around the fullest part of one thigh"],
              ].map(([label, desc]) => (
                <div key={label} className="flex gap-2">
                  <span className="font-semibold shrink-0" style={{ color: "#1a1a1a", minWidth: 70 }}>
                    {label}:
                  </span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fit tip */}
          <div
            className="rounded-xl p-4 text-sm flex items-start gap-3"
            style={{ backgroundColor: "rgba(201,168,76,0.08)", borderLeft: "3px solid #C9A84C" }}
          >
            <span className="text-lg" aria-hidden="true">💡</span>
            <p style={{ color: "#4A3F35" }}>
              <strong>Fit tip:</strong> For sherwani and kurta, we recommend going 1 size up
              if between sizes — ethnic wear is traditionally worn with a slightly relaxed fit.
              For formal jackets and trousers, choose your exact measurement size.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
