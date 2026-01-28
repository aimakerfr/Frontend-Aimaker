
import React from 'react';
import { PromptState } from '../types';
import { translations } from '../translations';

interface FooterProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
  onSave: () => void;
}

const Footer: React.FC<FooterProps> = ({ state, onUpdate, onSave }) => {
  const t = translations[state.language] || translations['Español'];

  return (
    <div className="space-y-10">
      {/* Contexto Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-10 border-t border-slate-100">
        <div className="md:col-span-6">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t.label_context}</label>
          <textarea
            value={state.context}
            onChange={(e) => onUpdate({ context: e.target.value })}
            className="w-full h-32 px-6 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-[15px] text-slate-600 bg-white shadow-sm"
            placeholder={t.placeholder_context}
          ></textarea>
        </div>
        <div className="md:col-span-6">
        </div>
      </div>

      {/* FOOTER EMPTY SPACE and Action Button */}
      <div className="h-40 pt-10 border-t border-slate-100 flex items-start justify-between">
         <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">{t.footer_text}</span>
         <button 
           onClick={onSave}
           className="px-8 py-3 bg-[#3b82f6] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95"
         >
           {t.btn_save}
         </button>
      </div>
    </div>
  );
};

export default Footer;
