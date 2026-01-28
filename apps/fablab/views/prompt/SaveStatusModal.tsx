import React from 'react';

type ModalType = 'success' | 'error';

interface SaveStatusModalProps {
  open: boolean;
  type: ModalType;
  title?: string;
  message?: string;
  onClose: () => void;
}

const SaveStatusModal: React.FC<SaveStatusModalProps> = ({ open, type, title, message, onClose }) => {
  if (!open) return null;

  const isSuccess = type === 'success';
  const accent = isSuccess ? 'blue' : 'red';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto bg-${accent}-100`}>
          {/* Simple status dot */}
          <div className={`w-3 h-3 rounded-full bg-${accent}-500`}></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          {title || (isSuccess ? 'Enregistré avec succès' : "Erreur lors de l'enregistrement")}
        </h2>
        {message && (
          <p className="text-slate-600 mb-6 text-center">
            {message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveStatusModal;
