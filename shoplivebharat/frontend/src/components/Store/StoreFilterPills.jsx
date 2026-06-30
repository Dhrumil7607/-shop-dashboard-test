/**
 * StoreFilterPills
 *
 * A reusable horizontal filter pill row for the Store Discovery section and
 * the enhanced /shops page.
 *
 * Requirements: 6.7, 7.3, 12.4
 */

const FILTERS = [
  'All',
  'Trending',
  'New',
  'Luxury',
  'Wedding Specialists',
  'Regional',
  'Featured',
];

/**
 * @param {object}   props
 * @param {string}   [props.activeFilter='All']   - Currently active filter label
 * @param {function} props.onFilterChange         - Callback fired with the selected filter string
 */
export default function StoreFilterPills({ activeFilter = 'All', onFilterChange }) {
  return (
    <div
      className="flex flex-nowrap overflow-x-auto gap-2 pb-1"
      // Hide the scrollbar visually while keeping it functional
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      role="group"
      aria-label="Store filter options"
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter;

        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            aria-pressed={isActive}
            className={[
              // Touch target — minimum 44 × 44 px (Req 12.4)
              'min-h-[44px] px-4 flex items-center flex-shrink-0',
              'rounded-full text-sm font-medium transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-espresso',
              isActive
                // Active: espresso background + ivory text
                ? 'bg-espresso text-ivory shadow-soft'
                // Inactive: white background + border + dark text
                : 'bg-white border border-[#E8E4DF] text-[#3C3027] hover:border-espresso hover:text-espresso',
            ].join(' ')}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
