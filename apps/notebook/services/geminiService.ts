
import { GoogleGenAI, Type } from "@google/genai";
import { Source, StructuredSummary, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getContextFromSources = (sources: Source[]): string => {
  const activeSources = sources.filter(s => s.selected);
  if (activeSources.length === 0) return "";

  return activeSources.map(s => `ID: ${s.id}\nTITULO: ${s.title}\nTIPO: ${s.type}\nCONTENIDO:\n${s.content}\n---`).join("\n");
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<{ title: string, content: string }> => {
  const prompt = `Analiza esta imagen con precisión quirúrgica. 
  Genera:
  TITULO: Un nombre corto y profesional para la imagen.
  CONTENIDO: Una descripción técnica y detallada de todo lo visible, incluyendo OCR de texto, análisis de gráficos y contexto visual completo para un sistema de base de conocimientos.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
        ]
      }]
    });
    const text = response.text || "";
    const titleMatch = text.match(/TITULO:\s*(.*)/i);
    const contentMatch = text.match(/CONTENIDO:\s*([\s\S]*)/i);
    return {
      title: titleMatch ? titleMatch[1].trim() : "Imagen Analizada",
      content: contentMatch ? contentMatch[1].trim() : text
    };
  } catch (error) {
    throw new Error("Error en análisis visual de imagen.");
  }
};

export const processPdfVisual = async (pagesBase64: { data: string, mimeType: string }[]): Promise<string> => {
  const prompt = `Estás recibiendo las páginas de un documento (PDF/Presentación). 
  Realiza un análisis multimodal página por página:
  1. Extrae todo el texto literal (OCR).
  2. Describe diagramas, tablas y relaciones visuales.
  3. Mantén la estructura lógica del documento.
  Tu respuesta será el contenido de texto enriquecido que se usará como fuente principal para un sistema RAG.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          ...pagesBase64.map(p => ({ inlineData: { data: p.data, mimeType: p.mimeType } })),
          { text: prompt }
        ]
      }]
    });
    return response.text || "No se pudo procesar el contenido del PDF.";
  } catch (error) {
    throw new Error("Error en procesamiento multimodal del documento.");
  }
};

export const transcribeVideo = async (base64Data: string, mimeType: string): Promise<string> => {
  const prompt = `Analiza este video de forma integral. 
  1. Transcribe el audio completo de forma literal.
  2. Identifica y describe el texto que aparece en pantalla.
  3. Describe los sucesos visuales más importantes.
  Genera un reporte de texto extenso que sirva como fuente de datos completa para un asistente de investigación.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
        ]
      }]
    });
    return response.text || "Sin contenido de video extraído.";
  } catch (error) {
    throw new Error("Error al transcribir video local.");
  }
};

export const transcribeVideoUrl = async (url: string): Promise<{ title: string, content: string }> => {
  const prompt = `Utiliza Google Search para acceder al contenido del video en: ${url}. 
  Busca específicamente:
  1. El título exacto del video.
  2. La transcripción completa si está disponible públicamente en sitios de terceros o descripciones de video.
  3. Un desglose detallado minuto a minuto si existe.
  Devuelve el resultado en este formato estrictamente:
  TITULO: [Título]
  CONTENIDO: [Texto completo de la transcripción y detalles del video extraídos]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ googleSearch: {} }] }
    });
    const text = response.text || "";
    const titleMatch = text.match(/TITULO:\s*(.*)/i);
    const contentMatch = text.match(/CONTENIDO:\s*([\s\S]*)/i);
    return {
      title: titleMatch ? titleMatch[1].trim() : "Fuente de YouTube",
      content: contentMatch ? contentMatch[1].trim() : text
    };
  } catch (error) {
    throw new Error("Error al recuperar datos del video por URL.");
  }
};

export const extractUrlContent = async (url: string): Promise<{ title: string, content: string }> => {
  const prompt = `Navega y extrae el contenido de esta URL usando Google Search: ${url}. 
  Tu objetivo es obtener el texto completo del artículo o página, ignorando anuncios y menús.
  Formato de respuesta:
  TITULO: [Título de la página]
  CONTENIDO: [Cuerpo de texto completo y detallado para análisis RAG]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ googleSearch: {} }] }
    });
    const text = response.text || "";
    const titleMatch = text.match(/TITULO:\s*(.*)/i);
    const contentMatch = text.match(/CONTENIDO:\s*([\s\S]*)/i);
    return {
      title: titleMatch ? titleMatch[1].trim() : "Fuente Web",
      content: contentMatch ? contentMatch[1].trim() : text
    };
  } catch (error) {
    throw new Error("Error al extraer contenido web.");
  }
};

export const generateSourceSummary = async (sources: Source[], lang: Language): Promise<StructuredSummary | null> => {
  const activeSources = sources.filter(s => s.selected);
  if (activeSources.length === 0) return null;
  const context = getContextFromSources(activeSources);
  const langName = lang === 'es' ? 'Español' : lang === 'fr' ? 'Francés' : 'Inglés';
  const prompt = `Analiza estas fuentes y genera un resumen estructurado en ${langName}. 
  Debes devolver un JSON con:
  1. globalOverview: Resumen general de todas las fuentes seleccionadas.
  2. sourcesAnalysis: Un array con (title, type, summary, keyTopics, suggestedQuestions) para cada fuente.
  Fuentes:
  ${context}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            globalOverview: { type: Type.STRING },
            sourcesAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                  suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "type", "summary", "keyTopics", "suggestedQuestions"]
              }
            }
          },
          required: ["globalOverview", "sourcesAnalysis"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Gemini no devolvió texto JSON.");
    }

    return JSON.parse(response.text) as StructuredSummary;
  } catch (error) {
    return null;
  }
};

export const generateChatResponse = async (history: any[], sources: Source[], message: string, lang: Language): Promise<string> => {
  const context = getContextFromSources(sources);

  // Instrucción del sistema mejorada para evitar IDs y sintaxis sucia
  const systemInstruction = `Eres un experto en investigación y análisis. Responde siempre en ${lang} utilizando exclusivamente la información de las fuentes proporcionadas.
  
  REGLAS CRÍTICAS DE SALIDA:
  1. PROHIBIDO mencionar los identificadores internos (IDs como "rvbyt8"). Identifica las fuentes únicamente por su TÍTULO.
  2. No utilices asteriscos (**) ni símbolos de markdown para resaltar texto. Entrega una respuesta en texto plano, limpio y elegante.
  3. Usa párrafos claros y lenguaje natural.
  4. Si la información no está en las fuentes, indícalo educadamente.

  Contexto de fuentes (PARA TU USO INTERNO, NO REPETIR IDs):
  ${context}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })), { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction }
    });

    let cleanedText = response.text || "";

    // Limpieza final de seguridad para eliminar cualquier residuo de IDs o asteriscos
    cleanedText = cleanedText
      .replace(/\(ID:\s*[a-z0-9]+\)/gi, "") // Elimina cualquier (ID: xxxxx)
      .replace(/ID:\s*[a-z0-9]+/gi, "")     // Elimina cualquier ID: xxxxx
      .replace(/\*\*/g, "")                // Elimina doble asterisco
      .trim();

    return cleanedText;
  } catch (error) {
    return "Lo siento, ocurrió un error al procesar tu consulta con Gemini.";
  }
};
