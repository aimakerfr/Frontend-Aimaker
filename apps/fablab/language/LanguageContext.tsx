import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ProfileService } from '@core/profile/profile.service';
import { httpClient, tokenStorage } from '@core/api/http.client';
import { translations, Language, Translations } from './translations';

const profileService = new ProfileService();

/**
 * Deep merges two objects. Used to fill missing keys in custom translations
 * with default values from the base language.
 */
const deepMerge = (target: any, source: any) => {
  const output = { ...target };
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

interface LanguageContextType {
  language: Language | string;
  t: Translations;
  isLoading: boolean;
  refreshLanguage: () => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'aimaker_language';
const STORAGE_TRANSLATIONS_KEY = 'aimaker_translations';

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Try to load from localStorage first to prevent flickering
  const getInitialLanguage = (): Language | string => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || 'en';
    } catch {
      return 'en';
    }
  };

  const getInitialTranslations = (): Translations => {
    try {
      const stored = localStorage.getItem(STORAGE_TRANSLATIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // If parsing fails, fall back to default
    }
    return translations.en;
  };

  const [language, setLanguage] = useState<Language | string>(getInitialLanguage);
  const [t, setT] = useState<Translations>(getInitialTranslations);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserLanguage = useCallback(async () => {
    // Only load user language if user is authenticated
    const token = tokenStorage.get();
    if (!token) {
      // User not authenticated, use default language
      setT(translations.en);
      setLanguage('en');
      setIsLoading(false);
      return;
    }

    try {
      const profile = await profileService.getProfile();
      const userLang = profile.uiLanguage || 'en';
      
      let remoteT: any = null;

      // Check if it's a standard language (es, en, fr)
      if (userLang === 'es' || userLang === 'en' || userLang === 'fr') {
        const langCode = userLang as Language;
        const selectedTranslations = translations[langCode] || translations.en;
        setT(selectedTranslations);
        setLanguage(langCode);
        
        // Persist to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, langCode);
          localStorage.setItem(STORAGE_TRANSLATIONS_KEY, JSON.stringify(selectedTranslations));
        } catch (e) {
          console.warn('Failed to save language to localStorage:', e);
        }
      } else {
        // Custom language - fetch from new endpoint
        try {
          const response = await httpClient.get<any>(`/api/v1/translation/language/${userLang}`);
          remoteT = response.translations || response.data;
          
          if (remoteT) {
            // MERGE with default English to avoid crashes from missing keys
            const mergedT = deepMerge(translations.en, remoteT);
            setT(mergedT as Translations);
            setLanguage(userLang);
            
            // Persist to localStorage
            try {
              localStorage.setItem(STORAGE_KEY, userLang);
              localStorage.setItem(STORAGE_TRANSLATIONS_KEY, JSON.stringify(mergedT));
            } catch (e) {
              console.warn('Failed to save language to localStorage:', e);
            }
          } else {
            // Fallback to English if custom language has no data
            setT(translations.en);
            setLanguage('en');
          }
        } catch (error) {
          console.error(`Error loading custom language '${userLang}':`, error);
          // Fallback to English
          setT(translations.en);
          setLanguage('en');
          
          // Clear localStorage on error
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_TRANSLATIONS_KEY);
          } catch (e) {
            // Ignore
          }
        }
      }
    } catch (error) {
      console.error('Error loading user language:', error);
      // Default to 'en' if there's an error
      setT(translations.en);
      setLanguage('en');
      
      // Clear localStorage on error
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TRANSLATIONS_KEY);
      } catch (e) {
        // Ignore
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserLanguage();

    // Poll for language changes every 30 seconds
    const intervalId = setInterval(() => {
      loadUserLanguage();
    }, 30000);

    // Listen for language change events for immediate updates
    const handleLanguageChange = () => {
      loadUserLanguage();
    };

    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [loadUserLanguage]);

  const value: LanguageContextType = {
    language,
    t,
    isLoading,
    refreshLanguage: loadUserLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
