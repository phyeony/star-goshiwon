"use client";

import { useEffect } from "react";

const SIZE_CLASSES = {
  md: "max-w-lg",
  xl: "max-w-5xl",
} as const;

/** Shared centred modal for admin tools (email composer, document issuing, room units). */
export function AdminModal({
  title,
  onClose,
  size = "xl",
  closeOnEscape = false,
  children,
}: {
  title: string;
  onClose: () => void;
  size?: keyof typeof SIZE_CLASSES;
  /** Opt-in: modals holding long drafts (email composer) shouldn't lose them to a stray Esc. */
  closeOnEscape?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!closeOnEscape) return;
    function handleKeyDown(e: KeyboardEvent) {
      // Esc also cancels Hangul IME composition — don't treat that as close.
      if (e.key === "Escape" && !e.isComposing) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${SIZE_CLASSES[size]} max-h-[92vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
