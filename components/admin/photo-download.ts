import { zipSync } from "fflate";
import { photoDownloadName, photoDownloadUrl, uniqueNames } from "@/lib/photo-download";
import type { AdminPhoto } from "./photo-types";

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function zipName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `goshiwon-photos-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.zip`;
}

/**
 * Downloads the largest stored version of each photo: one photo as a file,
 * several as a ZIP. Returns how many photos could not be fetched.
 */
export async function downloadPhotos(
  photos: AdminPhoto[],
  unitName: Map<string, string>,
  onProgress: (done: number, total: number) => void
): Promise<number> {
  const names = uniqueNames(
    photos.map((p) => photoDownloadName(p, p.room_unit_id ? unitName.get(p.room_unit_id) : null))
  );
  const files: Record<string, Uint8Array> = {};
  const types: Record<string, string> = {};
  let done = 0;
  let failed = 0;
  const queue = photos.map((photo, i) => ({ photo, name: names[i] }));

  async function worker() {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const res = await fetch(photoDownloadUrl(item.photo));
        if (!res.ok) throw new Error(String(res.status));
        files[item.name] = new Uint8Array(await res.arrayBuffer());
        types[item.name] = res.headers.get("Content-Type") ?? "application/octet-stream";
      } catch {
        failed++;
      }
      onProgress(++done, photos.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, photos.length) }, worker));

  const fetched = names.filter((n) => files[n]);
  if (fetched.length === 0) throw new Error("nothing downloaded");
  if (photos.length === 1) {
    save(new Blob([files[fetched[0]] as BlobPart], { type: types[fetched[0]] }), fetched[0]);
  } else {
    // Photos are already compressed, so store them as they are (level 0).
    const zip = zipSync(Object.fromEntries(fetched.map((n) => [n, [files[n], { level: 0 }]])));
    save(new Blob([zip as BlobPart], { type: "application/zip" }), zipName());
  }
  return failed;
}
