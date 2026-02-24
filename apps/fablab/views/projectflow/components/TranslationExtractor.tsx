import React, { useState, useCallback, useRef } from 'react';
import {
  Search,
  AlertCircle,
  Check,
  Loader2,
  Languages,
  Download,
  Database,
  Save,
  FolderOpen,
  Upload,
  FileCode,
  X
} from 'lucide-react';
import { httpClient } from '@core/api/http.client';
import { extractTextFromCode, extractTextFromHTML } from '../utils/astExtractor';

interface TranslationExtractorProps {
  makerPathId?: number;
  variableIndexNumber?: number;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
  onNextStep?: (currentStepId: number) => void;
  t?: any;
  required?: boolean;
}

const TranslationExtractor: React.FC<TranslationExtractorProps> = ({
  stepId,
  onMarkStepComplete,
}) => {
  // --- States ---
  const [loading, setLoading] = useState(false);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [showObjectLibrary, setShowObjectLibrary] = useState(false);
  const [objects, setObjects] = useState<any[]>([]);

  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [extractedVariables, setExtractedVariables] = useState<Record<string, string>>({});

  const [translations, setTranslations] = useState<any>({
    es: null,
    en: null,
    fr: null
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // --- Box 1: Source Management ---
  const loadObjects = useCallback(async () => {
    setLoadingObjects(true);
    try {
      const sources = await httpClient.get<any[]>('/api/v1/objects?type=CODE');
      setObjects(sources);
    } catch (error) {
      console.error('Error loading objects:', error);
    } finally {
      setLoadingObjects(false);
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setFileContent(e.target?.result as string);
    reader.readAsText(file);
    setExtractedVariables({});
    setTranslations({ es: null, en: null, fr: null });
  };

  const handleObjectSelect = (object: any) => {
    const content = object.data?.content || '';
    setFileContent(content);
    setFileName(object.name || object.title || 'source.tsx');
    setShowObjectLibrary(false);
    setExtractedVariables({});
    setTranslations({ es: null, en: null, fr: null });
  };

  const handleSaveSourceToLibrary = async () => {
    if (!fileContent) return;
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title', `Source_${fileName}_${new Date().getTime()}`);
      payload.append('type', 'CODE');
      payload.append('data', JSON.stringify({ content: fileContent }));
      await httpClient.post('/api/v1/objects/upload', payload);
      showSuccess('Fuente guardada en la Biblioteca');
    } catch (err: any) {
      setError('Error al guardar fuente: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // --- Box 2: Analysis & Translation ---
  const handleLocalExtract = useCallback(() => {
    if (!fileContent) return;
    setLoading(true);
    setError(null);
    try {
      let result: Record<string, string>;
      if (fileName.endsWith('.html')) {
        result = extractTextFromHTML(fileContent);
      } else {
        result = extractTextFromCode(fileContent, fileName);
      }
      setExtractedVariables(result);
      if (Object.keys(result).length === 0) {
        setError('No se encontraron textos extraíbles.');
      }
    } catch (err) {
      setError('Error en extracción: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  }, [fileContent, fileName]);

  const handleTranslateLanguage = async (lang: 'es' | 'en' | 'fr') => {
    if (Object.keys(extractedVariables).length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.post<any>('/api/v1/translation/translate-json', {
        variables: extractedVariables,
        target_lang: lang
      });
      const result = response.raw_translations?.[lang] || response.raw_translations;
      setTranslations((prev: any) => ({ ...prev, [lang]: result }));
      showSuccess(`Traducción a ${lang.toUpperCase()} generada`);
    } catch (err: any) {
      setError(`Error traduciendo a ${lang.toUpperCase()}: ` + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = (data: any, name: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Box 3: Final Saving ---
  const handleSaveResultToLibrary = async (lang: 'es' | 'en' | 'fr' | 'original') => {
    const data = lang === 'original' ? extractedVariables : translations[lang];
    if (!data) return;
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title', `Translation_${lang}_${fileName}_${new Date().getTime()}`);
      payload.append('type', 'JSON');
      payload.append('data', JSON.stringify({ content: JSON.stringify(data, null, 2) }));
      await httpClient.post('/api/v1/objects/upload', payload);
      showSuccess(`JSON ${lang} guardado en la Biblioteca`);
    } catch (err: any) {
      setError('Error al guardar resultado: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAllToProject = async () => {
    if (!translations.es || !translations.en || !translations.fr) {
      setError('Se requieren las 3 traducciones (ES, EN, FR) para aplicar al proyecto.');
      return;
    }
    setLoading(true);
    try {
      await httpClient.post('/api/v1/translation/save-to-project', {
        translations: { es: translations.es, en: translations.en, fr: translations.fr }
      });
      showSuccess('¡Traducciones aplicadas al código del proyecto!');
      if (stepId && onMarkStepComplete) onMarkStepComplete(stepId);
    } catch (err: any) {
      setError('Error al aplicar al proyecto: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center justify-between animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Check size={18} />
          {successMsg}
        </div>
      )}

      {/* BOX 1: SOURCE SELECTION */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><FileCode size={20} /></div>
            <h3 className="font-bold text-gray-900 dark:text-white">1. Fuente de Datos</h3>
          </div>
          {fileContent && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full truncate max-w-[200px]">
              {fileName}
            </span>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:bg-blue-50/30 group"
            >
              <Upload size={24} className="text-gray-400 group-hover:text-blue-500 mb-2" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Subir desde PC</span>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".tsx,.jsx,.js,.html" />
            </button>
            <button
              onClick={() => { setShowObjectLibrary(!showObjectLibrary); if (!showObjectLibrary) loadObjects(); }}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:bg-purple-50/30 group"
            >
              <Database size={24} className="text-gray-400 group-hover:text-purple-500 mb-2" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Desde Biblioteca</span>
            </button>
          </div>

          {showObjectLibrary && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Seleccionar Objeto</span>
                <button onClick={() => setShowObjectLibrary(false)}><X size={14} /></button>
              </div>
              {loadingObjects ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {objects.map(obj => (
                    <button key={obj.id} onClick={() => handleObjectSelect(obj)} className="w-full text-left p-2 bg-white dark:bg-gray-800 rounded border hover:border-blue-400 text-xs truncate">
                      {obj.title || obj.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {fileContent && (
            <button
              onClick={handleSaveSourceToLibrary}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Save size={16} /> Guardar Fuente en Objects Library
            </button>
          )}
        </div>
      </section>

      {/* BOX 2: ANALYSIS & TRANSLATION */}
      <section className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-opacity ${!fileContent ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Languages size={20} /></div>
            <h3 className="font-bold text-gray-900 dark:text-white">2. Análisis y Traducción</h3>
          </div>
          {Object.keys(extractedVariables).length > 0 && (
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {Object.keys(extractedVariables).length} llaves detectadas
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <button
              onClick={handleLocalExtract}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Search size={16} /> Analizar Código (Babel)
            </button>
            <button
              disabled={Object.keys(extractedVariables).length === 0}
              onClick={() => handleDownloadJson(extractedVariables, 'extracted_original.json')}
              className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-30"
            >
              <Download size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['es', 'en', 'fr'] as const).map(lang => (
              <div key={lang} className="space-y-2">
                <button
                  disabled={Object.keys(extractedVariables).length === 0}
                  onClick={() => handleTranslateLanguage(lang)}
                  className={`w-full py-4 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border-2 ${translations[lang]
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-purple-300'
                    } disabled:opacity-30`}
                >
                  <span className="uppercase text-lg">{lang}</span>
                  <span className="font-normal text-[9px]">Traducir a {lang === 'es' ? 'Español' : lang === 'en' ? 'Inglés' : 'Francés'}</span>
                  {translations[lang] && <Check size={14} className="mt-1" />}
                </button>
                {translations[lang] && (
                  <button
                    onClick={() => handleDownloadJson(translations[lang], `translation_${lang}.json`)}
                    className="w-full py-1 text-[10px] text-blue-600 hover:underline flex items-center justify-center gap-1"
                  >
                    <Download size={10} /> Descargar JSON {lang.toUpperCase()}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOX 3: FINAL SAVING */}
      <section className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-opacity ${Object.keys(extractedVariables).length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><Save size={20} /></div>
            <h3 className="font-bold text-gray-900 dark:text-white">3. Aplicar y Guardar</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => handleSaveResultToLibrary('original')}
              className="p-3 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-gray-50 text-center"
            >
              Guardar ORIGINAL en Objects
            </button>
            {(['es', 'en', 'fr'] as const).map(lang => (
              <button
                key={lang}
                disabled={!translations[lang]}
                onClick={() => handleSaveResultToLibrary(lang)}
                className="p-3 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-gray-50 text-center disabled:opacity-30"
              >
                Guardar {lang.toUpperCase()} en Objects
              </button>
            ))}
          </div>

          <button
            onClick={handleApplyAllToProject}
            disabled={!translations.es || !translations.en || !translations.fr}
            className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:grayscale"
          >
            <FolderOpen size={24} />
            APLICAR LOS 3 IDIOMAS AL PROYECTO
          </button>
          <p className="text-center text-[9px] text-gray-400 font-bold tracking-widest uppercase">Escribe simultáneamente en es.ts, en.ts y fr.ts</p>
        </div>
      </section>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6 border border-gray-100 dark:border-gray-700 scale-110">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin"></div>
              <Languages size={32} className="absolute inset-0 m-auto text-blue-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-black text-xl text-gray-900 dark:text-white">Procesando</p>
              <p className="text-sm text-gray-500 font-medium">Esto puede tardar unos segundos...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationExtractor;
