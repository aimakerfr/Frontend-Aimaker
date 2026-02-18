import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Wand2 } from 'lucide-react';

type MakerPathStepCardProps = {
  selected: boolean;
  stepId: number;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBgClass: string; // e.g., 'bg-blue-500'
  gradientClass: string; // e.g., 'from-blue-50 to-cyan-50 ...'
  borderClass: string; // e.g., 'border-blue-200 ...'
  showKeyBadge?: boolean;
  showLibraryBadge?: boolean;
  showTopConnectorDot?: boolean;
  t: any;
  onClick?: (stepId: number) => void;
  children?: React.ReactNode;
};

const MakerPathStepCard: React.FC<MakerPathStepCardProps> = ({
  selected,
  stepId,
  title,
  subtitle,
  icon: Icon,
  iconBgClass,
  gradientClass,
  borderClass,
  showKeyBadge,
  showLibraryBadge,
  showTopConnectorDot,
  t,
  onClick,
  children,
}) => {
  return (
    <button
      onClick={() => onClick?.(stepId)}
      className={`relative bg-gradient-to-br ${gradientClass} border-2 ${
        selected
          ? 'border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30 w-[28rem]'
          : borderClass + ' shadow-md hover:shadow-lg w-80'
      } rounded-xl p-6 pt-12 pb-6 transition-all duration-200 text-left group overflow-hidden`}
    >
      {/* Badges (top-right) */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 max-w-[40%]">
        {showKeyBadge && (
          <span className="text-[10px] font-bold text-red-500 flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
            <span className="truncate">{t.projectFlow.keyNeeded}</span>
          </span>
        )}
        {showLibraryBadge && (
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
            <Wand2 size={10} className="flex-shrink-0" />
            <span className="truncate">{t.projectFlow.library}</span>
          </span>
        )}
      </div>

      {/* Icon + title */}
      <div className="flex items-start gap-4 mb-6 pr-2">
        <div className={`w-10 h-10 ${iconBgClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">{title}</h3>
          {subtitle && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Variable content rendered by parent depending on action */}
      {selected && children}

      {/* Connection point (bottom) */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
      {/* Connection point (top) */}
      {showTopConnectorDot && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
      )}
    </button>
  );
};

export default MakerPathStepCard;
