import React from 'react';
import {LucideIcon, Wand2} from 'lucide-react';
import {
  Cloud,
  MessageSquare,
  Sparkles,
  FileText,
  Search,
  Upload,
  Key,
  Database,
  Scissors,
  Flag,
  BookOpen,
  Save,
  FileCode,
} from 'lucide-react';
import type { StepAction } from '../types';
import { ACTION_LABELS } from '../types';
import MakerPathStepCard from './MakerPathStepCard';
import MakerPathStepContent from './MakerPathStepContent';

type MakerPathStepProps = {
  action: StepAction;
  name: string;
  stepId: number;
  stepNumber?: number;
  selected: boolean;
  inputFileVariable?: string | null;
  inputSourceType?: string | null;
  inputPrompt?: string | null;
  required?: boolean;
  /** 1-based position of this file variable within the maker path */
  inputFileVariableIndexNumber?: number;
  /** Variable index number for steps that save/use variables */
  variableIndexNumber?: number;
  /** Variable name for steps that save variables */
  variableName?: string;
  showTopConnectorDot?: boolean;
  t: any;
  selectable?: boolean;
  onClick?: (stepId: number) => void;
  onMarkStepComplete?: (stepId: number) => void;
  onNextStep?: (currentStepId: number) => void;
  makerPathId?: number;
};

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
  rag_selector: {
    icon: Database,
    gradient: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    iconBg: 'bg-teal-500',
  },
  rag_chat: {
    icon: MessageSquare,
    gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    border: 'border-green-200 dark:border-green-800',
    iconBg: 'bg-green-500',
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

const MakerPathStep: React.FC<MakerPathStepProps> = ({
  action,
  name,
  stepId,
  stepNumber,
  selected,
  inputFileVariable,
  inputSourceType,
  inputPrompt,
  required,
  inputFileVariableIndexNumber,
  variableIndexNumber,
  variableName,
  showTopConnectorDot,
  t,
  selectable = true,
  onClick,
  onMarkStepComplete,
  onNextStep,
  makerPathId,
}) => {
  const style = getNodeStyle(action);
  const showKey = needsKey(action);
  const showLibrary = usesLibrary(action);

  return (
    <MakerPathStepCard
      selected={selected}
      stepId={stepId}
      stepNumber={stepNumber}
      title={name}
      subtitle={ACTION_LABELS[action] || action}
      icon={style.icon}
      iconBgClass={style.iconBg}
      gradientClass={style.gradient}
      borderClass={style.border}
      showKeyBadge={showKey}
      showLibraryBadge={showLibrary}
      showTopConnectorDot={showTopConnectorDot}
      t={t}
      disabled={!selectable}
      onClick={selectable ? onClick : undefined}
    >
      <MakerPathStepContent
        action={action}
        t={t}
        inputFileVariable={inputFileVariable}
        inputSourceType={inputSourceType || undefined}
        inputPrompt={inputPrompt}
        required={!!required}
        showKey={showKey}
        stepId={stepId}
        onMarkStepComplete={onMarkStepComplete}
        onNextStep={onNextStep}
        makerPathId={makerPathId}
        inputFileVariableIndexNumber={inputFileVariableIndexNumber}
        variableIndexNumber={variableIndexNumber}
        variableName={variableName}
      />
    </MakerPathStepCard>
  );
};

export default MakerPathStep;
