/**
 * Returns the working canvas for the selected note without dereferencing a
 * missing client-side canvas state during server rendering.
 */
export function resolveCanvasElements<T>(
  state: { noteId: string; elements: T[] } | null,
  noteId: string | undefined,
  fallback: T[],
): T[] {
  return state && state.noteId === noteId ? state.elements : fallback;
}
