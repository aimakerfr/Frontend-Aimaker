import { httpClient } from '../api/http.client';

export interface PerplexitySearchResponse {
  content: string;
  model: string;
  provider: string;
}

export const perplexityService = {
  /**
   * Search and obtain organized summary about a topic using Perplexity AI.
   * @param query The topic or question to research.
   */
  async search(query: string): Promise<PerplexitySearchResponse> {
    try {
      const response = await httpClient.post<PerplexitySearchResponse>(
        '/api/v1/perplexity/search',
        { query }
      );
      return response;
    } catch (error) {
      console.error('Error en perplexity.service.ts:', error);
      throw new Error('No se pudo obtener respuesta del buscador Perplexity.');
    }
  }
};
