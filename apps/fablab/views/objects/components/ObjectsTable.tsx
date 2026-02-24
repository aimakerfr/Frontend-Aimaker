import React from 'react';
import { ObjectItem } from '@core/objects';
import ObjectTypeIcon from './ObjectTypeIcon';

type ObjectsTableProps = {
  items: ObjectItem[];
  isLoading: boolean;
  error: string | null;
  t: any;
  onView: (item: ObjectItem) => void;
  selection?: boolean;
  selectedIds?: Array<string | number>;
  onToggleSelect?: (item: ObjectItem, checked: boolean) => void;
};

const ObjectsTable: React.FC<ObjectsTableProps> = ({ items, isLoading, error, t, onView, selection, selectedIds = [], onToggleSelect }) => {
  const totalColumns = selection ? 4 : 3;

  // Compute available filters from current items
  const types = React.useMemo(() => {
    const set = new Set<string>();
    items?.forEach((it) => set.add(it?.type || 'unknown'));
    return Array.from(set.values());
  }, [items]);

  const [activeType, setActiveType] = React.useState<string>('ALL');

  const filteredItems = React.useMemo(() => {
    if (activeType === 'ALL') return items;
    return items.filter((it) => (it.type || 'unknown') === activeType);
  }, [items, activeType]);

  return (
    <div className="overflow-x-auto">
      {/* Filter chips — show only if there is at least one object */}
      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {/* All chip */}
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
            {(t as any)?.common?.all ?? 'All'}
            <span className="ml-1 text-[10px] opacity-80">{items.length}</span>
          </button>

          {types.map((tp) => {
            const count = items.filter((it) => (it.type || 'unknown') === tp).length;
            const label = tp === 'unknown' ? ((t as any)?.common?.unknown ?? 'Unknown') : tp;
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
                title={(t as any).home?.objects_library?.type_label ?? (t as any)?.library?.tableHeaders?.type}
              >
                {label}
                <span className="ml-1 text-[10px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      <table className="min-w-full bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {selection && (
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200"
              >

              </th>
            )}
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200"
            >
              {t.library.tableHeaders.nameDescription}
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200"
            >
              {(t as any).home?.objects_library?.type_label ?? t.library?.tableHeaders?.type}
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-200"
            >
              {t.library.tableHeaders.action}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {isLoading && (
            <tr>
              <td colSpan={totalColumns} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {(t as any).common?.loading ?? 'Loading...'}
              </td>
            </tr>
          )}

          {error && !isLoading && (
            <tr>
              <td colSpan={totalColumns} className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {(t as any).common?.error ?? 'Error'}: {error}
              </td>
            </tr>
          )}

          {!isLoading && !error && items.length === 0 && (
            <tr>
              <td colSpan={totalColumns} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {(t as any).home?.objects_library?.empty ?? 'No objects found'}
              </td>
            </tr>
          )}

          {!isLoading &&
            !error &&
            filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {selection && (
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => onToggleSelect?.(item, e.target.checked)}
                    />
                  </td>
                )}
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  <ObjectTypeIcon type={item.type} t={t} />
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-900"
                    onClick={() => onView(item)}
                    disabled={!item.url && !(item as any).data}
                  >
                    {(t as any).home?.objects_library?.voir ?? t.library.buttons.view}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ObjectsTable;