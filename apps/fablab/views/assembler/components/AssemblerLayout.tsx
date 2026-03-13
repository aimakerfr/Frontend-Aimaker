import React, { useMemo, useState } from 'react';
import GenericObjectSelector from '@apps/fablab/modules/object-selector/View/Notebook/GenericObjectSelector';
import type { ObjectItem } from '@apps/fablab/modules/object-selector/services/api_handler';
import AssemblerModal from './AssemblerModal';

export type AssemblerModule = {
  index: number; // 1..n per product definition
  key: string; // module_name_for_assembly
  title: string;
  description?: string;
  type: 'CONFIG' | 'HTML' | 'TEXT' | 'JSON' | string;
  selectable: boolean; // false for fixed modules like css_generator
};

export type SelectionState = Record<
  string,
  | {
      object_id: number;
      object_name?: string;
      module_name_for_assembly: string;
    }
  | undefined
>;

type Props = {
  productType: 'landing_page' | 'notebook' | string;
  makerPathId?: number | null;
  modules: AssemblerModule[];
  onBuildDto: (selections: SelectionState) => any; // parent constructs exact DTO shape
  onAssemble: (dto: any) => Promise<void> | void;
  onValidate?: (dto: any) => Promise<void> | void;
  assembleCtaLabel?: string;
  validateCtaLabel?: string;
};

const AssemblerLayout: React.FC<Props> = ({
  productType,
  makerPathId,
  modules,
  onBuildDto,
  onAssemble,
  onValidate,
  assembleCtaLabel,
  validateCtaLabel,
}) => {
  const [openSelectorKey, setOpenSelectorKey] = useState<string | null>(null);
  const [selections, setSelections] = useState<SelectionState>({});
  const [busy, setBusy] = useState<'assemble' | 'validate' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<null | 'success' | 'error'>(null);

  const canAssemble = useMemo(() => {
    // All selectable modules must be chosen
    return modules
      .filter((m) => m.selectable)
      .every((m) => selections[m.key]?.object_id && selections[m.key]?.module_name_for_assembly === m.key);
  }, [modules, selections]);

  const handleSelect = (key: string) => (obj: ObjectItem) => {
    setSelections((prev) => ({
      ...prev,
      [key]: {
        object_id: Number(obj.id),
        object_name: obj.name,
        module_name_for_assembly: key,
      },
    }));
    setOpenSelectorKey(null);
  };

  async function handleAssemble() {
    if (!canAssemble) return;
    const dto = onBuildDto(selections);
    try {
      setBusy('assemble');
      setMessage(null);
      setStatus(null);
      await onAssemble(dto);
      setStatus('success');
      setMessage('Assemble completed successfully.');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Assemble failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleValidate() {
    if (!onValidate) return;
    const dto = onBuildDto(selections);
    try {
      setBusy('validate');
      setMessage(null);
      setStatus(null);
      await onValidate(dto);
      setStatus('success');
      setMessage('Input validated successfully.');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Validation failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <div className="text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">Product:</span> {productType}
          {makerPathId ? (
            <>
              {' '}
              <span className="ml-3 font-medium">Maker Path ID:</span> {makerPathId}
            </>
          ) : null}
        </div>
      </div>

      {/* Modules stacked in a single column */}
      <div className="flex flex-col gap-4">
        {modules.map((m) => {
          const sel = selections[m.key];
          return (
            <div key={m.key} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{m.title}</div>
                  {m.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">{m.description}</div>
                  )}
                </div>
                {m.selectable && (
                  <button
                    type="button"
                    onClick={() => setOpenSelectorKey(m.key)}
                    className="ml-3 inline-flex items-center rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-sm"
                  >
                    Select object
                  </button>
                )}
              </div>
              {sel && (
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                  Selected: <span className="font-medium">{sel.object_name ?? sel.object_id}</span>
                </div>
              )}
              <AssemblerModal
                isOpen={openSelectorKey === m.key}
                title={`Select ${m.title}`}
                onClose={() => setOpenSelectorKey(null)}
              >
                <GenericObjectSelector
                  type={m.type as any}
                  onObjectSelectionCallback={handleSelect(m.key)}
                  currentSelection={sel ? { id: sel.object_id, name: sel.object_name } : undefined}
                />
              </AssemblerModal>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAssemble}
          disabled={!canAssemble || busy === 'assemble'}
          className={
            'inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ' +
            (canAssemble && busy !== 'assemble'
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300')
          }
        >
          {busy === 'assemble' ? 'Assembling...' : assembleCtaLabel ?? 'Assemble'}
        </button>

        {onValidate && (
          <button
            type="button"
            onClick={handleValidate}
            disabled={busy === 'validate'}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {busy === 'validate' ? 'Validating...' : validateCtaLabel ?? 'Validate'}
          </button>
        )}
      </div>

      {status && (
        <div
          className={
            'rounded-md border px-4 py-3 text-sm ' +
            (status === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-100'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-100')
          }
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default AssemblerLayout;
