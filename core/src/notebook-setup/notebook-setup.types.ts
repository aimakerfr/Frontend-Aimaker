/**
 * Notebook Setup Types
 * Types for the GET /api/v1/notebook/setup/{id} endpoint
 */

export interface NotebookSetupSource {
  id: number;
  name: string;
  type: string;
  objectId: number | null;
  relativePath: string | null;
  url: string | null;
  createdAt: string;
}

export interface NotebookSetupStep {
  stepId: number;
  status: 'failed' | 'success' | 'not_executed';
  resultText: Record<string, any> | null;
  executedAt: string | null;
}

export interface NotebookSetupVariable {
  variableIndexNumber: number;
  variableName: string;
  variableValue: Record<string, any> | null;
}

export interface NotebookSetupIdentity {
  id: number;
  publicToken: string | null;
  publicEnabled: boolean;
  systemPrompt: string | null;
  modelName: string | null;
  provider: string | null;
  settings: Record<string, any> | null;
}

export interface SaveIdentityAssemblerRequest {
  makerPathId: number;
  systemPrompt?: string | null;
  modelName?: string | null;
  provider?: string | null;
  settings?: Record<string, any> | null;
}

export interface NotebookSetup {
  makerPath: {
    id: number;
    title: string;
    description: string;
    type: string;
    status: string;
    data: string | null;
    productLink: string | null;
    productStatus: string | null;
    editionUrl: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  rag: {
    id: number;
    cag: string | null;
    tool: {
      id: number;
      title: string;
    } | null;
  } | null;
  sources: NotebookSetupSource[];
  steps: NotebookSetupStep[];
  variables: NotebookSetupVariable[];
  identity: NotebookSetupIdentity | null;
}
