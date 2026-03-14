import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Download, FileCode, Layout, Palette, Sparkles, UploadCloud, Wand2 } from 'lucide-react';
import SourcePanel from '../rag_multimodal/components/SourcePanel.tsx';
import ImportSourceModal from '../rag_multimodal/components/ImportSourceModal.tsx';
import UploadSourceModal from '../rag_multimodal/components/UploadSourceModal.tsx';
import { Source, SourceType } from '../rag_multimodal/types';
import { getProduct, getPublicProduct, getOrCreateProductByType, updateProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import {
  deleteRagMultimodalSource,
  getRagMultimodalSourceContent,
  getRagMultimodalSources,
  postRagMultimodalSource,
} from '@core/rag_multimodal';
import { copyObjectToRag, type ObjectItem } from '@core/objects';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

type ModuleType = 'HEADER' | 'BODY' | 'FOOTER';
interface HTMLSource { id: number; name: string; type: string; }
interface ModuleContent { html: string; css: string; name: string; }

 const MODULE_TYPES: Array<{ type: ModuleType; label: string; color: string; icon: string }> = [
   { type: 'HEADER', label: 'Header', color: 'text-purple-600 dark:text-purple-400', icon: '🟣' },
   { type: 'BODY',   label: 'Body',   color: 'text-blue-600 dark:text-blue-400',   icon: '🔵' },
   { type: 'FOOTER', label: 'Footer', color: 'text-emerald-600 dark:text-emerald-400', icon: '🟢' },
 ];

 const StyleTransferView: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { t } = useLanguage();
   const isAuthenticated = !!tokenStorage.get();
 
   // Product
   const [product, setProduct] = useState<Product | null>(null);
   const [isOwner, setIsOwner] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [urlCopied, setUrlCopied] = useState(false);
 
   // Sources
   const [sources, setSources] = useState<Source[]>([]);
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
   const [selectedObjects, setSelectedObjects] = useState<ObjectItem[]>([]);
   const [isImporting, setIsImporting] = useState(false);
 
   // Module selections
   const [htmlSources, setHtmlSources] = useState<HTMLSource[]>([]);
   const [selectedHeader, setSelectedHeader] = useState<number | null>(null);
   const [selectedBody, setSelectedBody] = useState<number | null>(null);
   const [selectedFooter, setSelectedFooter] = useState<number | null>(null);
 
   // Extraction + CSS
   const [moduleContents, setModuleContents] = useState<Partial<Record<ModuleType, ModuleContent>>>({});
   const [selectors, setSelectors] = useState<string[]>([]);
   const [cssTemplate, setCssTemplate] = useState<string>('');
   const [styledCss, setStyledCss] = useState<string>('');
   const [originalCss, setOriginalCss] = useState<string>('');
   const [previewDoc, setPreviewDoc] = useState<string>('');
   const [analysisStats, setAnalysisStats] = useState<{ modules: number; selectors: number }>({ modules: 0, selectors: 0 });
   const [isExtracting, setIsExtracting] = useState(false);
   const [isApplyingCss, setIsApplyingCss] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);
   const [cssCopied, setCssCopied] = useState(false);
 
   const MODULE_SELECTION_STEP_ID = 1;
   const STRUCTURE_STEP_ID = 2;
   const CSS_STEP_ID = 3;
 
   const mapApiSourceType = (type: string): SourceType => {
     switch (type?.toUpperCase()) {
       case 'DOC': case 'PDF': return 'pdf';
       case 'IMAGE': return 'image';
       case 'VIDEO': return 'video';
       case 'TEXT': return 'text';
       case 'CODE': return 'code';
       case 'WEBSITE': return 'url';
       case 'HTML': return 'html';
       case 'CONFIG': return 'config';
       default: return 'text';
     }
   };
 
   const selectorsPreview = useMemo(() => selectors.slice(0, 60), [selectors]);
 
   useEffect(() => {
     const load = async () => {
       try {
         setIsLoading(true);
         let productData: Product;

         let targetId: number | null = id ? parseInt(id) : null;
         if (!targetId) {
           const ensured = await getOrCreateProductByType('style_transfer_maker', {
             title: t.products.fixed.styleTransferTitle ?? 'Style Transfer',
             description: t.products.fixed.styleTransferDesc ?? '',
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
         await loadSavedProgress(productData.id);
       } catch (err) {
         console.error('[StyleTransferView] Error loading product:', err);
       } finally {
         setIsLoading(false);
       }
     };
     load();
   }, [id]);
 
   useEffect(() => {
     const html = sources
       .filter(s => s.type === 'html' || (s as any).backendType === 'HTML')
       .map(s => ({ id: parseInt(s.id), name: s.title, type: 'HTML' }));
     setHtmlSources(html);
   }, [sources]);
 
   const loadSavedProgress = async (productId: number) => {
     try {
       const progressData = await getProductStepProgress(productId);
       const selection = progressData.find(p => p.stepId === MODULE_SELECTION_STEP_ID);
       if (selection?.resultText) {
         const { headerSourceId, bodySourceId, footerSourceId } = selection.resultText;
         if (headerSourceId) setSelectedHeader(headerSourceId);
         if (bodySourceId) setSelectedBody(bodySourceId);
         if (footerSourceId) setSelectedFooter(footerSourceId);
       }

       const structure = progressData.find(p => p.stepId === STRUCTURE_STEP_ID);
       if (structure?.resultText) {
         if (structure.resultText.selectors) setSelectors(structure.resultText.selectors);
         if (structure.resultText.cssTemplate) setCssTemplate(structure.resultText.cssTemplate);
         if (structure.resultText.stats) setAnalysisStats(structure.resultText.stats);
       }

       const cssStep = progressData.find(p => p.stepId === CSS_STEP_ID);
       if (cssStep?.resultText?.styledCss) {
         setStyledCss(cssStep.resultText.styledCss);
       }
     } catch (err) {
       console.error('[StyleTransferView] Error loading progress:', err);
     }
   };
 
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
           console.error('[StyleTransferView] Error loading source', src.id, e);
         }
       }
       setSources(loaded);
     } catch (err) {
       console.error('[StyleTransferView] Error loading sources:', err);
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
       console.error('[StyleTransferView] Error adding source:', err);
       alert('Error al agregar la fuente.');
     }
   };
 
   const handleDeleteSource = async (sourceId: string) => {
     if (!product?.rag?.id) return;
     try {
       await deleteRagMultimodalSource(parseInt(sourceId));
       await loadRagSources(product.rag.id);
     } catch (err) {
       console.error('[StyleTransferView] Error deleting source:', err);
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
       console.error('[StyleTransferView] Error importing objects:', err);
     } finally {
       setIsImporting(false);
     }
   };
 
   const handleToggleSource = (sourceId: string) => {
     setSources(prev => prev.map(s => s.id === sourceId ? { ...s, selected: !s.selected } : s));
   };
 
   const handleTitleChange = (v: string) => { if (product && isOwner) setProduct({ ...product, title: v }); };
   const handleTitleBlur   = async () => { if (product && isOwner) await updateProduct(product.id, { title: product.title }).catch(() => {}); };
   const handleDescChange  = (v: string) => { if (product && isOwner) setProduct({ ...product, description: v }); };
   const handleDescBlur    = async () => { if (product && isOwner) await updateProduct(product.id, { description: product.description }).catch(() => {}); };
 
   const handleCopyUrl = () => {
     if (!product) return;
     navigator.clipboard.writeText(`${window.location.origin}/product/style-transfer/${product.id}`);
     setUrlCopied(true);
     setTimeout(() => setUrlCopied(false), 2000);
   };
 
   const stripScriptsAndStyles = (doc: Document) => {
     doc.querySelectorAll('script').forEach(el => el.remove());
    doc.querySelectorAll('link[rel="stylesheet"], link[as="style"], link[type="text/css"]').forEach(el => el.remove());
     const styles: string[] = [];
     doc.querySelectorAll('style').forEach(el => { styles.push(el.textContent || ''); el.remove(); });
     return styles.join('\n');
   };

  const sanitizeModuleHtml = (doc: Document): string => {
    // Remove inline styles to avoid conflictos con el CSS nuevo
    doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    // Evita drag & drop scripts embebidos en attrs
    doc.querySelectorAll('[onload],[onclick],[onmouseover],[onerror],[onchange],[onsubmit],[onfocus],[onblur]').forEach(el => {
      el.removeAttribute('onload');
      el.removeAttribute('onclick');
      el.removeAttribute('onmouseover');
      el.removeAttribute('onerror');
      el.removeAttribute('onchange');
      el.removeAttribute('onsubmit');
      el.removeAttribute('onfocus');
      el.removeAttribute('onblur');
    });
    return doc.body.innerHTML;
  };
 
   const fetchModuleContent = async (sourceId: number, name: string): Promise<ModuleContent | null> => {
     try {
       const res = await getRagMultimodalSourceContent(sourceId);
       if (res.isUrl) {
         return { html: `<p>External: <a href="${res.content}">${res.name}</a></p>`, css: '', name };
       }
       const parser = new DOMParser();
       const doc = parser.parseFromString(res.content, 'text/html');
       const css = stripScriptsAndStyles(doc);
      const cleanHtml = sanitizeModuleHtml(doc);
      return { html: cleanHtml, css, name };
     } catch (err) {
       console.error('[StyleTransferView] Error fetching module content', err);
       return null;
     }
   };
 
  type SelectorInfo = { selector: string; comment?: string; layout?: boolean };

  const buildContextComment = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = el.classList.length ? `.${Array.from(el.classList).join('.')}` : '';
    const self = `<${tag}${id}${cls}>`;
    const parent = el.parentElement;
    if (!parent) return self;
    const pTag = parent.tagName.toLowerCase();
    const pId = parent.id ? `#${parent.id}` : '';
    const pCls = parent.classList.length ? `.${Array.from(parent.classList).join('.')}` : '';
    return `${self} hijo de <${pTag}${pId}${pCls}>`;
  };

  const extractSelectorsFromHtml = (html: string): SelectorInfo[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const seen = new Map<string, SelectorInfo>();

    const addSelector = (sel: string, el: Element) => {
      if (!sel) return;
      if (!seen.has(sel)) {
        seen.set(sel, { selector: sel, comment: buildContextComment(el) });
      }
    };

    doc.querySelectorAll('*').forEach(el => {
      const id = el.id?.trim();
      if (id) addSelector(`#${id}`, el);

      const classes = Array.from(el.classList).filter(Boolean);
      if (classes.length) {
        // selector combinado por todas las clases
        addSelector(`.${classes.join('.')}`, el);
        // selector por clase individual
        classes.forEach(cls => addSelector(`.${cls}`, el));
      }

      // Hints de layout: si el elemento tiene clases y hijos con clase/id, sugerimos definir layout
      const hasOwnClass = classes.length > 0;
      const childrenWithClass = Array.from(el.children).some(child => {
        const c = child as Element;
        return c.classList?.length || c.id;
      });
      if (hasOwnClass && childrenWithClass) {
        const primary = `.${classes[0]}`;
        const hintKey = `${primary} > *`;
        if (!seen.has(hintKey)) {
          seen.set(hintKey, {
            selector: hintKey,
            comment: `${buildContextComment(el)} — contenedor, define flex/grid aquí`,
            layout: true,
          });
        }
      }
    });

    return Array.from(seen.values()).sort((a, b) => a.selector.localeCompare(b.selector));
  };

  const buildCssTemplate = (modules: Array<{ label: string; selectors: SelectorInfo[] }>): string => {
    const lines: string[] = [];
    const globalMap = new Map<string, SelectorInfo>();

    modules.forEach(mod => {
      lines.push(`/* ${mod.label} */`);
      mod.selectors.forEach(info => {
        if (!globalMap.has(info.selector)) globalMap.set(info.selector, info);
        if (info.comment) lines.push(`/* ${info.comment} */`);
        if (info.layout) lines.push('/* layout container — define flex/grid aquí */');
        lines.push(`${info.selector} {\n  \n}`);
        lines.push('');
      });
    });

    lines.push('/* Global selectors (únicos) */');
    Array.from(globalMap.values())
      .sort((a, b) => a.selector.localeCompare(b.selector))
      .forEach(info => {
        if (info.comment) lines.push(`/* ${info.comment} */`);
        if (info.layout) lines.push('/* layout container — define flex/grid aquí */');
        lines.push(`${info.selector} {\n  \n}`);
        lines.push('');
      });

    return lines.join('\n');
  };
 
   const buildPreviewDocument = (css: string, contents: Partial<Record<ModuleType, ModuleContent>>): string => {
     const headerHtml = contents.HEADER?.html ?? '';
     const bodyHtml = contents.BODY?.html ?? '';
     const footerHtml = contents.FOOTER?.html ?? '';
     return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; }
    header, main, footer { width: 100%; }
    main { flex: 1; }
    ${css || ''}
  </style>
</head>
<body>
  <header id="module-header">${headerHtml}</header>
  <main id="module-body">${bodyHtml}</main>
  <footer id="module-footer">${footerHtml}</footer>
</body>
</html>`;
   };

  const ensureModuleContents = async (): Promise<Partial<Record<ModuleType, ModuleContent>>> => {
    const ensureContents: Partial<Record<ModuleType, ModuleContent>> = { ...moduleContents };
    const missing: Array<{ type: ModuleType; id: number; label: string }> = [];
    const sourceName = (idToFind: number | null) => htmlSources.find(h => h.id === idToFind)?.name || 'HTML';
    if (selectedHeader && !ensureContents.HEADER) missing.push({ type: 'HEADER', id: selectedHeader, label: `Header: ${sourceName(selectedHeader)}` });
    if (selectedBody && !ensureContents.BODY) missing.push({ type: 'BODY', id: selectedBody, label: `Body: ${sourceName(selectedBody)}` });
    if (selectedFooter && !ensureContents.FOOTER) missing.push({ type: 'FOOTER', id: selectedFooter, label: `Footer: ${sourceName(selectedFooter)}` });

    for (const mod of missing) {
      const content = await fetchModuleContent(mod.id, mod.label);
      if (content) ensureContents[mod.type] = content;
    }

    setModuleContents(ensureContents);
    return ensureContents;
  };
 
   const saveSelections = async () => {
     if (!product?.id || !isOwner) return;
     try {
       await updateProductStepProgress({
         productId: product.id,
         stepId: MODULE_SELECTION_STEP_ID,
         resultText: {
           headerSourceId: selectedHeader,
           bodySourceId: selectedBody,
           footerSourceId: selectedFooter,
         },
         status: 'success',
       });
     } catch (err) {
       console.error('[StyleTransferView] Error saving selections:', err);
     }
   };
 
   useEffect(() => {
     if (selectedHeader !== null || selectedBody !== null || selectedFooter !== null) {
       saveSelections();
     }
   }, [selectedHeader, selectedBody, selectedFooter]);
 
   const handleExtractStructure = async () => {
     if (!product?.id) return;
     const modulesToProcess: Array<{ type: ModuleType; id: number; label: string }> = [];
     const sourceName = (idToFind: number | null) => htmlSources.find(h => h.id === idToFind)?.name || 'HTML';
     if (selectedHeader) modulesToProcess.push({ type: 'HEADER', id: selectedHeader, label: `Header: ${sourceName(selectedHeader)}` });
     if (selectedBody) modulesToProcess.push({ type: 'BODY', id: selectedBody, label: `Body: ${sourceName(selectedBody)}` });
     if (selectedFooter) modulesToProcess.push({ type: 'FOOTER', id: selectedFooter, label: `Footer: ${sourceName(selectedFooter)}` });
 
     if (modulesToProcess.length === 0) {
       alert(t.styleTransferViewTranslations?.empty_selection ?? 'Selecciona al menos un módulo HTML para analizar.');
       return;
     }
 
     setIsExtracting(true);
     try {
      const contents: Partial<Record<ModuleType, ModuleContent>> = {};
      const moduleSelectors: Array<{ label: string; selectors: SelectorInfo[] }> = [];
       let collectedCss = '';
 
       for (const mod of modulesToProcess) {
         const content = await fetchModuleContent(mod.id, mod.label);
         if (!content) continue;
         contents[mod.type] = content;
         if (content.css) collectedCss += `${content.css}\n`;
         const modSelectors = extractSelectorsFromHtml(content.html);
         moduleSelectors.push({ label: mod.label, selectors: modSelectors });
       }
 
      const mergedSelectors = Array.from(new Set(moduleSelectors.flatMap(m => m.selectors.map(s => s.selector)))).sort();
      const template = buildCssTemplate(moduleSelectors);
 
       setModuleContents(contents);
       setSelectors(mergedSelectors);
       setCssTemplate(template);
       setOriginalCss(collectedCss);
       setAnalysisStats({ modules: moduleSelectors.length, selectors: mergedSelectors.length });
      setPreviewDoc(buildPreviewDocument(styledCss || template || '', contents));
 
       if (isOwner) {
         await updateProductStepProgress({
           productId: product.id,
           stepId: STRUCTURE_STEP_ID,
           resultText: {
             selectors: mergedSelectors,
             cssTemplate: template,
             stats: { modules: moduleSelectors.length, selectors: mergedSelectors.length },
           },
           status: 'success',
         });
       }
     } catch (err) {
       console.error('[StyleTransferView] Error extracting structure:', err);
     } finally {
       setIsExtracting(false);
     }
   };
 
   const handleDownloadCss = () => {
     const content = cssTemplate || t.styleTransferViewTranslations?.template_placeholder || '';
     const blob = new Blob([content], { type: 'text/css' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `style-transfer-${product?.id ?? 'template'}.css`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
   };
 
   const handleCopyCss = async () => {
     try {
       await navigator.clipboard.writeText(cssTemplate || '');
       setCssCopied(true);
       setTimeout(() => setCssCopied(false), 1800);
     } catch (err) {
       console.error('[StyleTransferView] Error copying CSS:', err);
     }
   };
 
   const handleCssUpload = async (file?: File, textOverride?: string) => {
     if (!product?.id) return;
     try {
       let cssText = textOverride ?? '';
       if (file) {
         cssText = await file.text();
       }
       if (!cssText) return;
       setStyledCss(cssText);
       if (isOwner) {
         await updateProductStepProgress({
           productId: product.id,
           stepId: CSS_STEP_ID,
           resultText: { styledCss: cssText },
           status: 'success',
         });
       }
     } catch (err) {
       console.error('[StyleTransferView] Error uploading CSS:', err);
     }
   };
 
   const handleApplyCss = async () => {
     if (!product?.id) return;
    const cssToUse = styledCss || cssTemplate;
     if (!cssToUse) return;

     setIsApplyingCss(true);
     try {
       const ensureContents = await ensureModuleContents();
       setPreviewDoc(buildPreviewDocument(cssToUse, ensureContents));
     } catch (err) {
       console.error('[StyleTransferView] Error applying CSS:', err);
     } finally {
       setIsApplyingCss(false);
     }
   };

  const handleDownloadHtml = async () => {
    if (!product?.id) return;
    const cssToUse = styledCss || cssTemplate;
    if (!cssToUse) {
      alert(t.styleTransferViewTranslations?.generate_first ?? 'Genera o carga CSS antes de descargar.');
      return;
    }

    setIsDownloadingHtml(true);
    try {
      const ensureContents = await ensureModuleContents();
      const doc = buildPreviewDocument(cssToUse, ensureContents);
      setPreviewDoc(doc);

      const blob = new Blob([doc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `style-transfer-${product?.id ?? 'preview'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[StyleTransferView] Error downloading HTML:', err);
    } finally {
      setIsDownloadingHtml(false);
    }
  };
 
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
           <p className="text-red-500 text-lg mb-4">{t.styleTransferViewTranslations?.text_notFound ?? 'Producto no encontrado o no es público'}</p>
           <button onClick={() => window.history.back()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
             {t.styleTransferViewTranslations?.text_back ?? 'Volver'}
           </button>
         </div>
       </div>
     );
   }
 
   return (
     <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
       <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
         <div className="px-6 py-4 flex items-start justify-between gap-4">
           <div className="flex-1 flex items-start gap-4">
             {isOwner && (
               <button
                 onClick={() => navigate('/dashboard/maker-path')}
                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 mt-1"
                 title={t.styleTransferViewTranslations?.text_back ?? 'Volver'}
               >
                 <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
               </button>
             )}
             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex-shrink-0 mt-1" title="Style Transfer">
               <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
             </div>
             <div className="flex-1">
               <input
                 type="text"
                 value={product.title || ''}
                 onChange={e => handleTitleChange(e.target.value)}
                 onBlur={handleTitleBlur}
                 disabled={!isOwner}
                 className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 w-full"
                 placeholder={t.styleTransferViewTranslations?.text_titlePlaceholder ?? 'Título del laboratorio de estilos'}
               />
               <input
                 type="text"
                 value={product.description || ''}
                 onChange={e => handleDescChange(e.target.value)}
                 onBlur={handleDescBlur}
                 disabled={!isOwner}
                 className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 w-full mt-1"
                 placeholder={t.styleTransferViewTranslations?.text_descPlaceholder ?? 'Descripción del producto'}
               />
             </div>
           </div>
           <div className="flex-shrink-0">
             {product.isPublic ? (
               <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                 <Check size={18} className="text-green-600 dark:text-green-400" />
                 <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                   {t.styleTransferViewTranslations?.text_public ?? 'Producto Público'}
                 </span>
               </div>
             ) : (
               <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                 <Layout size={18} className="text-gray-500 dark:text-gray-400" />
                 <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                   {t.styleTransferViewTranslations?.text_private ?? 'Producto Privado'}
                 </span>
               </div>
             )}
           </div>
         </div>

         <div className="px-6 pb-4">
           <div className="flex items-center gap-2 max-w-3xl">
             <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
               <span className="flex-1 text-sm text-indigo-600 dark:text-indigo-400 truncate">
                 {window.location.origin}/product/style-transfer/{product.id}
               </span>
               <button
                 onClick={handleCopyUrl}
                 className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded transition-colors flex-shrink-0"
                 title={t.styleTransferViewTranslations?.text_copyUrl ?? 'Copiar URL'}
               >
                 {urlCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-indigo-600 dark:text-indigo-400" />}
               </button>
             </div>
           </div>
         </div>
       </header>

       <div className="flex flex-1 overflow-hidden">
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

         <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
           <div className="max-w-4xl mx-auto space-y-6">
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
               <div className="flex items-start gap-3">
                 <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                   <Palette size={20} className="text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <div className="flex-1">
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.styleTransferViewTranslations?.hero_title ?? 'Style Transfer Lab'}</h2>
                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                     {t.styleTransferViewTranslations?.hero_subtitle ?? 'Carga HTML, extrae IDs y clases, genera un CSS base y aplica el CSS estilado.'}
                   </p>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
                 <div className="flex items-center gap-2">
                   <FileCode size={18} className="text-indigo-500" />
                   <div>
                     <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t.styleTransferViewTranslations?.selectors_title ?? 'Analizar estructura HTML'}</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400">{t.styleTransferViewTranslations?.selectors_subtitle ?? ''}</p>
                   </div>
                 </div>

                 <div className="space-y-3">
                   {MODULE_TYPES.map(({ type, label, color, icon }) => {
                     const selectedId = type === 'HEADER' ? selectedHeader : type === 'BODY' ? selectedBody : selectedFooter;
                     const setSelected = type === 'HEADER' ? setSelectedHeader : type === 'BODY' ? setSelectedBody : setSelectedFooter;
                     return (
                       <div key={type} className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                         <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700">
                           <span className="text-lg">{icon}</span>
                           <h4 className={`font-bold text-sm ${color}`}>{label}</h4>
                         </div>
                         <div className="p-4">
                           <div className="relative">
                             <select
                               value={selectedId ?? ''}
                               onChange={e => setSelected(e.target.value ? Number(e.target.value) : null)}
                               className="w-full px-3 py-2 pr-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                               disabled={!isOwner}
                             >
                               <option value="">{t.landingPageViewTranslations?.text_selectSource ?? 'Seleccionar fuente HTML...'}</option>
                               {htmlSources.map(s => (
                                 <option key={s.id} value={s.id}>{s.name}</option>
                               ))}
                             </select>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>

                 <div className="flex justify-end">
                   <button
                     onClick={handleExtractStructure}
                     disabled={isExtracting || !isOwner}
                     className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
                   >
                     {isExtracting ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                         {t.styleTransferViewTranslations?.analyzing ?? 'Extrayendo...'}
                       </>
                     ) : (
                       <>
                         <Wand2 size={16} />
                         {t.styleTransferViewTranslations?.analyze ?? 'Extraer estructura'}
                       </>
                     )}
                   </button>
                 </div>
               </div>

               <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                     <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                   </div>
                   <div className="flex-1">
                     <div className="flex items-center justify-between">
                       <span className="text-sm text-gray-500 dark:text-gray-400">{t.styleTransferViewTranslations?.modules_total ?? 'Módulos analizados'}</span>
                       <span className="text-lg font-bold text-gray-900 dark:text-white">{analysisStats.modules}</span>
                     </div>
                     <div className="flex items-center justify-between mt-1">
                       <span className="text-sm text-gray-500 dark:text-gray-400">{t.styleTransferViewTranslations?.selectors_total ?? 'Selectores únicos'}</span>
                       <span className="text-lg font-bold text-gray-900 dark:text-white">{analysisStats.selectors}</span>
                     </div>
                   </div>
                 </div>
                 <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3 h-44 overflow-y-auto text-xs text-gray-700 dark:text-gray-300">
                   {selectorsPreview.length === 0 ? (
                     <p className="text-gray-500 dark:text-gray-500">{t.styleTransferViewTranslations?.empty_selection ?? 'Selecciona al menos un módulo HTML para analizar.'}</p>
                   ) : (
                     selectorsPreview.map(sel => (
                       <div key={sel} className="py-0.5">{sel}</div>
                     ))
                   )}
                   {selectors.length > selectorsPreview.length && (
                     <p className="text-[11px] text-gray-500 mt-2">+{selectors.length - selectorsPreview.length} {t.common?.more ?? 'más'}</p>
                   )}
                 </div>
               </div>
             </div>

             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
               <div className="flex items-center justify-between gap-3">
                 <div>
                   <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t.styleTransferViewTranslations?.css_template_label ?? 'Hoja CSS base (solo selectores)'}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{t.styleTransferViewTranslations?.template_placeholder ?? ''}</p>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={handleCopyCss} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                     {cssCopied ? <Check size={14} /> : <Copy size={14} />}
                     {t.styleTransferViewTranslations?.copy_css ?? 'Copiar CSS'}
                   </button>
                   <button onClick={handleDownloadCss} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                     <Download size={14} />
                     {t.styleTransferViewTranslations?.download_css ?? 'Descargar CSS'}
                   </button>
                 </div>
               </div>
               <textarea
                 value={cssTemplate}
                 className="w-full min-h-[160px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 placeholder={t.styleTransferViewTranslations?.template_placeholder ?? '/* Selectores listos para que otra IA agregue estilos */'}
                 readOnly
               />
             </div>

             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
               <div className="flex items-center gap-2">
                 <UploadCloud size={18} className="text-indigo-500" />
                 <div>
                   <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t.styleTransferViewTranslations?.upload_css_label ?? 'Subir / pegar CSS estilado'}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{t.styleTransferViewTranslations?.upload_css_hint ?? ''}</p>
                 </div>
               </div>
               <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                 <input
                   type="file"
                   accept=".css"
                   onChange={e => handleCssUpload(e.target.files?.[0])}
                   disabled={!isOwner}
                   className="text-sm text-gray-700 dark:text-gray-200"
                 />
                 <button
                   onClick={handleApplyCss}
                   disabled={isApplyingCss || !isOwner}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
                 >
                   {isApplyingCss ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <UploadCloud size={16} />}
                   {t.styleTransferViewTranslations?.apply_css ?? 'Aplicar CSS al preview'}
                 </button>
               </div>
               <textarea
                 value={styledCss}
                 onChange={e => setStyledCss(e.target.value)}
                 onBlur={() => handleCssUpload(undefined, styledCss)}
                 className="w-full min-h-[140px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 placeholder={t.styleTransferViewTranslations?.css_placeholder ?? '/* CSS generado por tu IA */'}
                 disabled={!isOwner}
               />
             </div>

             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
               <div className="flex items-center gap-2">
                 <Layout size={18} className="text-indigo-500" />
                 <div>
                   <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t.styleTransferViewTranslations?.preview_title ?? 'Vista previa HTML + CSS'}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{t.styleTransferViewTranslations?.preview_hint ?? ''}</p>
                 </div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={handleDownloadHtml}
                    disabled={isDownloadingHtml || !isOwner}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    {isDownloadingHtml ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent" /> : <Download size={14} />}
                    {t.styleTransferViewTranslations?.download_html ?? 'Descargar HTML'}
                  </button>
                </div>
               </div>
               <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 min-h-[320px]">
                 {previewDoc ? (
                   <iframe title="style-preview" srcDoc={previewDoc} className="w-full h-[420px] bg-white" />
                 ) : (
                   <div className="h-[240px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                     {t.styleTransferViewTranslations?.upload_css_hint ?? 'Genera la vista previa aplicando un CSS.'}
                   </div>
                 )}
               </div>
             </div>
           </div>
         </main>
       </div>

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

 export default StyleTransferView;
