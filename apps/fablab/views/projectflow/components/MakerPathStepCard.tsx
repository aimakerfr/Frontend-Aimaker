import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Wand2 } from 'lucide-react';

type MakerPathStepCardProps = {
  selected: boolean;
  stepId: number;
  stepNumber?: number;
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
  disabled?: boolean;
  onClick?: (stepId: number) => void;
  children?: React.ReactNode;
};

const MakerPathStepCard: React.FC<MakerPathStepCardProps> = ({
  selected,
  stepId,
  stepNumber,
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
  disabled,
  onClick,
  children,
}) => {
  return (
    <div
      onClick={() => !disabled && onClick?.(stepId)}
      className={`relative bg-gradient-to-br ${gradientClass} border-2 ${selected
          ? 'border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30 w-[65rem]'
          : borderClass + ' shadow-md hover:shadow-lg w-[45rem]'
        } rounded-2xl p-8 pt-14 pb-8 transition-all duration-200 text-left group overflow-hidden ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
    >
      {/* Step number (top-left) */}
      {typeof stepNumber === 'number' && (
        <div className="absolute top-5 left-5 w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-bold flex items-center justify-center">
          {stepNumber}
        </div>
      )}
      {/* Badges (top-right) */}
      <div className="absolute top-5 right-5 flex flex-col items-end gap-2 max-w-[40%]">
        {showKeyBadge && (
          <span className="text-xs font-bold text-red-500 flex items-center gap-2 whitespace-nowrap">
            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
            <span className="truncate">{t.projectFlow.keyNeeded}</span>
          </span>
        )}
        {showLibraryBadge && (
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 whitespace-nowrap">
            <Wand2 size={12} className="flex-shrink-0" />
            <span className="truncate">{t.projectFlow.library}</span>
          </span>
        )}
      </div>

      {/* Icon + title */}
      <div className="flex items-start gap-5 mb-8 pr-2">
        <div className={`w-14 h-14 ${iconBgClass} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <Icon size={28} className="text-white" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="font-bold text-gray-900 dark:text-white text-xl leading-tight truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Variable content rendered by parent depending on action */}
      {selected && (
        <div onClick={(e) => e.stopPropagation()} className="relative">
          {children}
        </div>
      )}

      {/* Connection point (bottom) */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
      {/* Connection point (top) */}
      {showTopConnectorDot && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
      )}
    </div>
  );
};

export default MakerPathStepCard;
