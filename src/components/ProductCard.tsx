import React from 'react';
import { ExternalLink, Check, Scale, Cpu, HardDrive, MemoryStick, Truck, ShieldCheck, Heart } from 'lucide-react';
import { Laptop } from '../types/laptop';
import { formatCOP, getTierTheme, getSafeLaptopImageUrl, handleLaptopImageError, getValidDiscount } from '../utils/formatters';

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
  const theme = getTierTheme(laptop.tier.id);
  const activePrice = laptop.precioCOP ?? laptop.price;
  const discount = getValidDiscount(activePrice, laptop.originalPrice);

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
      isSelectedForCompare
        ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg'
        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xl'
    }`}>
      {/* Top Banner / Image Area */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden flex items-center justify-center p-4">
        {/* Suggested Tier Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${theme.badge}`}>
            {laptop.tier.badgeText}
          </span>
        </div>

        {/* Compare Checkbox Trigger */}
        <button
          onClick={() => onToggleCompare(laptop)}
          disabled={!isSelectedForCompare && !canCompare}
          className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-xs ${
            isSelectedForCompare
              ? 'bg-brand-600 text-white'
              : canCompare
              ? 'bg-white/90 text-slate-700 hover:bg-white hover:text-brand-600 border border-slate-200'
              : 'bg-white/50 text-slate-400 cursor-not-allowed'
          }`}
          title={
            isSelectedForCompare
              ? 'Quitar de la comparación'
              : canCompare
              ? 'Agregar a la comparación (hasta 3 equipos)'
              : 'Máximo 3 equipos para comparar'
          }
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isSelectedForCompare ? 'Comparando' : 'Comparar'}</span>
        </button>

        {/* Product Image */}
        <img
          src={getSafeLaptopImageUrl(laptop.imagen || laptop.imageUrl)}
          alt={laptop.nombre || laptop.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleLaptopImageError}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />

        {/* Condition or Discount Tag */}
        {discount.hasDiscount && discount.discountPercentage && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-rose-500 text-white shadow-xs">
              {discount.discountPercentage}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Seller */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-brand-700 uppercase tracking-wider">{laptop.brand}</span>
            <span className="truncate max-w-[150px]">{laptop.seller}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors mb-3">
            {laptop.title}
          </h3>

          {/* Plain Language Hardware Chips */}
          <div className="space-y-2 mb-5">
            {/* RAM Chip */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <MemoryStick className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">{laptop.ram.label}</div>
                <div className="text-slate-500 text-[11px] leading-tight">{laptop.ram.explanation}</div>
              </div>
            </div>

            {/* Storage Chip */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">{laptop.storage.label}</div>
                <div className="text-slate-500 text-[11px] leading-tight">{laptop.storage.explanation}</div>
              </div>
            </div>

            {/* Processor Chip */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-1 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">{laptop.processor.raw}</div>
                <div className="text-slate-500 text-[11px] leading-tight">{laptop.processor.humanDescription}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-slate-100">
          {/* Price display */}
          <div className="mb-4">
            {discount.hasDiscount && discount.originalPrice !== undefined && (
              <div className="text-xs text-slate-400 line-through font-medium">
                {formatCOP(discount.originalPrice)}
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCOP(activePrice)}
              </span>
              <span className="text-xs font-semibold text-slate-500">COP</span>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              <span>Envío gratis a toda Colombia</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Purchase CTA Link */}
            <a
              href={laptop.affiliateUrl || laptop.permalink || laptop.enlace || laptop.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-meli-yellow hover:bg-[#ebd300] text-slate-900 font-bold text-sm shadow-xs transition-colors group/btn"
            >
              <span>Ver oferta en Mercado Libre</span>
              <ExternalLink className="w-4 h-4 text-slate-700 group-hover/btn:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

