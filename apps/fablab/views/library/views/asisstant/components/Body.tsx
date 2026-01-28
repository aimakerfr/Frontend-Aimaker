
import React from 'react';
import { PromptState } from '../types';

interface BodyProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
  t: any;
}

const Body: React.FC<BodyProps> = ({ state, onUpdate, t }) => {
  return (
    <div className="relative group pt-10 border-t border-slate-100">
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t.label_instruction}</label>
      <div className="relative">
        <textarea
          value={state.instruction}
          onChange={(e) => onUpdate({ instruction: e.target.value })}
          className="w-full h-[400px] px-8 py-8 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-mono text-[15px] leading-loose text-slate-700 bg-[#fcfdfe] shadow-inner"
          placeholder={t.placeholder_instruction}
        ></textarea>
        <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-[10px] text-slate-400 font-bold border border-slate-100 shadow-sm">
          {state.instruction.length} {t.characters}
        </div>
      </div>
    </div>
  );
};

export default Body;
