import React from 'react';
import { Settings } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';

const Administration: React.FC = () => {
  const { t } = useLanguage();
  const ta = t.administration;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50/30 dark:from-gray-900 dark:to-slate-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/10 p-6 rounded-xl border border-gray-100 dark:border-gray-800/30">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
            <Settings size={40} className="text-gray-600 dark:text-gray-400" />
            {ta.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {ta.subtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">{ta.inDevelopment}</p>
            <p className="text-sm mt-2">{ta.availableSoon}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administration;
