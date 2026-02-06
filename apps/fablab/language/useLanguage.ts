import { useState, useEffect, useCallback } from 'react';
import { ProfileService } from '@core/profile/profile.service';
import { httpClient } from '@core/api/http.client';
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

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language | string>('en');
  const [t, setT] = useState<Translations>(translations.en);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserLanguage = useCallback(async () => {
    try {
      const profile = await profileService.getProfile();
      const userLang = profile.uiLanguage || 'en';
      
      let remoteT: any = null;

      if (userLang.startsWith('rag:')) {
        // Fetch from API using ID (avoids CORS)
        const id = userLang.split(':')[1];
        const response = await httpClient.get<{ content: string }>(`/api/v1/notebook-sources/${id}/content`);
        remoteT = JSON.parse(response.content);
      } else if (userLang.startsWith('http')) {
        // Fetch remote translation (kept for compatibility)
        const response = await fetch(userLang);
        if (!response.ok) throw new Error('Failed to fetch remote translation');
        remoteT = await response.json();
      }

      if (remoteT) {
        // MERGE with default English to avoid crashes from missing keys
        const mergedT = deepMerge(translations.en, remoteT);
        setT(mergedT as Translations);
        setLanguage(userLang);
      } else {
        // Standard language code
        const langCode = userLang as Language;
        setT(translations[langCode] || translations.en);
        setLanguage(langCode);
      }
    } catch (error) {
      console.error('Error loading user language:', error);
      // Default to 'en' if there's an error
      setT(translations.en);
      setLanguage('en');
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

  return { language, t, isLoading, refreshLanguage: loadUserLanguage };
};
