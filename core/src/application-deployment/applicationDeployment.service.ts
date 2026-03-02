/**
 * Application Deployment Service
 * Handles the deployment lifecycle: create, upload files, and trigger deploy
 */

import { httpClient } from '../api/http.client';

const ENDPOINT = '/api/v1/application-deployment';

export interface ApplicationDeployment {
  id: number;
  maker_path_id: number | null;
  files_url: string | null;
  deployment_url: string | null;
  database_url: string | null;
  data_base_name: string | null;
  app_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateApplicationDeploymentResponse {
  deployment: ApplicationDeployment;
}

export interface UploadFilesResponse {
  success: boolean;
  application_deployment_id: number;
  files_url: string | null;
  uploaded_files: number;
  relative_url?: string;
  error?: string;
}

export interface DeployResponse {
  status: 'success' | string;
  message?: string;
  detected_category?: string;
  deploy_url?: string;
  application_deployment_id: number;
}

type IdAliases = {
  application_deployment_id?: number;
  deployment_id?: number;
  applicationDeploymentId?: number;
};

function pickDeploymentId(ids: IdAliases): number {
  const id = ids.application_deployment_id ?? ids.deployment_id ?? ids.applicationDeploymentId;
  if (typeof id !== 'number') {
    throw new Error('application_deployment_id (or alias) is required and must be a number');
  }
  return id;
}

export class ApplicationDeploymentService {
  private baseUrl = ENDPOINT;
  private listingUrl = '/api/v1/application_deployments';

  /**
   * Create a new ApplicationDeployment.
   * Accepts either maker_path_id (snake_case) or makerPathId (camelCase).
   *
   * @param data Optional payload with MakerPath id.
   * @returns The created ApplicationDeployment entity.
   */
  async createDeployment(data?: { maker_path_id?: number; makerPathId?: number }): Promise<ApplicationDeployment> {
    const maker_path_id = data?.maker_path_id ?? data?.makerPathId;
    const payload = maker_path_id ? { maker_path_id } : {};
    const resp = await httpClient.post<CreateApplicationDeploymentResponse>(`${this.baseUrl}/new`, payload);
    return resp.deployment;
  }

  /**
   * Upload project files for an existing deployment.
   * Supports a single file or multiple files. Arrays are sent as files[]; a single file as files.
   *
   * @param params Deployment id (any accepted alias) and the file(s) to upload.
   * @returns Upload result with URLs and counters.
   */
  async uploadFiles(params: IdAliases & { files: File | Blob | (File | Blob)[] }): Promise<UploadFilesResponse> {
    const id = pickDeploymentId(params);
    const form = new FormData();
    form.append('application_deployment_id', String(id));

    const { files } = params;
    if (Array.isArray(files)) {
      if (files.length === 0) throw new Error('At least one file must be provided');
      for (const f of files) {
        form.append('files[]', f as any);
      }
    } else {
      form.append('files', files as any);
    }

    return httpClient.post<UploadFilesResponse>(`${this.baseUrl}/upload-files`, form);
  }

  /**
   * Trigger the deploy process for an existing deployment.
   * Optional department can be provided.
   *
   * @param params Deployment id (any accepted alias) and optional department.
   * @returns Deploy manager response.
   */
  async deploy(params: IdAliases & { department?: string }): Promise<DeployResponse> {
    const id = pickDeploymentId(params);
    const payload: { application_deployment_id: number; department?: string } = {
      application_deployment_id: id,
    };
    if (params.department) payload.department = params.department;
    return httpClient.post<DeployResponse>(`${this.baseUrl}/deploy`, payload);
  }

  /**
   * List deployments filtered by MakerPath id (legacy listing endpoint).
   * @param makerPathId MakerPath identifier to filter deployments.
   * @returns Array of ApplicationDeployment items.
   */
  async getDeploymentsByMakerPath(makerPathId: number): Promise<ApplicationDeployment[]> {
    if (typeof makerPathId !== 'number') {
      throw new Error('makerPathId must be a number');
    }
    const url = `${this.listingUrl}?makerPath.id=${makerPathId}`;
    const data = await httpClient.get<ApplicationDeployment[]>(url);
    return Array.isArray(data) ? data : [];
  }
}

// Convenience singleton export
export const applicationDeploymentService = new ApplicationDeploymentService();
