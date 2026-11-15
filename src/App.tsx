import React, { useState, useMemo } from 'react';
import rawLaptops from './data/portatiles.json';
import rawPriceSync from './data/price-sync.json';
import { Laptop, FilterState } from './types/laptop';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { ComparisonModal } from './components/ComparisonModal';
import { GuideModal } from './components/GuideModal';
import { Footer } from './components/Footer';
import {
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  ArrowLeftRight
} from 'lucide-react';
import {
  formatCOP,
  getSafeLaptopImageUrl,
  handleLaptopImageError
} from './utils/formatters';

interface PriceSyncFailure {
  id: string;
  permalink?: string;
  status?: number | string | null;
  error?: string;
}

interface PriceSyncReport {
  lastSyncedAt?: string;
  notFoundIds?: string[];
  failures?: PriceSyncFailure[];
  sampleFailures?: PriceSyncFailure[];
}

/**
 * Extracts laptop IDs marked as `not-found` in price-sync.json so out-of-stock
 * or paused Mercado Libre publications stay hidden from the catalog UI.
 */
function getNotFoundLaptopIds(syncReport: PriceSyncReport): Set<string> {
  const hiddenIds = new Set<string>(syncReport.notFoundIds ?? []);
  const lists = [syncReport.failures ?? [], syncReport.sampleFailures ?? []];
  for (const list of lists) {
    for (const entry of list) {
      if (
        entry?.id &&
        (entry.status === 'not-found' || String(entry.error || '').includes('not-found'))
      ) {
        hiddenIds.add(entry.id);
      }
    }
  }
  return hiddenIds;
}

const PRICE_SYNC_REPORT = rawPriceSync as PriceSyncReport;
const NOT_FOUND_IDS = getNotFoundLaptopIds(PRICE_SYNC_REPORT);

export const App: React.FC = () => {
  // Master active laptops list: exclude items whose status in price-sync.json is not-found
  const laptops: Laptop[] = useMemo(
    () => (rawLaptops as Laptop[]).filter((item) => !NOT_FOUND_IDS.has(item.id)),
    []
  );

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    tier: 'all',
    budgetRange: 'all',
    customMaxPrice: 10000000,
    brands: [],
    minRam: 0,
    onlyFreeShipping: false,
    sortBy: 'relevance'
  });

  // Comparison selection (up to 3 items) & drawer minimize state
  const [comparisonList, setComparisonList] = useState<Laptop[]>([]);
  const [isComparisonMinimized, setIsComparisonMinimized] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Available unique brands
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    laptops.forEach((item) => {
      if (item.brand && item.brand !== 'Otro') {
        brandSet.add(item.brand);
      }
    });
    return Array.from(brandSet).sort();
  }, [laptops]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      tier: 'all',
      budgetRange: 'all',
      customMaxPrice: 10000000,
      brands: [],
      minRam: 0,
      onlyFreeShipping: false,
      sortBy: 'relevance'
    });
  };

  // Toggle laptop for comparison
  const handleToggleCompare = (laptop: Laptop) => {
    setComparisonList((prev) => {
      const exists = prev.some((item) => item.id === laptop.id);
      if (exists) {
        return prev.filter((item) => item.id !== laptop.id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      setIsComparisonMinimized(false);
      return [...prev, laptop];
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparisonList((prev) => prev.filter((item) => item.id !== id));
  };

  // Filtered and sorted laptop list
  const filteredLaptops = useMemo(() => {
    return laptops
      .filter((laptop) => {
        // 1. Search Query
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase();
          const matchesTitle = laptop.title.toLowerCase().includes(query);
          const matchesBrand = laptop.brand.toLowerCase().includes(query);
          const matchesCpu = laptop.processor.raw.toLowerCase().includes(query);
          if (!matchesTitle && !matchesBrand && !matchesCpu) return false;
        }

        // 2. Usage Tier
        if (filters.tier !== 'all' && laptop.tier.id !== filters.tier) {
          return false;
        }

        // 3. Budget Range
        if (filters.budgetRange === 'under-1.5m' && laptop.price >= 1500000) return false;
        if (filters.budgetRange === '1.5m-2.5m' && (laptop.price < 1500000 || laptop.price > 2500000)) return false;
        if (filters.budgetRange === 'over-2.5m' && laptop.price <= 2500000) return false;

        // 4. Brands
        if (filters.brands.length > 0 && !filters.brands.includes(laptop.brand)) {
          return false;
        }

        // 5. Min RAM
        if (filters.minRam > 0 && laptop.ram.sizeGB < filters.minRam) {
          return false;
        }

        // 6. Free Shipping
        if (filters.onlyFreeShipping && !laptop.freeShipping) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price-asc') return a.price - b.price;
        if (filters.sortBy === 'price-desc') return b.price - a.price;
        if (filters.sortBy === 'ram-desc') return b.ram.sizeGB - a.ram.sizeGB;
        return 0; // relevance / natural order
      });
  }, [laptops, filters]);

  const emptySlotsCount = Math.max(0, 3 - comparisonList.length);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary">
      {/* Header */}
      <Header
        comparisonList={comparisonList}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        searchQuery={filters.searchQuery}
        onSearchChange={(query) => handleFilterChange({ searchQuery: query })}
        onResetAll={handleResetFilters}
      />

      {/* Hero Section with Top Stats Strip & 3 Quick Profile Cards */}
      <Hero
        laptops={laptops}
        selectedTier={filters.tier}
        onSelectTier={(tier) => handleFilterChange({ tier })}
        searchQuery={filters.searchQuery}
        onSearchChange={(query) => handleFilterChange({ searchQuery: query })}
        lastSyncedAt={PRICE_SYNC_REPORT.lastSyncedAt}
      />

      {/* Main Catalog Section */}
      <main
        className={`flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 ${
          comparisonList.length > 0 ? 'pb-40' : 'pb-14'
        }`}
      >
        {/* Smart Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          availableBrands={availableBrands}
          totalResults={filteredLaptops.length}
        />

        {/* Product Count Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-[13px] text-on-surface font-medium">
              Mostrando <strong>{filteredLaptops.length}</strong> de{' '}
              <strong>{laptops.length}</strong> portátiles con stock verificado en Colombia
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] font-semibold text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              Envío Mercado Envíos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              Compra Protegida
            </span>
          </div>
        </div>

        {/* Product Grid */}
        {filteredLaptops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLaptops.map((laptop) => (
              <ProductCard
                key={laptop.id}
                laptop={laptop}
                isSelectedForCompare={comparisonList.some((item) => item.id === laptop.id)}
                onToggleCompare={handleToggleCompare}
                canCompare={comparisonList.length < 3}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-10 text-center max-w-lg mx-auto shadow-sm my-10">
            <div className="w-14 h-14 bg-error-container text-tertiary rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-on-surface mb-1">
              No encontramos portátiles con esos filtros
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Intenta seleccionar otro rango de presupuesto o quita algunas marcas para ver más opciones disponibles.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-bold text-sm shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ver todos los portátiles</span>
            </button>
          </div>
        )}

        {/* Trust & Verification Assurance Banner */}
        <section
          id="confianza"
          className="mt-10 p-5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-on-surface">
                ¿Cómo verificamos los precios y especificaciones?
              </h4>
              <p className="text-[13px] text-on-surface-variant leading-snug mt-0.5">
                Consultamos directamente las publicaciones activas de Tiendas Oficiales en Mercado Libre Colombia y traducimos sus especificaciones técnicas a un lenguaje claro para que elijas con confianza.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="shrink-0 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high border border-outline-variant/40 text-xs font-bold transition-colors shadow-xs"
          >
            Ver guía sin tecnicismos
          </button>
        </section>
      </main>

      {/* Sticky Bottom Floating Comparison Bar */}
      {comparisonList.length > 0 && (
        <aside
          aria-label="Barra flotante de comparación de portátiles"
          className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/40 shadow-2xl transition-all duration-300"
        >
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex flex-col gap-2">
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
                </span>
                <span className="font-display text-sm font-bold text-on-surface">
                  Comparando {comparisonList.length} de 3 portátiles seleccionados
                </span>
                <span className="hidden md:inline-block text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                  Máximo 3 equipos
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComparisonList([])}
                  className="text-[11px] font-semibold text-outline hover:text-tertiary transition-colors px-2 py-1"
                >
                  Limpiar selección
                </button>
                <button
                  type="button"
                  onClick={() => setIsComparisonMinimized((prev) => !prev)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-md"
                  aria-label={isComparisonMinimized ? 'Expandir barra' : 'Minimizar barra'}
                >
                  {isComparisonMinimized ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            {!isComparisonMinimized && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                  {comparisonList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 p-2 bg-surface-container rounded-lg shrink-0 pr-2.5 min-w-[210px] max-w-[250px]"
                    >
                      <div className="w-10 h-10 rounded bg-surface-container-lowest p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={getSafeLaptopImageUrl(item.imagen || item.imageUrl)}
                          alt={item.nombre || item.title}
                          referrerPolicy="no-referrer"
                          onError={handleLaptopImageError}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-on-surface truncate">
                          {item.nombre || item.title}
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {formatCOP(item.precioCOP ?? item.price)} COP
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCompare(item.id)}
                        className="text-outline hover:text-tertiary p-1 rounded-full shrink-0"
                        title="Quitar de la comparación"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                    <div
                      key={`empty-slot-${idx}`}
                      className="hidden sm:flex items-center gap-2 p-2.5 rounded-lg shrink-0 bg-surface-container-low text-on-surface-variant min-w-[190px] justify-center border border-dashed border-outline-variant/60"
                    >
                      <PlusCircle className="w-4 h-4 text-outline" />
                      <span className="text-[11px] font-semibold">Selecciona otro portátil</span>
                    </div>
                  ))}
                </div>

                <div className="w-full md:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsComparisonOpen(true)}
                    className="w-full md:w-auto h-11 px-6 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <span>
                      Comparar especificaciones frente a frente ({comparisonList.length})
                    </span>
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        laptops={comparisonList}
        onRemoveItem={handleRemoveFromCompare}
      />

      {/* Plain Language Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
