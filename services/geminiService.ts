import { GoogleGenAI, Type, Schema } from "@google/genai";

declare const __FREE_KEY__: string;

const findKey = (name: string) => {
  const g = (globalThis as any);
  try {
    return g.process?.env?.[name] || 
           g.window?.process?.env?.[name] || 
           g[name] || 
           (typeof process !== 'undefined' ? (process as any)['env']?.[name] : undefined);
  } catch (e) {
    return undefined;
  }
};

export const hasAnyApiKey = () => {
  const runtimeKey = findKey('API_KEY');
  let buildTimeKey = "";
  try {
    buildTimeKey = __FREE_KEY__;
  } catch (e) {
    // Fallback for dev environment
    buildTimeKey = (process.env as any).GEMINI_API_KEY || (process.env as any).VITE_GEMINI_API_KEY || "";
  }
  const hasKey = !!(runtimeKey || buildTimeKey);
  console.log("hasAnyApiKey check:", { hasKey, hasRuntime: !!runtimeKey, hasBuildTime: !!buildTimeKey });
  return hasKey;
};

const getAI = (isPaid = false) => {
  // Try to find the runtime API_KEY (from the dialog)
  const runtimeKey = findKey('API_KEY');
  
  // Try to find the build-time key (from the environment)
  let buildTimeKey = "";
  try {
    buildTimeKey = __FREE_KEY__;
  } catch (e) {
    // Ignore error
  }

  // Use whatever key is available. If both are available, prioritize runtimeKey for "paid" tasks
  // but allow buildTimeKey to be used if runtimeKey is missing.
  const apiKey = runtimeKey || buildTimeKey;

  if (!apiKey) {
    console.error("No API Key found. isPaid:", isPaid, "runtimeKey:", !!runtimeKey, "buildTimeKey:", !!buildTimeKey);
  } else {
    // Log key presence and first few chars for debugging (safe)
    console.log(`Using API Key. Source: ${runtimeKey ? 'runtime' : 'build-time'}. Starts with: ${apiKey.substring(0, 4)}...`);
  }
  
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

const FLASH_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

export const generateBusinessIdeas = async (interests: string, sector: string): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Actúa como un consultor de negocios experto en el mercado latinoamericano. Genera 3 ideas de negocio innovadoras y rentables para alguien interesado en: "${interests}" dentro del sector "${sector}". 
      Las ideas deben ser viables en el contexto de Latinoamérica pero modernas.
      Devuelve solo un array JSON de strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating ideas:", error);
    return ["Error al generar ideas"];
  }
};

export const generateLogo = async (brandName: string, style: string, colors: string): Promise<string | null> => {
  try {
    const ai = getAI(true);
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: `Diseña un logotipo minimalista, moderno y vectorial para una empresa llamada "${brandName}". Estilo: ${style}. Paleta de colores: ${colors}. El fondo debe ser blanco puro.`,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("Error generating logo:", error);
    throw error;
  }
};

export const generateMockup = async (logoBase64: string, objectDescription: string): Promise<string | null> => {
  try {
    const ai = getAI(true);
    const base64Data = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: `Este es el logo de una marca. Crea un mockup publicitario fotorrealista aplicando este logo sobre un/a ${objectDescription}. El resultado debe ser profesional, estético y listo para un catálogo de marketing.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("Error generating mockup:", error);
    throw error;
  }
};

export const performMarketResearch = async (location: string, businessType: string) => {
  try {
    const ai = getAI();
    // We switched from JSON mode to Text mode because Google Search grounding 
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Realiza una investigación de mercado profunda y específica para un negocio de "${businessType}" en la ubicación: "${location}". 
      
      Utiliza los resultados de búsqueda para identificar:
      1. Competidores locales específicos (nombres de negocios cercanos).
      2. Perfil demográfico y socioeconómico de la zona "${location}".
      3. Tendencias de consumo locales y saturación del mercado en ese punto exacto.
      4. Oportunidades no explotadas o nichos específicos en esa ubicación.

      IMPORTANTE: Tu respuesta debe seguir EXACTAMENTE este formato de texto plano con separadores, sin bloques de código JSON ni Markdown extra en los títulos:

      ---RESUMEN---
      - Punto clave sobre competencia local (max 15 palabras)
      - Punto clave sobre demanda en "${location}" (max 15 palabras)
      - Punto clave sobre perfil del cliente ideal (max 15 palabras)
      - Punto clave sobre oportunidad estratégica (max 15 palabras)
      
      ---ANALISIS---
      Escribe un análisis detallado (aprox 300 palabras). Puedes usar Markdown (negritas, listas) para mejorar la legibilidad. Divide el análisis en:
      - **ENTORNO LOCAL**: Describe cómo es la zona "${location}" para este negocio.
      - **COMPETENCIA DIRECTA**: Menciona tipos de negocios o nombres específicos que ya operan allí.
      - **COMPORTAMIENTO DEL CONSUMIDOR**: Qué busca la gente en esa ubicación específica.
      - **VIABILIDAD**: Conclusión realista sobre si es buen momento y lugar para abrir.

      Fin de la respuesta.`,
      config: {
        tools: [{ googleSearch: {} }],
        // Removed responseMimeType: "application/json" to prevent conflicts with Search tool
      }
    });
    
    const text = response.text || "";
    
    // Manual parsing of the structured text response
    const summaryMatch = text.match(/---RESUMEN---([\s\S]*?)---ANALISIS---/);
    const analysisMatch = text.match(/---ANALISIS---([\s\S]*)/);

    let summary: string[] = [];
    let analysis = "No se pudo completar el análisis detallado.";

    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1]
        .split('\n')
        .map(line => line.replace(/^-\s*/, '').trim()) // Remove bullet points and whitespace
        .filter(line => line.length > 0);
    }

    if (analysisMatch && analysisMatch[1]) {
      analysis = analysisMatch[1].trim();
    }
    
    // Extract sources if available
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Fuente Externa',
      uri: chunk.web?.uri || '#'
    })).filter((s: any) => s.uri !== '#') || []; // Filter out invalid sources

    // Deduplicate sources by URI
    const uniqueSources = Array.from(new Map(sources.map((item:any) => [item.uri, item])).values());

    return {
      summary: summary.length > 0 ? summary : ["Datos limitados en esta zona.", "Se requiere investigación de campo."],
      analysis: analysis,
      sources: uniqueSources
    };
  } catch (error) {
    console.error("Research Error:", error);
    return { summary: [], analysis: "Error al realizar la investigación de mercado. Intenta ser más específico con la ubicación.", sources: [] };
  }
};

export const refineText = async (currentText: string, type: 'mission' | 'vision' | 'goals', context: string): Promise<string> => {
  
  let prompt = "";
  
  if (type === 'goals') {
    prompt = `Actúa como un gerente de negocios pragmático. Refina estos objetivos: "${currentText}" para un negocio de ${context}.
    
    Reglas OBLIGATORIAS:
    1. Devuelve SOLO el texto final corregido.
    2. NO uses formato Markdown (nada de negritas **, nada de cursivas *, nada de títulos). Texto plano puro.
    3. NO des opciones (ej: "Opción 1", "Opción 2"). Dame solo UNA versión definitiva.
    4. Hazlo PRAGMÁTICO y MEDIBLE (estilo SMART).
    5. Máximo 3 oraciones.`;
  } else {
    // Mission or Vision
    prompt = `Actúa como un experto en branding. Mejora esta ${type}: "${currentText}" para un negocio de ${context}.
    
    Reglas OBLIGATORIAS:
    1. Devuelve SOLO el texto final corregido.
    2. NO uses formato Markdown (nada de negritas **, nada de cursivas *, nada de títulos). Texto plano puro.
    3. NO des listas ni viñetas. Debe ser un párrafo fluido.
    4. NO cambies el sentido original de lo que escribió el usuario.
    5. Máximo 2 frases impactantes.`;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
    });
    // Extra cleanup just in case the model ignores instructions
    return (response.text || currentText).replace(/\*\*/g, '').replace(/\*/g, '').replace(/^Opción \d:/, '').trim();
  } catch (e) {
    return currentText;
  }
};

// Updated to generate Business Canvas Model JSON
export const generateCanvasData = async (data: any): Promise<any> => {
  const { logoUrl, mockupUrl, actionPlan, ...cleanData } = data;

  const prompt = `
    Actúa como un consultor de negocios experto.
    Genera un MODELO CANVAS DE NEGOCIO (Business Model Canvas) completo y estructurado en formato JSON para: "${cleanData.businessName}" (${cleanData.industry}).
    Ubicación: ${cleanData.location}.
    
    Contexto:
    Misión: ${cleanData.mission}
    Target: ${cleanData.targetAudience}

    Debes llenar las 9 secciones del canvas. 
    Para cada sección, proporciona:
    - "points": Un array de 3-5 puntos clave muy breves (max 6 palabras cada uno).
    - "detail": Un párrafo explicativo detallado y estratégico (aprox 50-80 palabras) que se mostrará al ampliar. Usa lenguaje sencillo y directo en español.

    El JSON debe tener EXACTAMENTE esta estructura de claves:
    {
      "keyPartners": { "title": "Socios Clave", "points": [], "detail": "" },
      "keyActivities": { "title": "Actividades Clave", "points": [], "detail": "" },
      "keyResources": { "title": "Recursos Clave", "points": [], "detail": "" },
      "valuePropositions": { "title": "Propuestas de Valor", "points": [], "detail": "" },
      "customerRelationships": { "title": "Relaciones con Clientes", "points": [], "detail": "" },
      "channels": { "title": "Canales", "points": [], "detail": "" },
      "customerSegments": { "title": "Segmentos de Clientes", "points": [], "detail": "" },
      "costStructure": { "title": "Estructura de Costes", "points": [], "detail": "" },
      "revenueStreams": { "title": "Fuentes de Ingresos", "points": [], "detail": "" }
    }
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating canvas data:", error);
    return null;
  }
};