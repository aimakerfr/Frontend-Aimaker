
export enum Visibility {
  PRIVATE = 'PRIVADO',
  PUBLIC = 'PÚBLICO'
}

export type ProjectType = 'landing page' | 'app' | 'automation';

export const DEFAULT_LANGUAGE = 'Français';

export interface PromptState {
  title: string;
  description: string;
  visibility: Visibility;
  category: string;
  isFavorite: boolean;
  language: string;
  projectType: ProjectType;
  deploymentUrl: string;
  context: string;
}
