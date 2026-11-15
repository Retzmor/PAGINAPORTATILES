import React from 'react';
import { BookOpen, Briefcase, Gamepad2, ShieldCheck, Truck, Sparkles, Search } from 'lucide-react';
import { UsageTierId } from '../types/laptop';

interface HeroProps {
  selectedTier: UsageTierId | 'all';
  onSelectTier: (tier: UsageTierId | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  selectedTier,
  onSelectTier,
  searchQuery,
  onSearchChange
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 pt-10 pb-12 sm:pt-16 sm:pb-16 border-b border-slate-200/60">
      {/* Background soft glow decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40">
        <div className="absolute -top-24 left-1/4 w-80 h-80 bg-brand-300 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-amber-200 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-100/90 text-brand-800 border border-brand-200 shadow-xs mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>El recomendador pensado para tu mamá, tus hijos y para ti</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-5">
          Encuentra el portátil ideal en Colombia{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
            al mejor precio y sin tecnicismos
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
          ¿Cansado de códigos raros como <code className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800 text-sm font-mono">i5-1235U</code> o <code className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800 text-sm font-mono">DDR4</code>? Te ayudamos a elegir según lo que realmente vas a hacer: estudiar, trabajar o diseñar.
        </p>

        {/* Search Input Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center shadow-lg shadow-slate-200/50 rounded-2xl bg-white border border-slate-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 transition-all">
            <div className="pl-4.5 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Busca por marca (Lenovo, HP, Apple) o modelo..."
              className="w-full py-3.5 px-3 text-slate-800 placeholder-slate-400 text-sm sm:text-base bg-transparent border-none focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="pr-4 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Usage Profile Quick Cards */}
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
            Selecciona el uso principal que le darás al portátil:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
            {/* Basic Card */}
            <button
              onClick={() => onSelectTier(selectedTier === 'basic' ? 'all' : 'basic')}
              className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                selectedTier === 'basic'
                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-md'
                  : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">📚 Para Estudiar</h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Tareas escolares, Word, Excel, Zoom y ver películas sin gastar de más.
                </p>
              </div>
            </button>

            {/* Work Card */}
            <button
              onClick={() => onSelectTier(selectedTier === 'work' ? 'all' : 'work')}
              className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                selectedTier === 'work'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-md'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">💼 Para Oficina y Teletrabajo</h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Rápido, multitarea, videollamadas fluidas y decenas de pestañas abiertas.
                </p>
              </div>
            </button>

            {/* Pro Card */}
            <button
              onClick={() => onSelectTier(selectedTier === 'pro' ? 'all' : 'pro')}
              className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                selectedTier === 'pro'
                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-md'
                  : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">🎮 Para Diseño o Juegos</h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Potencia bruta para Photoshop, edición de video 4K, arquitectura o gaming.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Confidence Badges */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Envíos a Bogotá, Medellín, Cali y todo el país</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Compra protegida y tiendas oficiales de Mercado Libre</span>
          </div>
        </div>
      </div>
    </section>
  );
};

