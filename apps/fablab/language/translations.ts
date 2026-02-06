import { Language, Translations } from './locales/types';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';

export type { Language, Translations };

export const translations: Record<Language, Translations> = {
  en,
  es,
  fr,
};
