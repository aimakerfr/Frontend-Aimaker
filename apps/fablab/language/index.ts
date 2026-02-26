import { Language, Translations } from './types';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { getCustomLanguage, loadAddedLanguages } from './languageManager';

// Standard translations
const standardTranslations: Record<string, Translations> = {
  en: en as Translations,
  es: es as Translations,
  fr: fr as Translations,
};

// Legacy export for backward compatibility
export const translations: Record<string, Translations> = standardTranslations;

/**
 * Get translations for a specific language
 * Checks standard languages first, then custom languages
 * Falls back to English if language not found
 */
export function getTranslations(language: Language): Translations {
  // Check standard languages first
  if (standardTranslations[language]) {
    return standardTranslations[language];
  }
  
  // Check custom languages
  const customTranslation = getCustomLanguage(language);
  if (customTranslation) {
    return customTranslation as Translations;
  }
  
  // Fallback to English
  return standardTranslations.en;
}

/**
 * Initialize the language system
 * Loads custom languages from addedLanguages/ folder
 * Call this on app startup
 */
export async function initializeLanguages(): Promise<void> {
  try {
    await loadAddedLanguages();
    console.log('✅ Language system initialized');
  } catch (error) {
    console.error('❌ Error initializing languages:', error);
  }
}

export type { Language, Translations };
