import React from 'react';
import { BusinessData } from '../types';
import { Box, Target, PenTool } from 'lucide-react';

interface DiagnosisPhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
}

export const DiagnosisPhase: React.FC<DiagnosisPhaseProps> = ({ data, updateData, onNext }) => {
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
            ¿Cómo se llama tu emprendimiento?
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
            value={data.industry}
            onChange={(e) => updateData({ industry: e.target.value })}
            className="w-full p-5 bg-white border border-gray-200 rounded-[18px] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-navy-950 font-medium shadow-sm appearance-none"
          >
            <option value="">Selecciona una industria...</option>
            <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
            <option value="Bienes Raíces">Bienes Raíces</option>
            <option value="Servicios Profesionales">Servicios Profesionales</option>
            <option value="Tecnología y Software">Tecnología y Software</option>
            <option value="Comercio Minorista">Comercio Minorista</option>
            <option value="Educación">Educación</option>
            <option value="Otros">Otros</option>
          </select>
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