"use client";

import { useRef, useState } from "react";
import { buildUploadForm, PhotoDecodeError, resizeForUpload } from "@/lib/photo-resize";
import type { SitePhoto } from "@/lib/site-photos";

type ItemStatus = "resizing" | "uploading" | "done" | "error";

interface QueueItem {
  key: string;
  name: string;
  status: ItemStatus;
  error?: string;
}

const STATUS_LABEL: Record<ItemStatus, string> = {
  resizing: "줄이는 중…",
  uploading: "올리는 중…",
  done: "완료",
  error: "실패",
};

const ERROR_LABEL: Record<string, string> = {
  decode: "이 형식은 열 수 없어요. JPG나 PNG로 바꿔서 올려 주세요 (아이폰 HEIC 사진은 Safari에서 올리면 돼요).",
  file_too_large: "사진이 너무 커요.",
  invalid_image: "사진 파일이 아니에요.",
  unauthorized: "로그인이 풀렸어요. 다시 로그인해 주세요.",
};

function errorText(code: string | undefined): string {
  return (code && ERROR_LABEL[code]) || "올리지 못했어요. 다시 시도해 주세요.";
}

async function uploadOne(file: File, onStatus: (s: ItemStatus) => void): Promise<SitePhoto> {
  onStatus("resizing");
  let resized;
  try {
    resized = await resizeForUpload(file);
  } catch (error) {
    throw new Error(error instanceof PhotoDecodeError ? "decode" : "resize");
  }
  onStatus("uploading");
  const res = await fetch("/api/admin/photos", {
    method: "POST",
    body: buildUploadForm(file, resized, { caption_en: "", caption_ko: "" }),
  });
  const body = (await res.json().catch(() => ({}))) as SitePhoto & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `http_${res.status}`);
  return body;
}

/** Drop zone + file picker. Photos are resized in the browser, then uploaded
 * two at a time. Each finished photo is reported through onUploaded. */
export function PhotoUploader({
  onUploaded,
  hint,
}: {
  onUploaded: (photo: SitePhoto) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  function update(key: string, patch: Partial<QueueItem>) {
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)
    );
    if (files.length === 0) return;

    const items = files.map((file, i) => ({
      file,
      key: `${Date.now()}-${i}-${file.name}`,
    }));
    setQueue((q) => [
      ...items.map(({ file, key }) => ({ key, name: file.name, status: "resizing" as const })),
      ...q.filter((item) => item.status !== "done"),
    ]);

    // Two at a time keeps memory low on phones while still being quick.
    let next = 0;
    async function worker() {
      while (next < items.length) {
        const { file, key } = items[next++];
        try {
          const photo = await uploadOne(file, (status) => update(key, { status }));
          update(key, { status: "done" });
          onUploaded(photo);
        } catch (error) {
          update(key, { status: "error", error: (error as Error).message });
        }
      }
    }
    await Promise.all([worker(), worker()]);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white hover:border-indigo-400"
        }`}
      >
        <svg className="mb-2 h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
        </svg>
        <p className="font-semibold text-gray-900">사진 올리기</p>
        <p className="mt-1 text-sm text-gray-500">
          여기에 사진을 끌어다 놓거나 눌러서 고르세요. 여러 장도 한 번에 돼요.
        </p>
        {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          data-testid="photo-file-input"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {queue.map((item) => (
            <li key={item.key} className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-gray-200">
              <span className="truncate text-gray-700">{item.name}</span>
              <span
                className={`shrink-0 font-medium ${
                  item.status === "done"
                    ? "text-green-700"
                    : item.status === "error"
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {STATUS_LABEL[item.status]}
              </span>
            </li>
          ))}
          {queue.some((item) => item.status === "error") && (
            <li className="px-1 text-red-600">
              {errorText(queue.find((item) => item.status === "error")?.error)}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
