import React from 'react';
import { Globe, Lock, ExternalLink } from 'lucide-react';
import type { WorkflowStep } from '../types';

type Props = {
  steps: WorkflowStep[];
  selectedStepId: number | null;
  completedStepIds: Set<number>;
  selectableStepIds: Set<number>;
  onSelectStep: (stepId: number) => void;
  makerPathId?: number;
  productLink?: string | null;
  productStatus?: string;
  onToggleProductStatus?: () => void;
  onGenerateProductLink?: () => void;
};

const Stepper: React.FC<Props> = ({
  steps,
  selectedStepId,
  completedStepIds,
  selectableStepIds,
  onSelectStep,
  makerPathId,
  productLink,
  productStatus = 'private',
  onToggleProductStatus,
  onGenerateProductLink,
}) => {
  // Keep stable ordering only for display numbering; selectability comes from parent
  const ordered = React.useMemo(() => [...steps].sort((a, b) => a.step_id - b.step_id), [steps]);

  return (
    <div className="w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 overflow-y-auto flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
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

      {/* Product Management Section */}
      {makerPathId && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            Gestión de Producto
          </h3>
          
          <div className="space-y-3">
            {/* Toggle Product Status Button */}
            {!productLink ? (
              <button
                onClick={onGenerateProductLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium transition-all shadow-sm"
              >
                <Globe size={16} />
                Publicar Producto
              </button>
            ) : (
              <div className="space-y-2">
                {/* Status Display */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {productStatus === 'public' ? (
                    <>
                      <Globe size={16} className="text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium flex-1">Producto Público</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium flex-1">Producto Privado</span>
                    </>
                  )}
                  <button
                    onClick={onToggleProductStatus}
                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>

                {/* Product Link Button */}
                <a
                  href={productStatus === 'public' ? productLink : undefined}
                  target={productStatus === 'public' ? '_blank' : undefined}
                  rel={productStatus === 'public' ? 'noopener noreferrer' : undefined}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    productStatus === 'public'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-pointer'
                      : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={(e) => productStatus !== 'public' && e.preventDefault()}
                >
                  <ExternalLink size={16} />
                  <span>Ver Producto</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stepper;
