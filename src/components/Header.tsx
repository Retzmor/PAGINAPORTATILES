import React from 'react';
import { Laptop as LaptopIcon, Search, HelpCircle, Scale, Flag, X } from 'lucide-react';
import { Laptop } from '../types/laptop';

interface HeaderProps {
  comparisonList: Laptop[];
  onOpenComparison: () => void;
  onOpenGuide: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetAll?: () => void;
  onSelectOfficialStores?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  comparisonList,
  onOpenComparison,
  onOpenGuide,
  searchQuery,
  onSearchChange,
  onResetAll,
  onSelectOfficialStores
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30">
      <div className="h-20 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a
          href="#top"
          onClick={(e) => {
            if (onResetAll) {
              e.preventDefault();
              onResetAll();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container transition-colors">
            <LaptopIcon className="w-5 h-5" />
          </div>
          <span className="font-display text-lg sm:text-xl font-bold text-primary tracking-tight">
            ComparaTech <span className="text-secondary font-extrabold">CO</span>
          </span>
        </a>

        {/* Header Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-2">
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por modelo, procesador (ej: Core i5, Ryzen 7) o marca..."
              className="w-full h-11 pl-10 pr-9 bg-surface rounded-lg border border-outline-variant/60 text-[13px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 p-1 text-outline hover:text-on-surface rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface text-[11px] font-semibold">
            <Flag className="w-3.5 h-3.5 text-secondary" />
            <span>COP ($) · Colombia</span>
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
            title="Aprende qué significa cada especificación en palabras sencillas"
          >
            <HelpCircle className="w-4 h-4 text-primary-container" />
            <span className="hidden sm:inline">Guía sin tecnicismos</span>
            <span className="sm:hidden">Guía</span>
          </button>

          <button
            type="button"
            onClick={onOpenComparison}
            disabled={comparisonList.length === 0}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              comparisonList.length > 0
                ? 'bg-primary-container hover:bg-primary text-on-primary shadow-sm cursor-pointer'
                : 'bg-surface-container-low text-outline cursor-not-allowed'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Comparar</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] leading-none font-bold ${
                comparisonList.length > 0
                  ? 'bg-on-primary text-primary'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {comparisonList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="w-full border-t border-outline-variant/20 bg-surface-container-lowest/80">
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
          <nav className="flex items-center gap-6 overflow-x-auto h-10 scrollbar-none">
            <a
              href="#catalogo"
              className="text-xs font-bold text-primary border-b-2 border-primary py-2.5 shrink-0"
            >
              Portátiles
            </a>
            <button
              type="button"
              onClick={() => {
                onSelectOfficialStores?.();
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface py-2.5 shrink-0 transition-colors"
            >
              Tiendas Oficiales
            </button>
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface py-2.5 shrink-0 transition-colors"
            >
              Guía de Compra
            </button>
            <a
              href="#confianza"
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface py-2.5 shrink-0 transition-colors"
            >
              Verificación de Precios
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
