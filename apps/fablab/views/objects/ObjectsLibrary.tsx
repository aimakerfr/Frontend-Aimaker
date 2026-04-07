import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../language/useLanguage';
import {
  getAllObjects,
  createObject,
  deleteObject,
  downloadObjectFile,
  ObjectItem,
  ObjectFolder,
  getObjectFolders,
  createObjectFolder,
  updateObjectFolder,
  deleteObjectFolder,
  setObjectFolder,
} from '@core/objects';
import AddObjectButton from './components/AddObjectButton';
import AddObjectModal from './components/AddObjectModal';
import FolderCard from './components/FolderCard';
import ObjectCard from './components/ObjectCard';
import FolderModal from './components/FolderModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { UI_TRANSLATIONS as OBJECTS_UI_T } from './constants/translations';

const DEFAULT_FOLDER_COLOR = '#2563eb';

const ObjectsLibrary: React.FC<{
  selection?: boolean;
  selectedObjects?: ObjectItem[];
  onSelectionChange?: (selected: ObjectItem[]) => void;
}> = ({ selection = false, selectedObjects = [], onSelectionChange }) => {
  const { t, language } = useLanguage() as any;

  const mergedT = useMemo(() => {
    const langCode = (typeof language === 'string' && language.substring(0, 2)) as 'en' | 'es' | 'fr';
    const local = (OBJECTS_UI_T as any)[langCode] || (OBJECTS_UI_T as any).en;
    return {
      ...t,
      home: {
        ...(t as any).home,
        objects_library: {
          ...((t as any).home?.objects_library || {}),
          ...(local?.home?.objects_library || {}),
        },
      },
    };
  }, [t, language]);

  const viewT = (mergedT as any).objectsLibraryView || {};
  const locale = typeof language === 'string' ? language.substring(0, 2) : 'en';

  const [items, setItems] = useState<ObjectItem[]>([]);
  const [folders, setFolders] = useState<ObjectFolder[]>([]);
  const [selected, setSelected] = useState<ObjectItem[]>(selectedObjects ?? []);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'edit'>('create');
  const [folderDraftId, setFolderDraftId] = useState<number | null>(null);
  const [folderDraftName, setFolderDraftName] = useState('');
  const [folderDraftEmoji, setFolderDraftEmoji] = useState<string | null>(null);
  const [folderDraftColor, setFolderDraftColor] = useState<string | null>(DEFAULT_FOLDER_COLOR);
  const [folderModalError, setFolderModalError] = useState<string | null>(null);
  const [jsonModalItem, setJsonModalItem] = useState<ObjectItem | null>(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'object'; item: ObjectItem }
    | { kind: 'folder'; folder: ObjectFolder }
    | null
  >(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [objectsRes, foldersRes] = await Promise.all([
          getAllObjects(),
          getObjectFolders(),
        ]);
        if (isActive) {
          setItems(Array.isArray(objectsRes) ? objectsRes : []);
          setFolders(Array.isArray(foldersRes) ? foldersRes : []);
        }
      } catch (e: any) {
        if (isActive) setError(e?.message || viewT?.errors?.load || 'Failed to load');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    if (selection) setSelected(selectedObjects ?? []);
  }, [selection, selectedObjects]);

  useEffect(() => {
    setActiveType('ALL');
  }, [selectedFolderId]);

  const handleCreate = async ({ title, type, file }: { title: string; type: string; file: File }) => {
    const created = await createObject({ title, type, file, folder_id: selectedFolderId });
    setItems((prev) => [created, ...prev]);
  };

  const handleDelete = (item: ObjectItem) => {
    setDeleteTarget({ kind: 'object', item });
  };

  const handleDownload = async (item: ObjectItem) => {
    setError(null);
    setActionId(item.id);
    try {
      await downloadObjectFile(item.id, item.name);
    } catch (e: any) {
      setError(e?.message || viewT?.errors?.download || 'Failed to download');
    } finally {
      setActionId(null);
    }
  };

  const handleToggleSelect = (item: ObjectItem, checked: boolean) => {
    if (!selection) return;
    setSelected((prev) => {
      const filtered = prev.filter((s) => s.id !== item.id);
      const next = checked ? [...filtered, item] : filtered;
      onSelectionChange?.(next);
      return next;
    });
  };

  const openCreateFolderModal = useCallback(() => {
    setFolderModalMode('create');
    setFolderDraftId(null);
    setFolderDraftName('');
    setFolderDraftEmoji(null);
    setFolderDraftColor(DEFAULT_FOLDER_COLOR);
    setFolderModalError(null);
    setFolderModalOpen(true);
  }, []);

  const openEditFolderModal = useCallback((folder: ObjectFolder) => {
    setFolderModalMode('edit');
    setFolderDraftId(folder.id);
    setFolderDraftName(folder.name || '');
    setFolderDraftEmoji(folder.emoji ?? null);
    setFolderDraftColor(folder.color ?? DEFAULT_FOLDER_COLOR);
    setFolderModalError(null);
    setFolderModalOpen(true);
  }, []);

  const handleDeleteFolder = useCallback((folder: ObjectFolder) => {
    setDeleteTarget({ kind: 'folder', folder });
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setError(null);
    setIsDeleteSubmitting(true);

    try {
      if (deleteTarget.kind === 'object') {
        const { item } = deleteTarget;
        setActionId(item.id);
        await deleteObject(item.id);
        setItems((prev) => prev.filter((it) => it.id !== item.id));
      } else {
        const { folder } = deleteTarget;
        await deleteObjectFolder(folder.id);
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
        setItems((prev) => prev.map((item) => (item.folderId === folder.id ? { ...item, folderId: null } : item)));
        if (selectedFolderId === folder.id) {
          setSelectedFolderId(null);
        }
      }
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e?.message || viewT?.errors?.delete || 'Failed to delete');
    } finally {
      setIsDeleteSubmitting(false);
      setActionId(null);
    }
  };

  const handleFolderModalSubmit = useCallback(async () => {
    const name = folderDraftName.trim();
    if (!name) {
      setFolderModalError(viewT?.folderModal?.required || 'Required');
      return;
    }

    if (folderModalMode === 'create') {
      const created = await createObjectFolder({
        name,
        emoji: folderDraftEmoji,
        color: folderDraftColor || DEFAULT_FOLDER_COLOR,
        sort_order: folders.length,
      });
      setFolders((prev) => [...prev, created]);
    } else if (folderModalMode === 'edit' && folderDraftId) {
      const updated = await updateObjectFolder(folderDraftId, {
        name,
        emoji: folderDraftEmoji,
        color: folderDraftColor || DEFAULT_FOLDER_COLOR,
      });
      setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }

    setFolderModalOpen(false);
  }, [folderDraftName, folderDraftEmoji, folderDraftColor, folderDraftId, folderModalMode, folders.length, viewT]);

  const handleDropOnFolder = useCallback(async (folderId: number, ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const objectId = ev.dataTransfer.getData('text/object-id');
    if (!objectId) return;

    const updated = await setObjectFolder(objectId, folderId === 0 ? null : folderId);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const folderItems = useMemo(() => {
    return items.filter((item) => {
      return selectedFolderId === null ? !item.folderId : item.folderId === selectedFolderId;
    });
  }, [items, selectedFolderId]);

  const searchedItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term === '') return folderItems;
    return folderItems.filter((item) => (item.name || '').toLowerCase().includes(term));
  }, [folderItems, searchTerm]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    folderItems.forEach((item) => set.add((item.type || 'unknown').toString()));
    return Array.from(set.values());
  }, [folderItems]);

  useEffect(() => {
    if (activeType !== 'ALL' && !typeOptions.includes(activeType)) {
      setActiveType('ALL');
    }
  }, [activeType, typeOptions]);

  const visibleItems = useMemo(() => {
    if (activeType === 'ALL') return searchedItems;
    return searchedItems.filter((item) => (item.type || 'unknown') === activeType);
  }, [searchedItems, activeType]);

  const folderCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    items.forEach((item) => {
      if (item.folderId) {
        counts[item.folderId] = (counts[item.folderId] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const currentFolder = useMemo(() => {
    if (selectedFolderId === null) return null;
    return folders.find((folder) => folder.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  const rootFolder = useMemo<ObjectFolder>(() => ({
    id: 0,
    name: viewT?.breadcrumb?.rootLabel || 'Root',
    emoji: null,
    color: '#94a3b8',
  }), [viewT?.breadcrumb?.rootLabel]);

  const handleView = (item: ObjectItem) => {
    if ((item.type || '').toUpperCase() === 'PRODUCT') {
      navigate(`/dashboard/objects-library/${item.id}`, {
        state: { name: item.name || item.title },
      });
      return;
    }

    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if ((item as any).data) {
      setJsonModalItem(item);
    }
  };

  const getJsonContent = (item: ObjectItem): string => {
    const raw = (item as any).data;
    if (!raw) return '';
    if ((raw as any).content) {
      return typeof (raw as any).content === 'string' ? (raw as any).content : JSON.stringify((raw as any).content, null, 2);
    }
    try {
      return typeof raw === 'string'
        ? JSON.stringify(JSON.parse(raw), null, 2)
        : JSON.stringify(raw, null, 2);
    } catch {
      return typeof raw === 'string' ? raw : JSON.stringify(raw);
    }
  };

  const downloadJson = (item: ObjectItem) => {
    const content = getJsonContent(item);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name ?? 'object'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragStart = (item: ObjectItem, ev: React.DragEvent<HTMLDivElement>) => {
    ev.dataTransfer.setData('text/object-id', String(item.id));
    ev.dataTransfer.effectAllowed = 'move';
    setIsDraggingObject(true);
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const stopDragging = () => setIsDraggingObject(false);
    window.addEventListener('dragend', stopDragging);
    window.addEventListener('drop', stopDragging);
    return () => {
      window.removeEventListener('dragend', stopDragging);
      window.removeEventListener('drop', stopDragging);
    };
  }, []);

  const handleContainerDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggingObject) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const threshold = 80;
    const speed = 20;
    if (ev.clientY < rect.top + threshold) {
      container.scrollTop -= speed;
    } else if (ev.clientY > rect.bottom - threshold) {
      container.scrollTop += speed;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow h-full flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {(mergedT as any).home?.objects_library?.title ?? 'Objects Library'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {viewT?.description || 'Organize your resources with visual folders and drag files.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateFolderModal}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {viewT?.newFolder || 'New folder'}
            </button>
            <AddObjectButton
              label={(mergedT as any).home?.objects_library?.add_button ?? 'Add Object'}
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {currentFolder
              ? `${viewT?.breadcrumb?.rootLabel || 'Root'} ${viewT?.breadcrumb?.separator || '/'} ${currentFolder.name}`
              : (viewT?.breadcrumb?.allResources || 'All Resources')
            }
          </div>
          {currentFolder && (
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              {viewT?.breadcrumb?.backToRoot || 'Back to root'}
            </button>
          )}
          <div className="ml-auto w-full sm:w-64">
            <input
              value={searchTerm}
              onChange={(ev) => setSearchTerm(ev.target.value)}
              placeholder={viewT?.searchPlaceholder || 'Search resources...'}
              className="w-full rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>

        {folderItems.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveType('ALL')}
              className={
                `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ` +
                (activeType === 'ALL'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600')
              }
            >
              {(mergedT as any)?.common?.all ?? 'All'}
              <span className="ml-1 text-[10px] opacity-80">{folderItems.length}</span>
            </button>

            {typeOptions.map((tp) => {
              const count = folderItems.filter((it) => (it.type || 'unknown') === tp).length;
              const label = tp === 'unknown'
                ? ((mergedT as any)?.common?.unknown ?? 'Unknown')
                : tp;
              return (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setActiveType(tp)}
                  className={
                    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ` +
                    (activeType === tp
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600')
                  }
                  title={(mergedT as any).home?.objects_library?.type_label ?? (mergedT as any)?.library?.tableHeaders?.type}
                >
                  {label}
                  <span className="ml-1 text-[10px] opacity-80">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onDragOver={handleContainerDragOver}
        className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6"
      >
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{viewT?.sections?.folders || 'Folders'}</h2>
            <span className="text-xs text-gray-400">
              {folders.length} {folders.length === 1 ? (viewT?.counts?.folderSingular || 'folder') : (viewT?.counts?.folderPlural || 'folders')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FolderCard
              folder={rootFolder}
              count={items.filter((item) => !item.folderId).length}
              isSelected={selectedFolderId === null}
              isRoot
              labels={viewT?.folderCard}
              counts={viewT?.counts}
              locale={locale}
              onSelect={() => setSelectedFolderId(null)}
              onRename={() => undefined}
              onDelete={() => undefined}
              onChangeEmoji={() => undefined}
              onDrop={(ev) => handleDropOnFolder(0, ev)}
            />
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                count={folderCounts[folder.id] || 0}
                isSelected={folder.id === selectedFolderId}
                labels={viewT?.folderCard}
                counts={viewT?.counts}
                locale={locale}
                onSelect={() => setSelectedFolderId(folder.id)}
                onRename={() => openEditFolderModal(folder)}
                onDelete={() => handleDeleteFolder(folder)}
                onChangeEmoji={() => openEditFolderModal(folder)}
                onDrop={(ev) => handleDropOnFolder(folder.id, ev)}
              />
            ))}
            {folders.length === 0 && !isLoading && (
              <div className="text-sm text-gray-500">{viewT?.empty?.folders || 'No folders yet. Create your first one.'}</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{viewT?.sections?.files || 'Files'}</h2>
            <span className="text-xs text-gray-400">
              {visibleItems.length} {visibleItems.length === 1 ? (viewT?.counts?.fileSingular || 'file') : (viewT?.counts?.filePlural || 'files')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading && (
              <div className="text-sm text-gray-500">{viewT?.loading || 'Loading...'}</div>
            )}
            {!isLoading && visibleItems.length === 0 && (
              <div className="text-sm text-gray-500">{viewT?.empty?.files || 'No files found.'}</div>
            )}
            {!isLoading && visibleItems.map((item) => (
              <ObjectCard
                key={item.id}
                item={item}
                t={mergedT as any}
                labels={viewT?.objectCard}
                locale={locale}
                onView={() => handleView(item)}
                onDownload={() => handleDownload(item)}
                onDelete={() => handleDelete(item)}
                isBusy={actionId === item.id}
                onDragStart={(ev) => handleDragStart(item, ev)}
                selection={selection}
                isSelected={selected.some((selectedItem) => selectedItem.id === item.id)}
                onToggleSelect={(checked) => handleToggleSelect(item, checked)}
              />
            ))}
          </div>
        </section>
      </div>

      <AddObjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        t={mergedT as any}
      />

      <FolderModal
        isOpen={folderModalOpen}
        mode={folderModalMode}
        name={folderDraftName}
        emoji={folderDraftEmoji}
        color={folderDraftColor}
        onChangeName={setFolderDraftName}
        onSelectEmoji={setFolderDraftEmoji}
        onSelectColor={setFolderDraftColor}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleFolderModalSubmit}
        labels={viewT?.folderModal}
        error={folderModalError}
      />

      {jsonModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setJsonModalItem(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{jsonModalItem.name}</h2>
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {jsonModalItem.type ?? 'JSON'}
                </span>
              </div>
              <button
                onClick={() => setJsonModalItem(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                {getJsonContent(jsonModalItem)}
              </pre>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => downloadJson(jsonModalItem)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {viewT?.jsonModal?.download || 'Download JSON'}
              </button>
              <button
                onClick={() => setJsonModalItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                {viewT?.jsonModal?.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title={
          deleteTarget?.kind === 'folder'
            ? (viewT?.prompts?.deleteFolderTitle || 'Delete folder?')
            : (viewT?.prompts?.deleteObjectTitle || 'Delete object?')
        }
        message={
          deleteTarget?.kind === 'folder'
            ? (viewT?.prompts?.deleteFolder || 'Delete folder? Items will return to root.')
            : (viewT?.prompts?.deleteObject || 'Delete object?')
        }
        confirmLabel={(mergedT as any)?.common?.delete || 'Delete'}
        cancelLabel={(mergedT as any)?.common?.cancel || 'Cancel'}
        isLoading={isDeleteSubmitting}
        onClose={() => {
          if (isDeleteSubmitting) return;
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ObjectsLibrary;
