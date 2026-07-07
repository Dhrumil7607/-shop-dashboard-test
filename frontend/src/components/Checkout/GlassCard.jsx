import React from 'react';

/**
 * GlassCard — reusable glass-morphism wrapper component.
 *
 * Applies a frosted-glass visual treatment to its children. Tailwind is used
 * for layout/structural utilities while the exact backdrop-filter and
 * background values are set via inline style (Tailwind's defaults don't cover
 * these specific values).
 *
 * Props:
 *   className  {string}  — Tailwind classes for positioning / sizing
 *                          (e.g. "lg:sticky lg:top-24").  Optional.
 *   children   {node}    — Content rendered inside the card.
 *   style      {object}  — Additional inline styles merged on top of the
 *                          glass-morphism base styles.  Optional.
 */
const GlassCard = ({ className = '', children, style = {} }) => {
  const glassStyle = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)', // Safari prefix
    background: 'rgba(250,249,246,0.85)',
    border: '1px solid rgba(232,228,223,0.6)',
    ...style,
  };

  return (
    <div
      className={`rounded-2xl ${className}`}
      style={glassStyle}
    >
      {children}
    </div>
  );
};

export default GlassCard;
