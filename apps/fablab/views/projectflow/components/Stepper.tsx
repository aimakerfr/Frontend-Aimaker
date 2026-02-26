import React from 'react';
import type { WorkflowStep } from '../types';

type Props = {
  steps: WorkflowStep[];
  selectedStepId: number | null;
  completedStepIds: Set<number>;
  selectableStepIds: Set<number>;
  onSelectStep: (stepId: number) => void;
};

const Stepper: React.FC<Props> = ({
  steps,
  selectedStepId,
  completedStepIds,
  selectableStepIds,
  onSelectStep,
}) => {
  // Keep stable ordering only for display numbering; selectability comes from parent
  const ordered = React.useMemo(() => [...steps].sort((a, b) => a.step_id - b.step_id), [steps]);

  return (
    <div className="w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <ol className="space-y-2">
          {ordered.map((step, idx) => {
            const enabled = selectableStepIds.has(step.step_id);
            const isSelected = selectedStepId === step.step_id;
            const isCompleted = completedStepIds.has(step.step_id);
            return (
              <li key={step.step_id} className="">
                <div
                  className={
                    'flex items-center gap-3 p-2 rounded-md transition-colors ' +
                    (enabled
                      ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'opacity-60 cursor-not-allowed') +
                    (isSelected ? ' ring-2 ring-amber-400' : '')
                  }
                  onClick={() => {
                    if (enabled) onSelectStep(step.step_id);
                  }}
                >
                  <div
                    className={
                      'w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ' +
                      (isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200')
                    }
                    aria-label={isCompleted ? 'completed' : 'not-completed'}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {step.displayName || step.name}
                    </div>
                  </div>
                  {/* Completion shown visually only in the dot; no toggle here */}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default Stepper;
