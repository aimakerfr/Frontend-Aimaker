import React from 'react';
import { Database } from 'lucide-react';

const PerplexityIndex: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
            <Database size={40} className="text-blue-600 dark:text-blue-400" />
            Perplexity Index
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Search & Knowledge Base Management
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

export default PerplexityIndex;
