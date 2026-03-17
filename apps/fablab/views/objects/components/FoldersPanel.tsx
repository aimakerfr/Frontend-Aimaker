import React, { useState } from 'react';

export type Folder = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  count?: number;
  isRoot?: boolean;
};

type FoldersPanelProps = {
  folders: Folder[];
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onChangeEmoji: (folderId: string) => void;
  onDropOnFolder: (folderId: string, ev: React.DragEvent<HTMLDivElement>) => void;
  labels?: {
    title?: string;
    newFolder?: string;
    dragHint?: string;
    rename?: string;
    delete?: string;
    changeIcon?: string;
    fileSingular?: string;
    filePlural?: string;
    footerHint?: string;
  };
};

const FoldersPanel: React.FC<FoldersPanelProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onChangeEmoji,
  onDropOnFolder,
  labels,
}) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  return (
    <aside className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {labels?.title || 'Folders'}
          </h2>
          <button
            type="button"
            onClick={onCreateFolder}
            className="h-7 w-7 rounded-xl flex items-center justify-center bg-gray-950 text-white hover:bg-gray-700 transition-colors"
            title={labels?.newFolder || 'New folder'}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          {labels?.dragHint || 'Drag files onto a folder to move them'}
        </p>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {folders.map((folder) => {
          const isSelected = folder.id === selectedFolderId;
          const isDragOver = dragOverId === folder.id;

          return (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              onDragOver={(ev) => { ev.preventDefault(); setDragOverId(folder.id); }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(ev) => { setDragOverId(null); onDropOnFolder(folder.id, ev); }}
              className={`
                group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer
                transition-all duration-150
                ${isDragOver
                  ? 'bg-indigo-50 ring-1 ring-indigo-300 scale-[1.01]'
                  : isSelected
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }
              `}
            >
              {/* Left: emoji + info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (!folder.isRoot) onChangeEmoji(folder.id);
                  }}
                  className={`
                    h-8 w-8 rounded-xl flex items-center justify-center text-base flex-shrink-0
                    transition-transform duration-100
                    ${!folder.isRoot ? 'hover:scale-125 active:scale-90' : ''}
                  `}
                  style={{ backgroundColor: folder.color + '18' }}
                  title={folder.isRoot ? undefined : (labels?.changeIcon || 'Change icon')}
                >
                  {folder.emoji}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className={`text-sm truncate ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {folder.name}
                    </span>
                  </div>
                  {typeof folder.count === 'number' && (
                    <span className="text-[11px] text-gray-400 ml-3">
                      {folder.count} {folder.count === 1 ? (labels?.fileSingular || 'file') : (labels?.filePlural || 'files')}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: count badge + actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Count pill — shown when not hovered */}
                {typeof folder.count === 'number' && folder.count > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5 group-hover:opacity-0 transition-opacity min-w-[1.25rem] text-center">
                    {folder.count}
                  </span>
                )}

                {/* Actions — shown on hover */}
                {!folder.isRoot && (
                  <div className="absolute right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); onRenameFolder(folder.id); }}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                      title={labels?.rename || 'Rename'}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(ev) => { ev.stopPropagation(); onDeleteFolder(folder.id); }}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title={labels?.delete || 'Delete'}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <span>{labels?.footerHint || 'Create folders with icons to organize them'}</span>
        </div>
      </div>
    </aside>
  );
};

export default FoldersPanel;