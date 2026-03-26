import { httpClient, HttpClientError } from '@core/api/http.client';

// Response shape based on backend spec in documents
export type CreateDatabaseResponse = {
  status: 'success';
  driver: string;
  name: string;
  user: string;
  pass: string;
  url: string;
};

export type CreateDatabaseRequest = {
  deploymentId: number; // application_deployment_id
  name: string; // base name, must match ^[a-z0-9_]{1,63}$
};

const NAME_REGEX = /^[a-z0-9_]{1,63}$/;

export function validateDatabaseName(name: string): boolean {
  return NAME_REGEX.test(name);
}

/**
 * Create a database for an Application Deployment.
 * Throws HttpClientError on HTTP/api error and Error on validation error.
 */
export async function createDeploymentDatabase(
  params: CreateDatabaseRequest
): Promise<CreateDatabaseResponse> {
  const name = params.name?.trim();

  if (!params?.deploymentId || !Number.isFinite(params.deploymentId)) {
    throw new Error('deploymentId is required');
  }

  if (!name) {
    throw new Error('Database name is required');
  }

  if (!validateDatabaseName(name)) {
    throw new Error('Invalid database name. Use lowercase letters, numbers, and underscores (max 63 chars).');
  }

  try {
    // Backend accepts multiple field names; we send the canonical one from spec
    return await httpClient.post<CreateDatabaseResponse>(
      '/api/v1/application-deployment/create-database',
      {
        application_deployment_id: params.deploymentId,
        name,
      },
      true
    );
  } catch (e) {
    // Re-throw with a friendly message while preserving HttpClientError when present
    if (e instanceof HttpClientError) {
      throw new HttpClientError(e.code, e.message, e.status);
    }
    throw e as Error;
  }
}
