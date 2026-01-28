
import React from 'react';
import { PromptState } from '../types';

interface FooterProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
  onSave: () => void;
  t: any;
}

const Footer: React.FC<FooterProps> = ({ state, onUpdate, t, onSave }) => {
  return (
    <div className="space-y-10">
      {/* Contexto Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-10 border-t border-slate-100">
        <div className="md:col-span-8">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t.label_context}</label>
          <textarea
            value={state.context}
            onChange={(e) => onUpdate({ context: e.target.value })}
            className="w-full h-32 px-6 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-[15px] text-slate-600 bg-white"
            placeholder={t.placeholder_context}
          ></textarea>
        </div>
      </div>

      {/* FOOTER ACTION AREA */}
      <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
         <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">{t.final_config}</span>
         <div className="flex gap-4">
           <button
             onClick={onSave}
             className="px-8 py-3 bg-[#4285f4] hover:bg-[#3b78e7] text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
           >
             {t.save_assistant}
           </button>
         </div>
      </div>
    </div>
  );
};

export default Footer;
