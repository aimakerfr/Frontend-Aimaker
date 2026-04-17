import { useLanguage } from '@apps/fablab/language/useLanguage';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { tokenStorage } from '@core/api/http.client';
import { getAllObjects, type ObjectItem as LibraryObjectItem } from '@core/objects';
import { createAssemblerMakerPath } from './services/makerPath.service';
import { DragDropCanvas, ModulesPalette, ALL_MODULES, MODULE_GROUPS, UNGROUPED_MODULES, API_KEY_CONFIGS } from './components/drag-drop';
import type { CanvasModule, LayoutEntry } from './components/drag-drop';
import GenericObjectSelector from '@apps/fablab/modules/object-selector/View/Notebook/GenericObjectSelector';
import type { ObjectItem as SelectorObjectItem } from '@apps/fablab/modules/object-selector/services/api_handler';
import AssemblerModal from './components/AssemblerModal';
import { useNavigate } from 'react-router-dom';
import AssemblerTutorial, { type TutorialStep } from './AssemblerTutorial';
import './style.css';

type ProductType = 'notebook' | 'landing_page';

function getApiBase(): string {
  const u = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return u ? u.replace(/\/$/, '') : '';
}

const AssemblerNew: React.FC = () => {
  const { t } = useLanguage();
  const tr = t.assemblerNewTranslations;

  const language = 'es';
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
  const [isAssemblerFlipped, setIsAssemblerFlipped] = useState(false);
  const [isTutorialPinned, setIsTutorialPinned] = useState(false);
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
        label: 'Notebook IA',
        description: (tr?.['text_2'] ?? 'Configuración ideal para un entorno interactivo con documentos.'),
        moduleIds: ['api_configuration', 'rag', 'chat'],
      },
      {
        id: 'preset_landing',
        label: 'Landing Page',
        description: (tr?.['text_4'] ?? 'Estructura estándar para una página de presentación.'),
        moduleIds: ['header', 'body', 'footer'],
      },
    ]
  ), []);

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

  const objectModulesValid = canvasModules
    .filter((m) => m.needsObject)
    .every((m) => m.objectId && m.objectId > 0);

  const protectedUsernameValid = !protectedEnabled || protectedUsername.trim().length > 0;
  const protectedPasswordValid = !protectedEnabled || protectedPassword.trim().length >= 8;
  const protectedValid = protectedUsernameValid && protectedPasswordValid;

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
    setApiKeysDraftErrors((prev) => ({ ...prev, [type]: '' }));
  }, []);

  const handleApiConfigContinue = useCallback(() => {
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
          ? { ...m, objectId: Number(obj.id), objectName: obj.name ?? `Objeto #${obj.id}` }
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
      const message = e instanceof Error ? e.message : (tr?.['text_5'] ?? 'No se pudieron cargar los objetos.');
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

  const buildLayoutData = useCallback((): LayoutEntry[] => {
    return canvasModules.map((m) => ({
      module_name: m.key,
      col: m.col,
      row: m.row,
      colSpan: m.colSpan,
      rowSpan: m.rowSpan,
    }));
  }, [canvasModules]);

  const buildAssembleDto = useCallback((makerPathId: number) => {
    const layout = buildLayoutData();

    const FIXED_INDEX: Record<string, number> = detectedType === 'landing_page'
      ? { header: 2, body: 3, footer: 4 }
      : { html_input: 4 };
    let nextIndex = 10;
    const inputModules = canvasModules
      .filter((m) => m.needsObject && m.objectId)
      .map((m) => ({
        index: FIXED_INDEX[m.key] ?? nextIndex++,
        module_name_for_assembly: m.key,
        object_id: m.objectId!,
      }));

    const variables: Record<string, string> = {
      project_title: title.trim(),
      project_description: description.trim(),
      language,
      has_api_config_module: canvasModules.some((m) => m.key === 'api_configuration') ? '1' : '0',
    };
    if (apiConfigEnabled) {
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
      const res = await createAssemblerMakerPath({
        projectType: detectedType,
        title: title.trim(),
        description: description.trim(),
        data: JSON.stringify({ layout, canvasModules: canvasData }),
      });

      const makerPathId = res.id;
      if (!makerPathId || makerPathId <= 0) {
        throw new Error((tr?.['text_6'] ?? 'MakerPath creado pero sin ID válido'));
      }

      await callAssembleEndpoint(makerPathId);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : (tr?.['text_7'] ?? 'Error al crear/ensamblar el proyecto');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectorModule = selectorModuleKey
    ? canvasModules.find((m) => m.key === selectorModuleKey)
    : null;
  const selectorModuleLabel = selectorModule?.label ?? selectorModuleKey ?? '';
  const selectorModalTitle = `Seleccionar HTML — ${selectorModuleLabel}`;
  const selectorCurrentSelection = typeof selectorModule?.objectId === 'number'
    ? { id: selectorModule.objectId, name: selectorModule.objectName ?? undefined }
    : undefined;

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
      case 'header':          return (tr?.['text_8'] ?? 'Landing Page: Encabezado');
      case 'body':            return 'Landing Page: Cuerpo';
      case 'footer':          return (tr?.['text_10'] ?? 'Landing Page: Pie de página');
      case 'rag':             return 'Módulo RAG';
      case 'api_configuration': return (tr?.['text_12'] ?? 'Configurador de API Key');
      case 'chat':            return 'Módulo de Chat';
      case 'html_input':      return (tr?.['text_14'] ?? 'Entrada HTML');
      case 'buscador':        return 'Buscador';
      case 'perplexity':      return 'Perplexity';
      default:                return fallback;
    }
  }, []);

  const getPresetDescriptionLong = useCallback((presetId: string, fallback: string) => {
    switch (presetId) {
      case 'preset_notebook':
        return (tr?.['text_17'] ?? 'Incluye los bloques esenciales para un producto tipo notebook: configuración de API, módulo RAG para documentos y un chat listo para conversar. Ideal si vas a crear una experiencia interactiva con archivos y preguntas.');
      case 'preset_landing':
        return (tr?.['text_18'] ?? 'Selecciona la estructura base de una landing page clásica con header, body y footer. Perfecto para páginas informativas, presentaciones de producto o sitios promocionales.');
      default:
        return fallback;
    }
  }, []);

  const getModuleDescriptionLong = useCallback((key: string, fallback: string) => {
    switch (key) {
      case 'header':
        return (tr?.['text_19'] ?? 'Bloque superior de la landing. Define el encabezado principal con branding, navegación o título destacado.');
      case 'body':
        return (tr?.['text_20'] ?? 'Sección central donde vive el contenido principal: beneficios, descripciones, llamados a la acción o información clave.');
      case 'footer':
        return (tr?.['text_21'] ?? 'Bloque final de la landing con enlaces secundarios, contacto, términos legales o información adicional.');
      case 'chat':
        return (tr?.['text_22'] ?? 'Módulo de conversación para que el usuario escriba y reciba respuestas. Requiere API key activa si quieres respuestas inteligentes.');
      case 'rag':
        return (tr?.['text_23'] ?? 'Espacio donde el usuario puede subir PDFs o documentos. El chat usará estos archivos como contexto para responder.');
      case 'perplexity':
        return (tr?.['text_24'] ?? 'Buscador inteligente que permite al usuario consultar en la web con ayuda de Perplexity AI.');
      case 'buscador':
        return (tr?.['text_25'] ?? 'Módulo de búsqueda visual con diseño predefinido. Útil para mostrar un buscador sin lógica avanzada.');
      case 'api_configuration':
        return (tr?.['text_26'] ?? 'Bloque para configurar claves de API desde el exportable. Permite establecer claves globales editables.');
      case 'html_input':
        return (tr?.['text_27'] ?? 'Selecciona un HTML personalizado para insertarlo como módulo dinámico en el ensamblador.');
      default:
        return fallback;
    }
  }, []);

  const tutorialSteps = useMemo<TutorialStep[]>(() => {
    const moduleMap = new Map(availableModules.map((mod) => [mod.key, mod]));
    const moduleOrder = [
      'header', 'footer', 'body', 'chat', 'rag',
      'perplexity', 'buscador', 'html_input', 'api_configuration',
    ];

    const presetSteps = presets.map((preset) => ({
      id: preset.id,
      type: 'preset' as const,
      title: (tr?.['text_28'] ?? 'Configuraciones predefinidas'),
      description: getPresetDescriptionLong(preset.id, preset.description),
      itemTitle: preset.label,
      itemDescription: preset.description,
    }));

    const moduleSteps = moduleOrder.map((key) => {
      const module = moduleMap.get(key);
      return {
        id: `module_${key}`,
        type: 'module' as const,
        title: getModuleLabel(key, module?.label ?? key),
        description: getModuleDescriptionLong(key, module?.description ?? ''),
      };
    });

    return [
      {
        id: 'welcome',
        type: 'mascot',
        title: '¡Hola! Soy Aimi',
        description: (tr?.['text_30'] ?? 'Bienvenido al ensamblador. Toca a Aimi para avanzar por cada paso.'),
      },
      ...presetSteps,
      {
        id: 'modules-intro',
        type: 'mascot',
        title: 'Selecciona tus propios módulos',
        description: (tr?.['text_32'] ?? 'Ahora veremos cada módulo disponible en el ensamblador, uno por uno.'),
      },
      ...moduleSteps,
    ];
  }, [availableModules, getModuleDescriptionLong, getModuleLabel, getPresetDescriptionLong, presets]);

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
      <div className="assembler-page">
        <div className={`assembler-page-flip ${isAssemblerFlipped ? 'flipped' : ''}`}>
          <div className="assembler-page-front">
            <div className="assembler-header">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="assembler-header-back"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>{tr?.['text_33'] ?? 'Volver'}</button>

              <div className="assembler-header-text">
                <h1 className="assembler-header-title">Ensamblador de Proyecto</h1>
                <p className="assembler-header-subtitle">{tr?.['text_35'] ?? 'Selecciona los módulos que quieres incluir en tu nuevo proyecto.'}</p>
              </div>

              <button
                type="button"
                className="assembler-flip-trigger"
                onClick={() => setIsAssemblerFlipped((prev) => !prev)}
                aria-label={(tr?.['text_36'] ?? 'Mostrar instrucciones')}
              >
                <span className="assembler-flip-bubble">?</span>
              </button>
            </div>

            <div className="assembler-selection-container">
              <section className="assembler-selection-card">
                <h3>{tr?.['text_28'] ?? 'Configuraciones predefinidas'}</h3>

                <div className="assembler-presets-list">
                  {presets.map((preset) => {
                    const selected = isPresetSelected(preset.moduleIds);
                    return (
                      <div
                        key={preset.id}
                        className={`assembler-preset-item${selected ? ' selected' : ''}`}
                        onClick={() => handlePresetClick(preset.moduleIds)}
                      >
                        <div className="fablab-header-warning-bubble">
                          <div className="fablab-warning-bubble-icon">i</div>
                          <div className="fablab-warning-tooltip">
                            <p className="fablab-warning-tooltip-text assembler-typewriter">
                              {getPresetDescriptionLong(preset.id, preset.description)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <div>
                            <div>{renderPresetIcon(preset.id)}</div>
                            <h4>{preset.label}</h4>
                          </div>
                          {selected && <span>✓</span>}
                        </div>
                        <p>{preset.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="assembler-selection-card">
                <div className="assembler-selection-header">
                  <h3 className="assembler-selection-title">{tr?.['text_31'] ?? 'Selecciona tus propios módulos'}</h3>
                  <span className="assembler-selection-count">
                    {`${selectedCount} / ${availableModules.length} seleccionados`}
                  </span>
                </div>
                <div className="assembler-modules-list">
                  {availableModules.map((mod) => {
                    const isSelected = selectedModuleKeys.has(mod.key);
                    return (
                      <div
                        key={mod.key}
                        className={`assembler-module-item${isSelected ? ' selected' : ''}`}
                        onClick={() => toggleSelectedModule(mod.key)}
                      >
                        <div className="fablab-header-warning-bubble">
                          <div className="fablab-warning-bubble-icon">i</div>
                          <div className="fablab-warning-tooltip">
                            <p className="fablab-warning-tooltip-text assembler-typewriter">
                              {getModuleDescriptionLong(mod.key, mod.description)}
                            </p>
                          </div>
                        </div>
                        <div>
                          {isSelected && <span>✓</span>}
                        </div>
                        <div>{renderModuleIcon(mod.key)}</div>
                        <div>
                          <div>
                            <span>{getModuleLabel(mod.key, mod.label)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="assembler-selection-actions">
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setStation('builder')}
                className="assembler-selection-continue"
              >
                {`Continuar con ${selectedCount} módulos →`}
              </button>
            </div>
          </div>

          <div className="assembler-page-back">
            <div className="assembler-back-placeholder">
              <button
                type="button"
                className="assembler-back-close"
                onClick={() => setIsAssemblerFlipped(false)}
                aria-label={(tr?.['text_37'] ?? 'Cerrar instrucciones')}
              >
                ×
              </button>
              <AssemblerTutorial
                isPinned={isTutorialPinned}
                onPin={() => setIsTutorialPinned(true)}
                onComplete={() => {
                  setIsAssemblerFlipped(false);
                  setIsTutorialPinned(false);
                }}
                isActive={isAssemblerFlipped}
                steps={tutorialSteps}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assembler-page">
      <div className={`assembler-page-flip ${isAssemblerFlipped ? 'flipped' : ''}`}>
        <div className="assembler-page-front">
          <div className="assembler-header">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="assembler-header-back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>{tr?.['text_33'] ?? 'Volver'}</button>

            <div className="assembler-header-main">
              <h1 className="assembler-header-title">{tr?.['text_38'] ?? 'Configura tus módulos'}</h1>
            </div>

            <button
              type="button"
              className="assembler-flip-trigger"
              onClick={() => setIsAssemblerFlipped((prev) => !prev)}
              aria-label={(tr?.['text_36'] ?? 'Mostrar instrucciones')}
            >
              <span className="assembler-flip-bubble">?</span>
            </button>
          </div>

          <div className="assembler-settings">
            <div className="assembler-setting-card is-stacked">
              <div className="assembler-setting-info">
                <div className="assembler-setting-title">Título y descripción del proyecto</div>
                <div className="assembler-setting-description">{tr?.['text_40'] ?? 'Define el nombre y la descripción que aparecerán en el exportable.'}</div>
              </div>
              <div className="assembler-setting-fields">
                <input
                  className="assembler-setting-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={(tr?.['text_41'] ?? 'Título del proyecto')}
                />
                <textarea
                  className="assembler-setting-input assembler-setting-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={(tr?.['text_42'] ?? 'Descripción del proyecto')}
                />
              </div>
            </div>

            <div className="assembler-setting-card">
              <input
                id="protected-enabled"
                type="checkbox"
                checked={protectedEnabled}
                onChange={(e) => setProtectedEnabled(e.target.checked)}
                className="assembler-setting-toggle"
              />
              <div className="assembler-setting-info">
                <div className="assembler-setting-title">Proteger la base de datos con credenciales</div>
                <div className="assembler-setting-description">{tr?.['text_44'] ?? 'Si activas esta opción, el proyecto requerirá inicio de sesión antes de mostrar el contenido.'}</div>
              </div>
              {protectedEnabled && (
                <div className="assembler-setting-fields">
                  <input
                    className="assembler-setting-input"
                    type="text"
                    value={protectedUsername}
                    onChange={(e) => setProtectedUsername(e.target.value)}
                    placeholder={(tr?.['text_45'] ?? 'Usuario')}
                  />
                  <input
                    className="assembler-setting-input"
                    type="password"
                    value={protectedPassword}
                    onChange={(e) => setProtectedPassword(e.target.value)}
                    placeholder={(tr?.['text_46'] ?? 'Contraseña (mínimo 8 caracteres)')}
                  />
                  {!protectedUsernameValid && (
                    <div className="assembler-setting-error">{tr?.['text_47'] ?? 'El usuario es obligatorio.'}</div>
                  )}
                  {!protectedPasswordValid && (
                    <div className="assembler-setting-error">{tr?.['text_48'] ?? 'La contraseña debe tener al menos 8 caracteres.'}</div>
                  )}
                </div>
              )}
            </div>

            <div className="assembler-setting-card">
              <input
                id="api-config-enabled"
                type="checkbox"
                checked={apiConfigEnabled}
                onChange={(e) => handleApiConfigToggle(e.target.checked)}
                className="assembler-setting-toggle"
              />
              <div className="assembler-setting-info">
                <div className="assembler-setting-title">Configurar API key</div>
                <div className="assembler-setting-description">{tr?.['text_50'] ?? 'Inyecta una API key fija en el exportable. El usuario final podrá editarla si también arrastras el bloque.'}</div>
              </div>
              {apiConfigEnabled && (
                <div className="assembler-setting-fields">
                  <div className="assembler-setting-status">
                    {requiredApiKeyTypes.length > 0
                      ? apiKeysValid
                        ? `${requiredApiKeyTypes.length} API key${requiredApiKeyTypes.length > 1 ? 's' : ''} configurada${requiredApiKeyTypes.length > 1 ? 's' : ''} y lista${requiredApiKeyTypes.length > 1 ? 's' : ''} para el exportable.`
                        : `Se requiere${requiredApiKeyTypes.length > 1 ? 'n' : ''} ${requiredApiKeyTypes.length} API key${requiredApiKeyTypes.length > 1 ? 's' : ''}. Haz clic para configurar.`
                      : (tr?.['text_51'] ?? 'No se requieren API keys para los módulos seleccionados.')}
                  </div>
                  <button
                    type="button"
                    onClick={openApiConfigModal}
                    className="assembler-setting-action"
                  >{tr?.['text_52'] ?? 'Abrir modal de API key'}</button>
                  {apiConfigEnabled && !apiKeysValid && requiredApiKeyTypes.length > 0 && (
                    <div className="assembler-setting-error">
                      {requiredApiKeyTypes.length > 1
                        ? `Las ${requiredApiKeyTypes.length} API keys son obligatorias.`
                        : (tr?.['text_53'] ?? 'La API key es obligatoria.')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <AssemblerModal
            isOpen={apiConfigModalOpen}
            title={`Configurar API${requiredApiKeyTypes.length > 1 ? 's' : ''}`}
            onClose={() => setApiConfigModalOpen(false)}
          >
            <div className="assembler-modal-stack">
              {apiConfigStep === 'form' && (
                <div className="assembler-modal-section">
                  <div className="assembler-modal-lead">Estás configurando información sensible</div>
                  <p className="assembler-modal-text">{tr?.['text_55'] ?? 'Las API keys quedarán inyectadas en el exportable. Podrás editarlas luego si los módulos están presentes.'}</p>
                  {requiredApiKeyTypes.map((type) => {
                    const config = API_KEY_CONFIGS[type];
                    return (
                      <div key={type} className="assembler-modal-field">
                        <label className="assembler-modal-label">
                          {config?.label || type}
                        </label>
                        <input
                          type="password"
                          value={apiKeysDraft[type] || ''}
                          onChange={(e) => handleApiKeyDraftChange(type, e.target.value)}
                          placeholder={config?.placeholder || `Ingresa tu API key de ${type}`}
                          className="assembler-setting-input"
                        />
                        {apiKeysDraftErrors[type] && (
                          <div className="assembler-setting-error">{apiKeysDraftErrors[type]}</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="assembler-modal-actions">
                    <button type="button" onClick={cancelApiConfig} className="assembler-modal-button ghost">{tr?.['text_56'] ?? 'Cancelar'}</button>
                    <button type="button" onClick={handleApiConfigContinue} className="assembler-modal-button primary">{tr?.['text_57'] ?? 'Continuar'}</button>
                  </div>
                </div>
              )}

              {apiConfigStep === 'confirm' && (
                <div className="assembler-modal-section">
                  <div className="assembler-modal-lead">¿Confirmas esta configuración?</div>
                  <p className="assembler-modal-text">
                    Se inyectarán {requiredApiKeyTypes.length} API key{requiredApiKeyTypes.length > 1 ? 's' : ''} en el exportable.
                  </p>
                  <div className="assembler-modal-actions">
                    <button type="button" onClick={() => setApiConfigStep('form')} className="assembler-modal-button ghost">{tr?.['text_33'] ?? 'Volver'}</button>
                    <button type="button" onClick={handleApiConfigConfirm} className="assembler-modal-button primary">{tr?.['text_61'] ?? 'Confirmar'}</button>
                  </div>
                </div>
              )}

              {apiConfigStep === 'loading' && (
                <div className="assembler-modal-section">
                  <div className="assembler-modal-lead">{tr?.['text_62'] ?? 'Guardando configuración...'}</div>
                  <p className="assembler-modal-text">Protegiendo tus API keys.</p>
                </div>
              )}

              {apiConfigStep === 'success' && (
                <div className="assembler-modal-section">
                  <div className="assembler-modal-lead">API keys configuradas correctamente</div>
                  <p className="assembler-modal-text">{tr?.['text_65'] ?? 'Ya puedes usar los módulos en el exportable.'}</p>
                  <button type="button" onClick={handleApiConfigDone} className="assembler-modal-button primary">{tr?.['text_66'] ?? 'Listo'}</button>
                </div>
              )}
            </div>
          </AssemblerModal>

          <div className="assembler-builder">
            <div className="assembler-builder-header">
              <h2 className="assembler-builder-title">Diseño de módulos</h2>
              <p className="assembler-builder-subtitle">{tr?.['text_68'] ?? 'Arrastra los módulos de la paleta al lienzo. Selecciona un archivo HTML para cada módulo que lo requiera y completa los textos.'}</p>
            </div>

            <div className="assembler-builder-body">
              <div className="assembler-builder-palette">
                <ModulesPalette
                  modules={paletteModules}
                  canvasModules={canvasModules}
                  groups={filteredGroups}
                  ungrouped={filteredUngrouped}
                />
              </div>

              <div className="assembler-builder-canvas">
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

          {canvasModules.some((m) => m.needsObject && !m.objectId) && (
            <div>{tr?.['text_69'] ?? 'Algunos módulos requieren un archivo HTML. Selecciona uno para cada módulo marcado antes del ensamblado.'}</div>
          )}

          {detectedType === 'landing_page' && !landingModulesReady && (
            <div>{tr?.['text_70'] ?? 'Para la landing page, debes incluir Encabezado, Cuerpo y Pie de página.'}</div>
          )}

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
            title={(tr?.['text_71'] ?? 'Inyectar objetos para RAG')}
            onClose={() => setRagModalOpen(false)}
          >
            <div>
              <div>
                <input
                  value={ragSearch}
                  onChange={(ev) => setRagSearch(ev.target.value)}
                  placeholder={(tr?.['text_72'] ?? 'Buscar objetos')}
                />
                <button type="button" onClick={() => void loadRagObjects()} disabled={ragLoading}>
                  Recargar
                </button>
              </div>

              {ragLoading && <div>{tr?.['text_74'] ?? 'Cargando objetos...'}</div>}
              {ragError && <div>{ragError}</div>}
              {!ragLoading && !ragError && ragFilteredObjects.length === 0 && (
                <div>{tr?.['text_75'] ?? 'No hay objetos disponibles.'}</div>
              )}
              {!ragLoading && !ragError && ragFilteredObjects.length > 0 && (
                <div>
                  {ragFilteredObjects.map((obj) => {
                    const checked = ragSelectedIds.has(String(obj.id));
                    return (
                      <label key={obj.id}>
                        <div>
                          <div>{obj.name ?? obj.title ?? `Objeto #${obj.id}`}</div>
                          <div>{obj.type ?? (tr?.['text_76'] ?? 'Documento')}</div>
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
                <button type="button" onClick={() => setRagModalOpen(false)}>{tr?.['text_66'] ?? 'Listo'}</button>
              </div>
            </div>
          </AssemblerModal>

          <div>
            <div>
              {error && <div>{error}</div>}

              {resultUrl && (
                <div>
                  <span>{tr?.['text_78'] ?? 'Ensamblado exitoso.'}</span>{' '}
                  <a href={resultUrl} target="_blank" rel="noopener noreferrer">
                    Abrir resultado →
                  </a>
                </div>
              )}

              <div>
                {canvasModules.length > 0 && (
                  <div>
                    {canvasModules.map((m) => (
                      <span key={m.key}>
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
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" opacity="0.25" />
                        <path d="M4 12a8 8 0 0 1 8-8" />
                      </svg>{tr?.['text_80'] ?? 'Ensamblando...'}</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>{tr?.['text_81'] ?? 'Crear y Ensamblar'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="assembler-page-back">
          <div className="assembler-back-placeholder">
            <button
              type="button"
              className="assembler-back-close"
              onClick={() => setIsAssemblerFlipped(false)}
              aria-label={(tr?.['text_37'] ?? 'Cerrar instrucciones')}
            >
              ×
            </button>
            <AssemblerTutorial
              isPinned={isTutorialPinned}
              onPin={() => setIsTutorialPinned(true)}
              onComplete={() => {
                setIsAssemblerFlipped(false);
                setIsTutorialPinned(false);
              }}
              isActive={isAssemblerFlipped}
              steps={tutorialSteps}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblerNew;