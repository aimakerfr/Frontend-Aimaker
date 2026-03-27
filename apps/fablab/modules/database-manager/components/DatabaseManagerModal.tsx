import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { clearDatabaseSchema, executeSql, showTables } from '../services/database';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deploymentId: number;
  databaseName?: string | null;
};

const DatabaseManagerModal: React.FC<Props> = ({ isOpen, onClose, deploymentId, databaseName }) => {
  const { t } = useLanguage();
  const [sql, setSql] = useState('');
  const delRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaMessage, setSchemaMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Focus the close for accessibility by default
      setTimeout(() => closeRef.current?.focus(), 50);
    } else {
      setSql('');
    }
  }, [isOpen]);

  const handleExecute = useCallback(async () => {
    const sqlText = (sql || '').trim();
    if (!sqlText) {
      // eslint-disable-next-line no-alert
      alert((t as any)?.databaseManager?.missingSql || 'Please enter a SQL statement to execute.');
      return;
    }

    try {
      setIsExecuting(true);
      const resp = await executeSql({ deploymentId, sql: sqlText });
      // eslint-disable-next-line no-alert
      alert(
        (t as any)?.databaseManager?.executeResult ||
          `Execution attempted: ${resp.executed ? 'executed' : 'not executed'} (status: ${resp.status}).`
      );
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(
        (t as any)?.databaseManager?.executeError ||
          `Failed to execute SQL: ${e?.message || 'Unknown error'}`
      );
    } finally {
      setIsExecuting(false);
    }
  }, [deploymentId, sql, t]);

  const handleDeleteTables = useCallback(async () => {
    if (!databaseName) {
      // eslint-disable-next-line no-alert
      alert((t as any)?.databaseManager?.missingDbName || 'Database name is required.');
      return;
    }

    // Confirm destructive action
    // eslint-disable-next-line no-alert
    const ok = confirm(
      (t as any)?.databaseManager?.confirmDeleteAllTables ||
        `This will DROP and recreate the schema "${databaseName}". All data will be LOST. Continue?`
    );
    if (!ok) return;

    try {
      setIsDeleting(true);
      const result = await clearDatabaseSchema({ deploymentId, name: databaseName });
      // eslint-disable-next-line no-alert
      alert(
        (t as any)?.databaseManager?.deleteSuccess ||
          `Schema cleared successfully (${result?.driver || 'mysql'}:${result?.name || databaseName}).`
      );
      onClose();
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(
        (t as any)?.databaseManager?.deleteError ||
          `Failed to clear schema ${databaseName}: ${e?.message || 'Unknown error'}`
      );
    } finally {
      setIsDeleting(false);
    }
  }, [databaseName, deploymentId, onClose, t]);

  const openSchemaAndFetch = useCallback(async () => {
    setIsSchemaOpen(true);
    setSchemaMessage('');
    try {
      setIsLoadingSchema(true);
      const resp = await showTables({ deploymentId });
      if (resp.status === 'success' && resp.executed) {
        setSchemaMessage('SHOW TABLES executed successfully.');
      } else {
        setSchemaMessage('SHOW TABLES could not be executed (executed=false).');
      }
    } catch (e: any) {
      setSchemaMessage(`Failed to run SHOW TABLES: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsLoadingSchema(false);
    }
  }, [deploymentId]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {(t as any)?.databaseManager?.title || 'Manage Database'}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t?.common?.close || 'Close'}
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
          {(t as any)?.databaseManager?.subtitle || 'This is a prototype manager. Actions are non-functional.'}
        </p>

        {databaseName && (
            // eslint-disable-next-line i18next/no-literal-string
          <div className="mb-4 text-sm"><span className="font-medium">DB:</span> <span className="break-all">{databaseName}</span></div>
        )}
        {/* Schema/definition actions */}
        <div className="mb-4">
          <button
            type="button"
            onClick={openSchemaAndFetch}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {(t as any)?.databaseManager?.getTablesDefinition || 'Get tables definition'}
          </button>
        </div>
        {/* SQL executor */}
        <div>
          <h3 className="text-sm font-semibold mb-2">{(t as any)?.databaseManager?.sqlExec || 'SQL executor'}</h3>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={(t as any)?.databaseManager?.sqlPlaceholder}
            rows={6}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleExecute}
              disabled={isExecuting}
              className={`px-4 py-2 text-sm font-semibold rounded-md text-white ${
                isExecuting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isExecuting
                ? (t as any)?.common?.pleaseWait || 'Please wait...'
                : (t as any)?.databaseManager?.execute || 'Execute'}
            </button>
          </div>
        </div>
  
        {/* Red danger zone: delete tables */}
        <div className="mb-6 rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            {(t as any)?.databaseManager?.dangerZone || 'Danger zone'}
          </h3>
          <p className="text-xs text-red-700 dark:text-red-200 mb-3">
            {(t as any)?.databaseManager?.dangerDesc || 'Delete all tables in the database.'}
          </p>
          <button
              ref={delRef}
              type="button"
              onClick={handleDeleteTables}
              disabled={isDeleting}
              className={`px-3 py-2 text-sm font-semibold rounded-md text-white ${
                isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {isDeleting
              ? (t as any)?.common?.pleaseWait || 'Please wait...'
              : (t as any)?.databaseManager?.deleteTables || 'Delete Tables'}
          </button>
        </div>

        {/* Nested Modal: Tables Definition via SHOW TABLES */}
        {isSchemaOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsSchemaOpen(false)} />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-xl rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-md font-semibold">
                  {(t as any)?.databaseManager?.tablesDefinitionTitle || 'Tables (SHOW TABLES)'}
                </h3>
                <button
                  type="button"
                  aria-label={t?.common?.close || 'Close'}
                  onClick={() => setIsSchemaOpen(false)}
                  className="px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  ×
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                {(t as any)?.databaseManager?.tablesDefinitionSubtitle || 'Executed SHOW TABLES using the execute-sql endpoint. The backend does not return table names; only execution status is available.'}
              </div>
              <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 overflow-auto max-h-80">
                <pre className="text-xs whitespace-pre-wrap break-words">{isLoadingSchema ? 'Running SHOW TABLES...' : (schemaMessage || 'No status available.')}</pre>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={openSchemaAndFetch}
                  disabled={isLoadingSchema}
                  className={`px-3 py-1.5 text-sm rounded-md text-white ${isLoadingSchema ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800'}`}
                >
                  {isLoadingSchema ? ((t as any)?.common?.pleaseWait || 'Please wait...') : 'Run again'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSchemaOpen(false)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {t?.common?.close || 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManagerModal;
