import React from 'react';
import { X, HelpCircle, MemoryStick, HardDrive, Cpu, DollarSign } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-outline-variant/40 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-primary text-on-primary flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-container rounded-lg">
              <HelpCircle className="w-6 h-6 text-on-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold">
                Guía para no técnicos
              </h2>
              <p className="text-xs sm:text-sm text-primary-fixed">
                Todo lo que necesitas saber antes de comprar, explicado en lenguaje sencillo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía"
            className="p-2 rounded-lg text-on-primary/80 hover:text-on-primary hover:bg-primary-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 text-on-surface-variant bg-surface">
          {/* 1. Memoria RAM */}
          <div className="flex gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <div className="p-3 rounded-lg bg-primary-fixed text-primary h-fit shrink-0">
              <MemoryStick className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface mb-1">
                1. Memoria RAM: "El tamaño del escritorio"
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-2.5">
                Imagina tu escritorio de trabajo físico. Si tienes un escritorio pequeño (8 GB), trabajas cómodo en lo esencial. Si abres decenas de pestañas, videollamadas y Excel al mismo tiempo, un escritorio amplio (16 GB o más) evita que el portátil se vuelva lento.
              </p>
              <div className="text-xs font-semibold text-primary bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30">
                📌 Consejo: <strong>8 GB</strong> sirve para estudio básico; <strong>16 GB</strong> es el punto ideal para trabajar fluido varios años.
              </div>
            </div>
          </div>

          {/* 2. Almacenamiento SSD */}
          <div className="flex gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <div className="p-3 rounded-lg bg-secondary-fixed text-secondary h-fit shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface mb-1">
                2. Disco de Estado Sólido (SSD): "Adiós al relojito de espera"
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-2.5">
                Los portátiles antiguos tenían discos mecánicos (HDD) que tardaban minutos en iniciar. Todo equipo moderno recomendado aquí incluye almacenamiento <strong>SSD</strong>: enciende en segundos y abre tus archivos al instante.
              </p>
              <div className="text-xs font-semibold text-secondary bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30">
                📌 Consejo: <strong>256 GB</strong> alcanza para tareas diarias; <strong>512 GB</strong> o <strong>1 TB</strong> es ideal para fotos, videos y proyectos grandes.
              </div>
            </div>
          </div>

          {/* 3. Procesador */}
          <div className="flex gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <div className="p-3 rounded-lg bg-surface-container text-primary h-fit shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface mb-1.5">
                3. Procesador: "El motor del automóvil"
              </h3>
              <ul className="text-sm text-on-surface-variant space-y-2">
                <li>
                  🚗 <strong className="text-on-surface">Core i3 / Core 3 / Ryzen 3:</strong> Perfecto para colegio, universidad básica, Word, Excel, YouTube y videollamadas.
                </li>
                <li>
                  🚙 <strong className="text-on-surface">Core i5 / Ryzen 5 / Ryzen AI 5 / Apple M1-M2:</strong> Rápido y equilibrado para teletrabajo, programación y multitarea exigente.
                </li>
                <li>
                  🏎️ <strong className="text-on-surface">Core i7 / Ryzen 7 / Apple M3-M5 / RTX:</strong> Máxima potencia para videojuegos modernos, diseño 3D y edición profesional de video.
                </li>
              </ul>
            </div>
          </div>

          {/* 4. Precios orientativos en Colombia */}
          <div className="flex gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <div className="p-3 rounded-lg bg-error-container text-tertiary h-fit shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface mb-1.5">
                4. ¿Cuánto invertir en Colombia?
              </h3>
              <ul className="text-sm text-on-surface-variant space-y-1.5">
                <li>• <strong className="text-on-surface">Menos de $2.0M COP:</strong> Equipos confiables de entrada para estudio, navegación y oficina cotidiana.</li>
                <li>• <strong className="text-on-surface">$2.0M a $3.2M COP:</strong> El punto dulce de calidad/precio con 16 GB–24 GB de RAM y 512 GB SSD para multitarea rápida.</li>
                <li>• <strong className="text-on-surface">Más de $3.2M COP:</strong> Equipos gamer con gráfica RTX, ThinkPad empresariales o MacBook de alto desempeño.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-surface-container-low border-t border-outline-variant/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-bold text-xs transition-colors shadow-xs"
          >
            ¡Entendido, vamos a buscar!
          </button>
        </div>
      </div>
    </div>
  );
};
