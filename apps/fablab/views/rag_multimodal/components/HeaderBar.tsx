import React from 'react';
import { ArrowLeft, Layout, Menu } from 'lucide-react';
import type { Translations } from '../../../language/locales/types';

type HeaderBarProps = {
  onBack: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  t: Translations;
};

const HeaderBar: React.FC<HeaderBarProps> = ({ onBack, sidebarOpen, onToggleSidebar, t }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-20 shrink-0">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <ArrowLeft size={16} />
            <span>{t.library.backToLibrary}</span>
          </button>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Layout size={16} />
            <span className="text-sm font-bold tracking-wide">RAG MULTIMODAL</span>
          </div>
        </div>
        <button
          onClick={onToggleSidebar}
          className={`p-2.5 rounded-xl transition-all ${
            sidebarOpen
              ? 'bg-indigo-100 text-indigo-600 shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
};

export default HeaderBar;
