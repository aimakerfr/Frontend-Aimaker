import { useState, useEffect, useCallback } from 'react';
import { ProfileService } from '@core/profile/profile.service';
import type { Language } from './types';

const profileService = new ProfileService();

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  const loadUserLanguage = useCallback(async () => {
    try {
      const profile = await profileService.getProfile();
      const userLang = profile.uiLanguage || 'en';
      setLanguage(userLang as Language);
    } catch (error) {
      console.error('Error loading user language:', error);
      // Default to 'en' if there's an error
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

  return { language, isLoading, refreshLanguage: loadUserLanguage };
};
