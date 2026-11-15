import React, { useState, useMemo } from 'react';
import rawLaptops from './data/portatiles.json';
import rawPriceSync from './data/price-sync.json';
import { Laptop, FilterState, UsageTierId } from './types/laptop';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { ComparisonModal } from './components/ComparisonModal';
import { GuideModal } from './components/GuideModal';
import { Footer } from './components/Footer';
import { Scale, X, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { getSafeLaptopImageUrl, handleLaptopImageError } from './utils/formatters';

interface PriceSyncFailure {
  id: string;
  permalink?: string;
  status?: number | string | null;
  error?: string;
}

interface PriceSyncReport {
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

const NOT_FOUND_IDS = getNotFoundLaptopIds(rawPriceSync as PriceSyncReport);

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

  // Comparison selection (up to 3 items)
  const [comparisonList, setComparisonList] = useState<Laptop[]>([]);
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
      } else {
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, laptop];
      }
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparisonList((prev) => prev.filter((item) => item.id !== id));
  };

  // Filtered and sorted laptop list
  const filteredLaptops = useMemo(() => {
    return laptops.filter((laptop) => {
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
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'ram-desc') return b.ram.sizeGB - a.ram.sizeGB;
      return 0; // relevance / natural order
    });
  }, [laptops, filters]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <Header
        comparisonList={comparisonList}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Hero Section with Quick Tiers */}
      <Hero
        selectedTier={filters.tier}
        onSelectTier={(tier) => handleFilterChange({ tier })}
        searchQuery={filters.searchQuery}
        onSearchChange={(query) => handleFilterChange({ searchQuery: query })}
      />

      {/* Main Catalog Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          availableBrands={availableBrands}
          totalResults={filteredLaptops.length}
        />

        {/* Product Grid */}
        {filteredLaptops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No encontramos portátiles con esos filtros
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Intenta seleccionar otro rango de precio o quita algunas marcas para ver más opciones disponibles.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ver todos los portátiles</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Comparison Drawer / Dock */}
      {comparisonList.length > 0 && (
        <aside 
          aria-label="Barra flotante de comparación de portátiles"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 sm:gap-6 animate-in slide-in-from-bottom duration-300 max-w-[95vw]"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {comparisonList.map((item) => (
                <div
                  key={item.id}
                  className="relative w-9 h-9 rounded-full bg-white p-1 border-2 border-slate-900 overflow-hidden shadow-xs shrink-0"
                >
                  <img
                    src={getSafeLaptopImageUrl(item.imagen || item.imageUrl)}
                    alt={item.nombre || item.title}
                    referrerPolicy="no-referrer"
                    onError={handleLaptopImageError}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs">
              <div className="font-bold">{comparisonList.length} de 3 portátiles</div>
              <div className="text-slate-400 text-[10px] hidden sm:block">listos para comparar</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsComparisonOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
            >
              <Scale className="w-4 h-4" />
              <span>Ver comparativa</span>
            </button>
            <button
              onClick={() => setComparisonList([])}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Borrar selección"
            >
              <X className="w-4 h-4" />
            </button>
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
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;

