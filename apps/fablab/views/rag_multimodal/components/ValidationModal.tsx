import React from 'react';
import { AlertCircle } from 'lucide-react';

type ValidationModalProps = {
  isOpen: boolean;
  onContinueEditing: () => void;
  onDiscardAndExit: () => void;
};

const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onContinueEditing, onDiscardAndExit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            {/* Keep existing literal to avoid changing translations now */}
            Campos incompletos
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">
            No has completado todos los campos obligatorios. ¿Qué deseas hacer?
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onContinueEditing}
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Seguir editando
            </button>
            <button
              onClick={onDiscardAndExit}
              className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Anular y salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;
