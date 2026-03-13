import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../language/useLanguage';
import { tokenStorage } from '@core/api/http.client';
import AssemblerLayout, { AssemblerModule, SelectionState } from './components/AssemblerLayout';

const LandingPageAssembler: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const makerPathId = useMemo(() => Number(searchParams.get('id') || '0'), [searchParams]);
  const [assembleResultMsg, setAssembleResultMsg] = useState<string | null>(null);
  const [isRunningExample, setIsRunningExample] = useState<boolean>(false);
  const [exampleResultMsg, setExampleResultMsg] = useState<string | null>(null);
  const [exampleHtmlPath, setExampleHtmlPath] = useState<string | null>(null);

  const modules: AssemblerModule[] = useMemo(() => {
    const lp = t?.assembler?.landing_page;
    const m = lp?.modules;
    return [
      {
        index: 1,
        key: 'css_generator',
        title: m?.cssGenerator?.title ?? 'CSS Generator (CONFIG)',
        description: m?.cssGenerator?.description ?? 'Instruction used to synthesize a CSS file.',
        type: 'CONFIG',
        selectable: false,
      },
      {
        index: 2,
        key: 'header',
        title: m?.header?.title ?? 'Header (HTML)',
        description: m?.header?.description ?? 'HTML snippet for page header.',
        type: 'HTML',
        selectable: true,
      },
      {
        index: 3,
        key: 'body',
        title: m?.body?.title ?? 'Body (HTML)',
        description: m?.body?.description ?? 'HTML snippet for main content.',
        type: 'HTML',
        selectable: true,
      },
      {
        index: 4,
        key: 'footer',
        title: m?.footer?.title ?? 'Footer (HTML)',
        description: m?.footer?.description ?? 'HTML snippet for footer.',
        type: 'HTML',
        selectable: true,
      },
    ];
  }, [t]);

  const onBuildDto = (selections: SelectionState) => {
    const headerId = selections['header']?.object_id;
    const bodyId = selections['body']?.object_id;
    const footerId = selections['footer']?.object_id;
    return {
      PRODUCT_TYPE: 'landing_page',
      MAKER_PATH_ID: makerPathId,
      INPUT_MODULES: [
        { index: 2, module_name_for_assembly: 'header', object_id: headerId },
        { index: 3, module_name_for_assembly: 'body', object_id: bodyId },
        { index: 4, module_name_for_assembly: 'footer', object_id: footerId },
      ],
    };
  };

  const onAssemble = async (dto: any) => {
    const token = tokenStorage.get();
    const base = (import.meta as any).env?.VITE_API_URL as string | undefined;
    const baseUrl = base ? base.replace(/\/$/, '') : '';
    const res = await fetch(`${baseUrl}/api/v1/assembler/landing_page/assemble`, {
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
      const msg = (body && (body.error?.message || body.message || body.error)) || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    setAssembleResultMsg(
      t?.assembler?.landing_page?.assembledOk ?? 'Landing page assembled. You can open the generated index.html below.'
    );
  };

  const uploadsHref = `/uploads/assembler/${makerPathId}/index.html`;
  const tr = t?.assembler?.landing_page ?? {};
  const apiBase = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

  const onRunExample = async () => {
    if (!makerPathId || makerPathId <= 0 || isRunningExample) return;
    setIsRunningExample(true);
    setExampleResultMsg(null);
    setExampleHtmlPath(null);
    try {
      const token = tokenStorage.get();
      const res = await fetch(`${apiBase}/api/v1/assembler/landing_page/examples/assemble`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          MAKER_PATH_ID: makerPathId,
          // VARIABLES is optional; omit by default. You may provide css_generator_instruction_text here if you add a UI input.
        }),
      });
      const ct = res.headers.get('Content-Type') || '';
      const isJson = ct.includes('application/json');
      const body = isJson ? await res.json() : null;
      if (!res.ok) {
        const msg = (body && (body.error?.message || body.message || body.error)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const data = body?.data ?? body ?? {};
      const htmlPath: string | undefined = data.html_path || data.htmlPath || (Array.isArray(data.files)
        ? (data.files.find((f: any) => f?.filename === 'a.htm')?.path || data.files.find((f: any) => f?.filename === 'a.htm')?.assembler_rel_path)
        : undefined);
      const finalHtmlPath = htmlPath && typeof htmlPath === 'string' && htmlPath.startsWith('/')
        ? htmlPath
        : `/uploads/assembler/${makerPathId}/a.htm`;
      setExampleHtmlPath(finalHtmlPath);
      setExampleResultMsg(tr.exampleAssembledOk ?? 'Example assembled. You can open the generated a.htm below.');
    } catch (e: any) {
      setExampleResultMsg(e?.message || 'Failed to run example.');
    } finally {
      setIsRunningExample(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tr.title ?? 'Landing Page Assembler'}</h1>
      {makerPathId <= 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          {tr.missingId ?? 'Missing maker_path id. Append ?id={maker_path_id} to the URL.'}
        </div>
      )}

      <AssemblerLayout
        productType="landing_page"
        makerPathId={makerPathId}
        modules={modules}
        onBuildDto={onBuildDto}
        onAssemble={onAssemble}
        assembleCtaLabel={tr.assembleCta ?? 'Assemble landing page'}
      />

      <div className="flex items-center gap-3">
        {makerPathId > 0 && (
          <a
            href={uploadsHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {tr.openResult ?? 'Open generated index.html'}
          </a>
        )}
        <button
          type="button"
          onClick={onRunExample}
          disabled={makerPathId <= 0 || isRunningExample}
          className={
            'inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ' +
            (makerPathId > 0 && !isRunningExample
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300')
          }
          title="POST /api/v1/assembler/landing_page/examples/assemble"
        >
          {isRunningExample ? (tr.runningExample ?? 'Running example...') : (tr.runExampleCta ?? 'Run Example')}
        </button>
      </div>

      {assembleResultMsg && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-100">
          {assembleResultMsg}
        </div>
      )}

      {exampleResultMsg && (
        <div className="space-y-3">
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-100">
            {exampleResultMsg}
          </div>
          {exampleHtmlPath && (
            <a
              href={exampleHtmlPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {tr.openExampleResult ?? 'Open example a.htm'}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default LandingPageAssembler;
