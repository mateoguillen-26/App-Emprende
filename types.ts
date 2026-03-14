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

  // Financial Data
  financials?: {
    arriendo: number;
    servicios: number;
    salariosEmpleados: number;
    salarioPropio: number;
    otrosFijos: number;
    materiaPrima: number;
    transporte: number;
    otrosVariables: number;
    precioVenta: number;
    unidadesVendidas: number;
  };
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