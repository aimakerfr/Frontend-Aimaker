/**
 * Servicio para rastrear tools que aún no han sido guardados por primera vez.
 * Estos tools no se muestran en la biblioteca hasta que el usuario haga clic en "Guardar".
 */

const STORAGE_KEY = 'unsavedToolIds';

/**
 * Marca un tool como "no guardado" (recién creado, no aparece en biblioteca)
 */
export function markToolAsUnsaved(toolId: number): void {
  const unsavedIds = getUnsavedToolIds();
  if (!unsavedIds.includes(toolId)) {
    unsavedIds.push(toolId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unsavedIds));
  }
}

/**
 * Marca un tool como "guardado" (primera vez guardado, ahora aparece en biblioteca)
 */
export function markToolAsSaved(toolId: number): void {
  const unsavedIds = getUnsavedToolIds();
  const filtered = unsavedIds.filter(id => id !== toolId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Verifica si un tool está marcado como "no guardado"
 */
export function isToolUnsaved(toolId: number): boolean {
  const unsavedIds = getUnsavedToolIds();
  return unsavedIds.includes(toolId);
}

/**
 * Obtiene todos los IDs de tools no guardados
 */
export function getUnsavedToolIds(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading unsaved tools from localStorage:', error);
    return [];
  }
}

/**
 * Limpia todos los IDs (útil para testing o reset)
 */
export function clearUnsavedTools(): void {
  localStorage.removeItem(STORAGE_KEY);
}
