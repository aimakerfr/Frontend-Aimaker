
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
        <div className="md:col-span-8">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t.label_context}</label>
          <textarea
            value={state.context}
            onChange={(e) => onUpdate({ context: e.target.value })}
            className="w-full h-40 px-6 py-5 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-[#5b5dfa]/5 focus:border-[#5b5dfa] transition-all text-[15px] text-slate-600 bg-white shadow-sm resize-none"
            placeholder={t.placeholder_context}
          ></textarea>
        </div>
        <div className="md:col-span-4 flex flex-col justify-end pb-2">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-circle-info text-[#5b5dfa] text-xs"></i>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.help_title}</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed italic">
                    {t.help_text}
                </p>
            </div>
        </div>
      </div>

      {/* FOOTER EMPTY SPACE and Action Button */}
      <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
         <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{t.footer_text}</span>
         <button 
           onClick={onSave}
           className="px-10 py-4 bg-[#5b5dfa] text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 tracking-wide"
         >
           {t.btn_save}
         </button>
      </div>
    </div>
  );
};

export default Footer;
