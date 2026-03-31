import React, { useMemo, useState, useCallback } from 'react';
// navigate is no longer used here but kept for potential future use if needed, removing it to fix lint.

import { useLanguage } from '../../language/useLanguage';
import { tokenStorage } from '@core/api/http.client';
import { createAssemblerMakerPath } from './services/makerPath.service';
import { DragDropCanvas, ModulesPalette, ALL_MODULES, MODULE_GROUPS, UNGROUPED_MODULES } from './components/drag-drop';
import type { CanvasModule, LayoutEntry } from './components/drag-drop';
import GenericObjectSelector from '@apps/fablab/modules/object-selector/View/Notebook/GenericObjectSelector';
import type { ObjectItem } from '@apps/fablab/modules/object-selector/services/api_handler';
import AssemblerModal from './components/AssemblerModal';

type ProductType = 'notebook' | 'landing_page';

function getApiBase(): string {
  const u = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return u ? u.replace(/\/$/, '') : '';
}

const AssemblerNew: React.FC = () => {
  const { t, language } = useLanguage();
  // const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasModules, setCanvasModules] = useState<CanvasModule[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Object selector modal state
  const [selectorModuleKey, setSelectorModuleKey] = useState<string | null>(null);

  const availableModules = useMemo(() => ALL_MODULES, []);

  const detectedType = useMemo<ProductType>(() => {
    const hasLanding = canvasModules.some((mod) => ['header', 'body', 'footer'].includes(mod.key));
    return hasLanding ? 'landing_page' : 'notebook';
  }, [canvasModules]);

  const landingRequired = useMemo(() => ['header', 'body', 'footer'], []);
  const landingModulesReady = useMemo(() => {
    if (detectedType !== 'landing_page') return true;
    return landingRequired.every((key) => {
      const mod = canvasModules.find((m) => m.key === key);
      return mod && (!mod.needsObject || (mod.objectId && mod.objectId > 0));
    });
  }, [canvasModules, detectedType, landingRequired]);

  const notebookHtmlReady = useMemo(() => {
    if (detectedType !== 'notebook') return true;
    const htmlMod = canvasModules.find((m) => m.key === 'html_input');
    return Boolean(htmlMod && htmlMod.objectId && htmlMod.objectId > 0);
  }, [canvasModules, detectedType]);

  // Validation: all needsObject modules on canvas must have objectId
  const objectModulesValid = canvasModules
    .filter((m) => m.needsObject)
    .every((m) => m.objectId && m.objectId > 0);

  const canCreate = Boolean(
    title.trim().length > 0 &&
    canvasModules.length > 0 &&
    objectModulesValid &&
    landingModulesReady &&
    notebookHtmlReady
  );

  const handleSelectObject = useCallback((moduleKey: string) => {
    setSelectorModuleKey(moduleKey);
  }, []);

  const handleObjectSelected = useCallback((obj: ObjectItem) => {
    setCanvasModules((prev) =>
      prev.map((m) =>
        m.key === selectorModuleKey
          ? { ...m, objectId: Number(obj.id), objectName: obj.name ?? `Object #${obj.id}` }
          : m
      )
    );
    setSelectorModuleKey(null);
  }, [selectorModuleKey]);

  const handleTextChange = useCallback((moduleKey: string, value: string) => {
    setCanvasModules((prev) =>
      prev.map((m) => (m.key === moduleKey ? { ...m, textValue: value } : m))
    );
  }, []);

  
  // Build layout data from canvas modules
  const buildLayoutData = useCallback((): LayoutEntry[] => {
    return canvasModules.map((m) => ({
      module_name: m.key,
      col: m.col,
      row: m.row,
      colSpan: m.colSpan,
      rowSpan: m.rowSpan,
    }));
  }, [canvasModules]);

  // Build the assembly DTO for the backend assemble endpoint
  const buildAssembleDto = useCallback((makerPathId: number) => {
    const layout = buildLayoutData();

    // Backend expects fixed indices per product type
    const FIXED_INDEX: Record<string, number> = detectedType === 'landing_page'
      ? { header: 2, body: 3, footer: 4 }
      : { html_input: 4 };
    let nextIndex = 10; // dynamic modules start at 10
    const inputModules = canvasModules
      .filter((m) => m.needsObject && m.objectId)
      .map((m) => ({
        index: FIXED_INDEX[m.key] ?? nextIndex++,
        module_name_for_assembly: m.key,
        object_id: m.objectId!,
      }));

    // Collect text variables
    const variables: Record<string, string> = {
      project_description: description.trim(),
      language: language ?? 'es',
      has_api_config_module: canvasModules.some((m) => m.key === 'api_configuration') ? '1' : '0',
    };
    canvasModules.forEach((m) => {
      if (m.textInput && m.textValue) {
        variables[m.key] = m.textValue;
      }
    });

    return {
      PRODUCT_TYPE: detectedType,
      MAKER_PATH_ID: makerPathId,
      INPUT_MODULES: inputModules,
      LAYOUT: layout,
      VARIABLES: variables,
    };
  }, [canvasModules, detectedType, buildLayoutData, description, language]);

  const callAssembleEndpoint = useCallback(async (makerPathId: number) => {
    const apiBase = getApiBase();
    const token = tokenStorage.get();
    const dto = buildAssembleDto(makerPathId);

    const endpoint = detectedType === 'notebook'
      ? `${apiBase}/api/v1/assembler/notebook/assemble`
      : `${apiBase}/api/v1/assembler/landing_page/assemble`;

    // eslint-disable-next-line no-console
    console.log('[AssemblerNew] Assemble DTO', dto);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(dto),
    });

    const ct = res.headers.get('Content-Type') || '';
    const isJson = ct.includes('application/json');
    const body = isJson ? await res.json() : null;

    if (!res.ok) {
      const msg = body?.error?.message || body?.message || `Assemble HTTP ${res.status}`;
      throw new Error(msg);
    }

    const data = body?.data ?? body ?? {};
    const downloadUrl: string | undefined = data.download_url || data.downloadUrl;
    const hasDownload = Boolean(downloadUrl);
    if (downloadUrl) {
      const fullDownload = downloadUrl.startsWith('http') ? downloadUrl : `${apiBase}${downloadUrl}`;
      const link = document.createElement('a');
      link.href = fullDownload;
      link.download = '';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    const htmlPath: string | undefined = data.html_path || data.htmlPath;
    if (htmlPath && !hasDownload) {
      const full = htmlPath.startsWith('http') ? htmlPath : `${apiBase}${htmlPath}`;
      setResultUrl(full);
      window.open(full, '_blank', 'noopener,noreferrer');
    }
  }, [detectedType, buildAssembleDto]);

  const handleCreateAndAssemble = async () => {
    if (!canCreate || isSubmitting) return;

    const layout = buildLayoutData();
    const canvasData = canvasModules.map((m) => ({
      key: m.key,
      col: m.col,
      row: m.row,
      colSpan: m.colSpan,
      rowSpan: m.rowSpan,
      objectId: m.objectId ?? null,
      textValue: m.textValue ?? null,
    }));

    // eslint-disable-next-line no-console
    console.log('ASSEMBLER_NEW_DTO', { productType: detectedType, title: title.trim(), layout, canvasModules: canvasData });

    setIsSubmitting(true);
    setError(null);
    setResultUrl(null);

    try {
      // Step 1: Create MakerPath
      const res = await createAssemblerMakerPath({
        projectType: detectedType,
        title: title.trim(),
        description: description.trim(),
        data: JSON.stringify({ layout, canvasModules: canvasData }),
      });

      const makerPathId = res.id;
      if (!makerPathId || makerPathId <= 0) {
        throw new Error('MakerPath created but no valid id returned');
      }

      // Step 2: Call assemble endpoint
      await callAssembleEndpoint(makerPathId);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create/assemble project';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine the selector module's type for GenericObjectSelector
  const selectorModule = selectorModuleKey
    ? canvasModules.find((m) => m.key === selectorModuleKey)
    : null;

  const tr = t?.assembler?.new ?? {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{tr.title ?? 'Nuevo proyecto'}</h1>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          {tr.detectedTypeLabel ?? 'Tipo detectado'}:{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {detectedType === 'landing_page'
              ? (tr.landingTitle ?? 'Landing Page')
              : (tr.notebookTitle ?? 'Notebook')}
          </span>
        </div>

        {/* Form: title + description */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-4">
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
              rows={3}
              placeholder={tr.descriptionPlaceholder ?? 'Descripción del proyecto'}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Drag & Drop Assembly Editor */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {tr.layoutEditorTitle ?? 'Diseño de módulos'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {tr.layoutEditorDesc ?? 'Arrastra los módulos desde la paleta al canvas. Selecciona un archivo HTML para cada módulo que lo requiera y completa los textos.'}
          </p>
          <div className="flex gap-5 items-stretch">
            {/* Palette sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="h-[min(70vh,640px)] overflow-y-auto pr-1">
                <ModulesPalette
                  modules={availableModules}
                  canvasModules={canvasModules}
                  groups={MODULE_GROUPS}
                  ungrouped={UNGROUPED_MODULES}
                />
              </div>
            </div>
            {/* Canvas area */}
            <div className="flex-1 min-w-0">
              <div className="h-[min(70vh,640px)]">
                <DragDropCanvas
                  modules={canvasModules}
                  onChange={setCanvasModules}
                  onSelectObject={handleSelectObject}
                  onTextChange={handleTextChange}
                />
              </div>
            </div>
          </div>

            {/* Validation warning for needsObject modules without object */}
            {canvasModules.some((m) => m.needsObject && !m.objectId) && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                Algunos módulos requieren un archivo HTML. Selecciona uno para cada módulo marcado antes de ensamblar.
              </div>
            )}

            {detectedType === 'landing_page' && !landingModulesReady && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                Para landing page debes incluir Header, Body y Footer.
              </div>
            )}

            {detectedType === 'notebook' && !notebookHtmlReady && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                Para notebook necesitas seleccionar un HTML Input.
              </div>
            )}

            {/* Object selector modal */}
          <AssemblerModal
            isOpen={selectorModuleKey !== null}
            title={`Seleccionar HTML — ${selectorModule?.label ?? selectorModuleKey ?? ''}`}
            onClose={() => setSelectorModuleKey(null)}
          >
            <GenericObjectSelector
              type={(selectorModule?.type as any) ?? 'HTML'}
              product_type_for_assembly={detectedType ?? undefined}
              module_name_for_assembly={selectorModuleKey ?? undefined}
              onObjectSelectionCallback={handleObjectSelected}
              currentSelection={
                selectorModule?.objectId
                  ? { id: selectorModule.objectId, name: selectorModule.objectName ?? undefined }
                  : undefined
              }
            />
          </AssemblerModal>
        </div>

        {/* Create & Assemble button + results */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-100">
                {error}
              </div>
            )}

            {resultUrl && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-100">
                <span className="font-semibold">Ensamblado exitosamente.</span>{' '}
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-900 dark:hover:text-green-50"
                >
                  Abrir resultado →
                </a>
              </div>
            )}

            <div className="flex items-center justify-between">
              {/* Canvas summary */}
              {canvasModules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {canvasModules.map((m) => {
                    const ok = m.needsObject ? Boolean(m.objectId) : true;
                    return (
                      <span
                        key={m.key}
                        className={
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ' +
                          (ok
                            ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-200')
                        }
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                        {m.label}
                        {m.needsObject && (m.objectId ? ' ✓' : ' ✗')}
                      </span>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateAndAssemble}
                disabled={!canCreate || isSubmitting}
                className={
                  'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 flex-shrink-0 ' +
                  (canCreate && !isSubmitting
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300')
                }
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M4 12a8 8 0 0 1 8-8"/></svg>
                    Ensamblando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Crear y Ensamblar
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
