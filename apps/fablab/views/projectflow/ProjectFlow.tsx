import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Workflow } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import { getMakerPath, updateMakerPath } from '@core/maker-path';
import { saveIdentityAssembler } from '@core/notebook-setup';
import { getMakerPathStepProgress, saveMakerPathStepProgress } from '@core/maker-path-step-progress';
import { downloadAssembledProduct } from '@core/assembler/assembler.service';
import type { WorkflowStep, AvailablePath, WorkflowJSON } from './types';
import ConfigurationPanel from './components/ConfigurationPanel';
import WorkflowCanvas from './components/WorkflowCanvas';
// import NodeConfigPanel from './components/NodeConfigPanel';
import { getInitialMakerPaths } from './demoWorkflows';
import WorkflowBuilderModal from './components/WorkflowBuilderModal';
import { useWorkflowLibrary } from './hooks/useWorkflowLibrary';
import Stepper from './components/Stepper';
import ApiConfigView from '../api-config/ApiConfigView';

/** Example workflows for the RAG Library / demo moved to a separate module */

const ProjectFlow: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workflowTitle, setWorkflowTitle] = useState<string>('Proyecto desde Cero');
  const [workflowDescription, setWorkflowDescription] = useState<string>('');

  // Extract template and ID from query parameters
  const template = searchParams.get('maker_path_template') || undefined;
  const makerPathId = searchParams.get('id') ? Number(searchParams.get('id')) : undefined;

  const workflowLibrary = useWorkflowLibrary();

  // Seed demo workflows once per language (to capture translated names/descriptions)
  useEffect(() => {
    const paths = getInitialMakerPaths(t);
    const seed = Object.values(paths).map((d) => {
      const workflowKey = Object.keys(d.json)[0];
      const workflow = d.json[workflowKey];
      return {
        id: d.path.id,
        name: d.path.name,
        description: d.path.description,
        outputType: d.path.outputType,
        stageName: workflow.stage_name || workflowKey,
        steps: (workflow.steps || []) as any,
        source: 'demo' as const,
      };
    });
    workflowLibrary.ensureSeed(seed);
  }, [t, workflowLibrary]);

  // ── State ──────────────────────────────────────────────
  const [jsonInput, setJsonInput] = useState(() => {
    const paths = getInitialMakerPaths(t);
    // If a template is specified in URL, pre-initialize with its JSON
    if (template && paths[template]) {
      return JSON.stringify(paths[template].json);
    }
    return '';
  });
  const [parseError, setParseError] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>(() => {
    const paths = getInitialMakerPaths(t);
    // Pre-initialize steps based on template
    if (template && paths[template]) {
      const demo = paths[template];
      const workflowKey = Object.keys(demo.json)[0];
      return demo.json[workflowKey].steps || [];
    }
    return [];
  });
  const [outputType, setOutputType] = useState<string>(() => {
    const paths = getInitialMakerPaths(t);
    if (template && paths[template]) {
      const demo = paths[template];
      const workflowKey = Object.keys(demo.json)[0];
      return demo.json[workflowKey].output_type || '';
    }
    return '';
  });
  const [stageName, setStageName] = useState<string>(() => {
    const paths = getInitialMakerPaths(t);
    if (template && paths[template]) {
      const demo = paths[template];
      const workflowKey = Object.keys(demo.json)[0];
      return demo.json[workflowKey].stage_name || workflowKey;
    }
    return '';
  });
  const availablePaths: AvailablePath[] = useMemo(() => {
    return workflowLibrary.availablePaths;
  }, [workflowLibrary.availablePaths]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  // const [promptContents, setPromptContents] = useState<Record<number, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [publishedProductId, setPublishedProductId] = useState<number | null>(null);
  const [productLink, setProductLink] = useState<string | null>(null);
  const [productStatus, setProductStatus] = useState<string>('private');
  const [makerPathType, setMakerPathType] = useState<string | null>(null);

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderWorkflowId, setBuilderWorkflowId] = useState<string | null>(null);

  // ── Effects ───────────────────────────────────────────

  /** Load project data from ID */
  useEffect(() => {
    if (makerPathId) {
      const loadProject = async () => {
        try {
          const project = await getMakerPath(makerPathId);
          console.log('ProjectFlow: Fetched project data:', project);
          setProductLink((project as any).productLink || null);
          setProductStatus((project as any).productStatus || 'private');
          setMakerPathType((project as any).type || null);

          if (project && project.title) {
            setWorkflowTitle(project.title);
          }

          if (!project.data) {
            console.warn('Project has no data field');
            return;
          }

          let dataStr =
            typeof project.data === 'string'
              ? project.data
              : JSON.stringify(project.data);

          setJsonInput(dataStr);
          let parsed: WorkflowJSON;

          try {
            parsed = JSON.parse(dataStr);
          } catch (err) {
            console.error('Invalid JSON in project.data');
            return;
          }
          if (!parsed || typeof parsed !== 'object') {
            console.warn('Parsed data is not valid');
            return;
          }
          const workflowKey = Object.keys(parsed)[0];
          if (workflowKey) {
            const workflow = parsed[workflowKey];
            setSteps(workflow.steps || []);
            setOutputType(workflow.output_type || '');
            setStageName(workflow.stage_name || workflowKey);
          }

          // Load completed steps from database
          try {
            const progressData = await getMakerPathStepProgress(makerPathId);
            console.log('[ProjectFlow] Raw progress data from API:', progressData);
            console.log('[ProjectFlow] Filtering for makerPathId:', makerPathId);
            const successfulSteps = progressData
              .filter((p: any) => p.status === 'success')
              .map((p: any) => p.stepId);
            setCompletedSteps(new Set(successfulSteps));
            console.log('[ProjectFlow] Loaded completed steps:', successfulSteps);
          } catch (err) {
            console.error('[ProjectFlow] Error loading step progress:', err);
            setCompletedSteps(new Set());
          }

          // Check if product has already been published
          try {
            const existingProduct = await checkPublishedProduct(makerPathId);
            if (existingProduct) {
              console.log('[ProjectFlow] Found existing published product:', existingProduct);
              setPublishedProductId(existingProduct.id);
              setProductLink(existingProduct.productLink || null);
            } else {
              console.log('[ProjectFlow] No published product found yet');
            }
          } catch (err) {
            console.error('[ProjectFlow] Error checking published product:', err);
          }
        } catch (error) {
          console.error('Error fetching project data in ProjectFlow:', error);
        }
      };
      loadProject();
    }
  }, [makerPathId]);

  const handleDownloadAssembledProduct = useCallback(async () => {
    if (!makerPathId) return;
    try {
      const blob = await downloadAssembledProduct(makerPathId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-${makerPathId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error descargando');
    }
  }, [makerPathId]);

  // All steps are always selectable - no blocking based on completion
  const selectableStepIds = useMemo(() => {
    if (!steps || steps.length === 0) return new Set<number>();
    // Make all steps selectable regardless of completion status
    return new Set(steps.map(step => step.step_id));
  }, [steps]);

  // ── Handlers ───────────────────────────────────────────

  /** Parse the JSON from the textarea */
  const handleParseWorkflow = useCallback(() => {
    if (!jsonInput.trim()) {
      setParseError(t.projectFlow.pasteJsonFirst);
      return;
    }

    try {
      // Sanitize input: remove trailing commas before } or ]
      let sanitized = jsonInput.trim().replace(/,\s*([}\]])/g, '$1');

      // If the user pasted without outer braces (e.g. "key": { ... })
      if (!sanitized.startsWith('{')) {
        sanitized = `{${sanitized}}`;
      }
      // If the user forgot the closing brace
      const openCount = (sanitized.match(/{/g) || []).length;
      const closeCount = (sanitized.match(/}/g) || []).length;
      if (openCount > closeCount) {
        sanitized += '}'.repeat(openCount - closeCount);
      }

      const parsed: WorkflowJSON = JSON.parse(sanitized);
      const workflowKey = Object.keys(parsed)[0];
      if (!workflowKey) {
        setParseError('JSON does not contain a workflow definition.');
        return;
      }

      const workflow = parsed[workflowKey];
      if (!workflow.steps || !Array.isArray(workflow.steps)) {
        setParseError('Workflow must contain a "steps" array.');
        return;
      }

      setSteps(workflow.steps);
      setOutputType(workflow.output_type || '');
      setStageName(workflow.stage_name || workflowKey);
      setParseError(null);
      setSelectedStepId(null);
      setCompletedSteps(new Set());

      const pathId = workflow.stage_name || workflowKey;
      // Persist as a custom workflow in localStorage-backed library
      workflowLibrary.upsertWorkflow({
        id: pathId,
        name: pathId,
        description: workflow.description || pathId,
        outputType: workflow.output_type || 'OUTPUT',
        stageName: workflow.stage_name || workflowKey,
        steps: workflow.steps as any,
        source: 'custom',
      });
      setSelectedPathId(pathId);
    } catch (err: any) {
      setParseError(`Invalid JSON: ${err.message}`);
    }
  }, [jsonInput, t, workflowLibrary]);

  /** Select a pre-defined path from the sidebar */
  const handleSelectPath = useCallback(
    (pathId: string) => {
      setSelectedPathId(pathId);

      const stored = workflowLibrary.getWorkflow(pathId);
      if (stored) {
        setSteps((stored.steps as any) || []);
        setOutputType(stored.outputType || '');
        setStageName(stored.stageName || stored.id);
        setJsonInput('');
        setParseError(null);
        setSelectedStepId(null);
        try {
          const raw = localStorage.getItem(`projectflow.completed.${pathId}`);
          if (raw) {
            const arr = JSON.parse(raw) as number[];
            setCompletedSteps(new Set(arr));
          } else {
            setCompletedSteps(new Set());
          }
        } catch {
          setCompletedSteps(new Set());
        }
        return;
      }

      const paths = getInitialMakerPaths(t);
      const demo = paths[pathId];
      if (demo) {
        const workflowKey = Object.keys(demo.json)[0];
        const workflow = demo.json[workflowKey];
        setSteps(workflow.steps);
        setOutputType(workflow.output_type || '');
        setStageName(workflow.stage_name || workflowKey);
        setJsonInput(JSON.stringify(demo.json, null, 2));
        setParseError(null);
        setSelectedStepId(null);
        // Load completed steps for this path from localStorage if present
        try {
          const raw = localStorage.getItem(`projectflow.completed.${pathId}`);
          if (raw) {
            const arr = JSON.parse(raw) as number[];
            setCompletedSteps(new Set(arr));
          } else {
            setCompletedSteps(new Set());
          }
        } catch {
          setCompletedSteps(new Set());
        }
      }
    },
    [t, workflowLibrary]
  );

  const openCreateWorkflow = useCallback(() => {
    setBuilderWorkflowId(null);
    setIsBuilderOpen(true);
  }, []);

  const openEditWorkflow = useCallback((workflowId: string) => {
    setBuilderWorkflowId(workflowId);
    setIsBuilderOpen(true);
  }, []);

  const deleteSelectedWorkflow = useCallback(() => {
    if (!selectedPathId) return;
    workflowLibrary.deleteWorkflow(selectedPathId);
    setSelectedPathId(null);
    setSelectedStepId(null);
    setSteps([]);
    setOutputType('');
    setStageName('');
    setCompletedSteps(new Set());
  }, [selectedPathId, workflowLibrary]);

  /** Select a step node in the canvas */
  const handleSelectStep = useCallback((stepId: number) => {
    setSelectedStepId(stepId);
  }, []);

  // const selectedStep = steps.find((s) => s.step_id === selectedStepId) ?? null;

  // Persist completed steps per selected path
  useEffect(() => {
    if (!selectedPathId) return;
    try {
      localStorage.setItem(
        `projectflow.completed.${selectedPathId}`,
        JSON.stringify(Array.from(completedSteps))
      );
    } catch {
      // ignore persistence errors
    }
  }, [completedSteps, selectedPathId]);

  // Mark a step as completed (from within the card UI)
  const markStepAsCompleteHandler = useCallback(async (stepId: number) => {
    setCompletedSteps((prev) => {
      if (prev.has(stepId)) return prev;
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });

    // NOTE: Individual step components (RagChatStep, RagSelectorStep, etc.) 
    // already auto-save their own resultText with specific data.
    // We should NOT overwrite their data here.
    // Only update the UI state, not the database.
    console.log('ProjectFlow: Step marked as complete in UI:', stepId);
  }, [makerPathId]);

  /** NEXT handler: mark current step complete and move focus to the next step */
  const handleNextStep = useCallback(
    async (currentStepId: number) => {
      // Mark as complete
      setCompletedSteps((prev) => {
        if (prev.has(currentStepId)) return prev;
        const next = new Set(prev);
        next.add(currentStepId);
        return next;
      });

      // Save progress to database
      if (makerPathId) {
        try {
          await saveMakerPathStepProgress({
            makerPathId,
            stepId: currentStepId,
            status: 'success',
            resultText: { completedAt: new Date().toISOString() }
          });
          console.log('ProjectFlow: Saved step progress to DB (handleNextStep):', currentStepId);
        } catch (err) {
          console.error('Error saving step progress:', err);
        }
      }

      // Move to next step in order if it exists
      const ordered = [...steps].sort((a, b) => a.step_id - b.step_id);
      const idx = ordered.findIndex((s) => s.step_id === currentStepId);
      if (idx >= 0 && idx < ordered.length - 1) {
        const nextStep = ordered[idx + 1];
        setSelectedStepId(nextStep.step_id);
      }
    },
    [steps, makerPathId]
  );

  // ── Product Management Handlers ────────────────────────

  const handleGenerateProductLink = useCallback(async () => {
    if (!makerPathId) return;
    
    try {
      // Fork the maker_path into a new product instance
      const newProduct = await forkProduct(makerPathId);
      
      // Save product ID and construct URL
      setPublishedProductId(newProduct.id);
      const productUrl = `${window.location.origin}/product/notebook/${newProduct.id}`;
      setProductLink(productUrl);
      
      alert(`✅ Producto publicado exitosamente!\n\nURL pública: ${productUrl}`);
    } catch (error) {
      console.error('Error creating product from template:', error);
      alert('❌ Error al crear el producto. Por favor intenta de nuevo.');
    }
  }, [makerPathId]);

  // ── Title and Description Handlers ────────────────────
  
  const handleTitleChange = useCallback((newTitle: string) => {
    setWorkflowTitle(newTitle);
  }, []);

  const handleTitleBlur = useCallback(async () => {
    if (!makerPathId || !workflowTitle) return;
    try {
      await updateMakerPath(makerPathId, { title: workflowTitle });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  }, [makerPathId, workflowTitle]);

  const handleDescriptionChange = useCallback((newDescription: string) => {
    setWorkflowDescription(newDescription);
  }, []);

  const handleDescriptionBlur = useCallback(async () => {
    if (!makerPathId) return;
    try {
      await updateMakerPath(makerPathId, { 
        productLink: newLink,
        productStatus: 'public' // Auto set to public when generating link
      });

      // Persist IdentityAssembler with default values (returns publicToken)
      let externalUrl = '';
      try {
        const identityResult = await saveIdentityAssembler({
          makerPathId,
          systemPrompt: 'Eres un asistente basado en las fuentes RAG proporcionadas.',
          modelName: 'gemini',
          provider: 'google',
          settings: { language: 'es', publishedAt: new Date().toISOString() },
        });
        console.log('ProjectFlow: RagChatIdentity saved for makerPathId:', makerPathId);
        if (identityResult?.publicToken) {
          const externalAppUrl = import.meta.env.VITE_EXTERNAL_NOTEBOOK_URL || 'http://localhost:5173';
          externalUrl = `${externalAppUrl}/${identityResult.publicToken}`;
          console.log('ProjectFlow: External notebook URL:', externalUrl);
        }
      } catch (identityError) {
        console.error('Error saving RagChatIdentity:', identityError);
      }

      setProductLink(newLink);
      setProductStatus('public');
      
      const msg = externalUrl
        ? `Producto publicado exitosamente.\n\nEnlace interno:\n${newLink}\n\nEnlace externo (notebook):\n${externalUrl}`
        : `Producto publicado exitosamente.\n\nEnlace:\n${newLink}`;
      alert(msg);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  }, [makerPathId, workflowDescription]);

  // ── Render ─────────────────────────────────────────────
  // Dev preview: ?view=ApiConfigView renders the module in isolation (hooks-safe)
  if (searchParams.get('view') === 'ApiConfigView') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <ApiConfigView />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Top bar */}
      <header className="h-14 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-5">
        {/* Left – logo + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/maker-path')}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Volver a Proyectos"
          >
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Workflow size={16} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">{workflowTitle}</h1>
        </div>

        {/* Right – actions */}
        <div className="flex items-center gap-2" />
      </header>

      {/* Main body – 3 panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left – Configuration (Only shown for blank projects - no template) */}
        {!template && (
          <ConfigurationPanel
            jsonInput={jsonInput}
            onJsonChange={setJsonInput}
            onParseWorkflow={handleParseWorkflow}
            parseError={parseError}
            availablePaths={availablePaths}
            selectedPathId={selectedPathId}
            onSelectPath={handleSelectPath}
            onCreateWorkflow={openCreateWorkflow}
            onEditWorkflow={(id: string) => openEditWorkflow(id)}
            onDeleteWorkflow={deleteSelectedWorkflow}
            canEditSelectedWorkflow={
              !!selectedPathId && (workflowLibrary.getWorkflow(selectedPathId)?.source !== 'demo')
            }
            t={t}
            makerPathId={makerPathId}
          />
        )}

        {/* Middle – Stepper (after Configuration) */}
        <Stepper
          steps={steps}
          selectedStepId={selectedStepId}
          completedStepIds={completedSteps}
          selectableStepIds={selectableStepIds}
          onSelectStep={handleSelectStep}
          makerPathId={makerPathId}
          publishedProductId={publishedProductId}
          productLink={productLink}
          projectTitle={workflowTitle}
          projectDescription={workflowDescription}
          onTitleChange={handleTitleChange}
          onTitleBlur={handleTitleBlur}
          onDescriptionChange={handleDescriptionChange}
          onDescriptionBlur={handleDescriptionBlur}
          onGenerateProductLink={handleGenerateProductLink}
          onDownloadAssembledProduct={makerPathType === 'assembled' ? handleDownloadAssembledProduct : undefined}
          workflowType={makerPathType || template}
        />

        {/* Right – Workflow Canvas */}
        <WorkflowCanvas
          steps={steps}
          selectedStepId={selectedStepId}
          onSelectStep={handleSelectStep}
          outputType={outputType}
          stageName={stageName}
          t={t}
          selectableStepIds={selectableStepIds}
          onMarkStepAsComplete={markStepAsCompleteHandler}
          onNextStep={handleNextStep}
          makerPathId={makerPathId}
          workflowType={template}
        />
      </div>

      <WorkflowBuilderModal
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        t={t}
        initial={(() => {
          if (!builderWorkflowId) return undefined;
          const wf = workflowLibrary.getWorkflow(builderWorkflowId);
          if (!wf) return undefined;
          return {
            id: wf.id,
            name: wf.name,
            description: wf.description,
            outputType: wf.outputType,
            stageName: wf.stageName,
            steps: (wf.steps as any) || [],
            source: wf.source,
          };
        })()}
        onSave={(draft) => {
          workflowLibrary.upsertWorkflow({
            id: draft.id,
            name: draft.name,
            description: draft.description,
            outputType: draft.outputType,
            stageName: draft.stageName,
            steps: draft.steps as any,
            source: draft.source || 'custom',
          });
          setIsBuilderOpen(false);
          setSelectedPathId(draft.id);
          setSteps(draft.steps);
          setOutputType(draft.outputType);
          setStageName(draft.stageName);
        }}
        onDelete={builderWorkflowId ? (id) => {
          workflowLibrary.deleteWorkflow(id);
          setIsBuilderOpen(false);
          if (selectedPathId === id) {
            setSelectedPathId(null);
            setSelectedStepId(null);
            setSteps([]);
            setOutputType('');
            setStageName('');
            setCompletedSteps(new Set());
          }
        } : undefined}
      />
    </div>
  );
};

export default ProjectFlow;
