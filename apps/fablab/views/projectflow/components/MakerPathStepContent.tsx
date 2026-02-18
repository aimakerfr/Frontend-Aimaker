import React from 'react';
import type { StepAction } from '../types';
import { Key } from 'lucide-react';
import RagLibrarySelector from './RagLibrarySelector';
import FileGenerator from './FileGenerator';

type MakerPathStepContentProps = {
  action: StepAction;
  t: any;
  inputFileVariable?: string | null;
  inputPrompt?: string | null;
  required?: boolean;
  showKey?: boolean;
};

const GenericContent: React.FC<MakerPathStepContentProps> = ({
  t,
  inputFileVariable,
  inputPrompt,
  required,
  showKey,
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
      return <RagLibrarySelector />;
    case 'file_generator':
      return <FileGenerator />;
    default:
      return <GenericContent {...props} />;
  }
};

export default MakerPathStepContent;
