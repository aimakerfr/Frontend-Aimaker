import { httpClient } from '@core/api/http.client';

export interface DeploymentResult {
  status: string;
  message: string;
  deploy_url?: string;
  detected_category?: string;
}

/**
 * Service to handle assembly deployment logic using the simplified assembler endpoint
 */
export const deployAssembly = async (makerPathId: number): Promise<DeploymentResult> => {
  try {
    console.log(`Starting simplified deployment for makerPathId: ${makerPathId}`);
    
    const result = await httpClient.post<DeploymentResult>(`/api/v1/assembler/deploy/${makerPathId}`);

    console.log('Deployment triggered successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to deploy assembly:', error);
    throw error;
  }
};
