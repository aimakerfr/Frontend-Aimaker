/**
 * Language Manager
 * Gestiona idiomas dinámicos y personalizados
 */

export type StandardLanguage = 'en' | 'es' | 'fr';
export type CustomLanguage = string; // de, pt, it, ja, etc.
export type Language = StandardLanguage | CustomLanguage;

/**
 * Idiomas estándar incluidos en el sistema
 */
export const STANDARD_LANGUAGES: StandardLanguage[] = ['en', 'es', 'fr'];

/**
 * Información de idiomas disponibles
 */
export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  isCustom: boolean;
}

/**
 * Catálogo de idiomas conocidos (incluye estándar y comunes personalizados)
 */
export const LANGUAGE_CATALOG: Record<string, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', isCustom: false },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', isCustom: false },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', isCustom: false },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', isCustom: true },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', isCustom: true },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', isCustom: true },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', isCustom: true },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', isCustom: true },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', isCustom: true },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', isCustom: true },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isCustom: true },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', isCustom: true },
};

// Import Translations type dynamically to avoid circular dependency
type Translations = Record<string, any>;

/**
 * Almacenamiento de idiomas personalizados cargados
 */
const customLanguages: Map<string, Translations> = new Map();

/**
 * Registra un idioma personalizado en el sistema
 */
export function registerCustomLanguage(code: string, translations: Translations): void {
  customLanguages.set(code, translations);
  
  // Si no está en el catálogo, agregarlo como desconocido
  if (!LANGUAGE_CATALOG[code]) {
    LANGUAGE_CATALOG[code] = {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      isCustom: true,
    };
  }
  
  console.log(`✅ Custom language registered: ${code}`);
}

/**
 * Obtiene las traducciones de un idioma personalizado
 */
export function getCustomLanguage(code: string): Translations | undefined {
  return customLanguages.get(code);
}

/**
 * Obtiene todos los códigos de idiomas personalizados disponibles
 */
export function getCustomLanguageCodes(): string[] {
  return Array.from(customLanguages.keys());
}

/**
 * Verifica si un idioma es personalizado
 */
export function isCustomLanguage(code: string): boolean {
  return !STANDARD_LANGUAGES.includes(code as StandardLanguage);
}

/**
 * Obtiene información de un idioma
 */
export function getLanguageInfo(code: string): LanguageInfo {
  return LANGUAGE_CATALOG[code] || {
    code,
    name: code.toUpperCase(),
    nativeName: code.toUpperCase(),
    isCustom: true,
  };
}

/**
 * Obtiene lista de todos los idiomas disponibles (estándar + personalizados)
 */
export function getAvailableLanguages(): LanguageInfo[] {
  const standardLanguages = STANDARD_LANGUAGES.map(code => LANGUAGE_CATALOG[code]);
  const customCodes = getCustomLanguageCodes();
  const customLanguageInfos = customCodes.map(code => getLanguageInfo(code));
  
  return [...standardLanguages, ...customLanguageInfos];
}

/**
 * Carga un idioma desde JSON
 */
export async function loadLanguageFromJSON(code: string, jsonContent: string): Promise<void> {
  try {
    const translations = JSON.parse(jsonContent) as Translations;
    registerCustomLanguage(code, translations);
  } catch (error) {
    console.error(`Error parsing JSON for language ${code}:`, error);
    throw new Error(`Invalid JSON format for language ${code}`);
  }
}

/**
 * Carga idiomas personalizados desde el backend
 */
export async function loadAddedLanguages(): Promise<void> {
  try {
    // Load custom languages from backend
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No auth token, skipping custom languages load');
      return;
    }

    const response = await fetch('/api/v1/custom-languages', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const languages = data.data || [];

      languages.forEach((lang: { code: string; name: string; translations: any }) => {
        registerCustomLanguage(lang.code, lang.translations);
        console.log(`✅ Loaded custom language: ${lang.name} (${lang.code})`);
      });
    }
  } catch (error) {
    console.error('Error loading custom languages from backend:', error);
  }
}

/**
 * Guarda un idioma como JSON
 */
export function saveLanguageAsJSON(translations: Translations, languageCode: string): void {
  const json = JSON.stringify(translations, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${languageCode}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON cargado por el usuario
 */
export function readJSONFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}
