import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createDeploymentDatabase, validateDatabaseName, type CreateDatabaseResponse } from '../services/database.service';
import { useLanguage } from '@apps/fablab/language/useLanguage';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  deploymentId: number;
  onCreated?: (result: CreateDatabaseResponse) => void;
};

const DatabaseCreatorModal: React.FC<Props> = ({ isOpen, onClose, deploymentId, onCreated }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setName('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const isValid = useMemo(() => validateDatabaseName(name.trim()), [name]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await createDeploymentDatabase({ deploymentId, name: name.trim() });
      onCreated?.(result);
      onClose();
    } catch (e: any) {
      const message = e?.message || 'Failed to create database';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [deploymentId, name, isSubmitting, isValid, onCreated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg p-5">
        <h2 className="text-lg font-semibold mb-2">{(t as any)?.databaseCreator?.title || 'Create Database'}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{(t as any)?.databaseCreator?.description || 'Enter a base name for the database. Allowed: lowercase letters, numbers, and underscores (max 63 chars).'}</p>

        <label htmlFor="db-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{(t as any)?.databaseCreator?.nameLabel || 'Database name'}</label>
        <input
          id="db-name"
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder={(t as any)?.databaseCreator?.namePlaceholder || 'e.g. myapp'}
          className={`w-full rounded-md border bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            name && !isValid ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-700'
          }`}
        />
        {name && !isValid && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{(t as any)?.databaseCreator?.invalidName || 'Invalid name format.'}</p>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t?.common?.cancel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSubmitting}
            aria-busy={isSubmitting}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              !isValid || isSubmitting
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (t?.common?.creating || 'Creating…') : (t?.common?.create || 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseCreatorModal;
