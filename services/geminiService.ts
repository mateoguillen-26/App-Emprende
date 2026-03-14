// All Gemini calls go through the backend proxy at /api/gemini
// This keeps the API key secure on the server side

const callGemini = async (model: string, contents: any, config?: any) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, contents, config }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Proxy error ${response.status}`);
  }

  const data = await response.json();
  return data.response;
};

const FLASH_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const hasAnyApiKey = () => {
  // Key lives on the server — always return true for UI purposes
  return true;
};

export const generateBusinessIdeas = async (interests: string, sector: string): Promise<string[]> => {
  try {
    const response = await callGemini(
      FLASH_MODEL,
      `Actúa como un consultor de negocios experto en el mercado latinoamericano. Genera 3 ideas de negocio innovadoras y rentables para alguien interesado en: "${interests}" dentro del sector "${sector}". 
      Las ideas deben ser viables en el contexto de Latinoamérica pero modernas.
      Devuelve solo un array JSON de strings.`,
      {
        responseMimeType: "application/json",
      }
    );
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating ideas:", error);
    return ["Error al generar ideas"];
  }
};

export const generateLogo = async (brandName: string, style: string, colors: string): Promise<string | null> => {
  try {
    const response = await callGemini(
      IMAGE_MODEL,
      `Diseña un logotipo minimalista, moderno y vectorial para una empresa llamada "${brandName}". Estilo: ${style}. Paleta de colores: ${colors}. El fondo debe ser blanco puro.`,
      {
        responseModalities: ["IMAGE", "TEXT"],
      }
    );
    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("Error generating logo:", error);
    throw error;
  }
};

export const generateMockup = async (logoBase64: string, objectDescription: string): Promise<string | null> => {
  try {
    const base64Data = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
    const response = await callGemini(
      IMAGE_MODEL,
      {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: `Este es el logo de una marca. Crea un mockup publicitario fotorrealista aplicando este logo sobre un/a ${objectDescription}. El resultado debe ser profesional, estético y listo para un catálogo de marketing.` }
        ]
      },
      {
        responseModalities: ["IMAGE", "TEXT"],
      }
    );
    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("Error generating mockup:", error);
    throw error;
  }
};

export const performMarketResearch = async (location: string, businessType: string) => {
  try {
    const response = await callGemini(
      FLASH_MODEL,
      `Realiza una investigación de mercado profunda y específica para un negocio de "${businessType}" en la ubicación: "${location}". 
      
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
      {
        tools: [{ googleSearch: {} }],
      }
    );

    const text = response.text || "";

    const summaryMatch = text.match(/---RESUMEN---([\s\S]*?)---ANALISIS---/);
    const analysisMatch = text.match(/---ANALISIS---([\s\S]*)/);

    let summary: string[] = [];
    let analysis = "No se pudo completar el análisis detallado.";

    if (summaryMatch?.[1]) {
      summary = summaryMatch[1]
        .split('\n')
        .map((line: string) => line.replace(/^-\s*/, '').trim())
        .filter((line: string) => line.length > 0);
    }

    if (analysisMatch?.[1]) {
      analysis = analysisMatch[1].trim();
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || 'Fuente Externa',
        uri: chunk.web?.uri || '#'
      }))
      .filter((s: any) => s.uri !== '#') || [];

    const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values());

    return {
      summary: summary.length > 0 ? summary : ["Datos limitados en esta zona.", "Se requiere investigación de campo."],
      analysis,
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
    2. NO uses formato Markdown. Texto plano puro.
    3. NO des opciones. Dame solo UNA versión definitiva.
    4. Hazlo PRAGMÁTICO y MEDIBLE (estilo SMART).
    5. Máximo 3 oraciones.`;
  } else {
    prompt = `Actúa como un experto en branding. Mejora esta ${type}: "${currentText}" para un negocio de ${context}.
    
    Reglas OBLIGATORIAS:
    1. Devuelve SOLO el texto final corregido.
    2. NO uses formato Markdown. Texto plano puro.
    3. NO des listas ni viñetas. Debe ser un párrafo fluido.
    4. NO cambies el sentido original de lo que escribió el usuario.
    5. Máximo 2 frases impactantes.`;
  }

  try {
    const response = await callGemini(FLASH_MODEL, prompt);
    return (response.text || currentText).replace(/\*\*/g, '').replace(/\*/g, '').replace(/^Opción \d:/, '').trim();
  } catch (e) {
    return currentText;
  }
};

export const generateCanvasData = async (data: any): Promise<any> => {
  const { logoUrl, mockupUrl, actionPlan, ...cleanData } = data;

  const prompt = `
    Actúa como un consultor de negocios experto.
    Genera un MODELO CANVAS DE NEGOCIO completo y estructurado en formato JSON para: "${cleanData.businessName}" (${cleanData.industry}).
    Ubicación: ${cleanData.location}.
    
    Contexto:
    Misión: ${cleanData.mission}
    Target: ${cleanData.targetAudience}

    Para cada sección proporciona:
    - "points": Array de 3-5 puntos clave (max 6 palabras cada uno).
    - "detail": Párrafo explicativo (aprox 50-80 palabras).

    JSON con EXACTAMENTE estas claves:
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
    const response = await callGemini(FLASH_MODEL, prompt, { responseMimeType: "application/json" });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating canvas data:", error);
    return null;
  }
};
