import { httpClient } from '../api/http.client';

export interface AssistantConfig {
  instructions?: string;
  starters?: string[];
  capabilities?: {
    imageGen?: boolean;
  };
  knowledgeFiles?: Array<{
    name: string;
    size: number;
    type: string;
    content: string;
  }>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  attachments?: Array<{
    name?: string;
    mimeType: string;
    data: string;
  }>;
}

interface GeminiChatResponse {
  content: string;
  image?: string;
}

/**
 * Servicio para interactuar con el asistente a través de Gemini
 */
export const geminiService = {
  /**
   * Envía un mensaje al asistente y obtiene la respuesta
   */
  async chatWithAssistant(
    assistantConfig: AssistantConfig,
    messages: Message[]
  ): Promise<GeminiChatResponse> {
    try {
      const response = await httpClient.post<GeminiChatResponse>(
        '/api/v1/gemini/assistant-chat',
        {
          assistantConfig,
          messages
        }
      );

      return response;
    } catch (error) {
      console.error('Error en chatWithAssistant:', error);
      throw new Error('No se pudo obtener respuesta del asistente');
    }
  }
};
