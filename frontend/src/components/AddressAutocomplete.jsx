/**
 * AddressAutocomplete.jsx
 * Reusable address field backed by Google Places (proxied through our backend
 * so the API key is never exposed). Debounced suggestions, keyboard navigable,
 * and gracefully degrades to a plain text input if the API is unavailable.
 *
 * Props:
 *   value        — current text value (controlled)
 *   onChange     — (text) => void, fired on every keystroke
 *   onSelect     — ({ address, city, state, pincode }) => void, fired on pick
 *   className    — input className (match the parent form's styling)
 *   placeholder  — input placeholder
 *   inputProps   — extra props spread onto the <input> (e.g. required)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export default function AddressAutocomplete({
  value = "",
  onChange,
  onSelect,
  className = "",
  placeholder = "Start typing your address…",
  inputProps = {},
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  const skipNextFetch = useRef(false);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fetchSuggestions = useCallback((q) => {
    if (!q || q.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    api.get("/places/autocomplete", { params: { input: q } })
      .then((r) => {
        const preds = r.data?.predictions || [];
        setSuggestions(preds);
        setOpen(preds.length > 0);
        setActive(-1);
      })
      .catch(() => { setSuggestions([]); setOpen(false); })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange?.(v);
    if (skipNextFetch.current) { skipNextFetch.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  const pick = async (s) => {
    skipNextFetch.current = true;
    setOpen(false);
    setSuggestions([]);
    setActive(-1);
    // Fill the visible text immediately with the description
    onChange?.(s.description);
    try {
      const { data } = await api.get("/places/details", { params: { place_id: s.place_id } });
      onSelect?.({
        address: data?.address || s.description,
        city: data?.city || "",
        state: data?.state || "",
        pincode: data?.pincode || "",
        formatted_address: data?.formatted_address || s.description,
      });
    } catch {
      // Details failed — still give the parent the description so nothing blocks.
      onSelect?.({ address: s.description, city: "", state: "", pincode: "" });
    }
  };

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (active >= 0 && active < suggestions.length) {
        e.preventDefault();
        pick(suggestions[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        className={className}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder={placeholder}
        autoComplete="off"
        {...inputProps}
      />
      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 rounded-xl border bg-white shadow-lg overflow-hidden"
          style={{ borderColor: "#E8E4DF" }}
        >
          {suggestions.map((s, i) => (
            <button
              type="button"
              key={s.place_id || i}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
              className="w-full text-left px-3 py-2.5 text-sm transition"
              style={{
                background: i === active ? "#FAF6EC" : "white",
                color: "#3a2f26",
              }}
            >
              {s.description}
            </button>
          ))}
          <div
            className="px-3 py-1.5 text-[10px] flex items-center justify-end gap-1 border-t"
            style={{ borderColor: "#F0EBE3", color: "#9B8B7A" }}
          >
            {loading ? "Searching…" : "Powered by Google"}
          </div>
        </div>
      )}
    </div>
  );
}
