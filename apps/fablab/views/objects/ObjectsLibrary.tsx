import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../language/useLanguage';
import { getAllObjects, createObject, ObjectItem } from '@core/objects';
import AddObjectButton from './components/AddObjectButton';
import AddObjectModal from './components/AddObjectModal';
import ObjectsTable from './components/ObjectsTable';

type ObjectsLibraryProps = {
  selection?: boolean;
  selectedObjects?: ObjectItem[];
  onSelectionChange?: (selected: ObjectItem[]) => void;
};

const ObjectsLibrary: React.FC<ObjectsLibraryProps> = ({ selection = false, selectedObjects = [], onSelectionChange }) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<ObjectItem[]>([]);
  const [selected, setSelected] = useState<ObjectItem[]>(selectedObjects ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllObjects();
        if (isActive) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        if (isActive) {
          setError(e?.message || 'Failed to load');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (selection) {
      setSelected(selectedObjects ?? []);
    }
  }, [selection, selectedObjects]);

  const handleCreate = async ({ title, type, file }: { title: string; type: string; file: File }) => {
    const created = await createObject({ title, type, file });
    // Optimistic append; alternatively refresh() to re-fetch from server
    setItems((prev) => [created, ...prev]);
  };

  const handleToggleSelect = (item: ObjectItem, checked: boolean) => {
    if (!selection) return;

    setSelected((prev) => {
      const filtered = prev.filter((selectedItem) => selectedItem.id !== item.id);
      const next = checked ? [...filtered, item] : filtered;
      onSelectionChange?.(next);
      return next;
    });
  };

  const handleView = (item: ObjectItem) => {
    if (!item.url) return;
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">{(t as any).home?.objects_library?.title ?? 'Objects Library'}</h1>
          <AddObjectButton
            label={(t as any).home?.objects_library?.add_button ?? 'Add Object'}
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        <ObjectsTable
          items={items}
          isLoading={isLoading}
          error={error}
          t={t}
          onView={handleView}
          selection={selection}
          selectedIds={selection ? selected.map((item) => item.id) : []}
          onToggleSelect={handleToggleSelect}
        />

        <AddObjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
          t={t as any}
        />
      </div>
  );
};

export default ObjectsLibrary;
