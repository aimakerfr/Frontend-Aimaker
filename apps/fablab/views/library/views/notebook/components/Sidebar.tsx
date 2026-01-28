
import React from 'react';
import { PromptState } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  state: PromptState;
}

const Sidebar: React.FC<SidebarProps> = ({ state }) => {
  const t = translations[state.language] || translations['Español'];

  // Ancho aumentado a 240px como solicitado para dar más espacio a la primera columna
  return (
    <aside className="w-[240px] bg-white border-r border-slate-100 flex flex-col h-full shrink-0 transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3 w-full">
          <i className="fa-solid fa-book-bookmark text-[#5b5dfa] text-base"></i>
          <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-wider">{t.sidebar_sources}</h3>
        </div>
      </div>

      {/* Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-30 grayscale">
        <div className="w-16 h-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center mb-5">
           <i className="fa-solid fa-file-lines text-3xl text-slate-200"></i>
        </div>
        <span className="text-[11px] font-black text-slate-300 tracking-[0.2em] uppercase text-center leading-relaxed">
          {t.sidebar_empty}
        </span>
      </div>

      {/* Footer Action */}
      <div className="p-6">
        <button className="w-full py-4 bg-[#5b5dfa] text-white font-black text-[11px] rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-50 hover:bg-indigo-600 transition-all active:scale-95">
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span className="truncate tracking-widest">{t.sidebar_add_source}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
