import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

// Helper to handle the default export of @babel/traverse
const traverse = (_traverse as any).default || _traverse;

const CSS_ATTRIBUTE_NAMES = new Set(['className', 'class', 'style', 'css', 'tw']);
const CSS_PROPERTY_NAMES = new Set([
  'color', 'background', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
  'letterSpacing', 'textAlign', 'textTransform', 'textDecoration', 'maxWidth', 'minWidth', 'width', 'height',
  'maxHeight', 'minHeight', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'padding',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'border', 'borderTop', 'borderRight',
  'borderBottom', 'borderLeft', 'borderRadius', 'display', 'position', 'top', 'right', 'bottom', 'left',
  'gap', 'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'flexWrap', 'alignItems', 'justifyContent',
  'boxShadow', 'opacity', 'zIndex', 'overflow', 'overflowX', 'overflowY', 'cursor', 'whiteSpace'
]);

const getObjectPropertyName = (node: any): string | null => {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'StringLiteral') return node.value;
  return null;
};

/**
 * Checks if a string node is in a context where it should NOT be translated
 * Uses AST context analysis instead of regex patterns
 */
const isInNonTranslatableContext = (path: any): boolean => {
  let parent = path.parent;

  // Skip anything inside style/class-like JSX attributes
  const styleAttributeAncestor = path.findParent?.((p: any) => {
    if (p?.node?.type !== 'JSXAttribute') return false;
    const attrName = p.node?.name?.name;
    return CSS_ATTRIBUTE_NAMES.has(attrName);
  });
  if (styleAttributeAncestor) return true;
  
  // Skip in import declarations
  if (parent.type === 'ImportDeclaration') return true;
  
  // Skip in require() calls
  if (parent.type === 'CallExpression' && parent.callee.name === 'require') return true;
  
  // Skip in object property keys (unless it's a value)
  if (parent.type === 'ObjectProperty' && parent.key === path.node) return true;
  
  // Skip if parent is Member Expression being accessed (like process.env, global.API)
  if (parent.type === 'MemberExpression') return true;
  
  // Skip in function calls that are likely API calls (callExpr with string arg)
  // Examples: httpClient.get('/api/v1/objects?type=CODE')
  if (parent.type === 'CallExpression' && parent.arguments?.includes(path.node)) {
    const calleeStr = JSON.stringify(parent.callee);
    // If it looks like a method call on a service/client object
    if (calleeStr.includes('get') || calleeStr.includes('post') || 
        calleeStr.includes('put') || calleeStr.includes('delete') ||
        calleeStr.includes('fetch') || calleeStr.includes('request') ||
        calleeStr.includes('client') || calleeStr.includes('http') ||
        calleeStr.includes('api')) {
      return true;  // Skip API endpoint strings
    }
  }
  
  // Skip property values in object that look like configs
  if (parent.type === 'ObjectProperty' && parent.value === path.node) {
    const propName = getObjectPropertyName(parent.key);

    // Skip CSS-like object values (inline style objects)
    if (propName && CSS_PROPERTY_NAMES.has(propName)) {
      return true;
    }

    // Check if the property name suggests it's a configuration
    if (propName && ['url', 'endpoint', 'path', 'route', 'uri', 'href', 'src', 'data', 'config', 'options', 'env'].includes(propName)) {
      return true;
    }
  }
  
  // Skip in template literals or expressions
  if (parent.type === 'TemplateLiteral' || parent.type === 'TemplateElement') return true;
  
  // Skip in variable declarations if the value is assigned
  if (parent.type === 'VariableDeclarator' && parent.init === path.node) {
    // If variable name suggests data/config: skip it
    const varName = parent.id?.name || '';
    if (['url', 'endpoint', 'path', 'api', 'route', 'uri', 'href', 'data', 'json', 'payload', 'body', 'styles', 'style'].includes(varName.toLowerCase())) {
      return true;
    }
  }
  
  return false;
};

/**
 * Determines if a string is basic UI text (not code/paths/CSS)
 * Uses only simple semantic checks, not regex
 */
const looksLikeUIText = (text: string): boolean => {
  // Must have at least one letter
  if (!/[a-zA-Z]/.test(text)) return false;
  
  // Too short to be meaningful UI text
  if (text.length < 2) return false;
  
  // Has suspicious syntax characters that indicate code
  if (/[`${}*@#^&\[\]{}<>]/.test(text)) return false;
  
  // Starts with path or protocol indicators
  if (text.startsWith('/') || text.startsWith('.') || text.startsWith('~') || 
      text.startsWith('http') || text.startsWith('ftp')) return false;
  
  // Has query strings or URL fragments
  if (text.includes('?') || text.includes('=') || text.includes('&')) return false;
  
  // Looks like a single word identifier (camelCase, UPPERCASE, snake_case)
  if (/^[a-z][a-zA-Z0-9]*$/.test(text) || /^[A-Z_][A-Z0-9_]*$/.test(text) || /^[a-z_]+$/.test(text)) {
    return false; // Single identifier, not UI text
  }
  
  // Looks like a color code
  if (/^#[0-9a-fA-F]{3,8}$/.test(text) || /^rgb\(/.test(text) || /^rgba\(/.test(text)) return false;
  
  // Looks like CSS units or numeric values
  if (/^\d+(px|em|rem|%|vh|vw)$/.test(text) || /^[0-9\-]+$/.test(text)) return false;

  // Looks like CSS shorthand values (e.g. "2rem auto", "0 0 1rem 0", "0.5px solid var(--x)")
  if (/^\d*\.?\d+(px|em|rem|%|vh|vw)(\s+\w+|\s+\d*\.?\d+(px|em|rem|%|vh|vw))*$/i.test(text)) return false;
  if (text.includes('var(--') || text.includes(' solid ') || text.includes(' dashed ') || text.includes(' rgba(') || text.includes(' rgb(')) return false;
  
  // Tailwind CSS class patterns
  if (text.includes('-') && !text.includes(' ')) {
    // Multiple dashes without spaces = likely CSS class
    const dashCount = (text.match(/-/g) || []).length;
    if (dashCount >= 2 || text.includes(':')) return false;
  }
  
  // Looks like it has CSS modifiers (dark:, hover:, etc)
  if (/:\w+/.test(text) || text.includes('dark:') || text.includes('hover:')) return false;
  
  // Now it MUST look like UI text: has spaces, capital letter, or punctuation
  const hasSpaces = /\s/.test(text);
  const capitalizedStart = /^[A-Z]/.test(text);
  const hasPunctuation = /[.!?;,]/.test(text);
  
  return hasSpaces || capitalizedStart || hasPunctuation;
};

/**
 * Determines if a string is translatable (UI text vs internal constants/IDs)
 * Uses AST context + semantic checks, NOT regex patterns
 */
const isTranslatable = (text: string, path?: any): boolean => {
  // If we have path context, use it to check context
  if (path && isInNonTranslatableContext(path)) {
    return false;
  }
  
  // Otherwise use semantic checks
  return looksLikeUIText(text);
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
        
        const text = path.node.value.trim();
        
        // Use AST context + semantic checks to determine if translatable
        if (isTranslatable(text, path)) {
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
      const parentTag = (node.parentElement?.tagName || '').toLowerCase();
      if (parentTag === 'script' || parentTag === 'style' || parentTag === 'noscript') {
        continue;
      }

      if (text && text.length > 1 && isTranslatable(text)) {
        extractedStrings.add(text);
      }
    }

    // Also look for attributes
    const elementsWithTitle = doc.querySelectorAll('[title], [placeholder], [alt], [label], [aria-label]');
    elementsWithTitle.forEach((el: any) => {
      ['title', 'placeholder', 'alt', 'label', 'aria-label'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (val && val.trim() && isTranslatable(val.trim())) extractedStrings.add(val.trim());
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
