export async function askAI(system, userMessage, options = {}) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: options.provider || 'anthropic',
      system,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: options.maxTokens || 1000,
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Error en el proxy');
  return data.text;
}
