import { httpClient } from '../../../core/src/api/http.client';
import { API_ENDPOINTS, type GeminiRequest, type GeminiResponse } from '../../../core/src/api/api.types';
import { Source, StructuredSummary, Language } from "../types";

const getContextFromSources = (sources: Source[]): string => {
  const activeSources = sources.filter(s => s.selected);
  if (activeSources.length === 0) return "";

  return activeSources.map(s => `ID: ${s.id}\nTITULO: ${s.title}\nTIPO: ${s.type}\nCONTENIDO:\n${s.content}\n---`).join("\n");
};

/**
 * TODO: Implementar estos endpoints en el backend
 * Por ahora retornan mensajes de placeholder
 */

export const analyzeImage = async (_base64Data: string, _mimeType: string): Promise<{ title: string, content: string }> => {
  // TODO: Crear endpoint en backend para análisis de imágenes
  console.warn('analyzeImage: Endpoint no implementado en backend aún');
  return {
    title: "Imagen (Análisis pendiente)",
    content: "Esta funcionalidad requiere implementación en el backend. El análisis de imágenes será procesado por Gemini Vision API."
  };
};

export const processPdfVisual = async (_pagesBase64: { data: string, mimeType: string }[]): Promise<string> => {
  // TODO: Crear endpoint en backend para análisis de PDFs
  console.warn('processPdfVisual: Endpoint no implementado en backend aún');
  return "Análisis de PDF pendiente de implementación en el backend.";
};

export const transcribeVideo = async (_base64Data: string, _mimeType: string): Promise<string> => {
  // TODO: Crear endpoint en backend para transcripción de video
  console.warn('transcribeVideo: Endpoint no implementado en backend aún');
  return "Transcripción de video pendiente de implementación en el backend.";
};

export const transcribeVideoUrl = async (url: string): Promise<{ title: string, content: string }> => {
  // TODO: Crear endpoint en backend para transcripción de video por URL
  console.warn('transcribeVideoUrl: Endpoint no implementado en backend aún');
  return {
    title: "Video (Transcripción pendiente)",
    content: `URL: ${url}\nLa transcripción de videos requiere implementación en el backend.`
  };
};

export const extractUrlContent = async (url: string): Promise<{ title: string, content: string }> => {
  // TODO: Crear endpoint en backend para extracción de contenido web
  console.warn('extractUrlContent: Endpoint no implementado en backend aún');
  return {
    title: "Contenido Web (Pendiente)",
    content: `URL: ${url}\nLa extracción de contenido web requiere implementación en el backend.`
  };
};

export const generateSourceSummary = async (sources: Source[], _lang: Language): Promise<StructuredSummary | null> => {
  const activeSources = sources.filter(s => s.selected);
  if (activeSources.length === 0) return null;
  
  // TODO: Crear endpoint en backend para generar resúmenes estructurados
  console.warn('generateSourceSummary: Endpoint no implementado en backend aún');
  
  // Retornar estructura mock para que la UI funcione
  return {
    globalOverview: "Resumen general pendiente de implementación en el backend.",
    sourcesAnalysis: activeSources.map(source => ({
      title: source.title,
      type: source.type,
      summary: "Resumen pendiente de implementación.",
      keyTopics: ["Tema 1", "Tema 2"],
      suggestedQuestions: ["¿Pregunta de ejemplo?"]
    }))
  };
};

export const generateChatResponse = async (_history: any[], sources: Source[], message: string, _lang: Language): Promise<string> => {
  const context = getContextFromSources(sources);
  
  try {
    // Usar el endpoint del backend para generar respuestas
    const data = await httpClient.post<GeminiResponse>(API_ENDPOINTS.ai.generate, {
      prompt: `Contexto de fuentes:\n${context}\n\nPregunta del usuario: ${message}`,
      options: {
        temperature: 0.7,
        maxTokens: 2048
      }
    } as GeminiRequest);

    return data.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Lo siento, ocurrió un error al procesar tu consulta.";
  }
};
