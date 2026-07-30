export enum AppStage {
  DIAGNOSIS = 0,
  ASSETS = 1,
  STRUCTURE = 2,
  MARKET_RESEARCH = 3,
  REVIEW = 4,
  BREAK_EVEN = 5,
}

export interface CanvasSection {
  title: string;
  points: string[]; // Bullet points for the dashboard card
  detail: string;   // Extended explanation for the modal
}

export interface BusinessCanvasData {
  keyPartners: CanvasSection;
  keyActivities: CanvasSection;
  valuePropositions: CanvasSection;
  customerRelationships: CanvasSection;
  customerSegments: CanvasSection;
  keyResources: CanvasSection;
  channels: CanvasSection;
  costStructure: CanvasSection;
  revenueStreams: CanvasSection;
}

export type CanvasSectionKey = keyof BusinessCanvasData;

/** What the user writes into each Canvas block, on top of the AI suggestions. */
export type CanvasNotes = Partial<Record<CanvasSectionKey, string>>;

/**
 * One sellable product. Break-even is computed across all of them using a
 * weighted average contribution margin, so every product carries its own
 * price, volume and variable costs.
 */
export interface ProductLine {
  id: string;
  nombre: string;             // Descriptive only
  materiasPrimasDesc: string; // Descriptive only: which raw materials, not their cost
  materiaPrima: number;
  transporte: number;
  otrosVariables: number;
  precioVenta: number;
  unidadesVendidas: number;
}

export interface Financials {
  // Fixed costs are business-wide, not per product
  arriendo: number;
  servicios: number;
  salariosEmpleados: number;
  salarioPropio: number;
  otrosFijos: number;
  productos: ProductLine[];
}

export const MAX_PRODUCTS = 3;

export const createProductLine = (index: number): ProductLine => ({
  id: `producto-${index}-${Date.now()}`,
  nombre: '',
  materiasPrimasDesc: '',
  materiaPrima: 0,
  transporte: 0,
  otrosVariables: 0,
  precioVenta: 0,
  unidadesVendidas: 0,
});

export interface BusinessData {
  hasProduct: boolean;
  hasLogo: boolean;
  hasMarketTarget: boolean;

  businessName: string;
  industry: string;

  logoUrl?: string;
  mockupUrl?: string;
  productIdeas: string[];
  selectedProductIdea?: string;

  mission: string;
  vision: string;
  targetAudience: string;
  shortTermGoals: string;

  // Market Research
  location: string;
  marketAnalysis?: string; // Detailed text
  marketSummary?: string[]; // Key bullet points
  marketSources?: { title: string; uri: string }[];

  // Now stores the Canvas JSON object
  actionPlan?: BusinessCanvasData | null;

  // User-written content for each Canvas block
  canvasNotes?: CanvasNotes;

  // Financial Data
  financials?: Financials;
}

export interface GenerationState {
  isGeneratingLogo: boolean;
  isGeneratingMockup: boolean;
  isGeneratingIdeas: boolean;
  isRefiningMission: boolean;
  isRefiningVision: boolean;
  isPerformingResearch: boolean;
  isGeneratingPlan: boolean;
}
