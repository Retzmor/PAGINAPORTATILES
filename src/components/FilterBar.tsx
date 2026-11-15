import React from 'react';
import { RotateCcw, ChevronDown, BadgeCheck, Truck } from 'lucide-react';
import { FilterState } from '../types/laptop';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableBrands: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableBrands,
  totalResults
}) => {
  const toggleBrand = (brand: string) => {
    const current = [...filters.brands];
    const index = current.indexOf(brand);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(brand);
    }
    onFilterChange({ brands: current });
  };

  const isFiltered =
    filters.tier !== 'all' ||
    filters.budgetRange !== 'all' ||
    filters.brands.length > 0 ||
    filters.onlyFreeShipping ||
    filters.minRam > 0 ||
    filters.searchQuery !== '';

  const budgetOptions: Array<{ value: FilterState['budgetRange']; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'under-1.5m', label: 'Menos de $1.5M' },
    { value: '1.5m-2.5m', label: '$1.5M - $2.5M' },
    { value: 'over-2.5m', label: 'Más de $2.5M' }
  ];

  return (
    <section
      id="catalogo"
      className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm mb-6"
    >
      <div className="px-4 sm:px-5 py-3.5 flex flex-col gap-3">
        {/* Top Row: Budget Chips + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Budget Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-on-surface-variant shrink-0 mr-1 hidden sm:inline">
              Presupuesto COP:
            </span>
            {budgetOptions.map((option) => {
              const active = filters.budgetRange === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onFilterChange({ budgetRange: option.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    active
                      ? 'bg-primary-container text-on-primary shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="sortSelector"
              className="text-[11px] font-semibold text-on-surface-variant hidden md:inline"
            >
              Ordenar por:
            </label>
            <div className="relative">
              <select
                id="sortSelector"
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
                className="h-9 pl-3 pr-8 rounded-lg bg-surface-container text-on-surface text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none cursor-pointer"
              >
                <option value="relevance">Recomendados</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="ram-desc">Mayor memoria RAM</option>
              </select>
              <ChevronDown className="w-4 h-4 text-outline absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Second Row: Brand Pills + Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
          {/* Brands */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-on-surface-variant shrink-0 mr-1 hidden lg:inline">
              Marca:
            </span>
            <button
              type="button"
              onClick={() => onFilterChange({ brands: [] })}
              className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all ${
                filters.brands.length === 0
                  ? 'bg-surface-container-high text-primary font-bold'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium'
              }`}
            >
              Todas ({totalResults})
            </button>
            {availableBrands.map((brand) => {
              const isSelected = filters.brands.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all ${
                    isSelected
                      ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium'
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>

          {/* Quick Toggles & Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-secondary-fixed/40 text-secondary text-[11px] font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Tiendas Oficiales</span>
            </span>

            <button
              type="button"
              onClick={() => onFilterChange({ onlyFreeShipping: !filters.onlyFreeShipping })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                filters.onlyFreeShipping
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Envío Gratis</span>
            </button>

            {isFiltered && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 text-[11px] text-tertiary font-bold px-2.5 py-1 rounded-lg bg-error-container/60 hover:bg-error-container transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
