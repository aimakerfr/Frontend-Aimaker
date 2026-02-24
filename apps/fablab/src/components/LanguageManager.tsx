/**
 * Language Manager Component
 * Permite gestionar idiomas personalizados en el perfil del usuario
 */

import React, { useState } from 'react';
import { useLanguage } from '../../language/useLanguage';
import { 
  registerCustomLanguage, 
  getCustomLanguageCodes, 
  readJSONFile,
  getLanguageInfo,
  STANDARD_LANGUAGES
} from '../../language/languageManager';
import type { Translations } from '../../language/types';

export const LanguageManager: React.FC = () => {
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [languageCode, setLanguageCode] = useState('');
  const [languageName, setLanguageName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customLanguages, setCustomLanguages] = useState<string[]>(getCustomLanguageCodes());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddLanguage = async () => {
    setMessage(null);

    // Validations
    if (!languageCode.trim()) {
      setMessage({ type: 'error', text: t.profile.languageManager.errorInvalidJSON });
      return;
    }

    if (STANDARD_LANGUAGES.includes(languageCode as any)) {
      setMessage({ type: 'error', text: t.profile.languageManager.errorDuplicateCode });
      return;
    }

    if (!selectedFile) {
      setMessage({ type: 'error', text: t.profile.languageManager.uploadJSON });
      return;
    }

    try {
      // Read and parse JSON file
      const jsonContent = await readJSONFile(selectedFile);
      const translations = JSON.parse(jsonContent) as Translations;

      // Register the language
      registerCustomLanguage(languageCode, translations);

      // Save to localStorage for persistence
      const storedLanguages = JSON.parse(localStorage.getItem('customLanguages') || '{}');
      storedLanguages[languageCode] = {
        name: languageName || languageCode.toUpperCase(),
        translations,
      };
      localStorage.setItem('customLanguages', JSON.stringify(storedLanguages));

      // Update state
      setCustomLanguages(getCustomLanguageCodes());
      setMessage({ type: 'success', text: t.profile.languageManager.languageAdded });

      // Reset form
      setLanguageCode('');
      setLanguageName('');
      setSelectedFile(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding language:', error);
      setMessage({ type: 'error', text: t.profile.languageManager.errorInvalidJSON });
    }
  };

  const handleDeleteLanguage = (code: string) => {
    if (!confirm(t.profile.languageManager.deleteConfirm)) return;

    // Remove from localStorage
    const storedLanguages = JSON.parse(localStorage.getItem('customLanguages') || '{}');
    delete storedLanguages[code];
    localStorage.setItem('customLanguages', JSON.stringify(storedLanguages));

    // Update state
    setCustomLanguages(getCustomLanguageCodes());
    setMessage({ type: 'success', text: t.profile.languageManager.languageDeleted });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.profile.languageManager.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.profile.languageManager.subtitle}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {showAddForm ? t.common.cancel : t.profile.languageManager.addNew}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Language Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profile.languageManager.languageCode} *
              </label>
              <input
                type="text"
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value.toLowerCase())}
                placeholder={t.profile.languageManager.languageCodePlaceholder}
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profile.languageManager.languageName}
              </label>
              <input
                type="text"
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                placeholder={t.profile.languageManager.languageNamePlaceholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.profile.languageManager.uploadJSON} *
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-500">
                ✓ {selectedFile.name}
              </p>
            )}
          </div>

          <button
            onClick={handleAddLanguage}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t.profile.languageManager.addLanguage}
          </button>
        </div>
      )}

      {/* Custom Languages List */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t.profile.languageManager.availableLanguages}
        </h4>
        {customLanguages.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            {t.profile.languageManager.noCustomLanguages}
          </p>
        ) : (
          <div className="space-y-2">
            {customLanguages.map((code) => {
              const info = getLanguageInfo(code);
              return (
                <div
                  key={code}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {info.nativeName}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({code.toUpperCase()})
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteLanguage(code)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t.profile.languageManager.deleteLanguage}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
