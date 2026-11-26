import React from 'react';
import {
  ExternalLink,
  Cpu,
  HardDrive,
  MemoryStick,
  Truck,
  BadgeCheck
} from 'lucide-react';
import { Laptop } from '../types/laptop';
import {
  formatCOP,
  getSafeLaptopImageUrl,
  handleLaptopImageError,
  getValidDiscount
} from '../utils/formatters';

interface ProductCardProps {
  laptop: Laptop;
  isSelectedForCompare: boolean;
  onToggleCompare: (laptop: Laptop) => void;
  canCompare: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  laptop,
  isSelectedForCompare,
  onToggleCompare,
  canCompare
}) => {
  const activePrice = laptop.precioCOP ?? laptop.price;
  const discount = getValidDiscount(activePrice, laptop.originalPrice);

  const tierPillClasses =
    laptop.tier.id === 'pro'
      ? 'bg-error-container text-tertiary'
      : laptop.tier.id === 'work'
        ? 'bg-primary-fixed text-primary'
        : 'bg-secondary-fixed text-on-secondary-fixed';

  return (
    <article
      className={`group bg-surface-container-lowest rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        isSelectedForCompare
          ? 'border-primary-container ring-2 ring-primary-container/25 shadow-lg'
          : 'border-outline-variant/40 shadow-sm hover:shadow-xl'
      }`}
    >
      <div>
        {/* Card Top Bar */}
        <div className="px-4 py-2.5 flex items-center justify-between bg-surface-container-low/50 border-b border-outline-variant/20">
          <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold ${tierPillClasses}`}>
            {laptop.tier.badgeText}
          </span>

          <label
            className={`flex items-center gap-1.5 select-none ${
              !isSelectedForCompare && !canCompare
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
            title={
              isSelectedForCompare
                ? 'Quitar de la comparación'
                : canCompare
                  ? 'Agregar a la comparación (hasta 3 equipos)'
                  : 'Máximo 3 equipos para comparar'
            }
          >
            <input
              type="checkbox"
              checked={isSelectedForCompare}
              disabled={!isSelectedForCompare && !canCompare}
              onChange={() => onToggleCompare(laptop)}
              className="w-4 h-4 rounded text-primary-container accent-primary-container focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
              {isSelectedForCompare ? 'Comparando' : 'Comparar'}
            </span>
          </label>
        </div>

        {/* Product Image Area */}
        <div className="relative w-full h-48 bg-surface-container-lowest flex items-center justify-center p-4 overflow-hidden">
          {discount.hasDiscount && discount.discountPercentage && (
            <span className="absolute top-2.5 left-2.5 z-10 text-xs bg-tertiary-container text-on-error px-2 py-0.5 rounded shadow-sm font-extrabold tracking-tight">
              -{discount.discountPercentage}% OFF
            </span>
          )}

          <img
            src={getSafeLaptopImageUrl(laptop.imagen || laptop.imageUrl)}
            alt={laptop.nombre || laptop.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleLaptopImageError}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Brand & Verified Official Store Badge */}
        <div className="px-4 pt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
            {laptop.brand}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-semibold bg-secondary-fixed/35 px-2 py-0.5 rounded-full">
            <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Tienda Oficial</span>
          </span>
        </div>

        {/* Laptop Title */}
        <div className="px-4 pt-1.5">
          <h3 className="font-display text-base font-semibold text-on-surface leading-snug line-clamp-2 group-hover:text-primary-container transition-colors">
            {laptop.nombre || laptop.title}
          </h3>
        </div>

        {/* 3 Compact Spec Rows */}
        <div className="px-3 py-2.5 space-y-1.5 my-3 bg-surface-container-low/60 mx-4 rounded-lg border border-outline-variant/20">
          <div className="flex items-center justify-between text-[13px] gap-2">
            <span className="text-on-surface-variant flex items-center gap-1.5 shrink-0">
              <MemoryStick className="w-4 h-4 text-primary" />
              <span>RAM:</span>
            </span>
            <span className="text-on-surface font-semibold text-right truncate">
              {laptop.ram.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-[13px] gap-2">
            <span className="text-on-surface-variant flex items-center gap-1.5 shrink-0">
              <HardDrive className="w-4 h-4 text-secondary" />
              <span>Almacenamiento:</span>
            </span>
            <span className="text-on-surface font-semibold text-right truncate">
              {laptop.storage.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-[13px] gap-2">
            <span className="text-on-surface-variant flex items-center gap-1.5 shrink-0">
              <Cpu className="w-4 h-4 text-outline" />
              <span>Procesador:</span>
            </span>
            <span
              className="text-on-surface font-semibold text-right truncate max-w-[175px]"
              title={laptop.processor.humanDescription}
            >
              {laptop.processor.raw}
            </span>
          </div>
        </div>

        {/* Free Shipping Pill */}
        {laptop.freeShipping && (
          <div className="px-4 pb-2 flex items-center gap-1.5 text-secondary text-[11px] font-bold">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Envío gratis Mercado Envíos a toda Colombia</span>
          </div>
        )}
      </div>

      {/* Pricing & CTA Footer */}
      <div className="p-4 pt-2 bg-surface-container-lowest flex flex-col gap-2 border-t border-outline-variant/15">
        <div className="space-y-0.5">
          {discount.hasDiscount && discount.originalPrice !== undefined && (
            <div className="text-xs text-outline line-through font-medium">
              {formatCOP(discount.originalPrice)} COP
            </div>
          )}

          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[26px] leading-tight font-bold text-on-surface tracking-tight">
              {formatCOP(activePrice)}{' '}
              <span className="text-xs font-semibold text-outline">COP</span>
            </div>
          </div>

          {laptop.seller && (
            <p className="text-[11px] text-on-surface-variant truncate">
              Vendido por <strong className="text-on-surface">{laptop.seller}</strong>
            </p>
          )}
        </div>

        <a
          href={laptop.affiliateUrl || laptop.permalink || laptop.enlace || laptop.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="w-full h-11 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow active:scale-[0.99] mt-1"
        >
          <span>Ver oferta en Mercado Libre</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
};
