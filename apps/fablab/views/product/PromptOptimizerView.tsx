import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Copy, Check, Upload, Loader2, Globe, Lock } from 'lucide-react';
import { getProduct, getPublicProduct, getOrCreateProductByType, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { geminiService } from '@core/gemini/gemini.service';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

// Step IDs para product_step_progress
const STEP_INPUT = 1;   // Prompt de entrada
const STEP_OUTPUT = 2;  // Prompt optimizado

// Instrucción interna para Gemini — no visible para el usuario
const SYSTEM_INSTRUCTIONS = `Eres un experto en ingeniería de prompts. Tu única tarea es recibir un prompt del usuario y devolver una versión mejorada y optimizada del mismo.

Al optimizar debes:
1. Clarificar el OBJETIVO principal del prompt
2. Añadir CONTEXTO relevante que pueda faltar
3. Especificar el FORMATO de salida esperado si no está claro
4. Agregar DETALLES y restricciones que mejoren la precisión
5. Estructurar el prompt con claridad lógica y progresiva
6. Mantener la intención original del usuario sin cambiar el tema

Responde ÚNICAMENTE con el prompt optimizado, sin explicaciones adicionales, sin comentarios previos, sin texto introductorios. Solo el prompt mejorado listo para usar.`;

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
            title: tr?.productTitle ?? 'Optimizador de Prompt',
            description: tr?.productDesc ?? 'Optimiza tus prompts con IA.',
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
  }, [id]);

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
      const response = await geminiService.chatWithAssistant(
        { instructions: SYSTEM_INSTRUCTIONS },
        [{ role: 'user', content: inputPrompt.trim() }]
      );

      const optimized = response.content;
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
    await navigator.clipboard.writeText(optimizedPrompt);
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
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex-shrink-0 mt-1">
              <Wand2 size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {tr.title ?? 'Optimizador de Prompt'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {tr.subtitle ?? 'Mejora la estructura, objetivo y detalle de tus prompts con IA'}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {product.isPublic ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {tr.publicProduct ?? 'Público'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
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
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <span className="flex-1 text-sm text-indigo-600 dark:text-indigo-400 truncate">
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
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Input section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
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
            <div className="p-5">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={!isOwner}
                placeholder={tr.inputPlaceholder ?? 'Escribe tu prompt aquí o carga un archivo .txt / .md...'}
                rows={8}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{inputPrompt.length} {t.common?.characters ?? 'caracteres'}</span>
                {isOwner && (
                  <button
                    onClick={() => { setInputPrompt(''); setOptimizedPrompt(''); setError(null); }}
                    className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {tr.clear ?? 'Limpiar'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Optimize button */}
          {isOwner && (
            <button
              onClick={handleOptimize}
              disabled={!inputPrompt.trim() || isOptimizing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isOptimizing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {tr.optimizing ?? 'Optimizando...'}
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  {tr.optimizeButton ?? 'Optimizar Prompt'}
                </>
              )}
            </button>
          )}

          {/* Output section */}
          {optimizedPrompt && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/10">
                <h2 className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm flex items-center gap-2">
                  <Wand2 size={15} />
                  {tr.outputLabel ?? 'Prompt optimizado'}
                </h2>
                <button
                  onClick={handleCopyOutput}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {outputCopied ? (
                    <>
                      <Check size={13} />
                      {tr.copied ?? '¡Copiado!'}
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      {tr.copy ?? 'Copiar'}
                    </>
                  )}
                </button>
              </div>
              <div className="p-5">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-sans leading-relaxed">
                  {optimizedPrompt}
                </pre>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PromptOptimizerView;
