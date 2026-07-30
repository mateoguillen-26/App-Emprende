import { jsPDF } from 'jspdf';
import { BusinessData, Financials, ProductLine, BusinessCanvasData, CanvasSectionKey } from '../types';

interface ProductStats extends ProductLine {
  varPerUnit: number;
  marginPerUnit: number;
  revenue: number;
  variableCost: number;
}

export interface ReportFinancials {
  financials: Financials;
  totalFixed: number;
  perProduct: ProductStats[];
  breakEvenByProduct: (ProductStats & { breakEvenUnits: number })[];
  totalUnits: number;
  monthlyIncome: number;
  totalVariableCost: number;
  totalMonthlyCost: number;
  monthlyProfit: number;
  profitPercent: number;
  avgMargin: number;
  canBreakEven: boolean;
  breakEvenUnits: number;
  breakEvenMoney: number;
}

const NAVY: [number, number, number] = [24, 50, 74];
const BRAND: [number, number, number] = [31, 168, 155];
const GREY: [number, number, number] = [107, 114, 128];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

const money = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

/** The market analysis comes back as Markdown; the PDF renders plain text. */
const stripMarkdown = (text: string) =>
  text
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/`/g, '')
    .trim();

const CANVAS_ORDER: CanvasSectionKey[] = [
  'keyPartners', 'keyActivities', 'keyResources', 'valuePropositions',
  'customerRelationships', 'channels', 'customerSegments',
  'costStructure', 'revenueStreams',
];

export const downloadBusinessReport = async (data: BusinessData, fin: ReportFinancials) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const ensure = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const sectionTitle = (text: string) => {
    ensure(18);
    y += 4;
    doc.setFillColor(...BRAND);
    doc.rect(MARGIN, y - 3.5, 2.5, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(text.toUpperCase(), MARGIN + 6, y + 1.5);
    y += 10;
  };

  const label = (text: string) => {
    ensure(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND);
    doc.text(text.toUpperCase(), MARGIN, y);
    y += 5;
  };

  const paragraph = (text: string, size = 10) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    lines.forEach((line) => {
      ensure(6);
      doc.text(line, MARGIN, y);
      y += size * 0.52;
    });
    y += 3;
  };

  const bullets = (items: string[]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, CONTENT_W - 5) as string[];
      lines.forEach((line, i) => {
        ensure(6);
        if (i === 0) {
          doc.setFillColor(...BRAND);
          doc.circle(MARGIN + 1.2, y - 1.2, 0.8, 'F');
        }
        doc.text(line, MARGIN + 5, y);
        y += 5.2;
      });
    });
    y += 2;
  };

  const row = (left: string, right: string, bold = false) => {
    ensure(7);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(bold ? NAVY[0] : 60, bold ? NAVY[1] : 60, bold ? NAVY[2] : 60);
    doc.text(left, MARGIN, y);
    doc.text(right, PAGE_W - MARGIN, y, { align: 'right' });
    y += 5.5;
  };

  const divider = () => {
    ensure(6);
    doc.setDrawColor(225, 228, 232);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5;
  };

  // ─── Cover ───────────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 62, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  const title = doc.splitTextToSize(data.businessName || 'Mi Emprendimiento', CONTENT_W - 40) as string[];
  doc.text(title, MARGIN, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(190, 200, 210);
  const meta = [data.industry, data.location].filter(Boolean).join('  •  ');
  doc.text(meta || 'Plan de negocio', MARGIN, 26 + title.length * 9);

  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND);
  doc.text('PLAN DE NEGOCIO GENERADO CON EMPRENDEAI', MARGIN, 52);

  if (data.logoUrl?.startsWith('data:image/')) {
    try {
      doc.addImage(data.logoUrl, 'PNG', PAGE_W - MARGIN - 30, 14, 30, 30, undefined, 'FAST');
    } catch {
      // A malformed logo must never block the whole report.
    }
  }

  y = 76;

  // ─── Estrategia ──────────────────────────────────────────────────────────────
  if (data.mission || data.vision || data.targetAudience || data.shortTermGoals) {
    sectionTitle('Base estrategica');
    if (data.mission) { label('Mision'); paragraph(data.mission); }
    if (data.vision) { label('Vision'); paragraph(data.vision); }
    if (data.targetAudience) { label('Publico objetivo'); paragraph(data.targetAudience); }
    if (data.shortTermGoals) { label('Objetivos a corto plazo'); paragraph(data.shortTermGoals); }
  }

  // ─── Mercado ─────────────────────────────────────────────────────────────────
  if (data.marketAnalysis || data.marketSummary?.length) {
    sectionTitle(`Estudio de mercado${data.location ? ` - ${data.location}` : ''}`);
    if (data.marketSummary?.length) {
      label('Puntos clave');
      bullets(data.marketSummary);
    }
    if (data.marketAnalysis) {
      label('Analisis detallado');
      paragraph(stripMarkdown(data.marketAnalysis), 9.5);
    }
    if (data.marketSources?.length) {
      label('Fuentes consultadas');
      bullets(data.marketSources.slice(0, 10).map((s) => `${s.title} - ${s.uri}`));
    }
  }

  // ─── Canvas ──────────────────────────────────────────────────────────────────
  const plan = data.actionPlan as BusinessCanvasData | null;
  if (plan) {
    doc.addPage();
    y = MARGIN;
    sectionTitle('Business Model Canvas');

    CANVAS_ORDER.forEach((key) => {
      const section = plan[key];
      if (!section) return;

      ensure(26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...NAVY);
      doc.text(section.title || key, MARGIN, y);
      y += 6;

      if (section.points?.length) bullets(section.points);
      if (section.detail) paragraph(section.detail, 9);

      const note = data.canvasNotes?.[key]?.trim();
      if (note) {
        ensure(14);
        doc.setFillColor(240, 250, 249);
        const noteLines = doc.splitTextToSize(note, CONTENT_W - 10) as string[];
        const boxH = noteLines.length * 4.6 + 10;
        ensure(boxH);
        doc.roundedRect(MARGIN, y - 3, CONTENT_W, boxH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...BRAND);
        doc.text('LO MIO', MARGIN + 5, y + 2.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        let ny = y + 8;
        noteLines.forEach((line) => {
          doc.text(line, MARGIN + 5, ny);
          ny += 4.6;
        });
        y += boxH + 2;
      }

      divider();
    });
  }

  // ─── Finanzas ────────────────────────────────────────────────────────────────
  doc.addPage();
  y = MARGIN;
  sectionTitle('Analisis financiero');

  const f = fin.financials;
  label('Egresos fijos mensuales');
  row('Arriendo', money(f.arriendo));
  row('Servicios basicos', money(f.servicios));
  row('Salarios empleados', money(f.salariosEmpleados));
  row('Tu salario', money(f.salarioPropio));
  row('Otros egresos fijos', money(f.otrosFijos));
  divider();
  row('Egresos totales', money(fin.totalFixed), true);
  y += 4;

  label('Productos');
  fin.perProduct.forEach((p, i) => {
    ensure(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(p.nombre?.trim() || `Producto ${i + 1}`, MARGIN, y);
    y += 5.5;

    if (p.materiasPrimasDesc?.trim()) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...GREY);
      const mp = doc.splitTextToSize(`Materias primas: ${p.materiasPrimasDesc}`, CONTENT_W) as string[];
      mp.forEach((line) => {
        ensure(5);
        doc.text(line, MARGIN, y);
        y += 4.4;
      });
      y += 1.5;
    }

    row('Materia prima / unidad', money(p.materiaPrima));
    row('Transporte / unidad', money(p.transporte));
    row('Otros variables / unidad', money(p.otrosVariables));
    row('Costo variable / unidad', money(p.varPerUnit), true);
    row('Precio de venta', money(p.precioVenta));
    row('Margen por unidad', money(p.marginPerUnit), true);
    row('Unidades al mes', `${p.unidadesVendidas}`);
    row('Ingreso del producto', money(p.revenue));
    divider();
  });

  label('Resultado mensual');
  row('Ingreso total', money(fin.monthlyIncome));
  row('Costo variable total', money(fin.totalVariableCost));
  row('Egresos fijos', money(fin.totalFixed));
  row('Costo total', money(fin.totalMonthlyCost));
  divider();
  row('Utilidad mensual', money(fin.monthlyProfit), true);
  row('Margen sobre ventas', `${fin.profitPercent.toFixed(1)}%`, true);
  y += 4;

  label('Punto de equilibrio');
  if (fin.canBreakEven) {
    row('Margen de contribucion promedio', money(fin.avgMargin));
    row('Unidades necesarias al mes', `${Math.ceil(fin.breakEvenUnits)} uds`, true);
    row('Equivalente en ventas', money(fin.breakEvenMoney), true);
    if (fin.breakEvenByProduct.length > 1) {
      y += 3;
      label('Reparto por producto');
      fin.breakEvenByProduct.forEach((p, i) => {
        row(p.nombre?.trim() || `Producto ${i + 1}`, `${Math.ceil(p.breakEvenUnits)} uds`);
      });
    }
  } else {
    paragraph(
      'Con los datos actuales el punto de equilibrio es inalcanzable: el costo variable por unidad ' +
      'iguala o supera el precio de venta, de modo que cada unidad vendida genera perdida. ' +
      'Es necesario subir precios o reducir el costo por unidad antes de proyectar volumenes.'
    );
  }

  // ─── Footer on every page ────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text(
      `${data.businessName || 'Plan de negocio'}  •  Confidencial  •  ${new Date().toLocaleDateString('es-ES')}`,
      MARGIN, PAGE_H - 9
    );
    doc.text(`${i} / ${total}`, PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' });
  }

  // Strip accents (NFD splits them into combining marks) so the filename is portable.
  const safeName = (data.businessName || 'plan-de-negocio')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan-de-negocio';

  doc.save(`Plan-de-Negocio-${safeName}.pdf`);
};
