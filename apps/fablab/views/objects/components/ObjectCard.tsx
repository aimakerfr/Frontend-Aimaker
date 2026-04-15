import React from 'react';
import type { ObjectItem } from '@core/objects';
import ObjectTypeIcon from './ObjectTypeIcon';

type ObjectCardProps = {
  item: ObjectItem;
  t: any;
  labels?: {
    viewDetail?: string;
    download?: string;
    delete?: string;
    typeLabels?: {
      html?: string;
      code?: string;
      pdf?: string;
      image?: string;
      video?: string;
      audio?: string;
      json?: string;
      file?: string;
    };
  };
  locale?: string;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onDragStart: (ev: React.DragEvent<HTMLDivElement>) => void;
  selection?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (checked: boolean) => void;
  isBusy?: boolean;
};

const TYPE_CONFIG: Record<string, { bg: string; color: string; darkBg?: string }> = {
  HTML:    { bg: '#fff7ed', color: '#ea580c', darkBg: '#431407' },
  CODE:    { bg: '#f0f9ff', color: '#0284c7', darkBg: '#082f49' },
  PDF:     { bg: '#fdf2f8', color: '#c026d3', darkBg: '#4a044e' },
  IMAGE:   { bg: '#f0fdf4', color: '#16a34a', darkBg: '#052e16' },
  VIDEO:   { bg: '#faf5ff', color: '#7c3aed', darkBg: '#2e1065' },
  AUDIO:   { bg: '#fff1f2', color: '#e11d48', darkBg: '#4c0519' },
  JSON:    { bg: '#f7fee7', color: '#65a30d', darkBg: '#1a2e05' },
  DEFAULT: { bg: '#f8fafc', color: '#64748b', darkBg: '#0f172a' },
};

const ObjectCard: React.FC<ObjectCardProps> = ({
  item, t, labels, locale, onView, onDownload, onDelete, onDragStart,
  selection, isSelected, onToggleSelect, isBusy
}) => {
  const canView = !!item.url || !!(item as any).data;
  const canDownload = !!item.url || !!(item as any).relative_path || (item as any).data !== undefined;
  const rawTypeKey = (item.type || 'DEFAULT').toString().toUpperCase();
  const isMarkdown = (item.name || '').toLowerCase().endsWith('.md');
  const typeKey = isMarkdown ? 'MD' : rawTypeKey;
  const cfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.DEFAULT;
  const typeLabels = labels?.typeLabels || {};
  const typeLabelMap: Record<string, string> = {
    HTML: typeLabels.html || 'HTML',
    CODE: typeLabels.code || 'Code',
    PDF: typeLabels.pdf || 'PDF',
    IMAGE: typeLabels.image || 'Image',
    VIDEO: typeLabels.video || 'Video',
    AUDIO: typeLabels.audio || 'Audio',
    JSON: typeLabels.json || 'JSON',
    MD: 'MD',
    DEFAULT: typeLabels.file || 'File',
  };
  const typeLabel = typeLabelMap[typeKey] || typeLabelMap.DEFAULT;

  // Detect if we are in dark mode to adjust dynamic colors
  const isDarkMode = document.documentElement.classList.contains('dark');
  const activeBg = isDarkMode && cfg.darkBg ? cfg.darkBg : cfg.bg;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`
        group relative rounded-2xl bg-white dark:bg-gray-800 border transition-all duration-200 ease-out
        cursor-grab active:cursor-grabbing active:scale-95 active:shadow-2xl active:rotate-1
        hover:shadow-md hover:-translate-y-0.5 flex flex-col h-full
        ${isSelected
          ? 'ring-2 ring-indigo-500 border-indigo-200 dark:border-indigo-900 shadow-md'
          : 'border-gray-100 dark:border-gray-700 shadow-sm'
        }
        ${isBusy ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      {/* Selection checkbox */}
      {selection && (
        <label
          className="absolute top-3 left-3 z-10 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={!!isSelected}
            onChange={(ev) => onToggleSelect?.(ev.target.checked)}
          />
          <div className={`
            h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all
            ${isSelected
              ? 'bg-indigo-500 border-indigo-500'
              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 shadow-sm'
            }
          `}>
            {isSelected && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </label>
      )}

      {/* Drag indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7-9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        </svg>
      </div>

      {/* 1. Header Section: Name */}
      <div className={`
        p-4 pb-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/20 rounded-t-2xl
        ${selection ? 'pl-11' : ''}
      `}>
        <h3 
          className="text-sm font-bold text-gray-900 dark:text-white leading-tight break-words line-clamp-2 min-h-[2.5rem] flex items-center" 
          title={item.name}
        >
          {item.name}
        </h3>
      </div>

      {/* 2. Body Section */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Icon + Type badge + Assembly tags */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5 dark:border-white/5"
            style={{ backgroundColor: activeBg }}
          >
            <span style={{ color: cfg.color }}>
              <ObjectTypeIcon type={item.type} t={t} />
            </span>
          </div>
          
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/5"
            style={{ backgroundColor: activeBg, color: cfg.color }}
          >
            {typeLabel}
          </span>

          {/* Product Tag */}
          {(item as any).product_type_for_assembly && (
            <span 
              title={(item as any).product_type_for_assembly}
              className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-100 dark:border-blue-800/50 truncate max-w-[50%] transition-all hover:max-w-full cursor-help shadow-sm"
            >
              <span className="mr-1 opacity-60">PROD:</span>
              <span className="truncate">{(item as any).product_type_for_assembly}</span>
            </span>
          )}

          {/* Module Tag */}
          {(item as any).module_name_for_assembly && (
            <span 
              title={(item as any).module_name_for_assembly}
              className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-[9px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-100 dark:border-purple-800/50 truncate max-w-[50%] transition-all hover:max-w-full cursor-help shadow-sm"
            >
              <span className="mr-1 opacity-60">MOD:</span>
              <span className="truncate">{(item as any).module_name_for_assembly}</span>
            </span>
          )}
        </div>

        {/* Date */}
        {item.createdAt && (
          <div className="mt-auto mb-4">
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(item.createdAt).toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}

        {/* 3. Action row */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-700">
          <button
            type="button"
            onClick={onView}
            disabled={!canView}
            className={`
              flex-1 text-xs font-bold rounded-xl py-2.5 transition-all duration-150 shadow-sm
              ${canView
                ? 'bg-gray-950 dark:bg-gray-100 text-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }
            `}
          >
            {labels?.viewDetail || 'View detail'}
          </button>

          <button
            type="button"
            onClick={onDownload}
            disabled={isBusy || !canDownload}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-gray-100 dark:border-gray-700"
            title={labels?.download || 'Download'}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-gray-100 dark:border-gray-700"
            title={labels?.delete || 'Delete'}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Busy spinner overlay */}
      {isBusy && (
        <div className="absolute inset-0 rounded-2xl bg-white/70 dark:bg-gray-800/70 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-700 dark:border-t-gray-300 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ObjectCard;