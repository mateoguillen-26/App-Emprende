import React, { useState } from 'react';
import { BusinessData } from '../types';
import { PenTool } from 'lucide-react';

interface DiagnosisPhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
}

const INDUSTRIES = [
  'Alimentos y Bebidas',
  'Bienes Raíces',
  'Servicios Profesionales',
  'Tecnología y Software',
  'Comercio Minorista',
  'Educación',
];

const OTHER = 'Otros';

export const DiagnosisPhase: React.FC<DiagnosisPhaseProps> = ({ data, updateData, onNext }) => {
  // "Otros" is not stored in data.industry — the typed text is, so everything
  // downstream (prompts, PDF) keeps reading a single field.
  const [isCustom, setIsCustom] = useState(
    data.industry !== '' && !INDUSTRIES.includes(data.industry)
  );

  const handleSelect = (value: string) => {
    if (value === OTHER) {
      setIsCustom(true);
      updateData({ industry: '' });
    } else {
      setIsCustom(false);
      updateData({ industry: value });
    }
  };

  const isFormValid = data.businessName.length > 2;

  return (
    <div className="max-w-3xl mx-auto bg-card rounded-[28px] p-10 shadow-soft">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold text-navy-950 mb-3 tracking-tight uppercase">¡Empecemos!</h2>
        <p className="text-text-secondary">Cuéntanos de qué trata tu idea para entender tu visión.</p>
        <div className="w-12 h-1.5 bg-brand-500 rounded-full mx-auto mt-6 opacity-80"></div>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 ml-1">
            ¿Cómo se llama tu emprendimiento? Recuerda que en base al nombre se genera el logo!
          </label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            placeholder="Ej. Café del Valle, Soluciones Tech..."
            className="w-full p-5 bg-white border border-gray-200 rounded-[18px] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-navy-950 font-medium placeholder-gray-400 shadow-sm"
          />
        </div>

        <div>
           <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 ml-1">
            ¿En qué industria o sector operarás?
          </label>
          <select
            value={isCustom ? OTHER : data.industry}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full p-5 bg-white border border-gray-200 rounded-[18px] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-navy-950 font-medium shadow-sm appearance-none"
          >
            <option value="">Selecciona una industria...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
            <option value={OTHER}>Otros (escribir la mía)</option>
          </select>

          {isCustom && (
            <div className="mt-4 animate-fade-in">
              <div className="relative">
                <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                <input
                  type="text"
                  autoFocus
                  value={data.industry}
                  onChange={(e) => updateData({ industry: e.target.value })}
                  placeholder="Escribe tu industria. Ej. Turismo rural, Reciclaje..."
                  className="w-full p-5 pl-12 bg-white border border-brand-500/40 rounded-[18px] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-navy-950 font-medium placeholder-gray-400 shadow-sm"
                />
              </div>
              <p className="text-[10px] text-text-secondary mt-2 ml-1">
                Se usará para el análisis de mercado y el plan estratégico.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!isFormValid || !data.industry}
          className={`w-full py-5 rounded-[20px] font-bold text-white transition-all mt-8 shadow-lg text-sm uppercase tracking-wide
            ${isFormValid && data.industry
              ? 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20 hover:-translate-y-0.5' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}
        >
          Arrancar Estrategia
        </button>
      </div>
    </div>
  );
};
