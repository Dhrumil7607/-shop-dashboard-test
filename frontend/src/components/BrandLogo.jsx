/**
 * BrandLogo.jsx
 * Renders the ShopLiveBharat logo.
 *   variant="full" (default) → the full logo image (icon + wordmark stacked).
 *   variant="mark"           → just the icon graphic + a crisp text wordmark
 *                              (best for slim navbars where the full logo is tiny).
 * Falls back to a text wordmark if the image is missing so nothing ever breaks.
 *
 * Props:
 *   variant  "full" | "mark"
 *   height   number   pixel height of the logo image
 *   dark     bool     light-colored wordmark text (for dark backgrounds)
 */
import { useState } from "react";

const BASE = process.env.PUBLIC_URL || "";
const FULL_SRC = `${BASE}/brand-logo.png`;
const MARK_SRC = `${BASE}/brand-mark.png?v=3`; // v3 = icon-only, tightly cropped

export default function BrandLogo({ variant = "full", height = 40, dark = false }) {
  const [failed, setFailed] = useState(false);

  const Wordmark = () => (
    <span className="font-bold tracking-tight leading-none" style={{ fontSize: Math.max(13, height * 0.42) }}>
      <span style={{ color: dark ? "#fff" : "#1a1a1a" }}>ShopLive</span>
      <span style={{ color: "#C9A84C" }}>Bharat</span>
    </span>
  );

  // Icon-only — just the logo mark, no wordmark text. Falls back to an "S" badge.
  if (variant === "icon") {
    if (failed) {
      return (
        <span className="rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: "#C9A84C", width: height, height }}>
          <span className="font-serif font-bold" style={{ color: "#C9A84C", fontSize: height * 0.5 }}>S</span>
        </span>
      );
    }
    return (
      <img src={MARK_SRC} alt="ShopLiveBharat" style={{ height, width: "auto", display: "block" }}
        onError={() => setFailed(true)} />
    );
  }

  if (failed) {
    // Text-only fallback
    return (
      <span className="flex items-center gap-2.5">
        <span className="rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: "#C9A84C", width: height, height }}>
          <span className="font-serif font-bold" style={{ color: "#C9A84C", fontSize: height * 0.4 }}>S</span>
        </span>
        <Wordmark />
      </span>
    );
  }

  if (variant === "mark") {
    return (
      <span className="flex items-center gap-2">
        <img src={MARK_SRC} alt="ShopLiveBharat" style={{ height, width: "auto", display: "block" }}
          onError={() => setFailed(true)} />
        <Wordmark />
      </span>
    );
  }

  return (
    <img src={FULL_SRC} alt="ShopLiveBharat" style={{ height, width: "auto", display: "block" }}
      onError={() => setFailed(true)} />
  );
}
