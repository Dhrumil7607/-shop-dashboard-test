import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * SIZE_DATA — category → { headers, rows, note }
 *
 * All values in inches to match the reference screenshot.
 * Categories that are "Free Size" (sarees, dupattas, fabric) skip
 * the table and show a short note instead.
 */
const SIZE_DATA = {
    // ── Women ──────────────────────────────────────────────────
    Lehengas: {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
        rows: [
            ["XS",  '32"', '26"', '34"', '13.5"', '40"', '9"'],
            ["S",   '34"', '28"', '36"', '14"',   '40"', '9"'],
            ["M",   '36"', '30"', '38"', '14.5"', '40"', '9.5"'],
            ["L",   '38"', '32"', '40"', '15"',   '40"', '10"'],
            ["XL",  '40"', '34"', '42"', '15.5"', '40"', '10"'],
        ],
        note: "Choli length: 14\". Lehenga length measured from waist to hem. Free alterations ±2\" within 7 days of delivery.",
    },
    "Wedding Wear": {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
        rows: [
            ["XS",  '32"', '26"', '34"', '13.5"', '42"', '9"'],
            ["S",   '34"', '28"', '36"', '14"',   '42"', '9"'],
            ["M",   '36"', '30"', '38"', '14.5"', '42"', '9.5"'],
            ["L",   '38"', '32"', '40"', '15"',   '42"', '10"'],
            ["XL",  '40"', '34"', '42"', '15.5"', '42"', '10"'],
        ],
        note: "Includes blouse & dupatta. Lehenga length from waist to hem. Free alterations ±2\" within 7 days of delivery.",
    },
    "Chaniya Choli": {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Skirt Length", "Sleeve"],
        rows: [
            ["XS",  '32"', '24"', '34"', '13"',   '42"', '9"'],
            ["S",   '34"', '26"', '36"', '13.5"', '42"', '9"'],
            ["M",   '36"', '28"', '38"', '14"',   '42"', '9.5"'],
            ["L",   '38"', '30"', '40"', '14.5"', '42"', '10"'],
            ["XL",  '40"', '32"', '42"', '15"',   '42"', '10"'],
        ],
        note: "Skirt length from waist to hem. Full flare style. Choli length: 13\". Free alterations ±2\" within 7 days.",
    },
    "Festival Wear": {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Length"],
        rows: [
            ["XS", '32"', '26"', '34"', '13"',   '42"'],
            ["S",  '34"', '28"', '36"', '13.5"', '42"'],
            ["M",  '36"', '30"', '38"', '14"',   '42"'],
            ["L",  '38"', '32"', '40"', '14.5"', '44"'],
            ["XL", '40"', '34"', '42"', '15"',   '44"'],
        ],
        note: "Measurements are guide values. For a custom fit please mention your exact measurements at checkout.",
    },
    Salwar: {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Length"],
        rows: [
            ["XS", '32"', '26"', '34"', '13.5"', '38"'],
            ["S",  '34"', '28"', '36"', '14"',   '40"'],
            ["M",  '36"', '30"', '38"', '14.5"', '40"'],
            ["L",  '38"', '32"', '40"', '15"',   '42"'],
            ["XL", '40"', '34"', '42"', '15.5"', '42"'],
        ],
        note: "Kameez length from shoulder to hem. Dupatta included. Free alterations ±2\" within 7 days of delivery.",
    },
    Anarkali: {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Length"],
        rows: [
            ["XS", '32"', '26"', '34"', '13.5"', '52"'],
            ["S",  '34"', '28"', '36"', '14"',   '54"'],
            ["M",  '36"', '30"', '38"', '14.5"', '54"'],
            ["L",  '38"', '32"', '40"', '15"',   '56"'],
            ["XL", '40"', '34"', '42"', '15.5"', '56"'],
        ],
        note: "Floor-length style. Length measured from shoulder to hem. Free alterations ±2\" within 7 days.",
    },
    Kurti: {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Length"],
        rows: [
            ["XS", '32"', '26"', '34"', '13"',   '36"'],
            ["S",  '34"', '28"', '36"', '13.5"', '38"'],
            ["M",  '36"', '30"', '38"', '14"',   '40"'],
            ["L",  '38"', '32"', '40"', '14.5"', '42"'],
            ["XL", '40"', '34"', '42"', '15"',   '42"'],
        ],
        note: "Length measured from shoulder to hem. Straight-cut style. Kurta paired with matching pants where specified.",
    },
    Gown: {
        headers: ["Size", "Bust", "Waist", "Hip", "Shoulder", "Length"],
        rows: [
            ["XS", '32"', '26"', '34"', '13.5"', '56"'],
            ["S",  '34"', '28"', '36"', '14"',   '58"'],
            ["M",  '36"', '30"', '38"', '14.5"', '58"'],
            ["L",  '38"', '32"', '40"', '15"',   '60"'],
            ["XL", '40"', '34"', '42"', '15.5"', '60"'],
        ],
        note: "Floor-length gown. Length from shoulder to hem. Back zip closure.",
    },
    // ── Sarees — Free Size ──────────────────────────────────────
    Sarees: {
        freeSize: true,
        note: "Sarees are one-size fits all (5.5–6 metres). Blouse piece included (unstitched, approx 1 metre). Recommended blouse size up to 42 bust.",
        blouseHeaders: ["Blouse Size", "Bust", "Waist", "Shoulder", "Length"],
        blouseRows: [
            ["34", '34"', '28"', '13.5"', '15"'],
            ["36", '36"', '30"', '14"',   '15"'],
            ["38", '38"', '32"', '14.5"', '15"'],
            ["40", '40"', '34"', '15"',   '15"'],
            ["42", '42"', '36"', '15.5"', '15"'],
        ],
    },
    // ── Men ──────────────────────────────────────────────────
    Sherwanis: {
        headers: ["Size", "Chest", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
        rows: [
            ["36", '36"', '30"', '37"', '16.5"', '44"', '24"'],
            ["38", '38"', '32"', '39"', '17"',   '45"', '24.5"'],
            ["40", '40"', '34"', '41"', '17.5"', '46"', '25"'],
            ["42", '42"', '36"', '43"', '18"',   '47"', '25.5"'],
            ["44", '44"', '38"', '45"', '18.5"', '47"', '26"'],
            ["46", '46"', '40"', '47"', '19"',   '48"', '26"'],
        ],
        note: "Sherwani length from shoulder to hem. Worn with churidar/salwar. Free alterations ±1\" within 7 days of delivery.",
    },
    Kurtas: {
        headers: ["Size", "Chest", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
        rows: [
            ["38", '38"', '32"', '39"', '16.5"', '42"', '23"'],
            ["40", '40"', '34"', '41"', '17"',   '43"', '23.5"'],
            ["42", '42"', '36"', '43"', '17.5"', '44"', '24"'],
            ["44", '44"', '38"', '45"', '18"',   '44"', '24.5"'],
            ["46", '46"', '40"', '47"', '18.5"', '45"', '25"'],
        ],
        note: "Straight-cut kurta. Length from shoulder to hem. Pair with churidar or straight pants.",
    },
    "Men's Ethnic": {
        headers: ["Size", "Chest", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
        rows: [
            ["38", '38"', '32"', '39"', '16.5"', '42"', '23"'],
            ["40", '40"', '34"', '41"', '17"',   '43"', '23.5"'],
            ["42", '42"', '36"', '43"', '17.5"', '44"', '24"'],
            ["44", '44"', '38"', '45"', '18"',   '44"', '24.5"'],
            ["46", '46"', '40"', '47"', '18.5"', '45"', '25"'],
        ],
        note: "Straight-cut style. Free alterations ±1\" within 7 days of delivery.",
    },
    "Wedding Wear Men": {
        headers: ["Size", "Chest", "Waist", "Hip", "Shoulder", "Length", "Sleeve"],
        rows: [
            ["36", '36"', '30"', '37"', '16.5"', '44"', '24"'],
            ["38", '38"', '32"', '39"', '17"',   '45"', '24.5"'],
            ["40", '40"', '34"', '41"', '17.5"', '46"', '25"'],
            ["42", '42"', '36"', '43"', '18"',   '47"', '25.5"'],
            ["44", '44"', '38"', '45"', '18.5"', '47"', '26"'],
            ["46", '46"', '40"', '47"', '19"',   '48"', '26"'],
        ],
        note: "Sherwani/bandhgala length from shoulder to hem. Includes matching bottom. Free alterations ±1\".",
    },
    // ── Kids ────────────────────────────────────────────────
    "Kids Traditional": {
        headers: ["Age", "Chest", "Waist", "Hip", "Length"],
        rows: [
            ["2–3 yrs",   '22"', '20"', '24"', '22"'],
            ["4–5 yrs",   '24"', '22"', '26"', '26"'],
            ["6–7 yrs",   '26"', '24"', '28"', '30"'],
            ["8–9 yrs",   '28"', '26"', '30"', '34"'],
            ["10–11 yrs", '30"', '28"', '32"', '38"'],
        ],
        note: "Measurements are approximate. We recommend sizing up if between sizes. Free alterations ±1\" within 7 days.",
    },
};

/** Return the size config for a given category. Falls back gracefully. */
export function getSizeConfig(category) {
    if (!category) return null;
    // Direct match
    if (SIZE_DATA[category]) return SIZE_DATA[category];
    // Partial match (e.g. "Bridal Wear" → "Lehengas")
    const key = Object.keys(SIZE_DATA).find(k =>
        category.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(category.toLowerCase())
    );
    return key ? SIZE_DATA[key] : null;
}

/** Returns the ordered list of selectable sizes for a category. */
export function getSizesForCategory(category) {
    const cfg = getSizeConfig(category);
    if (!cfg) return ["Free Size"];
    if (cfg.freeSize) return ["Free Size", ...cfg.blouseRows.map(r => r[0])];
    return cfg.rows.map(r => r[0]);
}

/**
 * Returns true only for categories where the customer must choose a size.
 *
 * Sarees, dupattas, jewellery, accessories, fabric and similar items
 * are one-size — no size picker needed.
 */
const NO_SIZE_CATEGORIES = new Set([
    "Sarees", "Jewellery", "Accessories", "Shawls & Dupattas",
    "Bags", "Home Décor", "Textiles", "Footwear", "Fabric",
]);

export function needsSizeSelection(category) {
    if (!category) return false;
    // If the category is explicitly in the no-size list, skip size picker
    if (NO_SIZE_CATEGORIES.has(category)) return false;
    // If we have a real (non-free-size) chart for this category, show picker
    const cfg = getSizeConfig(category);
    if (!cfg) return false;          // unknown category — no picker
    if (cfg.freeSize) return false;  // saree-type — blouse is optional, no picker
    return true;
}

/** The modal itself */
export default function SizeGuideModal({ category, shopName, onClose }) {
    const cfg = getSizeConfig(category);

    // Close on Escape
    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Panel */}
            <div
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{ backgroundColor: "white" }}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 px-8 pt-8 pb-5 border-b"
                    style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full transition hover:bg-gray-100"
                        aria-label="Close size guide"
                        style={{ color: "#1a1a1a" }}
                    >
                        <X size={18} />
                    </button>

                    {shopName && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                            style={{ color: "#C9A84C" }}>
                            {shopName}
                        </p>
                    )}
                    <h2 className="font-serif text-2xl md:text-3xl mb-1"
                        style={{ color: "#1a1a1a", fontWeight: 400 }}>
                        Size Guide &amp; Measurements
                    </h2>
                    <p className="text-sm" style={{ color: "#6B5E52" }}>
                        All values in <strong>inches</strong>. Each store defines their own sizing
                        — these are this store's exact measurements.
                    </p>
                </div>

                {/* Body */}
                <div className="px-8 py-6 space-y-6">

                    {!cfg ? (
                        /* No specific chart — generic note */
                        <div className="rounded-xl p-5 text-sm" style={{ backgroundColor: "#FAF9F6", color: "#6B5E52" }}>
                            This item is available in <strong>Free Size</strong>. It fits most body types.
                            If you need a custom fit, please mention your measurements at checkout.
                        </div>
                    ) : cfg.freeSize ? (
                        /* Saree / Free-size with blouse sub-table */
                        <>
                            <div className="rounded-xl p-5 text-sm" style={{ backgroundColor: "#FAF9F6", color: "#6B5E52" }}>
                                {cfg.note}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                                    style={{ color: "#9B8B7A" }}>Blouse Size Chart</p>
                                <SizeTable headers={cfg.blouseHeaders} rows={cfg.blouseRows} />
                            </div>
                        </>
                    ) : (
                        /* Standard size chart */
                        <SizeTable headers={cfg.headers} rows={cfg.rows} />
                    )}

                    {/* Alteration note */}
                    {cfg?.note && !cfg.freeSize && (
                        <div className="flex items-start gap-3 rounded-xl p-4 text-sm"
                            style={{ backgroundColor: "#FAF9F6", color: "#6B5E52" }}>
                            <span className="flex-shrink-0 mt-0.5 text-base" style={{ color: "#C9A84C" }}>ⓘ</span>
                            <span>{cfg.note}</span>
                        </div>
                    )}

                    {/* How to measure */}
                    <div className="rounded-xl p-5 text-sm border"
                        style={{ backgroundColor: "#FAF9F6", borderColor: "#E8E4DF" }}>
                        <p className="font-bold mb-2" style={{ color: "#1a1a1a" }}>How to measure yourself</p>
                        <p style={{ color: "#6B5E52" }}>
                            <strong>Bust/Chest:</strong> around the fullest part of your chest ·{" "}
                            <strong>Waist:</strong> at the narrowest point ·{" "}
                            <strong>Hip:</strong> around the fullest part of your hips ·{" "}
                            <strong>Shoulder:</strong> from one shoulder edge to the other ·{" "}
                            <strong>Sleeve:</strong> from shoulder seam to wrist ·{" "}
                            <strong>Length:</strong> garment length
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Reusable measurement table */
function SizeTable({ headers, rows }) {
    return (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E8E4DF" }}>
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ backgroundColor: "#F0EBE3" }}>
                        {headers.map((h, i) => (
                            <th key={h}
                                className={`py-3.5 text-left font-bold ${i === 0 ? "pl-5" : "px-3"}`}
                                style={{ color: "#1a1a1a" }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri}
                            className="border-t"
                            style={{ borderColor: "#E8E4DF", backgroundColor: ri % 2 === 0 ? "white" : "#FDFCFA" }}>
                            {row.map((cell, ci) => (
                                <td key={ci}
                                    className={`py-3.5 ${ci === 0 ? "pl-5 font-semibold" : "px-3"}`}
                                    style={{ color: ci === 0 ? "#1a1a1a" : "#4A3F35" }}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
