/**
 * Intention Analyzer - Analyzes user intention to suggest appropriate Maker Paths
 * Uses keyword matching to determine which Maker Path templates fit the user's needs
 */

export type MakerPathId = 'landing_page_maker' | 'rag_chat_maker' | 'image_generator_rag' | 'translation_maker';

interface MakerPathKeywords {
  id: MakerPathId;
  keywords: string[];
}

/**
 * Keyword definitions for each Maker Path
 * Keywords are case-insensitive and support multiple languages (ES, EN, FR)
 */
const MAKER_PATH_KEYWORDS: MakerPathKeywords[] = [
  {
    id: 'landing_page_maker',
    keywords: [
      // General web terms
      'web', 'website', 'sitio web', 'site web', 'página web', 'page web',
      // HTML/CSS terms
      'html', 'css', 'landing', 'landing page', 'página de aterrizaje',
      // Structure terms
      'header', 'footer', 'body', 'encabezado', 'pie de página',
      // Actions
      'crear página', 'create page', 'créer page', 'diseño web', 'web design',
      'diseñar web', 'build website', 'construir sitio', 'módulos', 'modules',
      'componentes', 'components', 'plantilla', 'template'
    ]
  },
  {
    id: 'rag_chat_maker',
    keywords: [
      // Chat terms
      'chat', 'conversation', 'conversación', 'dialogue',
      // Knowledge terms
      'knowledge', 'conocimiento', 'connaissance', 'data', 'datos', 'données',
      'sources', 'fuentes', 'sources de données',
      // Notebook terms
      'notebook', 'rag', 'multimodal',
      // Questions/answers
      'preguntas', 'questions', 'respuestas', 'answers', 'réponses',
      'consultar', 'query', 'interroger', 'analizar datos', 'analyze data',
      'buscar información', 'search information', 'chercher'
    ]
  },
  {
    id: 'image_generator_rag',
    keywords: [
      // Image terms
      'image', 'imagen', 'picture', 'photo', 'foto',
      // Generation terms
      'generate', 'generar', 'générer', 'crear imagen', 'create image',
      'production', 'generación', 'génération',
      // Visual terms
      'visual', 'gráfico', 'graphic', 'graphique', 'illustration',
      'ilustración', 'diseño gráfico', 'graphic design',
      // AI art terms
      'art', 'arte', 'dibujo', 'drawing', 'dessin',
      'render', 'renderizar', 'visualización', 'visualization'
    ]
  },
  {
    id: 'translation_maker',
    keywords: [
      // Translation terms
      'translation', 'traducción', 'traduction', 'translate', 'traducir',
      'traduire',
      // Language terms
      'language', 'idioma', 'langue', 'languages', 'idiomas', 'langues',
      'multilingual', 'multilingüe', 'multilingue',
      // i18n terms
      'i18n', 'internationalization', 'internacionalización',
      'localisation', 'localización', 'localization',
      // Code terms
      'jsx', 'tsx', 'react', 'component', 'componente', 'composant',
      'código', 'code', 'text extraction', 'extraer textos'
    ]
  }
];

/**
 * Analyzes user intention and returns matching Maker Path IDs
 * @param intention - The user's intention text
 * @returns Array of matching Maker Path IDs, ordered by relevance (number of matches)
 */
export function analyzeIntention(intention: string): MakerPathId[] {
  if (!intention || intention.trim().length === 0) {
    return [];
  }

  // Normalize intention: lowercase and remove extra spaces
  const normalizedIntention = intention.toLowerCase().trim();

  // Count matches for each Maker Path
  const matches: { id: MakerPathId; score: number }[] = [];

  for (const makerPath of MAKER_PATH_KEYWORDS) {
    let score = 0;

    for (const keyword of makerPath.keywords) {
      // Check if the keyword exists in the intention
      // Use word boundaries to avoid partial matches (e.g., "web" shouldn't match "website")
      const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      if (keywordRegex.test(normalizedIntention)) {
        // Give more weight to longer keywords (more specific)
        score += keyword.length;
      }
    }

    if (score > 0) {
      matches.push({ id: makerPath.id, score });
    }
  }

  // Sort by score (descending) and return only the IDs
  return matches
    .sort((a, b) => b.score - a.score)
    .map(match => match.id);
}

/**
 * Checks if the intention matches any Maker Path
 * @param intention - The user's intention text
 * @returns true if at least one Maker Path matches
 */
export function hasMatchingMakerPath(intention: string): boolean {
  return analyzeIntention(intention).length > 0;
}

/**
 * Gets the best matching Maker Path (highest score)
 * @param intention - The user's intention text
 * @returns The best matching Maker Path ID, or null if no matches
 */
export function getBestMatch(intention: string): MakerPathId | null {
  const matches = analyzeIntention(intention);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Gets a description of why a Maker Path was suggested (for debugging/transparency)
 * @param intention - The user's intention text
 * @param makerPathId - The Maker Path ID to explain
 * @returns Object with matched keywords, or null if no match
 */
export function explainMatch(intention: string, makerPathId: MakerPathId): { matchedKeywords: string[] } | null {
  const normalizedIntention = intention.toLowerCase().trim();
  const makerPath = MAKER_PATH_KEYWORDS.find(mp => mp.id === makerPathId);

  if (!makerPath) {
    return null;
  }

  const matchedKeywords: string[] = [];

  for (const keyword of makerPath.keywords) {
    const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (keywordRegex.test(normalizedIntention)) {
      matchedKeywords.push(keyword);
    }
  }

  return matchedKeywords.length > 0 ? { matchedKeywords } : null;
}
