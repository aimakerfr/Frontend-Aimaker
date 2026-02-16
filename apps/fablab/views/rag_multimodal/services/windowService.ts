/**
 * Utilities to manage browser window operations.
 *
 * Currently includes helpers to download streamed files without opening them in a new tab.
 */

/**
 * Downloads a streamed file response and forces the browser to save it instead of opening it.
 *
 * @param response Fetch response containing a readable stream
 * @param filename Desired filename for the downloaded file
 */
export const downloadStreamAsFile = async (response: Response, filename: string) => {
  if (typeof window === 'undefined' || !window.document) {
    throw new Error('downloadStreamAsFile can only be used in a browser environment');
  }

  const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

  const collectChunks = async () => {
    if (!response.body) {
      const blob = await response.blob();
      return new Blob([blob], { type: contentType });
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];

    // Read the stream chunk by chunk
    let done = false;
    while (!done) {
      const { done: streamDone, value } = await reader.read();
      done = streamDone;
      if (value) {
        chunks.push(value);
      }
    }

    return new Blob(chunks, { type: contentType });
  };

  const blob = await collectChunks();
  const url = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
};
