import React from 'react';
import { WizardStep } from '../types';
import { Check } from 'lucide-react';

interface StepWizardProps {
  currentStep: WizardStep;
  onStepChange: (step: WizardStep) => void;
}

const steps: { id: WizardStep; label: string; description: string }[] = [
  { id: 'select', label: 'Seleccionar', description: 'Elige plantillas o crea desde cero' },
  { id: 'edit', label: 'Editar', description: 'Personaliza tu contenido' },
  { id: 'export', label: 'Exportar', description: 'Descarga tu proyecto' },
];

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, onStepChange }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-slate-800 border-b border-slate-700 p-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = step.id === currentStep;
            const isClickable = index <= currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => isClickable && onStepChange(step.id)}
                    disabled={!isClickable}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm mb-1.5 transition-all ${
                      isCompleted
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
