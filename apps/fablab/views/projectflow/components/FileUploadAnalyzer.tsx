/* ⚠️ WARNING: Potential syntax issues detected:
 * - Potential invalid operators detected
 * Please review the code carefully before using.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { Upload, File, Check, X, Database, FileCode } from 'lucide-react';
import { putMakerPathVariable } from '@core/maker-path-variables';
import { httpClient } from '@core/api/http.client';

interface FileUploadAnalyzerProps {
  makerPathId?: number;
  variableIndexNumber?: number;
  variableName?: string;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
  onNextStep?: (currentStepId: number) => void;
  t?: any;
  required?: boolean;
}

const FileUploadAnalyzer: React.FC<FileUploadAnalyzerProps> = ({
  makerPathId,
  variableIndexNumber,
  variableName,
  stepId,
  onMarkStepComplete,
  onNextStep,
  required,
}) => {
  const { t } = useLanguage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showObjectLibrary, setShowObjectLibrary] = useState(false);
  const [objects, setObjects] = useState<any[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load objects from library (CODE and HTML types)
  const loadObjects = useCallback(async () => {
    setLoadingObjects(true);
    try {
      // Fetch both tags
      const [codeRes, htmlRes] = await Promise.all([
        httpClient.get<any[]>((t.fileUploadAnalyzerTranslations?.['text_1'] ?? '/api/v1/objects?type=CODE')),
        httpClient.get<any[]>((t.fileUploadAnalyzerTranslations?.['text_2'] ?? '/api/v1/objects?type=HTML'))
      ]);
      const merged = [...(Array.isArray(codeRes) ? codeRes : []), ...(Array.isArray(htmlRes) ? htmlRes : [])];
      setObjects(merged.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error((t.fileUploadAnalyzerTranslations?.['text_3'] ?? 'Error loading objects:'), error);
      // fallback
      try {
        const res = await httpClient.get<any[]>('/api/v1/objects/all');
        const filtered = res.filter(o => o.type === 'CODE' || o.type === 'HTML');
        setObjects(filtered);
      } catch (innerError) {
        console.error((t.fileUploadAnalyzerTranslations?.['text_4'] ?? 'Failed to load objects'));
      }
    } finally {
      setLoadingObjects(false);
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Read file content
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleObjectSelect = async (object: any) => {
    try {
      setLoading(true);
      // Robust content extraction
      let content = '';
      if (object.data?.content) {
        content = typeof object.data.content === 'string' ? object.data.content : JSON.stringify(object.data.content, null, 2);
      } else if (typeof object.data === 'string') {
        content = object.data;
      }

      if (!content) {
        console.warn((t.fileUploadAnalyzerTranslations?.['text_5'] ?? 'Object has no content in data field'));
      }

      setFileContent(content);
      const name = object.title || object.name || 'object';
      const fileBlob = new Blob([content], { type: 'text/plain' });
      // Create a proper File object so it has a valid size property
      const file = new window.File([fileBlob], name, { type: 'text/plain' });
      setSelectedFile(file);
      setShowObjectLibrary(false);
    } catch (error) {
      console.error((t.fileUploadAnalyzerTranslations?.['text_6'] ?? 'Error loading object content:'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fileContent || !makerPathId || variableIndexNumber === undefined) return;

    setLoading(true);
    try {
      const ext = selectedFile?.name.split('.').pop()?.toLowerCase() || 'txt';
      const detectedType = (ext === 'html' || ext === 'htm') ? 'HTML' : 'CODE';

      // Save file content to maker path variable
      await putMakerPathVariable({
        makerPathId,
        variableIndexNumber,
        variableName: variableName || 'uploaded_file_content',
        variableValue: {
          fileName: selectedFile?.name || 'uploaded_file',
          content: fileContent,
          fileType: ext.toUpperCase(),
        },
      });

      // Optionally save to object library
      if (saveToLibrary && selectedFile) {
        try {
          const payload = new FormData();
          payload.append('title', selectedFile.name);
          payload.append('type', detectedType);
          payload.append('data', JSON.stringify({ content: fileContent }));

          await httpClient.post('/api/v1/objects/upload', payload);
          console.log((t.fileUploadAnalyzerTranslations?.['text_7'] ?? 'Saved to object library successfully as'), detectedType);
        } catch (error) {
          console.error((t.fileUploadAnalyzerTranslations?.['text_8'] ?? 'Error saving to object library:'), error);
        }
      }

      if (stepId && onMarkStepComplete) {
        onMarkStepComplete(stepId);
      }
      if (stepId && onNextStep) {
        onNextStep(stepId);
      }
    } catch (error) {
      console.error((t.fileUploadAnalyzerTranslations?.['text_9'] ?? 'Error analyzing file:'), error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Título del paso */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{t.fileUploadAnalyzerTranslations?.['text_10']}</h3>
        <p className="text-sm text-gray-600">{t.fileUploadAnalyzerTranslations?.['text_11']}</p>
      </div>

      {/* Required indicator */}
      {required && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-red-500">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          REQUIRED
        </div>
      )}

      {/* Botón de Biblioteca */}
      <button
        onClick={() => {
          setShowObjectLibrary(!showObjectLibrary);
          if (!showObjectLibrary && objects.length === 0) {
            loadObjects();
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        <Database size={16} />
        <span className="text-sm font-medium">
          {showObjectLibrary ? 'Ocultar Biblioteca' : t.fileUploadAnalyzerTranslations?.['text_13'] ?? (t.fileUploadAnalyzerTranslations?.['text_13'] ?? 'Cargar desde Biblioteca')}
        </span>
      </button>

      {/* Modal de Biblioteca */}
      {showObjectLibrary && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.fileUploadAnalyzerTranslations?.['text_14']}</h3>
            <button
              onClick={() => setShowObjectLibrary(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          {loadingObjects ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.fileUploadAnalyzerTranslations?.['text_15']}</p>
          ) : objects.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.fileUploadAnalyzerTranslations?.['text_16']}</p>
          ) : (
            <div className="space-y-2">
              {objects.map((obj, index) => (
                <button
                  key={`obj-${obj.id}-${index}`}
                  onClick={() => handleObjectSelect(obj)}
                  className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileCode size={16} className="text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {obj.title || obj.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {obj.type} · {obj.createdAt ? new Date(obj.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsx,.tsx,.html,.js,.ts"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <Check size={24} />
              <File size={24} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-full px-2">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >{t.fileUploadAnalyzerTranslations?.['text_17']}</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <Upload size={48} className="text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t.fileUploadAnalyzerTranslations?.['text_18']}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.fileUploadAnalyzerTranslations?.['text_19']}</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >{t.fileUploadAnalyzerTranslations?.['text_20']}</button>
          </div>
        )}
      </div>

      {selectedFile && (
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
          />
          <span>{t.fileUploadAnalyzerTranslations?.['text_21']}</span>
        </label>
      )}

      {/* Botón Analizar */}
      {selectedFile && fileContent && (
        <div className="pt-2">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>{t.fileUploadAnalyzerTranslations?.['text_22']}</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>{t.fileUploadAnalyzerTranslations?.['text_23']}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadAnalyzer;
