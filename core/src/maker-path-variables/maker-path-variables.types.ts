/**
 * Maker Path Variables - Types
 */

export interface CreateMakerPathVariableRequest {
  makerPathId: number; // Identifier of the maker path execution this variable belongs to.
  variableIndexNumber: number; // Index/position of the variable within the maker path execution.
  ragMultimodalSourceId: number; // Identifier of the RAG multimodal source used to compute/resolve this variable.
  variableName: string; // Name/key of the variable.
  variableValue: Record<string, any>; // JSON value of the variable.
}

export interface MakerPathVariableResponse {
  id: number;
  makerPathId: number;
  variableIndexNumber: number;
  ragMultimodalSourceId: number | null;
  variableName: string;
  variableValue: Record<string, any> | null;
  createdAt: string;
}
