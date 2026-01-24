import React from 'react';
import { Zap } from 'lucide-react';

const PromptOptimize: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50/30 dark:from-gray-900 dark:to-yellow-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/10 p-6 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
            <Zap size={40} className="text-yellow-600 dark:text-yellow-400" />
            API Prompt Optimize
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Optimize your prompts for better results
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">Vista en desarrollo...</p>
            <p className="text-sm mt-2">Esta funcionalidad estará disponible próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptOptimize;
