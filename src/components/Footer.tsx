import React from 'react';
import { Laptop, BadgeCheck, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/30 mt-auto">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        {/* Trust Top Banner inside Footer */}
        <div className="p-4 mb-8 bg-surface-container-lowest rounded-xl border border-outline-variant/40 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-secondary">
            <BadgeCheck className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold text-on-surface">
              Precios verificados en Tiendas Oficiales de Mercado Libre Colombia
            </span>
          </div>
          <span className="text-[11px] font-semibold text-on-surface-variant">
            Compra Protegida y envíos nacionales vía Mercado Envíos
          </span>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <Laptop className="w-4 h-4" />
              </div>
              <span className="font-display text-lg font-bold text-primary">
                ComparaTech <span className="text-secondary">CO</span>
              </span>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              Comparador independiente de especificaciones y precios reales de computadores portátiles en Colombia, explicado en lenguaje sencillo para ayudarte a elegir sin enredos.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-display text-base font-semibold text-on-surface">
              Transparencia y Afiliación
            </h4>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              Como afiliado de Mercado Libre, recibo comisiones por compras elegibles realizadas a través de los enlaces de este sitio. Esto no tiene ningún costo adicional para ti y ayuda a mantener este comparador gratuito.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-display text-base font-semibold text-on-surface">
              Garantía y Seguridad
            </h4>
            <div className="flex items-start gap-2.5 text-[13px] text-on-surface-variant leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <span>
                Todas las compras se completan directamente en la plataforma oficial de Mercado Libre Colombia con respaldo de Tienda Oficial y garantía en el país.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-5 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-on-surface-variant">
          <p>
            Sitio independiente de comparación. Las marcas y nombres comerciales pertenecen a sus respectivos titulares.
          </p>
          <p>© {new Date().getFullYear()} ComparaTech Colombia. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
