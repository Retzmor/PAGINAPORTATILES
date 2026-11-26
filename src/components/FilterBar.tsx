import React from 'react';
import { RotateCcw, ChevronDown, BadgeCheck, Truck } from 'lucide-react';
import { FilterState } from '../types/laptop';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableBrands: string[];
  totalResults: number;
  totalCatalogCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableBrands,
  totalCatalogCount
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
    filters.onlyOfficialStores ||
    filters.minRam > 0 ||
    filters.searchQuery !== '';

  const budgetOptions: Array<{ value: FilterState['budgetRange']; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'under-2m', label: 'Menos de $2.0M' },
    { value: '2m-3.2m', label: '$2.0M - $3.2M' },
    { value: 'over-3.2m', label: 'Más de $3.2M' }
  ];

  return (
    <section
      id="catalogo"
      className="scroll-mt-32 w-full bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm mb-6"
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

        {/* Second Row: Brand Pills + Interactive Quick Toggles */}
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
              Todas ({totalCatalogCount})
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

          {/* Interactive Quick Toggles & Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onFilterChange({ onlyOfficialStores: !filters.onlyOfficialStores })}
              aria-pressed={filters.onlyOfficialStores}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                filters.onlyOfficialStores
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-secondary-fixed/40 text-secondary hover:bg-secondary-fixed/70'
              }`}
              title="Filtrar solo publicaciones verificadas con sello Tienda Oficial"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Solo Tiendas Oficiales</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ onlyFreeShipping: !filters.onlyFreeShipping })}
              aria-pressed={filters.onlyFreeShipping}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                filters.onlyFreeShipping
                  ? 'bg-primary-container text-on-primary shadow-xs'
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
