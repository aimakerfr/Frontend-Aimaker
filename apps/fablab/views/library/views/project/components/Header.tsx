
import React, { useState } from 'react';
import { PromptState, Visibility } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
}

const Header: React.FC<HeaderProps> = ({ state, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = translations[state.language] || translations['Español'];
  
  const labelStyle = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3";
  const inputStyle = "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-[15px] text-slate-700 placeholder:text-slate-300 bg-white";

  const isPublished = state.visibility === Visibility.PUBLIC;

  const handleConfirmPublish = () => {
    onUpdate({ visibility: isPublished ? Visibility.PRIVATE : Visibility.PUBLIC });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Row 1: PROYECTO (TIPO) | TITULO PROYECTO | PUBLICAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-2">
          <label className={labelStyle}>{t.label_project}</label>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl text-[#2563eb] font-bold text-sm">
            <i className="fa-solid fa-folder-open text-xs"></i>
            <span>{t.label_project}</span>
          </div>
        </div>

        <div className="md:col-span-6">
          <label className={labelStyle}>{t.label_title}</label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className={inputStyle}
            placeholder={t.placeholder_title}
          />
        </div>

        <div className="md:col-span-4">
          <label className={labelStyle}>{t.label_publish}</label>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`w-full flex items-center justify-between py-2.5 px-5 rounded-xl text-sm font-bold border transition-all ${
              isPublished 
              ? 'bg-[#eff6ff] border-[#3b82f6] text-[#2563eb]' 
              : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <i className={`fa-solid ${isPublished ? 'fa-earth-americas' : 'fa-lock'} text-[12px]`}></i>
              <span>{isPublished ? t.label_published : t.label_publish}</span>
            </div>
            <i className="fa-solid fa-chevron-right text-[10px] opacity-30"></i>
          </button>
        </div>
      </div>

      {/* Row 2: DESCRIPCION PROYECTO | CATEGORIA | FAVORITO | IDIOMA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-5">
          <label className={labelStyle}>{t.label_description}</label>
          <input
            type="text"
            value={state.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className={inputStyle}
            placeholder={t.placeholder_description}
          />
        </div>

        <div className="md:col-span-3">
          <label className={labelStyle}>{t.label_category}</label>
          <div className="relative">
            <select
              value={state.category}
              onChange={(e) => onUpdate({ category: e.target.value })}
              className={`${inputStyle} appearance-none cursor-pointer pr-10`}
            >
              <option>Marketing</option>
              <option>Desarrollo</option>
              <option>Diseño</option>
              <option>Operaciones</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
          </div>
        </div>

        <div className="md:col-span-1">
          <label className={labelStyle}>{t.label_favorite}</label>
          <button
            onClick={() => onUpdate({ isFavorite: !state.isFavorite })}
            className={`w-full py-2.5 flex items-center justify-center border rounded-xl transition-all ${
              state.isFavorite ? 'bg-pink-50 border-pink-200 text-pink-500 shadow-sm shadow-pink-100' : 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'
            }`}
          >
            <i className={`fa-${state.isFavorite ? 'solid' : 'regular'} fa-heart text-lg`}></i>
          </button>
        </div>

        <div className="md:col-span-3">
          <label className={labelStyle}>{t.label_language}</label>
          <div className="relative">
            <select
              value={state.language}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className={`${inputStyle} appearance-none cursor-pointer pr-10`}
            >
              <option value="Español">Español</option>
              <option value="English">English</option>
              <option value="Français">Français</option>
            </select>
            <i className="fa-solid fa-language absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-sm"></i>
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
            {/* Styling adjustment to make room for left icon */}
            <style dangerouslySetInnerHTML={{ __html: `
              select { padding-left: 2.5rem !important; }
            `}} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${isPublished ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                <i className={`fa-solid ${isPublished ? 'fa-circle-exclamation' : 'fa-cloud-arrow-up'} text-2xl`}></i>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {isPublished ? t.modal_title_unpublish : t.modal_title_publish}
              </h3>
              
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {isPublished ? t.modal_desc_unpublish : t.modal_desc_publish}
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmPublish}
                  className="w-full py-3.5 bg-[#3b82f6] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-[0.98]"
                >
                  {isPublished ? t.btn_confirm_unpublish : t.btn_confirm_publish}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3.5 bg-white text-slate-400 font-bold rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"
                >
                  {t.btn_cancel}
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
