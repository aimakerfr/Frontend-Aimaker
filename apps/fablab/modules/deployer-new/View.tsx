import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { createMakerPath, type CreateMakerPathRequest } from './services/makerPath.service';

const DeployerNew: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Autofocus title on mount for quicker entry
    titleInputRef.current?.focus();
  }, []);

  const canCreate = useMemo(() => title.trim().length > 0, [title]);

  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const payload: CreateMakerPathRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'custom'
      };
      const mp = await createMakerPath(payload);
      navigate(`/dashboard/deployer?id=${mp.id}`);
    } catch (e: unknown) {
      // Friendlier error mapping for common HTTP failures when possible
      let message = 'Failed to create Maker Path';
      const err = e as { status?: number; message?: string; data?: any } | Error | null;
      // Try to read status/message from a typical http client error shape
      const status = (err as any)?.status ?? (err as any)?.response?.status;
      const respMsg = (err as any)?.message ?? (err as any)?.response?.data?.message;
      if (status === 401 || status === 403) {
        message = 'You are not authorized. Please sign in and try again.';
      } else if (status === 422) {
        const details = (err as any)?.response?.data?.errors;
        message = details ? `Validation error: ${JSON.stringify(details)}` : 'Validation error while creating Maker Path';
      } else if (respMsg) {
        message = respMsg;
      }
      if (import.meta && import.meta.env && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('createMakerPath failed', e);
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [canCreate, title, description, navigate]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{t?.projectFlow?.newDeployment || 'New Deployment'}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        {t?.projectFlow?.createMakerPathFirst || 'Create a Maker Path to start deploying your application.'}
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (canCreate && !isSubmitting) {
            void handleCreate();
          }
        }}
      >
        <div>
          <label htmlFor="mp-title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t?.common?.title || 'Title'}
          </label>
          <input
            id="mp-title"
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            onBlur={() => setTouched(true)}
            placeholder={t?.common?.enterTitle || 'Enter a title'}
            aria-invalid={touched && !canCreate}
            aria-describedby={!canCreate && touched ? 'mp-title-error' : undefined}
            className={`w-full rounded-md border bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              touched && !canCreate
                ? 'border-red-400 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          />
          {touched && !canCreate && (
            <p id="mp-title-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {t?.validation?.titleRequired || 'Please enter a title.'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="mp-description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t?.common?.description || 'Description'}
          </label>
          <textarea
            id="mp-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t?.common?.enterDescription || 'Brief description (optional)'}
            rows={4}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 text-sm"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canCreate || isSubmitting}
            aria-busy={isSubmitting}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              !canCreate || isSubmitting
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (t?.common?.creating || 'Creating…') : (t?.common?.create || 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeployerNew;
