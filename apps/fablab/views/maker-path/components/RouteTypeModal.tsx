import React from 'react';
import { Workflow, X } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

interface RouteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'custom') => void;
}

export const RouteTypeModal: React.FC<RouteTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t.makerPath.modal.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t.makerPath.modal.subtitle}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* ProjectFlow */}
          <button
            onClick={() => onSelect('custom')}
            className="group relative w-full p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800 hover:border-orange-500 dark:hover:border-orange-600 hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Workflow size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t.makerPath.modal.projectFlow.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.makerPath.modal.projectFlow.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                  {t.makerPath.modal.projectFlow.badge1}
                </span>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                  {t.makerPath.modal.projectFlow.badge2}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            {t.makerPath.modal.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
