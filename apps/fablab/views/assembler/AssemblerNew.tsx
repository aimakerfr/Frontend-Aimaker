import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../../language/useLanguage';
import { tokenStorage } from '@core/api/http.client';
import { createAssemblerMakerPath } from './services/makerPath.service';
import { DragDropCanvas, ModulesPalette, ALL_MODULES, MODULE_GROUPS, UNGROUPED_MODULES } from './components/drag-drop';
import type { CanvasModule, LayoutEntry } from './components/drag-drop';
import GenericObjectSelector from '@apps/fablab/modules/object-selector/View/Notebook/GenericObjectSelector';
import type { ObjectItem } from '@apps/fablab/modules/object-selector/services/api_handler';
import AssemblerModal from './components/AssemblerModal';
import { useNavigate } from 'react-router-dom';

type ProductType = 'notebook' | 'landing_page';

function getApiBase(): string {
  const u = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return u ? u.replace(/\/$/, '') : '';
}

const AssemblerNew: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [protectedEnabled, setProtectedEnabled] = useState<boolean>(false);
  const [protectedUsername, setProtectedUsername] = useState<string>('');
  const [protectedPassword, setProtectedPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasModules, setCanvasModules] = useState<CanvasModule[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [station, setStation] = useState<'select' | 'builder'>('select');
  const [selectedModuleKeys, setSelectedModuleKeys] = useState<Set<string>>(new Set());

  // Object selector modal state
  const [selectorModuleKey, setSelectorModuleKey] = useState<string | null>(null);

  const tr = t?.assembler?.new ?? {};

  const availableModules = useMemo(() => ALL_MODULES, []);
  const presets = useMemo(() => (
    [
      {
        id: 'preset_notebook',
        label: tr.presets?.notebook?.label ?? 'Notebook IA',
        description: tr.presets?.notebook?.description ?? 'Configuración ideal para un entorno interactivo con documentos.',
        moduleIds: ['api_configuration', 'rag', 'chat'],
      },
      {
        id: 'preset_landing',
        label: tr.presets?.landing?.label ?? 'Page de destination',
        description: tr.presets?.landing?.description ?? 'Structure standard pour une page de présentation.',
        moduleIds: ['header', 'body', 'footer'],
      },
    ]
  ), [tr]);
  const selectedCount = selectedModuleKeys.size;
  const handlePresetClick = useCallback((moduleIds: string[]) => {
    setSelectedModuleKeys(new Set(moduleIds));
  }, []);
  const isPresetSelected = useCallback((moduleIds: string[]) => {
    if (selectedModuleKeys.size !== moduleIds.length) return false;
    return moduleIds.every((id) => selectedModuleKeys.has(id));
  }, [selectedModuleKeys]);
  const toggleSelectedModule = useCallback((moduleKey: string) => {
    setSelectedModuleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  }, []);
  const paletteModules = useMemo(() => {
    if (selectedModuleKeys.size === 0) return availableModules;
    return availableModules.filter((mod) => selectedModuleKeys.has(mod.key));
  }, [availableModules, selectedModuleKeys]);
  const landingSelectionReady = useMemo(() => (
    ['header', 'body', 'footer'].every((key) => selectedModuleKeys.has(key))
  ), [selectedModuleKeys]);
  const filteredGroups = useMemo(() => {
    if (selectedModuleKeys.size === 0) return MODULE_GROUPS;
    return MODULE_GROUPS
      .map((group) => ({
        ...group,
        modules: group.modules.filter((mod) => selectedModuleKeys.has(mod.key)),
      }))
      .filter((group) => group.modules.length > 0);
  }, [selectedModuleKeys]);
  const filteredUngrouped = useMemo(() => {
    if (selectedModuleKeys.size === 0) return UNGROUPED_MODULES;
    return UNGROUPED_MODULES.filter((mod) => selectedModuleKeys.has(mod.key));
  }, [selectedModuleKeys]);

  useEffect(() => {
    if (station !== 'builder') return;
    if (canvasModules.length > 0) return;
    if (!landingSelectionReady) return;

    const landingLayout = [
      { key: 'header', row: 0, rowSpan: 2 },
      { key: 'body', row: 2, rowSpan: 8 },
      { key: 'footer', row: 10, rowSpan: 2 },
    ];

    const nextModules = landingLayout
      .map((slot, index) => {
        const def = availableModules.find((mod) => mod.key === slot.key);
        if (!def) return null;
        return {
          ...def,
          index: index + 1,
          col: 0,
          row: slot.row,
          colSpan: 12,
          rowSpan: slot.rowSpan,
        };
      })
      .filter(Boolean) as CanvasModule[];

    if (nextModules.length === 3) {
      setCanvasModules(nextModules);
    }
  }, [station, canvasModules.length, landingSelectionReady, availableModules]);

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

  // Validation: all needsObject modules on canvas must have objectId
  const objectModulesValid = canvasModules
    .filter((m) => m.needsObject)
    .every((m) => m.objectId && m.objectId > 0);

  const protectedUsernameValid = !protectedEnabled || protectedUsername.trim().length > 0;
  const protectedPasswordValid = !protectedEnabled || protectedPassword.trim().length >= 8;
  const protectedValid = protectedUsernameValid && protectedPasswordValid;

  const canCreate = Boolean(
    title.trim().length > 0 &&
    canvasModules.length > 0 &&
    objectModulesValid &&
    landingModulesReady &&
    protectedValid
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
      project_title: title.trim(),
      project_description: description.trim(),
      language: language ?? 'es',
      has_api_config_module: canvasModules.some((m) => m.key === 'api_configuration') ? '1' : '0',
    };
    if (protectedEnabled) {
      variables.protected_enabled = '1';
      variables.protected_username = protectedUsername.trim();
      variables.protected_password = protectedPassword;
    } else {
      variables.protected_enabled = '0';
    }
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
  }, [
    canvasModules,
    detectedType,
    buildLayoutData,
    description,
    language,
    title,
    protectedEnabled,
    protectedUsername,
    protectedPassword,
  ]);

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

  const stationTitle = tr.stationTitle ?? 'Assembleur de Projet';
  const stationDescription = tr.stationDescription ?? 'Sélectionnez les modules que vous souhaitez inclure dans votre nouveau projet.';
  const renderPresetIcon = useCallback((presetId: string) => {
    switch (presetId) {
      case 'preset_notebook':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4v13.5" />
            <path d="M20 4v16" />
            <path d="M8 4h12" />
          </svg>
        );
      case 'preset_landing':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 9v12" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        );
    }
  }, []);
  const getModuleLabel = useCallback((key: string, fallback: string) => {
    switch (key) {
      case 'header':
        return tr.modules?.header ?? 'Landing Page: En-tête';
      case 'body':
        return tr.modules?.body ?? 'Landing Page: Corps';
      case 'footer':
        return tr.modules?.footer ?? 'Landing Page: Pied de page';
      case 'rag':
        return tr.modules?.rag ?? 'Module RAG';
      case 'api_configuration':
        return tr.modules?.api_configuration ?? 'Configurateur de Clé API';
      case 'chat':
        return tr.modules?.chat ?? 'Module de Chat';
      case 'html_input':
        return tr.modules?.html_input ?? 'Entrée HTML';
      case 'buscador':
        return tr.modules?.buscador ?? 'Chercheur';
      default:
        return fallback;
    }
  }, [tr]);

  const renderModuleIcon = useCallback((key: string) => {
    switch (key) {
      case 'header':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18" />
          </svg>
        );
      case 'body':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M8 4v16" />
          </svg>
        );
      case 'footer':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 17h18" />
          </svg>
        );
      case 'chat':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          </svg>
        );
      case 'rag':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
            <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
          </svg>
        );
      case 'api_configuration':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="14" r="3" />
            <path d="M10 14h10" />
            <path d="M14 10h6" />
          </svg>
        );
      case 'html_input':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 18l6-6-6-6" />
            <path d="M8 6l-6 6 6 6" />
          </svg>
        );
      case 'buscador':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
    }
  }, []);

  if (station === 'select') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          {t?.notebook?.header?.back ?? 'Retour'}

        </button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{stationTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stationDescription}</p>
        </div>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {tr.presetsTitle ?? 'Configurations prédéfinies'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {presets.map((preset) => {
              const selected = isPresetSelected(preset.moduleIds);
              return (
                <div
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.moduleIds)}
                  className={
                    'p-4 border rounded-xl cursor-pointer transition-all ' +
                    (selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50')
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                        {renderPresetIcon(preset.id)}
                      </div>
                      <h4 className={`ml-3 font-bold ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                        {preset.label}
                      </h4>
                    </div>
                    {selected && (
                        // eslint-disable-next-line i18next/no-literal-string
                      <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">✓</span>
                    )}
                  </div>
                  <p className={`text-xs ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {tr.customModulesTitle ?? 'Sélectionnez vos propres modules'}
            </h3>
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full border dark:border-gray-700">
              {tr.selectedCount?.replace('{count}', selectedCount.toString()).replace('{total}', availableModules.length.toString()) ?? `${selectedCount} / ${availableModules.length} sélectionnés`}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableModules.map((mod) => {
              const isSelected = selectedModuleKeys.has(mod.key);
              return (
                <div
                  key={mod.key}
                  onClick={() => toggleSelectedModule(mod.key)}
                  className={
                    'flex items-center p-4 border rounded-xl cursor-pointer transition-all ' +
                    (isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50')
                  }
                >
                  <div
                    className={
                      'flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ' +
                      (isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600')
                    }
                  >
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center mr-3">
                    {renderModuleIcon(mod.key)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>
                        {getModuleLabel(mod.key, mod.label)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => setStation('builder')}
            className={
              'px-6 py-2.5 font-medium rounded-lg transition-colors flex items-center ' +
              (selectedCount > 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed')
            }
          >
            {tr.continueBtn?.replace('{count}', selectedCount.toString()) ?? `Continuer avec ${selectedCount} modules →`}
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{tr.title ?? 'Nuevo proyecto'}</h1>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tr.titlePlaceholder ?? 'Titre du projet'}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={tr.descriptionPlaceholder ?? 'Description du projet'}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-600 dark:text-gray-400">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={protectedEnabled}
              onChange={(e) => setProtectedEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 bg-white dark:bg-gray-800"
            />
            <span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {tr.protectedDbLabel ?? 'Protéger la base de données avec des identifiants'}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {tr.protectedDbDesc ?? "Si vous activez cette option, le projet nécessitera une connexion avant d'afficher le contenu."}
              </span>
            </span>

          </label>

          {protectedEnabled && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={protectedUsername}
                onChange={(e) => setProtectedUsername(e.target.value)}
                placeholder={tr.usernamePlaceholder ?? "Nom d'utilisateur"}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="password"
                value={protectedPassword}
                onChange={(e) => setProtectedPassword(e.target.value)}
                placeholder={tr.passwordPlaceholder ?? 'Mot de passe (minimum 8 caractères)'}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {!protectedUsernameValid && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  {tr.usernameRequired ?? "L'utilisateur est obligatoire."}
                </div>
              )}
              {!protectedPasswordValid && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  {tr.passwordInvalid ?? 'Le mot de passe doit comporter au moins 8 caractères.'}
                </div>
              )}
            </div>

          )}
        </div>


      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tr.layoutEditorTitle ?? 'Conception des modules'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tr.layoutEditorDesc ?? 'Faites glisser les modules de la palette vers le canevas. Sélectionnez un fichier HTML pour chaque module qui en nécessite un et complétez les textes.'}
          </p>
        </div>

        <div className="space-y-4">
          <ModulesPalette
            modules={paletteModules}
            canvasModules={canvasModules}
            groups={filteredGroups}
            ungrouped={filteredUngrouped}
          />
        </div>

        <div className="h-[min(70vh,640px)]">
          <DragDropCanvas
            modules={canvasModules}
            onChange={setCanvasModules}
            onSelectObject={handleSelectObject}
            onTextChange={handleTextChange}
          />
        </div>
      </div>


        {/* Validation warning for needsObject modules without object */}
        {canvasModules.some((m) => m.needsObject && !m.objectId) && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            {tr.validation?.missingHtml ?? 'Certains modules nécessitent un fichier HTML. Sélectionnez-en un pour chaque module marqué avant l\'assemblage.'}
          </div>

        )}

        {detectedType === 'landing_page' && !landingModulesReady && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            {tr.validation?.landingRequired ?? 'Pour la page de destination, vous devez inclure En-tête, Corps et Pied de page.'}
          </div>
        )}


        {/* Object selector modal */}
        <AssemblerModal
          isOpen={selectorModuleKey !== null}
          title={tr.modal?.selectHtml?.replace('{name}', selectorModule?.label ?? selectorModuleKey ?? '') ?? `Sélectionner HTML — ${selectorModule?.label ?? selectorModuleKey ?? ''}`}
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

        {/* Create & Assemble button + results */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-100">
                {error}
              </div>
            )}

            {resultUrl && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-100">
                <span className="font-semibold">{tr.success ?? 'Assemblage réussi.'}</span>{' '}
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-900 dark:hover:text-green-50"
                >
                  {tr.openResult ?? 'Ouvrir le résultat →'}
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
                    {tr.assembling ?? 'Assemblage en cours...'}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    {tr.createCta ?? 'Créer et Assembler'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AssemblerNew;
