import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../../language/useLanguage';
import { tokenStorage } from '@core/api/http.client';
import { getAllObjects, type ObjectItem as LibraryObjectItem } from '@core/objects';
import { createAssemblerMakerPath } from './services/makerPath.service';
import { DragDropCanvas, ModulesPalette, ALL_MODULES, MODULE_GROUPS, UNGROUPED_MODULES, API_KEY_CONFIGS } from './components/drag-drop';
import type { CanvasModule, LayoutEntry } from './components/drag-drop';
import GenericObjectSelector from '@apps/fablab/modules/object-selector/View/Notebook/GenericObjectSelector';
import type { ObjectItem as SelectorObjectItem } from '@apps/fablab/modules/object-selector/services/api_handler';
import AssemblerModal from './components/AssemblerModal';
import { useNavigate } from 'react-router-dom';

type ProductType = 'notebook' | 'landing_page';

function getApiBase(): string {
  const u = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return u ? u.replace(/\/$/, '') : '';
}

const AssemblerNew: React.FC = () => {
  const { t, language } = useLanguage();
  const tr = t?.assembler?.new ?? {};
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [protectedEnabled, setProtectedEnabled] = useState<boolean>(false);
  const [protectedUsername, setProtectedUsername] = useState<string>('');
  const [protectedPassword, setProtectedPassword] = useState<string>('');
  const [apiConfigEnabled, setApiConfigEnabled] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [apiConfigModalOpen, setApiConfigModalOpen] = useState<boolean>(false);
  const [apiConfigStep, setApiConfigStep] = useState<'form' | 'confirm' | 'loading' | 'success'>('form');
  const [apiKeysDraft, setApiKeysDraft] = useState<Record<string, string>>({});
  const [apiKeysDraftErrors, setApiKeysDraftErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasModules, setCanvasModules] = useState<CanvasModule[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [station, setStation] = useState<'select' | 'builder'>('select');
  const [selectedModuleKeys, setSelectedModuleKeys] = useState<Set<string>>(new Set());

  // Object selector modal state
  const [selectorModuleKey, setSelectorModuleKey] = useState<string | null>(null);

  // RAG injection modal state
  const [ragModalOpen, setRagModalOpen] = useState<boolean>(false);
  const [ragAvailableObjects, setRagAvailableObjects] = useState<LibraryObjectItem[]>([]);
  const [ragSelectedObjects, setRagSelectedObjects] = useState<LibraryObjectItem[]>([]);
  const [ragSearch, setRagSearch] = useState<string>('');
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [ragError, setRagError] = useState<string | null>(null);

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

  // Detect which API keys are needed based on canvas modules
  const requiredApiKeyTypes = useMemo(() => {
    const types = new Set<string>();
    canvasModules.forEach((m) => {
      const def = ALL_MODULES.find((mod) => mod.key === m.key);
      if (def?.apiKeyType) {
        types.add(def.apiKeyType);
      }
    });
    return Array.from(types);
  }, [canvasModules]);

  // Validate all required API keys are filled
  const apiKeysValid = useMemo(() => {
    if (!apiConfigEnabled) return true;
    return requiredApiKeyTypes.every((type) => apiKeys[type]?.trim().length > 0);
  }, [apiConfigEnabled, requiredApiKeyTypes, apiKeys]);

  const canCreate = Boolean(
    title.trim().length > 0 &&
    canvasModules.length > 0 &&
    objectModulesValid &&
    landingModulesReady &&
    protectedValid &&
    apiKeysValid
  );

  const openApiConfigModal = useCallback(() => {
    // Initialize draft with current values for all required types
    const initialDraft: Record<string, string> = {};
    requiredApiKeyTypes.forEach((type) => {
      initialDraft[type] = apiKeys[type] || '';
    });
    setApiKeysDraft(initialDraft);
    setApiKeysDraftErrors({});
    setApiConfigStep('form');
    setApiConfigModalOpen(true);
  }, [apiKeys, requiredApiKeyTypes]);

  const cancelApiConfig = useCallback(() => {
    setApiConfigEnabled(false);
    setApiKeys({});
    setApiKeysDraft({});
    setApiKeysDraftErrors({});
    setApiConfigModalOpen(false);
  }, []);

  const handleApiConfigToggle = useCallback((checked: boolean) => {
    setApiConfigEnabled(checked);
    if (checked) {
      openApiConfigModal();
    } else {
      setApiKeys({});
    }
  }, [openApiConfigModal]);

  const handleApiKeyDraftChange = useCallback((type: string, value: string) => {
    setApiKeysDraft((prev) => ({ ...prev, [type]: value }));
    // Clear error for this type when user types
    setApiKeysDraftErrors((prev) => ({ ...prev, [type]: '' }));
  }, []);

  const handleApiConfigContinue = useCallback(() => {
    // Validate all required keys are filled
    const errors: Record<string, string> = {};
    requiredApiKeyTypes.forEach((type) => {
      if (!apiKeysDraft[type]?.trim()) {
        errors[type] = `Debes ingresar una API key válida para ${API_KEY_CONFIGS[type]?.label || type}.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setApiKeysDraftErrors(errors);
      return;
    }

    setApiKeysDraftErrors({});
    setApiConfigStep('confirm');
  }, [apiKeysDraft, requiredApiKeyTypes]);

  const handleApiConfigConfirm = useCallback(() => {
    // Validate again before saving
    const errors: Record<string, string> = {};
    requiredApiKeyTypes.forEach((type) => {
      if (!apiKeysDraft[type]?.trim()) {
        errors[type] = `Debes ingresar una API key válida para ${API_KEY_CONFIGS[type]?.label || type}.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setApiKeysDraftErrors(errors);
      setApiConfigStep('form');
      return;
    }

    setApiConfigStep('loading');
    setTimeout(() => {
      // Save all draft values to actual keys
      setApiKeys({ ...apiKeysDraft });
      setApiConfigStep('success');
    }, 2000);
  }, [apiKeysDraft, requiredApiKeyTypes]);

  const handleApiConfigDone = useCallback(() => {
    setApiConfigModalOpen(false);
  }, []);

  const handleSelectObject = useCallback((moduleKey: string) => {
    setSelectorModuleKey(moduleKey);
  }, []);

  const handleObjectSelected = useCallback((obj: SelectorObjectItem) => {
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

  const loadRagObjects = useCallback(async () => {
    setRagLoading(true);
    setRagError(null);
    try {
      const objects = await getAllObjects();
      setRagAvailableObjects(Array.isArray(objects) ? objects : []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudieron cargar los objetos.';
      setRagError(message);
    } finally {
      setRagLoading(false);
    }
  }, []);

  const openRagModal = useCallback(() => {
    setRagModalOpen(true);
    if (ragAvailableObjects.length === 0) {
      void loadRagObjects();
    }
  }, [ragAvailableObjects.length, loadRagObjects]);

  const ragSelectedIds = useMemo(() => (
    new Set(ragSelectedObjects.map((obj) => String(obj.id)))
  ), [ragSelectedObjects]);

  const ragFilteredObjects = useMemo(() => {
    const term = ragSearch.trim().toLowerCase();
    if (!term) return ragAvailableObjects;
    return ragAvailableObjects.filter((obj) => {
      const name = (obj.name ?? obj.title ?? '').toString().toLowerCase();
      return name.includes(term) || String(obj.id).includes(term);
    });
  }, [ragAvailableObjects, ragSearch]);

  const handleRagToggle = useCallback((obj: LibraryObjectItem, checked: boolean) => {
    setRagSelectedObjects((prev) => {
      const exists = prev.some((item) => String(item.id) === String(obj.id));
      if (checked && !exists) {
        return [...prev, obj];
      }
      if (!checked && exists) {
        return prev.filter((item) => String(item.id) !== String(obj.id));
      }
      return prev;
    });
  }, []);

  const handleRagRemove = useCallback((objectId: string | number) => {
    setRagSelectedObjects((prev) => prev.filter((item) => String(item.id) !== String(objectId)));
  }, []);

  const handleRagDrop = useCallback((objectId: number) => {
    setRagSelectedObjects((prev) => {
      if (prev.some((item) => Number(item.id) === objectId)) {
        return prev;
      }
      const match = ragAvailableObjects.find((item) => Number(item.id) === objectId);
      if (match) {
        return [...prev, match];
      }
      return [...prev, { id: objectId, name: `Objeto #${objectId}` } as LibraryObjectItem];
    });
    if (ragAvailableObjects.length === 0) {
      void loadRagObjects();
    }
  }, [ragAvailableObjects, loadRagObjects]);

  
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
    if (apiConfigEnabled) {
      // Send each API key separately (e.g., api_key_gemini, api_key_perplexity)
      Object.entries(apiKeys).forEach(([type, value]) => {
        if (value.trim()) {
          variables[`api_key_${type}`] = value.trim();
        }
      });
    }
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

    const ragSources = ragSelectedObjects
      .map((obj) => Number(obj.id))
      .filter((value) => Number.isFinite(value) && value > 0);

    return {
      PRODUCT_TYPE: detectedType,
      MAKER_PATH_ID: makerPathId,
      INPUT_MODULES: inputModules,
      LAYOUT: layout,
      VARIABLES: variables,
      ...(ragSources.length > 0 ? { RAG_SOURCES: ragSources } : {}),
    };
  }, [
    canvasModules,
    detectedType,
    buildLayoutData,
    description,
    language,
    title,
    apiConfigEnabled,
    apiKeys,
    protectedEnabled,
    protectedUsername,
    protectedPassword,
    ragSelectedObjects,
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
  const selectorModuleLabel = selectorModule?.label ?? selectorModuleKey ?? '';
  const selectorModalTitle = tr.modal?.selectHtml?.replace('{name}', selectorModuleLabel)
    ?? `Sélectionner HTML — ${selectorModuleLabel}`;
  const selectorCurrentSelection = typeof selectorModule?.objectId === 'number'
    ? { id: selectorModule.objectId, name: selectorModule.objectName ?? undefined }
    : undefined;

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
      case 'perplexity':
        return tr.modules?.perplexity ?? 'Perplexity';
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
      case 'perplexity':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
            <path d="M11 7v4" />
            <path d="M11 15h0" />
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
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          {t?.notebook?.header?.back ?? 'Retour'}

        </button>

        <div>
          <h1>{stationTitle}</h1>
          <p>{stationDescription}</p>
        </div>

        <section>
          <h3>
            {tr.presetsTitle ?? 'Configurations prédéfinies'}
          </h3>

          <div>
            {presets.map((preset) => {
              const selected = isPresetSelected(preset.moduleIds);
              return (
                <div
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.moduleIds)}
                >
                  <div>
                    <div>
                      <div>
                        {renderPresetIcon(preset.id)}
                      </div>
                      <h4>
                        {preset.label}
                      </h4>
                    </div>
                    {selected && (
                        // eslint-disable-next-line i18next/no-literal-string
                      <span>✓</span>
                    )}
                  </div>
                  <p>
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div>
            <h3>
              {tr.customModulesTitle ?? 'Sélectionnez vos propres modules'}
            </h3>
            <span>
              {tr.selectedCount?.replace('{count}', selectedCount.toString()).replace('{total}', availableModules.length.toString()) ?? `${selectedCount} / ${availableModules.length} sélectionnés`}
            </span>
          </div>
          <div>
            {availableModules.map((mod) => {
              const isSelected = selectedModuleKeys.has(mod.key);
              return (
                <div
                  key={mod.key}
                  onClick={() => toggleSelectedModule(mod.key)}
                >
                  <div>
                    {isSelected && <span>✓</span>}
                  </div>
                  <div>
                    {renderModuleIcon(mod.key)}
                  </div>
                  <div>
                    <div>
                      <span>
                        {getModuleLabel(mod.key, mod.label)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => setStation('builder')}
          >
            {tr.continueBtn?.replace('{count}', selectedCount.toString()) ?? `Continuer avec ${selectedCount} modules →`}
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="assembler-page">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          {t?.notebook?.header?.back ?? 'Retour'}
        </button>

        <h1>{tr.title ?? 'Nuevo proyecto'}</h1>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tr.titlePlaceholder ?? 'Titre du projet'}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={tr.descriptionPlaceholder ?? 'Description du projet'}
        />

        <div>
          <div>
            <input
              id="protected-enabled"
              type="checkbox"
              checked={protectedEnabled}
              onChange={(e) => setProtectedEnabled(e.target.checked)}
            />
            <div>
              <div>
                {tr.protectedDbLabel ?? 'Protéger la base de données avec des identifiants'}
              </div>
              <div>
                {tr.protectedDbDesc ?? "Si vous activez cette option, le projet nécessitera une connexion avant d'afficher le contenu."}
              </div>
            </div>
          </div>

          {protectedEnabled && (
            <div>
              <input
                type="text"
                value={protectedUsername}
                onChange={(e) => setProtectedUsername(e.target.value)}
                placeholder={tr.usernamePlaceholder ?? "Nom d'utilisateur"}
              />
              <input
                type="password"
                value={protectedPassword}
                onChange={(e) => setProtectedPassword(e.target.value)}
                placeholder={tr.passwordPlaceholder ?? 'Mot de passe (minimum 8 caractères)'}
              />
              {!protectedUsernameValid && (
                <div>
                  El usuario es obligatorio.
                </div>
              )}
              {!protectedPasswordValid && (
                <div>
                  La contraseña debe tener al menos 8 caracteres.
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div>
            <input
              id="api-config-enabled"
              type="checkbox"
              checked={apiConfigEnabled}
              onChange={(e) => handleApiConfigToggle(e.target.checked)}
            />
            <div>
              <div>
                Configurar API key
              </div>
              <div>
                Inyecta una API key fija en el exportable. El usuario final podrá editarla si también arrastras el bloque.
              </div>
            </div>
          </div>

          {apiConfigEnabled && (
            <div>
              <div>
                {requiredApiKeyTypes.length > 0
                  ? apiKeysValid
                    ? `${requiredApiKeyTypes.length} API key${requiredApiKeyTypes.length > 1 ? 's' : ''} configurada${requiredApiKeyTypes.length > 1 ? 's' : ''} y lista${requiredApiKeyTypes.length > 1 ? 's' : ''} para el exportable.`
                    : `Se requiere${requiredApiKeyTypes.length > 1 ? 'n' : ''} ${requiredApiKeyTypes.length} API key${requiredApiKeyTypes.length > 1 ? 's' : ''}. Haz clic para configurar.`
                  : 'No se requieren API keys para los módulos seleccionados.'}
              </div>
              <button
                type="button"
                onClick={openApiConfigModal}
              >
                Abrir modal de API key
              </button>
              {apiConfigEnabled && !apiKeysValid && requiredApiKeyTypes.length > 0 && (
                <div>
                  {requiredApiKeyTypes.length > 1
                    ? `Las ${requiredApiKeyTypes.length} API keys son obligatorias.`
                    : 'La API key es obligatoria.'}
                </div>
              )}
            </div>
          )}
        </div>

        <AssemblerModal
          isOpen={apiConfigModalOpen}
          title={`Configurar API${requiredApiKeyTypes.length > 1 ? 's' : ''}`}
          onClose={() => setApiConfigModalOpen(false)}
        >
          <div>
            {apiConfigStep === 'form' && (
              <div>
                <div>
                  Estas configurando informacion sensible
                </div>
                <p>
                  Las API keys quedaran inyectadas en el exportable. Podras editarlas luego si los modulos estan presentes.
                </p>

                {/* Render input for each required API key type */}
                {requiredApiKeyTypes.map((type) => {
                  const config = API_KEY_CONFIGS[type];
                  return (
                    <div key={type}>
                      <label>
                      {config?.label || type}
                      </label>
                      <input
                        type="password"
                        value={apiKeysDraft[type] || ''}
                        onChange={(e) => handleApiKeyDraftChange(type, e.target.value)}
                        placeholder={config?.placeholder || `Ingresa tu API key de ${type}`}
                      />
                      {apiKeysDraftErrors[type] && (
                        <div>{apiKeysDraftErrors[type]}</div>
                      )}
                    </div>
                  );
                })}

                <div>
                  <button
                    type="button"
                    onClick={cancelApiConfig}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApiConfigContinue}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {apiConfigStep === 'confirm' && (
              <div>
                <div>Confirmas esta configuracion?</div>
                <p>
                  Se inyectaran {requiredApiKeyTypes.length} API key{requiredApiKeyTypes.length > 1 ? 's' : ''} en el exportable.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => setApiConfigStep('form')}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleApiConfigConfirm}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {apiConfigStep === 'loading' && (
              <div>
                <div>Guardando configuracion...</div>
                <p>Protegiendo tus API keys.</p>
              </div>
            )}

            {apiConfigStep === 'success' && (
              <div>
                <div>API keys configuradas correctamente</div>
                <p>Ya puedes usar los modulos en el exportable.</p>
                <button
                  type="button"
                  onClick={handleApiConfigDone}
                >
                  Listo
                </button>
              </div>
            )}
          </div>
        </AssemblerModal>

        <div>
          <div>
            <h2>
              {tr.layoutEditorTitle ?? 'Conception des modules'}
            </h2>
            <p>
              {tr.layoutEditorDesc ?? 'Faites glisser les modules de la palette vers le canevas. Sélectionnez un fichier HTML pour chaque module qui en nécessite un et complétez les textes.'}
            </p>
          </div>

          <div>
            <div>
              <ModulesPalette
                modules={paletteModules}
                canvasModules={canvasModules}
                groups={filteredGroups}
                ungrouped={filteredUngrouped}
              />
            </div>

            <div>
              <DragDropCanvas
                modules={canvasModules}
                onChange={setCanvasModules}
                onSelectObject={handleSelectObject}
                onTextChange={handleTextChange}
                ragObjects={ragSelectedObjects.map((obj) => ({
                  id: obj.id,
                  name: obj.name ?? obj.title ?? `Objeto #${obj.id}`,
                }))}
                onRagOpenModal={openRagModal}
                onRagRemove={handleRagRemove}
                onRagDrop={handleRagDrop}
              />
            </div>
          </div>
        </div>


        {/* Validation warning for needsObject modules without object */}
        {canvasModules.some((m) => m.needsObject && !m.objectId) && (
          <div>
            {tr.validation?.missingHtml ?? 'Certains modules nécessitent un fichier HTML. Sélectionnez-en un pour chaque module marqué avant l\'assemblage.'}
          </div>

        )}

        {detectedType === 'landing_page' && !landingModulesReady && (
          <div>
            {tr.validation?.landingRequired ?? 'Pour la page de destination, vous devez inclure En-tête, Corps et Pied de page.'}
          </div>
        )}


        {/* Object selector modal */}
        <AssemblerModal
          isOpen={selectorModuleKey !== null}
          title={selectorModalTitle}
          onClose={() => setSelectorModuleKey(null)}
        >

          <GenericObjectSelector
            type={(selectorModule?.type as any) ?? 'HTML'}
            product_type_for_assembly={detectedType ?? undefined}
            module_name_for_assembly={selectorModuleKey ?? undefined}
            onObjectSelectionCallback={handleObjectSelected}
            currentSelection={selectorCurrentSelection}
          />
        </AssemblerModal>

        <AssemblerModal
          isOpen={ragModalOpen}
          title="Inyectar objetos para RAG"
          onClose={() => setRagModalOpen(false)}
        >
          <div>
            <div>
              <input
                value={ragSearch}
                onChange={(ev) => setRagSearch(ev.target.value)}
                placeholder="Buscar objetos"
              />
              <button
                type="button"
                onClick={() => void loadRagObjects()}
                disabled={ragLoading}
              >
                Recargar
              </button>
            </div>

            {ragLoading && (
              <div>Cargando objetos...</div>
            )}

            {ragError && (
              <div>
                {ragError}
              </div>
            )}

            {!ragLoading && !ragError && ragFilteredObjects.length === 0 && (
              <div>No hay objetos disponibles.</div>
            )}

            {!ragLoading && !ragError && ragFilteredObjects.length > 0 && (
              <div>
                {ragFilteredObjects.map((obj) => {
                  const checked = ragSelectedIds.has(String(obj.id));
                  return (
                    <label
                      key={obj.id}
                    >
                      <div>
                        <div>
                          {obj.name ?? obj.title ?? `Objeto #${obj.id}`}
                        </div>
                        <div>{obj.type ?? 'Documento'}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(ev) => handleRagToggle(obj, ev.target.checked)}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            <div>
              <span>Seleccionados: {ragSelectedObjects.length}</span>
              <button
                type="button"
                onClick={() => setRagModalOpen(false)}
              >
                Listo
              </button>
            </div>
          </div>
        </AssemblerModal>

        {/* Create & Assemble button + results */}
        <div>
          <div>
            {error && (
              <div>
                {error}
              </div>
            )}

            {resultUrl && (
              <div>
                <span>{tr.success ?? 'Assemblage réussi.'}</span>{' '}
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tr.openResult ?? 'Ouvrir le résultat →'}
                </a>
              </div>
            )}

            <div>
              {/* Canvas summary */}
              {canvasModules.length > 0 && (
                <div>
                  {canvasModules.map((m) => (
                    <span
                      key={m.key}
                    >
                      <span className={m.color} />
                      {m.label}
                      {m.needsObject && (m.objectId ? ' ✓' : ' ✗')}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateAndAssemble}
                disabled={!canCreate || isSubmitting}
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
    </div>
  );
};

export default AssemblerNew;
