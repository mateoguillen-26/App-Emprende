import React, { useState, useMemo } from 'react';
import { BusinessData, Financials, ProductLine, MAX_PRODUCTS, createProductLine } from '../types';
import { downloadBusinessReport } from '../services/reportService';
import {
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
  ChevronLeft,
  Plus,
  Trash2,
  FileDown,
  Loader2
} from 'lucide-react';

interface BreakEvenPhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type IdealOption = 'A' | 'B' | 'C';

const emptyFinancials = (): Financials => ({
  arriendo: 0,
  servicios: 0,
  salariosEmpleados: 0,
  salarioPropio: 0,
  otrosFijos: 0,
  productos: [createProductLine(1)],
});

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

/** Free text. Purely descriptive — never enters any calculation. */
const TextField = ({ label, value, onChange, placeholder, hint }: { label: string, value: string, onChange: (val: string) => void, placeholder?: string, hint?: string }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-navy-950/40 border border-navy-800/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all text-sm font-medium placeholder-gray-600"
    />
    {hint && <p className="text-[9px] text-gray-500 mt-1.5 ml-1 italic">{hint}</p>}
  </div>
);

export const BreakEvenPhase: React.FC<BreakEvenPhaseProps> = ({ data, updateData, onBack, onNext }) => {
  const [step, setStep] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const stored = data.financials || emptyFinancials();
  const formData: Financials = {
    ...stored,
    productos: stored.productos?.length ? stored.productos : [createProductLine(1)],
  };
  const productos = formData.productos;

  const [selectedOption, setSelectedOption] = useState<IdealOption>('A');
  const [desiredProfitPercent, setDesiredProfitPercent] = useState(20);
  const [desiredProfitMoney, setDesiredProfitMoney] = useState(1000);

  const saveFinancials = (next: Financials) => updateData({ financials: next });

  const handleFixedChange = (field: keyof Omit<Financials, 'productos'>, value: string) => {
    saveFinancials({ ...formData, [field]: parseFloat(value) || 0 });
  };

  const handleProductChange = (id: string, field: keyof ProductLine, value: string) => {
    const isNumeric = field !== 'nombre' && field !== 'materiasPrimasDesc' && field !== 'id';
    saveFinancials({
      ...formData,
      productos: productos.map((p) =>
        p.id === id ? { ...p, [field]: isNumeric ? (parseFloat(value) || 0) : value } : p
      ),
    });
  };

  const addProduct = () => {
    if (productos.length >= MAX_PRODUCTS) return;
    saveFinancials({ ...formData, productos: [...productos, createProductLine(productos.length + 1)] });
  };

  const removeProduct = (id: string) => {
    if (productos.length <= 1) return;
    saveFinancials({ ...formData, productos: productos.filter((p) => p.id !== id) });
  };

  // ─── Current situation ────────────────────────────────────────────────────────
  // Break-even across several products uses the weighted average contribution
  // margin: each product keeps its own price and variable cost, and the sales mix
  // decides how much each one weighs.
  const stats = useMemo(() => {
    const totalFixed =
      formData.arriendo + formData.servicios + formData.salariosEmpleados +
      formData.salarioPropio + formData.otrosFijos;

    const perProduct = productos.map((p) => {
      const varPerUnit = p.materiaPrima + p.transporte + p.otrosVariables;
      return {
        ...p,
        varPerUnit,
        marginPerUnit: p.precioVenta - varPerUnit,
        revenue: p.precioVenta * p.unidadesVendidas,
        variableCost: varPerUnit * p.unidadesVendidas,
      };
    });

    const totalUnits = perProduct.reduce((sum, p) => sum + p.unidadesVendidas, 0);
    const monthlyIncome = perProduct.reduce((sum, p) => sum + p.revenue, 0);
    const totalVariableCost = perProduct.reduce((sum, p) => sum + p.variableCost, 0);
    const totalMonthlyCost = totalFixed + totalVariableCost;
    const monthlyProfit = monthlyIncome - totalMonthlyCost;
    const profitPercent = monthlyIncome > 0 ? (monthlyProfit / monthlyIncome) * 100 : 0;

    // Weighted average contribution margin per unit across the current mix.
    const avgMargin = totalUnits > 0 ? (monthlyIncome - totalVariableCost) / totalUnits : 0;
    const canBreakEven = avgMargin > 0;
    const breakEvenUnits = canBreakEven ? totalFixed / avgMargin : 0;

    // Split the break-even volume back over the products, keeping the same mix.
    const breakEvenByProduct = perProduct.map((p) => ({
      ...p,
      breakEvenUnits: totalUnits > 0 ? breakEvenUnits * (p.unidadesVendidas / totalUnits) : 0,
    }));
    const breakEvenMoney = breakEvenByProduct.reduce(
      (sum, p) => sum + p.breakEvenUnits * p.precioVenta, 0
    );

    return {
      totalFixed, perProduct, breakEvenByProduct, totalUnits, monthlyIncome,
      totalVariableCost, totalMonthlyCost, monthlyProfit, profitPercent,
      avgMargin, canBreakEven, breakEvenUnits, breakEvenMoney,
    };
  }, [formData, productos]);

  // ─── Ideal scenario ───────────────────────────────────────────────────────────
  const idealStats = useMemo(() => {
    const { totalFixed, monthlyIncome, totalVariableCost, totalMonthlyCost, totalUnits, avgMargin } = stats;

    if (selectedOption === 'A') {
      // Raise every price by the same factor until the target margin is reached.
      // Solving (k·R − C)/(k·R) = p  gives  k = C / (R·(1−p)).
      const p = desiredProfitPercent / 100;
      const factor = 1 - p;
      const canSolve = factor > 0 && monthlyIncome > 0 && totalMonthlyCost > 0;
      const k = canSolve ? totalMonthlyCost / (monthlyIncome * factor) : 1;

      const income = monthlyIncome * k;
      const profit = income - totalMonthlyCost;
      return {
        mode: 'A' as const,
        priceFactor: k,
        prices: stats.perProduct.map((prod) => ({ nombre: prod.nombre, id: prod.id, precio: prod.precioVenta * k })),
        units: totalUnits,
        income,
        totalCost: totalMonthlyCost,
        profit,
        profitPercent: income > 0 ? (profit / income) * 100 : 0,
      };
    }

    if (selectedOption === 'B') {
      // Keep prices, grow volume keeping the same mix, until profit hits the goal.
      const targetUnits = avgMargin > 0 ? (totalFixed + desiredProfitMoney) / avgMargin : 0;
      const scale = totalUnits > 0 && targetUnits > 0 ? targetUnits / totalUnits : 0;

      const income = monthlyIncome * scale;
      const totalCost = totalFixed + totalVariableCost * scale;
      const profit = income - totalCost;
      return {
        mode: 'B' as const,
        unitScale: scale,
        unitsByProduct: stats.perProduct.map((prod) => ({
          nombre: prod.nombre, id: prod.id,
          actuales: prod.unidadesVendidas,
          objetivo: prod.unidadesVendidas * scale,
        })),
        units: targetUnits,
        income,
        totalCost,
        profit,
        profitPercent: income > 0 ? (profit / income) * 100 : 0,
      };
    }

    // Option C: trim the heaviest fixed cost by 20%.
    const fixedCosts = [
      { name: 'Arriendo', val: formData.arriendo },
      { name: 'Servicios', val: formData.servicios },
      { name: 'Salarios', val: formData.salariosEmpleados },
      { name: 'Tu Salario', val: formData.salarioPropio },
      { name: 'Otros Fijos', val: formData.otrosFijos },
    ];
    const highest = [...fixedCosts].sort((a, b) => b.val - a.val)[0];
    const newFixed = totalFixed - highest.val * 0.2;
    const totalCost = newFixed + totalVariableCost;
    const profit = monthlyIncome - totalCost;

    return {
      mode: 'C' as const,
      highestCost: highest,
      units: totalUnits,
      income: monthlyIncome,
      totalCost,
      profit,
      profitPercent: monthlyIncome > 0 ? (profit / monthlyIncome) * 100 : 0,
    };
  }, [formData, stats, selectedOption, desiredProfitPercent, desiredProfitMoney, productos]);

  const formatCurrency = (val: number) => {
    if (isNaN(val) || !isFinite(val)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const safeInt = (val: number) => (isNaN(val) || !isFinite(val) ? 0 : Math.ceil(val));

  const productLabel = (p: { nombre: string }, i: number) => p.nombre?.trim() || `Producto ${i + 1}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBusinessReport(data, { ...stats, financials: formData });
    } catch (e) {
      console.error('Error generando el informe:', e);
      alert('No se pudo generar el informe. Intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
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
          {/* Egresos fijos */}
          <div className="bg-card rounded-[32px] p-8 shadow-soft border border-white/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                <Calculator size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-950 uppercase tracking-tight">Egresos Fijos Mensuales</h3>
                <p className="text-xs text-text-secondary mt-0.5">No dependen de cuánto vendas. Son del negocio entero.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <InputField label="Arriendo" value={formData.arriendo} onChange={(v) => handleFixedChange('arriendo', v)} />
              <InputField label="Servicios Básicos" value={formData.servicios} onChange={(v) => handleFixedChange('servicios', v)} />
              <InputField label="Salarios Empleados" value={formData.salariosEmpleados} onChange={(v) => handleFixedChange('salariosEmpleados', v)} />
              <InputField label="Tu Salario" value={formData.salarioPropio} onChange={(v) => handleFixedChange('salarioPropio', v)} />
              <InputField label="Otros Egresos Fijos" value={formData.otrosFijos} onChange={(v) => handleFixedChange('otrosFijos', v)} />
            </div>
          </div>

          {/* Productos */}
          <div className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Tus Productos</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Cada producto tiene su propio precio, volumen y costos. Puedes añadir hasta {MAX_PRODUCTS}.
                </p>
              </div>
              <button
                onClick={addProduct}
                disabled={productos.length >= MAX_PRODUCTS}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-[18px] font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-glow disabled:bg-navy-800 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Añadir producto
              </button>
            </div>

            {productos.map((p, i) => (
              <div key={p.id} className="bg-card rounded-[32px] p-8 shadow-soft border border-white/50">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-black">
                      {i + 1}
                    </div>
                    <h4 className="text-lg font-bold text-navy-950 uppercase tracking-tight">
                      {productLabel(p, i)}
                    </h4>
                  </div>
                  {productos.length > 1 && (
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                      title="Quitar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <TextField
                    label="Nombre del producto"
                    value={p.nombre}
                    onChange={(v) => handleProductChange(p.id, 'nombre', v)}
                    placeholder="Ej. Hamburguesa clásica"
                  />
                  <TextField
                    label="¿Cuáles son sus materias primas?"
                    value={p.materiasPrimasDesc}
                    onChange={(v) => handleProductChange(p.id, 'materiasPrimasDesc', v)}
                    placeholder="Ej. Pan, carne, queso, vegetales, empaque"
                    hint="Solo descriptivo: aparecerá en el informe, no entra en los cálculos."
                  />
                </div>

                <div className="mt-2 pt-6 border-t border-gray-200/70">
                  <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-4">
                    Costos por unidad
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                    <InputField label="Materia Prima" value={p.materiaPrima} onChange={(v) => handleProductChange(p.id, 'materiaPrima', v)} />
                    <InputField label="Transporte" value={p.transporte} onChange={(v) => handleProductChange(p.id, 'transporte', v)} />
                    <InputField label="Otros Variables" value={p.otrosVariables} onChange={(v) => handleProductChange(p.id, 'otrosVariables', v)} />
                  </div>
                </div>

                <div className="mt-2 pt-6 border-t border-gray-200/70">
                  <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-4">
                    Ventas
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <InputField label="Precio de Venta" value={p.precioVenta} onChange={(v) => handleProductChange(p.id, 'precioVenta', v)} />
                    <InputField label="Unidades Vendidas / Mes" value={p.unidadesVendidas} onChange={(v) => handleProductChange(p.id, 'unidadesVendidas', v)} prefix="#" />
                  </div>
                </div>
              </div>
            ))}
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
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Egresos Totales</p>
              <p className="text-2xl font-black text-navy-950">{formatCurrency(stats.totalFixed)}</p>
            </div>
            <div className="bg-card p-6 rounded-[28px] border border-white/50 shadow-soft">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Costo Variable Total</p>
              <p className="text-2xl font-black text-navy-950">{formatCurrency(stats.totalVariableCost)}</p>
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
            <div className="bg-navy-800/30 rounded-[32px] p-10 border border-navy-800 flex flex-col items-center justify-center text-center">
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
              {stats.canBreakEven ? (
                <>
                  <p className="text-5xl font-black text-navy-950 mb-2">
                    {safeInt(stats.breakEvenUnits)} <span className="text-xl text-gray-400">unidades</span>
                  </p>
                  <p className="text-brand-600 font-bold">Equivale a {formatCurrency(stats.breakEvenMoney)} en ventas</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-orange-500 mb-2">Inalcanzable</p>
                  <p className="text-text-secondary text-sm">
                    Tus costos por unidad superan el precio de venta. Por mucho que vendas, cada unidad pierde dinero.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Desglose por producto */}
          {productos.length > 1 && stats.canBreakEven && (
            <div className="bg-card rounded-[32px] border border-white/50 shadow-soft overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <h4 className="font-black text-navy-950 uppercase tracking-tight">Desglose por producto</h4>
                <p className="text-xs text-text-secondary mt-1">
                  El equilibrio se reparte manteniendo tu mezcla de ventas actual.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[640px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Margen / unidad</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendes ahora</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equilibrio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.breakEvenByProduct.map((p, i) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-navy-950">{productLabel(p, i)}</td>
                        <td className={`px-6 py-4 font-black ${p.marginPerUnit >= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {formatCurrency(p.marginPerUnit)}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-500">{p.unidadesVendidas} uds</td>
                        <td className="px-6 py-4 font-black text-brand-600">{safeInt(p.breakEvenUnits)} uds</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className={`p-8 rounded-[32px] border flex items-center gap-6 ${stats.canBreakEven && stats.totalUnits >= stats.breakEvenUnits ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
            {stats.canBreakEven && stats.totalUnits >= stats.breakEvenUnits ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-1">
                {!stats.canBreakEven
                  ? 'Revisa tus precios'
                  : stats.totalUnits >= stats.breakEvenUnits
                    ? 'Tu negocio cubre sus costos'
                    : 'Aún no alcanzas el punto de equilibrio'}
              </h3>
              <p className="text-lg opacity-90">
                {!stats.canBreakEven
                  ? 'Ningún volumen de ventas compensa un margen negativo. Sube precios o baja el costo por unidad.'
                  : stats.totalUnits >= stats.breakEvenUnits
                    ? `Estás vendiendo ${(stats.totalUnits - stats.breakEvenUnits).toFixed(1)} unidades por encima del equilibrio.`
                    : `Te faltan ${safeInt(stats.breakEvenUnits - stats.totalUnits)} unidades por mes para no perder dinero.`}
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
              { id: 'A', title: 'Quiero ganar más', icon: TrendingUp, desc: 'Ajustar precios para mayor margen' },
              { id: 'B', title: 'Vender más unidades', icon: Package, desc: 'Mantener precios y subir volumen' },
              { id: 'C', title: 'Reducir costos', icon: PieChart, desc: 'Optimizar gastos operativos' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id as IdealOption)}
                className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col gap-4 group
                  ${selectedOption === opt.id ? 'bg-brand-500 border-brand-500 text-white shadow-glow' : 'bg-card border-white/50 text-navy-950 hover:border-brand-400'}`}
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
            {idealStats.mode === 'A' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tight mb-2">Estrategia de Margen</h3>
                  <p className="text-gray-500">¿Qué porcentaje de utilidad deseas obtener sobre tus ventas?</p>
                </div>
                <div className="max-w-md mx-auto">
                  <InputField label="Utilidad Deseada (%)" value={desiredProfitPercent} onChange={(v) => setDesiredProfitPercent(parseFloat(v) || 0)} prefix="%" />
                </div>
                <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20 space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nuevos precios sugeridos</p>
                  {idealStats.prices.map((pr, i) => (
                    <div key={pr.id} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-navy-950">{productLabel(pr, i)}</span>
                      <span className="text-xl font-black text-brand-600">{formatCurrency(pr.precio)}</span>
                    </div>
                  ))}
                  <div className="h-px bg-brand-500/10" />
                  <p className="text-xs text-gray-500 text-center italic">
                    Todos los precios suben un {((idealStats.priceFactor - 1) * 100).toFixed(1)}%, manteniendo tus unidades actuales.
                  </p>
                </div>
              </div>
            )}

            {idealStats.mode === 'B' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tight mb-2">Estrategia de Volumen</h3>
                  <p className="text-gray-500">¿Cuánto dinero libre quisieras ganar al mes?</p>
                </div>
                <div className="max-w-md mx-auto">
                  <InputField label="Meta de Ganancia Mensual ($)" value={desiredProfitMoney} onChange={(v) => setDesiredProfitMoney(parseFloat(v) || 0)} />
                </div>
                <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20 space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidades necesarias al mes</p>
                  {idealStats.unitsByProduct.map((u, i) => (
                    <div key={u.id} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-navy-950">{productLabel(u, i)}</span>
                      <span className="text-sm font-bold text-gray-500">
                        {u.actuales} <ArrowRight size={12} className="inline mx-1 text-brand-500" />
                        <span className="text-xl font-black text-brand-600">{safeInt(u.objetivo)}</span>
                      </span>
                    </div>
                  ))}
                  <div className="h-px bg-brand-500/10" />
                  <p className="text-sm text-navy-950 font-bold text-center">
                    En total, pasar de {stats.totalUnits} a <span className="text-brand-600">{safeInt(idealStats.units)}</span> unidades mensuales.
                  </p>
                </div>
              </div>
            )}

            {idealStats.mode === 'C' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-navy-950 uppercase tracking-tight mb-2">Análisis de Costos</h3>
                  <p className="text-gray-500">Optimizando tus gastos fijos para mejorar la rentabilidad.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Rubro de Mayor Peso</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-black text-navy-950">{idealStats.highestCost.name}</span>
                      <span className="text-2xl font-black text-brand-600">{formatCurrency(idealStats.highestCost.val)}</span>
                    </div>
                    <p className="text-sm text-gray-500">Este gasto representa el mayor impacto en tus costos fijos totales.</p>
                  </div>

                  <div className="bg-navy-900/5 p-8 rounded-[24px] border border-brand-500/20">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                      {stats.monthlyProfit < 0 ? 'Objetivo de Equilibrio' : 'Objetivo de Mejora'}
                    </h4>
                    <p className="text-sm text-navy-950 font-medium leading-relaxed">
                      {stats.monthlyProfit < 0 ? (
                        <>Para no perder dinero, reduce este gasto a: <span className="font-bold text-brand-600">{formatCurrency(Math.max(0, idealStats.highestCost.val + stats.monthlyProfit))}</span></>
                      ) : (
                        <>Reducir este gasto un 20% te daría <span className="font-bold text-brand-600">{formatCurrency(idealStats.highestCost.val * 0.2)}</span> extra al mes.</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[24px] border border-gray-100">
                  <table className="w-full text-left min-w-[520px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reducción del Rubro</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nueva Utilidad Mensual</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mejora vs Actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[0.1, 0.2, 0.3].map((red) => {
                        const newProfit = stats.monthlyProfit + (idealStats.highestCost.val * red);
                        return (
                          <tr key={red} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-navy-950">{red * 100}%</td>
                            <td className={`px-6 py-4 font-black ${newProfit >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>{formatCurrency(newProfit)}</td>
                            <td className="px-6 py-4 text-brand-600 font-bold">+{formatCurrency(idealStats.highestCost.val * red)}</td>
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
            <div className="bg-navy-900 p-8 text-white flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-2xl font-black uppercase tracking-tight">Comparativa de Escenarios</h3>
              <div className="bg-brand-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                {idealStats.mode === 'A' ? 'Estrategia de Precio' : idealStats.mode === 'B' ? 'Estrategia de Volumen' : 'Estrategia de Costos'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Indicador</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Situación Actual</th>
                    <th className="px-10 py-6 text-[10px] font-black text-brand-600 uppercase tracking-widest">Escenario Ideal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Unidades al mes', current: `${stats.totalUnits} uds`, ideal: `${safeInt(idealStats.units)} uds` },
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
                    {idealStats.mode === 'A' && `Para ganar un ${desiredProfitPercent}%, sube tus precios un ${((idealStats.priceFactor - 1) * 100).toFixed(1)}% manteniendo el mismo volumen de ventas.`}
                    {idealStats.mode === 'B' && `Para ganar ${formatCurrency(desiredProfitMoney)} al mes, necesitas pasar de ${stats.totalUnits} unidades a ${safeInt(idealStats.units)} unidades mensuales.`}
                    {idealStats.mode === 'C' && `Si reduces tu costo de ${idealStats.highestCost.name} en un 20%, pasarías de ${stats.monthlyProfit < 0 ? 'perder' : 'ganar'} ${formatCurrency(Math.abs(stats.monthlyProfit))} a ganar ${formatCurrency(idealStats.profit)} al mes.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Descarga del informe */}
          <div className="bg-card rounded-[32px] p-10 border border-white/50 shadow-soft text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-5">
              <FileDown size={30} />
            </div>
            <h3 className="text-xl font-black text-navy-950 uppercase tracking-tight mb-2">Tu informe completo</h3>
            <p className="text-text-secondary text-sm max-w-lg mx-auto mb-8">
              Un PDF con todo tu plan: identidad, misión y visión, estudio de mercado,
              el Business Model Canvas con tus anotaciones y el análisis financiero.
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-[20px] font-black shadow-glow transition-all inline-flex items-center gap-3 uppercase tracking-widest text-xs disabled:opacity-60"
            >
              {downloading ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
              {downloading ? 'Generando...' : 'Descargar informe PDF'}
            </button>
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
    </div>
  );
};
