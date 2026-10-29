/**
 * Copies text to the clipboard, returning whether it worked. The async
 * Clipboard API is missing on plain http (e.g. the dev server opened from a
 * phone on the LAN) and in some in-app browsers, and can reject on mobile, so
 * this falls back to the legacy execCommand path. iOS Safari only copies
 * from a selection made with setSelectionRange on an editable, on-screen field.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("aria-hidden", "true");
  // 16px stops iOS from zooming in on focus; kept in the viewport but invisible.
  field.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(field);
  return copied;
}
