import React from 'react';
import { Sparkles, Flag } from 'lucide-react';
import type { WorkflowStep } from '../types';
import MakerPathStep from './MakerPathStep';

interface WorkflowCanvasProps {
  steps: WorkflowStep[];
  selectedStepId: number | null;
  onSelectStep: (stepId: number) => void;
  outputType?: string;
  stageName?: string;
  t: any;
}


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
        {steps.map((step, index) => (
          <React.Fragment key={step.step_id}>
            <MakerPathStep
              action={step.action}
              name={step.name}
              stepId={step.step_id}
              selected={selectedStepId === step.step_id}
              inputFileVariable={step.input_file_variable}
              inputPrompt={step.input_prompt}
              required={step.required}
              showTopConnectorDot={index > 0}
              t={t}
              onClick={onSelectStep}
            />

            {/* Connector line between nodes */}
            {index < steps.length - 1 && (
              <div className="w-px h-14 bg-gray-300 dark:bg-gray-600" />
            )}
          </React.Fragment>
        ))}

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
