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
  const [isLoading, setIsLoading] = useState(false); // Changed to false for instant load
  const [hasLoadedFromProfile, setHasLoadedFromProfile] = useState(false);

  const loadUserLanguage = useCallback(async (forceLoad: boolean = false) => {
    // Only load user language if user is authenticated
    const token = tokenStorage.get();
    if (!token) {
      // User not authenticated, use default language
      const defaultT = translations.en;
      setT(defaultT);
      setLanguage('en');
      
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, 'en');
        localStorage.setItem(STORAGE_TRANSLATIONS_KEY, JSON.stringify(defaultT));
      } catch (e) {
        console.warn('Failed to save language to localStorage:', e);
      }
      
      return;
    }

    try {
      const profile = await profileService.getProfile();
      const userLang = profile.uiLanguage || 'en';
      
      // Skip update if language hasn't changed (but always load on first mount)
      const currentLang = localStorage.getItem(STORAGE_KEY);
      if (!forceLoad && hasLoadedFromProfile && currentLang === userLang) {
        return; // No change needed
      }
      
      // Mark that we've loaded from profile at least once
      setHasLoadedFromProfile(true);
      
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
            const fallbackT = translations.en;
            setT(fallbackT);
            setLanguage('en');
            
            try {
              localStorage.setItem(STORAGE_KEY, 'en');
              localStorage.setItem(STORAGE_TRANSLATIONS_KEY, JSON.stringify(fallbackT));
            } catch (e) {
              console.warn('Failed to save language to localStorage:', e);
            }
          }
        } catch (error) {
          console.error(`Error loading custom language '${userLang}':`, error);
          // Fallback to English
          const fallbackT = translations.en;
          setT(fallbackT);
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
      // Don't change current language on error to avoid flickering
    }
  }, [hasLoadedFromProfile]);

  useEffect(() => {
    // Force load on first mount
    loadUserLanguage(true);

    // Listen for language change events for immediate updates (force reload)
    const handleLanguageChange = () => {
      loadUserLanguage(true);
    };

    window.addEventListener('languageChanged', handleLanguageChange);

    // BroadcastChannel: sync language changes across tabs immediately
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('aimaker_language_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'language-changed') {
            loadUserLanguage(true);
          }
        };
      } catch {
        // BroadcastChannel not available (e.g., Safari private mode)
      }
    }

    // Visibility API: reload language when user returns to the tab
    // Covers: changes from other devices, admin changes, new custom languages
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only reload if we haven't checked recently (avoid rapid switches)
        const lastCheck = localStorage.getItem('aimaker_language_last_check');
        const now = Date.now();
        if (!lastCheck || now - parseInt(lastCheck, 10) > 5000) {
          loadUserLanguage(false);
          localStorage.setItem('aimaker_language_last_check', now.toString());
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      bc?.close();
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
