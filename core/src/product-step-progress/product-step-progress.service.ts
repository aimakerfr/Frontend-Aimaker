/**
 * Product Step Progress Service
 * Operations for managing product step progress
 */

import { httpClient } from '../api/http.client';
import type { 
  ProductStepProgress, 
  UpdateStepProgressRequest 
} from './product-step-progress.types';

const ENDPOINT = '/api/v1/product-step-progress';

/**
 * GET /api/v1/product-step-progress?product={productId}
 * Get all step progress for a product
 */
export const getProductStepProgress = async (productId: number): Promise<ProductStepProgress[]> => {
  return httpClient.get<ProductStepProgress[]>(`${ENDPOINT}?product=${productId}`);
};

/**
 * PUT /api/v1/product-step-progress/{productId}/{stepId}
 * Update or create step progress for a product
 */
export const updateProductStepProgress = async (
  data: UpdateStepProgressRequest
): Promise<ProductStepProgress> => {
  return httpClient.put<ProductStepProgress>(
    `${ENDPOINT}/${data.productId}/${data.stepId}`, 
    data
  );
};
