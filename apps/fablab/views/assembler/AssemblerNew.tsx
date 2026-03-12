import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../language/useLanguage';
import { createAssemblerMakerPath } from './services/makerPath.service';

type ProductType = 'notebook' | 'landing_page';

const VALID_TYPES: ProductType[] = ['notebook', 'landing_page'];

const AssemblerNew: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType = useMemo<ProductType | null>(() => {
    const q = (searchParams.get('type') || '').toLowerCase();
    return (VALID_TYPES as string[]).includes(q) ? (q as ProductType) : null;
  }, [searchParams]);

  const [selectedType, setSelectedType] = useState<ProductType | null>(initialType);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = Boolean(selectedType && title.trim().length > 0);

  const handleCreate = async () => {
    if (!canCreate || !selectedType || isSubmitting) return;
    // Keep console print as requested
    const dto = {
      productType: selectedType,
      tittle: title.trim(), // spelling per request
      description: description.trim(),
    };
    // eslint-disable-next-line no-console
    console.log('ASSEMBLER_NEW_DTO', dto);

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createAssemblerMakerPath({
        projectType: selectedType,
        title: title.trim(),
        description: description.trim(),
      });
      let url = res.editionUrl || '';
      if (!url) throw new Error('Missing editionUrl');
      
      // Handle both absolute URLs (http://...) and relative URLs (/dashboard/...)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Extract pathname from absolute URL for client-side navigation
        try {
          const urlObj = new URL(url);
          url = urlObj.pathname + urlObj.search;
        } catch {
          // If URL parsing fails, use as-is
        }
      } else if (!url.startsWith('/')) {
        // Ensure relative URLs start with /
        url = `/${url}`;
      }
      
      navigate(url);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create project';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tr = t?.assembler?.new ?? {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          {t?.notebook?.header?.back ?? 'Back'}
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tr.title ?? 'Selecciona un tipo de proyecto'}</h1>

        {/* Type selector */}
        <div className="space-y-4">
          {([
            {
              key: 'notebook',
              title: tr.notebookTitle ?? 'Notebook',
              desc: tr.notebookDesc ?? 'Chat inteligente conectado a tus fuentes de datos.',
              iconBg: 'from-purple-500 to-pink-500',
            },
            {
              key: 'landing_page',
              title: tr.landingTitle ?? 'Landing Page',
              desc: tr.landingDesc ?? 'Crea páginas de aterrizaje optimizadas con RAG.',
              iconBg: 'from-indigo-500 to-sky-500',
            },
          ] as Array<{ key: ProductType; title: string; desc: string; iconBg: string }>).map((opt) => {
            const isSelected = selectedType === opt.key;
            return (
              <button
                type="button"
                key={opt.key}
                onClick={() => setSelectedType(opt.key)}
                className={
                  'w-full flex items-center gap-4 rounded-2xl border px-5 py-5 text-left transition ' +
                  (isSelected
                    ? 'border-brand-400 bg-brand-50 dark:border-brand-900/60 dark:bg-brand-900/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800')
                }
              >
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${opt.iconBg} flex items-center justify-center text-white`}>💡</div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{opt.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{opt.desc}</div>
                </div>
                {isSelected && (
                  <div className="ml-auto text-xs font-semibold rounded-full bg-green-100 text-green-700 px-2 py-0.5 dark:bg-green-900/40 dark:text-green-200">
                    {tr.selected ?? 'Seleccionado'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Simple form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-100">
                {tr.errorCreating ?? 'Error creating project'}: {error}
              </div>
            )}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr.titlePlaceholder ?? 'Título del proyecto'}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder={tr.descriptionPlaceholder ?? 'Descripción del proyecto'}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate || isSubmitting}
                className={
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ' +
                  (canCreate && !isSubmitting
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300')
                }
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M4 12a8 8 0 0 1 8-8"/></svg>
                    {tr.creatingLabel ?? 'Creating...'}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    {tr.createCta ?? 'Crear Proyecto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblerNew;
