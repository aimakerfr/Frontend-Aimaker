
import React from 'react';
import { PromptState, Visibility } from '../types';

interface HeaderProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
  onPublishClick: () => void;
  t: any;
}

const Header: React.FC<HeaderProps> = ({ state, onUpdate, onPublishClick, t }) => {
  const labelStyle = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3";
  const inputStyle = "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-[15px] text-slate-700 placeholder:text-slate-300";

  return (
    <div className="space-y-8">
      {/* Row 1: ASISTENTE (TIPO) | TITULO DEL ASISTENTE | PUBLIER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-2">
          <label className={labelStyle}>{t.label_assistant}</label>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl text-[#2563eb] font-bold text-sm">
            <i className="fa-solid fa-file-code text-xs"></i>
            <span>{t.label_assistant}</span>
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
          <label className={labelStyle}>{t.label_publier}</label>
          <button
            onClick={onPublishClick}
            className="w-full flex items-center justify-between px-5 py-2.5 border border-slate-200 rounded-xl text-slate-500 font-bold text-sm bg-white hover:bg-slate-50 transition-all group shadow-sm shadow-slate-50"
          >
            <div className="flex items-center gap-3">
              <i className={`fa-solid ${state.visibility === Visibility.PUBLIC ? 'fa-earth-americas' : 'fa-lock'} text-slate-400`}></i>
              <span className="text-slate-500 font-bold">{t.label_publier}</span>
            </div>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:translate-x-0.5 transition-transform"></i>
          </button>
        </div>
      </div>

      {/* Row 2: DESCRIPCION ASISTENTE | CATEGORIA | FAVORITO | IDIOMA */}
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
              {t.categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
