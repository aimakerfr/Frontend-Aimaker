
import React, { useState } from 'react';
import { PromptState, Visibility } from '../types';
import { translations } from '../translations';

interface TopBarProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
}

const TopBar: React.FC<TopBarProps> = ({ state, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = translations[state.language] || translations['Español'];
  const isPublished = state.visibility === Visibility.PUBLIC;

  const labelStyle = "text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-0.5";
  const fieldBase = "h-[40px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-200 transition-all text-[13px] text-slate-600 bg-white px-3 flex items-center shadow-sm";

  const handleConfirmPublish = () => {
    onUpdate({ visibility: isPublished ? Visibility.PRIVATE : Visibility.PUBLIC });
    setIsModalOpen(false);
  };

  return (
    <div className="w-full h-[76px] bg-white flex items-center px-10 gap-5 shrink-0 border-b border-slate-50">
      {/* CONTENEDOR LOGO RAG MULTIMODAL */}
      <div className="w-[180px] shrink-0">
        <label className={labelStyle}>{t.label_rag_multimodal}</label>
        <div className="flex items-center gap-2.5 px-4 bg-[#5b5dfa] rounded-xl text-white font-black text-[11px] h-[40px] cursor-default shadow-md shadow-indigo-100">
          <i className="fa-solid fa-microchip text-[10px]"></i>
          <span className="tracking-wider whitespace-nowrap">{t.label_rag_multimodal}</span>
        </div>
      </div>

      {/* Título del RAG */}
      <div className="flex-1 min-w-[120px]">
        <label className={labelStyle}>{t.label_title}</label>
        <input
          type="text"
          value={state.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className={`${fieldBase} w-full font-semibold`}
          placeholder={t.placeholder_title}
        />
      </div>

      {/* Categoría */}
      <div className="w-36 shrink-0">
        <label className={labelStyle}>{t.label_category}</label>
        <div className="relative">
          <select
            value={state.category}
            onChange={(e) => onUpdate({ category: e.target.value })}
            className={`${fieldBase} w-full appearance-none cursor-pointer pr-8 font-medium`}
          >
            <option value="Marketing">{t.cat_marketing}</option>
            <option value="Desarrollo">{t.cat_dev}</option>
            <option value="Investigación">{t.cat_research}</option>
          </select>
          <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[9px]"></i>
        </div>
      </div>

      {/* Favorito */}
      <div className="shrink-0">
        <label className={labelStyle}>{t.label_fav}</label>
        <button
          onClick={() => onUpdate({ isFavorite: !state.isFavorite })}
          className={`h-[40px] w-[40px] flex items-center justify-center border rounded-xl transition-all shadow-sm ${
            state.isFavorite ? 'bg-pink-50 border-pink-100 text-pink-500' : 'bg-white border-slate-200 text-slate-200 hover:bg-slate-50'
          }`}
        >
          <i className={`fa-${state.isFavorite ? 'solid' : 'regular'} fa-heart text-[14px]`}></i>
        </button>
      </div>

      {/* Idioma */}
      <div className="w-32 shrink-0">
        <label className={labelStyle}>{t.label_language}</label>
        <div className="relative">
          <select
            value={state.language}
            onChange={(e) => onUpdate({ language: e.target.value })}
            className={`${fieldBase} w-full appearance-none cursor-pointer pr-8 font-medium`}
          >
            <option value="Español">Español</option>
            <option value="English">English</option>
            <option value="Français">Français</option>
          </select>
          <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[9px]"></i>
        </div>
      </div>

      {/* Publicar RAG */}
      <div className="w-40 shrink-0">
        <label className={labelStyle}>{t.label_publish}</label>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between px-4 border border-slate-200 rounded-xl text-[12px] text-slate-500 hover:bg-slate-50 transition-all bg-white h-[40px] shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-globe text-[11px] opacity-40"></i>
            <span className="font-bold">{t.btn_publish}</span>
          </div>
          <i className="fa-solid fa-chevron-right text-[9px] opacity-20"></i>
        </button>
      </div>

      {/* Deployment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-blue-50 text-blue-500">
                <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{t.modal_publish_title}</h3>
              <p className="text-slate-400 text-sm mb-10 font-medium italic">{t.modal_publish_confirm}</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleConfirmPublish} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">{t.btn_enable}</button>
                <button onClick={() => setIsModalOpen(false)} className="w-full py-4 bg-white text-slate-300 font-bold rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">{t.btn_cancel}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
