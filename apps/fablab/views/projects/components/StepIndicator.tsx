
import React from 'react';
import { Phase } from '../types';

interface StepIndicatorProps {
  currentPhase: Phase;
  labels: string[];
  onStepClick: (phase: Phase) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentPhase, labels, onStepClick }) => {
  const phaseValues = [
    Phase.PRINCIPLE,
    Phase.PHASE_0,
    Phase.PHASE_1,
    Phase.PHASE_2,
    Phase.PHASE_3,
    Phase.PHASE_4,
    Phase.PHASE_5,
    Phase.PHASE_6,
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
      {phaseValues.map((val, idx) => (
        <button 
          key={val}
          onClick={() => onStepClick(val)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border cursor-pointer hover:scale-105 active:scale-95 ${
            currentPhase === val 
              ? 'bg-blue-600 dark:bg-blue-600 border-blue-400 dark:border-blue-400 text-white shadow-lg shadow-blue-500/20' 
              : currentPhase > val
              ? 'bg-green-100 dark:bg-green-900/40 border-green-600 dark:border-green-700 text-green-800 dark:text-green-300'
              : 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-500 hover:border-gray-400 dark:hover:border-slate-500'
          }`}
        >
          {labels[idx]}
        </button>
      ))}
    </div>
  );
};
