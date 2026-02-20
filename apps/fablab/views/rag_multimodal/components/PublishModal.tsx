import React from 'react';
import { Globe } from 'lucide-react';
import type { Translations } from '../../../language/locales/types';

type PublishModalProps = {
  isOpen: boolean;
  visibility: 'private' | 'public';
  onCancel: () => void;
  onConfirm: () => void;
  t: Translations;
};

const PublishModal: React.FC<PublishModalProps> = ({ isOpen, visibility, onCancel, onConfirm, t }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
            <Globe size={28} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-50 mb-2">
            {visibility === 'public' ? t.notebook.publishModal.makePrivate : t.notebook.publishModal.publish}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">
            {visibility === 'public' ? t.notebook.publishModal.makePrivateDesc : t.notebook.publishModal.publishDesc}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30"
            >
              {t.notebook.publishModal.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
