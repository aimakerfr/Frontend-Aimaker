import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  PlayCircle,
  Rocket,
  Route,
  Save,
  Search,
  FileText,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import {
  createProductFromTemplate,
  getProduct,
  getProducts,
  type Product,
} from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { createObject } from '@core/objects';
import { perplexityService } from '@core/perplexity/perplexity.service';
import { HttpClientError, httpClient } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

type WizardStep = {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
};

type ProjectKind = 'landing_page' | 'website' | 'assistant' | 'web_app';

const SYSTEM_INSTRUCTIONS = `Eres un experto AI en ingenieria de prompts. Tu unica tarea es recibir un prompt del usuario y devolver una version mejorada, estructurada y optimizada para uso directo.

Responde en texto claro, sin markdown.`;

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, titleKey: 'step1Title', descriptionKey: 'step1Description', icon: Route },
  { id: 2, titleKey: 'step2Title', descriptionKey: 'step2Description', icon: Search },
  { id: 3, titleKey: 'step3Title', descriptionKey: 'step3Description', icon: BookOpen },
  { id: 4, titleKey: 'step4Title', descriptionKey: 'step4Description', icon: Wand2 },
  { id: 5, titleKey: 'step5Title', descriptionKey: 'step5Description', icon: PlayCircle },
  { id: 6, titleKey: 'step6Title', descriptionKey: 'step6Description', icon: Rocket },
];

const toNumericId = (value: unknown): number | null => {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
};

const toPlainStructuredText = (raw: string): string => {
  if (!raw) return '';

  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/^\s*\d+\.\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const toStructuredHtml = (text: string): string => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const safe = escapeHtml(line);
      const isTitle = safe.endsWith(':') || /^[A-Z][A-Za-z0-9\s\-]{2,60}:$/.test(safe);
      return isTitle ? `<div><strong>${safe}</strong></div>` : `<div>${safe}</div>`;
    })
    .join('');
};

const FRIENDLY_INTERNAL_API_ERROR = 'Tuvimos un problema temporal con la API interna. Intenta nuevamente en unos minutos.';

const normalizeProviderError = (error: unknown, fallback: string): string => {
  if (error instanceof HttpClientError && error.message?.trim()) {
    return error.message;
  }
  if (error instanceof Error && error.message?.trim()) {
    return error.message;
  }
  return fallback;
};

const CreationPathView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = (t as any).creationPath ?? {};

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [projectTitle, setProjectTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectKind, setProjectKind] = useState<ProjectKind>('landing_page');

  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState('');
  const [researchCopied, setResearchCopied] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [isSavingResearchObject, setIsSavingResearchObject] = useState(false);
  const [researchObjectId, setResearchObjectId] = useState<number | null>(null);

  const [notebookProductId, setNotebookProductId] = useState<number | null>(null);
  const [notebookSynthesis, setNotebookSynthesis] = useState('');
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);

  const [promptInput, setPromptInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [optimizedCopied, setOptimizedCopied] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSavingOptimizedObject, setIsSavingOptimizedObject] = useState(false);
  const [optimizedObjectId, setOptimizedObjectId] = useState<number | null>(null);

  const [aiStudioPrompt, setAiStudioPrompt] = useState('');
  const [aiStudioCopied, setAiStudioCopied] = useState(false);

  const [isSavingStep, setIsSavingStep] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');

  const stateProductId = useMemo(() => {
    const maybeState = (location.state as { creationPathId?: number } | null)?.creationPathId;
    return toNumericId(maybeState);
  }, [location.state]);

  const productUrl = `${window.location.origin}/product/creation-path`;

  const canGoNext = useMemo(() => {
    if (activeStep !== 1) return true;
    return Boolean(projectTitle.trim() && objective.trim() && projectDescription.trim());
  }, [activeStep, projectTitle, objective, projectDescription]);

  const structuredResearchHtml = useMemo(() => toStructuredHtml(researchResult), [researchResult]);
  const structuredOptimizedHtml = useMemo(() => toStructuredHtml(optimizedPrompt), [optimizedPrompt]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setErrorText('');

        const idFromParam = toNumericId(id);
        let resolvedId = idFromParam || stateProductId;

        const existing = await getProducts({ type: 'creation_path' });
        const firstExistingId = Array.isArray(existing) && existing.length > 0
          ? toNumericId(existing[0]?.id)
          : null;
        const hasResolvedInExisting = Array.isArray(existing)
          && existing.some((item) => toNumericId(item.id) === resolvedId);

        if (resolvedId && !hasResolvedInExisting && firstExistingId) {
          resolvedId = firstExistingId;
        }

        if (!resolvedId && firstExistingId) {
          resolvedId = firstExistingId;
        }

        if (!resolvedId) {
          setErrorText(tr.notFound || 'No se pudo cargar el producto Creation-Path.');
          return;
        }

        if (idFromParam) {
          navigate('/product/creation-path', {
            replace: true,
            state: { creationPathId: resolvedId },
          });
        }

        let productData: Product;
        try {
          productData = await getProduct(resolvedId);
        } catch {
          if (firstExistingId && firstExistingId !== resolvedId) {
            productData = await getProduct(firstExistingId);
            resolvedId = firstExistingId;
          } else {
            throw new Error('CREATION_PATH_PRODUCT_NOT_FOUND');
          }
        }

        setIsOwner(true);

        setProduct(productData);
        if (!projectTitle.trim()) setProjectTitle(String(productData.title || ''));
        if (!projectDescription.trim()) setProjectDescription(String(productData.description || ''));

        await loadProgress(productData.id);
      } catch {
        setErrorText(tr.loadError || 'No se pudo abrir Creation-Path.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, stateProductId, navigate]);

  const loadProgress = async (productId: number) => {
    try {
      const progress = await getProductStepProgress(productId);
      const done = progress
        .filter((item) => item.status === 'success')
        .map((item) => Number(item.stepId));

      setCompletedSteps(done);

      const step1 = progress.find((item) => Number(item.stepId) === 1);
      const step2 = progress.find((item) => Number(item.stepId) === 2);
      const step3 = progress.find((item) => Number(item.stepId) === 3);
      const step4 = progress.find((item) => Number(item.stepId) === 4);
      const step5 = progress.find((item) => Number(item.stepId) === 5);

      if (step1?.resultText) {
        setProjectTitle(String(step1.resultText.projectTitle || projectTitle || ''));
        setObjective(String(step1.resultText.objective || ''));
        setProjectDescription(String(step1.resultText.projectDescription || projectDescription || ''));
        const loadedKind = String(step1.resultText.projectKind || 'landing_page') as ProjectKind;
        setProjectKind(loadedKind);
      }

      if (step2?.resultText) {
        setResearchQuery(String(step2.resultText.query || ''));
        setResearchResult(String(step2.resultText.result || ''));
        const objectId = toNumericId(step2.resultText.researchObjectId);
        setResearchObjectId(objectId);
      }

      if (step3?.resultText?.notebookProductId) {
        setNotebookProductId(Number(step3.resultText.notebookProductId));
      }
      if (step3?.resultText?.notebookSynthesis) {
        setNotebookSynthesis(String(step3.resultText.notebookSynthesis || ''));
      }

      if (step4?.resultText) {
        setPromptInput(String(step4.resultText.promptInput || ''));
        setOptimizedPrompt(String(step4.resultText.optimizedPrompt || ''));
        setOptimizedObjectId(toNumericId(step4.resultText.optimizedObjectId));
      }

      if (step5?.resultText?.aiStudioPrompt) {
        setAiStudioPrompt(String(step5.resultText.aiStudioPrompt || ''));
      }

      const firstPending = WIZARD_STEPS.find((step) => !done.includes(step.id));
      setActiveStep(firstPending?.id || 6);
    } catch (error) {
      console.error('[CreationPath] Error loading progress:', error);
    }
  };

  const saveStep = async (stepId: number, resultText: any) => {
    if (!product?.id) return;

    setIsSavingStep(true);
    try {
      await updateProductStepProgress({
        productId: product.id,
        stepId,
        status: 'success',
        resultText,
      });

      setCompletedSteps((prev) => Array.from(new Set([...prev, stepId])));
    } finally {
      setIsSavingStep(false);
    }
  };

  const persistStepOne = async () => {
    if (!product?.id) return;

    const payload = {
      projectTitle: projectTitle.trim(),
      objective: objective.trim(),
      projectDescription: projectDescription.trim(),
      projectKind,
    };

    await saveStep(1, payload);
  };

  const handleResearch = async () => {
    if (!researchQuery.trim()) {
      setErrorText(tr.searchEmpty || 'Escribe una consulta de investigacion.');
      return;
    }
    if (!product?.id) return;

    setErrorText('');
    setStatusText('');
    setIsResearching(true);

    try {
      const response = await perplexityService.search(researchQuery.trim(), {
        makerPathId: product.templateId || undefined,
        systemInstruction: `${objective.trim()}\n\n${projectDescription.trim()}`.trim() || undefined,
      });

      const result = toPlainStructuredText(String(response.content || '').trim());
      setResearchResult(result);
      setResearchCopied(false);

      await saveStep(2, {
        query: researchQuery.trim(),
        result,
        model: response.model,
        provider: response.provider,
        researchObjectId,
      });

      setStatusText(tr.searchDone || 'Investigacion completada.');
    } catch (error) {
      setErrorText('');
      setStatusText(
        normalizeProviderError(
          error,
          tr.searchApiInternalError || FRIENDLY_INTERNAL_API_ERROR
        )
      );
    } finally {
      setIsResearching(false);
    }
  };

  const handleSaveResearchObject = async () => {
    if (!researchResult.trim()) {
      setErrorText(tr.searchEmptyResult || 'No hay investigacion para guardar.');
      return;
    }

    setIsSavingResearchObject(true);
    setErrorText('');

    try {
      const safeTitle = (projectTitle.trim() || 'creation-path').replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'creation-path';
      const file = new File(
        [researchResult.trim()],
        `${safeTitle.replace(/\s+/g, '-')}-investigacion.txt`,
        { type: 'text/plain;charset=utf-8' }
      );

      const created = await createObject({
        title: `${projectTitle.trim() || 'Creation-Path'} - Investigacion`,
        type: 'TEXT',
        file,
      });

      const objectId = toNumericId(created.id);
      setResearchObjectId(objectId);

      await saveStep(2, {
        query: researchQuery.trim(),
        result: researchResult.trim(),
        researchObjectId: objectId,
      });

      setStatusText(tr.saveResearchObjectDone || 'Investigacion guardada en objetos.');
    } catch {
      setErrorText(tr.saveResearchObjectError || 'No se pudo guardar la investigacion en objetos.');
    } finally {
      setIsSavingResearchObject(false);
    }
  };

  const handleCopyResearchResult = async () => {
    if (!researchResult.trim()) return;
    await navigator.clipboard.writeText(researchResult.trim());
    setResearchCopied(true);
    setTimeout(() => setResearchCopied(false), 1800);
  };

  const handleCreateNotebook = async () => {
    if (!product?.id) return;

    setIsCreatingNotebook(true);
    setErrorText('');
    try {
      let nextNotebookId = notebookProductId;

      if (!nextNotebookId) {
        const created = await createProductFromTemplate(
          'rag_chat_maker',
          `${tr.notebookTitlePrefix || 'Notebook'} - ${projectTitle || product.title}`,
          tr.notebookDescription || 'Notebook generado desde Creation-Path.'
        );
        nextNotebookId = created.id;
        setNotebookProductId(nextNotebookId);
      }

      await saveStep(3, {
        notebookProductId: nextNotebookId,
        notebookRoute: `/product/notebook/${nextNotebookId}`,
        notebookSynthesis: notebookSynthesis.trim(),
      });

      setStatusText(tr.notebookLinked || 'Notebook vinculado correctamente.');
    } catch {
      setErrorText(tr.notebookError || 'No se pudo crear o vincular el notebook.');
    } finally {
      setIsCreatingNotebook(false);
    }
  };

  const handleOptimizePrompt = async () => {
    if (!promptInput.trim()) {
      setErrorText(tr.optimizeEmpty || 'Escribe un prompt base para optimizar.');
      return;
    }

    setErrorText('');
    setStatusText('');
    setIsOptimizing(true);

    try {
      const payload = [
        'SYSTEM INSTRUCTIONS:',
        SYSTEM_INSTRUCTIONS,
        '',
        'TITULO DEL PROYECTO:',
        projectTitle || 'Sin titulo definido.',
        '',
        'OBJETIVO:',
        objective || 'Sin objetivo definido.',
        '',
        'DESCRIPCION DEL PROYECTO:',
        projectDescription || 'Sin descripcion definida.',
        '',
        'INVESTIGACION GUIADA:',
        researchResult || 'Sin investigacion disponible.',
        '',
        'PROMPT A OPTIMIZAR:',
        promptInput.trim(),
      ].join('\n');

      const response = await httpClient.post<{ content?: string; text?: string }>('/api/v1/gemini/generate', {
        prompt: payload,
        options: {
          maxTokens: 8000,
          temperature: 0.3,
        },
      });

      const optimized = toPlainStructuredText(String(response.content || response.text || '').trim());
      if (!optimized) {
        throw new Error('EMPTY_RESPONSE');
      }

      setOptimizedPrompt(optimized);
      await saveStep(4, {
        promptInput: promptInput.trim(),
        optimizedPrompt: optimized,
        optimizedObjectId,
      });

      setStatusText(tr.optimizeDone || 'Prompt optimizado correctamente.');
    } catch (error) {
      setErrorText('');
      setStatusText(
        normalizeProviderError(
          error,
          tr.optimizeApiInternalError || FRIENDLY_INTERNAL_API_ERROR
        )
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveOptimizedObject = async () => {
    if (!optimizedPrompt.trim() || !product?.id) {
      setErrorText(tr.optimizeOutputPlaceholder || 'No hay prompt optimizado para guardar.');
      return;
    }

    setIsSavingOptimizedObject(true);
    setErrorText('');

    try {
      const safeTitle = (projectTitle.trim() || 'creation-path').replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'creation-path';
      const content = [
        'PROMPT OPTIMIZADO - CREATION PATH',
        `Proyecto: ${projectTitle.trim() || product.title || 'Creation-Path'}`,
        `Fecha: ${new Date().toLocaleString()}`,
        '',
        'Prompt base:',
        promptInput.trim() || '(sin prompt base)',
        '',
        'Prompt optimizado:',
        optimizedPrompt.trim(),
      ].join('\n');

      const file = new File(
        [content],
        `${safeTitle.replace(/\s+/g, '-')}-prompt-optimizado.txt`,
        { type: 'text/plain;charset=utf-8' }
      );

      const created = await createObject({
        title: `${projectTitle.trim() || 'Creation-Path'} - Prompt optimizado`,
        type: 'TEXT',
        file,
      });

      const objectId = toNumericId(created.id);
      setOptimizedObjectId(objectId);

      await saveStep(4, {
        promptInput: promptInput.trim(),
        optimizedPrompt: optimizedPrompt.trim(),
        optimizedObjectId: objectId,
      });

      setStatusText(tr.saveOptimizedObjectDone || 'Prompt optimizado guardado en objetos.');
    } catch {
      setErrorText(tr.saveOptimizedObjectError || 'No se pudo guardar el prompt optimizado en objetos.');
    } finally {
      setIsSavingOptimizedObject(false);
    }
  };

  const buildAiStudioPrompt = (): string => {
    return [
      `Titulo del proyecto:\n${projectTitle || 'Sin titulo.'}`,
      `Tipo de proyecto:\n${projectKind}`,
      `Objetivo:\n${objective || 'Sin objetivo.'}`,
      `Descripcion:\n${projectDescription || 'Sin descripcion.'}`,
      researchResult ? `Investigacion guiada:\n${researchResult}` : '',
      optimizedPrompt ? `Prompt optimizado:\n${optimizedPrompt}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
  };

  const handlePrepareAiStudio = async () => {
    const prompt = buildAiStudioPrompt();
    if (!prompt) {
      setErrorText(tr.aiStudioEmpty || 'No hay contexto suficiente para AI Studio.');
      return;
    }

    setAiStudioPrompt(prompt);
    await saveStep(5, {
      aiStudioPrompt: prompt,
      aiStudioUrl: 'https://aistudio.google.com',
    });
    setStatusText(tr.aiStudioPrepared || 'Contexto listo para AI Studio.');
  };

  const handleCopyAiStudioPrompt = async () => {
    if (!aiStudioPrompt.trim()) return;
    await navigator.clipboard.writeText(aiStudioPrompt.trim());
    setAiStudioCopied(true);
    setTimeout(() => setAiStudioCopied(false), 1800);
  };

  const handleOpenAiStudio = () => {
    window.open('https://aistudio.google.com', '_blank', 'noopener,noreferrer');
  };

  const handleCopyOptimizedPrompt = async () => {
    if (!optimizedPrompt.trim()) return;
    await navigator.clipboard.writeText(optimizedPrompt.trim());
    setOptimizedCopied(true);
    setTimeout(() => setOptimizedCopied(false), 1800);
  };

  const handleGoDeploy = async () => {
    if (!product?.id) return;

    const titlePrefill = (projectTitle || product.title || 'Nuevo despliegue').trim();
    const descriptionPrefill = [
      projectDescription || product.description || '',
      objective ? `Objetivo: ${objective}` : '',
      projectKind ? `Tipo: ${projectKind}` : '',
    ].filter(Boolean).join(' | ').slice(0, 600);

    const query = new URLSearchParams({
      title: titlePrefill,
      description: descriptionPrefill,
      source: 'creation-path',
      sourceProductId: String(product.id),
    });

    const route = `/dashboard/applications/new?${query.toString()}`;

    await saveStep(6, {
      deployRoute: route,
      linkedProductId: product.id,
      deploymentMode: 'prefill-new-form',
    });

    navigate(route);
  };

  const goPrevious = () => {
    setErrorText('');
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  const goNext = async () => {
    setErrorText('');

    if (activeStep === 1) {
      if (!canGoNext) {
        setErrorText(tr.step1Required || 'Completa titulo, objetivo y descripcion para continuar.');
        return;
      }
      await persistStepOne();
    }

    if (activeStep === 2 && researchResult.trim()) {
      await saveStep(2, {
        query: researchQuery.trim(),
        result: researchResult.trim(),
        researchObjectId,
      });
    }

    if (activeStep === 3 && (notebookProductId || notebookSynthesis.trim())) {
      await saveStep(3, {
        notebookProductId,
        notebookRoute: notebookProductId ? `/product/notebook/${notebookProductId}` : null,
        notebookSynthesis: notebookSynthesis.trim(),
      });
    }

    if (activeStep === 4 && (promptInput.trim() || optimizedPrompt.trim())) {
      await saveStep(4, {
        promptInput: promptInput.trim(),
        optimizedPrompt: optimizedPrompt.trim(),
        optimizedObjectId,
      });
    }

    if (activeStep === 5 && aiStudioPrompt.trim()) {
      await saveStep(5, {
        aiStudioPrompt: aiStudioPrompt.trim(),
        aiStudioUrl: 'https://aistudio.google.com',
      });
    }

    setActiveStep((prev) => Math.min(6, prev + 1));
  };

  const copyProductUrl = async () => {
    await navigator.clipboard.writeText(productUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1800);
  };

  const renderStepBody = () => {
    if (activeStep === 1) {
      return (
        <div className="space-y-3" key="step-one">
          <label htmlFor="creation-path-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {tr.projectTitleLabel || 'Titulo del proyecto'}
          </label>
          <input
            id="creation-path-title"
            value={projectTitle}
            onChange={(event) => setProjectTitle(event.target.value)}
            placeholder={tr.projectTitlePlaceholder || 'Ejemplo: Web de veterinaria'}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <label htmlFor="creation-path-objective" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {tr.objectiveLabel || 'Objetivo del proyecto'}
          </label>
          <textarea
            id="creation-path-objective"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            rows={4}
            placeholder={tr.objectivePlaceholder || 'Define el objetivo principal y lo que esperas lograr.'}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <label htmlFor="creation-path-description" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {tr.projectDescriptionLabel || 'Descripcion del proyecto'}
          </label>
          <textarea
            id="creation-path-description"
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            rows={4}
            placeholder={tr.projectDescriptionPlaceholder || 'Describe el alcance, funcionalidades y contexto del proyecto.'}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <label htmlFor="creation-path-kind" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {tr.projectTypeLabel || 'Tipo de proyecto'}
          </label>
          <select
            id="creation-path-kind"
            value={projectKind}
            onChange={(event) => setProjectKind(event.target.value as ProjectKind)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="landing_page">{tr.projectTypeLandingPage || 'Landing page'}</option>
            <option value="website">{tr.projectTypeWebsite || 'Pagina web'}</option>
            <option value="assistant">{tr.projectTypeAssistant || 'Asistente'}</option>
            <option value="web_app">{tr.projectTypeWebApp || 'Aplicacion web'}</option>
          </select>
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="space-y-3" key="step-two">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-200">
            <p className="font-semibold">{tr.phase1Title || 'Fase 1: Investigacion guiada'}</p>
            <p className="mt-1">{tr.phase1Tool || 'Herramienta: Perplexity.ai'}</p>
            <p className="mt-2">{tr.searchManualFallback || 'Opcionalmente puedes pegar una investigacion manual y continuar.'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">1) Consulta</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">2) Resultado</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">3) Guardar en objetos</span>
            </div>
          </div>

          <label htmlFor="creation-path-research-query" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {tr.searchLabel || 'Consulta de investigacion'}
          </label>
          <div className="flex gap-2">
            <input
              id="creation-path-research-query"
              value={researchQuery}
              onChange={(event) => setResearchQuery(event.target.value)}
              placeholder={tr.searchPlaceholder || 'Ejemplo: mejores practicas para una pagina web de veterinaria'}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => {
                void handleResearch();
              }}
              disabled={isResearching || !researchQuery.trim()}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Search size={13} />
              {tr.searchAction || 'Investigar'}
            </button>
          </div>

          {isResearching && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{tr.searchLoading || 'Investigando...'}</p>
          )}

          {!researchResult.trim() ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              {tr.searchResultPlaceholder || 'El resultado de la investigacion aparecera aqui despues de ejecutar la busqueda.'}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50" id="creation-path-research-result">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{tr.searchPreviewTitle || 'Vista estructurada'}</p>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyResearchResult();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {researchCopied ? <Check size={12} /> : <Copy size={12} />}
                  {researchCopied ? (tr.copied || 'Copiado') : (tr.copyResearchResult || 'Copiar resultado')}
                </button>
              </div>
              <div
                className="space-y-1 text-sm text-slate-700 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: structuredResearchHtml }}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void handleSaveResearchObject();
              }}
              disabled={isSavingResearchObject || !researchResult.trim()}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Save size={13} />
              {isSavingResearchObject ? (tr.savingObject || 'Guardando...') : (tr.saveResearchObject || 'Guardar investigacion en objetos')}
            </button>

            {researchObjectId && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tr.savedObjectId || 'Objeto guardado'}: #{researchObjectId}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (activeStep === 3) {
      return (
        <div className="space-y-3" key="step-three">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tr.notebookOptionalNote || 'Este paso es opcional. Puedes crear notebook ahora o continuar.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handleCreateNotebook();
              }}
              disabled={isCreatingNotebook}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <BookOpen size={13} />
              {notebookProductId ? (tr.notebookRelink || 'Actualizar vinculo') : (tr.notebookCreate || 'Crear notebook vinculado')}
            </button>

            {notebookProductId && (
              <button
                type="button"
                onClick={() => navigate(`/product/notebook/${notebookProductId}`)}
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
              >
                <ExternalLink size={13} />
                {tr.notebookOpen || 'Abrir notebook'}
              </button>
            )}
          </div>

          {isCreatingNotebook && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{tr.notebookCreating || 'Creando notebook...'}</p>
          )}

          <label htmlFor="creation-path-notebook-synthesis" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {tr.phase2Source5Label || 'Fuente 05 - Sintesis (opcional)'}
          </label>
          <textarea
            id="creation-path-notebook-synthesis"
            value={notebookSynthesis}
            onChange={(event) => setNotebookSynthesis(event.target.value)}
            rows={5}
            placeholder={tr.phase2Source5Placeholder || 'Pega aqui la sintesis de NotebookLM (opcional).'}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      );
    }

    if (activeStep === 4) {
      return (
        <div className="space-y-3" key="step-four">
          <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-800 dark:border-violet-900/60 dark:bg-violet-900/20 dark:text-violet-200">
            <p className="font-semibold">{tr.phase4Title || 'Fase 4: Optimizacion de prompt'}</p>
            <p className="mt-1">{tr.phase4Tool || 'Herramienta: Generador inteligente (Gemini/OpenAI fallback)'}</p>
            <p className="mt-2">{tr.optimizeManualFallback || 'Opcionalmente puedes escribir tu prompt optimizado manualmente y continuar.'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">1) Prompt base</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">2) Optimizar</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">3) Guardar en objetos</span>
            </div>
          </div>

          <label htmlFor="creation-path-prompt-input" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {tr.optimizeInputLabel || 'Prompt base'}
          </label>
          <textarea
            id="creation-path-prompt-input"
            value={promptInput}
            onChange={(event) => setPromptInput(event.target.value)}
            rows={5}
            placeholder={tr.optimizeInputPlaceholder || 'Escribe el prompt que quieres mejorar.'}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void handleOptimizePrompt();
              }}
              disabled={isOptimizing || !promptInput.trim()}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Wand2 size={13} />
              {tr.optimizeAction || 'Optimizar prompt'}
            </button>

            <button
              type="button"
              onClick={() => {
                void handleSaveOptimizedObject();
              }}
              disabled={isSavingOptimizedObject || !optimizedPrompt.trim()}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {isSavingOptimizedObject ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {isSavingOptimizedObject ? (tr.savingObject || 'Guardando...') : (tr.saveOptimizedObject || 'Guardar prompt en objetos')}
            </button>

            <button
              type="button"
              onClick={() => {
                void handleCopyOptimizedPrompt();
              }}
              disabled={!optimizedPrompt.trim()}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {optimizedCopied ? <Check size={13} /> : <Copy size={13} />}
              {optimizedCopied ? (tr.copied || 'Copiado') : (tr.phase4CopyOptimized || 'Copiar prompt optimizado')}
            </button>
          </div>

          {isOptimizing && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{tr.optimizeLoading || 'Optimizando prompt...'}</p>
          )}

          {!optimizedPrompt.trim() ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400" id="creation-path-prompt-output">
              {tr.optimizeOutputPlaceholder || 'El prompt optimizado aparecera aqui despues de ejecutar la optimizacion.'}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50" id="creation-path-prompt-output">
              <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{tr.optimizePreviewTitle || 'Vista estructurada del prompt optimizado'}</p>
              <div
                className="space-y-1 text-sm text-slate-700 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: structuredOptimizedHtml }}
              />
            </div>
          )}

          {optimizedObjectId && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tr.savedOptimizedObjectId || 'Prompt guardado en objeto'}: #{optimizedObjectId}
            </p>
          )}
        </div>
      );
    }

    if (activeStep === 5) {
      return (
        <div className="space-y-3" key="step-five">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tr.aiStudioHint || 'Prepara el contexto final y ejecutalo en Google AI Studio.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handlePrepareAiStudio();
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <PlayCircle size={13} />
              {tr.aiStudioPrepare || 'Preparar prompt para AI Studio'}
            </button>

            <button
              type="button"
              onClick={() => {
                void handleCopyAiStudioPrompt();
              }}
              disabled={!aiStudioPrompt.trim()}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {aiStudioCopied ? <Check size={13} /> : <Copy size={13} />}
              {aiStudioCopied ? (tr.copied || 'Copiado') : (tr.copyPrompt || 'Copiar prompt')}
            </button>

            <button
              type="button"
              onClick={handleOpenAiStudio}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
            >
              <ExternalLink size={13} />
              {tr.openAiStudio || 'Abrir AI Studio'}
            </button>
          </div>

          <textarea
            id="creation-path-ai-studio-prompt"
            value={aiStudioPrompt}
            onChange={(event) => setAiStudioPrompt(event.target.value)}
            rows={8}
            placeholder={tr.aiStudioPromptPlaceholder || 'El prompt final para AI Studio aparecera aqui.'}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      );
    }

    return (
      <div className="space-y-3" key="step-six">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {tr.deployHint || 'Cuando estes listo, continua al modulo de deployment.'}
        </p>

        <button
          type="button"
          onClick={() => {
            void handleGoDeploy();
          }}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <Rocket size={13} />
          {tr.deployAction || 'Ir a despliegue'}
        </button>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {tr.deployRouteNote || 'Ruta usada'}: /dashboard/applications/new?title=...&description=...
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <p className="text-sm text-rose-600">{errorText || (tr.notFound || 'No se pudo cargar el producto Creation-Path.')}</p>
      </div>
    );
  }

  const currentStep = WIZARD_STEPS[Math.max(0, activeStep - 1)] || WIZARD_STEPS[0];

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {isOwner && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/project-builder')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft size={18} className="text-slate-500 dark:text-slate-300" />
              </button>
            )}

            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Route size={20} className="text-emerald-600 dark:text-emerald-300" />
            </div>

            <div className="flex-1">
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {tr.title || 'Creation-Path'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {tr.subtitle || 'Ruta de creacion guiada paso a paso con asistencia de IA'}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            {product.isPublic ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                <Globe size={16} />
                <span className="text-xs font-semibold">{tr.publicLabel || 'Publico'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Lock size={16} />
                <span className="text-xs font-semibold">{tr.privateLabel || 'Privado'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 max-w-4xl rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-900/20">
            <span className="flex-1 truncate text-xs font-mono text-emerald-700 dark:text-emerald-300">{productUrl}</span>
            <button
              type="button"
              onClick={() => {
                void copyProductUrl();
              }}
              className="rounded p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              {urlCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-emerald-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-start gap-3">
              {WIZARD_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCurrent = step.id === activeStep;
                const isDone = completedSteps.includes(step.id);

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className="group min-w-[96px] text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                          isCurrent
                            ? 'border-blue-500 text-blue-600 bg-blue-50 dark:border-blue-400 dark:text-blue-300 dark:bg-blue-900/30'
                            : isDone
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-900/30'
                              : 'border-slate-300 text-slate-500 bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:bg-slate-900'
                        }`}
                      >
                        {isDone ? <Check size={13} /> : <StepIcon size={13} />}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{tr.stepLabel || 'Paso'} {step.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {tr[currentStep.titleKey] || currentStep.titleKey}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {tr[currentStep.descriptionKey] || currentStep.descriptionKey}
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700" key={`step-panel-${activeStep}`}>
              {renderStepBody()}
            </div>

            {(errorText || statusText) && (
              <div className="mt-3 space-y-2">
                {errorText && (
                  <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
                    {errorText}
                  </p>
                )}
                {statusText && (
                  <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                    {statusText}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
              <button
                type="button"
                onClick={goPrevious}
                disabled={activeStep === 1}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                {tr.previous || 'Anterior'}
              </button>

              {activeStep < 6 ? (
                <button
                  type="button"
                  onClick={() => {
                    void goNext();
                  }}
                  disabled={(!canGoNext && activeStep === 1) || isSavingStep}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingStep ? (tr.savingStep || 'Guardando...') : (activeStep === 5 ? (tr.finalReview || 'Resena final') : (tr.next || 'Siguiente'))}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void handleGoDeploy();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Rocket size={14} />
                  {tr.finishAndDeploy || 'Finalizar y desplegar'}
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CreationPathView;
