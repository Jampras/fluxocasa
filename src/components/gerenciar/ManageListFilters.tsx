"use client";

type ManageListFilterOption = {
  label: string;
  value: string;
};

interface ManageListFiltersProps {
  searchId: string;
  searchLabel: string;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  filterId: string;
  filterLabel: string;
  filterValue: string;
  filterOptions: ManageListFilterOption[];
  onFilterChange: (value: string) => void;
  sortId?: string;
  sortLabel?: string;
  sortValue?: string;
  sortOptions?: ManageListFilterOption[];
  onSortChange?: (value: string) => void;
  resultLabel: string;
}

export function ManageListFilters({
  searchId,
  searchLabel,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  filterId,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
  sortId,
  sortLabel,
  sortValue,
  sortOptions,
  onSortChange,
  resultLabel
}: ManageListFiltersProps) {
  return (
    <div className="grid gap-3 rounded-none border-[3px] border-neo-dark bg-neo-cream p-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-4">
      <div
        className={`grid gap-3 ${
          sortId && sortOptions && onSortChange
            ? "sm:grid-cols-[minmax(0,1fr)_220px_220px]"
            : "sm:grid-cols-[minmax(0,1fr)_220px]"
        }`}
      >
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-neo-dark/70" htmlFor={searchId}>
          <span>{searchLabel}</span>
          <input
            id={searchId}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="neo-input-surface h-12 rounded-none border-[3px] border-neo-dark px-4 text-sm text-neo-dark outline-none transition-colors placeholder:text-neo-dark/35 sm:border-4"
          />
        </label>

        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-neo-dark/70" htmlFor={filterId}>
          <span>{filterLabel}</span>
          <select
            id={filterId}
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            className="neo-input-surface h-12 rounded-none border-[3px] border-neo-dark px-4 text-sm text-neo-dark outline-none transition-colors sm:border-4"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {sortId && sortLabel && sortValue !== undefined && sortOptions && onSortChange ? (
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-neo-dark/70" htmlFor={sortId}>
            <span>{sortLabel}</span>
            <select
              id={sortId}
              value={sortValue}
              onChange={(event) => onSortChange(event.target.value)}
              className="neo-input-surface h-12 rounded-none border-[3px] border-neo-dark px-4 text-sm text-neo-dark outline-none transition-colors sm:border-4"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neo-dark/55">
        {resultLabel}
      </p>
    </div>
  );
}
