export const downloadHtmlFile = async (args: {
  url: string;
  filename?: string;
  includeCredentials?: boolean;
  headers?: Record<string, string>;
}) => {
  const { url, filename = 'page.html', includeCredentials = true, headers = {} } = args;

  const res = await fetch(url, {
    method: 'GET',
    credentials: includeCredentials ? 'include' : 'same-origin',
    headers: {
      ...headers,
      // Not required, but sometimes useful:
      Accept: 'text/html',
    },
  });

  if (!res.ok) {
    // You may want to read text for debugging:
    const errText = await res.text().catch(() => '');
    throw new Error(`Download failed (${res.status}): ${errText || res.statusText}`);
  }

  const blob = await res.blob();

  // Ensure browser treats it as a download
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
