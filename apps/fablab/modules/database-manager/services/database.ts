// Local thin wrapper to keep the module self-contained, mirroring makerPath.service.ts style
import { httpClient } from '@core/api/http.client';

export type ClearSchemaParams = {
  deploymentId: number;
  name: string;
};

export type ClearSchemaResponse = {
  status: 'success' | 'noop' | 'error';
  driver?: string;
  name?: string;
  error?: string;
  code?: string;
};

const ENDPOINT = '/api/v1/application-deployment/database/clear-schema';
const EXECUTE_SQL_ENDPOINT = '/api/v1/application-deployment/database/execute-sql';
const SHOW_TABLES_ENDPOINT = '/api/v1/application-deployment/database/show-tables';

/**
 * Drop and recreate a database/schema for a given deployment.
 * Uses the shared core httpClient for consistent auth, headers, and error handling.
 */
export async function clearDatabaseSchema(
  params: ClearSchemaParams
): Promise<ClearSchemaResponse> {
  const payload = {
    application_deployment_id: params.deploymentId,
    name: params.name,
  };

  return httpClient.post<ClearSchemaResponse>(ENDPOINT, payload);
}

// --- Execute SQL ---
export type ExecuteSqlParams = {
  deploymentId: number;
  sql: string;
};

export type ExecuteSqlResponse = {
  status: 'success';
  executed: boolean; // true if SQL executed; false if service couldn’t execute (e.g., error/invalid config)
  // Compact textual summary propagated by backend. For SELECT-like queries,
  // includes a small JSON preview of the first rows (up to 10).
  resultText?: string;
};

/**
 * Execute a raw SQL text on the database associated with an ApplicationDeployment.
 * Backend now returns a compact `resultText` summarizing the outcome and, for
 * SELECT/SHOW/DESCRIBE/EXPLAIN, a small JSON preview of rows.
 */
export async function executeSql(
  params: ExecuteSqlParams
): Promise<ExecuteSqlResponse> {
  const payload = {
    application_deployment_id: params.deploymentId,
    sql: params.sql,
  };

  return httpClient.post<ExecuteSqlResponse>(EXECUTE_SQL_ENDPOINT, payload);
}

// Convenience helper: SHOW TABLES (dedicated endpoint). Returns a large text with one table per line.
export async function showTables(params: { deploymentId: number }): Promise<ExecuteSqlResponse> {
  const payload = {
    application_deployment_id: params.deploymentId,
  };
  return httpClient.post<ExecuteSqlResponse>(SHOW_TABLES_ENDPOINT, payload);
}
