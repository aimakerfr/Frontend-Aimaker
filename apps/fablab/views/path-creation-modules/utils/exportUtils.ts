import { AppState, ExportFormat } from "../types";

export const generateCombinedHtml = (state: AppState): string => {
  const { header, body, footer } = state;

  const hasTailwind = header.useTailwind || body.useTailwind || footer.useTailwind;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Orchestrated Page</title>
    ${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
    <style>
        /* Base Reset */
        body { margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; }
        
        /* HEADER MODULE STYLES */
        ${header.css}
        
        /* BODY MODULE STYLES */
        ${body.css}
        
        /* FOOTER MODULE STYLES */
        ${footer.css}
    </style>
</head>
<body>

    <!-- HEADER MODULE -->
    <header id="module-header">
        ${header.html}
    </header>

    <!-- BODY MODULE -->
    <main id="module-body" style="flex: 1;">
        ${body.html}
    </main>

    <!-- FOOTER MODULE -->
    <footer id="module-footer">
        ${footer.html}
    </footer>

</body>
</html>`;
};

// Generate only HTML content (without CSS)
export const generateHtmlOnly = (state: AppState): string => {
  const { header, body, footer } = state;

  return `<!-- HEADER MODULE -->
<header id="module-header">
${header.html}
</header>

<!-- BODY MODULE -->
<main id="module-body">
${body.html}
</main>

<!-- FOOTER MODULE -->
<footer id="module-footer">
${footer.html}
</footer>`;
};

// Generate only CSS content
export const generateCssOnly = (state: AppState): string => {
  const { header, body, footer } = state;

  return `/* Base Reset */
body { 
  margin: 0; 
  padding: 0; 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column; 
}

/* HEADER MODULE STYLES */
${header.css}

/* BODY MODULE STYLES */
${body.css}

/* FOOTER MODULE STYLES */
${footer.css}`;
};

// Generate HTML with Tailwind (inline styles)
export const generateHtmlWithTailwind = (state: AppState): string => {
  const { header, body, footer } = state;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Page - Tailwind</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>

    <!-- HEADER MODULE -->
    <header id="module-header">
        ${header.html}
    </header>

    <!-- BODY MODULE -->
    <main id="module-body">
        ${body.html}
    </main>

    <!-- FOOTER MODULE -->
    <footer id="module-footer">
        ${footer.html}
    </footer>

</body>
</html>`;
};

// Main export function with format selection
export const exportProject = (state: AppState, format: ExportFormat) => {
  switch (format) {
    case 'html-only':
      downloadFile(generateHtmlOnly(state), 'content.html', 'text/html');
      break;
    case 'css-only':
      downloadFile(generateCssOnly(state), 'styles.css', 'text/css');
      break;
    case 'html-tailwind':
      downloadFile(generateHtmlWithTailwind(state), 'page-tailwind.html', 'text/html');
      break;
    case 'combined':
    default:
      downloadFile(generateCombinedHtml(state), 'complete-page.html', 'text/html');
      break;
  }
};

// Generic file download function
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Legacy function for backward compatibility
export const downloadHtmlFile = (content: string, filename: string) => {
  downloadFile(content, filename, 'text/html');
};