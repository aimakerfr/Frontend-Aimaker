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
  uiLanguage: string; 
  type?: string;
  category?: 'student' | 'teacher' | 'developer' | 'apprentice' | 'professional' | 'researcher' | 'other';
  level?: number;
  experiencePoints?: number;
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
  category?: 'student' | 'teacher' | 'developer' | 'apprentice' | 'professional' | 'researcher' | 'other';
  level?: number;
  experiencePoints?: number;
}

export { NotebookService } from '../notebooks/notebooks.service';
export type { Notebook } from '../notebooks/notebooks.service';
