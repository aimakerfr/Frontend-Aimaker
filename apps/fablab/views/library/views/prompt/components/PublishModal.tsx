
import React from 'react';
import { translations, languageMap } from '../translations';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language: string;
}

const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, onConfirm, language }) => {
  if (!isOpen) return null;

  const langCode = languageMap[language] || 'es';
  const t = translations[langCode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 p-8 flex flex-col items-center">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        {/* Cloud Icon */}
        <div className="w-16 h-16 bg-[#eff6ff] rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-sm">
          <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t.modalTitle}</h2>
        <p className="text-center text-slate-500 text-sm leading-relaxed mb-8 px-4">
          {t.modalDesc}
        </p>

        {/* Actions */}
        <div className="w-full space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 bg-[#3b82f6] text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
          >
            {t.confirm}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-white text-slate-500 font-bold rounded-2xl border border-slate-100 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
