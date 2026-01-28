import React from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import ToolViewCard, { useToolView } from '../tool/ToolViewCard';
import PromptDetails from './PromptDetails';
// Body editing is handled inside PromptDetails now

const CATEGORY_OPTIONS = ['Marketing', 'Ventes', 'Développement', 'RH'];
const LANGUAGE_OPTIONS = ['Espagnol', 'Anglais', 'Français'];

const PromptView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toolId = id ? parseInt(id, 10) : null;
  // Title section moved into ToolViewCard
  const MetadataSection: React.FC = () => {
    const { state, update } = useToolView();
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TYPE</label>
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eff6ff] border border-[#dbeafe] rounded-xl text-[#2563eb] font-bold shadow-sm h-[46px]">
              <FileText size={16} />
              <span className="text-sm">Prompt</span>
            </div>
          </div>

          <div className="md:col-span-10">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TITRE</label>
            <input
              type="text"
              value={state.title}
              onChange={(e) => update({ title: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
              placeholder="Titre du prompt"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">DESCRIPTION</label>
            <input
              type="text"
              value={state.description}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
              placeholder="Description du prompt"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">CATÉGORIE</label>
            <select
              value={state.category}
              onChange={(e) => update({ category: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">LANGUE</label>
            <select
              value={state.language}
              onChange={(e) => update({ language: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
              disabled={true}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-b border-slate-100 pt-2"></div>
      </div>
    );
  };

  // Prompt body editing moved to PromptDetails

  // Details (below CUERPO DEL PROMPT) will be rendered by PromptDetails component

  // Moved urls and save sections into ToolViewCard via props

  const Content: React.FC = () => (
    <>
      <MetadataSection />
      {/* Body section is now rendered inside PromptDetails */}
      {toolId && <PromptDetails toolId={toolId} />}
    </>
  );


  return (
    <div className="flex justify-center p-4 md:p-8 relative bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      <ToolViewCard toolId={toolId}>
        <Content />
      </ToolViewCard>
    </div>
  );
};

export default PromptView;
