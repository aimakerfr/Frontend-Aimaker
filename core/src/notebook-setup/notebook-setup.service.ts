/**
 * Notebook Setup Service
 * Fetches the complete Chat RAG configuration for a MakerPath
 */

import { httpClient } from '../api/http.client';
import type { NotebookSetup, NotebookSetupIdentity, SaveIdentityAssemblerRequest } from './notebook-setup.types';

const ENDPOINT = '/api/v1/notebook/setup';
const IDENTITY_ENDPOINT = '/api/v1/identity-assembler';

/**
 * GET /api/v1/notebook/setup/{id}
 * Retrieve the full notebook configuration by MakerPath ID
 */
export const getNotebookSetup = async (makerPathId: number): Promise<NotebookSetup> => {
  return httpClient.get<NotebookSetup>(`${ENDPOINT}/${makerPathId}`);
};

/**
 * POST /api/v1/identity-assembler
 * Create or update the public identity (IdentityAssembler) for un MakerPath (upsert)
 */
export const saveIdentityAssembler = async (
  data: SaveIdentityAssemblerRequest
): Promise<NotebookSetupIdentity> => {
  return httpClient.post<NotebookSetupIdentity>(IDENTITY_ENDPOINT, data);
};
