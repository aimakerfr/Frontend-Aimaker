import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../language/useLanguage';
import { getAllObjects, createObject, ObjectItem } from '@core/objects';
import AddObjectButton from './components/AddObjectButton';
import AddObjectModal from './components/AddObjectModal';
import ObjectsTable from './components/ObjectsTable';

const ObjectsLibrary: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<ObjectItem[]>([]);
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

  const handleCreate = async ({ title, type, file }: { title: string; type: string; file: File }) => {
    const created = await createObject({ title, type, file });
    // Optimistic append; alternatively refresh() to re-fetch from server
    setItems((prev) => [created, ...prev]);
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

        <ObjectsTable items={items} isLoading={isLoading} error={error} t={t} onView={handleView} />

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
