import { httpClient } from '../api/http.client';

export interface OptimizePromptResponse {
  optimized: string;
  improvements: string;
}

/**
 * Dashboard AI Service
 * Centraliza toda la lógica de AI para el dashboard de proyectos
 */
export class DashboardAIService {
  /**
   * Optimiza un prompt usando Gemini AI
   * Backend endpoint: POST /api/v1/gemini/optimize-prompt
   */
  async optimizePrompt(rawPrompt: string): Promise<OptimizePromptResponse> {
    try {
      const response = await httpClient.post<OptimizePromptResponse>(
        '/api/v1/gemini/optimize-prompt',
        { prompt: rawPrompt }
      );

      return response;
    } catch (error) {
      console.error('[DashboardAIService] Error optimizing prompt:', error);
      
      // Fallback en caso de error
      return {
        optimized: rawPrompt,
        improvements: 'No se pudo optimizar el prompt. Usando el original.'
      };
    }
  }

  /**
   * Genera contenido basado en el proyecto configurado
   * Backend endpoint: POST /api/v1/gemini/generate-project-content
   */
  async generateProjectContent(projectData: any): Promise<string> {
    try {
      const response = await httpClient.post<{ content: string }>(
        '/api/v1/gemini/generate-project-content',
        { projectData }
      );

      return response.content;
    } catch (error) {
      console.error('[DashboardAIService] Error generating content:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const dashboardAIService = new DashboardAIService();
