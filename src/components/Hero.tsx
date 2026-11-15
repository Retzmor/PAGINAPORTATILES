import React, { useMemo } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  BadgeCheck,
  GraduationCap,
  Laptop as LaptopIcon,
  Gamepad2,
  Star,
  Search,
  X
} from 'lucide-react';
import { Laptop, UsageTierId } from '../types/laptop';
import { formatCOP } from '../utils/formatters';

interface HeroProps {
  laptops: Laptop[];
  selectedTier: UsageTierId | 'all';
  onSelectTier: (tier: UsageTierId | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lastSyncedAt?: string;
}

export const Hero: React.FC<HeroProps> = ({
  laptops,
  selectedTier,
  onSelectTier,
  searchQuery,
  onSearchChange,
  lastSyncedAt
}) => {
  const tierStartingPrices = useMemo(() => {
    const minByTier: Record<UsageTierId, number | null> = {
      basic: null,
      work: null,
      pro: null
    };

    laptops.forEach((item) => {
      const price = item.precioCOP ?? item.price;
      const tid = item.tier.id;
      if (price > 0 && (minByTier[tid] === null || price < minByTier[tid]!)) {
        minByTier[tid] = price;
      }
    });

    return minByTier;
  }, [laptops]);

  const formattedSyncDate = useMemo(() => {
    if (!lastSyncedAt) return 'Actualizado hoy';
    const d = new Date(lastSyncedAt);
    if (Number.isNaN(d.getTime())) return 'Actualizado hoy';
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [lastSyncedAt]);

  return (
    <div id="top" className="w-full">
      {/* Top Stats Strip */}
      <section className="w-full bg-surface-container-low py-2 px-4 sm:px-6 lg:px-10 border-b border-outline-variant/20">
        <div className="max-w-[1320px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-secondary">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {laptops.length} portátiles activos verificados
            </span>
            <span className="text-outline-variant hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-primary-container" />
              Mercado Libre Colombia · Sincronizado {formattedSyncDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary font-semibold hidden md:inline">
              100% Tiendas Oficiales · Garantía en Colombia
            </span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="w-full py-8 md:py-10 px-4 sm:px-6 lg:px-10 relative overflow-hidden bg-surface">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-6">
          {/* Headline & Trust Card */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed text-xs font-semibold">
                <BadgeCheck className="w-4 h-4 text-secondary" />
                <span>Actualizado hoy con stock en vivo · Tiendas Oficiales</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] lg:leading-[48px] font-extrabold text-on-surface tracking-tight">
                Encuentra tu portátil ideal{' '}
                <span className="text-primary-container">sin perder tiempo</span>
              </h1>

              <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
                Comparamos especificaciones explicadas sin tecnicismos y precios reales en Pesos Colombianos (COP) entre tiendas verificadas en Mercado Libre Colombia.
              </p>
            </div>

            <div className="flex items-center shrink-0">
              <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Compra Protegida
                  </div>
                  <div className="font-display text-base text-secondary font-bold">
                    Tiendas Oficiales CO
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search Input (< md, since md+ is in Header) */}
          <div className="md:hidden">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar marca, modelo o procesador..."
                className="w-full h-11 pl-10 pr-9 bg-surface-container-lowest rounded-lg border border-outline-variant/60 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 p-1 text-outline hover:text-on-surface"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 3 Interactive Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Profile 1: Estudio y Oficina */}
            <button
              type="button"
              onClick={() => onSelectTier(selectedTier === 'basic' ? 'all' : 'basic')}
              className={`group relative text-left p-5 bg-surface-container-lowest hover:bg-surface-container-low rounded-xl transition-all flex flex-col justify-between border ${
                selectedTier === 'basic'
                  ? 'border-primary-container ring-2 ring-primary-container shadow-md'
                  : 'border-outline-variant/40 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                    Ideal estudiantes y teletrabajo
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-on-surface pt-1">
                  Estudio y Oficina
                </h2>
                <p className="text-[13px] text-on-surface-variant leading-snug">
                  Ligeros y confiables para Zoom, Meet, Word, Excel, navegación diaria y clases virtuales sin gastar de más.
                </p>
              </div>

              <div className="mt-4 pt-2.5 flex items-baseline justify-between bg-surface-container-low/70 px-3 py-2 rounded-lg">
                <span className="text-[11px] text-on-surface-variant font-semibold">Gama sugerida</span>
                <span className="font-display text-base text-on-surface font-extrabold">
                  {tierStartingPrices.basic ? `Desde ${formatCOP(tierStartingPrices.basic)}` : 'Uso cotidiano'}
                </span>
              </div>
            </button>

            {/* Profile 2: Multitarea y Trabajo */}
            <button
              type="button"
              onClick={() => onSelectTier(selectedTier === 'work' ? 'all' : 'work')}
              className={`group relative text-left p-5 rounded-xl transition-all flex flex-col justify-between border bg-gradient-to-b from-surface-container-lowest via-surface-container-lowest to-surface-container-low ${
                selectedTier === 'work'
                  ? 'border-primary-container ring-2 ring-primary-container shadow-lg'
                  : 'border-primary-fixed hover:border-primary-container shadow-md'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary text-[11px] px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 font-bold whitespace-nowrap">
                <Star className="w-3 h-3 fill-current" />
                <span>Mejor relación calidad/precio</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-lg bg-primary-fixed flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform">
                    <LaptopIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary-fixed/60 text-primary-container font-semibold">
                    Recomendado
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-on-surface pt-1">
                  Multitarea y Trabajo
                </h2>
                <p className="text-[13px] text-on-surface-variant leading-snug">
                  Fluidez para decenas de pestañas, videollamadas sin cortes, Canva, programación y trabajo remoto diario.
                </p>
              </div>

              <div className="mt-4 pt-2.5 flex items-baseline justify-between bg-primary-fixed/40 px-3 py-2 rounded-lg">
                <span className="text-[11px] text-primary font-semibold">Gama sugerida</span>
                <span className="font-display text-base text-primary-container font-extrabold">
                  {tierStartingPrices.work ? `Desde ${formatCOP(tierStartingPrices.work)}` : 'Trabajo fluido'}
                </span>
              </div>
            </button>

            {/* Profile 3: Gaming y Alto Rendimiento */}
            <button
              type="button"
              onClick={() => onSelectTier(selectedTier === 'pro' ? 'all' : 'pro')}
              className={`group relative text-left p-5 bg-surface-container-lowest hover:bg-surface-container-low rounded-xl transition-all flex flex-col justify-between border ${
                selectedTier === 'pro'
                  ? 'border-primary-container ring-2 ring-primary-container shadow-md'
                  : 'border-outline-variant/40 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-lg bg-error-container flex items-center justify-center text-tertiary-container group-hover:scale-105 transition-transform">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-error-container/70 text-tertiary font-semibold">
                    Gamers y Render 3D
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-on-surface pt-1">
                  Gaming y Alto Rendimiento
                </h2>
                <p className="text-[13px] text-on-surface-variant leading-snug">
                  16GB+ RAM, procesadores de alto desempeño o gráficas NVIDIA GeForce RTX para diseño, edición y juegos.
                </p>
              </div>

              <div className="mt-4 pt-2.5 flex items-baseline justify-between bg-surface-container-low/70 px-3 py-2 rounded-lg">
                <span className="text-[11px] text-on-surface-variant font-semibold">Gama sugerida</span>
                <span className="font-display text-base text-on-surface font-extrabold">
                  {tierStartingPrices.pro ? `Desde ${formatCOP(tierStartingPrices.pro)}` : 'Máxima potencia'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
