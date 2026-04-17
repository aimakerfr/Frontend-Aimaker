import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Languages, Save, Globe, FileCode, Check, Loader2, Database, Download, AlertCircle, Sparkles, FileJson, ArrowRight } from 'lucide-react';
import { getProduct, getOrCreateProductByType } from '@core/products';
import { updateProductStepProgress, getProductStepProgress } from '@core/product-step-progress';
import { httpClient } from '@core/api/http.client';
import { extractTextFromCode, extractTextFromHTML } from '../projectflow/utils/astExtractor';
import { parse } from '@babel/parser';
import { useLanguage } from '@apps/fablab/language/useLanguage';

// Step IDs for translation workflow
const STEP_FILE_UPLOAD = 1;
const STEP_TRANSLATION_PROCESS = 2;
const STEP_TRANSLATION_SAVE = 3;

export const TranslationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const tr = (t.translationViewTranslations ?? t.translationView ?? {}) as Record<string, string>;
  const text = (key: string, fallback: string) => tr?.[key] ?? fallback;
  const fixedTitle = t.products.fixed.translationTitle || (tr?.['text_15'] ?? 'Traductor de archivos');
  const fixedDescription = t.products.fixed.translationDesc || (tr?.['text_16'] ?? 'Procesa y traduce archivos con i18n en un único flujo');

  // Product info
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Active step (1-4)
  const [activeStep, setActiveStep] = useState(1);

  // Step 1: File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showObjectLibrary, setShowObjectLibrary] = useState(false);
  const [objects, setObjects] = useState<any[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  // Step 2: Translation Processing
  const [sourceData, setSourceData] = useState<{ content: string; name: string; type: string } | null>(null);
  const [extractedKeys, setExtractedKeys] = useState<Record<string, string>>({});
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [processLoading, setProcessLoading] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);

  // Step 3: Translation Saver
  const [results, setResults] = useState<{
    es: any;
    en: any;
    fr: any;
    i18n_code: any;
  }>({ es: null, en: null, fr: null, i18n_code: null });
  const [savingToProject, setSavingToProject] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);

  // Step 4: Language Manager
  const [selectedLanguageFile, setSelectedLanguageFile] = useState<'en' | 'es' | 'fr'>('en');
  const [importedData, setImportedData] = useState<any>(null);
  const [languageCode, setLanguageCode] = useState('');
  const [languageName, setLanguageName] = useState('');
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [languageSuccess, setLanguageSuccess] = useState<string | null>(null);

  // Load product and previous progress
  useEffect(() => {
    const loadProductAndProgress = async () => {
      try {
        setLoading(true);
        let targetId: number | null = id ? parseInt(id) : null;
        if (!targetId) {
          const ensured = await getOrCreateProductByType('translation_maker', {
            title: t.products.fixed.translationTitle ?? 'Traductor de archivos',
            description: t.products.fixed.translationDesc ?? '',
          });
          targetId = ensured.id;
        }

        const productData = await getProduct(targetId);
        setProduct(productData);

        // Load previous progress for all steps
        await loadStepProgress(STEP_FILE_UPLOAD, productData.id);
        await loadStepProgress(STEP_TRANSLATION_PROCESS, productData.id);
        await loadStepProgress(STEP_TRANSLATION_SAVE, productData.id);
      } catch (error: any) {
        console.error('Error loading product:', error);
        if (error.message?.includes('404')) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };
    loadProductAndProgress();
  }, [id]);

  // Load step progress
  const loadStepProgress = async (stepId: number, productId?: number) => {
    if (!id && !productId) return;
    const resolvedId = productId ?? (id ? parseInt(id, 10) : undefined);
    if (!resolvedId) return;
    try {
      const allProgress = await getProductStepProgress(resolvedId);
      const progress = allProgress.find(p => p.stepId === stepId);
      if (progress?.resultText) {
        switch (stepId) {
          case STEP_FILE_UPLOAD:
            if (progress.resultText.fileName && progress.resultText.content) {
              const fileBlob = new Blob([progress.resultText.content], { type: 'text/plain' });
              const file = new File([fileBlob], progress.resultText.fileName, { type: 'text/plain' });
              setSelectedFile(file);
              setFileContent(progress.resultText.content);
              setSourceData({
                content: progress.resultText.content,
                name: progress.resultText.fileName,
                type: progress.resultText.fileType || 'CODE'
              });
            }
            break;
          case STEP_TRANSLATION_PROCESS:
            if (progress.resultText.extractedKeys) {
              setExtractedKeys(progress.resultText.extractedKeys);
            }
            if (progress.resultText.translations) {
              setTranslations(progress.resultText.translations);
              setResults({
                es: progress.resultText.translations.es,
                en: progress.resultText.translations.en,
                fr: progress.resultText.translations.fr,
                i18n_code: progress.resultText.i18n_code
              });
            }
            break;
          case STEP_TRANSLATION_SAVE:
            if (progress.resultText.projectPath) {
              setProjectPath(progress.resultText.projectPath);
            }
            break;
        }
      }
    } catch (error) {
      console.error(`Error loading progress for step ${stepId}:`, error);
    }
  };

  // Save step progress
  const saveStepProgress = async (stepId: number, data: any) => {
    if (!id) return;
    try {
      await updateProductStepProgress({
        productId: parseInt(id),
        stepId,
        resultText: data,
        status: 'success'
      });
    } catch (error) {
      console.error(`Error saving progress for step ${stepId}:`, error);
    }
  };

  // Load objects from library
  const loadObjects = useCallback(async () => {
    setLoadingObjects(true);
    try {
      const [codeRes, htmlRes] = await Promise.all([
        httpClient.get<any[]>('/api/v1/objects?type=CODE'),
        httpClient.get<any[]>('/api/v1/objects?type=HTML')
      ]);
      const merged = [...(Array.isArray(codeRes) ? codeRes : []), ...(Array.isArray(htmlRes) ? htmlRes : [])];
      setObjects(merged.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('Error loading objects:', error);
      try {
        const res = await httpClient.get<any[]>('/api/v1/objects/all');
        const filtered = res.filter(o => o.type === 'CODE' || o.type === 'HTML');
        setObjects(filtered);
      } catch (innerError) {
        console.error('Failed to load objects');
      }
    } finally {
      setLoadingObjects(false);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  // Handle object selection from library
  const handleObjectSelect = async (object: any) => {
    try {
      setUploadLoading(true);
      let content = '';
      if (object.data?.content) {
        content = typeof object.data.content === 'string' ? object.data.content : JSON.stringify(object.data.content, null, 2);
      } else if (typeof object.data === 'string') {
        content = object.data;
      }
      if (!content) {
        console.warn('Object has no content in data field');
      }
      setFileContent(content);
      const name = object.title || object.name || 'object';
      const fileBlob = new Blob([content], { type: 'text/plain' });
      const file = new File([fileBlob], name, { type: 'text/plain' });
      setSelectedFile(file);
      setShowObjectLibrary(false);
    } catch (error) {
      console.error('Error loading object content:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle file upload and analysis (Step 1)
  const handleAnalyzeFile = async () => {
    if (!fileContent || !id) return;
    setUploadLoading(true);
    try {
      const ext = selectedFile?.name.split('.').pop()?.toLowerCase() || 'txt';
      const detectedType = (ext === 'html' || ext === 'htm') ? 'HTML' : 'CODE';
      const data = {
        fileName: selectedFile?.name || 'uploaded_file',
        content: fileContent,
        fileType: ext.toUpperCase(),
      };

      // Save to step progress
      await saveStepProgress(STEP_FILE_UPLOAD, data);

      // Set source data for next step
      setSourceData({
        content: fileContent,
        name: data.fileName,
        type: detectedType
      });

      // Optionally save to object library
      if (saveToLibrary && selectedFile) {
        try {
          const payload = new FormData();
          payload.append('title', selectedFile.name);
          payload.append('type', detectedType);
          payload.append('data', JSON.stringify({ content: fileContent }));
          await httpClient.post('/api/v1/objects/upload', payload);
        } catch (error) {
          console.error('Error saving to object library:', error);
        }
      }

      // Auto-advance to next step
      setActiveStep(2);
      // Trigger extraction
      extractKeysFromSource(fileContent, data.fileName, detectedType);
    } catch (error) {
      console.error('Error analyzing file:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  // Extract keys from source (Step 2 - Part 1)
  const extractKeysFromSource = (content: string, name: string, type: string) => {
    try {
      const keys = type === 'HTML' ? extractTextFromHTML(content) : extractTextFromCode(content, name);
      setExtractedKeys(keys);
      // Save extracted keys
      saveStepProgress(STEP_TRANSLATION_PROCESS, { extractedKeys: keys });
    } catch (error) {
      console.error('Error extracting keys:', error);
      setProcessError(tr?.['text_2'] ?? 'Error extrayendo textos del archivo');
    }
  };

  // Translate all keys (Step 2 - Part 2)
  const handleTranslateAll = async () => {
    if (!extractedKeys || Object.keys(extractedKeys).length === 0) {
      setProcessError(tr?.['text_3'] ?? 'No hay llaves para traducir');
      return;
    }
    setProcessLoading(true);
    setProcessError(null);
    try {
      const response = await httpClient.post<any>('/api/v1/translation/translate-json', {
        variables: extractedKeys,
        target_lang: null // Null triggers all 3 (es, en, fr) in backend
      });
      const rawTranslations = response.raw_translations;
      setTranslations(rawTranslations);
      setResults({
        es: rawTranslations.es,
        en: rawTranslations.en,
        fr: rawTranslations.fr,
        i18n_code: null
      });

      // Save translations
      await saveStepProgress(STEP_TRANSLATION_PROCESS, {
        extractedKeys,
        translations: rawTranslations
      });

      setProcessSuccess(tr?.['text_4'] ?? 'Traducciones ES, EN y FR listas. Ahora puedes generar el código o guardar.');
      setTimeout(() => setProcessSuccess(null), 3000);
    } catch (err: any) {
      setProcessError(`Error en traducción masiva: ` + ((err.message ?? tr?.['text_5']) ?? 'Error desconocido'));
    } finally {
      setProcessLoading(false);
    }
  };

  // Generate i18n code (Step 2 - Part 3)
  const handleAutoI18n = async () => {
    if (!sourceData || !extractedKeys) return;
    setProcessLoading(true);
    try {
      let modifiedCode = sourceData.content;
      const isJSX = sourceData.name.endsWith('.tsx') || sourceData.name.endsWith('.jsx');
      const fileBaseName = sourceData.name.replace(/\.[^.]+$/, '');
      const normalizedBase = fileBaseName
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/[^a-zA-Z0-9]/g, '');
      const objectBase = normalizedBase ? normalizedBase.charAt(0).toLowerCase() + normalizedBase.slice(1) : 'source';
      const translationObject = `${objectBase}Translations`;

      // Sort keys by value length (desc) to avoid partial replacements
      const sortedKeys = Object.entries(extractedKeys).sort((a, b) => b[1].length - a[1].length);

      const isInsideExistingI18nExpression = (source: string, index: number): boolean => {
        const lookBehind = source.slice(Math.max(0, index - 120), index);
        const lookAround = source.slice(Math.max(0, index - 140), Math.min(source.length, index + 140));
        if (/tr\?\.\['[^']+'\]\s*\?\?\s*$/.test(lookBehind)) return true;
        if (/tr\?\.\['[^']+'\]\s*\?\?/.test(lookAround)) return true;
        return false;
      };

      const validateGeneratedCodeSyntax = (code: string, fileName: string): void => {
        const lower = fileName.toLowerCase();
        const plugins: any[] = [];

        if (lower.endsWith('.tsx')) {
          plugins.push('typescript', 'jsx');
        } else if (lower.endsWith('.ts')) {
          plugins.push('typescript');
        } else if (lower.endsWith('.jsx')) {
          plugins.push('jsx');
        }

        // Fail-safe: do not emit auto-generated code if parser detects syntax issues.
        parse(code, {
          sourceType: 'module',
          plugins,
          errorRecovery: false,
        });
      };

      let safeModeUsedOverall = false;

      if (isJSX) {
        // Add import if not present
        if (!modifiedCode.includes('useLanguage')) {
          const importStatement = `import { useLanguage } from '@apps/fablab/language/useLanguage';\n`;
          modifiedCode = importStatement + modifiedCode;
        }

        // Add useLanguage hook in component
        if (!modifiedCode.includes('const { t } = useLanguage()')) {
          // Match the component declaration first to avoid injecting the hook inside nested callbacks
          const componentPatterns = [
            /export\s+default\s+function\s+\w+\s*\([^)]*\)\s*{/,
            /export\s+function\s+\w+\s*\([^)]*\)\s*{/,
            /export\s+const\s+\w+[^=]*=\s*\([^)]*\)\s*=>\s*{/,
            /const\s+\w+[^=]*=\s*\([^)]*\)\s*=>\s*{/,
            /function\s+\w+\s*\([^)]*\)\s*{/
          ];

          let componentMatch: RegExpMatchArray | null = null;
          for (const pattern of componentPatterns) {
            componentMatch = modifiedCode.match(pattern);
            if (componentMatch) break;
          }
          
          if (componentMatch && componentMatch.index !== undefined) {
            const insertPos = componentMatch.index + componentMatch[0].length;
            modifiedCode = modifiedCode.slice(0, insertPos) + `\n  const { t } = useLanguage();\n  const tr = t.${translationObject};\n` + modifiedCode.slice(insertPos);
          }
        }

        const codeWithHooks = modifiedCode;

        const applyI18nReplacements = (source: string, allowGenericQuoted: boolean): string => {
          let code = source;
          const translatableAttrGroup = '(?:placeholder|title|alt|label|aria-label|aria-description|tooltip|hint|helperText)';

          for (const [key, value] of sortedKeys) {
            const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedFallback = value
              .replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/\r?\n/g, '\\n');

            if (allowGenericQuoted) {
              // Aggressive mode: quoted literals in JS/TS and JSX contexts.
              const quotedPattern = new RegExp(`(["'])${escaped}\\1`, 'g');
              code = code.replace(quotedPattern, (match, _quote, offset, innerSource) => {
                const start = typeof offset === 'number' ? offset : 0;
                if (isInsideExistingI18nExpression(innerSource, start)) return match;
                const expr = `tr?.['${key}'] ?? '${escapedFallback}'`;

                // Parenthesize in JS/TS contexts to avoid ||/&& with ?? precedence issues.
                // JSX attrs are normalized later (attr=(...) -> attr={(...)}) only for known translatable props.
                return `(${expr})`;
              });
            } else {
              // Safe mode: only JSX attribute literals (avoid TS type literals like 'text' | 'options').
              const jsxAttributePattern = new RegExp(`\\b(${translatableAttrGroup})\\s*=\\s*(["'])${escaped}\\2`, 'g');
              code = code.replace(jsxAttributePattern, `$1={(tr?.['${key}'] ?? '${escapedFallback}')}`);
            }

            // Replace JSX text nodes in both modes.
            const jsxTextPattern = new RegExp(`>\\s*${escaped}\\s*<`, 'g');
            code = code.replace(jsxTextPattern, (match, offset, innerSource) => {
              const start = typeof offset === 'number' ? offset : 0;
              if (isInsideExistingI18nExpression(innerSource, start)) return match;
              return `>{tr?.['${key}'] ?? '${escapedFallback}'}<`;
            });
          }

          // Safety normalization for known broken patterns from previous auto-runs.
          // Only wrap known translatable JSX props; never rewrite plain JS assignments.
          code = code
            .replace(
              new RegExp(`\\b(${translatableAttrGroup})=\\((tr\\?\\.\\['[^']+'\\]\\s*\\?\\?\\s*'((?:\\\\'|[^'])*)')\\)`, 'g'),
              '$1={($2)}'
            )
            .replace(
              /(\|\||&&)\s*tr\?\.\['([^']+)'\]\s*\?\?\s*'((?:\\'|[^'])*)'/g,
              "$1 (tr?.['$2'] ?? '$3')"
            );

          return code;
        };

        let syntaxFailureReason = '';
        let safeModeUsed = false;

        // 1) Try aggressive mode first.
        modifiedCode = applyI18nReplacements(codeWithHooks, true);
        try {
          validateGeneratedCodeSyntax(modifiedCode, sourceData.name);
        } catch (syntaxErr: any) {
          syntaxFailureReason = String(syntaxErr?.message || '').split('\n')[0];

          // 2) Fallback safe mode: JSX-only replacements.
          modifiedCode = applyI18nReplacements(codeWithHooks, false);
          try {
            validateGeneratedCodeSyntax(modifiedCode, sourceData.name);
            safeModeUsed = true;
          } catch (safeSyntaxErr: any) {
            const safeReason = String(safeSyntaxErr?.message || '').split('\n')[0];
            throw new Error(
              `Auto-i18n detectó sintaxis inválida y canceló la generación. Modo completo: ${syntaxFailureReason}. Modo seguro: ${safeReason}`
            );
          }
        }

        if (safeModeUsed) {
          safeModeUsedOverall = true;
          setProcessSuccess('Código i18n generado en modo seguro (solo JSX) para evitar errores de sintaxis.');
          setTimeout(() => setProcessSuccess(null), 4000);
        }
      }

      const i18nData = {
        fileName: `i18n_${sourceData.name}`,
        content: modifiedCode,
        fileType: sourceData.type
      };

      setResults(prev => ({ ...prev, i18n_code: i18nData }));

      // Save with i18n code
      await saveStepProgress(STEP_TRANSLATION_PROCESS, {
        extractedKeys,
        translations,
        i18n_code: i18nData
      });

      if (!safeModeUsedOverall) {
        setProcessSuccess(tr?.['text_7'] ?? 'Código i18n generado. Puedes descargarlo o aplicarlo al proyecto.');
        setTimeout(() => setProcessSuccess(null), 3000);
      }
    } catch (err: any) {
      setProcessError(`Error generando código i18n: ` + ((err.message ?? tr?.['text_5']) ?? 'Error desconocido'));
    } finally {
      setProcessLoading(false);
    }
  };

  // Download JSON (Step 3)
  const downloadJson = (lang: 'es' | 'en' | 'fr') => {
    const data = results[lang];
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${lang}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download original extracted keys
  const downloadOriginalJson = () => {
    const blob = new Blob([JSON.stringify(extractedKeys, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_original.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download i18n code
  const downloadI18nCode = () => {
    if (!results.i18n_code) return;
    const blob = new Blob([results.i18n_code.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = results.i18n_code.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply to project (Step 3)
  const handleApplyToProject = async () => {
    if (!results.i18n_code) {
      setSaveError('Debes ejecutar "Generar código i18n" en el Paso 2 antes de aplicar al proyecto.');
      return;
    }

    if (!results.es && !results.en && !results.fr) {
      setSaveError(tr?.['text_8'] ?? 'No hay traducciones para aplicar');
      return;
    }
    setSavingToProject(true);
    setSaveError(null);
    try {
      const sourceFileName = results.i18n_code.fileName.replace(/^i18n_/, '');

      const response = await httpClient.post<any>('/api/v1/translation/save-to-project', {
        translations: {
          es: results.es,
          en: results.en,
          fr: results.fr
        },
        source_file_name: sourceFileName,
        i18n_code: {
          content: results.i18n_code.content,
          fileName: sourceFileName
        }
      });

      setSaveSuccess(tr?.['text_10'] ?? '¡Todo aplicado correctamente!');
      setProjectPath(response.path || 'apps/fablab/language/locales/');
      await saveStepProgress(STEP_TRANSLATION_SAVE, { projectPath: response.path });
    } catch (err: any) {
      setSaveError(`Error aplicando al proyecto: ` + ((err.message ?? tr?.['text_5']) ?? 'Error desconocido'));
    } finally {
      setSavingToProject(false);
    }
  };

  // Save to library (Step 3)
  const saveToObjectLibrary = async (type: 'es' | 'en' | 'fr' | 'code') => {
    const data = type === 'code' ? results.i18n_code : results[type];
    if (!data) return;
    setSaveError(null);
    try {
      const payload = new FormData();
      if (type === 'code') {
        payload.append('title', data.fileName);
        payload.append('type', data.fileType || 'CODE');
        payload.append('data', JSON.stringify({ content: data.content }));
      } else {
        payload.append('title', `Translation ${type.toUpperCase()}`);
        payload.append('type', 'JSON');
        payload.append('data', JSON.stringify({ content: data }));
      }
      await httpClient.post('/api/v1/objects/upload', payload);
      setSaveSuccess(`Guardado en biblioteca (${type.toUpperCase()})`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(`Error guardando ${type.toUpperCase()}: ` + err.message);
    }
  };

  // Language Manager - Export language file
  const handleExportLanguage = async () => {
    setLanguageLoading(true);
    setLanguageError(null);
    try {
      const response = await httpClient.post<any>('/api/v1/translation/export-language', {
        language: selectedLanguageFile
      });
      
      const content = response.content || '';
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // El contenido es TypeScript, así que guardamos como .ts
      link.download = `${selectedLanguageFile}.ts`;
      link.click();
      URL.revokeObjectURL(url);
      setLanguageSuccess(`Archivo ${selectedLanguageFile}.ts descargado`);
      setTimeout(() => setLanguageSuccess(null), 3000);
    } catch (error: any) {
      setLanguageError(`Error exportando idioma: ${error.message || (tr?.['text_5'] ?? 'Error desconocido')}`);
    } finally {
      setLanguageLoading(false);
    }
  };

  // Language Manager - Import language file
  const handleImportLanguage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setImportedData(parsed);
        setLanguageSuccess(`Archivo ${file.name} cargado correctamente`);
        setTimeout(() => setLanguageSuccess(null), 3000);
      } catch (error) {
        setLanguageError(tr?.['text_11'] ?? 'Error parseando JSON. Verifica el formato.');
      }
    };
    reader.readAsText(file);
  };

  // Language Manager - Upload new language
  const handleUploadNewLanguage = async () => {
    if (!languageCode.trim() || !languageName.trim() || !importedData) {
      setLanguageError(tr?.['text_12'] ?? 'Completa todos los campos y carga un archivo');
      return;
    }
    setLanguageLoading(true);
    setLanguageError(null);
    try {
      await httpClient.post('/api/v1/translation/add-language', {
        language: languageCode.toLowerCase(),
        languageName: languageName,
        translations: importedData
      });
      setLanguageSuccess(`Idioma "${languageName}" agregado exitosamente`);
      setLanguageCode('');
      setLanguageName('');
      setImportedData(null);
      setTimeout(() => {
        setLanguageSuccess(null);
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setLanguageError(`Error agregando idioma: ${error.message || (tr?.['text_5'] ?? 'Error desconocido')}`);
    } finally {
      setLanguageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{tr?.['text_13'] ?? (tr?.['text_13'] ?? 'Producto no encontrado')}</h1>
          <button
            onClick={() => navigate('/dashboard/products')}
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >{tr?.['text_14'] ?? (tr?.['text_14'] ?? 'Volver a productos')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/context')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />{tr?.['text_14'] ?? (tr?.['text_14'] ?? 'Volver a productos')}</button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {fixedTitle}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {fixedDescription}
              </p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {product.isPublic ? (tr?.['text_17'] ?? 'Público') : (tr?.['text_18'] ?? 'Privado')}
            </div>
          </div>
        </div>

        {/* Step Navigator */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between gap-4">
            {[
              { id: 1, name: tr?.['text_19'] ?? 'Subir Archivo', icon: Upload },
              { id: 2, name: tr?.['text_20'] ?? 'Procesar', icon: Languages },
              { id: 3, name: tr?.['text_21'] ?? 'Guardar', icon: Save },
              { id: 4, name: tr?.['text_22'] ?? 'Idiomas', icon: Globe }
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    activeStep === step.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                      : 'bg-gray-50 dark:bg-gray-700/30 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <step.icon size={24} className={activeStep === step.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${activeStep === step.id ? 'text-purple-900 dark:text-purple-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    {step.name}
                  </span>
                </button>
                {index < 3 && (
                  <ArrowRight size={20} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
          {/* Step 1: File Upload */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileCode className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tr?.['text_23'] ?? (tr?.['text_23'] ?? 'Paso 1: Subir y Analizar Archivo')}</h3>
                  <p className="text-xs text-gray-500">{tr?.['text_24'] ?? (tr?.['text_24'] ?? 'Sube un JSX, TSX, HTML, o JS con textos hardcodeados.')}</p>
                </div>
              </div>

              {/* Library Button */}
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
                  {showObjectLibrary ? (tr?.['text_25'] ?? 'Ocultar Biblioteca') : (tr?.['text_26'] ?? 'Cargar desde Biblioteca')}
                </span>
              </button>

              {/* Object Library Modal */}
              {showObjectLibrary && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tr?.['text_27'] ?? (tr?.['text_27'] ?? 'Biblioteca de Objetos')}</h3>
                  </div>
                  {loadingObjects ? (
                    <p className="text-sm text-gray-500">{tr?.['text_28'] ?? (tr?.['text_28'] ?? 'Cargando...')}</p>
                  ) : objects.length === 0 ? (
                    <p className="text-sm text-gray-500">{tr?.['text_29'] ?? (tr?.['text_29'] ?? 'No hay objetos CODE o HTML')}</p>
                  ) : (
                    <div className="space-y-2">
                      {objects.map((obj) => (
                        <button
                          key={obj.id}
                          onClick={() => handleObjectSelect(obj)}
                          className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileCode size={16} className="text-purple-600 dark:text-purple-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {obj.title || obj.name}
                              </p>
                              <p className="text-xs text-gray-500">
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
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
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
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >{tr?.['text_30'] ?? (tr?.['text_30'] ?? 'Cambiar archivo')}</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload size={48} className="mx-auto text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tr?.['text_31'] ?? (tr?.['text_31'] ?? 'Haz clic para subir tu archivo de código')}</p>
                    <p className="text-xs text-gray-500">{tr?.['text_32'] ?? (tr?.['text_32'] ?? 'JSX, TSX, HTML, JS, TS')}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >{tr?.['text_33'] ?? (tr?.['text_33'] ?? 'Seleccionar archivo')}</button>
                  </div>
                )}
              </div>

              {selectedFile && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToLibrary}
                    onChange={(e) => setSaveToLibrary(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                  />
                  <span>{tr?.['text_34'] ?? (tr?.['text_34'] ?? 'Guardar también en la biblioteca de objetos')}</span>
                </label>
              )}

              {/* Analyze Button */}
              {selectedFile && fileContent && (
                <button
                  onClick={handleAnalyzeFile}
                  disabled={uploadLoading}
                  className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>{tr?.['text_35'] ?? (tr?.['text_35'] ?? 'Analizando...')}</span>
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>{tr?.['text_36'] ?? (tr?.['text_36'] ?? 'Analizar y Continuar')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Step 2: Translation Processing */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Languages className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tr?.['text_37'] ?? (tr?.['text_37'] ?? 'Paso 2: Procesar Traducciones')}</h3>
                  <p className="text-xs text-gray-500">{tr?.['text_38'] ?? (tr?.['text_38'] ?? 'Extrae textos y traduce a ES, EN y FR.')}</p>
                </div>
              </div>

              {!sourceData && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="text-yellow-500 mb-3" size={40} />
                  <p className="text-gray-500">{tr?.['text_39'] ?? (tr?.['text_39'] ?? 'Primero debes subir un archivo en el Paso 1')}</p>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >{tr?.['text_40'] ?? (tr?.['text_40'] ?? 'Ir al Paso 1')}</button>
                </div>
              )}

              {sourceData && (
                <div className="space-y-6">
                  {/* Source Info */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{tr?.['text_41'] ?? (tr?.['text_41'] ?? 'Archivo fuente:')}</span> {sourceData.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{tr?.['text_42'] ?? (tr?.['text_42'] ?? 'Tipo:')}</span> {sourceData.type}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{tr?.['text_43'] ?? (tr?.['text_43'] ?? 'Textos encontrados:')}</span> {Object.keys(extractedKeys).length}
                    </p>
                  </div>

                  {/* Extracted Keys Preview */}
                  {Object.keys(extractedKeys).length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{tr?.['text_44'] ?? (tr?.['text_44'] ?? 'Textos Extraídos:')}</h4>
                      <div className="space-y-1">
                        {Object.entries(extractedKeys).slice(0, 10).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="text-purple-600 dark:text-purple-400 font-mono">{key}</span>
                            <span className="text-gray-500 mx-2">→</span>
                            <span className="text-gray-700 dark:text-gray-300">"{value}"</span>
                          </div>
                        ))}
                        {Object.keys(extractedKeys).length > 10 && (
                          <p className="text-xs text-gray-500 italic">
                            ... y {Object.keys(extractedKeys).length - 10} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={downloadOriginalJson}
                      className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <Download size={18} />{tr?.['text_45'] ?? (tr?.['text_45'] ?? 'Descargar Textos (JSON)')}</button>
                    <button
                      onClick={handleTranslateAll}
                      disabled={processLoading || Object.keys(extractedKeys).length === 0}
                      className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      {processLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />{tr?.['text_46'] ?? (tr?.['text_46'] ?? 'Traduciendo...')}</>
                      ) : (
                        <>
                          <Languages size={18} />{tr?.['text_47'] ?? (tr?.['text_47'] ?? 'Traducir Todo (ES, EN, FR)')}</>
                      )}
                    </button>
                  </div>

                  {/* Auto i18n Button */}
                  {translations && Object.keys(translations).length > 0 && (
                    <button
                      onClick={handleAutoI18n}
                      disabled={processLoading}
                      className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={20} />{tr?.['text_48'] ?? (tr?.['text_48'] ?? 'Generar Código con Auto-i18n')}</button>
                  )}

                  {/* Success/Error Messages */}
                  {processSuccess && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                      <Check className="text-green-600 dark:text-green-400" size={20} />
                      <p className="text-sm text-green-800 dark:text-green-200">{processSuccess}</p>
                    </div>
                  )}
                  {processError && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                      <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                      <p className="text-sm text-red-800 dark:text-red-200">{processError}</p>
                    </div>
                  )}

                  {/* Continue to Step 3 */}
                  {translations && Object.keys(translations).length > 0 && (
                    <button
                      onClick={() => setActiveStep(3)}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                    >{tr?.['text_49'] ?? (tr?.['text_49'] ?? 'Continuar al Paso 3')}<ArrowRight size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Translation Saver */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Save className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tr?.['text_50'] ?? (tr?.['text_50'] ?? 'Paso 3: Guardar Traducciones')}</h3>
                  <p className="text-xs text-gray-500">{tr?.['text_51'] ?? (tr?.['text_51'] ?? 'Descarga los JSON o aplícalos directamente al proyecto.')}</p>
                </div>
              </div>

              {!results.es && !results.en && !results.fr && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="text-yellow-500 mb-3" size={40} />
                  <p className="text-gray-500">{tr?.['text_52'] ?? (tr?.['text_52'] ?? 'No hay traducciones generadas. Ve al Paso 2.')}</p>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >{tr?.['text_53'] ?? (tr?.['text_53'] ?? 'Ir al Paso 2')}<ArrowRight size={18} /></button>
                </div>
              )}

              {(results.es || results.en || results.fr) && (
                <div className="space-y-6">
                  {/* Translation Downloads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['es', 'en', 'fr'] as const).map((lang) => (
                      <div key={lang} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileJson className="text-purple-600 dark:text-purple-400" size={20} />
                          <h4 className="font-semibold text-gray-900 dark:text-white uppercase">{lang}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          {results[lang] ? `${Object.keys(results[lang]).length} claves` : tr?.['text_54'] ?? 'Sin datos'}
                        </p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => downloadJson(lang)}
                            disabled={!results[lang]}
                            className="py-2 px-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm rounded-lg flex items-center justify-center gap-2"
                          >
                            <Download size={16} />{tr?.['text_55'] ?? (tr?.['text_55'] ?? 'Descargar')}</button>
                          <button
                            onClick={() => saveToObjectLibrary(lang)}
                            disabled={!results[lang]}
                            className="py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm rounded-lg flex items-center justify-center gap-2"
                          >
                            <Database size={16} />{tr?.['text_56'] ?? (tr?.['text_56'] ?? 'A Biblioteca')}</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* i18n Code Download */}
                  {results.i18n_code && (
                    <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-purple-600 dark:text-purple-400" size={20} />
                        <h4 className="font-semibold text-gray-900 dark:text-white">{tr?.['text_57'] ?? (tr?.['text_57'] ?? 'Código con i18n')}</h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {results.i18n_code.fileName}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={downloadI18nCode}
                          className="flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg flex items-center justify-center gap-2"
                        >
                          <Download size={16} />{tr?.['text_58'] ?? (tr?.['text_58'] ?? 'Descargar Código')}</button>
                        <button
                          onClick={() => saveToObjectLibrary('code')}
                          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center justify-center gap-2"
                        >
                          <Database size={16} />{tr?.['text_56'] ?? (tr?.['text_56'] ?? 'A Biblioteca')}</button>
                      </div>
                    </div>
                  )}

                  {/* Apply to Project */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <button
                      onClick={handleApplyToProject}
                      disabled={savingToProject}
                      className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {savingToProject ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />{tr?.['text_59'] ?? (tr?.['text_59'] ?? 'Aplicando al proyecto...')}</>
                      ) : (
                        <>
                          <ArrowRight size={20} />{tr?.['text_60'] ?? (tr?.['text_60'] ?? 'Aplicar Todo al Proyecto')}</>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">{tr?.['text_61'] ?? (tr?.['text_61'] ?? 'Esto guardará las traducciones en apps/fablab/language/locales/')}</p>
                  </div>

                  {/* Success/Error Messages */}
                  {saveSuccess && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                      <Check className="text-green-600 dark:text-green-400" size={20} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">{saveSuccess}</p>
                        {projectPath && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">Ubicación: {projectPath}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {saveError && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                      <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                      <p className="text-sm text-red-800 dark:text-red-200">{saveError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Language Manager */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Globe className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{text('text_63', 'Paso 4: Gestionar Idiomas Completos')}</h3>
                  <p className="text-xs text-gray-500">{text('text_64', 'Exportar/importar archivos de idioma completos o agregar nuevos idiomas.')}</p>
                </div>
              </div>

              {/* Export Section */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{text('text_65', 'Exportar Archivo de Idioma')}</h4>
                <div className="flex gap-3">
                  <select
                    value={selectedLanguageFile}
                    onChange={(e) => setSelectedLanguageFile(e.target.value as 'en' | 'es' | 'fr')}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="en">{text('text_66', 'Inglés (EN)')}</option>
                    <option value="es">{text('text_67', 'Español (ES)')}</option>
                    <option value="fr">{text('text_68', 'Francés (FR)')}</option>
                  </select>
                  <button
                    onClick={handleExportLanguage}
                    disabled={languageLoading}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
                  >
                    {languageLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Download size={18} />{text('text_69', 'Exportar')}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Import and Add New Language Section */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{text('text_70', 'Agregar Nuevo Idioma')}</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={text('text_71', 'Código (ej: de, it, pt)')}
                      value={languageCode}
                      onChange={(e) => setLanguageCode(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder={text('text_72', 'Nombre (ej: Alemán, Italiano)')}
                      value={languageName}
                      onChange={(e) => setLanguageName(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{text('text_73', 'Cargar archivo traducido (JSON o TypeScript)')}</label>
                    <input
                      type="file"
                      accept=".json,.ts"
                      onChange={handleImportLanguage}
                      className="hidden"
                      id="language-file-input"
                    />
                    <label
                      htmlFor="language-file-input"
                      className="flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-gray-700 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all cursor-pointer"
                    >
                      <Upload size={20} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {importedData ? text('text_74', '✅ Archivo cargado - Click para cambiar') : text('text_75', 'Click para cargar archivo')}
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handleUploadNewLanguage}
                    disabled={languageLoading || !languageCode || !languageName || !importedData}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                  >
                    {languageLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />{text('text_76', 'Subiendo...')}
                      </>
                    ) : (
                      <>
                        <Check size={18} />{text('text_77', 'Agregar Idioma')}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Success/Error Messages */}
              {languageSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                  <Check className="text-green-600 dark:text-green-400" size={20} />
                  <p className="text-sm text-green-800 dark:text-green-200">{languageSuccess}</p>
                </div>
              )}
              {languageError && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                  <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                  <p className="text-sm text-red-800 dark:text-red-200">{languageError}</p>
                </div>
              )}

              {/* Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>{tr?.['text_78'] ?? (tr?.['text_78'] ?? 'Tip:')}</strong>{tr?.['text_79'] ?? (tr?.['text_79'] ?? 'Exporta un archivo de idioma existente, tradúcelo externamente, y súbelo aquí para agregarlo al proyecto.')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
