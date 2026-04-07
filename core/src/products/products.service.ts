/**
 * Products Service
 * CRUD operations for Products resource
 */

import { httpClient } from '../api/http.client';
import type { 
  Product, 
  ProductsParams, 
  UpdateProductRequest,
  ProductType
} from './products.types';

const ENDPOINT = '/api/v1/products';

/**
 * GET /api/v1/products
 * List all products with optional filters
 */
export const getProducts = async (
  params: ProductsParams = {}
): Promise<Product[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.type) {
    queryParams.append('type', params.type);
  }
  
  const endpoint = queryParams.toString() 
    ? `${ENDPOINT}?${queryParams.toString()}` 
    : ENDPOINT;
  
  return httpClient.get<Product[]>(endpoint);
};

/**
 * GET /api/v1/products/{id}
 * Get a single product by ID
 */
export const getProduct = async (id: number): Promise<Product> => {
  return httpClient.get<Product>(`${ENDPOINT}/${id}`);
};

/**
 * GET /api/v1/products/public/{id}
 * Get a public product by ID (no authentication required)
 */
export const getPublicProduct = async (id: number): Promise<Product> => {
  return httpClient.get<Product>(`${ENDPOINT}/public/${id}`, { requiresAuth: false });
};

/**
 * GET /api/v1/products/check-published/{makerPathId}
 * Check if a product has already been published from this maker path
 * Returns the existing product or null if not found
 */
export const checkPublishedProduct = async (makerPathId: number): Promise<Product | null> => {
  try {
    return await httpClient.get<Product>(`${ENDPOINT}/check-published/${makerPathId}`);
  } catch (error: any) {
    // 404 means no published product exists yet
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * POST /api/v1/products/fork/{makerPathId}
 * Create a product instance by forking a maker path template
 */
export const forkProduct = async (makerPathId: number): Promise<Product> => {
  return httpClient.post<Product>(`${ENDPOINT}/fork/${makerPathId}`, {});
};

/**
 * POST /api/v1/products/create-from-template
 * Create a product directly from a template type without requiring a maker_path
 */
export const createProductFromTemplate = async (
  type: string,
  title: string,
  description?: string,
  options?: {
    productLink?: string;
    isPublic?: boolean;
  }
): Promise<Product> => {
  return httpClient.post<Product>(`${ENDPOINT}/create-from-template`, {
    type,
    title,
    description: description || '',
    ...(options?.productLink ? { productLink: options.productLink } : {}),
    ...(typeof options?.isPublic === 'boolean' ? { isPublic: options.isPublic } : {}),
  });
};

/**
 * PATCH /api/v1/products/{id}
 * Update an existing product (partial update)
 * Requires authentication (Bearer JWT)
 */
export const updateProduct = async (
  id: number,
  data: UpdateProductRequest
): Promise<Product> => {
  return httpClient.patch<Product>(`${ENDPOINT}/${id}`, data);
};

/**
 * DELETE /api/v1/products/{id}
 * Delete a product
 * Requires authentication (Bearer JWT)
 * Returns 204 No Content on success
 */
export const deleteProduct = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`${ENDPOINT}/${id}`);
};

/**
 * Returns the first product of the given type for the current user, creating it from
 * a template only if it does not exist. Uses localStorage to avoid accidental
 * duplicated creations across reloads.
 */
export const getOrCreateProductByType = async (
  type: ProductType,
  defaults: { title: string; description?: string }
): Promise<Product> => {
  const storageKey = `fixed_product_id:${type}`;

  // 1) Resolve by type first (user-scoped) to avoid noisy 404 from stale cached IDs.
  const existing = await getProducts({ type });
  if (Array.isArray(existing) && existing.length > 0) {
    const first = existing[0];
    if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, String(first.id));
    return first;
  }

  // 2) No product found for this type: clear stale cache and create once.
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKey);
  }

  const created = await createProductFromTemplate(type, defaults.title, defaults.description ?? '');
  if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, String(created.id));
  return created;
};
