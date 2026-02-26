import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';
import { translations } from './translations';

/**
 * Hook to access the language context.
 * Must be used within a LanguageProvider.
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    // During hot-reload or development, return a fallback to prevent crashes
    if (import.meta.env.DEV) {
      console.warn('useLanguage: Context is undefined. Using fallback. Make sure component is within LanguageProvider.');
      return {
        language: 'en' as const,
        t: translations.en,
        isLoading: false,
        refreshLanguage: async () => {},
      };
    }
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};
