import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
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
  BookOpen,
  Save,
  FileCode,
} from 'lucide-react';
import type { WorkflowStep, StepAction } from '../types';
import { ACTION_LABELS } from '../types';

interface WorkflowCanvasProps {
  steps: WorkflowStep[];
  selectedStepId: number | null;
  onSelectStep: (stepId: number) => void;
  outputType?: string;
  stageName?: string;
  t: any;
}

/** Icon + gradient colour per action type */
const NODE_STYLES: Record<
  string,
  {
    icon: LucideIcon;
    gradient: string;
    border: string;
    iconBg: string;
  }
> = {
  // New action types with distinct styles
  rag_library_selector: {
    icon: Database,
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
  },
  prompt_library_selector: {
    icon: BookOpen,
    gradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-500',
  },
  ia_generator: {
    icon: Sparkles,
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-500',
  },
  text_input: {
    icon: MessageSquare,
    gradient: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    iconBg: 'bg-purple-500',
  },
  information_searcher: {
    icon: Search,
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-500',
  },
  rag_library_uploader: {
    icon: Upload,
    gradient: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-500',
  },
  prompt_optimizer: {
    icon: Wand2,
    gradient: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
    iconBg: 'bg-fuchsia-500',
  },
  api_configurator: {
    icon: Key,
    gradient: 'from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-500',
  },
  output_result_saver: {
    icon: Save,
    gradient: 'from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    iconBg: 'bg-cyan-500',
  },
  text_processor: {
    icon: Scissors,
    gradient: 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
    border: 'border-gray-300 dark:border-gray-600',
    iconBg: 'bg-gray-500',
  },
  file_generator: {
    icon: FileCode,
    gradient: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-500',
  },
  // Legacy actions (backward compatibility)
  fetch_data: {
    icon: Cloud,
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
  },
  select_file: {
    icon: FileText,
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
  },
  select_rag_source: {
    icon: Database,
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
  },
  user_input_and_ai_refinement: {
    icon: MessageSquare,
    gradient: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    iconBg: 'bg-purple-500',
  },
  ai_analysis_generation: {
    icon: Sparkles,
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-500',
  },
  information_search: {
    icon: Search,
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-500',
  },
  rag_upload: {
    icon: Upload,
    gradient: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-500',
  },
  api_configuration: {
    icon: Key,
    gradient: 'from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-500',
  },
  store_data: {
    icon: Database,
    gradient: 'from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    iconBg: 'bg-cyan-500',
  },
  compile_and_export: {
    icon: Flag,
    gradient: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-500',
  },
  text_processing: {
    icon: Scissors,
    gradient: 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
    border: 'border-gray-300 dark:border-gray-600',
    iconBg: 'bg-gray-500',
  },
};

const getNodeStyle = (action: StepAction) => {
  return (
    NODE_STYLES[action] ?? {
      icon: FileText,
      gradient: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700',
      border: 'border-gray-300 dark:border-gray-600',
      iconBg: 'bg-gray-500',
    }
  );
};

/** Determine whether a node needs a Gemini key */
const needsKey = (action: StepAction): boolean => {
  return [
    'ia_generator',
    'prompt_optimizer',
    'information_searcher',
    // Legacy actions
    'ai_analysis_generation',
    'information_search',
  ].includes(action);
};

/** Determine whether a step uses the LIBRARY badge */
const usesLibrary = (action: StepAction): boolean => {
  return [
    'rag_library_selector',
    'prompt_library_selector',
    'ia_generator',
    'text_input',
    'prompt_optimizer',
    'rag_library_uploader',
    // Legacy actions
    'fetch_data',
    'select_file',
    'select_rag_source',
    'user_input_and_ai_refinement',
    'ai_analysis_generation',
  ].includes(action);
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
  outputType,
  stageName,
  t,
}) => {
  return (
    <div className="flex-1 overflow-auto bg-[radial-gradient(circle,_rgba(0,0,0,0.04)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:20px_20px]">
      <div className="flex flex-col items-center py-10 px-6 min-h-full">
        {steps.map((step, index) => {
          const style = getNodeStyle(step.action);
          const Icon = style.icon;
          const isSelected = selectedStepId === step.step_id;
          const showKey = needsKey(step.action);
          const showLibrary = usesLibrary(step.action);

          return (
            <React.Fragment key={step.step_id}>
              {/* Node card */}
              <button
                onClick={() => onSelectStep(step.step_id)}
                className={`relative w-80 bg-gradient-to-br ${style.gradient} border-2 ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30'
                    : style.border + ' shadow-md hover:shadow-lg'
                } rounded-xl p-6 pt-12 pb-6 transition-all duration-200 text-left group overflow-hidden`}
              >
                {/* Badges (top-right) */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2 max-w-[40%]">
                  {showKey && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                      <span className="truncate">{t.projectFlow.keyNeeded}</span>
                    </span>
                  )}
                  {showLibrary && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
                      <Wand2 size={10} className="flex-shrink-0" />
                      <span className="truncate">{t.projectFlow.library}</span>
                    </span>
                  )}
                </div>

                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-6 pr-2">
                  <div
                    className={`w-10 h-10 ${style.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">
                      {step.name}
                    </h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2 truncate">
                      {ACTION_LABELS[step.action] || step.action}
                    </p>
                  </div>
                </div>

                {/* Bottom info */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  {step.input_file_variable ? (
                    <span className="text-xs font-mono bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded truncate max-w-[60%]">
                      {`{{${step.input_file_variable.replace('.html', '').replace('.css', '')}}}`}
                    </span>
                  ) : step.input_prompt ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60%]">
                      System
                    </span>
                  ) : (
                    <span />
                  )}

                  {step.required && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 whitespace-nowrap flex-shrink-0">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {t.projectFlow.required}
                    </span>
                  )}
                </div>

                {/* Gemini Key button */}
                {showKey && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors overflow-hidden"
                  >
                    <Key size={12} className="flex-shrink-0" />
                    <span className="truncate">{t.projectFlow.selectGeminiKey}</span>
                  </button>
                )}

                {/* Connection point (bottom) */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                {/* Connection point (top) */}
                {index > 0 && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                )}
              </button>

              {/* Connector line between nodes */}
              {index < steps.length - 1 && (
                <div className="w-px h-14 bg-gray-300 dark:bg-gray-600" />
              )}
            </React.Fragment>
          );
        })}

        {/* End node */}
        {steps.length > 0 && (
          <>
            <div className="w-px h-14 bg-gray-300 dark:bg-gray-600" />
            <div className="w-48 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-xl py-4 px-5 flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 bg-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Flag size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t.projectFlow.end}
                </p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase truncate">
                  {outputType || stageName || 'OUTPUT'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {steps.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-20">
            <Sparkles size={48} className="mb-4 opacity-30" />
            <p className="text-sm mt-1">{t.projectFlow.pasteJsonFirst}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
