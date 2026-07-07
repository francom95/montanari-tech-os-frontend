/**
 * Clipboard write with a graceful failure signal — `navigator.clipboard` can be unavailable
 * (insecure context) or rejected (permissions). Callers toast on the boolean instead of throwing.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Triggers a browser download of an in-memory string as a file (no server round-trip). */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
