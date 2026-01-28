
import React from 'react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: any;
}

const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, onConfirm, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px] transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-lg rounded-[32px] p-10 shadow-2xl animate-in zoom-in duration-300">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-[#eff6ff] rounded-2xl flex items-center justify-center text-[#3b82f6]">
            <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
          </div>

          {/* Texts */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">{t.modal_title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed px-4">
              {t.modal_desc}
            </p>
          </div>

          {/* Buttons */}
          <div className="w-full pt-4 space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-[#4285f4] hover:bg-[#3b78e7] text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200"
            >
              {t.modal_confirm}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-white hover:bg-slate-50 text-slate-500 font-bold rounded-2xl transition-all border border-transparent"
            >
              {t.modal_cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
