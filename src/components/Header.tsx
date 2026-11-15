import React from 'react';
import { Laptop as LaptopIcon, Scale, HelpCircle, Sparkles } from 'lucide-react';
import { Laptop } from '../types/laptop';

interface HeaderProps {
  comparisonList: Laptop[];
  onOpenComparison: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  comparisonList,
  onOpenComparison,
  onOpenGuide
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <LaptopIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                TuPortátil<span className="text-brand-600">.co</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                🇨🇴 Colombia
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Comparador amigable de portátiles sin tecnicismos
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Guide Button for non-technical users */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="Aprende qué significa cada especificación en palabras sencillas"
          >
            <HelpCircle className="w-4 h-4 text-brand-600" />
            <span className="hidden md:inline">Guía sin tecnicismos</span>
            <span className="md:hidden">Guía</span>
          </button>

          {/* Compare Button */}
          <button
            onClick={onOpenComparison}
            disabled={comparisonList.length === 0}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs ${
              comparisonList.length > 0
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/25 ring-2 ring-brand-500/20 cursor-pointer animate-pulse'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Comparar</span>
            {comparisonList.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-white text-brand-700 rounded-full shadow-xs">
                {comparisonList.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

