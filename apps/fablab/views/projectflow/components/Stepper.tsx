import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import type { WorkflowStep } from '../types';

type Props = {
  steps: WorkflowStep[];
  selectedStepId: number | null;
  completedStepIds: Set<number>;
  selectableStepIds: Set<number>;
  onSelectStep: (stepId: number) => void;
  makerPathId?: number;
  publishedProductId?: number | null;
  productLink?: string | null;
  projectTitle?: string;
  projectDescription?: string;
  onTitleChange?: (title: string) => void;
  onTitleBlur?: () => void;
  onDescriptionChange?: (description: string) => void;
  onDescriptionBlur?: () => void;
  onGenerateProductLink?: () => void;
  onDownloadAssembledProduct?: () => void;
  workflowType?: string;
};

const Stepper: React.FC<Props> = ({
  steps,
  selectedStepId,
  completedStepIds,
  selectableStepIds,
  onSelectStep,
  makerPathId,
  publishedProductId,
  productLink,
  projectTitle,
  projectDescription,
  onTitleChange,
  onTitleBlur,
  onDescriptionChange,
  onDescriptionBlur,
  onGenerateProductLink,
  onDownloadAssembledProduct,
  workflowType,
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

      {/* Project Info Section - Title and Description Editor */}
      {makerPathId && workflowType === 'rag_chat_maker' && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            Información del Proyecto
          </h3>
          
          <div className="space-y-3">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Título
              </label>
              <input
                type="text"
                value={projectTitle || ''}
                onChange={(e) => onTitleChange?.(e.target.value)}
                onBlur={onTitleBlur}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título del proyecto"
              />
            </div>
            
            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Descripción
              </label>
              <textarea
                value={projectDescription || ''}
                onChange={(e) => onDescriptionChange?.(e.target.value)}
                onBlur={onDescriptionBlur}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Descripción del proyecto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Management Section - Only for rag_chat_maker */}
      {makerPathId && workflowType === 'rag_chat_maker' && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            Gestión de Producto
          </h3>
          
          <div className="space-y-3">
            {/* Toggle Product Status Button */}
            {!publishedProductId ? (
              <button
                onClick={onGenerateProductLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium transition-all shadow-sm"
              >
                <Globe size={16} />
                Publicar Producto
              </button>
            ) : (
              <div className="space-y-2">
                {/* Published Status Display */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <Globe size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium flex-1">Producto Publicado</span>
                </div>
                
                {/* View Product Button */}
                <a
                  href={productLink || `/product/notebook/${publishedProductId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
                >
                  <ExternalLink size={16} />
                  Ver Producto Publicado
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download Section - Only for assembled */}
      {makerPathId && workflowType === 'assembled' && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            Producto
          </h3>
          <button
            onClick={onDownloadAssembledProduct}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            Descargar
          </button>
        </div>
      )}
    </div>
  );
};

export default Stepper;
