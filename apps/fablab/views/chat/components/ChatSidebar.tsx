import { Loader2, Search, X } from 'lucide-react';
import type { ObjectFolder, ObjectItem } from '@core/objects';

type ChatSidebarProps = {
  t: any;
  sourceMode: 'context' | 'role' | 'prompt' | null;
  folders: ObjectFolder[];
  objects: ObjectItem[];
  selectedFolderId?: number;
  setSelectedFolderId: (id?: number) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedContextIds: Array<string | number>;
  loading: boolean;
  onClose: () => void;
  toggleContextSource: (source: ObjectItem) => void;
  applySingleSource: (mode: 'role' | 'prompt', source: ObjectItem) => void;
  getObjectType: (item: ObjectItem) => string | null;
};

const ChatSidebar = ({
  t,
  sourceMode,
  folders,
  objects,
  selectedFolderId,
  setSelectedFolderId,
  searchTerm,
  setSearchTerm,
  selectedContextIds,
  loading,
  onClose,
  toggleContextSource,
  applySingleSource,
  getObjectType,
}: ChatSidebarProps) => {
  if (!sourceMode) return null;

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h3 className="chat-sidebar-title">
          {sourceMode === 'context'
            ? (t?.fablabChat?.sources?.title || 'Select context sources')
            : sourceMode === 'role'
              ? (t?.fablabChat?.sources?.roleTitle || 'Select role source')
              : (t?.fablabChat?.sources?.promptTitle || 'Select prompt source')}
        </h3>

        <button type="button" onClick={onClose} className="chat-sidebar-close">
          <X size={13} />
        </button>
      </div>

      <div className="chat-sidebar-filters">
        <label className="chat-sidebar-label">
          <span className="chat-sidebar-label-text">{t?.fablabChat?.sources?.folder || 'Folder'}</span>
          <select
            value={selectedFolderId ?? ''}
            onChange={(event) => setSelectedFolderId(event.target.value ? Number(event.target.value) : undefined)}
            className="chat-sidebar-select"
          >
            <option value="">{t?.fablabChat?.sources?.allFolders || 'All folders'}</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </label>

        <label className="chat-sidebar-label">
          <span className="chat-sidebar-label-text">{t?.fablabChat?.sources?.search || 'Search'}</span>
          <div className="chat-sidebar-search-wrapper">
            <Search size={14} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t?.fablabChat?.sources?.searchPlaceholder || 'Search files...'}
              className="chat-sidebar-search-input"
            />
          </div>
        </label>
      </div>

      <div className="chat-sidebar-list">
        {loading && (
          <div className="chat-sidebar-loading">
            <Loader2 size={14} className="animate-spin" />
            <span>{t?.fablabChat?.sources?.loading || 'Loading...'}</span>
          </div>
        )}

        {!loading && objects.length === 0 && (
          <div className="chat-sidebar-empty">
            <span>{t?.fablabChat?.sources?.empty || 'No objects found'}</span>
          </div>
        )}

        {!loading && objects.length > 0 && (
          <ul className="chat-sidebar-items">
            {objects.map((source) => {
              const isSelected = selectedContextIds.includes(source.id);
              return (
                <li key={String(source.id)}>
                  <div className="chat-sidebar-item">
                    <div className="chat-sidebar-item-info">
                      <p className="chat-sidebar-item-name">{source.name}</p>
                      <p className="chat-sidebar-item-type">{getObjectType(source) || 'file'}</p>
                    </div>
                    <label className="chat-sidebar-item-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleContextSource(source)}
                        className="chat-sidebar-item-checkbox"
                      />
                    </label>
                  </div>
                  {!isSelected && sourceMode !== 'context' && (
                    <button
                      type="button"
                      onClick={() => applySingleSource(sourceMode as 'role' | 'prompt', source)}
                      className="chat-sidebar-item-button"
                    >
                      {t?.fablabChat?.sources?.use || 'Use'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
