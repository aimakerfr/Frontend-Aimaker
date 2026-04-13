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
    <div>
      <div>
        <div>
          <span>Product:</span> {productType}
          {makerPathId ? (
            <>
              {' '}
              <span>Maker Path ID:</span> {makerPathId}
            </>
          ) : null}
        </div>
      </div>

      {/* Modules stacked in a single column */}
      <div>
        {modules.map((m) => {
          const sel = selections[m.key];
          return (
            <div key={m.key}>
              <div>
                <div>
                  <div>{m.title}</div>
                  {m.description && (
                    <div>{m.description}</div>
                  )}
                </div>
                {m.selectable && (
                  <button
                    type="button"
                    onClick={() => setOpenSelectorKey(m.key)}
                  >
                    Select object
                  </button>
                )}
              </div>
              {sel && (
                <div>
                  Selected: <span>{sel.object_name ?? sel.object_id}</span>
                </div>
              )}
              <AssemblerModal
                isOpen={openSelectorKey === m.key}
                title={`Select ${m.title}`}
                onClose={() => setOpenSelectorKey(null)}
              >
                <GenericObjectSelector
                  type={m.type as any}
                  product_type_for_assembly={productType}
                  module_name_for_assembly={m.key}
                  onObjectSelectionCallback={handleSelect(m.key)}
                  currentSelection={sel ? { id: sel.object_id, name: sel.object_name } : undefined}
                />
              </AssemblerModal>
            </div>
          );
        })}
      </div>

      <div>
        <button
          type="button"
          onClick={handleAssemble}
          disabled={!canAssemble || busy === 'assemble'}
        >
          {busy === 'assemble' ? 'Assembling...' : assembleCtaLabel ?? 'Assemble'}
        </button>

        {onValidate && (
          <button
            type="button"
            onClick={handleValidate}
            disabled={busy === 'validate'}
          >
            {busy === 'validate' ? 'Validating...' : validateCtaLabel ?? 'Validate'}
          </button>
        )}
      </div>

      {status && (
        <div>
          {message}
        </div>
      )}
    </div>
  );
};

export default AssemblerLayout;
