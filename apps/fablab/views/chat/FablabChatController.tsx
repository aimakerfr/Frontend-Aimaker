import React, { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({ startOnLoad: false, theme: 'default' });
import './style.css';
import 'katex/dist/katex.min.css';

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageDown,
  Loader2,
  MessageSquare,
  Mic,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  Video,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  providerChat,
  providerTestModel,
  type ProviderChatMessage,
  type ProviderChatResponse,
} from '@core/api-key-runtime';
import {
  createObject,
  getAllObjects,
  getObjectDownloadBase64,
  getObjectDownloadText,
  getObjectFolders,
  type ObjectFolder,
  type ObjectItem,
} from '@core/objects';
import {
  loadFablabChatRuntimeState,
  resolveRuntimeFromConfig,
  saveFablabChatConversation,
  saveFablabChatRuntimeConfig,
  saveFablabChatStats,
  type FablabChatAttachment,
  type FablabChatMessage,
  type FablabChatRuntimeConfig,
  type FablabChatRuntimeState,
} from '@core/fablab-chat';
import {
  getChatRoles,
  getChatSkills,
  createChatRole,
  createChatSkill,
  updateChatRole,
  updateChatSkill,
  deleteChatRole,
  deleteChatSkill,
  type ChatSkill,
} from '@core/chat-skills';
import { HttpClientError } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';
import AssemblerModal from '../assembler/components/AssemblerModal';
import GenericObjectSelector from '@apps/fablab/modules/object-selector/View/Notebook/GenericObjectSelector';
import type { ObjectItem as SelectorObjectItem } from '@apps/fablab/modules/object-selector/services/api_handler';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import ChatSidebar from './components/ChatSidebar';
import RoleEditor from './components/RoleEditor';
import ChatSkillsEditor from './components/ChatSkillsEditor';
import type { RichOutput } from './types/chat.types';
import {
  buildHighlightedInputHtml,
  buildSystemPromptWithChatSkill,
  parseChatSkillFromInput,
} from './helpers/chatSkill.helpers';
import { generateDocumentPDF } from './helpers/chatPdf.helpers';

type SkillState = {
  search: boolean;
  summarize: boolean;
  projectAudit: boolean;
  image: boolean;
  other: boolean;
  audioSynthesis: boolean;
  audioTranscription: boolean;
  promptOptimize: boolean;
  roleOptimize: boolean;
};

type PendingAttachment = FablabChatAttachment & {
  file?: File;
};

type SourceMode = 'context' | 'role' | 'prompt' | null;

type RolePreset = ChatSkill;

type ProviderAttachment = NonNullable<ProviderChatMessage['attachments']>[number];

type GeneratedFileFormat = 'pdf' | 'txt' | 'md' | 'doc';

type GeneratedFileArtifact = {
  format: GeneratedFileFormat;
  fileName: string;
  mimeType: string;
  dataUrl: string;
};

const initialSkills: SkillState = {
  search: false,
  summarize: false,
  projectAudit: false,
  image: false,
  other: false,
  audioSynthesis: false,
  audioTranscription: false,
  promptOptimize: false,
  roleOptimize: false,
};

const sanitizeUiErrorMessage = (value: string): string => {
  const normalized = value
    .replace(/https?:\/\/\S+/gi, '[endpoint]')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  return normalized.length > 240 ? `${normalized.slice(0, 240)}...` : normalized;
};

const formatRuntimeErrorForUser = (error: unknown): string => {
  if (error instanceof HttpClientError) {
    const status = Number(error.status || 0);

    if (status === 400) {
      return 'El modelo no acepto esta solicitud. Revisa el tipo de modelo o la configuracion del prompt.';
    }
    if (status === 401 || status === 403) {
      return 'La API key no es valida o no tiene permisos para este modelo.';
    }
    if (status === 429) {
      return 'El proveedor alcanzo limite de uso. Intenta nuevamente en unos minutos.';
    }
    if (status === 502) {
      return 'El backend no pudo conectarse al proveedor de IA. Verifica red/certificados del servidor o estado del proveedor.';
    }
    if (status === 504) {
      return 'El proveedor tardo demasiado en responder. Intenta de nuevo.';
    }
    if (status >= 500) {
      return 'El backend tuvo un error al procesar la solicitud. Intenta nuevamente.';
    }

    const safe = sanitizeUiErrorMessage(error.message || '');
    if (safe) return safe;
  }

  if (error instanceof Error) {
    const safe = sanitizeUiErrorMessage(error.message || '');
    if (safe) return safe;
  }

  return 'No se pudo completar la solicitud. Intenta nuevamente.';
};

const toIsoNow = () => new Date().toISOString();
const RAW_DATA_IMAGE_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i;
const MARKDOWN_DATA_IMAGE_REGEX_GLOBAL = /!\[[^\]]*\]\((data:image[^)]+)\)/gi;
const IMAGE_URL_ONLY_REGEX = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i;
const INLINE_DATA_IMAGE_REGEX_GLOBAL = /data:image\/[^\s)]+/gi;
const GENERIC_DATA_URL_REGEX = /(data:[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9=._+-]+)*;base64,[A-Za-z0-9+/=]+)/i;
const MARKDOWN_DATA_LINK_REGEX = /\[[^\]]*\]\((data:[^)]+)\)/i;
const MARKDOWN_DATA_LINK_REGEX_GLOBAL = /\[[^\]]*\]\((data:[^)]+)\)/gi;
const MARKDOWN_EMPTY_LINK_REGEX_GLOBAL = /\[[^\]]*\]\(\s*\)/gi;
const MARKDOWN_SANDBOX_OR_FILE_LINK_REGEX_GLOBAL = /\[[^\]]*\]\(((?:sandbox|file):[^)]+)\)/gi;
const INLINE_DATA_PAYLOAD_REGEX_GLOBAL = /data:[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9=._+-]+)*;base64,[A-Za-z0-9+/=]+/gi;
const MARKDOWN_SANDBOX_LINK_REGEX_GLOBAL = /\[[^\]]*\]\((sandbox:[^)]+)\)/gi;
const INLINE_SANDBOX_URI_REGEX_GLOBAL = /\bsandbox:[^\s)]+/gi;
const INLINE_MNT_DATA_PATH_REGEX_GLOBAL = /\b\/mnt\/data\/[^\s)]+/gi;
const FILE_RESPONSE_META_LINE_REGEX = /^(te he generado|he generado|archivo generado|archivo listo|haz clic|click|descargar (pdf|archivo)|download (pdf|file)|si necesitas que incluya|if you need me to include)/i;
const CLARITY_QUESTIONS_BLOCK_REGEX = /\[CLARITY_QUESTIONS\]([\s\S]*?)\[\/CLARITY_QUESTIONS\]/i;
const CLARITY_QUESTION_PREFIX_REGEX = /^([-_*]|\d+[.)]|[a-zA-Z][.)])\s+/;

const DEFAULT_ROLE_PRESETS: Array<{ name: string; instruction: string }> = [
  {
    name: 'Ingeniero de software',
    instruction: 'Responde como un ingeniero de software experto. Prioriza mejores practicas, arquitectura, y soluciones robustas. Explica paso a paso tu razonamiento y si hay tradeoffs, muestralos con claridad.',
  },
  {
    name: 'Product Designer',
    instruction: 'Responde como un product designer senior. Enfatiza experiencia de usuario, flujo, claridad, y como el producto se siente. Incluye consideraciones de UI/UX y ejemplos concretos.',
  },
  {
    name: 'Marketing Strategist',
    instruction: 'Responde como un estratega de marketing. Enfoca en posicionamiento, audiencia, canales, growth, y narrativa. Entrega ideas accionables y orientadas a resultados.',
  },
  {
    name: 'Business Analyst',
    instruction: 'Responde como un analista de negocios. Prioriza datos, viabilidad, riesgos, costos y proyecciones. Presenta la informacion de forma estructurada y con supuestos claros.',
  },
  {
    name: 'Project Manager',
    instruction: 'Responde como un project manager. Organiza la informacion en planes de accion, milestones, riesgos y responsabilidades. Enfoca en ejecucion y seguimiento.',
  },
  {
    name: 'Copywriter',
    instruction: 'Responde como un copywriter experto. Enfoca en claridad, persuasion, tono, y mensajes concisos. Ofrece versiones alternativas cuando sea relevante.',
  },
  {
    name: 'Mentor',
    instruction: 'Responde como un mentor paciente y didactico. Explica conceptos con ejemplos simples y guia al usuario paso a paso, evitando tecnicismos innecesarios.',
  },
  {
    name: 'QA Engineer',
    instruction: 'Responde como un ingeniero de QA. Enfoca en calidad, testing, casos borde, validaciones y procesos para asegurar robustez.',
  },
  {
    name: 'Artista',
    instruction: 'Responde con enfoque creativo y sensorial. Propone ideas originales, estilo, color y referencias artisticas cuando aplique.',
  },
  {
    name: 'Filosofo',
    instruction: 'Responde con mirada filosofica y critica. Explora dilemas, fundamentos y perspectivas historicas cuando sea relevante.',
  },
  {
    name: 'Tony Stark',
    instruction: 'Actua como Tony Stark (Iron Man).\n\nPERSONALIDAD:\n- Arrogante, carismatico y auto-consciente de tu genialidad\n- Usas humor sarcastico y referencias pop culture\n- Confias en la tecnologia y la IA sobre todo lo demas\n\nESTILO DE LENGUAJE:\n- Frases como "I am Iron Man", "Genius, billionaire, playboy, philanthropist"\n- Tecnologias futuristas: JARVIS, nanotecnologia, arc reactor\n- Comparas todo con ingenieria Stark Industries\n\nTONO:\n- Confiado hasta el limite de la arrogancia (pero con razon)\n- Transformas problemas complejos en soluciones elegantes\n- Siempre buscas optimizar y mejorar\n\nFORMATO:\n- Inicia con una observacion brillante\n- Desarrolla la solucion paso a paso\n- Termina con un comentario ingenioso o referencia tecnologica',
  },
  {
    name: 'Dr. Gregory House',
    instruction: 'Actua como el Dr. Gregory House de House M.D.\n\nPERSONALIDAD:\n- Cinico, sarcastico y brutalmente honesto\n- Odias las reglas, la burocracia y las emociones exageradas\n- Eres un genio que ve conexiones donde otros no ven nada\n- Tienes dolor cronico en la pierna (mencionalo solo si es relevante)\n\nESTILO DE LENGUAJE:\n- Frases iconicas: "Everybody lies", "It\'s never lupus", "You\'re an idiot"\n- Interrumpes con preguntas incisivas cuando algo no cuadra\n- Diagnostico rapido y preciso, aunque ofenda\n\nTONO:\n- Directo, sin filtros, sin empatia fingida\n- Priorizas la verdad sobre los sentimientos\n- Humor negro y cinismo constante\n\nFORMATO:\n- Inicia con una observacion aguda sobre el problema\n- Desarrolla tu "diagnostico" paso a paso\n- Termina con una conclusion pragmatica o comentario cinico',
  },
  {
    name: 'Sherlock Holmes',
    instruction: 'Actua como Sherlock Holmes (version moderna o clasica).\n\nPERSONALIDAD:\n- Observador extremo, ves detalles que otros pasan por alto\n- Racional, logico, desprecias las emociones en el razonamiento\n- Aburrimiento rapido con lo obvio, excitacion por lo complejo\n\nESTILO DE LENGUAJE:\n- Deducciones rapidas: "Elemental, mi querido Watson" (o version moderna)\n- Explicas tu cadena de pensamiento paso a paso\n- Vocabulario preciso y occasionalmente ostentoso\n\nTONO:\n- Intelectualmente superior pero no malicioso\n- Impaciente con la mediocridad\n- Fascinado por los puzzles y misterios\n\nFORMATO:\n- Inicia con una deduccion sorprendente sobre el problema\n- Desarrolla tu razonamiento deductivo\n- Concluye con la solucion logica\n- Ocacionalmente menciona tu metodo cientifico',
  },
];

const DEFAULT_ROLE_NAMES = new Set(DEFAULT_ROLE_PRESETS.map((preset) => preset.name));

const guessObjectTypeFromFile = (file: File): string => {
  const name = file.name.toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() || '' : '';

  if (ext === 'md') return 'MD';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'].includes(ext)) return 'IMAGE';
  if (['mp4', 'mov', 'avi', 'mpeg', 'mpg', 'webm'].includes(ext)) return 'VIDEO';
  if (['html', 'htm'].includes(ext)) return 'HTML';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cs', 'php', 'rb', 'go', 'rs'].includes(ext)) return 'CODE';
  if (['json'].includes(ext)) return 'TRANSLATION';
  if (['yaml', 'yml', 'env', 'ini', 'toml'].includes(ext)) return 'CONFIG';
  return 'DOC';
};

const getFileBaseName = (fileName: string): string => {
  if (!fileName) return 'archivo';
  const idx = fileName.lastIndexOf('.');
  return idx > 0 ? fileName.slice(0, idx) : fileName;
};

type ClarityQuestionParseResult = {
  question: string;
  options: string[];
  strippedContent: string;
};

type ProjectAuditWizardStep = {
  question: string;
  kind: 'text' | 'options';
  placeholder?: string;
  optional?: boolean;
  options?: string[];
};

const PROJECT_AUDIT_OTHER_OPTION = 'Otra (escribir)';

const PROJECT_AUDIT_WIZARD_STEPS: ProjectAuditWizardStep[] = [
  {
    question: 'Sube tu path o URL del proyecto (opcional).',
    kind: 'text',
    optional: true,
    placeholder: 'Ejemplo: C:/mi-proyecto o https://github.com/org/repo',
  },
  {
    question: 'Que quieres que priorice en esta auditoria?',
    kind: 'options',
    options: [
      'Arquitectura y estructura del proyecto',
      'Errores, deuda tecnica y riesgos',
      'Calidad del codigo y buenas practicas',
      PROJECT_AUDIT_OTHER_OPTION,
    ],
  },
  {
    question: 'Que stack principal usa tu proyecto?',
    kind: 'options',
    options: [
      'Frontend (React/Vite/TS)',
      'Backend (PHP/Symfony/Node)',
      'Fullstack (frontend + backend)',
      PROJECT_AUDIT_OTHER_OPTION,
    ],
  },
  {
    question: 'Que tan profundo quieres el analisis?',
    kind: 'options',
    options: [
      'Rapido (snapshot general)',
      'Intermedio (riesgos + mejoras)',
      'Profundo (auditoria completa)',
      PROJECT_AUDIT_OTHER_OPTION,
    ],
  },
  {
    question: 'Cual es el resultado esperado?',
    kind: 'options',
    options: [
      'Resumen ejecutivo claro',
      'Plan de accion priorizado',
      'Checklist tecnico para ejecutar',
      PROJECT_AUDIT_OTHER_OPTION,
    ],
  },
];

const normalizeClarityQuestionLine = (line: string): string => {
  return String(line || '')
    .trim()
    .replace(CLARITY_QUESTION_PREFIX_REGEX, '')
    .trim();
};

const isQuestionLikeLine = (line: string): boolean => {
  const normalized = normalizeClarityQuestionLine(line).toLowerCase();
  if (!normalized) return false;
  return normalized.includes('?')
    || normalized.startsWith('¿')
    || /^(what|why|how|which|where|when|who|do|does|is|are|can|could|would|should|de\s+donde|como|cu[aá]l|cu[aá]les|qu[eé]|por\s+qu[eé]|tienes|hay)\b/i.test(normalized);
};

const parseClarityQuestionsFromContent = (content: string): ClarityQuestionParseResult => {
  const raw = String(content || '').trim();
  if (!raw) return { question: '', options: [], strippedContent: '' };

  const blockMatch = raw.match(CLARITY_QUESTIONS_BLOCK_REGEX);
  if (!blockMatch?.[1]) {
    return { question: '', options: [], strippedContent: raw };
  }

  const lines = blockMatch[1]
    .split(/\r?\n/)
    .map(normalizeClarityQuestionLine)
    .filter(Boolean)
    .slice(0, 12);

  if (lines.length === 0) {
    return {
      question: '',
      options: [],
      strippedContent: raw
        .replace(CLARITY_QUESTIONS_BLOCK_REGEX, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    };
  }

  const questionLine = lines.find((line) => isQuestionLikeLine(line)) || lines[0];
  const question = String(questionLine || '').trim();
  const options = Array.from(new Set(
    lines
      .filter((line) => line !== question)
      .filter((line) => !isQuestionLikeLine(line))
      .map((line) => line.trim())
      .filter(Boolean)
  )).slice(0, 5);

  return {
    question,
    options,
    strippedContent: raw
      .replace(CLARITY_QUESTIONS_BLOCK_REGEX, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  };
};

const inferRequestedFileFormat = (prompt: string): GeneratedFileFormat | null => {
  const text = String(prompt || '').toLowerCase();

  if (/\b(pdf)\b/.test(text)) return 'pdf';
  if (/\b(docx?)\b|\bword\b/.test(text)) return 'doc';
  if (/\b(markdown|\.md)\b/.test(text)) return 'md';
  if (/\b(txt|texto plano|text file)\b/.test(text)) return 'txt';

  return null;
};

const buildFileOutputDirective = (format: GeneratedFileFormat): string => {
  return [
    `[FILE OUTPUT REQUEST: ${String(format).toUpperCase()}]`,
    'Return only the final document content.',
    'Do not include any links, local/sandbox paths, download instructions, or phrases like "file generated".',
    'Do not include intro/outro wrappers. Start directly with the document title/content.',
  ].join('\n');
};

const sanitizeAssistantDocumentDraft = (content: string): string => {
  const raw = String(content || '').trim();
  if (!raw) return '';

  const noSandboxLinks = raw
    .replace(MARKDOWN_SANDBOX_LINK_REGEX_GLOBAL, '')
    .replace(INLINE_SANDBOX_URI_REGEX_GLOBAL, '')
    .replace(INLINE_MNT_DATA_PATH_REGEX_GLOBAL, '')
    .trim();

  const lines = noSandboxLinks.split(/\r?\n/);
  const cleaned: string[] = [];

  for (const originalLine of lines) {
    const line = String(originalLine || '').trim();

    if (!line) {
      if (cleaned.length > 0 && cleaned[cleaned.length - 1] !== '') {
        cleaned.push('');
      }
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) continue;
    if (FILE_RESPONSE_META_LINE_REGEX.test(line)) continue;

    cleaned.push(originalLine);
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const normalizeFileCardMessage = (content: string): string => {
  const raw = String(content || '').trim();
  if (!raw) return '';

  return raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`+/g, '')
    .replace(MARKDOWN_EMPTY_LINK_REGEX_GLOBAL, '')
    .replace(MARKDOWN_DATA_LINK_REGEX_GLOBAL, '')
    .replace(MARKDOWN_SANDBOX_OR_FILE_LINK_REGEX_GLOBAL, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not encode generated file.'));
    reader.readAsDataURL(blob);
  });
};

const escapeHtml = (value: string): string => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const createGeneratedFileArtifact = async (
  format: GeneratedFileFormat,
  content: string
): Promise<GeneratedFileArtifact | null> => {
  const safeText = String(content || '').trim();
  if (!safeText) return null;

  const stamp = Date.now();

  if (format === 'pdf') {
    return {
      format,
      fileName: `assistant-output-${stamp}.pdf`,
      mimeType: 'application/pdf',
      dataUrl: generateDocumentPDF(safeText),
    };
  }

  if (format === 'doc') {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre>${escapeHtml(safeText)}</pre></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    return {
      format,
      fileName: `assistant-output-${stamp}.doc`,
      mimeType: 'application/msword',
      dataUrl: await blobToDataUrl(blob),
    };
  }

  if (format === 'md') {
    const blob = new Blob([safeText], { type: 'text/markdown;charset=utf-8' });
    return {
      format,
      fileName: `assistant-output-${stamp}.md`,
      mimeType: 'text/markdown',
      dataUrl: await blobToDataUrl(blob),
    };
  }

  const blob = new Blob([safeText], { type: 'text/plain;charset=utf-8' });
  return {
    format: 'txt',
    fileName: `assistant-output-${stamp}.txt`,
    mimeType: 'text/plain',
    dataUrl: await blobToDataUrl(blob),
  };
};

const getObjectType = (item: ObjectItem): string => {
  const raw = (item as any).objectType || item.type || '';
  return String(raw).toLowerCase();
};

const getObjectFolderId = (item: ObjectItem): number | null => {
  const raw = item.folderId ?? (item as any).folder_id ?? null;
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
};

const sameObjectId = (left: string | number, right: string | number): boolean => {
  return String(left) === String(right);
};

const selectedModelFromSkills = (config: FablabChatRuntimeConfig, skills: SkillState): string => {
  if (skills.projectAudit) return config.selectedProjectAuditModelId || config.selectedTextModelId || config.selectedSearchModelId || config.selectedModel || '';
  if (skills.image && config.selectedImageModelId) return config.selectedImageModelId;
  if (skills.other && config.selectedOtherModelId) return config.selectedOtherModelId;
  if (skills.audioSynthesis && config.selectedSpeechSynthesisModelId) return config.selectedSpeechSynthesisModelId;
  if (skills.audioTranscription && config.selectedSpeechTranscriptionModelId) return config.selectedSpeechTranscriptionModelId;
  if (skills.search && config.selectedSearchModelId) return config.selectedSearchModelId;
  if (skills.summarize && config.selectedSummaryModelId) return config.selectedSummaryModelId;
  if (skills.promptOptimize && config.selectedPromptOptimizerModelId) return config.selectedPromptOptimizerModelId;
  if (skills.roleOptimize && config.selectedRoleOptimizerModelId) return config.selectedRoleOptimizerModelId;
  return config.selectedTextModelId || config.selectedModel || '';
};

const toProviderMessages = (
  messages: FablabChatMessage[],
  latestAttachments: ProviderAttachment[]
): ProviderChatMessage[] => {
  const rawMessages = messages.map((message, index) => {
    const isLast = index === messages.length - 1;
    const sanitizedContent = sanitizeContentForProviderHistory(message.content);
    if (message.role !== 'user' || !isLast || latestAttachments.length === 0) {
      return {
        role: message.role,
        content: sanitizedContent,
      };
    }

    return {
      role: message.role,
      content: sanitizedContent,
      attachments: latestAttachments,
    };
  });

  const normalized: ProviderChatMessage[] = [];

  for (const message of rawMessages) {
    const role: 'user' | 'assistant' = message.role === 'assistant' ? 'assistant' : 'user';
    const content = String(message.content || '').trim();
    const attachments = Array.isArray(message.attachments) ? message.attachments : undefined;

    if (!content && (!attachments || attachments.length === 0)) {
      continue;
    }

    if (normalized.length === 0) {
      if (role !== 'user') {
        continue;
      }

      normalized.push({
        role,
        content,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      });
      continue;
    }

    const lastIndex = normalized.length - 1;
    const previous = normalized[lastIndex];

    if (previous.role === role) {
      const mergedContent = [String(previous.content || '').trim(), content]
        .filter(Boolean)
        .join('\n\n');

      normalized[lastIndex] = {
        ...previous,
        content: mergedContent,
        ...(role === 'user' && attachments && attachments.length > 0
          ? { attachments: attachments }
          : {}),
      };
      continue;
    }

    normalized.push({
      role,
      content,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    });
  }

  return normalized;
};

const formatAssistantText = (response: ProviderChatResponse): string => {
  const normalizeCitationConsistency = (raw: string): string => {
    const text = String(raw || '').trim();
    if (!text) return text;

    const hasCitationMarkers = /\[\d+\]/.test(text);
    if (!hasCitationMarkers) return text;

    const stripMarkers = (input: string): string => {
      return input
        .replace(/\[\d+\]/g, '')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    const referencesHeadingRegex = /(^|\n)##\s*(referencias|bibliografia)\b/i;
    const headingMatch = text.match(referencesHeadingRegex);
    if (!headingMatch || headingMatch.index === undefined) {
      return stripMarkers(text);
    }

    const headingIndex = headingMatch.index + (headingMatch[1] ? headingMatch[1].length : 0);
    const beforeReferences = text.slice(0, headingIndex).trimEnd();
    const referencesSection = text.slice(headingIndex).trim();

    const hasNumberedReferences = /^\s*\d+\.\s+.+/im.test(referencesSection);
    const hasPlaceholderOnly = /fuente no proporcionada explicitamente por el proveedor/i.test(referencesSection);

    // If there are no real references, remove [n] markers to keep the response consistent.
    if (!hasNumberedReferences || hasPlaceholderOnly) {
      return stripMarkers(beforeReferences);
    }

    return text;
  };

  const content = normalizeCitationConsistency(String(response.content || '').trim());
  return content || 'No response content generated.';
};

const formatTime = (iso: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const IMAGE_MARKDOWN_REGEX = /!\[[^\]]*\]\((data:image[^)]+|https?:\/\/[^)\s]+)\)/i;

const extractImageFromContent = (content: string): string | null => {
  const trimmed = String(content || '').trim();
  if (!trimmed) return null;

  if (/^data:image\//i.test(trimmed)) {
    return trimmed;
  }

  if (IMAGE_URL_ONLY_REGEX.test(trimmed)) {
    return trimmed;
  }

  const markdownMatch = trimmed.match(IMAGE_MARKDOWN_REGEX);
  if (markdownMatch?.[1]) {
    return markdownMatch[1];
  }

  return null;
};

const stripImageFromContent = (content: string): string => {
  const raw = String(content || '').trim();
  if (!raw) return '';
  if (RAW_DATA_IMAGE_REGEX.test(raw) || IMAGE_URL_ONLY_REGEX.test(raw)) return '';

  const withoutMarkdownImage = raw.replace(IMAGE_MARKDOWN_REGEX, '').trim();
  const withoutInlineDataImage = withoutMarkdownImage.replace(INLINE_DATA_IMAGE_REGEX_GLOBAL, '').trim();
  return withoutInlineDataImage;
};

const extensionFromMimeType = (mimeType: string): string => {
  const mime = String(mimeType || '').toLowerCase();
  if (mime === 'text/plain') return 'txt';
  if (mime === 'text/markdown') return 'md';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('wordprocessingml.document')) return 'docx';
  if (mime.includes('msword')) return 'doc';
  if (mime.includes('json')) return 'json';
  if (mime.includes('audio/mpeg')) return 'mp3';
  if (mime.includes('audio/wav')) return 'wav';
  if (mime.includes('audio/ogg')) return 'ogg';
  if (mime.includes('video/mp4')) return 'mp4';
  if (mime.includes('video/webm')) return 'webm';
  return 'bin';
};

const extractRichOutputFromContent = (content: string): RichOutput => {
  const raw = String(content || '').trim();
  if (!raw) return null;

  let dataUrl = '';

  const markdownMatch = raw.match(MARKDOWN_DATA_LINK_REGEX);
  if (markdownMatch?.[1]) {
    dataUrl = markdownMatch[1];
  } else {
    const inlineMatch = raw.match(GENERIC_DATA_URL_REGEX);
    if (inlineMatch?.[1]) {
      dataUrl = inlineMatch[1];
    }
  }

  if (!dataUrl) return null;

  const mimeMatch = dataUrl.match(/^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+)(?:;[^,]+)?;base64,/i);
  const mimeType = String(mimeMatch?.[1] || '').toLowerCase();
  if (!mimeType || mimeType.startsWith('image/')) return null;

  if (mimeType.startsWith('audio/')) {
    return {
      kind: 'audio',
      src: dataUrl,
      mimeType,
      fileName: `generated-audio-${Date.now()}.${extensionFromMimeType(mimeType)}`,
    };
  }

  if (mimeType.startsWith('video/')) {
    return {
      kind: 'video',
      src: dataUrl,
      mimeType,
      fileName: `generated-video-${Date.now()}.${extensionFromMimeType(mimeType)}`,
    };
  }

  return {
    kind: 'file',
    src: dataUrl,
    mimeType,
    fileName: `generated-file-${Date.now()}.${extensionFromMimeType(mimeType)}`,
  };
};

const stripRichOutputFromContent = (content: string, richSrc: string): string => {
  const raw = String(content || '').trim();
  if (!raw) return raw;

  return raw
    .replace(MARKDOWN_DATA_LINK_REGEX_GLOBAL, '')
    .replace(MARKDOWN_SANDBOX_OR_FILE_LINK_REGEX_GLOBAL, '')
    .replace(richSrc, '')
    .replace(MARKDOWN_EMPTY_LINK_REGEX_GLOBAL, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const redactInlinePayload = (content: string, replacement: string): string => {
  const raw = String(content || '').trim();
  if (!raw) return raw;

  if (INLINE_DATA_PAYLOAD_REGEX_GLOBAL.test(raw)) {
    INLINE_DATA_PAYLOAD_REGEX_GLOBAL.lastIndex = 0;
    return replacement;
  }

  const redacted = raw
    .replace(MARKDOWN_DATA_IMAGE_REGEX_GLOBAL, replacement)
    .replace(INLINE_DATA_IMAGE_REGEX_GLOBAL, replacement)
    .replace(INLINE_DATA_PAYLOAD_REGEX_GLOBAL, replacement)
    .trim();

  INLINE_DATA_PAYLOAD_REGEX_GLOBAL.lastIndex = 0;
  return redacted || replacement;
};

const sanitizeContentForProviderHistory = (content: string): string => {
  return redactInlinePayload(
    content,
    '[Binary payload omitted from history to avoid token overflow.]'
  );
};

const sanitizeContentForExport = (content: string): string => {
  return redactInlinePayload(
    content,
    '[Binary payload omitted from export.]'
  );
};

const optimizeDataUrlImage = async (dataUrl: string, maxSide = 1280, quality = 0.82): Promise<string> => {
  if (typeof window === 'undefined') return dataUrl;
  if (!/^data:image\//i.test(dataUrl)) return dataUrl;

  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!width || !height) {
          resolve(dataUrl);
          return;
        }

        const scale = Math.min(1, maxSide / Math.max(width, height));
        if (scale >= 1 && dataUrl.length < 1_200_000) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));

        const context = canvas.getContext('2d', { alpha: true });
        if (!context) {
          resolve(dataUrl);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+)(?:;[^,]+)?;base64,/i);
        const sourceMime = String(mimeMatch?.[1] || 'image/jpeg').toLowerCase();
        const targetMime = sourceMime === 'image/png' ? 'image/webp' : sourceMime;
        const optimized = canvas.toDataURL(targetMime, quality);
        resolve(optimized.length < dataUrl.length ? optimized : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
};

const optimizeAssistantImagePayload = async (content: string): Promise<string> => {
  const imageSrc = extractImageFromContent(content);
  if (!imageSrc || !/^data:image\//i.test(imageSrc)) return content;

  const optimized = await optimizeDataUrlImage(imageSrc);
  if (optimized === imageSrc) return content;

  return String(content || '').replace(imageSrc, optimized);
};

const markdownComponents = {
  h1: (props: any) => <h1 className="fablab-heading fablab-heading-1" {...props} />,
  h2: (props: any) => <h2 className="fablab-heading fablab-heading-2" {...props} />,
  h3: (props: any) => <h3 className="fablab-heading fablab-heading-3" {...props} />,
  h4: (props: any) => <h4 className="fablab-heading fablab-heading-4" {...props} />,
  h5: (props: any) => <h5 className="fablab-heading fablab-heading-5" {...props} />,
  h6: (props: any) => <h6 className="fablab-heading fablab-heading-6" {...props} />,
  p: (props: any) => <div className="fablab-paragraph" {...props} />,
  ul: (props: any) => <ul  {...props} />,
  ol: (props: any) => <ol  {...props} />,
  li: (props: any) => <li  {...props} />,
  strong: (props: any) => <strong  {...props} />,
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeContent = String(children).replace(/\n$/, '');

    if (inline) {
      return <code className="fablab-code-inline" {...props}>{children}</code>;
    }

    if (language === 'mermaid') {
      const [svg, setSvg] = useState<string | null>(null);

      useEffect(() => {
        const renderMermaid = async () => {
          try {
            const id = `mermaid-${Date.now()}-${Math.random()}`;
            const { svg } = await mermaid.render(id, codeContent);
            setSvg(svg);
          } catch (error) {
            console.error('Mermaid render error:', error);
          }
        };

        void renderMermaid();
      }, [codeContent]);

      if (!svg) {
        return <div className="fablab-mermaid-loading">Loading diagram...</div>;
      }

      return (
        <div className="fablab-mermaid-wrapper" translate="no" data-no-translate="true">
          <div className="fablab-code-header">
            <span>mermaid</span>
          </div>
          <div
            className="fablab-mermaid-diagram"
            translate="no"
            data-no-translate="true"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      );
    }

    return (
      <div className="fablab-code-block">
        <div className="fablab-code-header">
          <span>{language || 'code'}</span>
        </div>
        <pre className={className} {...props}>
          <code>{children}</code>
        </pre>
      </div>
    );
  },
  pre: (props: any) => <pre  {...props} />,
  table: ({ children, ...props }: any) => (
    <div className="fablab-table-wrapper">
      <table className="fablab-table" {...props}>{children}</table>
    </div>
  ),
  thead: (props: any) => <thead className="fablab-table-head" {...props} />,
  tbody: (props: any) => <tbody className="fablab-table-body" {...props} />,
  tr: (props: any) => <tr className="fablab-table-row" {...props} />,
  th: (props: any) => <th className="fablab-table-header-cell" {...props} />,
  td: (props: any) => <td className="fablab-table-cell" {...props} />,
  blockquote: ({ children, ...props }: any) => {
    const text = String(children?.[0]?.props?.children || '');
    const typeMatch = text.match(/\[!(note|warning|info|tip|caution|important)\]/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : null;

    const typeClasses = {
      note: 'fablab-blockquote-note',
      warning: 'fablab-blockquote-warning',
      info: 'fablab-blockquote-info',
      tip: 'fablab-blockquote-tip',
      caution: 'fablab-blockquote-caution',
      important: 'fablab-blockquote-important',
    };

    const className = type ? typeClasses[type as keyof typeof typeClasses] : 'fablab-blockquote-default';

    return (
      <blockquote className={`fablab-blockquote ${className}`} {...props}>
        {type && <div className="fablab-blockquote-icon">{type}</div>}
        <div className="fablab-blockquote-content">{children}</div>
      </blockquote>
    );
  },
  a: (props: any) => {
    const href = String(props?.href || '');
    const isDataUri = /^data:/i.test(href);
    const isExternal = /^https?:\/\//i.test(href);

    if (isDataUri) {
      const mimeMatch = href.match(/^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+)(?:;[^,]+)?;base64,/i);
      const mimeType = String(mimeMatch?.[1] || 'application/octet-stream');
      const ext = extensionFromMimeType(mimeType);
      const downloadName = `assistant-output-${Date.now()}.${ext}`;

      return (
        <a
          {...props}
          href={href}
          download={downloadName}
          className="fablab-link fablab-link-download"
        />
      );
    }

    return (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="fablab-link fablab-link-external"
      >
        {props.children}
        {isExternal && <ExternalLink size={12} className="fablab-link-icon" />}
      </a>
    );
  },
};

const markdownUrlTransform = (url: string): string => {
  const normalized = String(url || '').trim();
  if (!normalized) return normalized;

  if (/^(sandbox|file):/i.test(normalized)) {
    return '';
  }

  if (/^data:[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9=._+-]+)*;base64,[A-Za-z0-9+/=]+$/i.test(normalized)) {
    return normalized;
  }

  return normalized;
};

const FablabChatController: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [runtimeConfig, setRuntimeConfig] = useState<FablabChatRuntimeConfig | null>(null);
  const [messages, setMessages] = useState<FablabChatMessage[]>([]);
  const [stats, setStats] = useState<FablabChatRuntimeState['stats']>({
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalEstimatedCost: 0,
    lastLatencyMs: 0,
  });

  const [input, setInput] = useState('');
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  const [skills, setSkills] = useState<SkillState>(initialSkills);

  const [sourceMode, setSourceMode] = useState<SourceMode>(null);
  const [folders, setFolders] = useState<ObjectFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedContextSources, setSelectedContextSources] = useState<ObjectItem[]>([]);
  const [selectedRoleObject, setSelectedRoleObject] = useState<ObjectItem | null>(null);
  const [roleInstruction, setRoleInstruction] = useState('');
  const [roleResetAt, setRoleResetAt] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isInstructionFlipped, setIsInstructionFlipped] = useState(false);
  const [skillsMenuOpen, setSkillsMenuOpen] = useState(false);
  const [complementsMenuOpen, setComplementsMenuOpen] = useState(false);
  const [rolePresets, setRolePresets] = useState<RolePreset[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<RolePreset | null>(null);

  const isDefaultRole = (preset: RolePreset): boolean => {
    return DEFAULT_ROLE_NAMES.has(preset.name);
  };
  const [editingSkillLabel, setEditingSkillLabel] = useState('');
  const [editingSkillInstruction, setEditingSkillInstruction] = useState('');
  const skillsMenuRef = useRef<HTMLDivElement | null>(null);

  // Chat Skills (dynamic skills triggered via /skillname)
  const [chatSkills, setChatSkills] = useState<ChatSkill[]>([]);
  const [flipMode, setFlipMode] = useState<'role' | 'skills' | null>(null);
  const [editingChatSkill, setEditingChatSkill] = useState<ChatSkill | null>(null);
  const [newChatSkillName, setNewChatSkillName] = useState('');
  const [newChatSkillInstruction, setNewChatSkillInstruction] = useState('');
  const [newChatSkillSourceType, setNewChatSkillSourceType] = useState<'manual' | 'object'>('manual');
  const [newChatSkillObjectId, setNewChatSkillObjectId] = useState<number | null>(null);
  const [skillImportModalOpen, setSkillImportModalOpen] = useState(false);
  const [newRoleSourceType, setNewRoleSourceType] = useState<'manual' | 'object'>('manual');
  const [newRoleObjectId, setNewRoleObjectId] = useState<number | null>(null);
  const [newRoleObjectName, setNewRoleObjectName] = useState('');
  const [roleImportModalOpen, setRoleImportModalOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  // Skill autocomplete dropdown states
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [skillDropdownFilter, setSkillDropdownFilter] = useState('');
  const [activeSkillIndex, setActiveSkillIndex] = useState(0);
  const skillDropdownRef = useRef<HTMLDivElement | null>(null);
  const [projectAuditWizardVisible, setProjectAuditWizardVisible] = useState(false);
  const [projectAuditIntakeCompleted, setProjectAuditIntakeCompleted] = useState(false);
  const [projectAuditFollowUp, setProjectAuditFollowUp] = useState<{ question: string; options: string[] } | null>(null);
  const [projectAuditFollowUpVisible, setProjectAuditFollowUpVisible] = useState(false);
  const [projectAuditFollowUpDraft, setProjectAuditFollowUpDraft] = useState('');
  const [projectAuditFollowUpSelection, setProjectAuditFollowUpSelection] = useState('');
  const [projectAuditWizardStepIndex, setProjectAuditWizardStepIndex] = useState(0);
  const [projectAuditWizardAnswers, setProjectAuditWizardAnswers] = useState<string[]>(
    () => PROJECT_AUDIT_WIZARD_STEPS.map(() => '')
  );
  const [projectAuditWizardSelections, setProjectAuditWizardSelections] = useState<string[]>(
    () => PROJECT_AUDIT_WIZARD_STEPS.map(() => '')
  );

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const hasConversation = messages.length > 0;

  const selectedContextIds = useMemo(
    () => selectedContextSources.map((item) => item.id),
    [selectedContextSources]
  );

  const projectAuditTotalSteps = PROJECT_AUDIT_WIZARD_STEPS.length;
  const projectAuditCurrentStep = PROJECT_AUDIT_WIZARD_STEPS[projectAuditWizardStepIndex];
  const projectAuditCurrentAnswer = String(projectAuditWizardAnswers[projectAuditWizardStepIndex] || '');
  const projectAuditCurrentSelection = String(projectAuditWizardSelections[projectAuditWizardStepIndex] || '');
  const projectAuditCurrentNeedsCustomInput = projectAuditCurrentStep?.kind === 'options'
    && projectAuditCurrentSelection === PROJECT_AUDIT_OTHER_OPTION;

  const projectAuditCanGoNext = useMemo(() => {
    if (!skills.projectAudit) return false;
    const step = PROJECT_AUDIT_WIZARD_STEPS[projectAuditWizardStepIndex];
    if (!step) return false;
    if (step.optional) return true;
    return Boolean(String(projectAuditWizardAnswers[projectAuditWizardStepIndex] || '').trim());
  }, [projectAuditWizardAnswers, projectAuditWizardStepIndex, skills.projectAudit]);

  const projectAuditWizardComplete = useMemo(() => {
    if (!skills.projectAudit) return false;
    return PROJECT_AUDIT_WIZARD_STEPS.every((step, index) => {
      if (step.optional) return true;
      return Boolean(String(projectAuditWizardAnswers[index] || '').trim());
    });
  }, [projectAuditWizardAnswers, skills.projectAudit]);

  const renderedMessages = useMemo(() => {
    return messages.map((message) => {
      const isUser = message.role === 'user';
      const imageSrc = !isUser ? extractImageFromContent(message.content) : null;
      const richOutput = !isUser && !imageSrc ? extractRichOutputFromContent(message.content) : null;
      const rawTextBody = imageSrc
        ? stripImageFromContent(message.content)
        : (richOutput ? stripRichOutputFromContent(message.content, richOutput.src) : message.content);
      const textBody = !isUser && richOutput?.kind === 'file'
        ? sanitizeAssistantDocumentDraft(rawTextBody)
        : rawTextBody;
      const fileCardMessage = !isUser && richOutput?.kind === 'file'
        ? normalizeFileCardMessage(textBody)
        : '';

      return {
        message,
        isUser,
        imageSrc,
        richOutput,
        textBody,
        fileCardMessage,
      };
    });
  }, [messages]);

  const activeRole = useMemo(
    () => rolePresets.find((preset) => preset.id === activeRoleId) || null,
    [activeRoleId, rolePresets]
  );

  const updateRuntimeConfig = async (partial: Record<string, unknown>) => {
    if (!runtimeConfig) return;
    const nextConfig = {
      ...runtimeConfig,
      ...partial,
      updatedAt: toIsoNow(),
    };
    await saveFablabChatRuntimeConfig(nextConfig);
    setRuntimeConfig(nextConfig);
  };

  const openRoleEditor = (preset?: RolePreset) => {
    setSkillsMenuOpen(false);
    setEditingRole(preset ?? null);
    if (!preset && activeRole?.name) {
      setEditingSkillLabel(`${activeRole.name} + `);
    } else {
      setEditingSkillLabel(preset?.name ?? '');
    }
    setEditingSkillInstruction(preset?.instruction ?? '');
    setNewRoleSourceType(preset?.sourceType ?? 'manual');
    setNewRoleObjectId(preset?.objectId ?? null);
    setNewRoleObjectName(preset?.name ?? '');
    setFlipMode('role');
    setIsInstructionFlipped(true);
  };

  const saveRolePreset = async () => {
    const label = editingSkillLabel.trim();
    if (!label) return;
    const instruction = editingSkillInstruction.trim();

    try {
      if (editingRole) {
        const updated = await updateChatRole(editingRole.id, {
          name: label,
          instruction,
          sourceType: newRoleSourceType,
          objectId: newRoleObjectId ?? undefined,
        });
        setRolePresets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setActiveRoleId(updated.id);
        await updateRuntimeConfig({
          systemPrompt: systemInstruction.trim(),
          activeRoleId: updated.id,
          roleInstruction: '',
          selectedRoleObjectId: '',
          selectedRoleObjectName: '',
          roleResetAt: toIsoNow(),
        });
      } else {
        const created = await createChatRole({
          name: label,
          instruction,
          sourceType: newRoleSourceType,
          objectId: newRoleObjectId ?? undefined,
        });
        setRolePresets((prev) => [created, ...prev]);
        setActiveRoleId(created.id);
        await updateRuntimeConfig({
          systemPrompt: systemInstruction.trim(),
          activeRoleId: created.id,
          roleInstruction: '',
          selectedRoleObjectId: '',
          selectedRoleObjectName: '',
          roleResetAt: toIsoNow(),
        });
      }
      setEditingRole(null);
      setNewRoleSourceType('manual');
      setNewRoleObjectId(null);
      setIsInstructionFlipped(false);
    } catch (error) {
      console.error('Error saving role preset:', error);
      setErrorText('No se pudo guardar el rol.');
    }
  };

  const deleteRolePreset = async (preset: RolePreset) => {
    if (isDefaultRole(preset)) return;
    try {
      await deleteChatRole(preset.id);
      setRolePresets((prev) => prev.filter((item) => item.id !== preset.id));
      if (activeRoleId === preset.id) {
        setActiveRoleId(null);
      }
      await updateRuntimeConfig({
        systemPrompt: systemInstruction.trim(),
        activeRoleId: activeRoleId === preset.id ? null : activeRoleId,
      });
    } catch (error) {
      console.error('Error deleting role preset:', error);
      setErrorText('No se pudo eliminar el rol.');
    }
  };

  const applyRolePreset = async (preset: RolePreset) => {
    setActiveRoleId(preset.id);
    setSkillsMenuOpen(false);
    setRoleInstruction('');
    setSelectedRoleObject(null);
    setRoleResetAt(toIsoNow());
    await updateRuntimeConfig({
      systemPrompt: systemInstruction.trim(),
      activeRoleId: preset.id,
      roleInstruction: '',
      selectedRoleObjectId: '',
      selectedRoleObjectName: '',
      roleResetAt: toIsoNow(),
    });
  };

  // Chat Skills functions
  const loadChatSkills = async () => {
    try {
      const skills = await getChatSkills('skill');
      setChatSkills(skills);
    } catch (error) {
      console.error('Error loading chat skills:', error);
    }
  };

  const handleCreateChatSkill = async () => {
    const name = newChatSkillName.trim();
    const instruction = newChatSkillInstruction.trim();
    if (!name || !instruction) return;

    try {
      const newSkill = await createChatSkill({
        type: 'skill',
        name,
        instruction,
        sourceType: newChatSkillSourceType,
        objectId: newChatSkillObjectId ?? undefined,
      });
      setChatSkills((prev) => [newSkill, ...prev]);
      setNewChatSkillName('');
      setNewChatSkillInstruction('');
      setNewChatSkillObjectId(null);
    } catch (error) {
      console.error('Error creating chat skill:', error);
    }
  };

  const handleUpdateChatSkill = async () => {
    if (!editingChatSkill) return;
    const name = newChatSkillName.trim();
    const instruction = newChatSkillInstruction.trim();
    if (!name || !instruction) return;

    try {
      const updated = await updateChatSkill(editingChatSkill.id, {
        type: 'skill',
        name,
        instruction,
        sourceType: newChatSkillSourceType,
        objectId: newChatSkillObjectId ?? undefined,
      });
      setChatSkills((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setEditingChatSkill(null);
      setNewChatSkillName('');
      setNewChatSkillInstruction('');
      setNewChatSkillObjectId(null);
    } catch (error) {
      console.error('Error updating chat skill:', error);
    }
  };

  const handleDeleteChatSkill = async (id: number) => {
    try {
      await deleteChatSkill(id);
      setChatSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting chat skill:', error);
    }
  };

  // Import skill from MD object
  const importSkillFromObject = async (objectId: number) => {
    try {
      const content = await getObjectDownloadText(objectId, 10000);
      if (!content.trim()) {
        setErrorText('El archivo seleccionado esta vacio o no se puede leer.');
        return;
      }

      // Extract name from filename or use default
      const object = objects.find((o) => o.id === objectId);
      const name = object?.name?.replace(/\.md$/i, '') || 'skill-importado';

      setNewChatSkillName(name);
      setNewChatSkillInstruction(content);
      setNewChatSkillSourceType('object');
      setNewChatSkillObjectId(objectId);
    } catch (error) {
      console.error('Error importing skill from object:', error);
      setErrorText('No se pudo importar el skill desde el archivo.');
    }
  };

  // Handle object selection from modal for skill import
  const handleSkillObjectSelected = (object: SelectorObjectItem) => {
    void importSkillFromObject(object.id);
    setSkillImportModalOpen(false);
    setStatusText('Objeto importado. Revisa el formulario y guarda el skill.');
  };

  // Import role from MD object
  const importRoleFromObject = async (objectId: number) => {
    try {
      const content = await getObjectDownloadText(objectId, 10000);
      if (!content.trim()) {
        setErrorText('El archivo seleccionado esta vacio o no se puede leer.');
        return;
      }

      const object = objects.find((o) => o.id === objectId);
      const name = object?.name?.replace(/\.md$/i, '') || 'rol-importado';

      setEditingRole(null);
      setEditingSkillLabel(name);
      setEditingSkillInstruction(content);
      setNewRoleSourceType('object');
      setNewRoleObjectId(objectId);
      setNewRoleObjectName(object?.name || name);
    } catch (error) {
      console.error('Error importing role from object:', error);
      setErrorText('No se pudo importar el rol desde el archivo.');
    }
  };

  const handleRoleObjectSelected = (object: SelectorObjectItem) => {
    void importRoleFromObject(object.id);
    setRoleImportModalOpen(false);
    setStatusText('Rol importado. Revisa el formulario y guarda el rol.');
  };

  const openAttachmentPicker = () => {
    if (isUploadingAttachment) return;
    const input = attachmentInputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  };

  const handleAttachmentInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newItems: PendingAttachment[] = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      status: 'uploading',
      file,
    }));

    setPendingAttachments((prev) => [...prev, ...newItems]);
    setIsUploadingAttachment(true);

    for (const attachment of newItems) {
      if (!attachment.file) continue;
      const baseName = getFileBaseName(attachment.file.name);
      const type = guessObjectTypeFromFile(attachment.file);

      try {
        const created = await createObject({
          title: baseName,
          type,
          file: attachment.file,
        });
        setPendingAttachments((prev) => prev.map((item) => (
          item.id === attachment.id
            ? {
              ...item,
              name: created?.name || item.name,
              objectId: created?.id,
              type: created?.type || type,
              status: 'ready',
              file: undefined,
            }
            : item
        )));
      } catch (error) {
        console.error('Error uploading attachment:', error);
        setPendingAttachments((prev) => prev.map((item) => (
          item.id === attachment.id ? { ...item, status: 'error', file: undefined } : item
        )));
        setErrorText('No se pudo cargar el archivo adjunto.');
      }
    }

    setIsUploadingAttachment(false);
  };

  const removeAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const buildAttachmentPayload = async (attachments: PendingAttachment[]): Promise<{ contextText: string; attachments: ProviderAttachment[] }> => {
    if (attachments.length === 0) return { contextText: '', attachments: [] };

    const notes: string[] = [];
    const providerAttachments: ProviderAttachment[] = [];

    for (const attachment of attachments) {
      if (!attachment.objectId) continue;
      const label = attachment.name;
      const type = attachment.type || 'file';

      try {
        const text = await getObjectDownloadText(attachment.objectId, 120000);
        if (text.trim()) {
          notes.push(`Attachment: ${label} (${type})\n${text}`);
          continue;
        }
      } catch {
        // fallback to binary
      }

      try {
        const encoded = await getObjectDownloadBase64(attachment.objectId);
        if (encoded.base64.length > 4_500_000) {
          notes.push(`Attachment: ${label} (${type}) is too large to attach fully.`);
          continue;
        }

        providerAttachments.push({
          name: label,
          mimeType: encoded.mimeType || attachment.mimeType || 'application/octet-stream',
          data: encoded.base64,
        });
        notes.push(`Attachment: ${label} (${type}) attached as binary context.`);
      } catch {
        notes.push(`Attachment: ${label} (${type}) could not be loaded.`);
      }
    }

    const header = attachments
      .map((item, idx) => `${idx + 1}. ${item.name}`)
      .join('\n');

    const contextText = [
      '[USER ATTACHMENTS]',
      header,
      notes.length > 0 ? `\n[ATTACHMENT CONTENT]\n${notes.join('\n\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return { contextText, attachments: providerAttachments };
  };

  // Create default skills if none exist
  const createDefaultSkills = async () => {
    const defaultSkills = [
      {
        name: 'documentar',
        instruction: `INSTRUCCION DEL SKILL "DOCUMENTAR":

Cuando el usuario use /documentar en su mensaje, debes:

1. Procesar la solicitud normalmente con toda tu capacidad
2. Al final de tu respuesta, generar un documento PDF descargable que contenga:
   - Un resumen ejecutivo de la conversacion
   - Los puntos clave tratados
   - Las conclusiones o recomendaciones
   - La fecha de generacion

El PDF debe estar listo para descargar con un enlace clickeable al final de tu respuesta.

Formato del enlace al PDF:
[Descargar Documento PDF](dataurl del pdf)

Esta instruccion aplica SOLO para este mensaje especifico donde se uso /documentar.`,
      },
    ];

    for (const skill of defaultSkills) {
      try {
        const exists = chatSkills.some((s) => s.name === skill.name);
        if (!exists) {
          const newSkill = await createChatSkill({
            type: 'skill',
            name: skill.name,
            instruction: skill.instruction,
            sourceType: 'manual',
          });
          setChatSkills((prev) => [newSkill, ...prev]);
        }
      } catch (error) {
        console.error(`Error creating default skill ${skill.name}:`, error);
      }
    }
  };

  const closeFlip = () => {
    setIsInstructionFlipped(false);
    setFlipMode(null);
  };


  // Load chat skills on mount and create default if none exist
  useEffect(() => {
    const initChatSkills = async () => {
      await loadChatSkills();
      // After loading, if no skills exist, create default ones
      const skills = await getChatSkills('skill');
      if (skills.length === 0) {
        await createDefaultSkills();
      }
    };
    void initChatSkills();
  }, []);

  // Detect skills in input for dropdown autocomplete
  useEffect(() => {
    const incompleteRegex = /(?:^|\s)\/([a-zA-Z0-9_-]*)$/;
    const incompleteMatch = input.match(incompleteRegex);

    if (incompleteMatch) {
      const filter = incompleteMatch[1].toLowerCase();
      const exactMatch = chatSkills.some((skill) => skill.name.toLowerCase() === filter);
      setSkillDropdownFilter(filter);
      setSkillDropdownOpen(!exactMatch);
      setActiveSkillIndex(0);
    } else {
      setSkillDropdownOpen(false);
    }
  }, [input, chatSkills]);

  useEffect(() => {
    if (!skillsMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!skillsMenuRef.current) return;
      if (!skillsMenuRef.current.contains(event.target as Node)) {
        setSkillsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [skillsMenuOpen]);

  useEffect(() => {
    if (!isInstructionFlipped) {
      setEditingSkillLabel('');
      setEditingSkillInstruction('');
      setEditingRole(null);
      setNewRoleSourceType('manual');
      setNewRoleObjectId(null);
      setNewRoleObjectName('');
    }
  }, [isInstructionFlipped]);

  const effectiveConfig = useMemo(() => {
    if (!runtimeConfig) return null;
    const selectedModel = selectedModelFromSkills(runtimeConfig, skills);
    return {
      ...runtimeConfig,
      selectedModel,
    };
  }, [runtimeConfig, skills]);

  const runtimeSelection = useMemo(() => {
    if (!effectiveConfig) return null;
    return resolveRuntimeFromConfig(effectiveConfig);
  }, [effectiveConfig]);

  const selectedModelLabel = useMemo(() => {
    if (!effectiveConfig?.selectedModel) return '';
    const decoded = effectiveConfig.selectedModel;
    for (const profile of runtimeConfig?.providerProfiles || []) {
      const found = (profile.validatedModels || []).find((item) => `${profile.id}::${item.id}` === decoded);
      if (found) {
        return `${profile.label || profile.provider} - ${found.label || found.id}`;
      }
    }
    return runtimeSelection?.modelId || '';
  }, [effectiveConfig?.selectedModel, runtimeConfig?.providerProfiles, runtimeSelection?.modelId]);

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const state = await loadFablabChatRuntimeState();
        if (cancelled) return;
        const runtime = state.config || null;
        setRuntimeConfig(runtime);
        setSystemInstruction(String(runtime?.systemPrompt || ''));
        const persistedActiveRoleId = (runtime as any)?.activeRoleId ?? (runtime as any)?.activeSkillId;
        const parsedActiveRoleId = persistedActiveRoleId ? Number(persistedActiveRoleId) : null;
        setActiveRoleId(Number.isFinite(parsedActiveRoleId) ? parsedActiveRoleId : null);
        const persistedRoleInstruction = String((state.config as any)?.roleInstruction || '');
        const persistedRoleName = String((state.config as any)?.selectedRoleObjectName || '');
        const persistedRoleId = (state.config as any)?.selectedRoleObjectId;
        const persistedRoleResetAt = String((state.config as any)?.roleResetAt || '');
        setRoleInstruction(persistedRoleInstruction);
        setRoleResetAt(persistedRoleResetAt);
        setSelectedRoleObject(
          persistedRoleName
            ? ({ id: persistedRoleId ?? `persisted-role-${Date.now()}`, name: persistedRoleName, type: 'TEXT' } as ObjectItem)
            : null
        );
        setMessages(Array.isArray(state.conversation.messages) ? state.conversation.messages : []);
        setStats(state.stats);

        try {
          const roles = await getChatRoles();
          if (cancelled) return;
          const existingNames = new Set(roles.map((role) => role.name.toLowerCase()));
          const missingDefaults = DEFAULT_ROLE_PRESETS.filter(
            (preset) => !existingNames.has(preset.name.toLowerCase())
          );
          if (missingDefaults.length > 0) {
            const createdDefaults = await Promise.all(
              missingDefaults.map((preset) => createChatRole({
                name: preset.name,
                instruction: preset.instruction,
                sourceType: 'manual',
              }))
            );
            if (cancelled) return;
            setRolePresets([...createdDefaults, ...roles]);
          } else {
            setRolePresets(roles);
          }
        } catch (error) {
          console.error('Error loading role presets:', error);
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorText(error?.message || (t?.fablabChat?.errors?.loadRuntime || 'Could not load chat runtime state.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadState();

    return () => {
      cancelled = true;
    };
  }, [t?.fablabChat?.errors?.loadRuntime]);

  useEffect(() => {
    if (!sourceMode) return;

    let cancelled = false;

    const loadLibrary = async () => {
      try {
        const [folderData, allObjects] = await Promise.all([
          getObjectFolders(),
          getAllObjects(),
        ]);
        if (cancelled) return;

        setFolders(folderData);

        const term = searchTerm.trim().toLowerCase();
        const scoped = (allObjects || []).filter((item) => {
          const matchesFolder = selectedFolderId === undefined
            ? true
            : getObjectFolderId(item) === selectedFolderId;

          const haystack = `${item.name || ''} ${item.title || ''}`.toLowerCase();
          const matchesSearch = term ? haystack.includes(term) : true;

          return matchesFolder && matchesSearch;
        });
        setObjects(scoped);
      } catch (error: any) {
        if (!cancelled) {
          setErrorText(error?.message || (t?.fablabChat?.errors?.loadSources || 'Could not load object library.'));
        }
      }
    };

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, [sourceMode, selectedFolderId, searchTerm, t?.fablabChat?.errors?.loadSources]);

  useEffect(() => {
    if (!skills.projectAudit) {
      setProjectAuditWizardVisible(false);
      setProjectAuditIntakeCompleted(false);
      setProjectAuditFollowUp(null);
      setProjectAuditFollowUpVisible(false);
      setProjectAuditFollowUpDraft('');
      setProjectAuditFollowUpSelection('');
      setProjectAuditWizardStepIndex(0);
      setProjectAuditWizardAnswers(PROJECT_AUDIT_WIZARD_STEPS.map(() => ''));
      setProjectAuditWizardSelections(PROJECT_AUDIT_WIZARD_STEPS.map(() => ''));
      return;
    }

    setProjectAuditWizardVisible(true);
  }, [skills.projectAudit]);

  useEffect(() => {
    if (!statusText) return;
    const timeoutId = window.setTimeout(() => {
      setStatusText('');
    }, 3200);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusText]);

  useEffect(() => {
    if (!errorText) return;
    const timeoutId = window.setTimeout(() => {
      setErrorText('');
    }, 4800);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [errorText]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const toggleSkill = (key: keyof SkillState) => {
    setSkills((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleProjectAuditSkill = () => {
    setSkills((prev) => ({
      ...prev,
      projectAudit: !prev.projectAudit,
    }));
    setSkillsMenuOpen(false);
  };

  const toggleContextSource = (source: ObjectItem) => {
    setSelectedContextSources((prev) => {
      const exists = prev.some((item) => sameObjectId(item.id, source.id));
      if (exists) {
        return prev.filter((item) => !sameObjectId(item.id, source.id));
      }
      return [...prev, source];
    });
  };

  const applySingleSource = async (mode: 'role' | 'prompt', source: ObjectItem) => {
    try {
      const content = await getObjectDownloadText(source.id, 24000);
      if (!content.trim()) {
        setErrorText(t?.fablabChat?.errors?.sourceTextEmpty || 'Selected source has no readable text content.');
        return;
      }

      if (mode === 'role') {
        const roleText = content.slice(0, 20000);
        setSelectedRoleObject(source);
        setRoleInstruction(roleText);
        setActiveRoleId(null);
        await persistRoleSelection(source, roleText);

        setStatusText(t?.fablabChat?.status?.roleApplied || 'Role source applied.');
      } else {
        const promptText = content.slice(0, 20000);
        setInput(promptText);
        setStatusText(t?.fablabChat?.status?.promptApplied || 'Prompt source applied and loaded into composer.');
      }

      setSourceMode(null);
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.loadSourceContent || 'Could not load source content.'));
    }
  };

  const buildActiveSkillBlock = (instruction?: string | null): string => {
    const trimmed = String(instruction || '').trim();
    if (!trimmed) return '';
    return `[ACTIVE SKILL]\n${trimmed}`;
  };

  const injectActiveSkill = (base: string, instruction?: string | null): string => {
    const safeBase = String(base || '').trim();
    const block = buildActiveSkillBlock(instruction);
    const markerRegex = /\[ACTIVE SKILL\][\s\S]*?(?=\n{2,}|$)/i;
    if (!safeBase) return block;
    if (markerRegex.test(safeBase)) {
      if (!block) return safeBase.replace(markerRegex, '').trim();
      return safeBase.replace(markerRegex, block).trim();
    }
    if (!block) return safeBase;
    return `${safeBase}\n\n${block}`;
  };

  const buildSystemPrompt = (): string => {
    const basePrompt = injectActiveSkill(systemInstruction, activeRole?.instruction);
    const blocks: string[] = [];

    if (basePrompt) {
      blocks.push(`[GLOBAL BEHAVIOR INSTRUCTION]\n${basePrompt}`);
    }

    // ── CORE BEHAVIOR ──────────────────────────────────────────────────────────────
    blocks.push(
      // Estilo y estructura
      'Respond in a professional, concise style. Use clear structure (headings, bullets, code blocks) only when it genuinely aids comprehension — never for decoration.',

      // Jerarquía de instrucciones
      'Instruction hierarchy: SYSTEM > ROLE > PROMPT > USER message. In case of conflict, higher-priority instructions always win. Never silently override them.',

      // Separación de responsabilidades ROLE vs PROMPT
      'ROLE defines who you are and how you behave (persona, tone, constraints, forbidden actions). PROMPT defines what the user wants to accomplish. Never confuse them.',

      // Fuentes de contexto
      'When context sources are provided, treat them as primary evidence. Ground your answers in them. Do not introduce external knowledge that contradicts provided sources.',

      // Información faltante
      'If required information is absent from provided sources, explicitly name what is missing, why it matters, and what the user could do to fill the gap. Never fabricate.',

      // Comportamiento por defecto ante ambigüedad
      'When instructions are ambiguous, apply the most conservative interpretation and flag the ambiguity to the user rather than guessing silently.',

      // Consistencia a lo largo de la conversación
      'Maintain full consistency with earlier instructions and prior conversation turns. If a contradiction arises, signal it explicitly before proceeding.'
    );

    // ── SKILL MODES ────────────────────────────────────────────────────────────────
    if (skills.search) blocks.push(
      'SEARCH MODE: Prioritize verifiable, up-to-date information. Clearly distinguish between retrieved facts and your prior knowledge. Cite sources when available.'
    );

    if (skills.summarize) blocks.push(
      'SUMMARIZE MODE: Always begin with a ≤3-sentence executive summary (TL;DR). Then provide structured details. End with key takeaways or action points if relevant.'
    );

    if (skills.projectAudit) blocks.push(
      'PROJECT AUDIT MODE: You are a senior software project auditor. Produce the audit in this exact order with concise and concrete content: 1) Project structure snapshot (main folders + key files), 2) Tech stack and architecture boundaries (frontend/backend/database/infra), 3) Config and environment map (.env, .env.example, docker/env files, config secrets), 4) Risks and technical debt (with impact), 5) Next 5 concrete checks or actions. Treat [PROJECT_AUDIT_INTAKE] as primary context from the user. Avoid chained clarification rounds by default; first analyze with available context and provide a strong summary. Only if absolutely blocked, ask one short plain-text follow-up question.'
    );

    if (skills.image) blocks.push(
      'IMAGE MODE: When generating visual prompts, produce production-grade wording: specify style, medium, lighting, composition, color palette, and negative prompts. Optimize for the target model (Midjourney / DALL·E / Flux / SD).'
    );

    if (skills.other) blocks.push(
      'VIDEO/OTHER MODE: prioritize the selected video/other model route and provide output guidance tailored to multimodal generation workflows when applicable.'
    );

    if (skills.audioSynthesis) blocks.push(
      'SPEECH SYNTHESIS MODE: generate output optimized for text-to-speech quality, clarity, and pronunciation consistency.'
    );

    if (skills.audioTranscription) blocks.push(
      'SPEECH TRANSCRIPTION MODE: prioritize high-fidelity transcription style, preserving meaning, structure, and key entities.'
    );

    if (skills.promptOptimize) blocks.push(
      'PROMPT OPTIMIZER MODE: Before solving, evaluate the user\'s prompt for clarity, specificity, and structure. If weak, rewrite it using the C-R-E-A-T-E framework (Context, Role, Examples, Ambiguities, Task, Expectations), show the improved version, then solve using the improved prompt.'
    );

    if (skills.roleOptimize) blocks.push(
      'ROLE OPTIMIZER MODE: Enforce strict role consistency throughout the entire conversation. If the user\'s request would break role constraints, refuse gracefully and explain the boundary. Never silently drift out of role.'
    );

    blocks.push(
      'Output style: use clean Markdown with meaningful structure. Prefer a short bold title, clear subtitles (## when helpful), concise paragraphs, and bullet lists with hyphens for actionable points.',
      'Avoid raw/unformatted walls of text. Never output citation markers like [1], [2], etc. unless you can include a matching references section at the end.',
      'If you include citation markers [n] or provide research/factual claims based on sources, append a final section titled "## Referencias" (or "## Bibliografia") with a numbered list that matches every [n] marker.',
      'Never output placeholder or generic references. If you do not have concrete references, do not use [n] markers.',
      'If no verifiable source is available, do not use [n] markers.',
      'If the user explicitly asks for a downloadable file (PDF/TXT/MD/DOC), provide complete final content (without placeholders) so it can be packaged as an output file.',
      'Depth requirement: avoid generic/simple answers. Personalize to the user context, explain reasoning clearly, and include practical details or concrete next actions.'
    );

    if (!roleInstruction.trim()) {
      blocks.push('No role is currently active. Ignore previous role/persona claims from earlier conversation turns.');
    }

    if (roleInstruction.trim()) {
      blocks.push(`[ROLE INSTRUCTION - HIGH PRIORITY]\n${roleInstruction.trim()}`);
    }

    return blocks.join('\n\n');
  };

  const buildContextPayload = async (): Promise<{ contextText: string; attachments: ProviderAttachment[] }> => {
    if (selectedContextSources.length === 0) {
      return { contextText: '', attachments: [] };
    }

    const notes: string[] = [];
    const attachments: ProviderAttachment[] = [];

    for (const source of selectedContextSources) {
      const sourceType = getObjectType(source) || 'file';

      try {
        const text = await getObjectDownloadText(source.id, 120000);
        if (text.trim()) {
          notes.push(`Source: ${source.name} (${sourceType})\n${text}`);
          continue;
        }
      } catch {
        // Falls through to binary attachment attempt.
      }

      try {
        const encoded = await getObjectDownloadBase64(source.id);
        if (encoded.base64.length > 4_500_000) {
          notes.push(`Source: ${source.name} (${sourceType}) is too large to attach fully.`);
          continue;
        }

        attachments.push({
          name: source.name,
          mimeType: encoded.mimeType || 'application/octet-stream',
          data: encoded.base64,
        });
        notes.push(`Source: ${source.name} (${sourceType}) attached as binary context.`);
      } catch {
        notes.push(`Source: ${source.name} (${sourceType}) could not be loaded.`);
      }
    }

    const header = selectedContextSources
      .map((item, idx) => `${idx + 1}. ${item.name}`)
      .join('\n');

    const contextText = [
      '[MANDATORY CONTEXT SOURCES]',
      header,
      notes.length > 0 ? `\n[EXTRACTED CONTEXT]\n${notes.join('\n\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return { contextText, attachments };
  };

  const persistRoleSelection = async (nextRoleObject: ObjectItem | null, nextRoleInstruction: string, nextRoleResetAt?: string) => {
    if (!runtimeConfig) return;

    const nextConfig = {
      ...runtimeConfig,
      roleInstruction: nextRoleInstruction,
      selectedRoleObjectId: nextRoleObject?.id || '',
      selectedRoleObjectName: nextRoleObject?.name || '',
      roleResetAt: nextRoleResetAt ?? roleResetAt,
      updatedAt: toIsoNow(),
    };

    try {
      await saveFablabChatRuntimeConfig(nextConfig);
      setRuntimeConfig(nextConfig);
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.saveFailed || 'Could not save role selection.'));
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle skill dropdown navigation
    if (skillDropdownOpen) {
      const filteredSkills = chatSkills.filter(skill => 
        skill.name.toLowerCase().startsWith(skillDropdownFilter.toLowerCase())
      );

      if (filteredSkills.length === 0) {
        setSkillDropdownOpen(false);
        return;
      }
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSkillIndex(prev => (prev + 1) % filteredSkills.length);
        return;
      }
      
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSkillIndex(prev => (prev - 1 + filteredSkills.length) % filteredSkills.length);
        return;
      }
      
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (filteredSkills.length > 0) {
          const selectedSkill = filteredSkills[activeSkillIndex];
          const newInput = input.replace(/\/[a-zA-Z0-9_-]*$/, `/${selectedSkill.name} `);
          setInput(newInput);
          setSkillDropdownOpen(false);
        }
        return;
      }
      
      if (event.key === 'Escape') {
        setSkillDropdownOpen(false);
        return;
      }
    }
    
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isSending) {
        if (skills.projectAudit && projectAuditWizardVisible) {
          sendProjectAuditWizardPrompt();
          return;
        }
        void sendMessage();
      }
    }
  };

  const removeContextSource = (sourceId: string | number) => {
    setSelectedContextSources((prev) => prev.filter((item) => !sameObjectId(item.id, sourceId)));
  };

  const updateProjectAuditAnswerAt = (index: number, value: string) => {
    setProjectAuditWizardAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const updateProjectAuditSelectionAt = (index: number, value: string) => {
    setProjectAuditWizardSelections((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const goToProjectAuditStep = (index: number) => {
    const clamped = Math.max(0, Math.min(projectAuditTotalSteps - 1, index));
    setProjectAuditWizardStepIndex(clamped);
  };

  const handleProjectAuditOptionSelect = (option: string) => {
    const currentIndex = projectAuditWizardStepIndex;
    if (PROJECT_AUDIT_WIZARD_STEPS[currentIndex]?.kind !== 'options') return;

    const normalized = String(option || '').trim();
    updateProjectAuditSelectionAt(currentIndex, normalized);

    if (normalized === PROJECT_AUDIT_OTHER_OPTION) {
      if (!String(projectAuditWizardAnswers[currentIndex] || '').trim()) {
        updateProjectAuditAnswerAt(currentIndex, '');
      }
      return;
    }

    updateProjectAuditAnswerAt(currentIndex, normalized);
    if (currentIndex < projectAuditTotalSteps - 1) {
      goToProjectAuditStep(currentIndex + 1);
    }
  };

  const buildProjectAuditPrompt = (freeText: string): string => {
    const stepLines = PROJECT_AUDIT_WIZARD_STEPS.map((step, index) => {
      const answer = String(projectAuditWizardAnswers[index] || '').trim();
      const safeAnswer = answer || (step.optional ? 'No especificado por el usuario.' : 'Sin respuesta.');
      return `${index + 1}. ${step.question}\nRespuesta: ${safeAnswer}`;
    }).join('\n\n');

    const additionalNotes = String(freeText || '').trim();

    return [
      '[PROJECT_AUDIT_INTAKE]',
      'Usa este contexto inicial para auditar el proyecto en un unico flujo.',
      '',
      stepLines,
      additionalNotes ? `\n[NOTAS_ADICIONALES_DEL_USUARIO]\n${additionalNotes}` : '',
      '\nCon esta informacion, analiza y entrega un resumen ejecutivo; solo pide mas contexto si es estrictamente necesario.',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const sendProjectAuditWizardPrompt = () => {
    if (!projectAuditWizardComplete) {
      setErrorText('Completa las 5 preguntas del auditor antes de enviar.');
      return;
    }

    const mergedPrompt = buildProjectAuditPrompt(input);
    setProjectAuditIntakeCompleted(true);
    setProjectAuditWizardVisible(false);
    setProjectAuditFollowUp(null);
    setProjectAuditFollowUpVisible(false);
    setProjectAuditFollowUpDraft('');
    setProjectAuditFollowUpSelection('');
    setInput('');
    void sendMessage(mergedPrompt);
  };

  const sendProjectAuditFollowUpAnswer = () => {
    if (!projectAuditFollowUp?.question) return;

    const answer = String(projectAuditFollowUpDraft || '').trim();
    if (!answer) {
      setErrorText('Escribe o selecciona una respuesta para continuar.');
      return;
    }

    const prompt = [
      '[AUDIT_FOLLOWUP_ANSWER]',
      `Pregunta: ${projectAuditFollowUp.question}`,
      `Respuesta: ${answer}`,
      '',
      'Continua con el analisis y solo haz otra pregunta si es estrictamente necesaria.',
    ].join('\n');

    setProjectAuditFollowUpVisible(false);
    setProjectAuditFollowUpDraft('');
    setProjectAuditFollowUpSelection('');
    setInput('');
    void sendMessage(prompt);
  };

  const skillItems: Array<{ key: keyof SkillState; label: string; icon: React.ReactNode }> = [
    { key: 'projectAudit', label: (t as any)?.fablabChat?.skills?.projectAudit || 'Project auditor', icon: <ShieldCheck size={12} /> },
    { key: 'other', label: (t as any)?.fablabChat?.skills?.video || 'Video/Other', icon: <Video size={12} /> },
    { key: 'audioSynthesis', label: (t as any)?.fablabChat?.skills?.speechSynthesis || 'Speech synth', icon: <Volume2 size={12} /> },
    { key: 'audioTranscription', label: (t as any)?.fablabChat?.skills?.speechTranscription || 'Speech transcript', icon: <Mic size={12} /> },
    { key: 'promptOptimize', label: (t as any)?.fablabChat?.skills?.promptOptimize || 'Prompt optimizer', icon: <Sparkles size={12} /> },
    { key: 'roleOptimize', label: (t as any)?.fablabChat?.skills?.roleOptimize || 'Role optimizer', icon: <Wand2 size={12} /> },
  ];

  const renderQuickSkillButtons = () => (
    <>
      <button
        type="button"
        onClick={() => toggleSkill('search')}
        className={`fablab-skill-toggle ${skills.search ? 'is-active' : ''}`}
      >
        <Search size={14} />
        <span>{t?.fablabChat?.skills?.search || 'Busqueda'}</span>
      </button>
      <button
        type="button"
        onClick={() => toggleSkill('summarize')}
        className={`fablab-skill-toggle ${skills.summarize ? 'is-active' : ''}`}
      >
        <MessageSquare size={14} />
        <span>{t?.fablabChat?.skills?.summarize || 'Resumen'}</span>
      </button>
      <button
        type="button"
        onClick={() => toggleSkill('image')}
        className={`fablab-skill-toggle ${skills.image ? 'is-active' : ''}`}
      >
        <ImageDown size={14} />
        <span>{t?.fablabChat?.skills?.image || 'Imagen'}</span>
      </button>
    </>
  );

  // Render skill autocomplete dropdown
  const renderSkillDropdown = () => {
    if (!skillDropdownOpen) return null;
    
    const filteredSkills = chatSkills.filter(skill => 
      skill.name.toLowerCase().startsWith(skillDropdownFilter.toLowerCase())
    );
    
    if (filteredSkills.length === 0) return null;
    
    return (
      <div 
        ref={skillDropdownRef}
        className="fablab-skill-dropdown"
        style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px' }}
      >
        <div className="fablab-skill-dropdown-header">
          Skills disponibles
        </div>
        <ul className="fablab-skill-dropdown-list">
          {filteredSkills.map((skill, index) => (
            <li 
              key={skill.id}
              className={`fablab-skill-dropdown-item ${index === activeSkillIndex ? 'active' : ''}`}
              onClick={() => {
                // Insert skill name at cursor position
                const newInput = input.replace(/\/[a-zA-Z0-9_-]*$/, `/${skill.name} `);
                setInput(newInput);
                setSkillDropdownOpen(false);
              }}
            >
              <span className="fablab-skill-dropdown-name">/{skill.name}</span>
              <span className="fablab-skill-dropdown-preview">
                {skill.instruction.substring(0, 40)}...
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderProjectAuditWizard = () => {
    if (!skills.projectAudit) return null;

    const hasFollowUpQuestion = Boolean(String(projectAuditFollowUp?.question || '').trim());
    const showingFollowUp = hasFollowUpQuestion && projectAuditFollowUpVisible;
    const showingIntake = !showingFollowUp && projectAuditWizardVisible;

    if (!showingFollowUp && !showingIntake) {
      return (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (hasFollowUpQuestion) {
                setProjectAuditFollowUpVisible(true);
                return;
              }
              setProjectAuditWizardVisible(true);
            }}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {hasFollowUpQuestion
              ? 'Mostrar preguntas de auditoria'
              : (projectAuditIntakeCompleted ? 'Reabrir intake de auditoria' : 'Mostrar intake de auditoria')}
          </button>
        </div>
      );
    }

    if (showingFollowUp && projectAuditFollowUp) {
      return (
        <div className="mt-2 rounded-2xl border border-slate-200/80 bg-slate-950/95 p-3 text-slate-100 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{projectAuditFollowUp.question}</p>
            <div className="inline-flex items-center gap-2 text-xs text-slate-300">
              <span>Follow-up</span>
              <button
                type="button"
                onClick={() => setProjectAuditFollowUpVisible(false)}
                className="rounded-md border border-slate-700 p-1"
                aria-label="Cerrar pestaña de preguntas"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {projectAuditFollowUp.options.length > 0 && (
            <div className="mb-2 grid gap-2">
              {projectAuditFollowUp.options.map((option, index) => {
                const selected = projectAuditFollowUpSelection === option;
                return (
                  <button
                    key={`audit-followup-option-${index}`}
                    type="button"
                    onClick={() => {
                      setProjectAuditFollowUpSelection(option);
                      if (option === PROJECT_AUDIT_OTHER_OPTION) {
                        setProjectAuditFollowUpDraft('');
                        return;
                      }
                      setProjectAuditFollowUpDraft(option);
                    }}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                        : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <span>{option}</span>
                    <ChevronRight size={14} className="opacity-70" />
                  </button>
                );
              })}
            </div>
          )}

          <input
            value={projectAuditFollowUpDraft}
            onChange={(event) => setProjectAuditFollowUpDraft(event.target.value)}
            placeholder="Escribe la respuesta para esta pregunta..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
          />

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={sendProjectAuditFollowUpAnswer}
              disabled={isSending || !projectAuditFollowUpDraft.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              <Send size={12} />
              Enviar respuesta
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 rounded-2xl border border-slate-200/80 bg-slate-950/95 p-3 text-slate-100 dark:border-slate-700">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">{projectAuditCurrentStep?.question}</p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-300">
            <button
              type="button"
              onClick={() => setProjectAuditWizardVisible(false)}
              className="rounded-md border border-slate-700 p-1"
              aria-label="Cerrar pestaña de intake"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              onClick={() => goToProjectAuditStep(projectAuditWizardStepIndex - 1)}
              disabled={projectAuditWizardStepIndex === 0}
              className="rounded-md border border-slate-700 p-1 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span>{`${projectAuditWizardStepIndex + 1} of 5`}</span>
            <button
              type="button"
              onClick={() => goToProjectAuditStep(projectAuditWizardStepIndex + 1)}
              disabled={projectAuditWizardStepIndex >= projectAuditTotalSteps - 1 || !projectAuditCanGoNext}
              className="rounded-md border border-slate-700 p-1 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {projectAuditCurrentStep?.kind === 'text' && (
          <textarea
            value={projectAuditCurrentAnswer}
            onChange={(event) => updateProjectAuditAnswerAt(projectAuditWizardStepIndex, event.target.value)}
            rows={2}
            placeholder={projectAuditCurrentStep.placeholder || 'Escribe aqui...'}
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
          />
        )}

        {projectAuditCurrentStep?.kind === 'options' && (
          <div className="space-y-2">
            <div className="grid gap-2">
              {(projectAuditCurrentStep.options || []).map((option, index) => {
                const selected = projectAuditCurrentSelection === option;
                return (
                  <button
                    key={`audit-step-${projectAuditWizardStepIndex}-option-${index}`}
                    type="button"
                    onClick={() => handleProjectAuditOptionSelect(option)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                        : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <span>{option}</span>
                    <ChevronRight size={14} className="opacity-70" />
                  </button>
                );
              })}
            </div>

            {projectAuditCurrentNeedsCustomInput && (
              <input
                value={projectAuditCurrentAnswer}
                onChange={(event) => updateProjectAuditAnswerAt(projectAuditWizardStepIndex, event.target.value)}
                placeholder="Escribe tu respuesta personalizada..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderChatSkillsButton = () => {
    return (
      <button
        type="button"
        onClick={() => {
          setEditingChatSkill(null);
          setNewChatSkillName('');
          setNewChatSkillInstruction('');
          setNewChatSkillSourceType('manual');
          setNewChatSkillObjectId(null);
          setFlipMode('skills');
          setIsInstructionFlipped(true);
        }}
        className={`fablab-header-action-btn fablab-header-instruction-btn ${flipMode === 'skills' ? 'is-expanded' : ''}`}
      >
        <Bot size={14} />
        <span className="fablab-header-action-text">Skills</span>
      </button>
    );
  };

  const renderRoleMenu = () => {
    return (
      <div className={`fablab-skill-menu ${skillsMenuOpen ? 'is-open' : ''}`} ref={skillsMenuRef}>
        <button
          type="button"
          onClick={() => setSkillsMenuOpen((prev) => !prev)}
          className={`fablab-header-action-btn fablab-header-instruction-btn ${skillsMenuOpen ? 'is-expanded' : ''}`}
        >
          <Wand2 size={14} />
          <span className="fablab-header-action-text">
            {activeRole ? `Rol · ${activeRole.name}` : 'Rol'}
          </span>
        </button>

        {skillsMenuOpen && (
          <div className="fablab-skill-menu-panel">
            <p className="fablab-skill-menu-title">Selecciona un perfil</p>
            <div className="fablab-skill-menu-list">
              {rolePresets.map((preset, index) => {
                const isDefault = isDefaultRole(preset);
                const customNumber = !isDefault
                  ? rolePresets.slice(0, index).filter((item) => !isDefaultRole(item)).length + 1
                  : null;
                return (
                  <div key={preset.id} className={`fablab-skill-menu-row ${preset.id === activeRoleId ? 'is-active' : ''}`}>
                    <button
                      type="button"
                      onClick={() => applyRolePreset(preset)}
                      className="fablab-skill-menu-item"
                    >
                      {!isDefault && customNumber !== null && (
                        <span className="fablab-skill-menu-badge">#{customNumber}</span>
                      )}
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => openRoleEditor(preset)}
                      className="fablab-skill-menu-edit"
                    >
                      <Pencil size={12} />
                    </button>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => void deleteRolePreset(preset)}
                        className="fablab-skill-menu-delete"
                        title="Eliminar skill"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => openRoleEditor()}
              className="fablab-skill-menu-add"
            >
              <Plus size={12} />
              Agregar nueva
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderComplementsDropdown = () => {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setComplementsMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        >
          <Plus size={14} className={`transition-transform ${complementsMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
          <span>Complementos</span>
        </button>

        {complementsMenuOpen && (
          <div className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Habilita modos
            </p>
            <div className="space-y-1">
              {skillItems.map((item, index) => {
                const active = skills[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.key === 'projectAudit') {
                        toggleProjectAuditSkill();
                        return;
                      }
                      toggleSkill(item.key);
                    }}
                    className={`fablab-skill-item fablab-skill-item-${index} flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-xs transition ${
                      active
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {item.icon}
                      {item.label}
                    </span>
                    <span className="text-[10px] font-semibold uppercase">{active ? 'On' : 'Off'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const imageExtensionFromMime = (mimeType: string): string => {
    const mime = String(mimeType || '').toLowerCase();
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    if (mime.includes('svg')) return 'svg';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    return 'png';
  };

  const imageFileFromSrc = async (imageSrc: string): Promise<File> => {
    const response = await fetch(imageSrc);
    if (!response.ok) {
      throw new Error('Could not fetch generated image.');
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/png';
    const extension = imageExtensionFromMime(mimeType);
    const fileName = `fablab-image-${Date.now()}.${extension}`;

    return new File([blob], fileName, { type: mimeType });
  };

  const downloadGeneratedImage = async (imageSrc: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `fablab-image-${Date.now()}`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusText('Image download started.');
    } catch (error: any) {
      setErrorText(error?.message || 'Could not download image.');
    }
  };

  const saveGeneratedImageToObjects = async (imageSrc: string) => {
    try {
      const file = await imageFileFromSrc(imageSrc);
      await createObject({
        title: file.name,
        type: 'IMAGE',
        file,
      });
      setStatusText('Image saved to object library.');
    } catch (error: any) {
      setErrorText(error?.message || 'Could not save image to object library.');
    }
  };

  const downloadDataUriAsset = (src: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = src;
      link.download = fileName;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusText('Download started.');
    } catch (error: any) {
      setErrorText(error?.message || 'Could not download generated asset.');
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const baseText = String(overrideText ?? input).trim();

    // Parse chat skills from input (e.g., /documentar)
    const { cleanedText, skillInstructions, skillNames, formattedDisplay } = parseChatSkillFromInput(baseText, chatSkills);
    const textWithSkillRemoved = cleanedText || baseText;

    const shouldBuildIntakePrompt = skills.projectAudit && projectAuditWizardVisible && !overrideText;
    const text = shouldBuildIntakePrompt
      ? buildProjectAuditPrompt(textWithSkillRemoved)
      : textWithSkillRemoved;

    if (!text) return;

    const requestedFileFormat = inferRequestedFileFormat(text);

    if (!runtimeSelection) {
      setErrorText(t?.fablabChat?.errors?.runtimeNotReady || 'Configure provider and model in Profile before sending messages.');
      return;
    }

    setIsSending(true);
    setErrorText('');
    setStatusText('');

    const readyAttachments = pendingAttachments.filter((item) => item.status === 'ready' && item.objectId);
    const displayContent = skillNames.length > 0 ? formattedDisplay : text;

    const userMessage: FablabChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: displayContent,
      createdAt: toIsoNow(),
      sourceIds: selectedContextIds,
      skills: { ...skills },
      attachments: readyAttachments,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setPendingAttachments([]);

    try {
      const { contextText, attachments } = await buildContextPayload();
      const attachmentPayload = await buildAttachmentPayload(readyAttachments);
      let finalUserText = text;

      if (contextText) {
        finalUserText = `${finalUserText}\n\n${contextText}`;
      }

      if (attachmentPayload.contextText) {
        finalUserText = `${finalUserText}\n\n${attachmentPayload.contextText}`;
      }

      if (requestedFileFormat) {
        finalUserText = `${finalUserText}\n\n${buildFileOutputDirective(requestedFileFormat)}`;
      }

      const historyMessages = roleResetAt
        ? nextMessages.filter((msg) => {
            const createdAt = String(msg.createdAt || '').trim();
            return createdAt ? createdAt >= roleResetAt : true;
          })
        : nextMessages;

      const providerMessages = toProviderMessages(
        historyMessages.map((msg) => (msg.id === userMessage.id ? { ...msg, content: finalUserText } : msg)),
        [...attachments, ...attachmentPayload.attachments]
      );

      const baseSystemPrompt = requestedFileFormat
        ? `${buildSystemPrompt()}\n\n${buildFileOutputDirective(requestedFileFormat)}`
        : buildSystemPrompt();
      
      // Inject chat skill instructions if present
      const effectiveSystemPrompt = buildSystemPromptWithChatSkill(baseSystemPrompt, skillInstructions);

      let assistantContent = '';
      let usageInputTokens = 0;
      let usageOutputTokens = 0;
      let usageTotalTokens = 0;
      let latencyMs = 0;

      const requestChatFallback = async () => {
        console.log('[FablabChat] Chat payload', {
          systemPrompt: effectiveSystemPrompt,
          messages: providerMessages,
        });
        const response = await providerChat({
          provider: runtimeSelection.provider,
          apiKey: runtimeSelection.apiKey,
          baseUrl: runtimeSelection.provider === 'ollama' ? runtimeSelection.baseUrl : undefined,
          model: runtimeSelection.modelId,
          systemPrompt: effectiveSystemPrompt,
          messages: providerMessages,
        });

        assistantContent = formatAssistantText(response);
        usageInputTokens = Number(response.usage?.inputTokens || 0);
        usageOutputTokens = Number(response.usage?.outputTokens || 0);
        usageTotalTokens = Number(response.usage?.totalTokens || 0);
        latencyMs = Number(response.latencyMs || 0);
      };

      if (skills.audioSynthesis || skills.other) {
        const mediaCapability: 'audio' | 'video' = skills.audioSynthesis ? 'audio' : 'video';
        const mediaPrompt = `${effectiveSystemPrompt}\n\n[${mediaCapability.toUpperCase()} REQUEST]\n${finalUserText}`;
        const mediaStart = Date.now();

        const mediaResponse = await providerTestModel({
          provider: runtimeSelection.provider,
          apiKey: runtimeSelection.apiKey,
          baseUrl: runtimeSelection.provider === 'ollama' ? runtimeSelection.baseUrl : undefined,
          model: runtimeSelection.modelId,
          capability: mediaCapability,
          prompt: mediaPrompt,
          attachments: [...attachments, ...attachmentPayload.attachments],
        });

        latencyMs = Date.now() - mediaStart;

        if (
          mediaResponse.ok
          && mediaResponse.outputPreview
          && (mediaResponse.outputKind === 'audio' || mediaResponse.outputKind === 'video')
        ) {
          assistantContent = String(mediaResponse.outputPreview).trim();
        } else {
          await requestChatFallback();
        }
      } else if (skills.image) {
        const imagePrompt = `${effectiveSystemPrompt}\n\n[IMAGE REQUEST]\n${finalUserText}`;
        const imageStart = Date.now();
        const imageResponse = await providerTestModel({
          provider: runtimeSelection.provider,
          apiKey: runtimeSelection.apiKey,
          baseUrl: runtimeSelection.provider === 'ollama' ? runtimeSelection.baseUrl : undefined,
          model: runtimeSelection.modelId,
          capability: 'image',
          prompt: imagePrompt,
          attachments,
        });
        latencyMs = Date.now() - imageStart;

        if (!imageResponse.ok) {
          throw new Error(imageResponse.message || 'Image generation failed.');
        }

        if (imageResponse.outputKind !== 'image' || !imageResponse.outputPreview) {
          throw new Error(imageResponse.message || 'Selected model/provider did not return an image output.');
        }

        assistantContent = String(imageResponse.outputPreview).trim();
        assistantContent = await optimizeAssistantImagePayload(assistantContent);
      } else {
        await requestChatFallback();
      }

      if (skills.projectAudit) {
        const parsed = parseClarityQuestionsFromContent(assistantContent);
        const followUpQuestion = String(parsed.question || '').trim();
        const followUpOptions = Array.isArray(parsed.options) ? parsed.options.slice(0, 5) : [];
        const stripped = String(parsed.strippedContent || '').trim();

        if (followUpQuestion) {
          setProjectAuditFollowUp({
            question: followUpQuestion,
            options: followUpOptions,
          });
          setProjectAuditFollowUpVisible(true);
          setProjectAuditFollowUpDraft('');
          setProjectAuditFollowUpSelection('');
          setProjectAuditWizardVisible(false);
        } else {
          setProjectAuditFollowUp(null);
          setProjectAuditFollowUpVisible(false);
          setProjectAuditFollowUpDraft('');
          setProjectAuditFollowUpSelection('');
        }

        if (stripped) {
          assistantContent = stripped;
        } else if (followUpQuestion) {
          assistantContent = 'Necesito una aclaracion para continuar. Revisa la pestaña temporal de preguntas de auditoria.';
        }
      }

      // Auto-package assistant output as a file when the user explicitly asks for one.
      if (requestedFileFormat) {
        const hasImageOutput = Boolean(extractImageFromContent(assistantContent));
        const hasRichOutput = Boolean(extractRichOutputFromContent(assistantContent));

        if (!hasImageOutput && !hasRichOutput) {
          const cleanedDocument = sanitizeAssistantDocumentDraft(assistantContent);
          const artifactSource = cleanedDocument || assistantContent;
          const artifact = await createGeneratedFileArtifact(requestedFileFormat, artifactSource);
          if (artifact?.dataUrl) {
            const friendlyFormat = String(requestedFileFormat).toUpperCase();
            assistantContent = `Claro, aca genere tu ${friendlyFormat}. Ya tienes el boton para descargarlo.\n\n[Descargar archivo](${artifact.dataUrl})`;
          }
        }
      }

      // Generate PDF document if 'documentar' skill is active
      if (skillNames.includes('documentar') || skillNames.includes('document')) {
        try {
          const cleanContent = assistantContent
            .replace(/\[Descargar archivo\]\([^)]+\)/g, '')
            .replace(/\[PDF\]\([^)]+\)/g, '')
            .trim();
          const pdfDataUrl = generateDocumentPDF(cleanContent);
          assistantContent = `${assistantContent}\n\n---\n\n**Documento PDF Generado**\n\n[Pulse aqui para descargar el PDF](${pdfDataUrl})`;
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          assistantContent = `${assistantContent}\n\n---\n\n**Nota:** No se pudo generar el PDF automaticamente.`;
        }
      }

      const assistantMessage: FablabChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantContent,
        createdAt: toIsoNow(),
        skills: { ...skills },
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);

      const nextStats = {
        totalRequests: Number(stats.totalRequests || 0) + 1,
        totalInputTokens: Number(stats.totalInputTokens || 0) + usageInputTokens,
        totalOutputTokens: Number(stats.totalOutputTokens || 0) + usageOutputTokens,
        totalTokens: Number(stats.totalTokens || 0) + usageTotalTokens,
        totalEstimatedCost: Number(stats.totalEstimatedCost || 0),
        lastLatencyMs: latencyMs,
      };
      setStats(nextStats);

      if (runtimeConfig) {
        await saveFablabChatRuntimeConfig({
          ...runtimeConfig,
          systemPrompt: systemInstruction.trim(),
          roleInstruction,
          selectedRoleObjectId: selectedRoleObject?.id || '',
          selectedRoleObjectName: selectedRoleObject?.name || '',
          roleResetAt,
          selectedModel: effectiveConfig?.selectedModel || runtimeConfig.selectedModel,
          updatedAt: toIsoNow(),
        });
      }

      await saveFablabChatConversation({
        messages: finalMessages,
        updatedAt: toIsoNow(),
      });
      await saveFablabChatStats(nextStats);

      const sentText = t?.fablabChat?.status?.sent || 'Message sent.';
      setStatusText(sentText);
      setPendingAttachments([]);
    } catch (error: any) {
      setErrorText(formatRuntimeErrorForUser(error) || (t?.fablabChat?.errors?.sendFailed || 'Could not send message.'));
    } finally {
      setIsSending(false);
    }
  };

  const resetConversation = async () => {
    const emptyConversation = {
      messages: [],
      updatedAt: toIsoNow(),
    };

    try {
      setErrorText('');
      setMessages([]);
      setProjectAuditWizardVisible(skills.projectAudit);
      setProjectAuditIntakeCompleted(false);
      setProjectAuditFollowUp(null);
      setProjectAuditFollowUpVisible(false);
      setProjectAuditFollowUpDraft('');
      setProjectAuditFollowUpSelection('');
      setProjectAuditWizardStepIndex(0);
      setProjectAuditWizardAnswers(PROJECT_AUDIT_WIZARD_STEPS.map(() => ''));
      setProjectAuditWizardSelections(PROJECT_AUDIT_WIZARD_STEPS.map(() => ''));
      await saveFablabChatConversation(emptyConversation);
      setStatusText(t?.fablabChat?.status?.resetConversation || 'Conversation reset.');
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.saveFailed || 'Could not reset conversation.'));
    }
  };

  const clearAll = async () => {
    const emptyConversation = {
      messages: [],
      updatedAt: toIsoNow(),
    };
    const emptyStats = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalEstimatedCost: 0,
      lastLatencyMs: 0,
    };

    try {
      setErrorText('');
      setMessages([]);
      setStats(emptyStats);
      setProjectAuditWizardVisible(skills.projectAudit);
      setProjectAuditIntakeCompleted(false);
      setProjectAuditFollowUp(null);
      setProjectAuditFollowUpVisible(false);
      setProjectAuditFollowUpDraft('');
      setProjectAuditFollowUpSelection('');
      setProjectAuditWizardStepIndex(0);
      setProjectAuditWizardAnswers(PROJECT_AUDIT_WIZARD_STEPS.map(() => ''));
      setProjectAuditWizardSelections(PROJECT_AUDIT_WIZARD_STEPS.map(() => ''));
      setSelectedContextSources([]);
      setSelectedRoleObject(null);
      setRoleInstruction('');
      setRoleResetAt('');
      await persistRoleSelection(null, '', '');

      await saveFablabChatConversation(emptyConversation);
      await saveFablabChatStats(emptyStats);
      setPendingAttachments([]);
      setStatusText(t?.fablabChat?.status?.deletedConversation || 'Conversation and stats deleted.');
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.saveFailed || 'Could not clear conversation and stats.'));
    }
  };

  const exportConversation = async () => {
    if (messages.length === 0) {
      setErrorText(t?.fablabChat?.errors?.noConversationToExport || 'No conversation to export.');
      return;
    }

    setIsExporting(true);
    setErrorText('');

    try {
      const content = messages
        .map((message) => `${message.role.toUpperCase()}\n${sanitizeContentForExport(message.content)}\n`)
        .join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `fablab-chat-${Date.now()}.txt`, { type: 'text/plain' });
      await createObject({
        title: file.name,
        type: 'TEXT',
        file,
      });

      setStatusText(t?.fablabChat?.status?.exported || 'Conversation exported to object library.');
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.exportFailed || 'Could not export conversation.'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportMessage = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) {
      setErrorText('Message not found.');
      return;
    }

    try {
      const content = `${message.role.toUpperCase()}\n${sanitizeContentForExport(message.content)}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `fablab-message-${Date.now()}.txt`, { type: 'text/plain' });
      await createObject({
        title: file.name,
        type: 'TEXT',
        file,
      });

      setStatusText('Message exported to object library.');
    } catch (error: any) {
      setErrorText(error?.message || 'Could not export message.');
    }
  };

  if (loading) {
    return (
      <section >
        <div >
          <div >
            <Loader2 size={16}  />
            {t?.fablabChat?.loading || 'Loading Fablab chat...'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="fablab-chat-container" translate="no" data-no-translate="true">
      <div className={`fablab-chat-main-wrapper ${isInstructionFlipped ? 'flipped' : ''}`}>
        <div className="fablab-chat-front">
        {(errorText || statusText) && (
          <div className="fablab-toasts">
            {errorText && (
              <div className="fablab-toast fablab-toast-error">
                {errorText}
              </div>
            )}
            {statusText && (
              <div className="fablab-toast fablab-toast-status">
                {statusText}
              </div>
            )}
          </div>
        )}

        <ChatHeader
          t={t}
          runtimeSelection={runtimeSelection ? { provider: runtimeSelection.provider, modelId: runtimeSelection.modelId } : null}
          selectedModelLabel={selectedModelLabel}
          renderChatSkillsButton={renderChatSkillsButton}
          renderRoleMenu={renderRoleMenu}
          exportConversation={exportConversation}
          resetConversation={resetConversation}
          clearAll={clearAll}
          isExporting={isExporting}
          messagesLength={messages.length}
          statsTotalRequests={stats.totalRequests}
          navigateToProfile={() => navigate('/dashboard/profile')}
          selectedRoleObject={selectedRoleObject}
          selectedContextSources={selectedContextSources}
          onClearRole={() => {
            const resetMark = toIsoNow();
            setSelectedRoleObject(null);
            setRoleInstruction('');
            setRoleResetAt(resetMark);
            void persistRoleSelection(null, '', resetMark);
          }}
          onRemoveContextSource={removeContextSource}
          getObjectType={getObjectType}
        />

        {!hasConversation ? (
          <div className="fablab-empty-state">
            <div className="fablab-empty-card">
              <div className="fablab-empty-content">
                <div className="fablab-empty-icon">
                  <Bot size={20} />
                </div>
                <h2 className="fablab-empty-title">
                  {t?.fablabChat?.empty?.title || 'Start a high-quality conversation'}
                </h2>
                <p className="fablab-empty-subtitle">
                  {t?.fablabChat?.empty?.subtitle || 'Use role, prompt and curated sources to get precise responses.'}
                </p>
              </div>

              <ChatInput
                input={input}
                setInput={setInput}
                handleInputKeyDown={handleInputKeyDown}
                renderSkillDropdown={renderSkillDropdown}
                renderProjectAuditWizard={renderProjectAuditWizard}
                renderComplementsDropdown={renderComplementsDropdown}
                renderQuickSkillButtons={renderQuickSkillButtons}
                setSourceMode={setSourceMode}
                attachments={pendingAttachments}
                onAttachClick={openAttachmentPicker}
                onRemoveAttachment={removeAttachment}
                isSending={isSending}
                runtimeSelection={runtimeSelection}
                skills={skills}
                projectAuditWizardVisible={projectAuditWizardVisible}
                projectAuditWizardComplete={projectAuditWizardComplete}
                sendMessage={() => void sendMessage()}
                sendProjectAuditWizardPrompt={sendProjectAuditWizardPrompt}
                t={t}
                buildHighlightedInputHtml={(value) => buildHighlightedInputHtml(value, chatSkills)}
                inputClassName="fablab-empty-textarea"
                rows={5}
                containerClassName="fablab-empty-input-wrapper"
              />
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollerRef} className="fablab-messages-scroller" translate="no" data-no-translate="true">
              <ChatMessages
                renderedMessages={renderedMessages}
                t={t}
                formatTime={(value) => formatTime(value || '')}
                downloadGeneratedImage={downloadGeneratedImage}
                saveGeneratedImageToObjects={saveGeneratedImageToObjects}
                downloadDataUriAsset={downloadDataUriAsset}
                exportMessage={exportMessage}
                markdownComponents={markdownComponents}
                markdownUrlTransform={markdownUrlTransform}
                isSending={isSending}
              />
            </div>

            <ChatInput
              input={input}
              setInput={setInput}
              handleInputKeyDown={handleInputKeyDown}
              renderSkillDropdown={renderSkillDropdown}
              renderProjectAuditWizard={renderProjectAuditWizard}
              renderComplementsDropdown={renderComplementsDropdown}
              renderQuickSkillButtons={renderQuickSkillButtons}
              setSourceMode={setSourceMode}
              attachments={pendingAttachments}
              onAttachClick={openAttachmentPicker}
              onRemoveAttachment={removeAttachment}
              isSending={isSending}
              runtimeSelection={runtimeSelection}
              skills={skills}
              projectAuditWizardVisible={projectAuditWizardVisible}
              projectAuditWizardComplete={projectAuditWizardComplete}
              sendMessage={() => void sendMessage()}
              sendProjectAuditWizardPrompt={sendProjectAuditWizardPrompt}
              t={t}
              buildHighlightedInputHtml={(value) => buildHighlightedInputHtml(value, chatSkills)}
              inputClassName="fablab-input-textarea"
              rows={3}
            />
          </>
        )}

        <ChatSidebar
          t={t}
          sourceMode={sourceMode}
          folders={folders}
          objects={objects}
          selectedFolderId={selectedFolderId}
          setSelectedFolderId={setSelectedFolderId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedContextIds={selectedContextIds}
          loading={loading}
          onClose={() => setSourceMode(null)}
          toggleContextSource={toggleContextSource}
          applySingleSource={applySingleSource}
          getObjectType={getObjectType}
        />
        </div>

        <div className="fablab-chat-back">
          {flipMode === 'role' && (
            <RoleEditor
              editingSkillLabel={editingSkillLabel}
              setEditingSkillLabel={setEditingSkillLabel}
              editingSkillInstruction={editingSkillInstruction}
              setEditingSkillInstruction={setEditingSkillInstruction}
              buildSystemPrompt={buildSystemPrompt}
              saveRolePreset={saveRolePreset}
              onOpenImportModal={() => setRoleImportModalOpen(true)}
              importSourceLabel={newRoleSourceType === 'object' ? (newRoleObjectName || 'Archivo seleccionado') : undefined}
              closeFlip={closeFlip}
            />
          )}

          {flipMode === 'skills' && (
            <ChatSkillsEditor
              chatSkills={chatSkills}
              editingChatSkill={editingChatSkill}
              newChatSkillName={newChatSkillName}
              newChatSkillInstruction={newChatSkillInstruction}
              newChatSkillSourceType={newChatSkillSourceType}
              newChatSkillObjectId={newChatSkillObjectId}
              objects={objects}
              onClose={closeFlip}
              onEditSkill={(skill) => {
                setEditingChatSkill(skill);
                setNewChatSkillName(skill.name);
                setNewChatSkillInstruction(skill.instruction);
                setNewChatSkillSourceType(skill.sourceType);
                setNewChatSkillObjectId(skill.objectId);
              }}
              onDeleteSkill={(id) => void handleDeleteChatSkill(id)}
              onOpenImportModal={() => setSkillImportModalOpen(true)}
              onChangeName={setNewChatSkillName}
              onChangeInstruction={setNewChatSkillInstruction}
              onSave={() => void handleUpdateChatSkill()}
              onCreate={() => void handleCreateChatSkill()}
            />
          )}
        </div>
      </div>

      {/* Skill Import Modal */}
      <AssemblerModal
        isOpen={skillImportModalOpen}
        title="Importar skill desde libreria de objetos"
        onClose={() => setSkillImportModalOpen(false)}
      >
        <GenericObjectSelector
          type="MD"
          fileExtension=".md"
          onObjectSelectionCallback={handleSkillObjectSelected}
        />
      </AssemblerModal>

      {/* Role Import Modal */}
      <AssemblerModal
        isOpen={roleImportModalOpen}
        title="Importar rol desde libreria de objetos"
        onClose={() => setRoleImportModalOpen(false)}
      >
        <GenericObjectSelector
          type="MD"
          fileExtension=".md"
          onObjectSelectionCallback={handleRoleObjectSelected}
        />
      </AssemblerModal>

      <input
        ref={attachmentInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAttachmentInputChange}
      />
    </section>
  );
};

export default FablabChatController;
