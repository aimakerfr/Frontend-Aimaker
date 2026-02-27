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
  selectableStepIds: Set<number>;
  onMarkStepAsComplete: (stepId: number) => void;
  onNextStep?: (currentStepId: number) => void;
  makerPathId?: number;
  workflowType?: string;
}


const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
  outputType,
  stageName,
  t,
  selectableStepIds,
  onMarkStepAsComplete,
  onNextStep,
  makerPathId,
  workflowType,
}) => {
  // Selectability is centralized in ProjectFlow and passed via selectableStepIds
  // Ensure visual order matches logical order by sorting by step_id
  const orderedSteps = React.useMemo(() => {
    return [...steps].sort((a, b) => a.step_id - b.step_id);
  }, [steps]);

  return (
    <div className="flex-1 overflow-auto bg-[radial-gradient(circle,_rgba(0,0,0,0.04)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:20px_20px]">
      <div className="flex flex-col items-center py-10 px-6 min-h-full">
        {orderedSteps.map((step, index) => (
          <React.Fragment key={step.step_id}>
            <MakerPathStep
              action={step.action}
              name={step.name}
              displayName={step.displayName}
              stepId={step.step_id}
              stepNumber={index + 1}
              selected={selectedStepId === step.step_id}
              inputFileVariable={step.input_file_variable}
              inputSourceType={step.input_source_type}
              inputPrompt={step.input_prompt}
              required={step.required}
              inputFileVariableIndexNumber={step.input_file_variable_index_number}
              variableIndexNumber={step.variable_index_number}
              variableName={step.variable_name}
              showTopConnectorDot={index > 0}
              t={t}
              selectable={selectableStepIds.has(step.step_id)}
              onClick={(id) => {
                if (selectableStepIds.has(step.step_id)) onSelectStep(id);
              }}
              onMarkStepComplete={onMarkStepAsComplete}
              onNextStep={onNextStep}
              makerPathId={makerPathId}
              workflowType={workflowType}
            />

            {/* Connector line between nodes */}
            {index < orderedSteps.length - 1 && <ConnectorLine />}
          </React.Fragment>
        ))}

        {/* End node */}
        {orderedSteps.length > 0 && (
          <>
            <ConnectorLine />
            <EndNode t={t} outputType={outputType} stageName={stageName} />
          </>
        )}

        {/* Empty state */}
        {orderedSteps.length === 0 && <EmptyState t={t} />}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
