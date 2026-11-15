import React from 'react';
import { Filter, RotateCcw, Check, ArrowDownUp, DollarSign, Tag } from 'lucide-react';
import { FilterState, UsageTierId } from '../types/laptop';
import { formatCOP } from '../utils/formatters';

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs mb-8">
      {/* Top Header inside filter box */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
            <Filter className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800">Filtros inteligentes</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {totalResults} {totalResults === 1 ? 'portátil' : 'portátiles'}
          </span>
        </div>

        {/* Sort and Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ordenar:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="relevance">Recomendados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="ram-desc">Más memoria RAM</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
        {/* 1. Perfil de Uso Buttons */}
        <div className="md:col-span-12 lg:col-span-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Perfil de uso
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onFilterChange({ tier: 'all' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.tier === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos los perfiles
            </button>
            <button
              onClick={() => onFilterChange({ tier: 'basic' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.tier === 'basic'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              📚 Estudio y Oficina Básica
            </button>
            <button
              onClick={() => onFilterChange({ tier: 'work' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.tier === 'work'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              💼 Multitarea y Trabajo Fluido
            </button>
            <button
              onClick={() => onFilterChange({ tier: 'pro' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.tier === 'pro'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              🎮 Alto Rendimiento / Gaming
            </button>
          </div>
        </div>

        {/* 2. Presupuesto en COP */}
        <div className="md:col-span-6 lg:col-span-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Presupuesto (Pesos Colombianos)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onFilterChange({ budgetRange: 'all' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.budgetRange === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cualquier valor
            </button>
            <button
              onClick={() => onFilterChange({ budgetRange: 'under-1.5m' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.budgetRange === 'under-1.5m'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Menos de $1.5M
            </button>
            <button
              onClick={() => onFilterChange({ budgetRange: '1.5m-2.5m' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.budgetRange === '1.5m-2.5m'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              $1.5M - $2.5M
            </button>
            <button
              onClick={() => onFilterChange({ budgetRange: 'over-2.5m' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.budgetRange === 'over-2.5m'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Más de $2.5M
            </button>
          </div>
        </div>

        {/* 3. Marcas Disponibles */}
        <div className="md:col-span-6 lg:col-span-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Marcas
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableBrands.map((brand) => {
              const isSelected = filters.brands.includes(brand);
              return (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{brand}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

