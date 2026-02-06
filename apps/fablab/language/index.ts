import { Language, Translations } from './types';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';

export const translations: Record<Language, Translations> = {
  en,
  es,
  fr,
};

export type { Language, Translations };
