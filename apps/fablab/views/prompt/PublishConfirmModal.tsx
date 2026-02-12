import React from 'react';
import { useLanguage } from '../../language/useLanguage';

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isWorking?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const PublishConfirmModal: React.FC<Props> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isWorking = false,
  onCancel,
  onConfirm,
}) => {
  const { t } = useLanguage();
  
  // Use translations as defaults
  const modalTitle = title || t.publishModals.prompt.title;
  const modalMessage = message || t.publishModals.prompt.message;
  const modalConfirm = confirmLabel || t.publishModals.prompt.confirm;
  const modalCancel = cancelLabel || t.publishModals.prompt.cancel;
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{modalTitle}</h2>
        <p className="text-slate-600 mb-6">{modalMessage}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isWorking}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            {modalCancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isWorking}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {isWorking ? t.common.loading || 'Publication…' : modalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishConfirmModal;
