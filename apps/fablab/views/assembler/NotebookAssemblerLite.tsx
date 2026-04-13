import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AssemblerLayout, { AssemblerModule, SelectionState } from './components/AssemblerLayout';
import { useLanguage } from '../../language/useLanguage';
import { tokenStorage } from '@core/api/http.client';

const NotebookAssemblerLite: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const makerPathId = useMemo<number | null>(() => {
    const q = searchParams.get('id');
    if (!q) return null;
    const n = Number(q);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [searchParams]);

  const [assembleInfo, setAssembleInfo] = useState<{ status: 'idle'|'success'|'error'; message?: string }>(
    { status: 'idle' }
  );

  const modules: AssemblerModule[] = useMemo(
    () => [
      // Index 1,2 are fixed base modules (rag, assistant) — not selectable here
      { index: 3, key: 'api_key', title: t?.assembler?.notebook?.modules?.apiKey?.title ?? 'API key', description: t?.assembler?.notebook?.modules?.apiKey?.description ?? 'Select API key object', type: 'CONFIG', selectable: true },
      { index: 4, key: 'chat_instruction', title: t?.assembler?.notebook?.modules?.assistantInstruction?.title ?? 'Assistant instruction', description: t?.assembler?.notebook?.modules?.assistantInstruction?.description ?? 'Select instruction object', type: 'TEXT', selectable: true },
      { index: 5, key: 'main_visual_template', title: t?.assembler?.notebook?.modules?.visualTemplate?.title ?? 'Visual Template', description: t?.assembler?.notebook?.modules?.visualTemplate?.description ?? 'Select visual template object', type: 'HTML', selectable: true },
    ],
    [t]
  );

  const onBuildDto = (selections: SelectionState) => {
    const input = modules
      .filter((m) => m.selectable)
      .map((m) => ({
        index: m.index as 3 | 4 | 5,
        module_name_for_assembly: m.key,
        object_id: Number(selections[m.key]?.object_id),
      }));

    const dto: any = {
      PRODUCT_TYPE: 'notebook',
      INPUT_MODULES: input,
    };
    if (makerPathId) dto.MAKER_PATH_ID = makerPathId;
    return dto;
  };

  const onAssemble = async (dto: any) => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
    const base = apiUrl ? apiUrl.replace(/\/$/, '') : '';
    const token = tokenStorage.get();

    const res = await fetch(`${base}/api/v1/assembler/notebook/assemble`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(dto),
    });

    const contentType = res.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json() : null;

    if (!res.ok) {
      const message = (body && (body.error?.message || body.message || body.error)) || `HTTP ${res.status}`;
      setAssembleInfo({ status: 'error', message });
      throw new Error(message);
    }
    const filesCount = (body?.files && Array.isArray(body.files) ? body.files.length : 0) as number;
    const msg = body?.message || (t?.assembler?.common?.assembledOk ?? `Successfully assembled (${filesCount} files).`);
    setAssembleInfo({ status: 'success', message: msg });
  };

  const onValidate = async (dto: any) => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
    const base = apiUrl ? apiUrl.replace(/\/$/, '') : '';
    const token = tokenStorage.get();

    const res = await fetch(`${base}/api/v1/assembler/notebook/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(dto),
    });
    const contentType = res.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json() : null;
    if (!res.ok) {
      const message = (body && (body.error?.message || body.message || body.error)) || `HTTP ${res.status}`;
      throw new Error(message);
    }
  };

  if (!makerPathId) {
    return (
      <div>
        {t?.assembler?.missingId ?? 'Missing maker path id. Use ?id= in the URL.'}
      </div>
    );
  }

  return (
    <div>
      <AssemblerLayout
        productType="notebook"
        makerPathId={makerPathId}
        modules={modules}
        onBuildDto={onBuildDto}
        onAssemble={onAssemble}
        onValidate={onValidate}
        assembleCtaLabel={t?.assembler?.notebook?.assembleCta ?? 'Assemble notebook'}
        validateCtaLabel={t?.assembler?.notebook?.validateCta ?? 'Validate'}
      />

      {assembleInfo.status !== 'idle' && (
        <div>
          {assembleInfo.message}
        </div>
      )}
    </div>
  );
};

export default NotebookAssemblerLite;
