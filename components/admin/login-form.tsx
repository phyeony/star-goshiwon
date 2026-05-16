"use client";

import { useState, useTransition } from "react";
import { signInWithEmail, signInWithGoogle } from "@/app/login/actions";

export function LoginForm({
  next,
  disabled = false,
}: {
  next?: string;
  disabled?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signInWithEmail(email, next);
      if (!result.ok) {
        setError(result.error || "로그인 링크 전송에 실패했습니다.");
        return;
      }
      setSent(true);
    });
  }

  function handleGoogle() {
    setError(null);
    startGoogleTransition(async () => {
      await signInWithGoogle(next);
    });
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
        <strong>{email}</strong>로 로그인 링크를 보냈습니다. 받은편지함을 확인해 주세요.
      </div>
    );
  }

  const busy = disabled || pending || googlePending;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <GoogleIcon />
        {googlePending ? "이동 중..." : "Google로 계속하기"}
      </button>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-200" />
        <span>또는</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase">
          이메일 매직 링크
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={busy}
          className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
        />
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || email.length === 0}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "전송 중..." : "로그인 링크 전송"}
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.63z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 8.997 8.997 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
