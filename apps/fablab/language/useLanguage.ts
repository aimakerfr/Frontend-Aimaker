import { useState, useEffect } from 'react';
import { ProfileService } from '@core/profile/profile.service';
import type { Language } from './translations';

const profileService = new ProfileService();

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserLanguage();
  }, []);

  const loadUserLanguage = async () => {
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
  };

  return { language, isLoading };
};
