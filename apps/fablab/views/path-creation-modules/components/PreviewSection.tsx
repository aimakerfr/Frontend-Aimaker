import React, { useEffect, useRef, useState } from 'react';
import { ModuleData } from '../types';

interface PreviewSectionProps {
  data: ModuleData;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ data }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);

  // Construct the document string for the iframe
  // This ensures COMPLETE isolation. Styles from one iframe cannot leak to another.
  // UPDATE: Added scripts to intercept anchor clicks and handle scroll requests from other modules.
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${data.useTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
        <style>
          /* Reset body margin for seamless stacking */
          body { margin: 0; padding: 0; overflow: hidden; }
          /* User CSS */
          ${data.css}
        </style>
      </head>
      <body>
        <div id="content-wrapper">${data.html}</div>
        <script>
          // --- RESIZING LOGIC ---
          function sendHeight() {
            const height = document.body.scrollHeight;
            window.parent.postMessage({ type: 'resize', id: '${data.id}', height: height }, '*');
          }
          
          window.onload = sendHeight;
          const resizeObserver = new ResizeObserver(() => sendHeight());
          resizeObserver.observe(document.body);

          // --- LINK ORCHESTRATION LOGIC ---
          
          // 1. Intercept clicks on anchor tags with hash links (e.g., <a href="#contact">)
          document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
              const href = link.getAttribute('href');
              if (href && href.startsWith('#')) {
                e.preventDefault();
                // Tell the parent (Orchestrator) that we want to go to this section
                window.parent.postMessage({ type: 'anchor-click', hash: href }, '*');
              }
            }
          });

          // 2. Listen for scroll commands from the Orchestrator
          window.addEventListener('message', (e) => {
            if (e.data.type === 'scroll-to') {
              const targetId = e.data.hash; // e.g., "#contact"
              // Try to find the element in THIS module
              try {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              } catch (err) {
                // Ignore invalid selectors
              }
            }
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'resize' && event.data?.id === data.id) {
        setHeight(event.data.height);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [data.id]);

  // If there is no content, we show a placeholder.
  if (!data.html && !data.css) {
    return (
      <div className="w-full border-b border-dashed border-slate-300 bg-white/5 p-4 text-center text-slate-400 text-sm">
        Empty {data.name} Container
      </div>
    );
  }

  return (
    <div className="w-full relative bg-white">
      <iframe
        ref={iframeRef}
        title={`Preview ${data.name}`}
        srcDoc={srcDoc}
        style={{ height: height || '100px', minHeight: '50px' }}
        className="w-full border-0 block transition-all duration-200"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};