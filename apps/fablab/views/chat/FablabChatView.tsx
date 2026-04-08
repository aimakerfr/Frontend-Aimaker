import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Download,
  FolderPlus,
  ImageDown,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
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
  type FablabChatMessage,
  type FablabChatRuntimeConfig,
  type FablabChatRuntimeState,
} from '@core/fablab-chat';
import { useLanguage } from '../../language/useLanguage';

type SkillState = {
  search: boolean;
  summarize: boolean;
  image: boolean;
  other: boolean;
  audioSynthesis: boolean;
  audioTranscription: boolean;
  promptOptimize: boolean;
  roleOptimize: boolean;
};

type SourceMode = 'context' | 'role' | 'prompt' | null;

type ProviderAttachment = NonNullable<ProviderChatMessage['attachments']>[number];

const initialSkills: SkillState = {
  search: false,
  summarize: false,
  image: false,
  other: false,
  audioSynthesis: false,
  audioTranscription: false,
  promptOptimize: false,
  roleOptimize: false,
};

const textFriendlyTypes = ['markdown', 'txt', 'pdf', 'doc', 'docx', 'json'];
const toIsoNow = () => new Date().toISOString();
const RAW_DATA_IMAGE_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i;
const MARKDOWN_DATA_IMAGE_REGEX_GLOBAL = /!\[[^\]]*\]\((data:image[^)]+)\)/gi;
const IMAGE_URL_ONLY_REGEX = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i;
const INLINE_DATA_IMAGE_REGEX_GLOBAL = /data:image\/[^\s)]+/gi;

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
  return messages.map((message, index) => {
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
};

const formatAssistantText = (response: ProviderChatResponse): string => {
  const content = String(response.content || '').trim();
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

const redactInlineDataImagePayload = (content: string, replacement: string): string => {
  const raw = String(content || '').trim();
  if (!raw) return raw;

  if (RAW_DATA_IMAGE_REGEX.test(raw)) {
    return replacement;
  }

  const redacted = raw
    .replace(MARKDOWN_DATA_IMAGE_REGEX_GLOBAL, replacement)
    .replace(INLINE_DATA_IMAGE_REGEX_GLOBAL, replacement)
    .trim();
  return redacted || replacement;
};

const sanitizeContentForProviderHistory = (content: string): string => {
  return redactInlineDataImagePayload(
    content,
    '[Image payload omitted from history to avoid token overflow.]'
  );
};

const sanitizeContentForExport = (content: string): string => {
  return redactInlineDataImagePayload(
    content,
    '[Image payload omitted from export.]'
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

        const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/i);
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

const FablabChatView: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);

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
  const [showInstructionEditor, setShowInstructionEditor] = useState(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const hasConversation = messages.length > 0;

  const selectedContextIds = useMemo(
    () => selectedContextSources.map((item) => item.id),
    [selectedContextSources]
  );

  const renderedMessages = useMemo(() => {
    return messages.map((message) => {
      const isUser = message.role === 'user';
      const imageSrc = !isUser ? extractImageFromContent(message.content) : null;
      const textBody = imageSrc ? stripImageFromContent(message.content) : message.content;

      return {
        message,
        isUser,
        imageSrc,
        textBody,
      };
    });
  }, [messages]);

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

  const sourceCandidates = useMemo(() => {
    if (sourceMode === 'context') return objects;
    return objects.filter((item) => textFriendlyTypes.includes(getObjectType(item)));
  }, [objects, sourceMode]);

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const state = await loadFablabChatRuntimeState();
        if (cancelled) return;
        setRuntimeConfig(state.config || null);
        setSystemInstruction(String(state.config?.systemPrompt || ''));
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
      setLibraryLoading(true);
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
      } finally {
        if (!cancelled) setLibraryLoading(false);
      }
    };

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, [sourceMode, selectedFolderId, searchTerm, t?.fablabChat?.errors?.loadSources]);

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

  const isContextSelected = (source: ObjectItem): boolean => {
    return selectedContextSources.some((item) => sameObjectId(item.id, source.id));
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

  const buildSystemPrompt = (): string => {
    const basePrompt = systemInstruction.trim();
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
      'Output style: avoid numbered lists and markdown heading syntax. Write clean, natural text with bold section titles when useful, short paragraphs, and hyphen bullets only when they improve clarity.',
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

  const persistSystemInstruction = async () => {
    if (!runtimeConfig) return;

    const trimmed = systemInstruction.trim();
    const current = String(runtimeConfig.systemPrompt || '').trim();
    if (trimmed === current) return;

    try {
      const nextConfig = {
        ...runtimeConfig,
        systemPrompt: trimmed,
        selectedModel: effectiveConfig?.selectedModel || runtimeConfig.selectedModel,
        updatedAt: toIsoNow(),
      };
      await saveFablabChatRuntimeConfig(nextConfig);
      setRuntimeConfig(nextConfig);
      setStatusText('Instruction saved.');
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.saveFailed || 'Could not save instruction.'));
    }
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
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isSending) {
        void sendMessage();
      }
    }
  };

  const removeContextSource = (sourceId: string | number) => {
    setSelectedContextSources((prev) => prev.filter((item) => !sameObjectId(item.id, sourceId)));
  };

  const skillButtonClass = (active: boolean): string => {
    return `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? 'border-cyan-500 bg-cyan-100/90 text-cyan-800 dark:border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-200'
        : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500'
    }`;
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

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    if (!runtimeSelection) {
      setErrorText(t?.fablabChat?.errors?.runtimeNotReady || 'Configure provider and model in Profile before sending messages.');
      return;
    }

    setIsSending(true);
    setErrorText('');
    setStatusText('');

    const userMessage: FablabChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      createdAt: toIsoNow(),
      sourceIds: selectedContextIds,
      skills: { ...skills },
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');

    try {
      const { contextText, attachments } = await buildContextPayload();

      let finalUserText = text;

      if (contextText) {
        finalUserText = `${finalUserText}\n\n${contextText}`;
      }

      const historyMessages = roleResetAt
        ? nextMessages.filter((msg) => {
            const createdAt = String(msg.createdAt || '').trim();
            return createdAt ? createdAt >= roleResetAt : true;
          })
        : nextMessages;

      const providerMessages = toProviderMessages(
        historyMessages.map((msg) => (msg.id === userMessage.id ? { ...msg, content: finalUserText } : msg)),
        attachments
      );

      let assistantContent = '';
      let usageInputTokens = 0;
      let usageOutputTokens = 0;
      let usageTotalTokens = 0;
      let latencyMs = 0;

      if (skills.image) {
        const imagePrompt = `${buildSystemPrompt()}\n\n[IMAGE REQUEST]\n${finalUserText}`;
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
        const response = await providerChat({
          provider: runtimeSelection.provider,
          apiKey: runtimeSelection.apiKey,
          baseUrl: runtimeSelection.provider === 'ollama' ? runtimeSelection.baseUrl : undefined,
          model: runtimeSelection.modelId,
          systemPrompt: buildSystemPrompt(),
          messages: providerMessages,
        });

        assistantContent = formatAssistantText(response);
        usageInputTokens = Number(response.usage?.inputTokens || 0);
        usageOutputTokens = Number(response.usage?.outputTokens || 0);
        usageTotalTokens = Number(response.usage?.totalTokens || 0);
        latencyMs = Number(response.latencyMs || 0);
      }

      const assistantMessage: FablabChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantContent,
        createdAt: toIsoNow(),
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

      setStatusText(t?.fablabChat?.status?.sent || 'Message sent.');
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.sendFailed || 'Could not send message.'));
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
      setSelectedContextSources([]);
      setSelectedRoleObject(null);
      setRoleInstruction('');
      setRoleResetAt('');
      await persistRoleSelection(null, '', '');

      await saveFablabChatConversation(emptyConversation);
      await saveFablabChatStats(emptyStats);
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

  if (loading) {
    return (
      <section className="h-full w-full bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex h-full items-center justify-center rounded-[28px] border border-slate-200/70 bg-white/70 shadow-[0_25px_80px_-35px_rgba(14,165,233,0.35)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 size={16} className="animate-spin" />
            {t?.fablabChat?.loading || 'Loading Fablab chat...'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full w-full bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:p-5">
      <div className="relative mx-auto flex h-full max-w-[1600px] overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/75 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/75">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-cyan-400/20 via-sky-400/20 to-teal-400/20 dark:from-cyan-500/10 dark:via-sky-500/10 dark:to-teal-500/10" />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  <Sparkles size={18} className="text-cyan-600 dark:text-cyan-300" />
                  {t?.fablabChat?.title || 'Fablab Chat'}
                </h1>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {runtimeSelection
                    ? `${runtimeSelection.provider} - ${selectedModelLabel || runtimeSelection.modelId}`
                    : (t?.fablabChat?.runtimeMissing || 'Configure provider and model in Profile to start chatting.')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportConversation}
                  disabled={isExporting || messages.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>{t?.fablabChat?.actions?.export || 'Export'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetConversation}
                  disabled={messages.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  <RotateCcw size={14} />
                  <span>{t?.fablabChat?.actions?.reset || 'Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={messages.length === 0 && stats.totalRequests === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50/90 px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:border-rose-400 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300"
                >
                  <Trash2 size={14} />
                  <span>{t?.fablabChat?.actions?.delete || 'Delete'}</span>
                </button>
              </div>
            </div>

            {!runtimeSelection && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                <div className="inline-flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>Configure your API key and model in Profile before starting the chat.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/profile')}
                  className="rounded-lg border border-amber-400 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:border-amber-500 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  Go to profile
                </button>
              </div>
            )}

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowInstructionEditor((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500"
              >
                <Wand2 size={13} />
                <span>{showInstructionEditor ? 'Hide instruction' : 'Instruction'}</span>
              </button>
            </div>

            {showInstructionEditor && (
              <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Behavior instruction (separate from role and prompt)
                </p>
                <textarea
                  value={systemInstruction}
                  onChange={(event) => setSystemInstruction(event.target.value)}
                  onBlur={() => {
                    void persistSystemInstruction();
                  }}
                  rows={3}
                  placeholder="Define global behavior rules for the assistant..."
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Role = identity/behavior priority. Prompt = task template inserted into the composer.
                </p>
              </div>
            )}

            {(selectedRoleObject || selectedContextSources.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {selectedRoleObject && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100/80 px-2.5 py-1 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    {t?.fablabChat?.sources?.role || 'Role'}: {selectedRoleObject.name}
                    <button
                      type="button"
                      onClick={() => {
                        const resetMark = toIsoNow();
                        setSelectedRoleObject(null);
                        setRoleInstruction('');
                        setRoleResetAt(resetMark);
                        void persistRoleSelection(null, '', resetMark);
                      }}
                      className="rounded p-0.5 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedContextSources.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100/80 px-2.5 py-1 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <ShieldCheck size={12} />
                    {selectedContextSources.length} {t?.fablabChat?.sources?.selected || 'sources selected'}
                  </span>
                )}
              </div>
            )}

            {selectedContextSources.length > 0 && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-900/20">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                  Active context sources (fully analyzed before generation)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedContextSources.map((source) => (
                    <span
                      key={String(source.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white/90 px-2.5 py-1 text-xs text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                    >
                      {source.name} ({getObjectType(source) || 'file'})
                      <button
                        type="button"
                        onClick={() => removeContextSource(source.id)}
                        className="rounded p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/70"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </header>

          {!hasConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
              <div className="w-full max-w-5xl rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_30px_80px_-40px_rgba(14,116,144,0.45)] dark:border-slate-700 dark:bg-slate-900/85">
                <div className="mb-5 text-center">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg">
                    <Bot size={20} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {t?.fablabChat?.empty?.title || 'Start a high-quality conversation'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t?.fablabChat?.empty?.subtitle || 'Use role, prompt and curated sources to get precise responses.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows={5}
                    placeholder={t?.fablabChat?.inputPlaceholder || 'Write your message...'}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSkill('search')}
                        className={skillButtonClass(skills.search)}
                      >
                        {t?.fablabChat?.skills?.search || 'Analyze'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSkill('summarize')}
                        className={skillButtonClass(skills.summarize)}
                      >
                        {t?.fablabChat?.skills?.summarize || 'Summary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSkill('image')}
                        className={skillButtonClass(skills.image)}
                      >
                        {t?.fablabChat?.skills?.image || 'Image'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSkill('other')}
                        className={skillButtonClass(skills.other)}
                      >
                        <Video size={12} className="mr-1 inline" />
                        {(t as any)?.fablabChat?.skills?.video || 'Video/Other'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSkill('audioSynthesis')}
                        className={skillButtonClass(skills.audioSynthesis)}
                      >
                        <Volume2 size={12} className="mr-1 inline" />
                        {(t as any)?.fablabChat?.skills?.speechSynthesis || 'Speech synth'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSkill('audioTranscription')}
                        className={skillButtonClass(skills.audioTranscription)}
                      >
                        <Mic size={12} className="mr-1 inline" />
                        {(t as any)?.fablabChat?.skills?.speechTranscription || 'Speech transcript'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSkill('promptOptimize')}
                        className={skillButtonClass(skills.promptOptimize)}
                      >
                        {(t as any)?.fablabChat?.skills?.promptOptimize || 'Prompt optimizer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSkill('roleOptimize')}
                        className={skillButtonClass(skills.roleOptimize)}
                      >
                        {(t as any)?.fablabChat?.skills?.roleOptimize || 'Role optimizer'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSourceMode('context')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <Paperclip size={14} />
                        <span>{t?.fablabChat?.actions?.contextSources || 'Context sources'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSourceMode('role')}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:border-amber-400 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        <Wand2 size={14} />
                        <span>{t?.fablabChat?.actions?.roleSource || 'Role from library'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSourceMode('prompt')}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700 transition-colors hover:border-cyan-400 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"
                      >
                        <MessageSquare size={14} />
                        <span>{t?.fablabChat?.actions?.promptSource || 'Prompt from library'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={isSending || !input.trim() || !runtimeSelection}
                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50"
                    >
                      {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>{t?.fablabChat?.actions?.send || 'Send'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {renderedMessages.map(({ message, isUser, imageSrc, textBody }) => {
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.25s_ease-out]`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                          isUser
                            ? 'border border-cyan-300 bg-gradient-to-br from-cyan-100 to-sky-100 text-slate-900 dark:border-cyan-700 dark:from-cyan-900/30 dark:to-sky-900/30 dark:text-slate-100'
                            : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-wide opacity-70">
                          {isUser ? (t?.fablabChat?.messages?.you || 'You') : (t?.fablabChat?.messages?.assistant || 'Assistant')}
                        </p>
                        {imageSrc && (
                          <div className="relative mb-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                            <img
                              src={imageSrc}
                              alt="Generated output"
                              loading="lazy"
                              decoding="async"
                              className="max-h-[420px] w-full object-contain bg-slate-50 dark:bg-slate-900"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white/85 p-1 shadow-sm backdrop-blur dark:bg-slate-900/85">
                              <button
                                type="button"
                                onClick={() => {
                                  void downloadGeneratedImage(imageSrc);
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <ImageDown size={12} />
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void saveGeneratedImageToObjects(imageSrc);
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <FolderPlus size={12} />
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                        {textBody && <p className="whitespace-pre-wrap text-sm leading-relaxed">{textBody}</p>}
                        <p className="mt-2 text-[10px] opacity-60">{formatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-200/70 bg-white/70 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/60">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  rows={3}
                  placeholder={t?.fablabChat?.inputPlaceholder || 'Write your message...'}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSkill('search')}
                      className={skillButtonClass(skills.search)}
                    >
                      {t?.fablabChat?.skills?.search || 'Analyze'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill('summarize')}
                      className={skillButtonClass(skills.summarize)}
                    >
                      {t?.fablabChat?.skills?.summarize || 'Summary'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill('image')}
                      className={skillButtonClass(skills.image)}
                    >
                      {t?.fablabChat?.skills?.image || 'Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill('other')}
                      className={skillButtonClass(skills.other)}
                    >
                      <Video size={12} className="mr-1 inline" />
                      {(t as any)?.fablabChat?.skills?.video || 'Video/Other'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill('audioSynthesis')}
                      className={skillButtonClass(skills.audioSynthesis)}
                    >
                      <Volume2 size={12} className="mr-1 inline" />
                      {(t as any)?.fablabChat?.skills?.speechSynthesis || 'Speech synth'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill('audioTranscription')}
                      className={skillButtonClass(skills.audioTranscription)}
                    >
                      <Mic size={12} className="mr-1 inline" />
                      {(t as any)?.fablabChat?.skills?.speechTranscription || 'Speech transcript'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill('promptOptimize')}
                      className={skillButtonClass(skills.promptOptimize)}
                    >
                      {(t as any)?.fablabChat?.skills?.promptOptimize || 'Prompt optimizer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSkill('roleOptimize')}
                      className={skillButtonClass(skills.roleOptimize)}
                    >
                      {(t as any)?.fablabChat?.skills?.roleOptimize || 'Role optimizer'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSourceMode('context')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <Paperclip size={14} />
                      <span>{t?.fablabChat?.actions?.contextSources || 'Context sources'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSourceMode('role')}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:border-amber-400 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    >
                      <Wand2 size={14} />
                      <span>{t?.fablabChat?.actions?.roleSource || 'Role from library'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSourceMode('prompt')}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700 transition-colors hover:border-cyan-400 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"
                    >
                      <MessageSquare size={14} />
                      <span>{t?.fablabChat?.actions?.promptSource || 'Prompt from library'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isSending || !input.trim() || !runtimeSelection}
                    className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:from-cyan-700 hover:to-sky-700 disabled:opacity-50"
                  >
                    {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{t?.fablabChat?.actions?.send || 'Send'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {(errorText || statusText) && (
            <div className="border-t border-slate-200/70 px-6 py-3 dark:border-slate-700">
              {errorText && (
                <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
                  {errorText}
                </div>
              )}
              {statusText && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                  {statusText}
                </div>
              )}
            </div>
          )}
        </div>

        {sourceMode && (
          <aside className="absolute inset-y-0 right-0 z-10 w-full max-w-md border-l border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {sourceMode === 'context'
                  ? (t?.fablabChat?.sources?.title || 'Select context sources')
                  : sourceMode === 'role'
                    ? (t?.fablabChat?.sources?.roleTitle || 'Select role source')
                    : (t?.fablabChat?.sources?.promptTitle || 'Select prompt source')}
              </h3>

              <button
                type="button"
                onClick={() => setSourceMode(null)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300"
              >
                <X size={13} />
              </button>
            </div>

            <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="text-sm">
                <span className="mb-1 block text-xs text-slate-600 dark:text-slate-300">{t?.fablabChat?.sources?.folder || 'Folder'}</span>
                <select
                  value={selectedFolderId ?? ''}
                  onChange={(event) => setSelectedFolderId(event.target.value ? Number(event.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">{t?.fablabChat?.sources?.allFolders || 'All folders'}</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs text-slate-600 dark:text-slate-300">{t?.fablabChat?.sources?.search || 'Search'}</span>
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-2 top-2.5 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t?.fablabChat?.sources?.searchPlaceholder || 'Search files...'}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </label>
            </div>

            <div className="max-h-[calc(100%-132px)] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              {libraryLoading ? (
                <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 size={14} className="mr-1 inline animate-spin" />
                  {t?.fablabChat?.sources?.loading || 'Loading library...'}
                </div>
              ) : sourceCandidates.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
                  {t?.fablabChat?.sources?.empty || 'No items found.'}
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                  {sourceCandidates.map((source) => {
                    const checked = isContextSelected(source);
                    return (
                      <li key={String(source.id)} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">{source.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{getObjectType(source) || 'file'}</p>
                        </div>

                        {sourceMode === 'context' ? (
                          <label className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleContextSource(source)}
                              className="rounded border-slate-300 text-cyan-600"
                            />
                            {t?.fablabChat?.sources?.select || 'Select'}
                          </label>
                        ) : (
                          <button
                            type="button"
                            onClick={() => applySingleSource(sourceMode, source)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
                          >
                            {t?.fablabChat?.sources?.use || 'Use'}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
};

export default FablabChatView;
