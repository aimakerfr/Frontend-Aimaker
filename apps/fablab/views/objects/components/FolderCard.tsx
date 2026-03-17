import React, { useState } from 'react';
import type { ObjectFolder } from '@core/objects';

type FolderCardProps = {
  folder: ObjectFolder;
  isSelected: boolean;
  count: number;
  isRoot?: boolean;
  labels?: {
    rename?: string;
    delete?: string;
    changeIcon?: string;
    dropHere?: string;
  };
  counts?: {
    fileSingular?: string;
    filePlural?: string;
  };
  locale?: string;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onChangeEmoji: () => void;
  onDrop: (ev: React.DragEvent<HTMLDivElement>) => void;
};

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  isSelected,
  count,
  isRoot,
  labels,
  counts,
  locale,
  onSelect,
  onRename,
  onDelete,
  onChangeEmoji,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const color = folder.color || '#6366f1';

  return (
    <div
      onClick={onSelect}
      onDragOver={(ev) => { ev.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(ev) => { setIsDragOver(false); onDrop(ev); }}
      className={`
        group relative rounded-2xl cursor-pointer select-none
        transition-all duration-200 ease-out overflow-hidden
        ${isDragOver
          ? 'scale-[1.03] shadow-2xl ring-2 ring-indigo-400'
          : isSelected
            ? 'shadow-lg ring-2 ring-offset-1'
            : 'shadow-sm hover:shadow-md hover:scale-[1.01]'
        }
      `}
      style={{
        ringColor: isSelected ? color : undefined,
        background: isDragOver
          ? `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`
          : isSelected
            ? `linear-gradient(135deg, ${color}12 0%, ${color}05 100%)`
            : 'white',
        border: `1.5px solid ${isDragOver ? color : isSelected ? color + '80' : '#e5e7eb'}`,
      }}
    >
      {/* Top color strip */}
      <div
        className="h-1 w-full absolute top-0 left-0 rounded-t-2xl transition-opacity duration-200"
        style={{ backgroundColor: color, opacity: isSelected || isDragOver ? 1 : 0.35 }}
      />

      <div className="px-5 pt-6 pb-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          {/* Folder icon */}
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              if (!isRoot) onChangeEmoji();
            }}
            className={`
              relative h-14 w-14 rounded-2xl flex items-center justify-center text-2xl
              transition-all duration-150
              ${!isRoot ? 'hover:scale-110 active:scale-95' : ''}
            `}
            style={{ backgroundColor: color + '18' }}
            title={isRoot ? undefined : (labels?.changeIcon || 'Change icon')}
          >
            {folder.emoji ? (
              <span className="text-2xl leading-none">{folder.emoji}</span>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v8.25A2.25 2.25 0 004.5 16.5h15a2.25 2.25 0 002.25-2.25V9A2.25 2.25 0 0019.5 6.75h-6.19z"
                />
              </svg>
            )}
          </button>

          {/* Actions — visible on hover */}
          {!isRoot && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-1 group-hover:translate-y-0 mt-0.5">
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); onRename(); }}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title={labels?.rename || 'Rename'}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); onDelete(); }}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title={labels?.delete || 'Delete'}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {folder.name}
            </h3>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              {count} {count === 1 ? (counts?.fileSingular || 'file') : (counts?.filePlural || 'files')}
            </span>
            {folder.createdAt && (
              <span className="text-xs text-gray-300">
                {new Date(folder.createdAt).toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>

        {/* Drop hint */}
        {isDragOver && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
            {labels?.dropHere || 'Drop here'}
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderCard;