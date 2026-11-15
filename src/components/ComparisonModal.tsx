import React from 'react';
import { X, Trophy, CheckCircle, ExternalLink, Zap, MemoryStick, HardDrive, Cpu, DollarSign } from 'lucide-react';
import { Laptop } from '../types/laptop';
import { formatCOP, getTierTheme, getSafeLaptopImageUrl, handleLaptopImageError, getValidDiscount } from '../utils/formatters';

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

  // Compute winners among selected items
  const lowestPrice = laptops.length > 0 ? Math.min(...laptops.map(l => l.precioCOP ?? l.price)) : 0;
  const maxRam = laptops.length > 0 ? Math.max(...laptops.map(l => l.ram.sizeGB)) : 0;
  const maxStorage = laptops.length > 0 ? Math.max(...laptops.map(l => l.storage.sizeGB)) : 0;
  const maxProcessorScore = laptops.length > 0 ? Math.max(...laptops.map(l => l.processor.tierScore)) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
                <Trophy className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold">Comparativa cara a cara</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Compara especificación por especificación y descubre cuál te da mayor valor por tu dinero.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {laptops.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-base font-semibold">No has seleccionado ningún portátil para comparar.</p>
              <p className="text-xs mt-1">Elige hasta 3 equipos haciendo clic en el botón "Comparar" de sus tarjetas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {laptops.map((laptop) => {
                const activePrice = laptop.precioCOP ?? laptop.price;
                const discount = getValidDiscount(activePrice, laptop.originalPrice);
                const isBestPrice = activePrice === lowestPrice;
                const isBestRam = laptop.ram.sizeGB === maxRam && maxRam > 8;
                const isBestStorage = laptop.storage.sizeGB === maxStorage;
                const isBestCpu = laptop.processor.tierScore === maxProcessorScore && maxProcessorScore >= 4;
                const theme = getTierTheme(laptop.tier.id);

                return (
                  <div
                    key={laptop.id}
                    className="relative bg-slate-50 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between"
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveItem(laptop.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-xs border border-slate-200 transition-colors"
                      title="Quitar de la comparación"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div>
                      {/* Image & Title */}
                      <div className="h-36 mb-3 flex items-center justify-center p-2 bg-white rounded-xl border border-slate-100">
                        <img
                          src={getSafeLaptopImageUrl(laptop.imagen || laptop.imageUrl)}
                          alt={laptop.nombre || laptop.title}
                          referrerPolicy="no-referrer"
                          onError={handleLaptopImageError}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${theme.badge}`}>
                          {laptop.tier.badgeText}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-3">
                        {laptop.title}
                      </h4>

                      {/* Price Section */}
                      <div className={`p-3 rounded-xl mb-4 ${isBestPrice ? 'bg-emerald-100/70 border border-emerald-300' : 'bg-white border border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Precio</span>
                          <div className="flex items-center gap-1.5">
                            {discount.hasDiscount && discount.discountPercentage && (
                              <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                                {discount.discountPercentage}% OFF
                              </span>
                            )}
                            {isBestPrice && (
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                                ⭐ Mejor precio
                              </span>
                            )}
                          </div>
                        </div>
                        {discount.hasDiscount && discount.originalPrice !== undefined && (
                          <div className="text-xs text-slate-400 line-through font-medium mt-0.5">
                            {formatCOP(discount.originalPrice)}
                          </div>
                        )}
                        <div className="text-xl font-black text-slate-900 mt-0.5">
                          {formatCOP(activePrice)}
                        </div>
                      </div>

                      {/* Comparison Attributes */}
                      <div className="space-y-3 text-xs mb-6">
                        {/* RAM */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                            <span className="flex items-center gap-1.5">
                              <MemoryStick className="w-3.5 h-3.5 text-blue-600" />
                              Memoria RAM
                            </span>
                            <span className={isBestRam ? 'text-blue-700 font-extrabold' : ''}>
                              {laptop.ram.label} {isBestRam ? '👑' : ''}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">{laptop.ram.explanation}</p>
                        </div>

                        {/* Storage */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                            <span className="flex items-center gap-1.5">
                              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                              Almacenamiento
                            </span>
                            <span className={isBestStorage ? 'text-emerald-700 font-extrabold' : ''}>
                              {laptop.storage.label} {isBestStorage ? '👑' : ''}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">{laptop.storage.explanation}</p>
                        </div>

                        {/* Processor */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                            <span className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-amber-600" />
                              Procesador
                            </span>
                            <span className={isBestCpu ? 'text-amber-700 font-extrabold' : ''}>
                              {laptop.processor.family} {isBestCpu ? '🚀' : ''}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">{laptop.processor.humanDescription}</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-2">
                      <a
                        href={laptop.affiliateUrl || laptop.permalink || laptop.enlace || laptop.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-meli-yellow hover:bg-[#ebd300] text-slate-900 font-bold text-xs shadow-xs transition-colors"
                      >
                        <span>Ver en Mercado Libre</span>
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>💡 Consejo: Para estudiar y teletrabajo normal, 8GB o 16GB de RAM con SSD de 512GB es la combinación ganadora.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

