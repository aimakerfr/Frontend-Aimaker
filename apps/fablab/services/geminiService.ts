import { httpClient } from '../../../core/src/api/http.client';
import { API_ENDPOINTS, type GeminiRequest, type GeminiResponse } from '../../../core/src/api/api.types';

/**
 * Standard Chat using Backend Gemini API
 */
export const generateChatResponse = async (_history: unknown, message: string) => {
  try {
    const data = await httpClient.post<GeminiResponse>(API_ENDPOINTS.ai.generate, {
      prompt: message,
      options: {
        temperature: 0.7,
        maxTokens: 1024
      }
    } as GeminiRequest);

    return data.text || "No response generated.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I encountered an error processing your request through the backend.";
  }
};

/**
 * Fast response for small tasks
 */
export const generateFastDescription = async (prompt: string) => {
  try {
    const data = await httpClient.post<GeminiResponse>(API_ENDPOINTS.ai.generate, {
      prompt: prompt,
      options: {
        temperature: 0.3,
        maxTokens: 500
      }
    } as GeminiRequest);
    return data.text || "";
  } catch (error) {
    console.error("Fast Gen Error:", error);
    return "";
  }
};

/**
 * Complex reasoning task using Thinking Mode (Simulated via backend)
 */
export const analyzeComplexData = async (dataContext: string, query: string) => {
  try {
    const data = await httpClient.post<GeminiResponse>(API_ENDPOINTS.ai.generate, {
      prompt: `Contexto: ${dataContext}\n\nConsulta: ${query}`,
      options: {
        temperature: 0.9,
        maxTokens: 2048
      }
    } as GeminiRequest);
    return data.text || "Analysis failed.";
  } catch (error: any) {
    console.error("Thinking Error:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return `Error: ${errorMessage}`;
  }
};

// Helper for compatibility
export const hasApiKey = () => true; 
