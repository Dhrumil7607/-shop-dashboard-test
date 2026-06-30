/**
 * BodySilhouette — presentational SVG body silhouette component
 *
 * Renders a stylised female body outline with 7 named zones that are
 * colour-coded based on the `zones` prop:
 *   'tight'    → #F59E0B  (amber)
 *   'loose'    → #3B82F6  (blue)
 *   'good'     → #22C55E  (green)
 *   undefined  → #D1D5DB  (neutral gray)
 *
 * Zone fill transitions use CSS `transition: fill 300ms ease`, but are
 * skipped when `prefers-reduced-motion: reduce` is active.
 *
 * The SVG uses viewBox="0 0 200 400" width="100%" so it scales
 * responsively and never overflows on viewports narrower than 360 px.
 *
 * Validates: Requirements 5.5, 13.4, 15.3
 */

const ZONE_COLOURS = {
  tight: '#F59E0B',
  loose: '#3B82F6',
  good: '#22C55E',
};

const DEFAULT_COLOUR = '#D1D5DB';

/**
 * Returns the fill colour for a given zone fit value.
 * @param {'tight'|'good'|'loose'|undefined} fit
 * @returns {string} hex colour
 */
function zoneColour(fit) {
  return ZONE_COLOURS[fit] ?? DEFAULT_COLOUR;
}

/**
 * BodySilhouette component
 *
 * @param {{ zones?: {
 *   bust?: 'tight'|'good'|'loose',
 *   waist?: 'tight'|'good'|'loose',
 *   hip?: 'tight'|'good'|'loose',
 *   shoulder?: 'tight'|'good'|'loose',
 *   sleeve?: 'tight'|'good'|'loose',
 *   neck?: 'tight'|'good'|'loose',
 *   thigh?: 'tight'|'good'|'loose',
 * }}} props
 */
export default function BodySilhouette({ zones = {} }) {
  const c = {
    bust:     zoneColour(zones.bust),
    waist:    zoneColour(zones.waist),
    hip:      zoneColour(zones.hip),
    shoulder: zoneColour(zones.shoulder),
    sleeve:   zoneColour(zones.sleeve),
    neck:     zoneColour(zones.neck),
    thigh:    zoneColour(zones.thigh),
  };

  return (
    <>
      {/* Inline <style> so the transition rule and reduced-motion override
          are scoped to this component without requiring a CSS module. */}
      <style>{`
        .body-silhouette-zone {
          transition: fill 300ms ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .body-silhouette-zone {
            transition: none;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 200 400"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Body silhouette showing fit zones"
        style={{ display: 'block', maxWidth: '100%' }}
      >
        <title>Body fit zone silhouette</title>

        {/* ── Body outline (filled white/off-white as the base layer) ── */}
        {/* This path describes the overall female body silhouette. Each
            named zone is drawn on top with its own coloured shape. */}
        <path
          d={[
            // Head (approximated by the neck+head ellipse below — outline only)
            // Torso outline
            'M 100 65',           // top-center (base of neck)
            'C 125 65 145 75 148 95',   // right shoulder curve
            'L 152 130',          // right side below shoulder
            'C 154 150 150 165 148 180', // right waist
            'C 146 195 150 210 158 235', // right hip flare
            'L 162 265',          // right thigh start
            'C 163 285 160 300 158 320', // right outer thigh
            'L 157 370',          // right leg bottom
            'L 143 370',          // right leg inner bottom
            'L 142 320',          // right inner thigh up
            'C 140 300 138 290 136 275', // right inner thigh
            'L 130 252',          // crotch right
            'L 100 255',          // center crotch
            'L 70 252',           // crotch left
            'L 64 275',           // left inner thigh
            'C 62 290 60 300 58 320',   // left inner thigh down
            'L 57 370',           // left leg inner bottom
            'L 43 370',           // left leg outer bottom
            'L 42 320',           // left outer thigh
            'C 40 300 37 285 38 265',   // left outer thigh up
            'L 42 235',           // left hip
            'C 50 210 54 195 52 180',   // left hip to waist
            'C 50 165 46 150 48 130',   // left waist
            'L 52 95',            // left side below shoulder
            'C 55 75 75 65 100 65',     // left shoulder curve back to top
            'Z',
          ].join(' ')}
          fill="#F5F0EA"
          stroke="#C4B5A3"
          strokeWidth="1.5"
        />

        {/* ── ZONE: neck ── */}
        <ellipse
          id="zone-neck"
          className="body-silhouette-zone"
          cx="100"
          cy="52"
          rx="13"
          ry="14"
          fill={c.neck}
          stroke="#fff"
          strokeWidth="1"
        />
        <text
          x="116"
          y="56"
          fontSize="9"
          fill="#374151"
          fontFamily="sans-serif"
          aria-hidden="true"
        >
          Neck
        </text>

        {/* ── ZONE: shoulder ── */}
        {/* Left shoulder ellipse */}
        <ellipse
          id="zone-shoulder"
          className="body-silhouette-zone"
          cx="100"
          cy="80"
          rx="40"
          ry="12"
          fill={c.shoulder}
          stroke="#fff"
          strokeWidth="1"
        />
        <text
          x="130"
          y="76"
          fontSize="9"
          fill="#374151"
          fontFamily="sans-serif"
          aria-hidden="true"
        >
          Shoulder
        </text>

        {/* ── ZONE: bust ── */}
        <ellipse
          id="zone-bust"
          className="body-silhouette-zone"
          cx="100"
          cy="112"
          rx="38"
          ry="18"
          fill={c.bust}
          stroke="#fff"
          strokeWidth="1"
        />
        <text
          x="139"
          y="116"
          fontSize="9"
          fill="#374151"
          fontFamily="sans-serif"
          aria-hidden="true"
        >
          Bust
        </text>

        {/* ── ZONE: sleeve (upper arm bands, left & right) ── */}
        {/* Right sleeve */}
        <rect
          id="zone-sleeve"
          className="body-silhouette-zone"
          x="148"
          y="88"
          width="16"
          height="38"
          rx="7"
          fill={c.sleeve}
          stroke="#fff"
          strokeWidth="1"
        />
        {/* Left sleeve (mirror) */}
        <rect
          className="body-silhouette-zone"
          x="36"
          y="88"
          width="16"
          height="38"
          rx="7"
          fill={c.sleeve}
          stroke="#fff"
          strokeWidth="1"
        />
        <text
          x="165"
          y="108"
          fontSize="9"
          fill="#374151"
          fontFamily="sans-serif"
          aria-hidden="true"
        >
          Sleeve
        </text>

        {/* ── ZONE: waist ── */}
        <ellipse
          id="zone-waist"
          className="body-silhouette-zone"
          cx="100"
          cy="168"
          rx="30"
          ry="14"
          fill={c.waist}
          stroke="#fff"
          strokeWidth="1"
        />
        <text
          x="131"
          y="172"
          fontSize="9"
          fill="#374151"
          fontFamily="sans-serif"
          aria-hidden="true"
        >
          Waist
        </text>

        {/* ── ZONE: hip ── */}
        <ellipse
          id="zone-hip"
          className="body-silhouette-zone"
          cx="100"
          cy="212"
          rx="42"
          ry="18"
          fill={c.hip}
          stroke="#fff"
          strokeWidth="1"
        />
        <text
          x="143"
          y="216"
          fontSize="9"
          fill="#374151"
          fontFamily="sans-serif"
          aria-hidden="true"
        >
          Hip
        </text>

        {/* ── ZONE: thigh ── */}
        {/* Right thigh */}
        <ellipse
          id="zone-thigh"
          className="body-silhouette-zone"
          cx="124"
          cy="270"
          rx="20"
          ry="26"
          fill={c.thigh}
          stroke="#fff"
          strokeWidth="1"
        />
        {/* Left thigh (mirror) */}
        <ellipse
          className="body-silhouette-zone"
          cx="76"
          cy="270"
          rx="20"
          ry="26"
          fill={c.thigh}
          stroke="#fff"
          strokeWidth="1"
        />
        <text
          x="145"
          y="274"
          fontSize="9"
          fill="#374151"
          fontFamily="sans-serif"
          aria-hidden="true"
        >
          Thigh
        </text>

        {/* ── Head (drawn last so it sits on top) ── */}
        <ellipse
          cx="100"
          cy="30"
          rx="18"
          ry="22"
          fill="#F5E6D3"
          stroke="#C4B5A3"
          strokeWidth="1.5"
        />

        {/* ── Legend ── */}
        <g transform="translate(4, 348)" fontSize="8" fontFamily="sans-serif">
          {/* tight */}
          <rect x="0"  y="0" width="8" height="8" rx="2" fill="#F59E0B" />
          <text x="11" y="8" fill="#374151">Tight</text>
          {/* good */}
          <rect x="38" y="0" width="8" height="8" rx="2" fill="#22C55E" />
          <text x="49" y="8" fill="#374151">Good</text>
          {/* loose */}
          <rect x="76" y="0" width="8" height="8" rx="2" fill="#3B82F6" />
          <text x="87" y="8" fill="#374151">Loose</text>
          {/* neutral */}
          <rect x="115" y="0" width="8" height="8" rx="2" fill="#D1D5DB" />
          <text x="126" y="8" fill="#374151">—</text>
        </g>
      </svg>
    </>
  );
}
