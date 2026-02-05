import { useState, useEffect, useCallback } from 'react';
import { ProfileService } from '@core/profile/profile.service';
import { translations, Language, Translations } from './translations';

const profileService = new ProfileService();

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language | string>('en');
  const [t, setT] = useState<Translations>(translations.en);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserLanguage = useCallback(async () => {
    try {
      const profile = await profileService.getProfile();
      const userLang = profile.uiLanguage || 'en';
      
      if (userLang.startsWith('http')) {
        // Fetch remote translation
        const response = await fetch(userLang);
        if (!response.ok) throw new Error('Failed to fetch remote translation');
        const remoteT = await response.json();
        
        setT(remoteT as Translations);
        setLanguage(userLang);
      } else {
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
