import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Save, Rocket, Workflow } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import type { WorkflowStep, WorkflowJSON, AvailablePath } from './types';
import ConfigurationPanel from './components/ConfigurationPanel';
import WorkflowCanvas from './components/WorkflowCanvas';
import NodeConfigPanel from './components/NodeConfigPanel';

/** Example workflows for the RAG Library / demo */
const DEMO_WORKFLOWS: Record<string, { json: WorkflowJSON; path: AvailablePath }> = {
  onboarding_v1: {
    path: {
      id: 'onboarding_v1',
      name: 'onboarding_v1',
      description: 'Onboarding Avanzado',
      outputType: 'DASHBOARD_JSON',
    },
    json: {
      onboarding_flow: {
        stage_name: 'onboarding_avanzado',
        description: 'Procesamiento de datos de clientes con IA.',
        output_type: 'DASHBOARD_JSON',
        steps: [
          {
            step_id: 1,
            name: 'Captura de Webhook',
            action: 'fetch_data',
            input_source_type: 'json',
            input_file_variable: 'raw_data',
            required: true,
          },
          {
            step_id: 2,
            name: 'Definir Instrucción de Diseño',
            action: 'text_input',
            input_source_type: 'text_input',
            input_prompt: 'Crea una guía de estilo para el cliente basada en: {{raw_data}}',
            required: true,
          },
          {
            step_id: 3,
            name: 'Procesamiento y Generación',
            action: 'ai_analysis_generation',
            input_source_type: 'text_input',
            required: true,
          },
        ],
      },
    },
  },
  support_rag: {
    path: {
      id: 'support_rag',
      name: 'support_rag',
      description: 'Resolución Técnica',
      outputType: 'TICKET_REPLY',
    },
    json: {
      support_flow: {
        stage_name: 'support_rag',
        description: 'Busca en la KB y genera respuesta.',
        output_type: 'TICKET_REPLY',
        steps: [
          {
            step_id: 1,
            name: 'Consultar Base de Conocimiento',
            action: 'select_rag_source',
            input_source_type: 'RAG',
            input_file_variable: 'kb_context',
            required: true,
          },
          {
            step_id: 2,
            name: 'Generar Respuesta Técnica',
            action: 'ai_analysis_generation',
            input_source_type: 'text_input',
            input_prompt: 'Responde al usuario usando el contexto: {{kb_context}}',
            required: true,
          },
        ],
      },
    },
  },
};

const ProjectFlow: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id: _pathId } = useParams<{ id: string }>();

  // ── State ──────────────────────────────────────────────
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [outputType, setOutputType] = useState<string>('');
  const [stageName, setStageName] = useState<string>('');
  const [availablePaths, setAvailablePaths] = useState<AvailablePath[]>(
    Object.values(DEMO_WORKFLOWS).map((d) => d.path)
  );
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [promptContents, setPromptContents] = useState<Record<number, string>>({});

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

      // Add to available paths if not already there
      const pathId = workflow.stage_name || workflowKey;
      if (!availablePaths.find((p) => p.id === pathId)) {
        setAvailablePaths((prev) => [
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

      const demo = DEMO_WORKFLOWS[pathId];
      if (demo) {
        const workflowKey = Object.keys(demo.json)[0];
        const workflow = demo.json[workflowKey];
        setSteps(workflow.steps);
        setOutputType(workflow.output_type || '');
        setStageName(workflow.stage_name || workflowKey);
        setJsonInput(JSON.stringify(demo.json, null, 2));
        setParseError(null);
        setSelectedStepId(null);
      }
    },
    []
  );

  /** Select a step node in the canvas */
  const handleSelectStep = useCallback((stepId: number) => {
    setSelectedStepId(stepId);
  }, []);

  /** Update prompt content for a specific step */
  const handlePromptChange = useCallback(
    (value: string) => {
      if (selectedStepId !== null) {
        setPromptContents((prev) => ({ ...prev, [selectedStepId]: value }));
      }
    },
    [selectedStepId]
  );

  const selectedStep = steps.find((s) => s.step_id === selectedStepId) ?? null;

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
            title={t.projectFlow.backToMakerPath}
          >
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Workflow size={16} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            <span className="text-orange-500">Maker</span>Flow{' '}
            <span className="text-gray-400 dark:text-gray-500 font-normal">Interpreter</span>
          </h1>
        </div>

        {/* Right – actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
            <Play size={14} />
            {t.projectFlow.testWorkflow}
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Save size={14} />
            {t.projectFlow.save}
          </button>
          <button className="flex items-center gap-1.5 px-5 py-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-500/30">
            <Rocket size={14} />
            {t.projectFlow.deploy}
          </button>
        </div>
      </header>

      {/* Main body – 3 panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left – Configuration */}
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

        {/* Center – Workflow Canvas */}
        <WorkflowCanvas
          steps={steps}
          selectedStepId={selectedStepId}
          onSelectStep={handleSelectStep}
          outputType={outputType}
          stageName={stageName}
          t={t}
        />

        {/* Right – Node Config (shown only when a node is selected) */}
        {selectedStep && (
          <NodeConfigPanel
            step={selectedStep}
            onClose={() => setSelectedStepId(null)}
            promptContent={promptContents[selectedStepId!] || ''}
            onPromptChange={handlePromptChange}
            t={t}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectFlow;
