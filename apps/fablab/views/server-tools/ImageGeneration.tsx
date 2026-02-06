import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';

const ImageGeneration: React.FC = () => {
  const { t } = useLanguage();
  const ta = t.administration;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/10 p-6 rounded-xl border border-green-100 dark:border-green-800/30">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
            <ImageIcon size={40} className="text-green-600 dark:text-green-400" />
            {t.serverTools.tools.imageGen.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t.serverTools.tools.imageGen.description}
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

export default ImageGeneration;
