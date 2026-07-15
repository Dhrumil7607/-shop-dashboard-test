/**
 * PhoneInput.jsx
 * International phone input with an ISD country-code selector (flag + dial code).
 * Emits the full E.164-style string "+<dial> <number>" via onChange, plus a
 * validity flag. Lightweight — no external phone libraries.
 *
 * Props:
 *   value      string   full phone string (e.g. "+91 98765 43210")
 *   onChange   (fullString, { valid, dial, number }) => void
 *   className  string   optional class for the number input
 */
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

// ISO2 → flag emoji (regional indicator symbols).
const flag = (iso) =>
  iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

// Common destinations first, then a broad list. { iso, name, dial }
const COUNTRIES = [
  { iso: "IN", name: "India", dial: "91" },
  { iso: "US", name: "United States", dial: "1" },
  { iso: "GB", name: "United Kingdom", dial: "44" },
  { iso: "CA", name: "Canada", dial: "1" },
  { iso: "AU", name: "Australia", dial: "61" },
  { iso: "AE", name: "UAE", dial: "971" },
  { iso: "SG", name: "Singapore", dial: "65" },
  { iso: "NZ", name: "New Zealand", dial: "64" },
  { iso: "DE", name: "Germany", dial: "49" },
  { iso: "FR", name: "France", dial: "33" },
  { iso: "IT", name: "Italy", dial: "39" },
  { iso: "ES", name: "Spain", dial: "34" },
  { iso: "NL", name: "Netherlands", dial: "31" },
  { iso: "IE", name: "Ireland", dial: "353" },
  { iso: "CH", name: "Switzerland", dial: "41" },
  { iso: "SE", name: "Sweden", dial: "46" },
  { iso: "NO", name: "Norway", dial: "47" },
  { iso: "ZA", name: "South Africa", dial: "27" },
  { iso: "MY", name: "Malaysia", dial: "60" },
  { iso: "QA", name: "Qatar", dial: "974" },
  { iso: "SA", name: "Saudi Arabia", dial: "966" },
  { iso: "KW", name: "Kuwait", dial: "965" },
  { iso: "OM", name: "Oman", dial: "968" },
  { iso: "BH", name: "Bahrain", dial: "973" },
  { iso: "JP", name: "Japan", dial: "81" },
  { iso: "HK", name: "Hong Kong", dial: "852" },
  { iso: "TH", name: "Thailand", dial: "66" },
  { iso: "NP", name: "Nepal", dial: "977" },
  { iso: "BD", name: "Bangladesh", dial: "880" },
  { iso: "LK", name: "Sri Lanka", dial: "94" },
];

function parseValue(value) {
  // Try to split an existing "+<dial> <number>" back into parts.
  if (value && value.startsWith("+")) {
    const digits = value.slice(1);
    // Match the longest dial code that prefixes the digits.
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      if (digits.replace(/\s/g, "").startsWith(c.dial)) {
        return { dial: c.dial, iso: c.iso, number: digits.replace(/\s/g, "").slice(c.dial.length) };
      }
    }
  }
  return null;
}

export default function PhoneInput({ value = "", onChange, className = "" }) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const [country, setCountry] = useState(() =>
    COUNTRIES.find((c) => c.iso === (parsed?.iso)) || COUNTRIES[0]
  );
  const [number, setNumber] = useState(parsed?.number || "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const emit = useCallback((c, num) => {
    const clean = (num || "").replace(/[^\d]/g, "");
    const full = clean ? `+${c.dial} ${clean}` : "";
    const valid = clean.length >= 6 && clean.length <= 14;
    onChange?.(full, { valid, dial: c.dial, number: clean });
  }, [onChange]);

  const pickCountry = (c) => {
    setCountry(c); setOpen(false); setQuery("");
    emit(c, number);
  };
  const handleNumber = (e) => {
    const v = e.target.value.replace(/[^\d\s]/g, "");
    setNumber(v);
    emit(country, v);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(q) || c.dial.includes(q.replace("+", "")) || c.iso.toLowerCase() === q
    );
  }, [query]);

  return (
    <div ref={boxRef} className="relative flex items-stretch gap-2">
      {/* ISD selector */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 rounded border-b border-gray-200 bg-transparent text-sm outline-none focus:border-[#C9A84C] transition shrink-0"
        aria-label="Select country code"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{flag(country.iso)}</span>
        <span style={{ color: "#1a1a1a" }}>+{country.dial}</span>
        <ChevronDown size={13} style={{ color: "#9B8B7A" }} />
      </button>

      {/* Number */}
      <input
        type="tel"
        inputMode="tel"
        value={number}
        onChange={handleNumber}
        placeholder="98765 43210"
        className={className}
        aria-label="Phone number"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 rounded-xl border bg-white shadow-lg overflow-hidden"
          style={{ borderColor: "#E8E4DF" }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "#F0EBE3" }}>
            <Search size={14} style={{ color: "#9B8B7A" }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.iso}
                type="button"
                onClick={() => pickCountry(c)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition hover:bg-[#FAF6EC]"
                style={{ color: "#3a2f26" }}
              >
                <span style={{ fontSize: 18 }}>{flag(c.iso)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span style={{ color: "#9B8B7A" }}>+{c.dial}</span>
                {c.iso === country.iso && <Check size={14} style={{ color: "#A2466B" }} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm" style={{ color: "#9B8B7A" }}>No match</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
