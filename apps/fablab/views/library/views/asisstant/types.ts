
export enum Visibility {
  PRIVATE = 'PRIVADO',
  PUBLIC = 'PÚBLICO'
}

export interface PromptState {
  title: string;
  description: string;
  visibility: Visibility;
  category: string;
  isFavorite: boolean;
  language: string;
  instruction: string;
  context: string;
}
