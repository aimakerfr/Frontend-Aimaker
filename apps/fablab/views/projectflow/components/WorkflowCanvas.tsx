import React from 'react';
import ConnectorLine from './ConnectorLine';
import EndNode from './EndNode';
import EmptyState from './EmptyState';
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
            {index < steps.length - 1 && <ConnectorLine />}
          </React.Fragment>
        ))}

        {/* End node */}
        {steps.length > 0 && (
          <>
            <ConnectorLine />
            <EndNode t={t} outputType={outputType} stageName={stageName} />
          </>
        )}

        {/* Empty state */}
        {steps.length === 0 && <EmptyState t={t} />}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
