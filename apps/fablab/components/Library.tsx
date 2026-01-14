import React from 'react';
import { BookOpen, Search, Copy, Eye, Lock } from 'lucide-react';

const Library: React.FC = () => {
  const items = [
    { id: 1, title: 'Strategic Analysis Agent', type: 'Agent', author: 'AiMaker Team', users: 1200 },
    { id: 2, title: 'SEO Blog Post Generator', type: 'Prompt', author: 'Community', users: 850 },
    { id: 3, title: 'Legal Contracts Basics', type: 'Collection', author: 'LegalTech', users: 340 },
    { id: 4, title: 'Python Code Reviewer', type: 'Agent', author: 'AiMaker Team', users: 2100 },
  ];

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-brand-300 transition-colors flex flex-col sm:flex-row gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
              item.type === 'Agent' ? 'bg-purple-100 text-purple-600' :
              item.type === 'Prompt' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <BookOpen size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                   <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{item.type}</span>
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                </div>
                {/* Simulated lock for MVP if needed, or action button */}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>By {item.author}</span>
                <span>•</span>
                <span>{item.users} uses</span>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Eye size={16} /> Preview
                </button>
                <button className="flex-1 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 text-brand-700 dark:text-brand-400 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Copy size={16} /> Use
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-600 border-dashed">
        <Lock className="mx-auto text-gray-400 mb-2" size={32} />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Community Marketplace Coming Soon</h3>
        <p className="text-gray-500 dark:text-gray-400">Share your best agents and prompts with the world.</p>
      </div>
    </div>
  );
};

export default Library;
