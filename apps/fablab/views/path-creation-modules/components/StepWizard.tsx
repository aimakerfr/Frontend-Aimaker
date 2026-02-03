import React from 'react';
import { WizardStep } from '../types';
import { Check } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';
import { translations } from '../../../language/translations';

interface StepWizardProps {
  currentStep: WizardStep;
  onStepChange: (step: WizardStep) => void;
  disabled?: boolean; // Disable navigation in view mode
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, onStepChange, disabled = false }) => {
  const { language } = useLanguage();
  const t = translations[language];
  
  const steps: { id: WizardStep; label: string; description: string }[] = [
    { id: 'select', label: t.moduleCreator.steps.select, description: t.moduleCreator.steps.selectDescription },
    { id: 'edit', label: t.moduleCreator.steps.edit, description: t.moduleCreator.steps.editDescription },
    { id: 'export', label: t.moduleCreator.steps.export, description: t.moduleCreator.steps.exportDescription },
  ];
  
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-slate-800 border-b border-slate-700 p-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = step.id === currentStep;
            // Bloquear fase 'select' (index 0) si está disabled (modo vista)
            const isSelectPhaseBlocked = disabled && index === 0;
            const isClickable = !disabled && index <= currentStepIndex && !isSelectPhaseBlocked;

            return (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => isClickable && onStepChange(step.id)}
                    disabled={!isClickable || isSelectPhaseBlocked}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm mb-1.5 transition-all ${
                      isSelectPhaseBlocked
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                        : isCompleted
                        ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </button>
                  
                  <div className="text-center">
                    <div className={`font-medium text-xs ${
                      isCurrent ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded transition-colors ${
                    index < currentStepIndex ? 'bg-green-600' : 'bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
