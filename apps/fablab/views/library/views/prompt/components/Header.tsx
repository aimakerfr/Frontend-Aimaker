
import React from 'react';
import { PromptState, Visibility } from '../types';
import { translations, languageMap } from '../translations';

interface HeaderProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
  onOpenPublish: () => void;
}

const Header: React.FC<HeaderProps> = ({ state, onUpdate, onOpenPublish }) => {
  const langCode = languageMap[state.language] || 'es';
  const t = translations[langCode];

  return (
    <div className="space-y-6">
      {/* Row 1: ASISTENTE | TÍTULO DEL ASISTENTE | PUBLICAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.assistantLabel}</label>
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eff6ff] border border-[#dbeafe] rounded-xl text-[#2563eb] font-bold shadow-sm h-[46px]">
            <i className="fa-solid fa-file-code text-xs"></i>
            <span className="text-sm">{t.assistantValue}</span>
          </div>
        </div>

        <div className="md:col-span-7">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.titleLabel}</label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
            placeholder={t.titleLabel}
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.publishLabel}</label>
          <button
            onClick={onOpenPublish}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all group shadow-sm h-[46px]"
          >
            <div className="flex items-center gap-3">
              <i className={`fa-solid ${state.visibility === Visibility.PUBLIC ? 'fa-earth-americas text-blue-500' : 'fa-lock text-slate-400'} text-sm`}></i>
              <span className="text-sm font-semibold text-slate-600">
                {state.visibility === Visibility.PUBLIC ? t.published : t.publish}
              </span>
            </div>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-blue-400 transition-colors"></i>
          </button>
        </div>
      </div>

      {/* Row 2: DESCRIPCIÓN ASISTENTE | CATEGORÍA | ¿FAVORITO? | IDIOMA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.descLabel}</label>
          <input
            type="text"
            value={state.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
            placeholder={t.descLabel}
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.categoryLabel}</label>
          <div className="relative">
            <select
              value={state.category}
              onChange={(e) => onUpdate({ category: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
            >
              <option value="Marketing">{t.marketing}</option>
              <option value="Ventas">{t.ventas}</option>
              <option value="Desarrollo">{t.desarrollo}</option>
              <option value="RRHH">{t.rrhh}</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center whitespace-nowrap">{t.favoriteLabel}</label>
          <button
            onClick={() => onUpdate({ isFavorite: !state.isFavorite })}
            className={`w-full flex items-center justify-center border rounded-xl transition-all shadow-sm h-[46px] ${
              state.isFavorite 
                ? 'bg-red-50 border-red-200 text-red-500' 
                : 'bg-white border-slate-200 text-slate-300 hover:text-slate-400 hover:border-slate-300'
            }`}
          >
            <i className={`fa-${state.isFavorite ? 'solid' : 'regular'} fa-heart text-lg`}></i>
          </button>
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.langLabel}</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <i className="fa-solid fa-language text-sm"></i>
            </div>
            <select
              value={state.language}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
            >
              <option value="Español">Español</option>
              <option value="English">English</option>
              <option value="Français">Français</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-slate-100 pt-2"></div>
    </div>
  );
};

export default Header;
