/**
 * Product Types
 */

export type ProductType = 'architect_ai' | 'module_connector' | 'custom' | 'rag_chat_maker' | 'landing_page_maker' | 'image_generator_rag' | 'translation_maker' | 'style_transfer_maker' | 'api_key_maker' | 'api_key_html_injector' | 'profile_b2b_maker' | 'api_cost_manager' | 'app' | 'perplexity_search' | 'prompt_optimizer' | 'creation_path';
export type ProductStatus = 'active' | 'archived';

export interface Product {
  id: number;
  title: string;
  description: string;
  data: string | null;
  type: ProductType;
  status: ProductStatus;
  isPublic: boolean;
  isFavorite: boolean;
  productLink: string | null;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
  templateId: number | null;
  template?: {
    id: number;
    title: string;
    type: string;
  } | null;
  rag?: {
    id: number;
    cag: string;
    tool: {
      id: number;
      title: string;
    } | null;
  } | null;
}

export interface ProductsParams {
  type?: ProductType;
}

export interface ForkProductRequest {
  makerPathId: number;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  data?: string;
  status?: ProductStatus;
  isPublic?: boolean;
  isFavorite?: boolean;
}
