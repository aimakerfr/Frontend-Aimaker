/**
 * Product Step Progress Types
 */

export type StepStatus = 'failed' | 'success' | 'not_executed';

export interface ProductStepProgress {
  productId: number;
  stepId: number;
  resultText: any | null;
  executedAt: string | null;
  status: StepStatus;
}

export interface UpdateStepProgressRequest {
  productId: number;
  stepId: number;
  resultText?: any;
  status?: StepStatus;
  executedAt?: string;
}
