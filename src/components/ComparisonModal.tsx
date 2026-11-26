import React from 'react';
import {
  X,
  Trophy,
  ExternalLink,
  MemoryStick,
  HardDrive,
  Cpu,
  BadgeCheck
} from 'lucide-react';
import { Laptop } from '../types/laptop';
import {
  formatCOP,
  getSafeLaptopImageUrl,
  handleLaptopImageError,
  getValidDiscount
} from '../utils/formatters';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  laptops: Laptop[];
  onRemoveItem: (id: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  laptops,
  onRemoveItem
}) => {
  if (!isOpen) return null;

  const lowestPrice =
    laptops.length > 0 ? Math.min(...laptops.map((l) => l.precioCOP ?? l.price)) : 0;
  const maxRam = laptops.length > 0 ? Math.max(...laptops.map((l) => l.ram.sizeGB)) : 0;
  const maxStorage = laptops.length > 0 ? Math.max(...laptops.map((l) => l.storage.sizeGB)) : 0;
  const maxProcessorScore =
    laptops.length > 0 ? Math.max(...laptops.map((l) => l.processor.tierScore)) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-5xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-outline-variant/40 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-primary text-on-primary flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-primary-container text-on-primary">
                <Trophy className="w-5 h-5" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold">
                Comparativa técnica frente a frente
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-primary-fixed mt-1">
              Compara especificación por especificación y descubre cuál ofrece mejor valor por tu dinero en COP.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar comparativa"
            className="p-2 rounded-lg text-on-primary/80 hover:text-on-primary hover:bg-primary-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-surface">
          {laptops.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <p className="font-display text-base font-semibold text-on-surface">
                No has seleccionado ningún portátil para comparar.
              </p>
              <p className="text-xs mt-1">
                Marca hasta 3 equipos con el selector &quot;Comparar&quot; en sus tarjetas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {laptops.map((laptop) => {
                const activePrice = laptop.precioCOP ?? laptop.price;
                const discount = getValidDiscount(activePrice, laptop.originalPrice);
                const isBestPrice = activePrice === lowestPrice;
                const isBestRam = laptop.ram.sizeGB === maxRam && maxRam > 8;
                const isBestStorage = laptop.storage.sizeGB === maxStorage;
                const isBestCpu =
                  laptop.processor.tierScore === maxProcessorScore && maxProcessorScore >= 4;

                const tierPillClasses =
                  laptop.tier.id === 'pro'
                    ? 'bg-error-container text-tertiary'
                    : laptop.tier.id === 'work'
                      ? 'bg-primary-fixed text-primary'
                      : 'bg-secondary-fixed text-on-secondary-fixed';

                return (
                  <div
                    key={laptop.id}
                    className="relative bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-4 flex flex-col justify-between shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => onRemoveItem(laptop.id)}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-surface-container-low text-outline hover:text-tertiary hover:bg-error-container transition-colors"
                      title="Quitar de la comparación"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="h-36 mb-3 flex items-center justify-center p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                        <img
                          src={getSafeLaptopImageUrl(laptop.imagen || laptop.imageUrl)}
                          alt={laptop.nombre || laptop.title}
                          referrerPolicy="no-referrer"
                          onError={handleLaptopImageError}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${tierPillClasses}`}>
                          {laptop.tier.badgeText}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-secondary font-semibold">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span>{laptop.brand}</span>
                        </span>
                      </div>

                      <h4 className="font-display text-sm font-bold text-on-surface line-clamp-2 mb-3">
                        {laptop.nombre || laptop.title}
                      </h4>

                      {/* Price Highlight */}
                      <div
                        className={`p-3 rounded-lg mb-4 border ${
                          isBestPrice
                            ? 'bg-secondary-fixed/35 border-secondary/40'
                            : 'bg-surface-container-low border-outline-variant/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] text-on-surface-variant font-semibold">
                            Precio actual
                          </span>
                          <div className="flex items-center gap-1">
                            {discount.hasDiscount && discount.discountPercentage && (
                              <span className="text-[10px] font-extrabold bg-tertiary-container text-on-error px-2 py-0.5 rounded">
                                -{discount.discountPercentage}% OFF
                              </span>
                            )}
                            {isBestPrice && (
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full">
                                Mejor precio
                              </span>
                            )}
                          </div>
                        </div>

                        {discount.hasDiscount && discount.originalPrice !== undefined && (
                          <div className="text-xs text-outline line-through font-medium mt-0.5">
                            {formatCOP(discount.originalPrice)} COP
                          </div>
                        )}
                        <div className="text-xl font-extrabold text-on-surface mt-0.5">
                          {formatCOP(activePrice)}{' '}
                          <span className="text-xs font-semibold text-outline">COP</span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="space-y-2.5 text-xs mb-5">
                        <div className="p-3 bg-surface-container-low/70 rounded-lg border border-outline-variant/25">
                          <div className="flex items-center justify-between font-bold text-on-surface mb-1">
                            <span className="flex items-center gap-1.5 text-on-surface-variant">
                              <MemoryStick className="w-3.5 h-3.5 text-primary" />
                              Memoria RAM
                            </span>
                            <span className={isBestRam ? 'text-primary font-extrabold' : ''}>
                              {laptop.ram.label} {isBestRam ? '👑' : ''}
                            </span>
                          </div>
                          <p className="text-on-surface-variant text-[11px]">{laptop.ram.explanation}</p>
                        </div>

                        <div className="p-3 bg-surface-container-low/70 rounded-lg border border-outline-variant/25">
                          <div className="flex items-center justify-between font-bold text-on-surface mb-1">
                            <span className="flex items-center gap-1.5 text-on-surface-variant">
                              <HardDrive className="w-3.5 h-3.5 text-secondary" />
                              Almacenamiento
                            </span>
                            <span className={isBestStorage ? 'text-secondary font-extrabold' : ''}>
                              {laptop.storage.label} {isBestStorage ? '👑' : ''}
                            </span>
                          </div>
                          <p className="text-on-surface-variant text-[11px]">
                            {laptop.storage.explanation}
                          </p>
                        </div>

                        <div className="p-3 bg-surface-container-low/70 rounded-lg border border-outline-variant/25">
                          <div className="flex items-center justify-between font-bold text-on-surface mb-1 gap-2">
                            <span className="flex items-center gap-1.5 text-on-surface-variant shrink-0">
                              <Cpu className="w-3.5 h-3.5 text-tertiary" />
                              Procesador
                            </span>
                            <span
                              className={`text-right truncate ${
                                isBestCpu ? 'text-tertiary font-extrabold' : ''
                              }`}
                            >
                              {laptop.processor.raw} {isBestCpu ? '🚀' : ''}
                            </span>
                          </div>
                          <p className="text-on-surface-variant text-[11px]">
                            {laptop.processor.humanDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Affiliate CTA */}
                    <div className="pt-1">
                      <a
                        href={laptop.affiliateUrl || laptop.permalink || laptop.enlace || laptop.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="w-full h-11 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>Ver oferta en Mercado Libre</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant shrink-0">
          <span>
            Precios verificados en Pesos Colombianos (COP) dentro de Mercado Libre Colombia.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-colors"
          >
            Cerrar comparador
          </button>
        </div>
      </div>
    </div>
  );
};
