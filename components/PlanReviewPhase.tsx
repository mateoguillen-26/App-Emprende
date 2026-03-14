import React, { useEffect, useState } from 'react';
import { BusinessData, BusinessCanvasData, CanvasSection } from '../types';
import { generateCanvasData } from '../services/geminiService';
import { 
  Loader2, RefreshCcw, X, 
  Handshake, Settings, Package, Heart, Users, 
  Box, Truck, BarChart3, Wallet, ArrowUpRight, ArrowRight
} from 'lucide-react';

interface PlanReviewPhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
}

export const PlanReviewPhase = ({ data, updateData, onNext, onBack, onReset }: PlanReviewPhaseProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{key: string, data: CanvasSection, color: string} | null>(null);

  useEffect(() => {
    if (!data.actionPlan) {
      const create = async () => {
        setLoading(true);
        try {
          const canvasJson = await generateCanvasData(data);
          updateData({ actionPlan: canvasJson });
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      create();
    }
  }, []);

  const plan = data.actionPlan as BusinessCanvasData | null;

  if (loading || !plan) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] animate-pulse">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-brand-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <Loader2 className="animate-spin text-brand-500 relative z-10" size={64} />
      </div>
      <h2 className="text-3xl font-black text-white tracking-tight uppercase">Generando Estrategia...</h2>
      <p className="text-gray-400 mt-3 text-center max-w-md font-medium">
        Diseñando los 9 bloques de tu modelo de negocio.
      </p>
    </div>
  );

  const CanvasCard = ({ 
    section, 
    icon: Icon, 
    className,
    accentColor = "text-brand-600",
  }: { 
    section: CanvasSection, 
    icon: any, 
    className?: string,
    accentColor?: string,
  }) => (
    <div 
      onClick={() => setSelectedSection({ key: section.title, data: section, color: accentColor })}
      className={`relative p-6 bg-card rounded-[24px] shadow-soft cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white flex flex-col group border border-transparent hover:border-brand-200 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 ${accentColor}`}>
           <Icon size={20} />
        </div>
        <h3 className="font-bold text-[11px] uppercase tracking-widest text-navy-950 opacity-80">{section.title}</h3>
      </div>
      
      {/* List */}
      <ul className="space-y-3 flex-1">
        {section.points.slice(0, 4).map((point, idx) => (
          <li key={idx} className="text-xs font-medium text-text-secondary flex items-start gap-3 leading-snug">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-gray-300 group-hover:bg-brand-400 transition-colors"></span>
            <span className="opacity-90">{point}</span>
          </li>
        ))}
      </ul>
      
      {/* Decorative Pill Bar */}
      <div className="mt-6 flex justify-center opacity-40 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-1 bg-brand-500 rounded-full"></div>
      </div>
    </div>
  );

  // Styling Groups
  const styles = {
    standard: { accentColor: "text-navy-800" },
    highlight: { accentColor: "text-brand-600" },
    finance: { accentColor: "text-gray-700" }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card p-6 rounded-[24px] shadow-soft border border-white/50">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tight">Business Model Canvas</h2>
             <span className="bg-brand-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-md shadow-brand-500/20">Estrategia Pro</span>
          </div>
          <p className="text-text-secondary text-sm">Estrategia oficial para <span className="font-bold text-navy-900">{data.businessName}</span></p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onReset} 
            className="px-5 py-2.5 rounded-[16px] flex items-center gap-2 text-xs font-bold text-navy-950 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors uppercase tracking-wide shadow-sm"
          >
            <RefreshCcw size={14} /> Reiniciar
          </button>
          <button 
            onClick={onNext} 
            className="px-6 py-2.5 rounded-[16px] flex items-center gap-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 transition-all uppercase tracking-wide shadow-glow"
          >
            Punto de Equilibrio <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* THE CANVAS GRID - Floating Cards Layout */}
      {/* Using gap-4 to create space between cards allowing navy bg to show through */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* === INFRASTRUCTURE (Left) === */}
        {/* Key Partners */}
        <CanvasCard 
          section={plan.keyPartners} 
          icon={Handshake} 
          className="md:col-span-1 md:row-span-2 min-h-[340px]"
          {...styles.standard}
        />

        {/* Column 2: Activities & Resources */}
        <div className="md:col-span-1 md:row-span-2 flex flex-col gap-4">
          <CanvasCard 
            section={plan.keyActivities} 
            icon={Settings} 
            className="flex-1"
            {...styles.standard}
          />
          <CanvasCard 
            section={plan.keyResources} 
            icon={Box} 
            className="flex-1"
            {...styles.standard}
          />
        </div>

        {/* === OFFER (Center) === */}
        {/* Value Propositions */}
        <CanvasCard 
          section={plan.valuePropositions} 
          icon={Package} 
          className="md:col-span-1 md:row-span-2 min-h-[340px] border-t-4 border-t-brand-500"
          {...styles.highlight}
        />

        {/* === CUSTOMERS (Right) === */}
        {/* Column 4: Relationships & Channels */}
        <div className="md:col-span-1 md:row-span-2 flex flex-col gap-4">
          <CanvasCard 
            section={plan.customerRelationships} 
            icon={Heart} 
            className="flex-1"
            {...styles.standard}
          />
          <CanvasCard 
            section={plan.channels} 
            icon={Truck} 
            className="flex-1"
            {...styles.standard}
          />
        </div>

        {/* Customer Segments */}
        <CanvasCard 
          section={plan.customerSegments} 
          icon={Users} 
          className="md:col-span-1 md:row-span-2 min-h-[340px]"
          {...styles.standard}
        />

        {/* === FINANCE (Bottom Row) === */}
        <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <CanvasCard 
              section={plan.costStructure} 
              icon={Wallet} 
              className="min-h-[180px]"
              {...styles.finance}
            />
            <CanvasCard 
              section={plan.revenueStreams} 
              icon={BarChart3} 
              className="min-h-[180px]"
              {...styles.finance}
            />
         </div>
      </div>
      
      {/* Brand Footer */}
      <div className="mt-12 text-center opacity-60">
         {data.logoUrl && (
             <img src={data.logoUrl} alt="Logo" className="h-12 object-contain mx-auto mb-4 invert" />
         )}
         <p className="text-[10px] text-gray-500 uppercase tracking-widest">Confidencial • Emprende</p>
      </div>

      {/* DETAIL MODAL - Restyled */}
      {selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card rounded-[32px] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slide-up border border-white/50">
            <div className="sticky top-0 bg-[#F2F4F7]/95 backdrop-blur border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h3 className="text-lg font-black uppercase tracking-widest text-navy-950">
                {selectedSection.key}
              </h3>
              <button 
                onClick={() => setSelectedSection(null)}
                className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="mb-8">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Resumen Ejecutivo</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSection.data.points.map((p, i) => (
                    <span key={i} className="bg-white text-navy-950 px-4 py-2 rounded-[14px] text-xs font-semibold border border-gray-100 shadow-sm">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Análisis Estratégico</h4>
                <div className="text-text-secondary leading-relaxed text-sm whitespace-pre-wrap bg-white p-8 rounded-[24px] border border-gray-100 shadow-inner">
                  {selectedSection.data.detail}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50/50 text-center">
               <button 
                onClick={() => setSelectedSection(null)}
                className="text-white font-bold text-xs uppercase tracking-wider bg-navy-900 px-8 py-3 rounded-[16px] shadow-lg shadow-navy-900/20 hover:bg-navy-800 transition-colors"
               >
                 Cerrar Panel
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};