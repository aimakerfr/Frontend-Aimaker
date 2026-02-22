import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Workflow } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import { getMakerPath } from '@core/maker-path';
import type {WorkflowStep, WorkflowJSON} from './types';
import WorkflowCanvas from './components/WorkflowCanvas';
// import NodeConfigPanel from './components/NodeConfigPanel';
import { INITIAL_MAKERPATHS } from './demoWorkflows';
import Stepper from './components/Stepper';
import RagMultimodalModule from '../rag_multimodal/RagMultimodalModule.tsx';

/** Example workflows for the RAG Library / demo moved to a separate module */

const ProjectFlow: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const params = useParams();
  
  // Extract template and ID from params
  const { template, id: paramId, makerPathId: legacyId } = params;
  
  // Prefer the last route param named "id"; fallback to legacy "makerPathId"
  const makerPathId = paramId
    ? Number(paramId)
    : legacyId
    ? Number(legacyId)
    : undefined;

  // ── State ──────────────────────────────────────────────
  const [makerPath, setMakerPath] = useState<any | null>(null);
  // JSON editor and parse state removed (left panel replaced by RagMultimodalModule)
  const [steps, setSteps] = useState<WorkflowStep[]>(() => {
    // Pre-initialize steps based on template
    if (template && INITIAL_MAKERPATHS[template]) {
      const demo = INITIAL_MAKERPATHS[template];
      const workflowKey = Object.keys(demo.json)[0];
      return demo.json[workflowKey].steps || [];
    }
    return [];
  });
  const [outputType, setOutputType] = useState<string>(() => {
    if (template && INITIAL_MAKERPATHS[template]) {
      const demo = INITIAL_MAKERPATHS[template];
      const workflowKey = Object.keys(demo.json)[0];
      return demo.json[workflowKey].output_type || '';
    }
    return '';
  });
  const [stageName, setStageName] = useState<string>(() => {
    if (template && INITIAL_MAKERPATHS[template]) {
      const demo = INITIAL_MAKERPATHS[template];
      const workflowKey = Object.keys(demo.json)[0];
      return demo.json[workflowKey].stage_name || workflowKey;
    }
    return '';
  });
  // Path selection state removed with JSON editor
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
          setMakerPath(project);
          console.log('ProjectFlow: Fetched project data:', project);
          if (project && project.data) {
            const dataStr = typeof project.data === 'string' ? project.data : JSON.stringify(project.data);
            
            const parsed: WorkflowJSON = JSON.parse(dataStr);
            const workflowKey = Object.keys(parsed)[0];
            if (workflowKey) {
              const workflow = parsed[workflowKey];
              setSteps(workflow.steps || []);
              setOutputType(workflow.output_type || '');
              setStageName(workflow.stage_name || workflowKey);
            }
          }
        } catch (error) {
          console.error('Error fetching project data in ProjectFlow:', error);
        }
      };
      loadProject();
    }
  }, [makerPathId]);

  // Centralized selectability logic (by step_id)
  const selectableStepIds = useMemo(() => {
    if (!steps || steps.length === 0) return new Set<number>();
    const ordered = [...steps].sort((a, b) => a.step_id - b.step_id);
    const set = new Set<number>();
    ordered.forEach((step, idx) => {
      if (idx === 0) {
        set.add(step.step_id);
      } else {
        const prev = ordered[idx - 1];
        if (prev.required && completedSteps.has(prev.step_id)) {
          set.add(step.step_id);
        }
      }
    });
    return set;
  }, [steps, completedSteps]);

  // ── Handlers ───────────────────────────────────────────

  /** Select a step node in the canvas */
  const handleSelectStep = useCallback((stepId: number) => {
    setSelectedStepId(stepId);
  }, []);

  // const selectedStep = steps.find((s) => s.step_id === selectedStepId) ?? null;

  // Persist completed steps (path-scoped persistence removed)

  // Mark a step as completed (from within the card UI)
  const markStepAsCompleteHandler = useCallback((stepId: number) => {
    setCompletedSteps((prev) => {
      if (prev.has(stepId)) return prev;
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  }, []);

  /** NEXT handler: mark current step complete and move focus to the next step */
  const handleNextStep = useCallback(
    (currentStepId: number) => {
      // Mark as complete
      setCompletedSteps((prev) => {
        if (prev.has(currentStepId)) return prev;
        const next = new Set(prev);
        next.add(currentStepId);
        return next;
      });

      // Move to next step in order if it exists
      const ordered = [...steps].sort((a, b) => a.step_id - b.step_id);
      const idx = ordered.findIndex((s) => s.step_id === currentStepId);
      if (idx >= 0 && idx < ordered.length - 1) {
        const nextStep = ordered[idx + 1];
        setSelectedStepId(nextStep.step_id);
      }
    },
    [steps]
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
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Workflow de Proyecto</h1>
        </div>

        {/* Right – actions */}
        <div className="flex items-center gap-2" />
      </header>

      {/* Main body – 3 panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left – RagMultimodal Sources */}
        <aside className="w-96 md:w-[420px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          <RagMultimodalModule id={makerPath?.rag_id} />
        </aside>

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
        />
      </div>
    </div>
  );
};

export default ProjectFlow;
