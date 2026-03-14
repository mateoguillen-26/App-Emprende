import React, { useState } from 'react';
import { BusinessData } from '../types';
import { performMarketResearch } from '../services/geminiService';
import { MapPin, Search, Loader2, Globe, ExternalLink, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarketResearchPhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const MarketResearchPhase: React.FC<MarketResearchPhaseProps> = ({ data, updateData, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleResearch = async () => {
    if (!data.location) return;
    setLoading(true);
    const result = await performMarketResearch(data.location, data.industry);
    updateData({ 
      marketAnalysis: result.analysis, 
      marketSummary: result.summary,
      marketSources: result.sources 
    });
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card p-10 rounded-[28px] shadow-soft border border-white/50 text-center">
        <h2 className="text-2xl font-bold mb-3 text-navy-950 uppercase tracking-tight">Estudio de Zona</h2>
        <p className="text-text-secondary mb-8 max-w-lg mx-auto">Dime dónde quieres establecer el negocio y analizaremos la viabilidad y competencia.</p>
        
        <div className="max-w-lg mx-auto flex gap-3 p-2 bg-white rounded-[20px] shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-navy-950 font-medium placeholder-gray-400" 
              placeholder="Ej: Bogotá, Chapinero..." 
              value={data.location}
              onChange={e => updateData({ location: e.target.value })}
            />
          </div>
          <button 
            onClick={handleResearch} 
            disabled={loading || !data.location}
            className="bg-brand-500 text-white px-6 rounded-[16px] flex items-center gap-2 font-bold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20 text-sm uppercase tracking-wide"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            Analizar
          </button>
        </div>
      </div>

      {data.marketAnalysis && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Key Insights Cards */}
          {data.marketSummary && data.marketSummary.length > 0 && (
             <div className="grid md:grid-cols-2 gap-5">
               {data.marketSummary.map((point, i) => (
                 <div key={i} className="bg-card p-6 rounded-[24px] border-l-4 border-brand-500 shadow-soft flex items-start gap-4 hover:translate-x-1 transition-transform">
                    <div className="bg-brand-500/10 p-2 rounded-full text-brand-600 shrink-0">
                      <Lightbulb size={20} />
                    </div>
                    <p className="text-sm font-medium text-navy-950 leading-relaxed">{point}</p>
                 </div>
               ))}
             </div>
          )}

          {/* Detailed Analysis Accordion */}
          <div className="bg-card rounded-[28px] shadow-soft border border-white/50 overflow-hidden">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-8 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 text-navy-950">
                <div className="bg-navy-900 p-2.5 rounded-xl text-white"><Globe size={22} /></div>
                <h3 className="font-bold text-lg uppercase tracking-wide">Análisis Profundo</h3>
              </div>
              {showDetails ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
            </button>
            
            {showDetails && (
              <div className="px-10 pb-10 animate-slide-up">
                <div className="prose prose-sm max-w-none text-text-secondary border-t border-gray-100 pt-8">
                  <ReactMarkdown>{data.marketAnalysis}</ReactMarkdown>
                </div>
                
                {data.marketSources && data.marketSources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Fuentes Consultadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.marketSources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] bg-white border border-gray-200 hover:border-brand-300 px-3 py-1.5 rounded-full text-navy-950 font-medium transition-colors shadow-sm"
                        >
                          {source.title.slice(0, 30)}... <ExternalLink size={10} className="text-brand-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!showDetails && (
              <div className="px-10 pb-6">
                <p className="text-xs text-gray-400 italic">Haz clic para desplegar el reporte completo de competencia y oportunidades.</p>
              </div>
            )}
            <div className="w-16 h-1 bg-brand-500 rounded-full mx-auto mb-4 opacity-20"></div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors">
          &larr; Atrás
        </button>
        <button 
          onClick={onNext} 
          disabled={!data.marketAnalysis} 
          className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-[20px] font-bold disabled:opacity-50 transition-all shadow-lg shadow-brand-500/20 text-sm uppercase tracking-wide hover:-translate-y-0.5"
        >
          Ver Plan Maestro
        </button>
      </div>
    </div>
  );
};