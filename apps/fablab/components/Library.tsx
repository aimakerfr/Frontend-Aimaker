import React from 'react';
import { BookOpen, Search, Link2, FileText, Notebook, FolderKanban, Smartphone, Globe, Code, ArrowRight } from 'lucide-react';

const Library: React.FC = () => {
  const sections = [
    { id: 1, type: 'agent', title: 'Agent', icon: BookOpen, description: 'AI-powered intelligent agents', count: 24 },
    { id: 2, type: 'external_link', title: 'External Link', icon: Link2, description: 'Curated external resources', count: 18 },
    { id: 3, type: 'prompt', title: 'Prompt', icon: FileText, description: 'Ready-to-use prompt templates', count: 52 },
    { id: 4, type: 'note_book', title: 'Note Book', icon: Notebook, description: 'Knowledge bases and notes', count: 15 },
    { id: 5, type: 'project', title: 'Project', icon: FolderKanban, description: 'Complete project templates', count: 9 },
    { id: 6, type: 'app', title: 'App', icon: Smartphone, description: 'Interactive applications', count: 12 },
    { id: 7, type: 'perplexity_search', title: 'Perplexity Search', icon: Globe, description: 'Advanced search templates', count: 7 },
    { id: 8, type: 'vibe_coding', title: 'Vibe Coding', icon: Code, description: 'Coding assistants and tools', count: 31 },
  ];

  const handleSectionClick = (type: string, title: string) => {
    console.log(`Navigating to section: ${type}`);
    // Aquí manejas la navegación a cada sección
    // Ejemplo: navigate(`/library/${type}`);
  };

  const getGradientColor = (type: string) => {
    const colors: Record<string, string> = {
      agent: 'from-purple-400 to-purple-600',
      external_link: 'from-green-400 to-green-600',
      prompt: 'from-blue-400 to-blue-600',
      note_book: 'from-amber-400 to-amber-600',
      project: 'from-pink-400 to-pink-600',
      app: 'from-indigo-400 to-indigo-600',
      perplexity_search: 'from-cyan-400 to-cyan-600',
      vibe_coding: 'from-orange-400 to-orange-600',
    };
    return colors[type] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Library</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Explore verified prompts, agents, and knowledge bases.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search library..."
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.type, section.title)}
              className="group bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-2xl hover:border-brand-400 dark:hover:border-brand-500 transition-all duration-300 flex gap-4 text-left cursor-pointer"
            >
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br ${getGradientColor(section.type)} text-white`}
              >
                <Icon size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {section.type.replace('_', ' ')}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h3>
                  </div>
                  <ArrowRight
                    size={24}
                    className="text-gray-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {section.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {section.count} items
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Library;