
export enum Visibility {
  PRIVATE = 'PRIVÉ',
  PUBLIC = 'PUBLIC'
}

export interface PromptState {
  title: string;
  description: string;
  visibility: Visibility;
  category: string;
  isFavorite: boolean;
  language: string;
  promptBody: string;
  context: string;
  outputFormat: string;
}
