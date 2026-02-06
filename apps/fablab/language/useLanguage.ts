import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';

/**
 * Hook to access the language context.
 * Must be used within a LanguageProvider.
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};
