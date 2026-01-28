import React from 'react';

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
  title = 'Publier le prompt',
  message = "Êtes-vous sûr de vouloir rendre ce prompt public ? Toute personne disposant du lien pourra y accéder.",
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isWorking = false,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{title}</h2>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isWorking}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isWorking}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {isWorking ? 'Publication…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishConfirmModal;
