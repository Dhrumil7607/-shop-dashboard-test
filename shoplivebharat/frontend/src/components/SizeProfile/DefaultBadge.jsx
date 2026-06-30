/**
 * DefaultBadge.jsx
 *
 * A small inline green pill badge that indicates a Size Profile is the
 * user's default profile.
 *
 * Usage:
 *   import DefaultBadge from '@/components/SizeProfile/DefaultBadge';
 *   <DefaultBadge />
 */

/**
 * DefaultBadge — green pill "Default" label.
 * Renders a <span> with green background, white text, and rounded-full styling.
 *
 * @returns {JSX.Element}
 */
function DefaultBadge() {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200"
      aria-label="Default profile"
    >
      Default
    </span>
  );
}

export default DefaultBadge;
