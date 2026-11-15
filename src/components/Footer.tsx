import React from 'react';
import { Laptop, Heart, Shield, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-white text-lg font-bold">TuPortátil.co</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              El buscador y comparador inteligente de computadores portátiles en Colombia diseñado para seres humanos, no para robots. Encuentra tu equipo ideal sin tecnicismos.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Transparencia y Afiliación</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Como afiliado de Mercado Libre, recibo comisiones por compras elegibles realizadas a través de los enlaces de este sitio. Esto no tiene ningún costo adicional para ti y ayuda a mantener este comparador gratuito.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Garantía y Seguridad</h4>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Todas las compras se completan dentro de la plataforma oficial y segura de Mercado Libre Colombia, con Compra Protegida y envíos a nivel nacional.
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TuPortátil.co — Hecho con cariño para Colombia 🇨🇴</p>
          <p className="text-[11px]">Mercado Libre es una marca registrada de MercadoLibre, Inc.</p>
        </div>
      </div>
    </footer>
  );
};

