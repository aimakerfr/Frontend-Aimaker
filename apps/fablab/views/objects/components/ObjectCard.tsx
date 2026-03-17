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

const TYPE_CONFIG: Record<string, { bg: string; color: string }> = {
  HTML:    { bg: '#fff7ed', color: '#ea6c00' },
  CODE:    { bg: '#f0f9ff', color: '#0284c7' },
  PDF:     { bg: '#fdf2f8', color: '#c026d3' },
  IMAGE:   { bg: '#f0fdf4', color: '#16a34a' },
  VIDEO:   { bg: '#faf5ff', color: '#7c3aed' },
  AUDIO:   { bg: '#fff1f2', color: '#e11d48' },
  JSON:    { bg: '#f7fee7', color: '#65a30d' },
  DEFAULT: { bg: '#f8fafc', color: '#64748b' },
};

const ObjectCard: React.FC<ObjectCardProps> = ({
  item, t, labels, locale, onView, onDownload, onDelete, onDragStart,
  selection, isSelected, onToggleSelect, isBusy
}) => {
  const canView = !!item.url || !!(item as any).data;
  const canDownload = !!item.url || !!(item as any).relative_path || (item as any).data !== undefined;
  const typeKey = (item.type || 'DEFAULT').toString().toUpperCase();
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
    DEFAULT: typeLabels.file || 'File',
  };
  const typeLabel = typeLabelMap[typeKey] || typeLabelMap.DEFAULT;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`
        group relative rounded-2xl bg-white border transition-all duration-200 ease-out
        cursor-grab active:cursor-grabbing active:scale-95 active:shadow-2xl active:rotate-1
        hover:shadow-md hover:-translate-y-0.5
        ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-200 shadow-md' : 'border-gray-100 shadow-sm'}
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
              : 'bg-white border-gray-300 group-hover:border-indigo-400'
            }
          `}>
            {isSelected && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </label>
      )}

      {/* Drag indicator */}
      <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-30 transition-opacity">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7-9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        </svg>
      </div>

      <div className="p-4">
        {/* Icon + Type badge */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cfg.bg }}
          >
            <span style={{ color: cfg.color }}>
              <ObjectTypeIcon type={item.type} t={t} />
            </span>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">
          {item.name}
        </h3>

        {/* Date */}
        {item.createdAt && (
          <p className="text-xs text-gray-400 mb-4">
            {new Date(item.createdAt).toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
          <button
            type="button"
            onClick={onView}
            disabled={!canView}
            className={`
              flex-1 text-xs font-semibold rounded-xl py-2 transition-all duration-150
              ${canView
                ? 'bg-gray-950 text-white hover:bg-gray-800 active:scale-95'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }
            `}
          >
            {labels?.viewDetail || 'View detail'}
          </button>

          <button
            type="button"
            onClick={onDownload}
            disabled={isBusy || !canDownload}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={labels?.download || 'Download'}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={labels?.delete || 'Delete'}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Busy spinner overlay */}
      {isBusy && (
        <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ObjectCard;