import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Copy, Globe, Loader2, Lock } from 'lucide-react';
import { createObject, copyObjectToRag } from '@core/objects';
import { createProductFromTemplate, getOrCreateProductByType, getProduct, getPublicProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { httpClient, tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

type PipelineStep = 'input' | 'profiling' | 'persona' | 'matching' | 'landing';
type TabId = 'landing' | 'persona' | 'matching' | 'osint' | 'code' | 'email';

const DEFAULT_CATALOG = `Catalogo de servicios AI Maker Fablab:
1. Dashboard IA personalizado — Tablero inteligente con KPIs en tiempo real y asistente conversacional integrado.
2. Automatizacion de procesos con n8n — Workflows automatizados sin codigo para tareas repetitivas.
3. Asistente IA interno — Chatbot entrenado con los documentos y procesos de la empresa.
4. Generador visual IA — Transformacion de fotos de producto en visuales profesionales.
5. Formacion IA sur mesure — Programa de capacitacion adaptado al equipo.
6. Aplicacion web sur mesure — Desarrollo de apps internas o client-facing con IA integrada.
7. RAG Multimodal — Sistema de busqueda inteligente sobre documentos e imagenes.
8. Audit IA & Strategie — Diagnostico de madurez IA + roadmap de implementacion.`;

const B2B_PROGRESS_STEP_ID = 11;

type B2BProgressRecord = {
  input: {
    email: string;
    url: string;
    catalog: string;
  };
  outputs: {
    osint: string;
    persona: string;
    matching: string;
    landingHtml: string;
    email: string;
  };
  lastCompletedStep: PipelineStep;
  updatedAt: string;
};

const renderMarkdown = (text: string): string => {
  if (!text) return '';
  const escape = (v: string) =>
    v
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');

  const formatInline = (line: string): string =>
    escape(line)
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
      .replace(/\[(confirmado)\]/gi, '<span class="text-emerald-300 font-semibold">[confirmado]</span>')
      .replace(/\[(probable)\]/gi, '<span class="text-amber-300 font-semibold">[probable]</span>')
      .replace(/\[(hipotesis|hipótesis)\]/gi, '<span class="text-violet-300 font-semibold">[hipotesis]</span>');

  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) return `<h3 class="text-teal-300 mt-4 mb-2 font-semibold">${formatInline(line.slice(3))}</h3>`;
      if (line.startsWith('# ')) return `<h2 class="text-white mt-4 mb-2 font-semibold">${formatInline(line.slice(2))}</h2>`;
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return `<p class="text-slate-300 mb-1"><span class="text-teal-400">•</span> ${formatInline(line.slice(2))}</p>`;
      }
      if (line.trim() === '') return '<div class="h-2"></div>';
      return `<p class="text-slate-300 mb-1">${formatInline(line)}</p>`;
    })
    .join('');
};

const extractHtml = (raw: string): string => {
  const source = String(raw || '');
  const fencedBlocks = Array.from(source.matchAll(/```(?:html)?\s*([\s\S]*?)```/gi))
    .map((m) => String(m[1] || '').trim())
    .filter(Boolean);

  if (fencedBlocks.length > 0) {
    const preferred = fencedBlocks.find((block) => /<!doctype html|<html[\s>]|<body[\s>]/i.test(block));
    if (preferred) return preferred;
    return fencedBlocks.sort((a, b) => b.length - a.length)[0];
  }

  const htmlStart = source.match(/<!doctype html|<html[\s>]/i);
  if (htmlStart?.index !== undefined) {
    return source.slice(htmlStart.index).trim();
  }

  return source.trim();
};

const sanitizeLandingHtml = (raw: string): string => {
  return extractHtml(raw)
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
};

const isLandingHtmlIncomplete = (html: string): boolean => {
  if (!html) return true;
  const hasDoctype = /<!doctype html>/i.test(html);
  const hasHtmlOpen = /<html[\s>]/i.test(html);
  const hasHtmlClose = /<\/html>/i.test(html);
  const hasBodyOpen = /<body[\s>]/i.test(html);
  const hasBodyClose = /<\/body>/i.test(html);
  const hasUnclosedStyle = /<style[^>]*>/i.test(html) && !/<\/style>/i.test(html);
  const hasRenderableContent = /<(section|main|article|h1|h2|p|div|button|a)[\s>]/i.test(html);
  return !hasDoctype || !hasHtmlOpen || !hasHtmlClose || !hasBodyOpen || !hasBodyClose || hasUnclosedStyle || !hasRenderableContent;
};

const toFile = (content: string, name: string, mimeType: string): File => {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], name, { type: mimeType });
};

const resolveAiEndpoint = (): string => {
  const apiBase = String((import.meta as any)?.env?.VITE_API_URL || '').replace(/\/+$/, '');
  if (!apiBase) return '/api/ai';
  if (apiBase.endsWith('/api')) return `${apiBase}/ai`;
  return `${apiBase}/api/ai`;
};

const inferStepFromOutputs = (outputs: B2BProgressRecord['outputs']): PipelineStep => {
  if (outputs.landingHtml) return 'landing';
  if (outputs.matching) return 'matching';
  if (outputs.persona) return 'persona';
  if (outputs.osint) return 'profiling';
  return 'input';
};

const parseLegacyInput = (rawInput: unknown): { email: string; url: string } => {
  if (typeof rawInput !== 'string') return { email: '', url: '' };
  const emailMatch = rawInput.match(/Email:\s*(.+)/i);
  const urlMatch = rawInput.match(/URL:\s*(.+)/i);
  return {
    email: emailMatch?.[1]?.trim() || '',
    url: urlMatch?.[1]?.trim() || '',
  };
};

const ProfileB2BView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = (t.profileB2BViewTranslations ?? {}) as Record<string, string>;

  const isAuthenticated = !!tokenStorage.get();
  const [product, setProduct] = useState<Product | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [showCatalogEditor, setShowCatalogEditor] = useState(false);

  const [step, setStep] = useState<PipelineStep>('input');
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('landing');

  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState('');
  const [personaData, setPersonaData] = useState('');
  const [matchingData, setMatchingData] = useState('');
  const [landingHtml, setLandingHtml] = useState('');
  const [emailData, setEmailData] = useState('');

  const [copied, setCopied] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');
  const [notebookDescription, setNotebookDescription] = useState('');
  const [saveNotebookLoading, setSaveNotebookLoading] = useState(false);
  const [saveNotebookMessage, setSaveNotebookMessage] = useState('');

  const safeLandingHtml = useMemo(() => sanitizeLandingHtml(landingHtml), [landingHtml]);

  const buildRecordFromState = (
    overrides: Partial<{
      email: string;
      url: string;
      catalog: string;
      osint: string;
      persona: string;
      matching: string;
      landingHtml: string;
      emailOutput: string;
      lastCompletedStep: PipelineStep;
    }> = {}
  ): B2BProgressRecord => {
    const outputs = {
      osint: overrides.osint ?? profileData,
      persona: overrides.persona ?? personaData,
      matching: overrides.matching ?? matchingData,
      landingHtml: overrides.landingHtml ?? landingHtml,
      email: overrides.emailOutput ?? emailData,
    };

    return {
      input: {
        email: overrides.email ?? email,
        url: overrides.url ?? url,
        catalog: overrides.catalog ?? catalog,
      },
      outputs,
      lastCompletedStep: overrides.lastCompletedStep ?? inferStepFromOutputs(outputs),
      updatedAt: new Date().toISOString(),
    };
  };

  const progressSteps = useMemo(
    () => [
      { id: 'input', label: tr.stepCapture || 'Captura' },
      { id: 'profiling', label: tr.stepOsint || 'OSINT' },
      { id: 'persona', label: tr.stepPersona || 'RAG Persona' },
      { id: 'matching', label: tr.stepMatching || 'Matching' },
      { id: 'landing', label: tr.stepLanding || 'Pagina' },
    ],
    [tr]
  );

  const currentStepIndex = progressSteps.findIndex((s) => s.id === step);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        let targetId: number | null = id ? parseInt(id, 10) : null;

        if (!targetId) {
          const ensured = await getOrCreateProductByType('profile_b2b_maker', {
            title: t.products.fixed.profileB2BTitle || 'Profile B2B',
            description: t.products.fixed.profileB2BDesc || 'Perfilado B2B con IA para generar landing personalizada y matching comercial.',
          });
          targetId = ensured.id;
        }

        let loaded: Product;
        if (isAuthenticated) {
          try {
            loaded = await getProduct(targetId);
            setIsOwner(true);
          } catch {
            loaded = await getPublicProduct(targetId);
            setIsOwner(false);
          }
        } else {
          loaded = await getPublicProduct(targetId);
          setIsOwner(false);
        }

        setProduct(loaded);
      } catch (e) {
        console.error('[ProfileB2BView] load error', e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, isAuthenticated, t]);

  const persistB2BRecord = async (record: B2BProgressRecord) => {
    if (!product?.id || !isOwner) return;
    await updateProductStepProgress({
      productId: product.id,
      stepId: B2B_PROGRESS_STEP_ID,
      status: 'success',
      resultText: record,
    });
  };

  useEffect(() => {
    const loadProgress = async () => {
      if (!product?.id || !isOwner) return;

      try {
        const allProgress = await getProductStepProgress(product.id);
        if (!Array.isArray(allProgress) || allProgress.length === 0) return;

        const byStep = new Map(allProgress.map((item) => [Number(item.stepId), item]));
        const main = byStep.get(B2B_PROGRESS_STEP_ID);

        const current = main?.resultText as any;
        const isCurrentFormat =
          current &&
          typeof current === 'object' &&
          current.input &&
          typeof current.input === 'object' &&
          current.outputs &&
          typeof current.outputs === 'object';

        let record: B2BProgressRecord | null = null;
        let needsMigration = false;

        if (isCurrentFormat) {
          const outputBlock = current.outputs as Record<string, unknown>;
          record = {
            input: {
              email: String(current.input?.email || ''),
              url: String(current.input?.url || ''),
              catalog: String(current.input?.catalog || DEFAULT_CATALOG),
            },
            outputs: {
              osint: String(outputBlock.osint || ''),
              persona: String(outputBlock.persona || ''),
              matching: String(outputBlock.matching || ''),
              landingHtml: String(outputBlock.landingHtml || ''),
              email: String(outputBlock.email || ''),
            },
            lastCompletedStep: inferStepFromOutputs({
              osint: String(outputBlock.osint || ''),
              persona: String(outputBlock.persona || ''),
              matching: String(outputBlock.matching || ''),
              landingHtml: String(outputBlock.landingHtml || ''),
              email: String(outputBlock.email || ''),
            }),
            updatedAt: String(current.updatedAt || new Date().toISOString()),
          };
        } else {
          const legacy11 = byStep.get(11)?.resultText as any;
          const legacy12 = byStep.get(12)?.resultText as any;
          const legacy13 = byStep.get(13)?.resultText as any;
          const legacy14 = byStep.get(14)?.resultText as any;
          const legacy15 = byStep.get(15)?.resultText as any;

          const parsedLegacyInput = parseLegacyInput(legacy11?.input);
          const legacyLandingOutput = String(legacy14?.output || '');

          const outputs = {
            osint: String(legacy11?.output || ''),
            persona: String(legacy12?.output || ''),
            matching: String(legacy13?.output || ''),
            landingHtml: String(legacy14?.html || extractHtml(legacyLandingOutput || '')),
            email: String(legacy15?.output || ''),
          };

          const hasLegacyData = Boolean(outputs.osint || outputs.persona || outputs.matching || outputs.landingHtml || outputs.email);
          if (hasLegacyData) {
            record = {
              input: {
                email: parsedLegacyInput.email,
                url: parsedLegacyInput.url,
                catalog: String(legacy13?.catalog || DEFAULT_CATALOG),
              },
              outputs,
              lastCompletedStep: inferStepFromOutputs(outputs),
              updatedAt: new Date().toISOString(),
            };
            needsMigration = true;
          }
        }

        if (!record) return;

        setEmail(record.input.email || '');
        setUrl(record.input.url || '');
        setCatalog(record.input.catalog || DEFAULT_CATALOG);

        setProfileData(record.outputs.osint || '');
        setPersonaData(record.outputs.persona || '');
        setMatchingData(record.outputs.matching || '');
        setLandingHtml(record.outputs.landingHtml || '');
        setEmailData(record.outputs.email || '');

        const recoveredStep = inferStepFromOutputs(record.outputs);
        setStep(recoveredStep);

        if (record.outputs.landingHtml) {
          setActiveTab('landing');
        }

        if (needsMigration) {
          await persistB2BRecord(record);
        }
      } catch (err) {
        console.error('[ProfileB2BView] error loading persisted progress', err);
      }
    };

    loadProgress();
  }, [product?.id, isOwner]);

  const callAi = async (system: string, userPrompt: string, options?: { maxTokens?: number }): Promise<string> => {
    if (!product?.id) throw new Error(tr.productMissing || 'Producto no disponible.');
    const maxTokens = Number(options?.maxTokens || 4000);

    const toErrorMessage = (err: unknown): string => {
      if (err instanceof Error && err.message) return err.message;
      return String(err || 'unknown_error');
    };

    const callGeminiGenerateFallback = async (reason: string): Promise<string> => {
      try {
        const prompt = [
          'SYSTEM INSTRUCTIONS:',
          system,
          '',
          'USER REQUEST:',
          userPrompt,
        ].join('\n');

        const generated = await httpClient.post<{ text?: string; content?: string }>('/api/v1/gemini/generate', {
          prompt,
          options: {
            maxTokens,
            temperature: 0.2,
          },
        });

        const text = String(generated?.text || generated?.content || '').trim();
        if (!text) {
          throw new Error('Gemini fallback devolvio contenido vacio');
        }

        return text;
      } catch (err) {
        throw new Error(`IA fallback error (${reason}): ${toErrorMessage(err)}`);
      }
    };

    const response = await fetch(resolveAiEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'gemini',
        product_id: product.id,
        system,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: maxTokens,
      }),
    });

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    const raw = await response.text();
    let data: any = null;

    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (contentType.includes('text/html')) {
      return callGeminiGenerateFallback(`proxy_html_status_${response.status}`);
    }

    if (!data) {
      const looksLikeHtml = raw.trim().startsWith('<!doctype') || raw.trim().startsWith('<html') || raw.trim().startsWith('<');
      if (looksLikeHtml) {
        return callGeminiGenerateFallback(`proxy_non_json_html_status_${response.status}`);
      }
      return callGeminiGenerateFallback(`proxy_non_json_status_${response.status}`);
    }

    if (!response.ok || !data.ok) {
      const proxyError = String(data?.error || `proxy_http_${response.status}`);
      try {
        return await callGeminiGenerateFallback(`proxy_error_${proxyError}`);
      } catch (fallbackErr) {
        throw new Error(`Proxy error: ${proxyError} | ${toErrorMessage(fallbackErr)}`);
      }
    }

    const finalText = String(data.text || '').trim();
    if (!finalText) {
      return callGeminiGenerateFallback(`proxy_empty_text_status_${response.status}`);
    }

    return finalText;
  };

  const startPipeline = async () => {
    if (running) return;
    if (!email.trim() && !url.trim()) {
      setError(tr.needEmailOrUrl || 'Introduce al menos un email o una URL.');
      return;
    }

    setError('');
    setRunning(true);
    setSaveNotebookMessage('');

    setProfileData('');
    setPersonaData('');
    setMatchingData('');
    setLandingHtml('');
    setEmailData('');

    const input = [email ? `Email: ${email}` : '', url ? `URL: ${url}` : ''].filter(Boolean).join('\n');

    try {
      setStep('profiling');
      const osint = await callAi(
        `Eres un experto en inteligencia comercial B2B y OSINT. Investiga a una persona o empresa con fuentes publicas.\n\nEstructura:\n## Datos encontrados\n## Empresa\n## Persona\n## Senales recientes\n## Hipotesis\n## Nivel de confianza`,
        `Investiga este prospecto B2B:\n${input}\n\nBusca informacion real y publica, y cita evidencias.`
      );
      setProfileData(osint);
      await persistB2BRecord(buildRecordFromState({
        osint,
        persona: '',
        matching: '',
        landingHtml: '',
        emailOutput: '',
        lastCompletedStep: 'profiling',
      }));

      setStep('persona');
      const persona = await callAi(
        `Eres un generador de RAG Persona para prospeccion B2B.\n\nGenera estas 8 secciones:\n## 1. Identidad\n## 2. Contexto empresa\n## 3. Trayectoria\n## 4. Competencias\n## 5. Pain points\n## 6. Intereses y valores\n## 7. Senales de compra\n## 8. Tono y estilo`,
        `Genera el RAG Persona a partir de:\n\n${osint}`
      );
      setPersonaData(persona);
      await persistB2BRecord(buildRecordFromState({
        osint,
        persona,
        matching: '',
        landingHtml: '',
        emailOutput: '',
        lastCompletedStep: 'persona',
      }));

      setStep('matching');
      const matching = await callAi(
        `Eres un motor de matching comercial B2B. Cruza pain points con un catalogo de servicios.\n\nPara maximo 3 servicios:\n## Servicio N\n- Pain point que resuelve\n- Relevancia especifica\n- Argumento de venta\n- Caso de uso\n- Score X/10\n\nOrdena por score desc.`,
        `RAG Persona:\n${persona}\n\nCatalogo:\n${catalog}\n\nGenera matching de 3 servicios relevantes.`
      );
      setMatchingData(matching);
      await persistB2BRecord(buildRecordFromState({
        osint,
        persona,
        matching,
        landingHtml: '',
        emailOutput: '',
        lastCompletedStep: 'matching',
      }));

      setStep('landing');
      const landing = await callAi(
        `Eres un senior web designer + copywriter B2B. Debes devolver SOLO HTML completo (sin markdown), profesional y elegante, siguiendo una estetica muy cercana a un dashboard dark premium.\n\nREQUISITOS ESTRICTOS DE SALIDA:\n- Responder solo con HTML completo y valido: <!DOCTYPE html> + <html> + <head> + <body>\n- Incluir CSS dentro de <style>\n- NO usar JavaScript\n- Responsive real (desktop + mobile)\n- Mantener el HTML en un rango moderado (aprox 180-300 lineas) para evitar truncamientos\n\nGUIA VISUAL (obligatoria):\n- Tipografia: usar Google Fonts Inter (principal) y JetBrains Mono (detalles tecnicos)\n- Paleta tipo AI Maker: fondo #060a13 / #0b1120, tarjetas #111827, acentos teal #0d9488 y coral #f97066\n- Bordes suaves, sombras ligeras, contraste alto, aspecto moderno y limpio\n- Animaciones CSS sutiles (fade-up, pulse suave) para dinamismo\n- Definir variables CSS en :root con estos nombres: --bg-deep, --bg-base, --bg-card, --border, --teal, --coral, --text-primary, --text-secondary\n- Reforzar bloques visuales en este orden: hero destacado, cards con badge de relevancia, bloque de beneficios, CTA final\n\nESTRUCTURA OBLIGATORIA DE LA LANDING:\n1) Hero personalizado con nombre/empresa y su desafio principal\n2) Bloque breve de contexto del prospecto (insights clave del analisis)\n3) Grid de 3 servicios recomendados (card por servicio con: titulo, problema que resuelve, resultado esperado, badge de relevancia)\n4) Bloque de beneficios medibles (3-4 bullets claros y concretos)\n5) CTA principal visible: "Agendar 15 min"\n6) Footer: "Propuesta generada por AI Maker Fablab"\n\nREGLAS DE COPY:\n- Texto claro, profesional y accionable\n- Hablar especificamente de esta empresa/persona, sin frases genericas\n- Evitar exageraciones; mostrar propuesta realista\n\nIMPORTANTE:\n- Si falta algun dato, usar una formulacion neutra y profesional, pero nunca dejar secciones vacias\n- No devolver explicaciones fuera del HTML`,
        `Genera una landing B2B personalizada usando estos insumos:\n\nOSINT:\n${osint}\n\nRAG Persona:\n${persona}\n\nServicios recomendados:\n${matching}`,
        { maxTokens: 7000 }
      );
      let html = sanitizeLandingHtml(landing);

      if (isLandingHtmlIncomplete(html)) {
        try {
          const repairedLanding = await callAi(
            `Eres un desarrollador frontend senior. Debes reparar y completar un HTML de landing B2B incompleto manteniendo la misma direccion visual dark/teal/coral.\n\nREGLAS OBLIGATORIAS:\n- Responde SOLO con HTML completo y valido\n- Debe empezar con <!DOCTYPE html>\n- Debe incluir <html>, <head>, <body>, y todos los cierres\n- Sin markdown y sin explicaciones fuera del HTML\n- Mantener enfoque profesional, limpio y moderno`,
            `Repara y completa este HTML para que quede totalmente funcional y visualmente consistente:\n\n${html}\n\nContexto del prospecto:\n${persona}\n\nServicios:\n${matching}`,
            { maxTokens: 7000 }
          );

          const repaired = sanitizeLandingHtml(repairedLanding);
          if (repaired && !isLandingHtmlIncomplete(repaired)) {
            html = repaired;
          }
        } catch (repairErr) {
          console.warn('[ProfileB2BView] landing repair failed, keeping first HTML', repairErr);
        }
      }

      if (isLandingHtmlIncomplete(html)) {
        throw new Error(tr.aiLandingIncomplete || 'La IA devolvio un HTML incompleto para la landing. Reintenta la ejecucion.');
      }

      setLandingHtml(html);
      setActiveTab('landing');
      await persistB2BRecord(buildRecordFromState({
        osint,
        persona,
        matching,
        landingHtml: html,
        emailOutput: '',
        lastCompletedStep: 'landing',
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : tr.pipelineError || 'Error ejecutando el pipeline.';
      setError(msg);
      setStep('input');
    } finally {
      setRunning(false);
    }
  };

  const handleResetToStepOne = async () => {
    if (running) return;

    setError('');
    setStep('input');
    setActiveTab('landing');
    setProfileData('');
    setPersonaData('');
    setMatchingData('');
    setLandingHtml('');
    setEmailData('');
    setSaveNotebookMessage('');

    if (isOwner && product?.id) {
      try {
        await persistB2BRecord(
          buildRecordFromState({
            osint: '',
            persona: '',
            matching: '',
            landingHtml: '',
            emailOutput: '',
            lastCompletedStep: 'input',
          })
        );
      } catch (err) {
        console.error('[ProfileB2BView] reset persistence error', err);
      }
    }
  };

  const generateEmail = async () => {
    if (!personaData || !matchingData) return;
    try {
      const out = await callAi(
        `Eres experto en copywriting B2B. Genera 3 variantes de email de primer contacto.\n\nFormato:\n## Variante N\nAsunto: ...\nCuerpo: ...\n\nMaximo 120 palabras cada uno.`,
        `RAG Persona:\n${personaData}\n\nMatching:\n${matchingData}`
      );
      setEmailData(out);
      await persistB2BRecord(buildRecordFromState({
        emailOutput: out,
        lastCompletedStep: inferStepFromOutputs({
          osint: profileData,
          persona: personaData,
          matching: matchingData,
          landingHtml,
          email: out,
        }),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : tr.emailError || 'No se pudo generar email.');
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleDownloadHtml = () => {
    if (!safeLandingHtml) return;
    const blob = new Blob([safeLandingHtml], { type: 'text/html;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'landing-prospecto.html';
    a.click();
    URL.revokeObjectURL(href);
  };

  const openInNewTab = () => {
    if (!safeLandingHtml) return;
    const blob = new Blob([safeLandingHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) {
      URL.revokeObjectURL(url);
      return;
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const buildNotebookPayload = (): string => {
    return [
      '# Profile B2B - Resultado',
      '',
      '## Input',
      `- Email: ${email || '-'}`,
      `- URL: ${url || '-'}`,
      '',
      '## OSINT',
      profileData || '-',
      '',
      '## RAG Persona',
      personaData || '-',
      '',
      '## Matching',
      matchingData || '-',
      '',
      '## Landing HTML',
      '```html',
      safeLandingHtml || '',
      '```',
      '',
      emailData
        ? `## Emails\n${emailData}`
        : '## Emails\nNo generado.',
    ].join('\n');
  };

  const handleSaveToNotebook = async () => {
    const title = notebookTitle.trim();
    const description = notebookDescription.trim();

    if (!title) {
      setSaveNotebookMessage(tr.notebookTitleRequired || 'Debes indicar un titulo para el notebook.');
      return;
    }

    if (!safeLandingHtml) {
      setSaveNotebookMessage(tr.notebookNoContent || 'Primero ejecuta el pipeline para generar contenido.');
      return;
    }

    try {
      setSaveNotebookLoading(true);
      setSaveNotebookMessage('');

      const notebook = await createProductFromTemplate('rag_chat_maker', title, description);
      const notebookId = Number(notebook.id);
      let ragId = Number((notebook as any)?.rag?.id || 0);

      if (!ragId) {
        const full = await getProduct(notebookId);
        ragId = Number((full as any)?.rag?.id || 0);
      }

      const now = Date.now();
      const artifacts: Array<{ file: File; type: 'TEXT' | 'HTML'; module: string }> = [
        {
          file: toFile(profileData || 'Sin contenido OSINT.', `profile-b2b-osint-${now}.txt`, 'text/plain;charset=utf-8'),
          type: 'TEXT',
          module: 'profile_b2b_osint',
        },
        {
          file: toFile(personaData || 'Sin contenido de persona.', `profile-b2b-rag-persona-${now}.txt`, 'text/plain;charset=utf-8'),
          type: 'TEXT',
          module: 'profile_b2b_persona',
        },
        {
          file: toFile(matchingData || 'Sin contenido de matching.', `profile-b2b-matching-${now}.txt`, 'text/plain;charset=utf-8'),
          type: 'TEXT',
          module: 'profile_b2b_matching',
        },
        {
          file: toFile(safeLandingHtml || 'Sin codigo HTML generado.', `profile-b2b-landing-code-${now}.txt`, 'text/plain;charset=utf-8'),
          type: 'TEXT',
          module: 'profile_b2b_landing_code',
        },
        {
          file: toFile(safeLandingHtml || '<!DOCTYPE html><html><body><h1>Sin landing generada</h1></body></html>', `profile-b2b-landing-page-${now}.html`, 'text/html;charset=utf-8'),
          type: 'HTML',
          module: 'profile_b2b_landing_page',
        },
      ];

      if (emailData.trim()) {
        artifacts.push({
          file: toFile(emailData, `profile-b2b-email-${now}.txt`, 'text/plain;charset=utf-8'),
          type: 'TEXT',
          module: 'profile_b2b_email',
        });
      }

      artifacts.push({
        file: toFile(buildNotebookPayload(), `profile-b2b-resumen-${now}.txt`, 'text/plain;charset=utf-8'),
        type: 'TEXT',
        module: 'profile_b2b_summary',
      });

      const createdObjects = await Promise.all(
        artifacts.map((artifact) =>
          createObject({
            title: artifact.file.name,
            type: artifact.type,
            file: artifact.file,
            product_type_for_assembly: 'profile_b2b_maker',
            module_name_for_assembly: artifact.module,
          })
        )
      );

      if (ragId) {
        await Promise.all(
          createdObjects
            .filter((obj) => obj?.id !== undefined && obj?.id !== null)
            .map((obj) => copyObjectToRag({ object_id: Number(obj.id), rag_id: ragId }))
        );
      }

      setSaveModalOpen(false);
      navigate(`/product/notebook/${notebookId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : tr.notebookCreateError || 'No se pudo crear el notebook con el contenido.';
      setSaveNotebookMessage(msg);
    } finally {
      setSaveNotebookLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        {t.common.loading || 'Loading...'}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-red-600">
        {tr.notFound || 'Producto no encontrado o no es publico.'}
      </div>
    );
  }

  const readOnly = !isOwner;
  const canShowFinalTabs = step === 'landing' && !!safeLandingHtml;

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-xl border border-slate-700 bg-[#0b1120] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/context')}
                className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                  {t.products.fixed.productLabel || 'Producto fijo'}
                </div>
                <h1 className="mt-3 text-2xl font-bold">{tr.title || t.products.fixed.profileB2BTitle || 'Profiler B2B'}</h1>
                <p className="mt-1 text-sm text-slate-400">
                  {tr.subtitle || t.products.fixed.profileB2BDesc || 'Del email o URL a una propuesta comercial personalizada con IA.'}
                </p>
                <p className="mt-2 text-xs text-emerald-300">{tr.backendConnected || 'Conectado internamente al backend. No requiere API key manual en UI.'}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300">
              {product.isPublic ? <Globe size={14} /> : <Lock size={14} />}
              {product.isPublic ? (tr.publicLabel || 'Publico') : (tr.privateLabel || 'Privado')}
            </div>
          </div>

          {readOnly && (
            <p className="mt-3 rounded border border-amber-700 bg-amber-900/20 px-3 py-2 text-xs text-amber-300">
              {tr.readOnly || 'Modo solo lectura en producto publico.'}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#0b1120] p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {progressSteps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2 min-w-fit">
                  <div className={`h-7 w-7 rounded-full border-2 text-[11px] font-semibold flex items-center justify-center ${index < currentStepIndex ? 'bg-teal-700 border-teal-500 text-white' : index === currentStepIndex ? 'bg-teal-600 border-teal-500 text-white' : 'border-slate-600 text-slate-400'}`}>
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs ${index === currentStepIndex ? 'text-white font-semibold' : 'text-slate-400'}`}>{s.label}</span>
                </div>
                {index < progressSteps.length - 1 && <div className={`h-[2px] w-8 ${index < currentStepIndex ? 'bg-teal-600' : 'bg-slate-700'}`} />}
              </React.Fragment>
            ))}
          </div>

          {!readOnly && step !== 'input' && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleResetToStepOne}
                disabled={running}
                className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                {tr.resetToStepOne || 'Volver al paso 1'}
              </button>
            </div>
          )}
        </div>

        {step === 'input' && (
          <div className="rounded-xl border border-slate-700 bg-[#0b1120] p-5 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{tr.inputTitle || 'Del email al servicio personalizado'}</h2>
              <p className="text-slate-400 text-sm mt-1">{tr.inputSubtitle || 'Introduce email o URL. La IA investiga, perfila, hace matching y genera landing.'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">{tr.emailLabel || 'Email del prospecto'}</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                  placeholder="contacto@empresa.com"
                  disabled={running || readOnly}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">{tr.urlLabel || 'URL del sitio web'}</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                  placeholder="https://empresa.com"
                  disabled={running || readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCatalogEditor((prev) => !prev)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showCatalogEditor
                  ? (tr.hideCatalogEditor || 'Ocultar catalogo de servicios')
                  : (tr.showCatalogEditor || 'Personalizar catalogo de servicios')}
              </button>

              {showCatalogEditor && (
                <textarea
                  value={catalog}
                  onChange={(e) => setCatalog(e.target.value)}
                  rows={8}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-mono"
                  aria-label={tr.catalogLabel || 'Catalogo de servicios'}
                  disabled={running || readOnly}
                />
              )}
            </div>

            {error && <div className="rounded border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-300">{error}</div>}

            <button
              onClick={startPipeline}
              disabled={running || readOnly}
              className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {running ? (tr.running || 'Ejecutando pipeline...') : (tr.runPipeline || 'Lanzar pipeline de perfilado')}
            </button>
          </div>
        )}

        {step !== 'input' && !canShowFinalTabs && (
          <div className="rounded-xl border border-slate-700 bg-[#0b1120] p-5">
            <div className="inline-flex items-center gap-2 rounded bg-teal-900/30 px-3 py-1 text-xs text-teal-300">
              <Loader2 size={12} className={running ? 'animate-spin' : ''} />
              {tr.processing || 'Procesando pipeline...'}
            </div>
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-4 min-h-[240px]">
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(
                    step === 'profiling'
                      ? profileData
                      : step === 'persona'
                        ? personaData
                        : step === 'matching'
                          ? matchingData
                          : landingHtml || (running ? (tr.generatingLanding || 'Generando landing...') : '')
                  ),
                }}
              />
            </div>
          </div>
        )}

        {canShowFinalTabs && (
          <div className="rounded-xl border border-slate-700 bg-[#0b1120] p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {([
                ['landing', tr.tabLanding || 'Pagina generada'],
                ['persona', tr.tabPersona || 'RAG Persona'],
                ['matching', tr.tabMatching || 'Matching'],
                ['osint', tr.tabOsint || 'OSINT'],
                ['code', tr.tabCode || 'HTML'],
                ['email', tr.tabEmail || 'Email'],
              ] as Array<[TabId, string]>).map(([idTab, label]) => (
                <button
                  key={idTab}
                  onClick={() => setActiveTab(idTab)}
                  className={`rounded px-3 py-1.5 text-xs ${activeTab === idTab ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'landing' && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleDownloadHtml} className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-200">{tr.downloadHtml || 'Descargar HTML'}</button>
                  <button onClick={() => handleCopy(safeLandingHtml)} className="inline-flex items-center gap-1 rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-200">
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? (tr.copied || 'Copiado') : (tr.copyCode || 'Copiar codigo')}
                  </button>
                  <button onClick={openInNewTab} className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-200">{tr.openNewTab || 'Abrir en nueva pestana'}</button>
                </div>
                <iframe title="landing-preview" srcDoc={safeLandingHtml} className="w-full h-[680px] rounded border border-slate-700 bg-white" />
              </>
            )}

            {activeTab === 'persona' && (
              <div className="rounded border border-slate-700 bg-slate-900 p-4 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(personaData) }} />
            )}

            {activeTab === 'matching' && (
              <div className="rounded border border-slate-700 bg-slate-900 p-4 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(matchingData) }} />
            )}

            {activeTab === 'osint' && (
              <div className="rounded border border-slate-700 bg-slate-900 p-4 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(profileData) }} />
            )}

            {activeTab === 'code' && (
              <pre className="rounded border border-slate-700 bg-slate-900 p-4 text-xs text-slate-300 overflow-auto max-h-[560px]">{safeLandingHtml}</pre>
            )}

            {activeTab === 'email' && (
              <div className="space-y-2">
                {!emailData ? (
                  <button onClick={generateEmail} className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-200">{tr.generateEmail || 'Generar email de primer contacto'}</button>
                ) : null}
                <div className="rounded border border-slate-700 bg-slate-900 p-4 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(emailData || tr.emailEmpty || 'Genera los emails para verlos aqui.') }} />
              </div>
            )}

            <div className="rounded-lg border border-teal-700/40 bg-teal-900/20 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-teal-200">{tr.saveNotebookTitle || 'Guardar informacion en un notebook'}</h3>
                <p className="text-xs text-teal-100/80">{tr.saveNotebookDesc || 'Crea un notebook y cargamos automaticamente todo lo generado como fuente.'}</p>
              </div>
              <button onClick={() => setSaveModalOpen(true)} className="inline-flex items-center gap-2 rounded bg-teal-600 px-4 py-2 text-xs font-semibold text-white">
                <BookOpen size={14} />
                {tr.saveNotebookButton || 'Guardar contenido en notebook'}
              </button>
            </div>
          </div>
        )}

        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#0b1120] p-6">
              <h3 className="text-lg font-bold text-white mb-1">{tr.modalTitle || 'Crear notebook con contenido B2B'}</h3>
              <p className="text-sm text-slate-400 mb-4">{tr.modalDesc || 'Define titulo y descripcion. El contenido generado se cargara automaticamente.'}</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">{t.productModal.title || 'Titulo'}</label>
                  <input value={notebookTitle} onChange={(e) => setNotebookTitle(e.target.value)} className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">{t.productModal.description || 'Descripcion'}</label>
                  <textarea value={notebookDescription} onChange={(e) => setNotebookDescription(e.target.value)} rows={3} className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm" />
                </div>
                {saveNotebookMessage && <p className="text-sm text-red-300">{saveNotebookMessage}</p>}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setSaveModalOpen(false)} disabled={saveNotebookLoading} className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-300">{t.productModal.cancel || 'Cancelar'}</button>
                <button onClick={handleSaveToNotebook} disabled={saveNotebookLoading} className="rounded bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {saveNotebookLoading ? (tr.savingNotebook || 'Guardando...') : (tr.confirmSaveNotebook || 'Crear notebook')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileB2BView;
