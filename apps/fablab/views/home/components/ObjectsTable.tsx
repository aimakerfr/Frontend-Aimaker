import React from 'react';
import { ObjectItem } from '@core/objects';

type ObjectsTableProps = {
  items: ObjectItem[];
  isLoading: boolean;
  error: string | null;
  t: any;
  onView: (item: ObjectItem) => void;
};

const ObjectsTable: React.FC<ObjectsTableProps> = ({ items, isLoading, error, t, onView }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {t.library.tableHeaders.nameDescription}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {t.library.tableHeaders.action}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading && (
            <tr>
              <td colSpan={2} className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {(t as any).common?.loading ?? 'Loading...'}
              </td>
            </tr>
          )}

          {error && !isLoading && (
            <tr>
              <td colSpan={2} className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                {(t as any).common?.error ?? 'Error'}: {error}
              </td>
            </tr>
          )}

          {!isLoading && !error && items.length === 0 && (
            <tr>
              <td colSpan={2} className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {(t as any).home?.objects_library?.empty ?? 'No objects found'}
              </td>
            </tr>
          )}

          {!isLoading &&
            !error &&
            items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
                    onClick={() => onView(item)}
                    disabled={!item.url}
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