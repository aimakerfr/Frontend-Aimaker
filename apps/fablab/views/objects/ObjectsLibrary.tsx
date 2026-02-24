import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../language/useLanguage';
import { getAllObjects, createObject, ObjectItem } from '@core/objects';
import AddObjectButton from './components/AddObjectButton';
import AddObjectModal from './components/AddObjectModal';
import ObjectsTable from './components/ObjectsTable';
import { UI_TRANSLATIONS as OBJECTS_UI_T } from './constants/translations';

type ObjectsLibraryProps = {
  selection?: boolean;
  selectedObjects?: ObjectItem[];
  onSelectionChange?: (selected: ObjectItem[]) => void;
};

const ObjectsLibrary: React.FC<ObjectsLibraryProps> = ({ selection = false, selectedObjects = [], onSelectionChange }) => {
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

  const [items, setItems] = useState<ObjectItem[]>([]);
  const [selected, setSelected] = useState<ObjectItem[]>(selectedObjects ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for inline JSON viewer
  const [jsonModalItem, setJsonModalItem] = useState<ObjectItem | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllObjects();
        if (isActive) setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (isActive) setError(e?.message || 'Failed to load');
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

  const handleCreate = async ({ title, type, file }: { title: string; type: string; file: File }) => {
    const created = await createObject({ title, type, file });
    setItems((prev) => [created, ...prev]);
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

  // Opens URL in new tab OR shows inline JSON modal when there is no URL
  const handleView = (item: ObjectItem) => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if ((item as any).data) {
      setJsonModalItem(item);
    }
  };

  const getJsonContent = (item: ObjectItem): string => {
    const raw = (item as any).data;
    if (!raw) return '';

    // If data has a 'content' field, it's likely our new format for CODE/JSON
    if (raw.content) {
      return typeof raw.content === 'string' ? raw.content : JSON.stringify(raw.content, null, 2);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {(mergedT as any).home?.objects_library?.title ?? 'Objects Library'}
        </h1>
        <AddObjectButton
          label={(mergedT as any).home?.objects_library?.add_button ?? 'Add Object'}
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <ObjectsTable
        items={items}
        isLoading={isLoading}
        error={error}
        t={mergedT as any}
        onView={handleView}
        selection={selection}
        selectedIds={selection ? selected.map((item) => item.id) : []}
        onToggleSelect={handleToggleSelect}
      />

      <AddObjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        t={mergedT as any}
      />

      {/* ── Inline JSON Viewer Modal ── */}
      {jsonModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setJsonModalItem(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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

            {/* JSON Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                {getJsonContent(jsonModalItem)}
              </pre>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => downloadJson(jsonModalItem)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Descargar JSON
              </button>
              <button
                onClick={() => setJsonModalItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectsLibrary;
