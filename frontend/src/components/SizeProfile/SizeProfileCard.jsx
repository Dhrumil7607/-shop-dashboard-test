/**
 * SizeProfileCard.jsx
 *
 * Displays a single SizeProfile with:
 *  - Profile name, unit, and a summary of up to 5 key measurements
 *  - DefaultBadge when is_default === true
 *  - Three action buttons: Edit, Delete, Set as Default (last shown only when !is_default)
 *  - A display-only unit toggle (cm / in) that converts measurements for viewing
 *    without modifying the stored profile.
 *
 * All icon buttons have aria-label and a minimum 44×44 px touch area.
 *
 * Props:
 *  - profile  {SizeProfile}              the profile object to display
 *  - onEdit   {(profile) => void}        called with the full profile object
 *  - onDelete {(profileId) => void}      called with the profile's id
 *  - onSetDefault {(profileId) => void}  called with the profile's id
 *
 * Requirements: 1.1, 1.6, 2.1, 2.2, 12.4
 */

import { memo, useState } from 'react';
import { Pencil, Trash2, Star } from 'lucide-react';
import DefaultBadge from './DefaultBadge';

/** Keys and display labels for the up-to-5 measurement summary. */
const KEY_MEASUREMENTS = [
  { key: 'bust',   label: 'Bust'   },
  { key: 'waist',  label: 'Waist'  },
  { key: 'hip',    label: 'Hip'    },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
];

/**
 * Converts a measurement value for display.
 * Weight is never converted — it is always shown in kg.
 *
 * cm → inches: Math.round(value * 0.3937 * 10) / 10  (1 decimal place)
 * inches → cm: Math.round(value * 2.54   * 10) / 10  (1 decimal place)
 *
 * @param {number}  value       - stored numeric value
 * @param {string}  storedUnit  - the unit the value is stored in ('cm' | 'inches')
 * @param {string}  displayUnit - the unit to display ('cm' | 'inches')
 * @param {boolean} isWeight    - weight is never converted
 * @returns {{ displayValue: number, displayUnitLabel: string }}
 */
function convertForDisplay(value, storedUnit, displayUnit, isWeight) {
  if (isWeight) {
    return { displayValue: value, displayUnitLabel: 'kg' };
  }

  const unitLabel = displayUnit === 'inches' ? 'in' : 'cm';

  if (storedUnit === displayUnit) {
    return { displayValue: value, displayUnitLabel: unitLabel };
  }

  let converted;
  if (storedUnit === 'cm' && displayUnit === 'inches') {
    converted = Math.round(value * 0.3937 * 10) / 10;
  } else {
    // storedUnit === 'inches' && displayUnit === 'cm'
    converted = Math.round(value * 2.54 * 10) / 10;
  }

  return { displayValue: converted, displayUnitLabel: unitLabel };
}

/**
 * Builds an array of { label, displayValue, displayUnitLabel } for measurements
 * that are present and numeric, capped at 5 items.
 * Values are converted from the profile's stored unit to the requested displayUnit.
 *
 * @param {SizeProfile} profile
 * @param {string}      displayUnit - 'cm' | 'inches'
 * @returns {{ label: string, displayValue: number, displayUnitLabel: string }[]}
 */
function buildMeasurementSummary(profile, displayUnit) {
  const items = [];

  for (const { key, label } of KEY_MEASUREMENTS) {
    const val = profile[key];
    // Only include fields that have a finite numeric value
    if (val !== undefined && val !== null && val !== '' && isFinite(Number(val))) {
      const { displayValue, displayUnitLabel } = convertForDisplay(
        Number(val),
        profile.unit,
        displayUnit,
        key === 'weight',
      );
      items.push({ label, displayValue, displayUnitLabel });
    }
    if (items.length === 5) break;
  }

  return items;
}

/**
 * SizeProfileCard component.
 *
 * @param {object}   props
 * @param {object}   props.profile       - SizeProfile object
 * @param {Function} props.onEdit        - called with profile when Edit is clicked
 * @param {Function} props.onDelete      - called with profileId when Delete is clicked
 * @param {Function} props.onSetDefault  - called with profileId when Set as Default is clicked
 */
const SizeProfileCard = memo(function SizeProfileCard({
  profile,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  // Display unit defaults to the profile's stored unit.
  // Toggling only affects what's shown — it never mutates the profile.
  const [displayUnit, setDisplayUnit] = useState(profile.unit ?? 'cm');

  const measurements = buildMeasurementSummary(profile, displayUnit);

  const handleEdit       = () => onEdit?.(profile);
  const handleDelete     = () => onDelete?.(profile.id);
  const handleSetDefault = () => onSetDefault?.(profile.id);

  return (
    <article
      className="bg-white border border-line-soft rounded-xl shadow-sm hover:shadow-soft transition-shadow duration-300 p-5 flex flex-col gap-4"
      aria-label={`Size profile: ${profile.profile_name}${profile.is_default ? ', default' : ''}`}
    >
      {/* ── Header: name + default badge ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-espresso leading-tight truncate">
            {profile.profile_name}
          </h3>

          {/* ── Unit toggle (display-only, does NOT call onEdit) ── */}
          <div
            className="inline-flex mt-1 rounded-lg overflow-hidden"
            style={{ border: '1px solid #E8E4DF' }}
            role="radiogroup"
            aria-label="Display unit"
          >
            {(['cm', 'inches'] ).map((u) => {
              const label  = u === 'inches' ? 'in' : 'cm';
              const active = displayUnit === u;
              return (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setDisplayUnit(u)}
                  className="px-3 py-1 text-[11px] font-semibold min-w-[36px] min-h-[28px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C9A84C]"
                  style={{
                    background: active ? '#2C241B' : 'transparent',
                    color:      active ? '#FFF8F0' : '#8B8680',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {profile.is_default && (
          <div className="flex-shrink-0 pt-0.5">
            <DefaultBadge />
          </div>
        )}
      </div>

      {/* ── Measurement summary ── */}
      {measurements.length > 0 ? (
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
          {measurements.map(({ label, displayValue, displayUnitLabel }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-[10px] font-semibold uppercase tracking-widest text-stone">
                {label}
              </dt>
              <dd className="text-sm font-medium text-espresso tabular-nums">
                {displayValue} <span className="text-xs text-stone">{displayUnitLabel}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-stone italic">No measurements saved yet.</p>
      )}

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-2 pt-1 border-t border-line-soft mt-auto">
        {/* Edit button — always visible */}
        <button
          type="button"
          onClick={handleEdit}
          aria-label={`Edit ${profile.profile_name}`}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-3 rounded-lg text-stone hover:text-espresso hover:bg-cream transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-1"
        >
          <Pencil size={17} aria-hidden="true" />
        </button>

        {/* Delete button — always visible */}
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Delete ${profile.profile_name}`}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-3 rounded-lg text-stone hover:text-red-600 hover:bg-red-50 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>

        {/* Set as Default — only shown when NOT already the default */}
        {!profile.is_default && (
          <button
            type="button"
            onClick={handleSetDefault}
            aria-label={`Set ${profile.profile_name} as default`}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-3 rounded-lg text-stone hover:text-champagne hover:bg-amber-50 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-1"
            title="Set as default profile"
          >
            <Star size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
});

SizeProfileCard.displayName = 'SizeProfileCard';

export default SizeProfileCard;
