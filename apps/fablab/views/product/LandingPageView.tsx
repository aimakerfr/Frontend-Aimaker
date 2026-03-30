import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Lock, Copy, Check, ArrowLeft, Layout, Download, ChevronDown, FileCode } from 'lucide-react';
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
import { copyObjectToRag, type ObjectItem } from '@core/objects';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

type ModuleType = 'HEADER' | 'BODY' | 'FOOTER';
interface HTMLSource { id: number; name: string; type: string; }

const MODULE_TYPES: Array<{ type: ModuleType; label: string; color: string; icon: string }> = [
  { type: 'HEADER', label: 'Header', color: 'text-purple-600 dark:text-purple-400', icon: '🟣' },
  { type: 'BODY',   label: 'Body',   color: 'text-blue-600 dark:text-blue-400',   icon: '🔵' },
  { type: 'FOOTER', label: 'Footer', color: 'text-emerald-600 dark:text-emerald-400', icon: '🟢' },
];

const LandingPageView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = !!tokenStorage.get();

  // ── Product ────────────────────────────────────────────
  const [product, setProduct]       = useState<Product | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isOwner, setIsOwner]       = useState(false);
  const [urlCopied, setUrlCopied]   = useState(false);

  // ── Sources (left panel) ───────────────────────────────
  const [sources, setSources]               = useState<Source[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedObjects, setSelectedObjects]     = useState<ObjectItem[]>([]);
  const [isImporting, setIsImporting]             = useState(false);

  // ── HTML assembly (right panel) ────────────────────────
  const [htmlSources, setHtmlSources]       = useState<HTMLSource[]>([]);
  const [selectedHeader, setSelectedHeader] = useState<number | null>(null);
  const [selectedBody, setSelectedBody]     = useState<number | null>(null);
  const [selectedFooter, setSelectedFooter] = useState<number | null>(null);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [htmlError, setHtmlError]           = useState<string | null>(null);

  // Step ID for saving module selections in product_step_progress
  // Using stepId=1 as the standard for landing page module selections
  const MODULE_SELECTION_STEP_ID = 1;

  // ── Helpers ─────────────────────────────────────────────
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

  // ── Load product ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        let productData: Product;

        // Support routes sin ID: obtén o crea el fijo y usa su id
        let targetId: number | null = id ? parseInt(id) : null;
        if (!targetId) {
          const ensured = await getOrCreateProductByType('landing_page_maker', {
            title: t.products.fixed.landingTitle ?? 'Landing Page',
            description: t.products.fixed.landingDesc ?? '',
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
        // Load previous selections from product_step_progress
        await loadPreviousSelections(productData.id);
      } catch (err) {
        console.error('[LandingPageView] Error loading product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Sync htmlSources whenever sources change ───────────
  useEffect(() => {
    const html = sources
      .filter(s => s.type === 'html' || (s as any).backendType === 'HTML')
      .map(s => ({ id: parseInt(s.id), name: s.title, type: 'HTML' }));
    setHtmlSources(html);
    if (html.length === 0) {
      setHtmlError(t.landingPageViewTranslations?.['text_noHtml'] ?? 'No hay fuentes HTML. Agrega archivos HTML en el panel izquierdo.');
    } else {
      setHtmlError(null);
    }
  }, [sources]);

  // ── Load previous selections from product_step_progress ──
  const loadPreviousSelections = async (productId: number) => {
    try {
      const progressData = await getProductStepProgress(productId);
      const stepProgress = progressData.find(p => p.stepId === MODULE_SELECTION_STEP_ID);
      
      if (stepProgress?.resultText) {
        const { headerSourceId, bodySourceId, footerSourceId } = stepProgress.resultText;
        if (headerSourceId) setSelectedHeader(headerSourceId);
        if (bodySourceId) setSelectedBody(bodySourceId);
        if (footerSourceId) setSelectedFooter(footerSourceId);
        console.log('[LandingPageView] Loaded previous selections:', { headerSourceId, bodySourceId, footerSourceId });
      }
    } catch (err) {
      console.error('[LandingPageView] Error loading previous selections:', err);
    }
  };

  // ── Save selections to product_step_progress ────────────
  const saveSelections = async () => {
    if (!product?.id) return;
    
    try {
      await updateProductStepProgress({
        productId: product.id,
        stepId: MODULE_SELECTION_STEP_ID,
        resultText: {
          headerSourceId: selectedHeader,
          bodySourceId: selectedBody,
          footerSourceId: selectedFooter
        },
        status: 'success'
      });
      console.log('[LandingPageView] Saved selections:', { headerSourceId: selectedHeader, bodySourceId: selectedBody, footerSourceId: selectedFooter });
    } catch (err) {
      console.error('[LandingPageView] Error saving selections:', err);
    }
  };

  // ── Auto-save selections when they change ───────────────
  useEffect(() => {
    if (selectedHeader !== null || selectedBody !== null || selectedFooter !== null) {
      saveSelections();
    }
  }, [selectedHeader, selectedBody, selectedFooter]);

  // ── Source panel helpers ─────────────────────────────────
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
          console.error('[LandingPageView] Error loading source', src.id, e);
        }
      }
      setSources(loaded);
    } catch (err) {
      console.error('[LandingPageView] Error loading sources:', err);
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
      console.error('[LandingPageView] Error adding source:', err);
      alert('Error al agregar la fuente.');
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!product?.rag?.id) return;
    try {
      await deleteRagMultimodalSource(parseInt(sourceId));
      await loadRagSources(product.rag.id);
    } catch (err) {
      console.error('[LandingPageView] Error deleting source:', err);
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
      console.error('[LandingPageView] Error importing objects:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleSource = (sourceId: string) => {
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, selected: !s.selected } : s));
  };

  const fixedTitle = t.products.fixed.landingTitle ?? 'Landing Page';
  const fixedDescription = t.products.fixed.landingDesc ?? '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/product/landing-page/${product?.id}`);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // ── HTML assembly ────────────────────────────────────────
  const fetchModuleContent = async (sourceId: number): Promise<{ html: string; css: string } | null> => {
    try {
      const res = await getRagMultimodalSourceContent(sourceId);
      if (res.isUrl) return { html: `<p>External: <a href="${res.content}">${res.name}</a></p>`, css: '' };
      const parser = new DOMParser();
      const doc = parser.parseFromString(res.content, 'text/html');
      let css = '';
      doc.querySelectorAll('style').forEach(el => { css += el.textContent + '\n'; });
      return { html: doc.body.innerHTML, css };
    } catch { return null; }
  };

  const generateIndexHtml = (
    header: { html: string; css: string } | null,
    body: { html: string; css: string } | null,
    footer: { html: string; css: string } | null,
  ): string => {
    const allCss = [header?.css, body?.css, footer?.css].filter(Boolean).join('\n');
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product?.title ?? 'Landing Page'}</title>
  <style>
    body { margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; }
    ${allCss}
  </style>
</head>
<body>
  <header id="module-header">${header?.html ?? ''}</header>
  <main id="module-body" style="flex:1;">${body?.html ?? ''}</main>
  <footer id="module-footer">${footer?.html ?? ''}</footer>
</body>
</html>`;
  };

  const handleGenerateIndex = async () => {
    if (!selectedHeader || !selectedBody || !selectedFooter) {
      alert(t.landingPageViewTranslations?.['text_selectAll'] ?? 'Por favor selecciona Header, Body y Footer');
      return;
    }
    setIsGenerating(true);
    try {
      // Save selections before generating
      await saveSelections();
      
      const [headerContent, bodyContent, footerContent] = await Promise.all([
        fetchModuleContent(selectedHeader),
        fetchModuleContent(selectedBody),
        fetchModuleContent(selectedFooter),
      ]);
      const html = generateIndexHtml(headerContent, bodyContent, footerContent);
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `landing-page-${product?.id ?? 'download'}-index.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[LandingPageView] Error generating index:', err);
      alert('Error al generar el index.html');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = !!selectedHeader && !!selectedBody && !!selectedFooter;

  // ── Guards ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{t.landingPageViewTranslations?.['text_notFound'] ?? 'Producto no encontrado o no es público'}</p>
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            {t.landingPageViewTranslations?.['text_back'] ?? 'Volver'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex-1 flex items-start gap-4">
            {isOwner && (
              <button
                onClick={() => navigate('/dashboard/context')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 mt-1"
                title={t.landingPageViewTranslations?.['text_back'] ?? 'Volver'}
              >
                <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex-shrink-0 mt-1" title="Vista Landing Page">
              <Layout size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={fixedTitle}
                readOnly
                disabled
                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 w-full"
                placeholder={t.landingPageViewTranslations?.['text_titlePlaceholder'] ?? 'Título de la landing page'}
              />
              <input
                type="text"
                value={fixedDescription}
                readOnly
                disabled
                className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 w-full mt-1"
                placeholder={t.landingPageViewTranslations?.['text_descPlaceholder'] ?? 'Descripción del producto'}
              />
            </div>
          </div>
          {/* Right — visibility badge */}
          <div className="flex-shrink-0">
            {product.isPublic ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {t.landingPageViewTranslations?.['text_public'] ?? 'Producto Público'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {t.landingPageViewTranslations?.['text_private'] ?? 'Producto Privado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* URL row */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 max-w-3xl">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <span className="flex-1 text-sm text-indigo-600 dark:text-indigo-400 truncate">
                {window.location.origin}/product/landing-page/{product.id}
              </span>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded transition-colors flex-shrink-0"
                title={t.landingPageViewTranslations?.['text_copyUrl'] ?? 'Copiar URL'}
              >
                {urlCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
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

        {/* Right — HTML assembler */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileCode size={20} className="text-indigo-500" />
                {t.landingPageViewTranslations?.['text_assemblerTitle'] ?? 'Ensamblar Landing Page'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.landingPageViewTranslations?.['text_assemblerSubtitle'] ?? 'Selecciona una fuente HTML del RAG para cada sección y genera tu index.html.'}
              </p>
            </div>

            {/* Info / error */}
            {htmlError ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-700 dark:text-amber-300">{htmlError}</p>
              </div>
            ) : (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  {t.landingPageViewTranslations?.['text_assemblerHint'] ?? 'Las fuentes HTML del panel izquierdo aparecen automáticamente aquí. Sube archivos .html desde el panel de fuentes y selecciona uno por sección.'}
                </p>
              </div>
            )}

            {/* Module selectors */}
            <div className="space-y-3">
              {MODULE_TYPES.map(({ type, label, color, icon }) => {
                const selectedId = type === 'HEADER' ? selectedHeader : type === 'BODY' ? selectedBody : selectedFooter;
                const setSelected = type === 'HEADER' ? setSelectedHeader : type === 'BODY' ? setSelectedBody : setSelectedFooter;
                return (
                  <div key={type} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-lg">{icon}</span>
                      <h3 className={`font-bold text-sm ${color}`}>{label}</h3>
                    </div>
                    <div className="p-4">
                      <div className="relative">
                        <select
                          value={selectedId ?? ''}
                          onChange={e => setSelected(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3 py-2 pr-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">{t.landingPageViewTranslations?.['text_selectSource'] ?? 'Seleccionar fuente HTML...'}</option>
                          {htmlSources.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generate button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleGenerateIndex}
                disabled={!canGenerate || isGenerating || !isOwner}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-500/20"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {t.landingPageViewTranslations?.['text_generating'] ?? 'Generando...'}
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    {t.landingPageViewTranslations?.['text_generate'] ?? 'Generar Index.html'}
                  </>
                )}
              </button>
            </div>

          </div>
        </main>

      </div>

      {/* ── Modals ──────────────────────────────────────── */}
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

export default LandingPageView;
