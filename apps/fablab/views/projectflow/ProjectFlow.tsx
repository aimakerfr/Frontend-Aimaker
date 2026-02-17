import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Workflow } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import type { WorkflowStep, WorkflowJSON, AvailablePath } from './types';
import ConfigurationPanel from './components/ConfigurationPanel';
import WorkflowCanvas from './components/WorkflowCanvas';
import NodeConfigPanel from './components/NodeConfigPanel';

/** Example workflows for the RAG Library / demo */
const DEMO_WORKFLOWS: Record<string, { json: WorkflowJSON; path: AvailablePath }> = {
  landing_page_maker: {
    path: {
      id: 'landing_page_maker',
      name: 'Landing Page Maker',
      description: 'A path for creating a basic landing page',
      outputType: 'HTML',
    },
    json: {
      simple_landing_creator: {
        stage_name: 'simple_landing_creator',
        description: 'A path for creating a basic landing page.',
        output_type: 'HTML',
        steps: [
          {
            step_id: 1,
            name: 'Select Header',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'header.html',
            required: true,
          },
          {
            step_id: 2,
            name: 'Select Footer',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'footer.html',
            required: true,
          },
          {
            step_id: 3,
            name: 'Select Body Template',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'body_template.html',
            required: true,
          },
          {
            step_id: 4,
            name: 'Compile and Export Landing Page',
            action: 'file_generator',
            input_source_type: 'HTML',
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
          <h1 className="text-base font-bold text-gray-900 dark:text-white">MakerPath visualizer</h1>
        </div>

        {/* Right – actions */}
        <div className="flex items-center gap-2" />
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
