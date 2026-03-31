import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Lock, Copy, Check, ArrowLeft, Wand2, Download, ExternalLink, Save, RefreshCw, Loader2 } from 'lucide-react';
import SourcePanel from '../rag_multimodal/components/SourcePanel.tsx';
import ImportSourceModal from '../rag_multimodal/components/ImportSourceModal.tsx';
import UploadSourceModal from '../rag_multimodal/components/UploadSourceModal.tsx';
import { Source, SourceType } from '../rag_multimodal/types';
import { getProduct, getPublicProduct, getOrCreateProductByType, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import {
  getRagMultimodalSources,
  postRagMultimodalSource,
  deleteRagMultimodalSource,
  getRagMultimodalSourceContent,
} from '@core/rag_multimodal';
import { generateImageFromPrompt } from '@core/ai/image-generation.service';
import { copyObjectToRag, createObjectFromBase64, type ObjectItem } from '@core/objects';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

// Step IDs for product_step_progress
const STEP_IA_GENERATOR = 1;  // Generar imagen con prompt
const STEP_OUTPUT_SAVER = 2;  // Guardar resultado

const ImageGeneratorView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = !!tokenStorage.get();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Product ───────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // ── Sources (left panel) ──────────────────────────────────────
  const [sources, setSources] = useState<Source[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<ObjectItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // ── Image Generator (right panel) ─────────────────────────────
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load product ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        let productData: Product;

        // Soporta ruta sin ID buscando/creando el fijo
        let targetId: number | null = id ? parseInt(id) : null;
        if (!targetId) {
          const ensured = await getOrCreateProductByType('image_generator_rag', {
            title: t.products.fixed.imageTitle ?? 'Generador de imágenes',
            description: t.products.fixed.imageDesc ?? '',
          });
          targetId = ensured.id;
        }

        if (isAuthenticated) {
          try {
            productData = await getProduct(targetId);
            setIsOwner(true);
          } catch {
            productData = await getPublicProduct(targetId);
            setIsOwner(false);
          }
        } else {
          productData = await getPublicProduct(targetId);
          setIsOwner(false);
        }
        setProduct(productData);
        if (productData.rag?.id) {
          await loadRagSources(productData.rag.id);
        }
        // Load previous prompt and image from product_step_progress
        await loadPreviousProgress(productData.id);
      } catch (err) {
        console.error('[ImageGeneratorView] Error loading product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Auto-resize textarea ──────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // ── Helpers ────────────────────────────────────────────────────
  const mapApiSourceType = (type: string): SourceType => {
    switch (type?.toUpperCase()) {
      case 'DOC': case 'PDF': return 'pdf';
      case 'IMAGE':  return 'image';
      case 'VIDEO':  return 'video';
      case 'TEXT':   return 'text';
      case 'CODE':   return 'code';
      case 'WEBSITE': return 'url';
      case 'HTML':   return 'html';
      case 'CONFIG': return 'config';
      default: return 'text';
    }
  };

  // ── Load previous progress from product_step_progress ─────────
  const loadPreviousProgress = async (productId: number) => {
    try {
      const progressData = await getProductStepProgress(productId);
      
      // Load prompt from STEP_IA_GENERATOR
      const generatorProgress = progressData.find(p => p.stepId === STEP_IA_GENERATOR);
      if (generatorProgress?.resultText?.prompt) {
        setPrompt(generatorProgress.resultText.prompt);
        console.log('[ImageGeneratorView] Loaded previous prompt');
      }

      // Load image from STEP_OUTPUT_SAVER
      const saverProgress = progressData.find(p => p.stepId === STEP_OUTPUT_SAVER);
      if (saverProgress?.resultText?.imageUrl) {
        setGeneratedImageUrl(saverProgress.resultText.imageUrl);
        console.log('[ImageGeneratorView] Loaded previous generated image');
      }
    } catch (err) {
      console.error('[ImageGeneratorView] Error loading previous progress:', err);
    }
  };

  // ── Source panel helpers ──────────────────────────────────────
  const loadRagSources = async (ragId: number) => {
    try {
      const apiSources = await getRagMultimodalSources(ragId);
      const loaded: Source[] = [];
      for (const src of apiSources) {
        try {
          const data = await getRagMultimodalSourceContent(src.id);
          const isPdfOrDoc = data.type === 'doc' || data.type === 'PDF' || data.type === 'DOC';
          const hasContent = data.content && data.content.trim() !== '';
          if (!hasContent && !isPdfOrDoc) continue;
          loaded.push({
            id: src.id.toString(),
            title: data.name || `Source ${src.id}`,
            type: mapApiSourceType(data.type),
            backendType: data.type,
            content: hasContent ? data.content : `[${data.name} - pendiente de procesamiento]`,
            url: src.filePath || '',
            previewUrl: src.filePath || '',
            dateAdded: src.createdAt ? new Date(src.createdAt) : new Date(),
            selected: true,
          });
        } catch (e) {
          console.error('[ImageGeneratorView] Error loading source', src.id, e);
        }
      }
      setSources(loaded);
    } catch (err) {
      console.error('[ImageGeneratorView] Error loading sources:', err);
    }
  };

  const handleAddSource = async (type: SourceType, content: string, title: string, url?: string, _preview?: string, file?: File) => {
    if (!product?.rag?.id) return;
    try {
      let apiType = type.toUpperCase();
      if (apiType === 'URL') apiType = 'WEBSITE';
      if (apiType === 'PDF') apiType = 'DOC';
      const form = new FormData();
      form.append('rag_multimodal_id', product.rag.id.toString());
      form.append('name', title);
      form.append('type', apiType);
      if (file) form.append('stream_file', file);
      if (url) form.append('url', url);
      if (content) form.append('text', content);
      await postRagMultimodalSource(form);
      await loadRagSources(product.rag.id);
    } catch (err) {
      console.error('[ImageGeneratorView] Error adding source:', err);
      alert('Error al agregar la fuente.');
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!product?.rag?.id) return;
    try {
      await deleteRagMultimodalSource(parseInt(sourceId));
      await loadRagSources(product.rag.id);
    } catch (err) {
      console.error('[ImageGeneratorView] Error deleting source:', err);
    }
  };

  const handleImportObjects = async () => {
    if (!product?.rag?.id || !selectedObjects.length) { setIsImportModalOpen(false); return; }
    try {
      setIsImporting(true);
      await Promise.all(selectedObjects.map(obj => copyObjectToRag({ object_id: Number(obj.id), rag_id: product.rag!.id })));
      await loadRagSources(product.rag.id);
      setSelectedObjects([]);
      setIsImportModalOpen(false);
    } catch (err) {
      console.error('[ImageGeneratorView] Error importing objects:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleSource = (sourceId: string) => {
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, selected: !s.selected } : s));
  };

  const fixedTitle = t.products.fixed.imageTitle ?? 'Generador de imágenes con IA';
  const fixedDescription = t.products.fixed.imageDesc ?? '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/product/image-generator/${product?.id}`);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // ── Image Generation ──────────────────────────────────────────
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError(t.imageGeneratorTranslations?.errorEmptyPrompt ?? 'El prompt no puede estar vacío');
      return;
    }
    if (!product?.id) return;

    setIsGenerating(true);
    setError(null);

    try {
      const finalPrompt = prompt.trim();
      console.log('[ImageGeneratorView] Sending prompt:', finalPrompt);

      const result = await generateImageFromPrompt(finalPrompt);
      console.log('[ImageGeneratorView] Image generated ✓  size:', result.size, 'type:', result.contentType);

      setGeneratedImageUrl(result.imageUrl);
      setIsGenerating(false);
      setIsDownloaded(false);

      // Save prompt to product_step_progress (STEP_IA_GENERATOR)
      await updateProductStepProgress({
        productId: product.id,
        stepId: STEP_IA_GENERATOR,
        status: 'success',
        resultText: {
          prompt: finalPrompt,
          imageSize: result.size,
          contentType: result.contentType
        }
      });

      // Save generated image to product_step_progress (STEP_OUTPUT_SAVER)
      await updateProductStepProgress({
        productId: product.id,
        stepId: STEP_OUTPUT_SAVER,
        status: 'success',
        resultText: {
          imageUrl: result.imageUrl,
          timestamp: new Date().toISOString()
        }
      });

      console.log('[ImageGeneratorView] Progress saved to product_step_progress');
    } catch (err: any) {
      console.error('[ImageGeneratorView] Generation error:', err);
      setError(`Error al generar imagen: ${err.message || err}`);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generateImage();
    }
  };

  const downloadImage = async () => {
    if (!generatedImageUrl) return;

    try {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `ai-generated-image-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 3000);
    } catch (err) {
      console.error('[ImageGeneratorView] Download error:', err);
      setError(t.imageGeneratorTranslations?.errorDownload ?? 'Error al descargar la imagen');
    }
  };

  const openInNewWindow = () => {
    if (!generatedImageUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${generatedImageUrl}" alt="Generated Image" style="max-width: 100%; height: auto;" />`);
      win.document.title = 'Generated Image';
    }
  };

  const saveToObjects = async () => {
    if (!generatedImageUrl) return;
    if (!product?.id) return;

    setIsSaving(true);
    try {
      // Extract base64 data from data URI
      const base64Data = generatedImageUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data');
      }

      // Create object in library
      await createObjectFromBase64({
        name: `AI Generated Image - ${new Date().toLocaleString()}`,
        description: `Generated from prompt: ${prompt.substring(0, 100)}...`,
        type: 'image',
        base64Data,
        mimeType: 'image/png'
      });

      alert(t.imageGeneratorTranslations?.successSaved ?? 'Imagen guardada en tu librería de objetos');
      console.log('[ImageGeneratorView] Image saved to objects library');
    } catch (err) {
      console.error('[ImageGeneratorView] Error saving to objects:', err);
      alert(t.imageGeneratorTranslations?.errorSaving ?? 'Error al guardar en objetos');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{t.imageGeneratorTranslations?.notFound ?? 'Producto no encontrado o no es público'}</p>
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            {t.imageGeneratorTranslations?.backButton ?? 'Volver'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex-1 flex items-start gap-4">
            {isOwner && (
              <button
                onClick={() => navigate('/dashboard/context')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 mt-1"
                title={t.imageGeneratorTranslations?.backButton ?? 'Volver'}
              >
                <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex-shrink-0 mt-1" title={t.imageGeneratorTranslations?.viewTitle ?? 'Vista Image Generator'}>
              <Wand2 size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={fixedTitle}
                readOnly
                disabled
                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 w-full"
                placeholder={t.imageGeneratorTranslations?.titlePlaceholder ?? 'Título del generador de imágenes'}
              />
              <input
                type="text"
                value={fixedDescription}
                readOnly
                disabled
                className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 w-full mt-1"
                placeholder={t.imageGeneratorTranslations?.descPlaceholder ?? 'Descripción del producto'}
              />
            </div>
          </div>
          {/* Right — visibility badge */}
          <div className="flex-shrink-0">
            {product.isPublic ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">{t.imageGeneratorTranslations?.publicProduct ?? 'Producto Público'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t.imageGeneratorTranslations?.privateProduct ?? 'Producto Privado'}</span>
              </div>
            )}
          </div>
        </div>

        {/* URL row */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 max-w-3xl">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <span className="flex-1 text-sm text-purple-600 dark:text-purple-400 truncate">
                {window.location.origin}/product/image-generator/{product.id}
              </span>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded transition-colors flex-shrink-0"
                title={t.imageGeneratorTranslations?.copyUrl ?? 'Copiar URL'}
              >
                {urlCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-purple-600 dark:text-purple-400" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — source panel */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <SourcePanel
            sources={sources}
            onToggleSource={handleToggleSource}
            onDeleteSource={handleDeleteSource}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            hideImportButton={!isOwner}
            hideUploadButton={!isOwner}
          />
        </aside>

        {/* Right — Image Generator */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wand2 size={20} className="text-purple-500" />
                {t.imageGeneratorTranslations?.mainTitle ?? 'Generador de Imágenes IA'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.imageGeneratorTranslations?.mainSubtitle ?? 'Crea imágenes únicas con inteligencia artificial. Escribe un prompt descriptivo y genera tu imagen.'}
              </p>
            </div>

            {/* Hint */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                💡 <strong>{t.imageGeneratorTranslations?.tipLabel ?? 'Tip:'}</strong> {t.imageGeneratorTranslations?.tipText ?? 'Sé específico en tu prompt. Describe estilo, colores, composición y detalles para mejores resultados.'}
              </p>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t.imageGeneratorTranslations?.promptLabel ?? 'Prompt de generación'}
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isOwner}
                placeholder={t.imageGeneratorTranslations?.promptPlaceholder ?? 'Ej: Un paisaje futurista con montañas cristalinas, cielo púrpura, estilo cyberpunk, alta calidad, 4k...'}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                rows={4}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={prompt.length > 400 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                  {prompt.length} {t.imageGeneratorTranslations?.characters ?? 'caracteres'} {prompt.length > 400 && (t.imageGeneratorTranslations?.truncatedWarning ?? '⚠️ Será truncado a 400')}
                </span>
                <span className="text-gray-400 dark:text-gray-500">{t.imageGeneratorTranslations?.ctrlEnterHint ?? 'Ctrl+Enter para generar'}</span>
              </div>
            </div>

            {/* Generate Button */}
            {isOwner && (
              <button
                onClick={generateImage}
                disabled={!prompt.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t.imageGeneratorTranslations?.generating ?? 'Generando imagen...'}
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    {t.imageGeneratorTranslations?.generateButton ?? 'Generar Imagen'}
                  </>
                )}
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Generated Image */}
            {generatedImageUrl && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.imageGeneratorTranslations?.generatedImageLabel ?? 'Imagen Generada'}</span>
                </div>
                
                {/* Image Display */}
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-lg">
                  <img src={generatedImageUrl} alt="Generated AI Image" className="w-full h-auto" />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={openInNewWindow}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                  >
                    <ExternalLink size={18} />
                    {t.imageGeneratorTranslations?.openNewWindow ?? 'Abrir en Nueva Ventana'}
                  </button>

                  <button
                    onClick={downloadImage}
                    disabled={isDownloaded}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                  >
                    {isDownloaded ? (
                      <>
                        <Check size={18} />
                        {t.imageGeneratorTranslations?.downloaded ?? 'Descargada'}
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        {t.imageGeneratorTranslations?.download ?? 'Descargar'}
                      </>
                    )}
                  </button>

                  {isOwner && (
                    <button
                      onClick={saveToObjects}
                      disabled={isSaving}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          {t.imageGeneratorTranslations?.saving ?? 'Guardando...'}
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          {t.imageGeneratorTranslations?.saveToObjects ?? 'Guardar en Objetos'}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Regenerate Button */}
                {isOwner && (
                  <button 
                    onClick={generateImage} 
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    <RefreshCw size={18} />
                    {t.imageGeneratorTranslations?.regenerateButton ?? 'Regenerar Imagen'}
                  </button>
                )}
              </div>
            )}

          </div>
        </main>

      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {isOwner && (
        <>
          <UploadSourceModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onAddSource={handleAddSource}
            tp={t.notebook.sourcePanel}
            t={t}
          />
          <ImportSourceModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImportObjects}
            selectedObjects={selectedObjects}
            onSelectionChange={setSelectedObjects}
            isImporting={isImporting}
            tp={t.notebook.sourcePanel}
            t={t}
          />
        </>
      )}
    </div>
  );
};

export default ImageGeneratorView;