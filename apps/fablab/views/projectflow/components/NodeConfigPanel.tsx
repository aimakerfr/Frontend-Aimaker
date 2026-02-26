import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  X,
  Cloud,
  MessageSquare,
  Sparkles,
  FileText,
  Search,
  Upload,
  Wand2,
  Key,
  Database,
  Scissors,
  Flag,
  Zap,
} from 'lucide-react';
import type { WorkflowStep, StepAction } from '../types';

interface NodeConfigPanelProps {
  step: WorkflowStep | null;
  onClose: () => void;
  promptContent: string;
  onPromptChange: (value: string) => void;
  t: any;
}

/** Icon per action type */
const getIcon = (action: StepAction): LucideIcon => {
  const map: Record<string, LucideIcon> = {
    fetch_data: Cloud,
    select_file: FileText,
    select_rag_source: Database,
    text_input: MessageSquare,
    user_input_and_ai_refinement: MessageSquare,
    ai_analysis_generation: Sparkles,
    information_search: Search,
    rag_upload: Upload,
    prompt_optimizer: Wand2,
    api_configuration: Key,
    store_data: Database,
    compile_and_export: Flag,
    text_processing: Scissors,
  };
  return map[action] ?? FileText;
};

/** Color for the header icon */
const getIconColor = (action: StepAction): string => {
  const map: Record<string, string> = {
    fetch_data: 'bg-blue-500',
    select_file: 'bg-blue-500',
    select_rag_source: 'bg-blue-500',
    text_input: 'bg-purple-500',
    user_input_and_ai_refinement: 'bg-purple-500',
    ai_analysis_generation: 'bg-emerald-500',
    information_search: 'bg-amber-500',
    rag_upload: 'bg-sky-500',
    prompt_optimizer: 'bg-fuchsia-500',
    api_configuration: 'bg-rose-500',
    store_data: 'bg-cyan-500',
    compile_and_export: 'bg-violet-500',
    text_processing: 'bg-gray-500',
  };
  return map[action] ?? 'bg-gray-500';
};

/** Whether this action needs a prompt editor */
const hasPromptEditor = (action: StepAction): boolean => {
  return [
    'text_input',
    'user_input_and_ai_refinement',
    'ai_analysis_generation',
    'prompt_optimizer',
  ].includes(action);
};

/** Whether this action needs a gemini engine section */
const needsGemini = (action: StepAction): boolean => {
  return ['ai_analysis_generation', 'prompt_optimizer', 'information_search'].includes(action);
};

/** Determine prompt label based on action */
const getPromptLabel = (action: StepAction, t: any): string => {
  if (action === 'ai_analysis_generation') return t.projectFlow.systemPromptForGeneration;
  return t.projectFlow.aiPromptTemplateEditor;
};

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  step,
  onClose,
  promptContent,
  onPromptChange,
  t,
}) => {
  if (!step) return null;

  const Icon = getIcon(step.action);
  const iconColor = getIconColor(step.action);

  return (
    <div className="w-96 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {t.projectFlow.nodeConfiguration}
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              STEP ID: {step.step_id}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* GENERAL section */}
        <div className="px-5 py-4 space-y-4">
          <h3 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            {t.projectFlow.general}
          </h3>

          {/* Node Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              {t.projectFlow.nodeName}
            </label>
            <input
              type="text"
              value={step.displayName || step.name}
              readOnly
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 outline-none"
            />
          </div>

          {/* Required Step toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              {t.projectFlow.requiredStep}
            </label>
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  step.required ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 ${
                    step.required ? 'left-5' : 'left-0.5'
                  } w-4 h-4 bg-white rounded-full shadow transition-all`}
                />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t.projectFlow.requiredNode}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-5" />

        {/* INPUTS & CONFIGURATION section */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {t.projectFlow.inputsAndConfiguration}
            </h3>
            {hasPromptEditor(step.action) && (
              <button className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                <Wand2 size={10} />
                {t.projectFlow.promptLibrary}
              </button>
            )}
          </div>

          {/* Prompt editor */}
          {hasPromptEditor(step.action) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {getPromptLabel(step.action, t)}
              </label>
              <textarea
                value={promptContent || step.input_prompt || ''}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Enter prompt content..."
                className="w-full h-32 px-3 py-2.5 text-sm font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* RAG source selector */}
          {['fetch_data', 'select_file', 'select_rag_source', 'rag_upload'].includes(step.action) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t.projectFlow.selectRagSource}
              </label>
              <button className="w-full px-3 py-2.5 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2">
                <Database size={14} />
                {t.projectFlow.selectRagSource}
              </button>
              {step.input_file_variable && (
                <p className="mt-1.5 text-xs text-gray-400 font-mono">
                  Variable: {`{{${step.input_file_variable}}}`}
                </p>
              )}
            </div>
          )}

          {/* API Key configuration */}
          {step.action === 'api_configuration' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                API Key Configuration
              </label>
              <button className="w-full px-3 py-2.5 text-sm bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors flex items-center justify-center gap-2">
                <Key size={14} />
                Configure API Key
              </button>
            </div>
          )}
        </div>

        {/* GEMINI ENGINE section */}
        {needsGemini(step.action) && (
          <>
            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-5" />
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  {t.projectFlow.geminiEngine}
                </h3>
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {t.projectFlow.noKey}
                </span>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">
                <Key size={12} />
                {t.projectFlow.selectGeminiKey}
              </button>

              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-emerald-700 transition-colors">
                <Zap size={12} />
                {t.projectFlow.runGeneration}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
          {t.projectFlow.changesAreSavedLocally}
        </p>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
