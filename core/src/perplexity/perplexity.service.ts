import { HttpClientError, httpClient } from '../api/http.client';

export interface PerplexitySearchResponse {
  content: string;
  model: string;
  provider: string;
  searchesCount?: number | null;
}

export interface PerplexitySearchOptions {
  makerPathId?: number;
  systemInstruction?: string;
  apiKey?: string;
  useOpenAiBridge?: boolean;
}

export const perplexityService = {
  /**
   * Search and obtain organized summary about a topic using Perplexity AI.
   * @param query The topic or question to research.
   */
  async search(query: string, options: PerplexitySearchOptions = {}): Promise<PerplexitySearchResponse> {
    try {
      const payload: Record<string, unknown> = { query };
      if (options.makerPathId) payload.makerPathId = options.makerPathId;
      if (options.systemInstruction) payload.systemInstruction = options.systemInstruction;
      if (options.apiKey) payload.apiKey = options.apiKey;
      if (options.useOpenAiBridge) payload.useOpenAiBridge = true;
      const response = await httpClient.post<PerplexitySearchResponse>(
        '/api/v1/perplexity/search',
        payload
      );
      return response;
    } catch (error) {
      console.error('Error en perplexity.service.ts:', error);
      if (error instanceof HttpClientError) {
        throw error;
      }
      throw new Error('No se pudo obtener respuesta del buscador Perplexity.');
    }
  }
};
