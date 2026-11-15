import React from 'react';
import { X, HelpCircle, MemoryStick, HardDrive, Cpu, DollarSign, Lightbulb } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Guía para no técnicos</h2>
              <p className="text-xs sm:text-sm text-brand-100">
                Todo lo que necesitas saber antes de comprar, explicado con manzanas y plastilina.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700">
          {/* 1. Memoria RAM */}
          <div className="flex gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-700 h-fit shrink-0">
              <MemoryStick className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                1. Memoria RAM: "El tamaño del escritorio"
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">
                Imagina tu escritorio de trabajo físico. Si tienes un escritorio pequeño (4GB), solo cabe un cuaderno. Si abres más cosas, se cae todo al suelo y te demoras. Con un escritorio amplio (8GB a 16GB), puedes tener abiertas 20 pestañas de internet, ver un video y tener un Excel sin que el portátil se ponga lento.
              </p>
              <div className="text-xs font-semibold text-blue-800 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                📌 Consejo: Busca mínimo <strong>8 GB</strong>. Si es para trabajar mucho tiempo, <strong>16 GB</strong> te durará varios años como nuevo.
              </div>
            </div>
          </div>

          {/* 2. Almacenamiento SSD */}
          <div className="flex gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 h-fit shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                2. Disco de Estado Sólido (SSD): "Adiós al relojito de espera"
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">
                Los portátiles viejos tenían discos "mecánicos" (HDD) que sonaban como ventiladores y tardaban 3 minutos en prender. Hoy en día es fundamental comprar un portátil con <strong>SSD</strong>: enciende en apenas 10 segundos y las fotos o archivos abren de inmediato.
              </p>
              <div className="text-xs font-semibold text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                📌 Consejo: Busca <strong>256 GB</strong> para lo básico o <strong>512 GB</strong> si guardas muchas fotos familiares y documentos de trabajo.
              </div>
            </div>
          </div>

          {/* 3. Procesador */}
          <div className="flex gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700 h-fit shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                3. Procesador: "El motor del automóvil"
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 mb-2">
                <li>
                  🚗 <strong>Core i3 / Ryzen 3:</strong> Como un carro de ciudad pequeño. Perfecto para tareas diarias, navegar por internet, ver YouTube y hacer cartas en Word.
                </li>
                <li>
                  🚙 <strong>Core i5 / Ryzen 5 / Apple M1-M2:</strong> Como una camioneta familiar moderna. Rápida, no se frena en subidas y responde súper bien en trabajo pesado.
                </li>
                <li>
                  🏎️ <strong>Core i7 / i9 / Ryzen 7 / M3 Pro:</strong> Como un auto de carreras. Para quienes editan videos profesionales en 4K, arquitectos o videojuegos pesados.
                </li>
              </ul>
            </div>
          </div>

          {/* 4. Precios orientativos en Colombia */}
          <div className="flex gap-4 p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-700 h-fit shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                4. ¿Cuánto deberías pagar en Colombia?
              </h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>• <strong>Menos de $1.500.000 COP:</strong> Equipos de entrada para colegio y tareas básicas.</li>
                <li>• <strong>Entre $1.500.000 y $2.500.000 COP:</strong> El punto dulce. Equipos excelentes con i5 o Ryzen 5 y 16GB de RAM.</li>
                <li>• <strong>Más de $2.500.000 COP:</strong> Portátiles gamer, ultrabooks premium tipo MacBook o laptops de diseño profesional.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-xs transition-colors"
          >
            ¡Entendido, vamos a buscar!
          </button>
        </div>
      </div>
    </div>
  );
};

