// Browser helpers for putting a library photo into a Facebook post: copy it
// to the clipboard (paste with Ctrl/Cmd+V in the post box), or save it to the
// phone's photos via the share sheet so it can be attached in the Facebook app.

const MAX_SIDE = 2048;

async function toPng(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`photo ${res.status}`);
  const bitmap = await createImageBitmap(await res.blob());
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  );
}

export function canCopyImages(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof ClipboardItem !== "undefined" &&
    typeof navigator.clipboard?.write === "function"
  );
}

/** Copies the photo as PNG. Safari needs the ClipboardItem built inside the click, with a promise. */
export async function copyImage(url: string): Promise<boolean> {
  if (!canCopyImages()) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": toPng(url) })]);
    return true;
  } catch {
    return false;
  }
}

/** Phones: opens the share sheet ("이미지 저장"). Elsewhere: downloads the files. */
export async function saveImages(photos: { url: string; name: string }[]): Promise<void> {
  const files = await Promise.all(
    photos.map(async (p) => {
      const res = await fetch(p.url);
      if (!res.ok) throw new Error(`photo ${res.status}`);
      const blob = await res.blob();
      return new File([blob], p.name, { type: blob.type || "image/jpeg" });
    })
  );
  if (typeof navigator.canShare === "function" && navigator.canShare({ files })) {
    try {
      await navigator.share({ files });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // Fall back to downloading.
    }
  }
  for (const file of files) {
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
  }
}
