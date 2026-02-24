import React from 'react';
import type { StepAction } from '../types';
import { Key, Check } from 'lucide-react';
import RagLibrarySelector from './RagLibrarySelector';
import FileGenerator from './FileGenerator';
import RagSelectorStep from './RagSelectorStep';
import RagChatStep from './RagChatStep';
import IaGeneratorStep from './IaGeneratorStep';
import OutputResultSaver from './OutputResultSaver';
import FileUploadAnalyzer from './FileUploadAnalyzer';
import TranslationProcessor from './TranslationProcessor';
import TranslationSaver from './TranslationSaver';

type MakerPathStepContentProps = {
  action: StepAction;
  t: any;
  inputFileVariable?: string | null;
  inputSourceType?: string | null;
  inputPrompt?: string | null;
  required?: boolean;
  showKey?: boolean;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
  onNextStep?: (currentStepId: number) => void;
  makerPathId?: number;
  /** 1-based index used to persist variable order */
  inputFileVariableIndexNumber?: number;
  /** Variable index number for steps that save/use variables */
  variableIndexNumber?: number;
  /** Variable name for steps that save variables */
  variableName?: string;
};

const GenericContent: React.FC<MakerPathStepContentProps> = ({
  t,
  inputFileVariable,
  inputPrompt,
  required,
  showKey,
  stepId,
  onMarkStepComplete,
}) => {
  return (
    <>
      {/* Bottom info */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {inputFileVariable ? (
          <span className="text-xs font-mono bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded truncate max-w-[60%]">
            {`{{${inputFileVariable.replace('.html', '').replace('.css', '')}}}`}
          </span>
        ) : inputPrompt ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60%]">S</span>
        ) : (
          <span />
        )}

        {required && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 whitespace-nowrap flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {t.projectFlow.required}
          </span>
        )}
      </div>

      {/* Mark as complete button (icon-only, no i18n literals) */}
      <div className="mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (stepId && onMarkStepComplete) onMarkStepComplete(stepId);
          }}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <Check size={16} />
        </button>
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
    </>
  );
};

const MakerPathStepContent: React.FC<MakerPathStepContentProps> = (props) => {
  const { action } = props;

  switch (action) {
    case 'rag_library_selector':
      return (
        <RagLibrarySelector
          input_file_variable={props.inputFileVariable || undefined}
          input_source_type={(props.inputSourceType as any) || 'HTML'}
          required={!!props.required}
          step_id={props.stepId}
          makerPathId={props.makerPathId}
          inputFileVariableIndexNumber={props.inputFileVariableIndexNumber}
          onMarkStepComplete={props.onMarkStepComplete}
          onNext={() => {
            if (props.stepId && props.onNextStep) props.onNextStep(props.stepId);
          }}
        />
      );
    case 'rag_selector':
      return (
        <RagSelectorStep
          makerPathId={props.makerPathId}
          variableIndexNumber={props.variableIndexNumber}
          variableName={props.variableName}
          stepId={props.stepId}
          required={!!props.required}
          onMarkStepComplete={props.onMarkStepComplete}
        />
      );
    case 'rag_chat':
      return (
        <RagChatStep
          makerPathId={props.makerPathId}
          variableIndexNumber={props.variableIndexNumber}
          stepId={props.stepId}
          onMarkStepComplete={props.onMarkStepComplete}
        />
      );
    case 'ia_generator':
      return (
        <IaGeneratorStep
          makerPathId={props.makerPathId}
          variableIndexNumber={props.variableIndexNumber}
          stepId={props.stepId}
          onMarkStepComplete={props.onMarkStepComplete}
        />
      );
    case 'output_result_saver':
      return (
        <OutputResultSaver
          makerPathId={props.makerPathId}
          stepId={props.stepId}
          onMarkStepComplete={props.onMarkStepComplete}
        />
      );
    case 'file_generator':
      return (
        <FileGenerator
          makerPathId={props.makerPathId}
          onMarkComplete={() => {
            if (props.stepId && props.onMarkStepComplete) {
              props.onMarkStepComplete(props.stepId);
            }
          }}
        />
      );
    case 'file_upload_analyzer':
      return (
        <FileUploadAnalyzer
          makerPathId={props.makerPathId}
          variableIndexNumber={props.variableIndexNumber}
          variableName={props.variableName}
          stepId={props.stepId}
          onMarkStepComplete={props.onMarkStepComplete}
          onNextStep={props.onNextStep}
          t={props.t}
          required={props.required}
        />
      );
    case 'translation_extractor':
    case 'translation_generator':
      return (
        <TranslationProcessor
          makerPathId={props.makerPathId}
          variableIndexNumber={props.variableIndexNumber}
          stepId={props.stepId}
          onMarkStepComplete={props.onMarkStepComplete}
          onNextStep={props.onNextStep}
          required={props.required}
        />
      );
    case 'translation_saver':
      return (
        <TranslationSaver
          makerPathId={props.makerPathId}
          variableIndexNumber={props.variableIndexNumber}
          stepId={props.stepId}
          onMarkStepComplete={props.onMarkStepComplete}
          required={props.required}
        />
      );
    default:
      return <GenericContent {...props} />;
  }
};

export default MakerPathStepContent;
