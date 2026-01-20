import { httpClient } from '../api/http.client';
import { API_ENDPOINTS, type GeminiRequest, type GeminiResponse } from '../api/api.types';

export interface AIGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export class AIService {
  /**
   * Genera respuesta usando Gemini AI
   */
  async generate(prompt: string, options?: AIGenerateOptions): Promise<string> {
    try {
      const data = await httpClient.post<GeminiResponse>(API_ENDPOINTS.ai.generate, {
        prompt,
        options: {
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 2048,
          topP: options?.topP,
          topK: options?.topK
        }
      } as GeminiRequest);

      return data.text || "No se pudo generar una respuesta.";
    } catch (error) {
      console.error("AI Generate Error:", error);
      throw error;
    }
  }

  /**
   * Genera respuesta con contexto
   */
  async generateWithContext(prompt: string, context: string, options?: AIGenerateOptions): Promise<string> {
    const fullPrompt = context 
      ? `Contexto:\n${context}\n\nPregunta del usuario: ${prompt}`
      : prompt;
    
    return this.generate(fullPrompt, options);
  }
}
