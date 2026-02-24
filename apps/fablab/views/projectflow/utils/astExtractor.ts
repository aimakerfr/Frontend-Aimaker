import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

// Helper to handle the default export of @babel/traverse
const traverse = (_traverse as any).default || _traverse;

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
      // Handle text inside JSX elements: <div>Hello</div>
      JSXText(path: any) {
        const text = path.node.value.trim();
        if (text && text.length > 1 && !/^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(text)) {
          extractedStrings.add(text);
        }
      },

      // Handle attributes: <input placeholder="Enter name" />
      JSXAttribute(path: any) {
        const attrName = path.node.name.name;
        const translatableProps = ['placeholder', 'title', 'alt', 'label', 'aria-label'];

        if (translatableProps.includes(attrName) && path.node.value?.type === 'StringLiteral') {
          const text = path.node.value.value.trim();
          if (text) extractedStrings.add(text);
        }
      },

      // Handle String literals that look like UI text (long enough, not just IDs/classes)
      // This is trickier as it might catch internal strings. We'll be conservative.
      StringLiteral(path: any) {
        // Skip if inside a JSX attribute (already handled)
        if (path.parent.type === 'JSXAttribute') return;
        
        // Skip if it looks like a CSS class or a short ID
        const text = path.node.value.trim();
        if (text.length > 3 && 
            !text.includes('/') && 
            !text.includes('_') && 
            !/^[a-z0-9-]+$/.test(text) && // Simple IDs/Classes
            !/^[A-Z0-9_]+$/.test(text)    // CONSTANTS
        ) {
          // Check if parent is something that usually displays text
          // e.g. return 'Hello' or const msg = 'Hello'
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
    // Fallback: simple regex or empty
    return {};
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
