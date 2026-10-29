"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/copy-text";

/**
 * Copy button for review links. On phones it also offers the native share
 * sheet (straight to WhatsApp), and if copying fails it shows the link in a
 * selected field so it can be copied by hand.
 */
export function CopyLinkButton({
  url,
  label = "링크 복사",
}: {
  url: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const [canShare, setCanShare] = useState(false);
  const fallbackRef = useRef<HTMLInputElement>(null);

  // navigator.share only exists in the browser; checked after mount so the
  // server render matches.
  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (state !== "failed") return;
    fallbackRef.current?.focus();
    fallbackRef.current?.setSelectionRange(0, url.length);
  }, [state, url]);

  async function handleCopy() {
    if (await copyText(url)) {
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } else {
      setState("failed");
    }
  }

  async function handleShare() {
    try {
      await navigator.share({ url });
    } catch {
      // Closing the share sheet rejects too; nothing to do.
    }
  }

  const buttonClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50";

  return (
    <>
      <button type="button" onClick={handleCopy} className={buttonClass}>
        {state === "copied" ? "복사됨 ✓" : label}
      </button>
      {canShare && (
        <button type="button" onClick={handleShare} className={buttonClass}>
          공유
        </button>
      )}
      {state === "failed" && (
        <div className="basis-full">
          <p className="text-xs text-red-600">
            자동 복사가 안 됐습니다. 아래 링크를 길게 눌러 복사하세요.
          </p>
          <input
            ref={fallbackRef}
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900"
          />
        </div>
      )}
    </>
  );
}
