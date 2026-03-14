import React, { useState, useEffect } from 'react';
import { AppStage, BusinessData } from './types';
import { StepWizard } from './components/StepWizard';
import { DiagnosisPhase } from './components/DiagnosisPhase';
import { AssetGeneratorPhase } from './components/AssetGeneratorPhase';
import { StructurePhase } from './components/StructurePhase';
import { MarketResearchPhase } from './components/MarketResearchPhase';
import { BreakEvenPhase } from './components/BreakEvenPhase';
import { PlanReviewPhase } from './components/PlanReviewPhase';
import { Moon, Sun } from 'lucide-react';

const initialData: BusinessData = {
  hasProduct: false,
  hasLogo: false,
  hasMarketTarget: false,
  businessName: '',
  industry: '',
  location: '',
  productIdeas: [],
  mission: '',
  vision: '',
  targetAudience: '',
  shortTermGoals: '',
  actionPlan: null, // Reset plan
  financials: {
    arriendo: 0,
    servicios: 0,
    salariosEmpleados: 0,
    salarioPropio: 0,
    otrosFijos: 0,
    materiaPrima: 0,
    transporte: 0,
    otrosVariables: 0,
    precioVenta: 0,
    unidadesVendidas: 0
  }
};

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    {/* Navy parts changed to white for dark background contrast or kept consistent based on needs. 
        Logo specs said Navy #163250. Since bg is #18324A, navy logo might be invisible. 
        Adjusting stroke to White for visibility on Navy BG as per 'High Contrast' requirement */}
    <path d="M50 85C69.33 85 85 69.33 85 50C85 43.5 83.2 37.5 80 32.2" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <path d="M20 32.2C16.8 37.5 15 43.5 15 50C15 69.33 30.67 85 50 85" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <path d="M80 67.8C83.2 62.5 85 56.5 85 50" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <path d="M50 15C43.5 15 37.5 16.8 32.2 20" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    
    <path d="M30 65C30 65 35 75 50 75C65 75 75 65 75 50C75 35 65 25 50 25C35 25 25 35 25 50" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    
    {/* Teal Arrow Graph - Kept brand color */}
    <path d="M15 75 L35 60 L50 75 L85 40" stroke="#1FA89B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M75 40 H85 V50" stroke="#1FA89B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M85 40 H75" stroke="#1FA89B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.DIAGNOSIS);
  const [data, setData] = useState<BusinessData>(initialData);
  const [darkMode, setDarkMode] = useState(false); // Kept state but UI is now predominantly dark SaaS style

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const updateData = (updates: Partial<BusinessData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetApp = () => {
    setData(initialData);
    setStage(AppStage.DIAGNOSIS);
  };

  const renderStage = () => {
    switch (stage) {
      case AppStage.DIAGNOSIS:
        return <DiagnosisPhase data={data} updateData={updateData} onNext={() => setStage(AppStage.ASSETS)} />;
      case AppStage.ASSETS:
        return <AssetGeneratorPhase data={data} updateData={updateData} onNext={() => setStage(AppStage.STRUCTURE)} onBack={() => setStage(AppStage.DIAGNOSIS)} />;
      case AppStage.STRUCTURE:
        return <StructurePhase data={data} updateData={updateData} onNext={() => setStage(AppStage.MARKET_RESEARCH)} onBack={() => setStage(AppStage.ASSETS)} />;
      case AppStage.MARKET_RESEARCH:
        return <MarketResearchPhase data={data} updateData={updateData} onNext={() => setStage(AppStage.REVIEW)} onBack={() => setStage(AppStage.STRUCTURE)} />;
      case AppStage.REVIEW:
        return <PlanReviewPhase data={data} updateData={updateData} onNext={() => setStage(AppStage.BREAK_EVEN)} onBack={() => setStage(AppStage.MARKET_RESEARCH)} onReset={resetApp} />;
      case AppStage.BREAK_EVEN:
        return <BreakEvenPhase data={data} updateData={updateData} onNext={resetApp} onBack={() => setStage(AppStage.REVIEW)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col font-sans text-text-main selection:bg-brand-500 selection:text-white">
      <header className="px-8 py-6 flex justify-between items-center print:hidden z-50">
        <div className="flex items-center gap-4">
          <Logo />
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            emprende<span className="text-brand-500">AI</span>
          </h1>
        </div>
        
        {/* Toggle functionality preserved, but styled to fit transparency */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-navy-800 text-gray-400 hover:text-white hover:bg-navy-950 transition-colors border border-navy-950/50"
          title={darkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="flex-1 px-4 py-4 max-w-7xl mx-auto w-full">
        <div className="print:hidden mb-12"><StepWizard currentStage={stage} /></div>
        {renderStage()}
      </main>

      <footer className="py-8 text-center text-gray-500 text-xs print:hidden">
        Powered by Gemini • Estrategia & Diseño
      </footer>
    </div>
  );
};

export default App;