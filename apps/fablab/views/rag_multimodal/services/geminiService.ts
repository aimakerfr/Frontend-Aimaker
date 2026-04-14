import { httpClient } from '@core/api/http.client.ts';
import { Source, StructuredSummary, Language } from "../types.ts";

const GEMINI_ENDPOINT = '/api/v1/gemini';

/**
 * Analiza una imagen con Gemini Vision
 */
export const analyzeImage = async (base64Data: string, mimeType: string): Promise<{ title: string, content: string }> => {
  try {
    const result = await httpClient.post<{ title: string, content: string }>(
      `${GEMINI_ENDPOINT}/analyze-image`,
      { base64Data, mimeType }
    );
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      title: "Imagen (Error en análisis)",
      content: "No se pudo analizar la imagen. Intenta con otra imagen."
    };
  }
};

/**
 * Procesa un PDF de forma visual con Gemini
 */
export const processPdfVisual = async (pagesBase64: { data: string, mimeType: string }[]): Promise<string> => {
  try {
    const result = await httpClient.post<{ content: string }>(
      `${GEMINI_ENDPOINT}/process-pdf`,
      { pages: pagesBase64 }
    );
    return result.content;
  } catch (error) {
    console.error('Error processing PDF:', error);
    return "No se pudo procesar el documento. Intenta con un archivo más pequeño.";
  }
};

/**
 * Transcribe un video local
 */
export const transcribeVideo = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const result = await httpClient.post<{ content: string }>(
      `${GEMINI_ENDPOINT}/transcribe-video`,
      { base64Data, mimeType }
    );
    return result.content;
  } catch (error) {
    console.error('Error transcribing video:', error);
    return "No se pudo transcribir el video.";
  }
};

/**
 * Transcribe un video por URL (YouTube, etc)
 */
export const transcribeVideoUrl = async (url: string): Promise<{ title: string, content: string }> => {
  try {
    const result = await httpClient.post<{ title: string, content: string }>(
      `${GEMINI_ENDPOINT}/transcribe-video-url`,
      { url }
    );
    return result;
  } catch (error) {
    console.error('Error transcribing video URL:', error);
    return {
      title: "Video (Error en transcripción)",
      content: `No se pudo transcribir el video de: ${url}`
    };
  }
};

/**
 * Extrae contenido de una URL web
 */
export const extractUrlContent = async (url: string): Promise<{ title: string, content: string }> => {
  try {
    const result = await httpClient.post<{ title: string, content: string }>(
      `${GEMINI_ENDPOINT}/extract-url`,
      { url }
    );
    return result;
  } catch (error) {
    console.error('Error extracting URL content:', error);
    return {
      title: "Contenido Web (Error)",
      content: `No se pudo extraer contenido de: ${url}`
    };
  }
};

/**
 * Genera un resumen estructurado de las fuentes
 */
export const generateSourceSummary = async (sources: Source[], lang: Language): Promise<StructuredSummary | null> => {
  console.log('[geminiService] generateSourceSummary called with', sources.length, 'sources');
  const activeSources = sources.filter(s => s.selected);
  console.log('[geminiService] Active sources:', activeSources.length);
  
  if (activeSources.length === 0) {
    console.warn('[geminiService] No active sources found!');
    return null;
  }
  
  try {
    // Formatear las fuentes para el backend
    const formattedSources = activeSources.map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      content: s.content,
      selected: s.selected
    }));

    console.log('[geminiService] Formatted sources:', formattedSources.map(s => ({
      title: s.title,
      hasContent: !!s.content,
      contentLength: s.content?.length,
      selected: s.selected
    })));
    
    console.log('[geminiService] DETAILED - First source:', JSON.stringify({
      id: formattedSources[0]?.id,
      title: formattedSources[0]?.title,
      type: formattedSources[0]?.type,
      hasContent: !!formattedSources[0]?.content,
      contentPreview: formattedSources[0]?.content?.substring(0, 100),
      selected: formattedSources[0]?.selected
    }, null, 2));

    const result = await httpClient.post<StructuredSummary>(
      `${GEMINI_ENDPOINT}/source-summary`,
      { sources: formattedSources, language: lang }
    );
    
    console.log('[geminiService] Summary generated successfully:', result);
    return result;
  } catch (error) {
    console.error('[geminiService] Error generating summary:', error);
    // Retornar estructura básica en caso de error
    return {
      globalOverview: "No se pudo generar el resumen de las fuentes.",
      sourcesAnalysis: activeSources.map(source => ({
        title: source.title,
        type: source.type,
        summary: "Resumen no disponible",
        keyTopics: [],
        suggestedQuestions: []
      }))
    };
  }
};

/**
 * Genera una respuesta de chat con contexto de fuentes
 * @param systemInstruction Instrucción personalizada extraída de un JSON externo. Si se provee,
 *                          reemplaza el system prompt interno del backend.
 */
export const generateChatResponse = async (history: any[], sources: Source[], message: string, lang: Language, systemInstruction?: string): Promise<string> => {
  try {
    const isPendingPlaceholder = (value: string): boolean => {
      const lower = String(value || '').toLowerCase();
      return lower.includes('pendiente de procesamiento') || lower.includes('procesando contenido') || lower.includes('pending processing');
    };

    const hydrateSourceContent = async (source: Source): Promise<Source> => {
      if (!source.selected) return source;

      const needsHydration = !String(source.content || '').trim() || isPendingPlaceholder(source.content || '');
      if (!needsHydration) return source;

      const sourceId = Number(source.id);
      if (!Number.isFinite(sourceId)) return source;

      try {
        const sourceData = await httpClient.get<{ content: string; type: string; name: string }>(`/api/v1/rag-multimodal-sources/${sourceId}/content`);
        const hydratedContent = String(sourceData?.content || '').trim();
        if (!hydratedContent) return source;

        return {
          ...source,
          title: sourceData?.name || source.title,
          backendType: sourceData?.type || source.backendType,
          content: hydratedContent,
        };
      } catch {
        return source;
      }
    };

    const hydratedSources = await Promise.all(sources.map(hydrateSourceContent));

    const inferSourceTypeForPrompt = (source: Source): string => {
      const rawType = String(source.backendType || source.type || '').toUpperCase();
      const title = String(source.title || '').toLowerCase();

      const extension = title.includes('.')
        ? title.substring(title.lastIndexOf('.') + 1).trim().toLowerCase()
        : '';

      if (rawType === 'DOC') {
        if (extension === 'xlsx') return 'spreadsheet';
        if (extension === 'pptx') return 'presentation';
        if (extension === 'docx' || extension === 'doc' || extension === 'odt' || extension === 'rtf') return 'document';
        if (extension === 'pdf') return 'pdf';
        return 'document';
      }

      if (rawType !== '') {
        return rawType.toLowerCase();
      }

      return String(source.type || 'unknown').toLowerCase();
    };

    // Filtrar solo fuentes seleccionadas con contenido
    const validSources = hydratedSources
      .filter(s => s.selected)
      .filter(s => {
        const content = String(s.content || '').trim();
        return content !== '' && !isPendingPlaceholder(content);
      })
      .map(s => ({
        id: s.id,
        title: s.title,
        type: inferSourceTypeForPrompt(s),
        content: s.content
      }));

    console.log('[Chat] Enviando:', {
      sources: validSources.length,
      history: history.length,
      messageLength: message.length
    });

    const result = await httpClient.post<{ response: string }>(
      `${GEMINI_ENDPOINT}/chat`,
      { 
        history, 
        sources: validSources, 
        message, 
        language: lang,
        ...(systemInstruction ? { systemInstruction } : {})
      }
    );
    
    if (!result?.response) {
      console.error('[Chat] Respuesta inválida:', result);
      return "No se recibió respuesta del servidor.";
    }
    
    console.log('[Chat] Respuesta recibida correctamente');
    return result.response;

  } catch (error: any) {
    console.error("[Chat] Error:", error);
    
    const errorMsg = error?.response?.data?.message 
                  || error?.response?.data?.error 
                  || error?.message 
                  || 'Error desconocido';
    
    return `Error: ${errorMsg}`;
  }
};
