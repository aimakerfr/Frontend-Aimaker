/**
 * Translation Manager Modal - Gestión de idiomas personalizados
 * Ubicación: Maker Path
 * Funcionalidad: Descargar template completo y cargar traducciones externas
 */

import React, { useState } from 'react';
import { X, Download, Upload, Check, AlertCircle } from 'lucide-react';
import { en } from '../../../language/locales/en';
import { getAvailableLanguages } from '../../../language/languageManager';
import type { LanguageInfo } from '../../../language/languageManager';
import { httpClient } from '@core/api/http.client';

interface TranslationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TranslationManagerModal: React.FC<TranslationManagerModalProps> = ({ isOpen, onClose }) => {
  const [languageCode, setLanguageCode] = useState('');
  const [languageName, setLanguageName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageInfo[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setAvailableLanguages(getAvailableLanguages());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Descargar template completo (en.ts)
  const handleDownloadTemplate = () => {
    const json = JSON.stringify(en, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fablab_template_en.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: '✓ Template descargado. Tradúcelo externamente y súbelo aquí.' });
  };

  // Manejar cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage(null);
    }
  };

  // Cargar traducción al backend
  const handleUploadTranslation = async () => {
    if (!languageCode.trim() || !languageName.trim() || !selectedFile) {
      setMessage({ type: 'error', text: '❌ Completa todos los campos' });
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const jsonContent = e.target?.result as string;
          const translations = JSON.parse(jsonContent);

          // Enviar al backend
          await httpClient.post('/api/v1/custom-languages', {
            code: languageCode.toLowerCase(),
            name: languageName,
            translations: translations
          });

          setMessage({ type: 'success', text: `✓ Idioma "${languageName}" agregado exitosamente` });
          
          // Limpiar formulario
          setLanguageCode('');
          setLanguageName('');
          setSelectedFile(null);
          
          // Recargar página para actualizar idiomas disponibles
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error: any) {
          setMessage({ type: 'error', text: `❌ ${error.message || 'Error al procesar el JSON'}` });
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setMessage({ type: 'error', text: '❌ Error al leer el archivo' });
        setUploading(false);
      };

      reader.readAsText(selectedFile);
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ ${error.message || 'Error al cargar traducción'}` });
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Idiomas</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Descarga el template completo, tradúcelo externamente y súbelo aquí
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sección 1: Descargar Template */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Download size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  1. Descargar Template Completo
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Descarga el archivo JSON con todas las variables de traducción del FabLab (inglés).
                  Luego podrás traducirlo con ChatGPT, DeepL u otra herramienta.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download size={18} />
                  Descargar fablab_template_en.json
                </button>
              </div>
            </div>
          </div>

          {/* Sección 2: Cargar Traducción */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Upload size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  2. Cargar Traducción Externa
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Una vez traducido, carga el archivo JSON aquí para agregar el nuevo idioma al sistema.
                </p>

                <div className="space-y-4">
                  {/* Código de idioma */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código de Idioma (ISO 639-1) *
                    </label>
                    <input
                      type="text"
                      value={languageCode}
                      onChange={(e) => setLanguageCode(e.target.value)}
                      placeholder="Ej: de, pt, it, ja, zh"
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  {/* Nombre del idioma */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del Idioma *
                    </label>
                    <input
                      type="text"
                      value={languageName}
                      onChange={(e) => setLanguageName(e.target.value)}
                      placeholder="Ej: Deutsch, Português, Italiano"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  {/* Archivo JSON */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Archivo JSON Traducido *
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/50 dark:file:text-purple-300"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Archivo seleccionado: {selectedFile.name}
                      </p>
                    )}
                  </div>

                  {/* Botón cargar */}
                  <button
                    onClick={handleUploadTranslation}
                    disabled={uploading || !languageCode || !languageName || !selectedFile}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>Cargando...</>
                    ) : (
                      <>
                        <Upload size={18} />
                        Cargar y Agregar Idioma
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
            }`}>
              {message.type === 'success' ? (
                <Check size={20} className="text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
              )}
              <p className={`text-sm font-medium ${
                message.type === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Idiomas disponibles */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Idiomas Actualmente Disponibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableLanguages.map((lang: LanguageInfo) => (
                <div
                  key={lang.code}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                >
                  {lang.name} ({lang.code})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
