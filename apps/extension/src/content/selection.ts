export function getSelectedText(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";
  return selection.toString().trim();
}

export function getSelectionRange(): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0);
}

export function getSelectionPosition(): { top: number; left: number } | null {
  const range = getSelectionRange();
  if (!range) return null;
  const rect = range.getBoundingClientRect();
  return { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX };
}
