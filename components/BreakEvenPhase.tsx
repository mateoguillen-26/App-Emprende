import React, { useState, useMemo } from 'react';
import { BusinessData } from '../types';
import { 
  ArrowLeft, 
  Calculator, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign, 
  Package, 
  PieChart, 
  Target,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface BreakEvenPhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface FinancialData {
  // Fixed Costs
  arriendo: number;
  servicios: number;
  salariosEmpleados: number;
  salarioPropio: number;
  otrosFijos: number;
  // Variable Costs
  materiaPrima: number;
  transporte: number;
  otrosVariables: number;
  // Sales Data
  precioVenta: number;
  unidadesVendidas: number;
}

type IdealOption = 'A' | 'B' | 'C';

const InputField = ({ label, value, onChange, prefix = "$", placeholder = "0.00" }: { label: string, value: number, onChange: (val: string) => void, prefix?: string, placeholder?: string }) => {
  const [localValue, setLocalValue] = React.useState(value === 0 ? '' : value.toString());

  React.useEffect(() => {
    const numValue = parseFloat(localValue) || 0;
    if (numValue !== value) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">{prefix}</span>
        <input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={() => {
            if (localValue === '') {
              setLocalValue('0');
              onChange('0');
            }
          }}
          className="w-full bg-navy-950/40 border border-navy-800/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all text-sm font-medium"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export const BreakEvenPhase: React.FC<BreakEvenPhaseProps> = ({ data, updateData, onBack, onNext }) => {
  const [step, setStep] = useState(1);
  const formData = data.financials || {
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
  };

  // Step 3 state
  const [selectedOption, setSelectedOption] = useState<IdealOption>('A');
  const [desiredProfitPercent, setDesiredProfitPercent] = useState(20);
  const [desiredProfitMoney, setDesiredProfitMoney] = useState(1000);

  const handleInputChange = (field: keyof FinancialData, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateData({
      financials: {
        ...formData,
        [field]: numValue
      }
    });
  };

  // Calculations for Step 2
  const stats = useMemo(() => {
    const totalFixed = formData.arriendo + formData.servicios + formData.salariosEmpleados + formData.salarioPropio + formData.otrosFijos;
    const totalVarPerUnit = formData.materiaPrima + formData.transporte + formData.otrosVariables;
    const totalMonthlyCost = totalFixed + (totalVarPerUnit * formData.unidadesVendidas);
    const monthlyIncome = formData.precioVenta * formData.unidadesVendidas;
    const monthlyProfit = monthlyIncome - totalMonthlyCost;
    const profitPercent = monthlyIncome > 0 ? (monthlyProfit / monthlyIncome) * 100 : 0;
    
    const marginPerUnit = formData.precioVenta - totalVarPerUnit;
    const breakEvenUnits = marginPerUnit > 0 ? totalFixed / marginPerUnit : 0;
    const breakEvenMoney = breakEvenUnits * formData.precioVenta;

    return {
      totalFixed,
      totalVarPerUnit,
      totalMonthlyCost,
      monthlyIncome,
      monthlyProfit,
      profitPercent,
      breakEvenUnits,
      breakEvenMoney,
      marginPerUnit
    };
  }, [formData]);

  // Calculations for Step 3 & 4
  const idealStats = useMemo(() => {
    let idealPrice = formData.precioVenta;
    let idealUnits = formData.unidadesVendidas;
    let idealIncome = 0;
    let idealTotalCost = 0;
    let idealProfit = 0;
    let idealProfitPercent = 0;

    if (selectedOption === 'A') {
      // Option A: Desired Profit %
      const targetProfitFactor = 1 - (desiredProfitPercent / 100);
      if (targetProfitFactor > 0 && formData.unidadesVendidas > 0) {
        idealPrice = stats.totalVarPerUnit + (stats.totalFixed / formData.unidadesVendidas) / targetProfitFactor;
      }
      idealUnits = formData.unidadesVendidas;
    } else if (selectedOption === 'B') {
      // Option B: Desired Profit Money
      if (stats.marginPerUnit > 0) {
        idealUnits = (stats.totalFixed + desiredProfitMoney) / stats.marginPerUnit;
      }
      idealPrice = formData.precioVenta;
    } else if (selectedOption === 'C') {
      // Option C: Reduce Costs (Scenario: 20% reduction in highest cost)
      const fixedCosts = [
        { name: 'Arriendo', val: formData.arriendo },
        { name: 'Servicios', val: formData.servicios },
        { name: 'Salarios', val: formData.salariosEmpleados },
        { name: 'Tu Salario', val: formData.salarioPropio },
        { name: 'Otros Fijos', val: formData.otrosFijos }
      ];
      const highest = [...fixedCosts].sort((a, b) => b.val - a.val)[0];
      
      // Let's assume the "Ideal" for the table is the 20% reduction scenario
      const reduction = 0.20;
      const newFixed = stats.totalFixed - (highest.val * reduction);
      
      idealPrice = formData.precioVenta;
      idealUnits = formData.unidadesVendidas;
      idealTotalCost = newFixed + (stats.totalVarPerUnit * idealUnits);
      idealIncome = idealPrice * idealUnits;
      idealProfit = idealIncome - idealTotalCost;
      idealProfitPercent = idealIncome > 0 ? (idealProfit / idealIncome) * 100 : 0;

      return {
        price: idealPrice,
        units: idealUnits,
        income: idealIncome,
        totalCost: idealTotalCost,
        profit: idealProfit,
        profitPercent: idealProfitPercent,
        highestCost: highest
      };
    }

    idealIncome = idealPrice * idealUnits;
    idealTotalCost = stats.totalFixed + (stats.totalVarPerUnit * idealUnits);
    idealProfit = idealIncome - idealTotalCost;
    idealProfitPercent = idealIncome > 0 ? (idealProfit / idealIncome) * 100 : 0;

    return {
      price: idealPrice,
      units: idealUnits,
      income: idealIncome,
      totalCost: idealTotalCost,
      profit: idealProfit,
      profitPercent: idealProfitPercent
    };
  }, [formData, stats, selectedOption, desiredProfitPercent, desiredProfitMoney]);

  const formatCurrency = (val: number) => {
    if (isNaN(val) || !isFinite(val)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-12">
      {[1, 2, 3, 4].map((s) => (
        <React.Fragment key={s}>
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 border-2
              ${step === s ? 'bg-brand-500 border-brand-500 text-white shadow-glow' : 
                step > s ? 'bg-navy-800 border-brand-500 text-brand-500' : 'bg-navy-900 border-navy-800 text-gray-600'}`}
          >
            {s}
          </div>
          {s < 4 && <div className={`w-12 h-0.5 rounded-full ${step > s ? 'bg-brand-500' : 'bg-navy-800'}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-32">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-black text-white mb-3 tracking-tight uppercase">Punto de Equilibrio</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-medium">Analiza la salud financiera de tu negocio y proyecta el camino hacia la rentabilidad máxima.</p>
      </div>

      <StepIndicator />

      {/* STEP 1: FORMULARIO */}
      {step === 1 && (
        <div className="space-y-8 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Costos Fijos */}
            <div className="bg-card rounded-[32px] p-8 shadow-soft border border-white/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <Calculator size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy-950 uppercase tracking-tight">Costos Fijos Mensuales</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <InputField label="Arriendo" value={formData.arriendo} onChange={(v) => handleInputChange('arriendo', v)} />
                <InputField label="Servicios Básicos" value={formData.servicios} onChange={(v) => handleInputChange('servicios', v)} />
                <InputField label="Salarios Empleados" value={formData.salariosEmpleados} onChange={(v) => handleInputChange('salariosEmpleados', v)} />
                <InputField label="Tu Salario" value={formData.salarioPropio} onChange={(v) => handleInputChange('salarioPropio', v)} />
                <InputField label="Otros Costos Fijos" value={formData.otrosFijos} onChange={(v) => handleInputChange('otrosFijos', v)} />
              </div>
            </div>

            {/* Costos Variables y Ventas */}
            <div className="space-y-8">
              <div className="bg-card rounded-[32px] p-8 shadow-soft border border-white/50">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <Package size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-navy-950 uppercase tracking-tight">Costos Variables (por unidad)</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <InputField label="Materia Prima" value={formData.materiaPrima} onChange={(v) => handleInputChange('materiaPrima', v)} />
                  <InputField label="Transporte" value={formData.transporte} onChange={(v) => handleInputChange('transporte', v)} />
                  <InputField label="Otros Variables" value={formData.otrosVariables} onChange={(v) => handleInputChange('otrosVariables', v)} />
                </div>
              </div>

              <div className="bg-card rounded-[32px] p-8 shadow-soft border border-white/50">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-navy-950 uppercase tracking-tight">Datos de Ventas</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Precio de Venta" value={formData.precioVenta} onChange={(v) => handleInputChange('precioVenta', v)} />
                  <InputField label="Unidades Vendidas / Mes" value={formData.unidadesVendidas} onChange={(v) => handleInputChange('unidadesVendidas', v)} prefix="#" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setStep(2)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-12 py-5 rounded-[24px] font-black shadow-glow transition-all flex items-center gap-3 uppercase tracking-widest text-sm hover:-translate-y-1"
            >
              Ver mi diagnóstico <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: RESULTADOS REALES */}
      {step === 2 && (
        <div className="space-y-8 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-[28px] border border-white/50 shadow-soft">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Costo Fijo Total</p>
              <p className="text-2xl font-black text-navy-950">{formatCurrency(stats.totalFixed)}</p>
            </div>
            <div className="bg-card p-6 rounded-[28px] border border-white/50 shadow-soft">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Costo Variable / Unidad</p>
              <p className="text-2xl font-black text-navy-950">{formatCurrency(stats.totalVarPerUnit)}</p>
            </div>
            <div className="bg-card p-6 rounded-[28px] border border-white/50 shadow-soft">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ingreso Mensual</p>
              <p className="text-2xl font-black text-navy-950">{formatCurrency(stats.monthlyIncome)}</p>
            </div>
            <div className="bg-card p-6 rounded-[28px] border border-white/50 shadow-soft">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Costo Total Mensual</p>
              <p className="text-2xl font-black text-navy-950">{formatCurrency(stats.totalMonthlyCost)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-navy-800/30 rounded-[32px] p-10 border border-navy-700 flex flex-col items-center justify-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${stats.monthlyProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                <DollarSign size={40} />
              </div>
              <h4 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Utilidad Mensual</h4>
              <p className={`text-5xl font-black mb-2 ${stats.monthlyProfit >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {formatCurrency(stats.monthlyProfit)}
              </p>
              <p className="text-gray-500 font-bold">{stats.profitPercent.toFixed(2)}% de margen</p>
            </div>

            <div className="bg-card rounded-[32px] p-10 border border-white/50 shadow-soft flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mb-6">
                <Target size={40} />
              </div>
              <h4 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Punto de Equilibrio</h4>
              <p className="text-5xl font-black text-navy-950 mb-2">
                {Math.ceil(stats.breakEvenUnits)} <span className="text-xl text-gray-400">unidades</span>
              </p>
              <p className="text-brand-600 font-bold">Equivale a {formatCurrency(stats.breakEvenMoney)} en ventas</p>
            </div>
          </div>

          <div className={`p-8 rounded-[32px] border flex items-center gap-6 ${formData.unidadesVendidas >= stats.breakEvenUnits ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
            {formData.unidadesVendidas >= stats.breakEvenUnits ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-1">
                {formData.unidadesVendidas >= stats.breakEvenUnits ? 'Tu negocio cubre sus costos' : 'Aún no alcanzas el punto de equilibrio'}
              </h3>
              <p className="text-lg opacity-90">
                {formData.unidadesVendidas >= stats.breakEvenUnits 
                  ? `Estás vendiendo ${(formData.unidadesVendidas - stats.breakEvenUnits).toFixed(1)} unidades por encima del equilibrio.`
                  : `Te faltan ${Math.ceil(stats.breakEvenUnits - formData.unidadesVendidas)} unidades por mes para no perder dinero.`}
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-8">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors">
              <ChevronLeft size={18} /> Ajustar Datos
            </button>
            <button 
              onClick={() => setStep(3)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-[20px] font-black shadow-glow transition-all flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              Definir Escenario Ideal <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ESCENARIO IDEAL */}
      {step === 3 && (
        <div className="space-y-8 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'A', title: 'Quiero ganar más', icon: TrendingUp, desc: 'Ajustar precio para mayor margen' },
              { id: 'B', title: 'Vender más unidades', icon: Package, desc: 'Mantener precio y subir volumen' },
              { id: 'C', title: 'Reducir costos', icon: PieChart, desc: 'Optimizar gastos operativos' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id as IdealOption)}
                className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col gap-4 group
                  ${selectedOption === opt.id ? 'bg-brand-500 border-brand-500 text-white shadow-glow' : 'bg-card border-white/50 text-navy-950 hover:border-brand-300'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                  ${selectedOption === opt.id ? 'bg-white/20 text-white' : 'bg-brand-500/10 text-brand-500 group-hover:bg-brand-500 group-hover:text-white'}`}>
                  <opt.icon size={24} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-tight text-lg">{opt.title}</h4>
                  <p className={`text-sm font-medium ${selectedOption === opt.id ? 'text-white/80' : 'text-gray-500'}`}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-card rounded-[32px] p-10 border border-white/50 shadow-soft">
            {selectedOption === 'A' && (
              <div className="max-w-md mx-auto space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tight mb-2">Estrategia de Margen</h3>
                  <p className="text-gray-500">¿Qué porcentaje de utilidad deseas obtener sobre tus ventas?</p>
                </div>
                <InputField label="Utilidad Deseada (%)" value={desiredProfitPercent} onChange={(v) => setDesiredProfitPercent(parseFloat(v) || 0)} prefix="%" />
                <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 uppercase">Nuevo Precio Sugerido</span>
                    <span className="text-2xl font-black text-brand-600">{formatCurrency(idealStats.price)}</span>
                  </div>
                  <div className="h-px bg-brand-500/10" />
                  <p className="text-xs text-gray-500 text-center italic">Calculado manteniendo tus unidades vendidas actuales.</p>
                </div>
              </div>
            )}

            {selectedOption === 'B' && (
              <div className="max-w-md mx-auto space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tight mb-2">Estrategia de Volumen</h3>
                  <p className="text-gray-500">¿Cuánto dinero libre quisieras ganar al mes?</p>
                </div>
                <InputField label="Meta de Ganancia Mensual ($)" value={desiredProfitMoney} onChange={(v) => setDesiredProfitMoney(parseFloat(v) || 0)} />
                <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 uppercase">Unidades Necesarias</span>
                    <span className="text-2xl font-black text-brand-600">{Math.ceil(idealStats.units)}</span>
                  </div>
                  <div className="h-px bg-brand-500/10" />
                  <p className="text-sm text-navy-950 font-bold text-center">
                    Necesitas vender <span className="text-brand-600">{Math.ceil(idealStats.units - formData.unidadesVendidas)}</span> unidades más al mes.
                  </p>
                </div>
              </div>
            )}

            {selectedOption === 'C' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tight mb-2">Análisis de Costos</h3>
                  <p className="text-gray-500">Optimizando tus gastos fijos para mejorar la rentabilidad.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Rubro de Mayor Peso</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-black text-navy-950">{(idealStats as any).highestCost.name}</span>
                      <span className="text-2xl font-black text-brand-600">{formatCurrency((idealStats as any).highestCost.val)}</span>
                    </div>
                    <p className="text-sm text-gray-500">Este gasto representa el mayor impacto en tus costos fijos totales.</p>
                  </div>

                  <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                      {stats.monthlyProfit < 0 ? 'Objetivo de Equilibrio' : 'Objetivo de Mejora'}
                    </h4>
                    <p className="text-sm text-navy-950 font-medium leading-relaxed">
                      {stats.monthlyProfit < 0 ? (
                        <>Para no perder dinero, reduce este gasto a: <span className="font-bold text-brand-600">{formatCurrency(Math.max(0, (idealStats as any).highestCost.val + stats.monthlyProfit))}</span></>
                      ) : (
                        <>Reducir este gasto un 20% te daría <span className="font-bold text-brand-600">{formatCurrency((idealStats as any).highestCost.val * 0.2)}</span> extra al mes.</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reducción del Rubro</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nueva Utilidad Mensual</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mejora vs Actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[0.1, 0.2, 0.3].map((red) => {
                        const newProfit = stats.monthlyProfit + ((idealStats as any).highestCost.val * red);
                        return (
                          <tr key={red} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-navy-950">{red * 100}%</td>
                            <td className={`px-6 py-4 font-black ${newProfit >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>{formatCurrency(newProfit)}</td>
                            <td className="px-6 py-4 text-brand-600 font-bold">+{formatCurrency((idealStats as any).highestCost.val * red)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-8">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors">
              <ChevronLeft size={18} /> Volver al Diagnóstico
            </button>
            <button 
              onClick={() => setStep(4)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-[20px] font-black shadow-glow transition-all flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              Ver Comparativa Final <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: COMPARATIVA FINAL */}
      {step === 4 && (
        <div className="space-y-8 animate-slide-up">
          <div className="bg-card rounded-[32px] overflow-hidden border border-white/50 shadow-soft">
            <div className="bg-navy-900 p-8 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tight">Comparativa de Escenarios</h3>
              <div className="bg-brand-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                {selectedOption === 'A' ? 'Estrategia de Precio' : selectedOption === 'B' ? 'Estrategia de Volumen' : 'Estrategia de Costos'}
              </div>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Indicador</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Situación Actual</th>
                    <th className="px-10 py-6 text-[10px] font-black text-brand-600 uppercase tracking-widest">Escenario Ideal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Precio de venta', current: formatCurrency(formData.precioVenta), ideal: formatCurrency(idealStats.price) },
                    { label: 'Unidades al mes', current: `${formData.unidadesVendidas} uds`, ideal: `${Math.ceil(idealStats.units)} uds` },
                    { label: 'Ingreso mensual', current: formatCurrency(stats.monthlyIncome), ideal: formatCurrency(idealStats.income) },
                    { label: 'Costos totales', current: formatCurrency(stats.totalMonthlyCost), ideal: formatCurrency(idealStats.totalCost) },
                    { label: 'Utilidad ($)', current: formatCurrency(stats.monthlyProfit), ideal: formatCurrency(idealStats.profit), highlight: true },
                    { label: 'Utilidad (%)', current: `${stats.profitPercent.toFixed(1)}%`, ideal: `${idealStats.profitPercent.toFixed(1)}%`, highlight: true },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-6 font-bold text-gray-500 text-sm">{row.label}</td>
                      <td className="px-10 py-6 font-bold text-navy-950">{row.current}</td>
                      <td className={`px-10 py-6 font-black ${row.highlight ? 'text-brand-600 text-lg' : 'text-navy-950'}`}>{row.ideal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-brand-500/5 p-10 border-t border-brand-500/10">
              <div className="flex items-start gap-6">
                <div className="bg-brand-500 p-3 rounded-2xl text-white shadow-lg shadow-brand-500/30">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest mb-2">Plan de Acción Sugerido</h4>
                  <p className="text-xl font-bold text-navy-950 leading-tight">
                    {selectedOption === 'A' && `Para ganar un ${desiredProfitPercent}%, deberías vender tu producto a ${formatCurrency(idealStats.price)} en lugar de ${formatCurrency(formData.precioVenta)} actual.`}
                    {selectedOption === 'B' && `Para ganar ${formatCurrency(desiredProfitMoney)} al mes, necesitas pasar de ${formData.unidadesVendidas} unidades a ${Math.ceil(idealStats.units)} unidades mensuales.`}
                    {selectedOption === 'C' && `Si reduces tu costo de ${(idealStats as any).highestCost.name} en un 20%, pasarías de ${stats.monthlyProfit < 0 ? 'perder' : 'ganar'} ${formatCurrency(Math.abs(stats.monthlyProfit))} a ganar ${formatCurrency(idealStats.profit)} al mes.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-8">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors">
              <ChevronLeft size={18} /> Cambiar Estrategia
            </button>
            <button 
              onClick={onNext}
              className="bg-navy-900 hover:bg-navy-800 text-white px-12 py-5 rounded-[24px] font-black shadow-xl transition-all flex items-center gap-3 uppercase tracking-widest text-sm"
            >
              Finalizar Plan de Negocio <CheckCircle2 size={20} />
            </button>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN FIJA (Solo para pasos intermedios si es necesario, pero el diseño anterior la tenía) */}
      {/* He integrado la navegación dentro de cada paso para mayor fluidez visual con el nuevo diseño de tarjetas */}
    </div>
  );
};

