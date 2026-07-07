import React from 'react';

/**
 * Trust badge definitions.
 * Each badge has an icon (emoji) and a label.
 */
const TRUST_BADGES = [
  { icon: '🔒', label: '256-bit SSL Encrypted' },
  { icon: '✓',  label: 'Authentic Indian Stores' },
  { icon: '✈️', label: 'Worldwide Shipping' },
  { icon: '↩️', label: 'Easy Returns' },
];

/**
 * TrustBadgeRow — purely presentational trust-signal row.
 *
 * Renders four horizontally laid-out badges (wrapping on narrow viewports)
 * centred below the checkout "Place Order" button. No props required.
 */
const TrustBadgeRow = () => (
  <div
    className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4"
    aria-label="Trust and security badges"
  >
    {TRUST_BADGES.map(({ icon, label }) => (
      <div
        key={label}
        className="flex items-center gap-1.5 text-xs text-gray-400"
      >
        <span aria-hidden="true" className="text-sm leading-none">
          {icon}
        </span>
        <span>{label}</span>
      </div>
    ))}
  </div>
);

export default TrustBadgeRow;
