import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../../../language/useLanguage.ts';
import type { GetObjectsParams, ObjectItem } from '../../services/api_handler.ts';
import { fetchObjectsByType, ObjectType } from '../../services/api_handler.ts';
import { updateObject } from '@core/objects';

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
        let data: ObjectItem[] = [];
        console.log('[GenericObjectSelector] Loading objects', {
          type,
          product_type_for_assembly,
          module_name_for_assembly,
        });
        data = await fetchObjectsByType(type);
        console.log('[GenericObjectSelector] Loaded objects count:', data.length);
        if (!isMounted) return;
        setObjects(data);
      } catch (err: any) {
        console.error('[GenericObjectSelector] Failed loading objects', err);
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
          {t?.genericObjectSelector?.subtitleTypeOnly ?? 'Showing objects filtered by type only.'}
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
          {t?.genericObjectSelector?.emptyTypeOnly ?? 'No objects found for this type.'}
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
              <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-bold uppercase tracking-wider text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50">
                  {object.type}
                </span>
                
                {object.product_type_for_assembly && (
                  <span 
                    title={object.product_type_for_assembly}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-100 dark:border-blue-800/50 truncate max-w-[50%] transition-all hover:max-w-full cursor-help"
                  >
                    <span className="mr-1 opacity-60 text-[9px]">PROD:</span>
                    <span className="truncate">{object.product_type_for_assembly}</span>
                  </span>
                )}
                
                {object.module_name_for_assembly && (
                  <span 
                    title={object.module_name_for_assembly}
                    className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-100 dark:border-purple-800/50 truncate max-w-[50%] transition-all hover:max-w-full cursor-help"
                  >
                    <span className="mr-1 opacity-60 text-[9px]">MOD:</span>
                    <span className="truncate">{object.module_name_for_assembly}</span>
                  </span>
                )}
                
                {object.title && (
                  <span className="truncate italic text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="mx-1 opacity-30">â€¢</span>
                    {object.title}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              onClick={async () => {
                // Auto-tag the object with assembly hints if not already tagged
                if (product_type_for_assembly || module_name_for_assembly) {
                  const needsProductTag = product_type_for_assembly && object.product_type_for_assembly !== product_type_for_assembly;
                  const needsModuleTag = module_name_for_assembly && object.module_name_for_assembly !== module_name_for_assembly;
                  if (needsProductTag || needsModuleTag) {
                    try {
                      console.log('[GenericObjectSelector] Auto-tagging object', {
                        objectId: object.id,
                        product_type_for_assembly,
                        module_name_for_assembly,
                      });
                      await updateObject(object.id, {
                        ...(needsProductTag ? { product_type_for_assembly } : {}),
                        ...(needsModuleTag ? { module_name_for_assembly } : {}),
                      });
                      console.log('[GenericObjectSelector] Auto-tag success', { objectId: object.id });
                    } catch (e) {
                      // eslint-disable-next-line no-console
                      console.warn('[GenericObjectSelector] Failed to auto-tag object:', e);
                    }
                  }
                }
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
