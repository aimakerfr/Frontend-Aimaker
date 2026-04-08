import { loadFablabChatRuntimeState, saveFablabChatRuntimeConfig } from '@core/fablab-chat';

export type SidebarSectionKey =
  | 'chat'
  | 'objectsLibrary'
  | 'projectBuilder'
  | 'assembler'
  | 'applications'
  | 'products'
  | 'context'
  | 'tools';

export const SIDEBAR_ORDER_STORAGE_KEY = 'fablab_sidebar_order_v1';

export const DEFAULT_SIDEBAR_ORDER: SidebarSectionKey[] = [
  'chat',
  'objectsLibrary',
  'projectBuilder',
  'assembler',
  'applications',
  'products',
  'context',
  'tools',
];

const isSidebarSectionKey = (value: string): value is SidebarSectionKey => {
  return DEFAULT_SIDEBAR_ORDER.includes(value as SidebarSectionKey);
};

export const normalizeSidebarOrder = (order: string[]): SidebarSectionKey[] => {
  const uniqueValid = Array.from(new Set(order.filter(isSidebarSectionKey)));
  const missing = DEFAULT_SIDEBAR_ORDER.filter((item) => !uniqueValid.includes(item));
  return [...uniqueValid, ...missing];
};

export const loadSidebarOrder = (): SidebarSectionKey[] => {
  if (typeof window === 'undefined') {
    return [...DEFAULT_SIDEBAR_ORDER];
  }

  try {
    const raw = window.localStorage.getItem(SIDEBAR_ORDER_STORAGE_KEY);
    if (!raw) return [...DEFAULT_SIDEBAR_ORDER];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_SIDEBAR_ORDER];
    return normalizeSidebarOrder(parsed.map((item) => String(item)));
  } catch {
    return [...DEFAULT_SIDEBAR_ORDER];
  }
};

export const saveSidebarOrder = (order: SidebarSectionKey[]): void => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeSidebarOrder(order);
  window.localStorage.setItem(SIDEBAR_ORDER_STORAGE_KEY, JSON.stringify(normalized));
};

const asSidebarOrderFromUnknown = (value: unknown): SidebarSectionKey[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  return normalizeSidebarOrder(value.map((item) => String(item)));
};

export const loadSidebarOrderFromDatabase = async (): Promise<SidebarSectionKey[]> => {
  try {
    const state = await loadFablabChatRuntimeState();
    const fromConfig = asSidebarOrderFromUnknown((state.config as any)?.sidebarOrder);
    const fromRaw = asSidebarOrderFromUnknown((state.rawConfig as any)?.sidebarOrder);

    // Prefer normalized config field, fallback to raw payload for backward compatibility.
    const chosen = fromConfig ?? fromRaw;
    return chosen ?? [...DEFAULT_SIDEBAR_ORDER];
  } catch {
    return [...DEFAULT_SIDEBAR_ORDER];
  }
};

export const saveSidebarOrderToDatabase = async (order: SidebarSectionKey[]): Promise<void> => {
  const normalized = normalizeSidebarOrder(order);
  const state = await loadFablabChatRuntimeState();
  const baseConfig = state.config ? { ...state.config } : { ...state.rawConfig };

  await saveFablabChatRuntimeConfig({
    ...baseConfig,
    sidebarOrder: normalized,
    updatedAt: new Date().toISOString(),
  });
};
