import React from 'react';
import { AppStage } from '../types';
import { Check } from 'lucide-react';

interface StepWizardProps {
  currentStage: AppStage;
}

const steps = [
  { id: AppStage.DIAGNOSIS, label: "Diagnóstico" },
  { id: AppStage.ASSETS, label: "Identidad" },
  { id: AppStage.STRUCTURE, label: "Estructura" },
  { id: AppStage.MARKET_RESEARCH, label: "Mercado" },
  { id: AppStage.REVIEW, label: "Plan Maestro" },
  { id: AppStage.BREAK_EVEN, label: "Equilibrio" },
];

export const StepWizard: React.FC<StepWizardProps> = ({ currentStage }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between max-w-4xl mx-auto relative px-4">
        {/* Background Line */}
        <div className="absolute top-[18px] left-0 w-full h-[2px] bg-navy-800 -z-10 rounded-full"></div>
        {/* Progress Line */}
        <div 
            className="absolute top-[18px] left-0 h-[2px] bg-brand-500 -z-10 transition-all duration-700 rounded-full"
            style={{ width: `${(currentStage / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = currentStage > step.id;
          const isCurrent = currentStage === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`
                  w-9 h-9 flex items-center justify-center rounded-full transition-all duration-500 text-sm font-bold border-[3px]
                  ${isCompleted 
                    ? 'border-brand-500 bg-brand-500 text-white' 
                    : isCurrent 
                      ? 'border-brand-500 bg-navy-900 text-brand-500 box-shadow-glow' 
                      : 'border-navy-800 bg-navy-900 text-gray-600'}
                `}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : index + 1}
              </div>
              <span 
                className={`mt-3 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 
                ${isCurrent ? 'text-white' : 'text-gray-500'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};