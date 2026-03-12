import React, { useMemo, useState } from 'react';
import { ApiKeyNotebookSelector } from '../../modules/object-selector/View/Notebook/ApiKeyNotebookSelector.tsx';
import ChatInstructionNotebookSelector from '../../modules/object-selector/View/Notebook/ChatInstructionNotebookSelector.tsx';
import { MainVisualTemplateNotebookSelector } from '../../modules/object-selector/View/Notebook/MainVisualTemplateNotebookSelector.tsx';
import type { ObjectItem } from '../../modules/object-selector/services/api_handler';
import { useLanguage } from '../../language/useLanguage';
import { tokenStorage } from '@core/api/http.client.ts';

// Fixed module index identifiers for the notebook product
type ModuleKey = 1 | 2 | 3 | 4 | 5;

// Selectable module names for assembly
type ModuleName = 'api_key' | 'chat_instruction' | 'main_visual_template';

type ModuleDefinition = {
  id: ModuleKey;
  title: string;
  description: string;
  locked?: boolean;
  actionLabel?: string;
  module_name_for_assembly?: ModuleName;
  selector?: ModuleName;
};

type ModuleSelection = {
  module_name_for_assembly: ModuleName;
  object_id: number;
  object_name?: string;
};

// Exact DTO as per documents/features/notebook_assembler_flow.md
type NotebookInputModule = {
  index: 3 | 4 | 5;
  module_name_for_assembly: ModuleName;
  object_id: number;
};

type NotebookExactInputDTO = {
  PRODUCT_TYPE: 'notebook';
  INPUT_MODULES: NotebookInputModule[];
};

const NotebookAssembler: React.FC = () => {
  const { t } = useLanguage();
  const [openModal, setOpenModal] = useState<null | ModuleName>(null);
  const [apiKeyModule, setApiKeyModule] = useState<ModuleSelection | null>(null);
  const [chatInstructionModule, setChatInstructionModule] = useState<ModuleSelection | null>(null);
  const [mainVisualTemplateModule, setMainVisualTemplateModule] = useState<ModuleSelection | null>(null);
  const [exactDto, setExactDto] = useState<NotebookExactInputDTO | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showIncompleteAlert, setShowIncompleteAlert] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validateResult, setValidateResult] = useState<null | 'valid' | 'invalid'>(null);
  const [validateMessage, setValidateMessage] = useState<string | null>(null);

  const modules: ModuleDefinition[] = useMemo(() => {
    const notebookTranslations = t?.assembler?.notebook;
    const moduleTranslations = notebookTranslations?.modules;
    const selectFromLibraryLabel = notebookTranslations?.selectFromLibrary ?? 'Seleccionar desde librería de objetos';

    return [
      {
        id: 1,
        title: moduleTranslations?.rag?.title ?? 'RAG Module',
        description: moduleTranslations?.rag?.description ?? 'Módulo base (No modificable)',
        locked: true,
      },
      {
        id: 2,
        title: moduleTranslations?.assistant?.title ?? 'Assistant Module',
        description: moduleTranslations?.assistant?.description ?? 'Módulo base (No modificable)',
        locked: true,
      },
      {
        id: 3,
        title: moduleTranslations?.apiKey?.title ?? 'API key',
        description: moduleTranslations?.apiKey?.description ?? 'Requiere configuración desde librería',
        actionLabel: selectFromLibraryLabel,
        module_name_for_assembly: 'api_key',
        selector: 'api_key',
      },
      {
        id: 4,
        title: moduleTranslations?.assistantInstruction?.title ?? 'Assistant instruction',
        description: moduleTranslations?.assistantInstruction?.description ?? 'Requiere configuración desde librería',
        actionLabel: selectFromLibraryLabel,
        module_name_for_assembly: 'chat_instruction',
        selector: 'chat_instruction',
      },
      {
        id: 5,
        title: moduleTranslations?.visualTemplate?.title ?? 'Visual Template',
        description: moduleTranslations?.visualTemplate?.description ?? 'Requiere configuración desde librería',
        actionLabel: selectFromLibraryLabel,
        module_name_for_assembly: 'main_visual_template',
        selector: 'main_visual_template',
      },
    ];
  }, [t]);

  const handleSelect = (moduleId: 3 | 4 | 5, moduleName: ModuleName) => (object: ObjectItem) => {
    const selection: ModuleSelection = {
      module_name_for_assembly: moduleName,
      object_id: Number(object.id),
      object_name: object.name,
    };

    if (moduleId === 3) {
      setApiKeyModule(selection);
    }
    if (moduleId === 4) {
      setChatInstructionModule(selection);
    }
    if (moduleId === 5) {
      setMainVisualTemplateModule(selection);
    }
    setOpenModal(null);
  };

  // Helper to build the exact input DTO when ready
  const buildExactDto = (): NotebookExactInputDTO | null => {
    if (!apiKeyModule || !chatInstructionModule || !mainVisualTemplateModule) return null;
    // Guard against NaN ids just in case Number(object.id) failed
    if (
      Number.isNaN(apiKeyModule.object_id) ||
      Number.isNaN(chatInstructionModule.object_id) ||
      Number.isNaN(mainVisualTemplateModule.object_id)
    ) return null;
    return {
      PRODUCT_TYPE: 'notebook',
      INPUT_MODULES: [
        { index: 3 as const, module_name_for_assembly: 'api_key', object_id: apiKeyModule.object_id },
        { index: 4 as const, module_name_for_assembly: 'chat_instruction', object_id: chatInstructionModule.object_id },
        { index: 5 as const, module_name_for_assembly: 'main_visual_template', object_id: mainVisualTemplateModule.object_id },
      ],
    };
  };

  const configuredCount = [apiKeyModule, chatInstructionModule, mainVisualTemplateModule].filter(Boolean).length;
  const totalModules = 3; // Only selectable modules are considered for configuration
  const isComplete = Boolean(apiKeyModule && chatInstructionModule && mainVisualTemplateModule);

  const handleAssemble = () => {
    if (!isComplete) {
      setShowIncompleteAlert(true);
      setShowPreview(false);
      return;
    }
    const dto = buildExactDto();
    if (!dto) {
      // If somehow building failed, keep alert hidden but do not proceed
      setShowPreview(false);
      return;
    }
    setExactDto(dto);
    // eslint-disable-next-line no-console
    console.log('NOTEBOOK ASSEMBLY DTO:', dto);
    setShowIncompleteAlert(false);
    setShowPreview(true);
    // reset validation status when assembling a new DTO
    setValidateResult(null);
    setValidateMessage(null);
  };

  type ValidateResponse = {
    success?: boolean;
    message?: string;
    error?: { code?: string; message?: string } | null;
  };

  const handleValidate = async (): Promise<void> => {
    if (!exactDto) return;
    setIsValidating(true);
    setValidateResult(null);
    setValidateMessage(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : '';
      const token = tokenStorage.get();

      const response = await fetch(`${baseUrl}/api/v1/assembler/notebook/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(exactDto),
      });

      const contentType = response.headers.get('Content-Type') || '';
      const isJson = contentType.includes('application/json');
      const body: ValidateResponse | null = isJson ? await response.json() : null;

      if (response.ok) {
        setValidateResult('valid');
        setValidateMessage(body?.message ?? null);
      } else {
        setValidateResult('invalid');
        const errorMsg =
          (body && (body.error?.message || body.message)) || `${response.status} ${response.statusText}`;
        setValidateMessage(errorMsg);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      setValidateResult('invalid');
      setValidateMessage(message);
    } finally {
      setIsValidating(false);
    }
  };

  const renderSelector = () => {
    if (openModal === 'api_key') {
      const current = apiKeyModule;
      return (
        <ApiKeyNotebookSelector
          onObjectSelectionCallback={handleSelect(3, 'api_key')}
          currentSelection={current ? { id: current.object_id, name: current.object_name } : undefined}
        />
      );
    }
    if (openModal === 'chat_instruction') {
      const current = chatInstructionModule;
      return (
        <ChatInstructionNotebookSelector
          onObjectSelectionCallback={handleSelect(4, 'chat_instruction')}
          currentSelection={current ? { id: current.object_id, name: current.object_name } : undefined}
        />
      );
    }
    if (openModal === 'main_visual_template') {
      const current = mainVisualTemplateModule;
      return (
        <MainVisualTemplateNotebookSelector
          onObjectSelectionCallback={handleSelect(5, 'main_visual_template')}
          currentSelection={current ? { id: current.object_id, name: current.object_name } : undefined}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t?.assembler?.notebook?.title ?? 'Módulos del Proyecto'}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t?.assembler?.notebook?.subtitle ??
                'Selecciona la configuración desde la librería de objetos para ensamblar el notebook.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAssemble}
            disabled={!isComplete}
            aria-disabled={!isComplete}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition ${
              isComplete
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300'
            }`}
            title={!isComplete ? (t?.assembler?.notebook?.assembleDisabledHint ?? '') : undefined}
          >
            {t?.assembler?.notebook?.assembleCta ?? 'Ensamblar objetos'}
          </button>
        </div>
      </div>

      {!isComplete && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">{t?.assembler?.notebook?.incompleteTitle ?? 'Incomplete configuration'}</p>
            <p className="text-sm">{t?.assembler?.notebook?.incompleteMessage ?? 'Some required modules have not been selected.'}</p>
          </div>
          {showIncompleteAlert && (
            <button
              type="button"
              onClick={() => setShowIncompleteAlert(false)}
              aria-label={t?.common?.close ?? 'Close'}
              className="rounded-md px-2 py-1 text-xs bg-amber-100 text-amber-900 dark:bg-amber-800 dark:text-amber-100"
            >
              {t?.common?.close ?? 'Close'}
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {modules.map((module) => {
          const selected = (() => {
            if (module.id === 3) return apiKeyModule;
            if (module.id === 4) return chatInstructionModule;
            if (module.id === 5) return mainVisualTemplateModule;
            return null;
          })();
          const isSelectable = Boolean(module.selector);
          const actionLabel = selected
            ? t?.assembler?.notebook?.reselect ?? 'Volver a seleccionar'
            : module.actionLabel ?? t?.assembler?.notebook?.selectFromLibrary ?? 'Seleccionar desde librería de objetos';
          return (
            <div
              key={module.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-4 shadow-sm transition ${
                module.locked
                  ? 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  : 'border-brand-100/60 bg-white dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    module.locked
                      ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                      : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100'
                  }`}
                >
                  {module.id}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{module.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{module.description}</p>
                  {selected && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-green-700 dark:text-green-300">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold dark:bg-green-900/40">
                        #{selected.object_id}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{selected.object_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {isSelectable ? (
                <button
                  type="button"
                  onClick={() => setOpenModal(module.selector || null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-brand-900/50 dark:bg-brand-900/30 dark:text-brand-100 dark:hover:bg-brand-900/50 dark:focus:ring-offset-gray-900"
                >
                  {actionLabel}
                </button>
              ) : (
                <div
                  className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  aria-label={t?.assembler?.notebook?.lockedLabel ?? ''}
                  title={t?.assembler?.notebook?.lockedLabel ?? ''}
                >
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-600 dark:text-gray-200"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {modules.find((m) => m.selector === openModal)?.title ?? ''}
              </h2>
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                aria-label={t?.common?.close ?? 'Close'}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">{renderSelector()}</div>
          </div>
        </div>
      )}
      {showPreview && exactDto && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t?.assembler?.notebook?.configPreviewTitle ?? 'Configuration DTO'}
            </h3>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {t?.assembler?.notebook?.configSummaryLabel
                ? `${configuredCount}/${totalModules} ${t?.assembler?.notebook?.configSummaryLabel}`
                : `${configuredCount}/${totalModules} configured`}
            </span>
          </div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition ${
                isValidating
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isValidating && (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {t?.assembler?.notebook?.validateCta ?? 'Validate'}
            </button>

            <div className="min-h-5 flex-1 text-right">
              {isValidating && (
                <span className="text-sm text-gray-700 dark:text-gray-300">{t?.assembler?.notebook?.validatingLabel ?? 'Validating...'}</span>
              )}
              {!isValidating && validateResult === 'valid' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  {t?.assembler?.notebook?.validLabel ?? 'VALID'}
                </span>
              )}
              {!isValidating && validateResult === 'invalid' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-200">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  {t?.assembler?.notebook?.invalidLabel ?? 'NOT VALID'}
                </span>
              )}
            </div>
          </div>
          {validateMessage && (
            <div className="mb-2 text-xs text-gray-700 dark:text-gray-300">{validateMessage}</div>
          )}
          <pre className="overflow-x-auto rounded-lg bg-gray-900/80 p-3 text-xs text-green-100 dark:bg-gray-800">{JSON.stringify(exactDto, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default NotebookAssembler;