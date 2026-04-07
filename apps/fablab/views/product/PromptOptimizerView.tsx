import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Copy, Check, Upload, Loader2, Globe, Lock } from 'lucide-react';
import { getProduct, getPublicProduct, getOrCreateProductByType, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { httpClient, tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

// Step IDs para product_step_progress
const STEP_INPUT = 1;   // Prompt de entrada
const STEP_OUTPUT = 2;  // Prompt optimizado

// Instrucción interna para Gemini
const SYSTEM_INSTRUCTIONS = `Eres un experto AI en ingeniería de prompts. Tu única tarea es recibir un prompt del usuario y devolver una versión significativamente mejorada, estructurada y optimizada para ser usada directamente.

Usa ESTE FORMATO EXACTO y simple para tu respuesta (reemplazando los corchetes con el análisis real de altísima calidad):

## Objetivo Principal
[Define claramente qué se quiere lograr con el prompt en 1 o 2 párrafos cortos]

## Contexto y Detalles Adicionales
- [Contexto crucial 1]
- [Detalle o restricción a considerar 1]

## Formato de Salida
[Cómo debe entregar la respuesta la IA generativa que reciba este prompt final]

## Prompt Optimizado
[Escribe o reescribe aquí el prompt completo, claro y con el máximo nivel de detalle para que el usuario solo tenga que copiarlo. Redáctalo en forma de párrafo fluido pero estructurado, ideal para que cualquir IA lo procese perfecto, sin formato raro ni tablas, usando lenguaje directo y claro.]

Asegúrate de NO CORTAR LA SALIDA NUNCA. Expande cada detalle con maestría. NO incluyas introducciones ni despedidas. Genera textos funcionales, normales y puros.`;

// Utilidad para renderizar Markdown con theme de Prompt Optimizer (Indigo/Purple)
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
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 text-sm font-mono text-indigo-700 dark:text-indigo-300">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1">$1<svg class="w-3 h-3 mb-0.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>');

  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith('### ')) {
      result.push(`<h4 class="text-lg font-bold text-indigo-900 dark:text-indigo-200 mt-6 mb-3 tracking-tight">${formatInline(line.slice(4))}</h4>`);
    } else if (line.startsWith('## ')) {
      result.push(`<h3 class="text-xl font-bold text-indigo-800 dark:text-indigo-300 mt-8 mb-4 flex items-center gap-2 tracking-tight"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500 opacity-80"><path d="m9 18 6-6-6-6"/></svg> ${formatInline(line.slice(3))}</h3>`);
    } else if (line.startsWith('# ')) {
      result.push(`<h2 class="text-2xl font-extrabold text-indigo-950 dark:text-white mt-8 mb-5 border-b border-gray-200 dark:border-gray-800 pb-3 tracking-tight">${formatInline(line.slice(2))}</h2>`);
    } else if (line.match(/^[\-\*]\s/)) {
      result.push(`<div class="flex items-start gap-3 mb-3"><div class="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div><p class="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">${formatInline(line.replace(/^[\-\*]\s/, ''))}</p></div>`);
    } else if (line.match(/^\d+\.\s/)) {
      const numMatch = line.match(/^(\d+)\.\s/);
      const content = line.replace(/^\d+\.\s/, '');
      result.push(`<div class="flex items-start gap-3 mb-3"><span class="flex-shrink-0 text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums pt-0.5">${numMatch?.[1]}.</span><p class="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">${formatInline(content)}</p></div>`);
    } else if (line.match(/^> /)) {
      result.push(`<div class="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-5 my-5 text-gray-800 dark:text-gray-200 text-[15px] font-medium">\n${formatInline(line.slice(2))}</div>`);
    } else if (line.match(/^>/)) {
       result.push(`${formatInline(line.slice(1))}<br/>`);
    } else if (line === '') {
      result.push('<div class="h-4"></div>');
    } else {
      result.push(`<p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">${formatInline(rawLine)}</p>`);
    }
  }

  return result.join('');
};

const PromptOptimizerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = !!tokenStorage.get();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // UI state
  const [inputPrompt, setInputPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputCopied, setOutputCopied] = useState(false);

  // Load product
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        let targetId: number | null = id ? parseInt(id) : null;

        if (!targetId) {
          const tr = (t as any).promptOptimizer;
          const ensured = await getOrCreateProductByType('prompt_optimizer', {
            title: tr?.title ?? 'Optimizador de Prompt',
            description: tr?.subtitle ?? 'Optimiza la estructura, objetivo y detalle de tus prompts con IA.',
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
        await loadPreviousProgress(productData.id);
      } catch (err) {
        console.error('[PromptOptimizerView] Error loading product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated, t]);

  const loadPreviousProgress = async (productId: number) => {
    try {
      const progress = await getProductStepProgress(productId);
      const inputStep = progress.find(p => p.stepId === STEP_INPUT);
      const outputStep = progress.find(p => p.stepId === STEP_OUTPUT);
      if (inputStep?.resultText?.prompt) setInputPrompt(inputStep.resultText.prompt);
      if (outputStep?.resultText?.optimized) setOptimizedPrompt(outputStep.resultText.optimized);
    } catch (err) {
      console.error('[PromptOptimizerView] Error loading progress:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['.txt', '.md'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setError((t as any).promptOptimizer?.errorFileType ?? 'Solo se permiten archivos .txt o .md');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setInputPrompt(content);
      setError(null);
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOptimize = async () => {
    if (!inputPrompt.trim()) {
      setError((t as any).promptOptimizer?.errorEmpty ?? 'Escribe o carga un prompt primero');
      return;
    }
    if (!product?.id) return;

    setIsOptimizing(true);
    setError(null);
    setOptimizedPrompt('');

    try {
      const promptPayload = [
        'SYSTEM INSTRUCTIONS:',
        SYSTEM_INSTRUCTIONS,
        '',
        'USER PROMPT TO OPTIMIZE:',
        inputPrompt.trim()
      ].join('\n');

      const response = await httpClient.post<{ text?: string; content?: string }>('/api/v1/gemini/generate', {
        prompt: promptPayload,
        options: {
          maxTokens: 8000,
          temperature: 0.3
        }
      });

      const optimized = response.content || response.text || '';
      
      if (!optimized) {
        throw new Error('Respuesta vacía del servidor AI.');
      }

      setOptimizedPrompt(optimized);

      // Guardar en product_step_progress
      await updateProductStepProgress({
        productId: product.id,
        stepId: STEP_INPUT,
        status: 'success',
        resultText: { prompt: inputPrompt.trim() },
      });
      await updateProductStepProgress({
        productId: product.id,
        stepId: STEP_OUTPUT,
        status: 'success',
        resultText: { optimized },
      });
    } catch (err: any) {
      console.error('[PromptOptimizerView] Optimization error:', err);
      setError((t as any).promptOptimizer?.errorOptimize ?? 'Error al optimizar el prompt');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyOutput = async () => {
    if (!optimizedPrompt) return;
    
    // El usuario quiere copiar ABSOLUTAMENTE TODO (Objetivos, contexto, el prompt).
    // Limpiamos los caracteres de markdown (##, **, etc.) para que se copie el texto puro y legible.
    const textToCopy = optimizedPrompt
      .replace(/^###?\s+/gm, '') // Quita ## o ###
      .replace(/\*\*(.*?)\*\*/g, '$1') // Quita negritas **texto**
      .replace(/\*(.*?)\*/g, '$1') // Quita cursivas *texto*
      .trim();

    await navigator.clipboard.writeText(textToCopy);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/product/prompt-optimizer/${product?.id}`);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Guards
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
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
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            {(t as any).promptOptimizer?.back ?? 'Volver'}
          </button>
        </div>
      </div>
    );
  }

  const tr = (t as any).promptOptimizer ?? {};

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
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex-shrink-0 mt-1 shadow-sm">
              <Wand2 size={22} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-500 dark:from-indigo-400 dark:to-purple-300">
                {tr.title ?? 'Optimizador de Prompt'}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                {tr.subtitle ?? 'Mejora la estructura, objetivo y detalle de tus prompts con IA'}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {product.isPublic ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {tr.publicProduct ?? 'Público'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {tr.privateProduct ?? 'Privado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* URL row */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 max-w-3xl">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/60 dark:border-indigo-800/60 rounded-lg">
              <span className="flex-1 text-sm text-indigo-600 dark:text-indigo-400 truncate font-mono">
                {window.location.origin}/product/prompt-optimizer/{product.id}
              </span>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded transition-colors flex-shrink-0"
                title={tr.copyUrl ?? 'Copiar URL'}
              >
                {urlCopied ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} className="text-indigo-600 dark:text-indigo-400" />
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
                {tr.inputLabel ?? 'Tu prompt original'}
              </h2>
              {isOwner && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="prompt-file-upload"
                  />
                  <label
                    htmlFor="prompt-file-upload"
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  >
                    <Upload size={13} />
                    {tr.uploadFile ?? 'Cargar archivo (.txt, .md)'}
                  </label>
                </div>
              )}
            </div>
            <div className="p-6">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={!isOwner}
                placeholder={tr.inputPlaceholder ?? 'Escribe tu prompt aquí o carga un archivo .txt / .md...'}
                rows={6}
                className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all shadow-inner"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-medium">
                <span>{inputPrompt.length} {t.common?.characters ?? 'caracteres'}</span>
                {isOwner && (
                  <button
                    onClick={() => { setInputPrompt(''); setOptimizedPrompt(''); setError(null); }}
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {tr.clear ?? 'Limpiar'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Optimize button */}
          {isOwner && (
            <button
              onClick={handleOptimize}
              disabled={!inputPrompt.trim() || isOptimizing}
              className="w-full relative overflow-hidden group flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[15px] font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isOptimizing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {tr.optimizing ?? 'Optimizando...'}
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <Wand2 size={20} className="relative z-10" />
                  <span className="relative z-10">{tr.optimizeButton ?? 'Optimizar Prompt'}</span>
                </>
              )}
            </button>
          )}

          {/* Output section */}
          {optimizedPrompt && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between bg-indigo-50/80 dark:bg-indigo-900/20">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-800 p-1.5 rounded-lg">
                    <Wand2 size={16} className="text-indigo-700 dark:text-indigo-300" />
                  </div>
                  <h2 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm tracking-wide uppercase">
                    {tr.outputLabel ?? 'Prompt optimizado'}
                  </h2>
                </div>
                <button
                  onClick={handleCopyOutput}
                  title="Copia el prompt optimizado final"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow active:scale-95 rounded-lg transition-all"
                >
                  {outputCopied ? (
                    <>
                      <Check size={14} />
                      {tr.copied ?? '¡Copiado!'}
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copiar Prompt Final
                    </>
                  )}
                </button>
              </div>
              <div className="p-8">
                <div 
                  className="prose dark:prose-invert max-w-none prose-indigo"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(optimizedPrompt) }}
                />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PromptOptimizerView;
