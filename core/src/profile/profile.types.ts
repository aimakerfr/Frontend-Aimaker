export interface ProfileStats {
  totalTools: number;
  byType: {
    agent?: number;
    external_link?: number;
    prompt?: number;
    note_books?: number;
    project?: number;
    app?: number;
    perplexity_search?: number;
    vibe_coding?: number;
  };
}

export interface UserProfile {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  website?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  avatarFilename?: string;
  uiLanguage: 'fr' | 'en' | 'es';
  type?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  stats: ProfileStats;
}

export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  website?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  uiLanguage?: 'fr' | 'en' | 'es';
}

export { NotebookService } from '../notebooks/notebook.service';
export type { Notebook, CreateNotebookData, UpdateNotebookData } from '../notebooks/notebook.service';
