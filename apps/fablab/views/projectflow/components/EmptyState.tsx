import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  t: any;
}

const EmptyState: React.FC<EmptyStateProps> = ({ t }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-20">
      <Sparkles size={48} className="mb-4 opacity-30" />
      <p className="text-sm mt-1">{t.projectFlow.pasteJsonFirst}</p>
    </div>
  );
};

export default EmptyState;
