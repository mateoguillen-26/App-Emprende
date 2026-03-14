import React, { useState } from 'react';
import { BusinessData } from '../types';
import { refineText } from '../services/geminiService';
import { Target, Eye, Rocket, Wand2, Loader2, Users } from 'lucide-react';

interface StructurePhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StructurePhase: React.FC<StructurePhaseProps> = ({ data, updateData, onNext, onBack }) => {
  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleRefine = async (field: 'mission' | 'vision' | 'goals') => {
    const currentText = field === 'mission' ? data.mission : field === 'vision' ? data.vision : data.shortTermGoals;
    if (!currentText || currentText.length < 5) return;

    setLoadingField(field);
    try {
      const refined = await refineText(currentText, field, data.industry);
      if (field === 'mission') updateData({ mission: refined });
      if (field === 'vision') updateData({ vision: refined });
      if (field === 'goals') updateData({ shortTermGoals: refined });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingField(null);
    }
  };

  const isFormValid = data.mission.length > 5 && data.targetAudience.length > 5;

  const CardHeader = ({ icon: Icon, title, onOptimize, loading }: any) => (
    <div className="flex justify-between items-center mb-4">
      <label className="font-bold text-navy-950 flex items-center gap-3 uppercase text-sm tracking-wide">
        <div className="bg-brand-500/10 p-1.5 rounded-lg text-brand-600"><Icon size={18} /></div>
        {title}
      </label>
      <button 
        onClick={onOptimize} 
        disabled={loading}
        className="text-[10px] font-bold text-brand-600 bg-white border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? <Loader2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
        MEJORAR
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-white mb-2 uppercase tracking-wide">Base Estratégica</h2>
        <p className="text-gray-400">Define el ADN de tu negocio. Perfecciona tu redacción.</p>
      </div>

      <div className="grid gap-8">
        {/* Misión */}
        <div className="bg-card p-8 rounded-[28px] shadow-soft relative overflow-hidden border border-white/50">
          <CardHeader 
            icon={Target} 
            title="Misión (¿Qué haces hoy?)" 
            onOptimize={() => handleRefine('mission')} 
            loading={loadingField === 'mission'} 
          />
          <textarea 
            className="w-full p-5 bg-white border border-gray-200 rounded-[18px] h-32 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-navy-950 transition-all text-sm leading-relaxed resize-none shadow-sm placeholder-gray-400" 
            placeholder="Ej: Ofrecemos hamburguesas con sabor casero a precios accesibles..." 
            value={data.mission} 
            onChange={e => updateData({ mission: e.target.value })} 
          />
          <div className="w-12 h-1 bg-brand-500 rounded-full mx-auto mt-6 opacity-30"></div>
        </div>

        {/* Visión */}
        <div className="bg-card p-8 rounded-[28px] shadow-soft relative overflow-hidden border border-white/50">
           <CardHeader 
            icon={Eye} 
            title="Visión (¿A dónde vas?)" 
            onOptimize={() => handleRefine('vision')} 
            loading={loadingField === 'vision'} 
          />
          <textarea 
            className="w-full p-5 bg-white border border-gray-200 rounded-[18px] h-32 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-navy-950 transition-all text-sm leading-relaxed resize-none shadow-sm placeholder-gray-400" 
            placeholder="Ej: Quiero ser la referencia de repuestos en toda la región..." 
            value={data.vision} 
            onChange={e => updateData({ vision: e.target.value })} 
          />
          <div className="w-12 h-1 bg-brand-500 rounded-full mx-auto mt-6 opacity-30"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Público Objetivo */}
          <div className="bg-card p-8 rounded-[28px] shadow-soft border border-white/50">
            <label className="font-bold text-navy-950 flex items-center gap-3 mb-5 uppercase text-sm tracking-wide">
               <div className="bg-brand-500/10 p-1.5 rounded-lg text-brand-600"><Users size={18} /></div> 
               {data.hasMarketTarget ? 'Tus Clientes (Definido)' : '¿A quién le vendes?'}
            </label>
            <textarea 
              className="w-full p-5 bg-white border border-gray-200 rounded-[18px] h-40 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-navy-950 transition-all text-sm leading-relaxed resize-none shadow-sm placeholder-gray-400" 
              placeholder="Describe a tu cliente ideal..."
              value={data.targetAudience} 
              onChange={e => updateData({ targetAudience: e.target.value })} 
            />
             <div className="w-12 h-1 bg-brand-500 rounded-full mx-auto mt-6 opacity-30"></div>
          </div>

          {/* Objetivos */}
          <div className="bg-card p-8 rounded-[28px] shadow-soft border border-white/50">
             <CardHeader 
              icon={Rocket} 
              title="Objetivos Corto Plazo" 
              onOptimize={() => handleRefine('goals')} 
              loading={loadingField === 'goals'} 
            />
            <textarea 
              className="w-full p-5 bg-white border border-gray-200 rounded-[18px] h-40 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-navy-950 transition-all text-sm leading-relaxed resize-none shadow-sm placeholder-gray-400" 
              placeholder="Metas claras y realistas..." 
              value={data.shortTermGoals} 
              onChange={e => updateData({ shortTermGoals: e.target.value })} 
            />
             <div className="w-12 h-1 bg-brand-500 rounded-full mx-auto mt-6 opacity-30"></div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors">
          &larr; Atrás
        </button>
        <button 
          onClick={onNext} 
          disabled={!isFormValid}
          className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-[20px] font-bold shadow-lg shadow-brand-500/20 transition-all disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none text-sm uppercase tracking-wide hover:-translate-y-0.5"
        >
          Investigar Mercado
        </button>
      </div>
    </div>
  );
};