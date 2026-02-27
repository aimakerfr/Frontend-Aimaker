import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Workflow } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import { getMakerPath } from '@core/maker-path';
import { getMakerPathStepProgress, saveMakerPathStepProgress } from '@core/maker-path-step-progress';
import type { WorkflowStep, AvailablePath, WorkflowJSON } from './types';
import ConfigurationPanel from './components/ConfigurationPanel';
import WorkflowCanvas from './components/WorkflowCanvas';
// import NodeConfigPanel from './components/NodeConfigPanel';
import { getInitialMakerPaths } from './demoWorkflows';
import Stepper from './components/Stepper';

/** Example workflows for the RAG Library / demo moved to a separate module */

const ProjectFlow: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workflowTitle, setWorkflowTitle] = useState<string>('Proyecto desde Cero');
  

  // Extract template and ID from query parameters
  const template = searchParams.get('maker_path_template') || undefined;
  const makerPathId = searchParams.get('id') ? Number(searchParams.get('id')) : undefined;

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
  const [customPaths, setCustomPaths] = useState<AvailablePath[]>([]);
  const availablePaths: AvailablePath[] = useMemo(() => {
    const paths = getInitialMakerPaths(t);
    return [...Object.values(paths).map((d) => d.path), ...customPaths];
  }, [t, customPaths]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  // const [promptContents, setPromptContents] = useState<Record<number, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // ── Effects ───────────────────────────────────────────

  /** Load project data from ID */
  useEffect(() => {
    if (makerPathId) {
      const loadProject = async () => {
        try {
          const project = await getMakerPath(makerPathId);
          console.log('ProjectFlow: Fetched project data:', project);
          if (project && project.title) {
            setWorkflowTitle(project.title);
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
        } catch (error) {
          console.error('Error fetching project data in ProjectFlow:', error);
        }
      };
      loadProject();
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

      // Add to available paths if not already there
      const pathId = workflow.stage_name || workflowKey;
      if (!availablePaths.find((p) => p.id === pathId)) {
        setCustomPaths((prev) => [
          ...prev,
          {
            id: pathId,
            name: pathId,
            description: workflow.description || pathId,
            outputType: workflow.output_type || 'OUTPUT',
          },
        ]);
      }
      setSelectedPathId(pathId);
    } catch (err: any) {
      setParseError(`Invalid JSON: ${err.message}`);
    }
  }, [jsonInput, availablePaths, t]);

  /** Select a pre-defined path from the sidebar */
  const handleSelectPath = useCallback(
    (pathId: string) => {
      setSelectedPathId(pathId);

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
    []
  );

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

  // ── Render ─────────────────────────────────────────────
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
            t={t}
          />
        )}

        {/* Middle – Stepper (after Configuration) */}
        <Stepper
          steps={steps}
          selectedStepId={selectedStepId}
          completedStepIds={completedSteps}
          selectableStepIds={selectableStepIds}
          onSelectStep={handleSelectStep}
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
    </div>
  );
};

export default ProjectFlow;
