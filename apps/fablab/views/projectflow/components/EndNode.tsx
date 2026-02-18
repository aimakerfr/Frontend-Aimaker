import React from 'react';
import { Flag } from 'lucide-react';

interface EndNodeProps {
  t: any;
  outputType?: string;
  stageName?: string;
}

const EndNode: React.FC<EndNodeProps> = ({ t, outputType, stageName }) => {
  return (
    <div className="w-48 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-xl py-4 px-5 flex items-center gap-3 overflow-hidden">
      <div className="w-9 h-9 bg-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Flag size={16} className="text-white" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {t.projectFlow.end}
        </p>
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase truncate">
          {outputType || stageName || 'OUTPUT'}
        </p>
      </div>
    </div>
  );
};

export default EndNode;
