import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Copy, Check, Loader2, Globe, Lock, Code2, Cpu } from 'lucide-react';
import { getProduct, getPublicProduct, getOrCreateProductByType, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { perplexityService } from '@core/perplexity/perplexity.service';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

// Step IDs para product_step_progress
const STEP_INPUT = 1;   // Búsqueda de entrada
const STEP_OUTPUT = 2;  // Resultado de Perplexity

// Utilidad para renderizar Markdown con clases modernas y limpias. 
// Convierte títulos, listas, negritas, links, citas y código inline en HTML decorado.
const renderMarkdown = (text: string): string => {
  if (!text) return '';
  const escape = (v: string) =>
    v
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const formatInline = (line: string): string =>
    escape(line)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 text-sm font-mono text-blue-700 dark:text-blue-300">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1">$1<svg class="w-3 h-3 mb-0.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>');

  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith('### ')) {
      result.push(`<h4 class="text-lg font-bold text-blue-900 dark:text-blue-200 mt-6 mb-3 tracking-tight">${formatInline(line.slice(4))}</h4>`);
    } else if (line.startsWith('## ')) {
      result.push(`<h3 class="text-xl font-bold text-blue-800 dark:text-blue-300 mt-8 mb-4 flex items-center gap-2 tracking-tight"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500 opacity-80"><path d="m9 18 6-6-6-6"/></svg> ${formatInline(line.slice(3))}</h3>`);
    } else if (line.startsWith('# ')) {
      result.push(`<h2 class="text-2xl font-extrabold text-blue-950 dark:text-white mt-8 mb-5 border-b border-gray-200 dark:border-gray-800 pb-3 tracking-tight">${formatInline(line.slice(2))}</h2>`);
    } else if (line.match(/^[\-\*]\s/)) {
      result.push(`<div class="flex items-start gap-3 mb-3"><div class="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div><p class="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">${formatInline(line.replace(/^[\-\*]\s/, ''))}</p></div>`);
    } else if (line.match(/^\d+\.\s/)) {
      const numMatch = line.match(/^(\d+)\.\s/);
      const content = line.replace(/^\d+\.\s/, '');
      result.push(`<div class="flex items-start gap-3 mb-3"><span class="flex-shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums pt-0.5">${numMatch?.[1]}.</span><p class="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">${formatInline(content)}</p></div>`);
    } else if (line.match(/^> /)) {
      result.push(`<blockquote class="border-l-4 border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500 rounded-r-xl p-5 my-6 italic text-gray-700 dark:text-gray-300">${formatInline(line.slice(2))}</blockquote>`);
    } else if (line === '') {
      result.push('<div class="h-4"></div>');
    } else {
      result.push(`<p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">${formatInline(rawLine)}</p>`);
    }
  }

  return result.join('');
};

const PerplexitySearchView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = !!tokenStorage.get();

  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // UI state
  const [inputQuery, setInputQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [modelInfo, setModelInfo] = useState<{ model: string; provider: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputCopied, setOutputCopied] = useState(false);
  const [searchCount, setSearchCount] = useState<number>(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load product
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        let targetId: number | null = id ? parseInt(id) : null;

        if (!targetId) {
          const tr = (t as any).perplexitySearch;
          const ensured = await getOrCreateProductByType('perplexity_search', {
            title: tr?.title ?? 'Búsqueda Perplexity',
            description: tr?.subtitle ?? 'Investiga conceptos, temas y datos con una estructuración clara y profunda.',
          });
          targetId = ensured.id;
        }

        let productData: Product;
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
        if (productData?.id) {
          loadSearchStorage(productData.id);
        }
        await loadPreviousProgress(productData.id);
      } catch (err) {
        console.error('[PerplexitySearchView] Error loading product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated, t]);

  const loadSearchStorage = (productId: number) => {
    try {
      const historyKey = `perplexity_history_${productId}`;
      const countKey = `perplexity_count_${productId}`;
      const storedHistory = localStorage.getItem(historyKey);
      const storedCount = localStorage.getItem(countKey);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) setSearchHistory(parsed);
      }
      if (storedCount) {
        const parsedCount = parseInt(storedCount, 10);
        if (!Number.isNaN(parsedCount)) setSearchCount(parsedCount);
      }
    } catch (err) {
      console.error('[PerplexitySearchView] Error loading search storage:', err);
    }
  };

  const persistSearchStorage = (productId: number, nextHistory: string[], nextCount: number) => {
    try {
      localStorage.setItem(`perplexity_history_${productId}`, JSON.stringify(nextHistory));
      localStorage.setItem(`perplexity_count_${productId}`, String(nextCount));
    } catch (err) {
      console.error('[PerplexitySearchView] Error saving search storage:', err);
    }
  };

  const loadPreviousProgress = async (productId: number) => {
    try {
      const progress = await getProductStepProgress(productId);
      const inputStep = progress.find(p => p.stepId === STEP_INPUT);
      const outputStep = progress.find(p => p.stepId === STEP_OUTPUT);
      if (inputStep?.resultText?.query) setInputQuery(inputStep.resultText.query);
      if (outputStep?.resultText?.searchResult) {
        setSearchResult(outputStep.resultText.searchResult);
        if (outputStep.resultText.model) {
          setModelInfo({
            model: outputStep.resultText.model,
            provider: outputStep.resultText.provider || 'perplexity_api'
          });
        }
      }
    } catch (err) {
      console.error('[PerplexitySearchView] Error loading progress:', err);
    }
  };

  const handleSearch = async () => {
    if (!inputQuery.trim()) {
      setError((t as any).perplexitySearch?.errorEmpty ?? 'Escribe un tema para buscar.');
      return;
    }
    if (!product?.id) return;

    setIsSearching(true);
    setError(null);
    setSearchResult('');
    setModelInfo(null);

    try {
      const response = await perplexityService.search(inputQuery.trim(), {
        makerPathId: product.templateId ?? undefined,
        systemInstruction: product.description ?? undefined,
      });
      const content = response.content;
      const model = response.model;
      const provider = response.provider;

      const nextCount = typeof response.searchesCount === 'number' ? response.searchesCount : searchCount + 1;
      const nextHistory = [inputQuery.trim(), ...searchHistory.filter((item) => item !== inputQuery.trim())].slice(0, 8);
      setSearchCount(nextCount);
      setSearchHistory(nextHistory);
      persistSearchStorage(product.id, nextHistory, nextCount);

      setSearchResult(content);
      setModelInfo({ model, provider });

      // Guardar en product_step_progress
      await updateProductStepProgress({
        productId: product.id,
        stepId: STEP_INPUT,
        status: 'success',
        resultText: { query: inputQuery.trim() },
      });
      await updateProductStepProgress({
        productId: product.id,
        stepId: STEP_OUTPUT,
        status: 'success',
        resultText: { searchResult: content, model, provider },
      });
    } catch (err: any) {
      console.error('[PerplexitySearchView] Search error:', err);
      setError((t as any).perplexitySearch?.errorSearch ?? 'Hubo un error al realizar la búsqueda.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyOutput = async () => {
    if (!searchResult) return;
    await navigator.clipboard.writeText(searchResult);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/product/perplexity-search/${product?.id}`);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Guards
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">
            {(t as any).promptOptimizer?.notFound ?? 'Producto no encontrado'}
          </p>
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {(t as any).perplexitySearch?.back ?? 'Volver'}
          </button>
        </div>
      </div>
    );
  }

  const tr = (t as any).perplexitySearch ?? {};
  const tOptim = (t as any).promptOptimizer ?? {}; // Reusing some common keys

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 flex items-start gap-4">
            {isOwner && (
              <button
                onClick={() => navigate('/dashboard/context')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 mt-1"
                title={tr.back ?? 'Volver'}
              >
                <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex-shrink-0 mt-1 shadow-sm">
              <Search size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-500 dark:from-blue-400 dark:to-sky-300">
                {tr.title ?? 'Búsqueda Perplexity'}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                {tr.subtitle ?? 'Investiga conceptos, temas y datos con una estructuración clara y profunda.'}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {product.isPublic ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {tOptim.publicProduct ?? 'Público'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {tOptim.privateProduct ?? 'Privado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* URL row */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 max-w-3xl">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-800/60 rounded-lg">
              <span className="flex-1 text-sm text-blue-600 dark:text-blue-400 truncate font-mono">
                {window.location.origin}/product/perplexity-search/{product.id}
              </span>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors flex-shrink-0"
                title={tOptim.copyUrl ?? 'Copiar URL'}
              >
                {urlCopied ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} className="text-blue-600 dark:text-blue-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 md:px-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Input section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                {tr.inputLabel ?? '¿Qué tema deseas investigar?'}
              </h2>
            </div>
            <div className="p-6">
              <textarea
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={!isOwner}
                placeholder={tr.inputPlaceholder ?? 'Escribe aquí el tema, concepto o pregunta que quieras que Perplexity analice a profundidad...'}
                rows={4}
                className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-all shadow-inner"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-medium">
                <span>{inputQuery.length} {t.common?.characters ?? 'caracteres'} (Ctrl+Enter para buscar)</span>
                {isOwner && (
                  <button
                    onClick={() => { setInputQuery(''); setSearchResult(''); setError(null); setModelInfo(null); }}
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {tr.clear ?? 'Limpiar'}
                  </button>
                )}
              </div>
              {searchHistory.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchHistory.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setInputQuery(item)}
                      className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Search button */}
          {isOwner && (
            <button
              onClick={handleSearch}
              disabled={!inputQuery.trim() || isSearching}
              className="w-full relative overflow-hidden group flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-blue-600 to-sky-600 text-white text-[15px] font-bold rounded-2xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isSearching ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {tr.searching ?? 'Investigando y estructurando...'}
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <Search size={20} className="relative z-10" />
                  <span className="relative z-10">{tr.searchButton ?? 'Buscar y Organizar'}</span>
                </>
              )}
            </button>
          )}

          {/* Output section */}
          {searchResult && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="px-6 py-4 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between bg-blue-50/80 dark:bg-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-lg">
                    <Search size={16} className="text-blue-700 dark:text-blue-300" />
                  </div>
                  <h2 className="font-bold text-blue-900 dark:text-blue-200 text-sm tracking-wide uppercase">
                    {tr.outputLabel ?? 'Resumen o Investigación'}
                  </h2>
                </div>
                <button
                  onClick={handleCopyOutput}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow active:scale-95 rounded-lg transition-all"
                >
                  {outputCopied ? (
                    <>
                      <Check size={14} />
                      {tr.copied ?? '¡Copiado!'}
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      {tr.copy ?? 'Copiar'}
                    </>
                  )}
                </button>
              </div>
              <div className="p-8">
                <div 
                  className="prose dark:prose-invert max-w-none prose-blue"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(searchResult) }}
                />
              </div>

              {/* Powered By Badge */}
              {modelInfo && (
                <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      Powered by
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                      <Code2 size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                        {modelInfo.provider.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800">
                      Mod: {modelInfo.model}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PerplexitySearchView;
