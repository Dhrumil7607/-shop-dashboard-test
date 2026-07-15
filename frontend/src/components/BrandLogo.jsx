/**
 * BrandLogo.jsx
 * Renders the ShopLiveBharat logo image (public/brand-logo.png). If the image
 * is missing or fails to load, it gracefully falls back to the text wordmark so
 * the header/footer never breaks.
 *
 * Props:
 *   height   number   pixel height of the logo image (default 36)
 *   showText bool      show the wordmark text next to the mark (default false)
 *   dark     bool      use light-colored fallback text (for dark backgrounds)
 */
import { useState } from "react";

const LOGO_SRC = `${process.env.PUBLIC_URL || ""}/brand-logo.png`;

export default function BrandLogo({ height = 36, showText = false, dark = false }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <span className="flex items-center gap-2">
        <img
          src={LOGO_SRC}
          alt="ShopLiveBharat"
          style={{ height, width: "auto", display: "block" }}
          onError={() => setFailed(true)}
        />
        {showText && (
          <span className="font-bold text-sm tracking-tight leading-none">
            <span style={{ color: dark ? "#fff" : "#1a1a1a" }}>ShopLive</span>
            <span style={{ color: "#C9A84C" }}>Bharat</span>
          </span>
        )}
      </span>
    );
  }

  // Fallback wordmark
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: "#C9A84C", width: height, height }}
      >
        <span className="font-serif font-bold text-sm" style={{ color: "#C9A84C" }}>S</span>
      </span>
      <span className="leading-none">
        <span className="font-bold text-sm tracking-tight">
          <span style={{ color: dark ? "#fff" : "#1a1a1a" }}>ShopLive</span>
          <span style={{ color: "#C9A84C" }}>Bharat</span>
        </span>
      </span>
    </span>
  );
}
