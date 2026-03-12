import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../../../language/useLanguage.ts';
import type { GetObjectsParams, ObjectItem } from '../../services/api_handler.ts';
import { fetchObjectsByAssemblyHints, ObjectType } from '../../services/api_handler.ts';

type GenericObjectSelectorProps = {
  type: ObjectType;
  product_type_for_assembly?: string;
  module_name_for_assembly?: string;
  onObjectSelectionCallback: (object: ObjectItem) => void;
  currentSelection?: {
    id: string | number;
    name?: string;
  };
};

export const GenericObjectSelector: React.FC<GenericObjectSelectorProps> = ({
  type,
  product_type_for_assembly,
  module_name_for_assembly,
  onObjectSelectionCallback,
  currentSelection,
}) => {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSelected, setCurrentSelected] = useState<typeof currentSelection | null>(null);
  const { t } = useLanguage();

  const queryParams: GetObjectsParams = useMemo(
    () => ({
      type,
      product_type_for_assembly,
      module_name_for_assembly,
    }),
    [type, product_type_for_assembly, module_name_for_assembly]
  );

  useEffect(() => {
    let isMounted = true;
    const loadObjects = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchObjectsByAssemblyHints(queryParams);
        if (!isMounted) return;
        setObjects(data);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message ?? 'Unable to load objects');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadObjects();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  useEffect(() => {
    setCurrentSelected(currentSelection ?? null);
  }, [currentSelection]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          {t?.genericObjectSelector?.title ?? 'Objects'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t?.genericObjectSelector?.subtitle ?? 'Showing objects filtered by type and assembly hints.'}
        </p>
        {currentSelected && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-100">
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-50">
              #{currentSelected.id}
            </span>
            <span className="truncate text-[12px] text-brand-800 dark:text-brand-50">
              {currentSelected.name ?? t?.genericObjectSelector?.current ?? 'Current selection'}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-gray-700 dark:text-gray-200">
          {t?.common?.loading ?? 'Loading...'}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-100">
          {error}
        </div>
      )}

      {!isLoading && !error && objects.length === 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {t?.genericObjectSelector?.empty ?? 'No objects match the provided filters.'}
        </div>
      )}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        {objects.map((object) => (
          <li
            key={object.id}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{object.name}</p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {object.type}
                </span>
                {object.product_type_for_assembly && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">
                    {object.product_type_for_assembly}
                  </span>
                )}
                {object.module_name_for_assembly && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-100">
                    {object.module_name_for_assembly}
                  </span>
                )}
                {object.title && (
                  <span className="truncate text-[11px] italic text-gray-500 dark:text-gray-300">
                    {object.title}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              onClick={() => {
                // Print the selected object id before executing callback
                // eslint-disable-next-line no-console
                console.log('SELECT:', object.id);
                setCurrentSelected({ id: object.id, name: object.name });
                onObjectSelectionCallback(object);
              }}
            >
              {t?.genericObjectSelector?.select ?? 'Select'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GenericObjectSelector;
