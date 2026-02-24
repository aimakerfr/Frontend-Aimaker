import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

// Helper to handle the default export of @babel/traverse
const traverse = (_traverse as any).default || _traverse;

/**
 * Determines if a string is translatable (UI text vs internal constants/IDs)
 */
const isTranslatable = (text: string): boolean => {
  // Must have at least one letter
  if (!/[a-zA-Z]/.test(text)) return false;
  
  // Too short to be useful UI text
  if (text.length < 2) return false;
  
  // Comprehensive blacklist patterns
  const blacklistPatterns = [
    /^https?:\/\//i,                    // URLs
    /^\/[a-zA-Z0-9_/-]+$/,              // Paths like /api/users
    /^[A-Z_][A-Z0-9_]*$/,               // CONSTANTS like API_KEY
    /^[a-z][a-zA-Z0-9]*$/,              // camelCase identifiers (single word)
    /^[a-z_]+$/,                        // snake_case
    /^#[0-9a-fA-F]{3,8}$/,              // Hex colors #fff #ffffff
    /^rgb\(|^rgba\(/,                   // RGB colors
    /^\d+px|^\d+%|^\d+em|^\d+rem/,      // CSS units
    /\.[a-z]{2,4}$/i,                   // File extensions .tsx .json
    /^[0-9-]+$/,                        // Just numbers and dashes
    /^[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|-]+$/, // Only symbols
    /^id$/i,                            // Common property names
    /^key$/i,
    /^type$/i,
    /^name$/i,
    /^value$/i,
    /^className$/i,
    
    // ⚠️ CRITICAL: Tailwind CSS patterns (NEVER TRANSLATE)
    /^(from|to|via)-[a-z]+-\d+$/i,              // gradient: from-blue-500, to-red-600
    /^hover:(border|bg|text)-[a-z]+-\d+$/i,     // hover states
    /^(border|bg|text|ring)-[a-z]+-\d+$/i,      // color utilities
    /^(p|m|px|py|mx|my|mt|mb|ml|mr)-\d+$/i,     // spacing
    /^(w|h|max-w|max-h|min-w|min-h)-/i,          // sizing
    /^(flex|grid|block|inline|hidden)/i,         // display
    /^(rounded|shadow|opacity|z)-/i,             // effects
    /^(gap|space)-[xy]?-\d+$/i,                  // spacing
    /^(sm|md|lg|xl|2xl):/i,                      // breakpoints
    /^dark:/i,                                   // dark mode
    /\s+(from|to|via|hover|focus|active|dark|sm|md|lg|xl):/i, // any modifier with spaces
    /^[a-z]+-[a-z]+-[0-9]+$/i,                   // generic tailwind: text-gray-500
    /-\d+(\/\d+)?$/,                             // ends with -500, -1/2, etc
    /^(transition|duration|ease|delay|animate)-/i, // animations
    /^cursor-/i,                                 // cursor
    /^select-/i,                                 // select
  ];
  
  for (const pattern of blacklistPatterns) {
    if (pattern.test(text)) return false;
  }
  
  // ⚠️ Additional Tailwind detection (catches complex className strings)
  // If contains multiple dashes without spaces = likely CSS class chain
  if (text.includes('-') && !text.includes(' ')) {
    const dashCount = (text.match(/-/g) || []).length;
    if (dashCount >= 2) return false; // Multiple dashes = likely CSS
  }
  
  // Reject if contains CSS-like modifiers
  if (/:\w+/.test(text)) return false; // contains :word (dark:, hover:, etc)
  
  // Reject if contains Tailwind transparent keyword
  if (/transparent/.test(text)) return false;
  
  // Must look like UI text: has spaces, capitalized, or punctuation
  const looksLikeUIText = /\s/.test(text) ||                    // Has spaces
                          /^[A-Z]/.test(text) ||                // Starts with capital
                          /[.!?;:,]/.test(text);                // Has punctuation
  
  return looksLikeUIText;
};

/**
 * Extracts translatable text from JSX/TSX/JS/TS code using Babel AST
 */
export const extractTextFromCode = (code: string, fileName: string = 'file.tsx'): Record<string, string> => {
  const isTypeScript = fileName.endsWith('.ts') || fileName.endsWith('.tsx');
  const isJSX = fileName.endsWith('.jsx') || fileName.endsWith('.tsx') || fileName.endsWith('.html');

  const plugins: any[] = [];
  if (isTypeScript) plugins.push('typescript');
  if (isJSX) plugins.push('jsx');

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins,
      errorRecovery: true,
    });

    const extractedStrings: Set<string> = new Set();
    const result: Record<string, string> = {};

    traverse(ast, {
      // Handle text inside JSX elements: <div>Hello World</div>
      JSXText(path: any) {
        const text = path.node.value.trim();
        if (text && isTranslatable(text)) {
          extractedStrings.add(text);
        }
      },

      // Handle JSX attributes: <input placeholder="Enter name" />
      JSXAttribute(path: any) {
        const attrName = path.node.name.name;
        
        // CRITICAL: NEVER translate className, style, or any CSS-related attributes
        const cssAttributes = ['className', 'class', 'style', 'css', 'tw'];
        if (cssAttributes.includes(attrName)) return;
        
        const translatableProps = [
          'placeholder', 'title', 'alt', 'label', 'aria-label', 
          'aria-description', 'tooltip', 'hint', 'helperText'
        ];

        if (translatableProps.includes(attrName) && path.node.value?.type === 'StringLiteral') {
          const text = path.node.value.value.trim();
          if (text && isTranslatable(text)) {
            extractedStrings.add(text);
          }
        }
      },

      // Handle String literals that look like UI text
      StringLiteral(path: any) {
        // Skip if already handled by JSXAttribute
        if (path.parent.type === 'JSXAttribute') return;
        
        // Skip if it's an import path
        if (path.parent.type === 'ImportDeclaration') return;
        
        // Skip if it's a property key in an object
        if (path.parent.type === 'ObjectProperty' && path.parentPath.node.key === path.node) return;
        
        const text = path.node.value.trim();
        
        // Only extract if it passes our translatable checks
        if (isTranslatable(text)) {
          extractedStrings.add(text);
        }
      }
    });

    // Generate unique keys
    let count = 1;
    Array.from(extractedStrings).forEach(text => {
      result[`text_${count++}`] = text;
    });

    return result;
  } catch (error) {
    console.error('Error parsing AST:', error);
    // Don't silently fail - throw to indicate extraction failed
    throw new Error(`Failed to extract text from ${fileName}: ${error}`);
  }
};

/**
 * Extracts translatable text from plain HTML
 */
export const extractTextFromHTML = (html: string): Record<string, string> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const extractedStrings: Set<string> = new Set();
    const result: Record<string, string> = {};

    // Use a walker to find text nodes
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text && text.length > 1) {
        extractedStrings.add(text);
      }
    }

    // Also look for attributes
    const elementsWithTitle = doc.querySelectorAll('[title], [placeholder], [alt], [label]');
    elementsWithTitle.forEach((el: any) => {
      ['title', 'placeholder', 'alt', 'label'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (val && val.trim()) extractedStrings.add(val.trim());
      });
    });

    let count = 1;
    Array.from(extractedStrings).forEach(text => {
      result[`text_${count++}`] = text;
    });

    return result;
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return {};
  }
};
