"use client";

import { useState } from "react";

interface PayPalStartButtonProps {
  href: string;
}

export function PayPalStartButton({ href }: PayPalStartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(href, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "fetch",
        },
      });

      const data = (await res.json().catch(() => ({}))) as {
        redirectUrl?: string;
        error?: string;
      };
      if (res.ok && data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      setError(data.error || "We could not open PayPal. Please try again or contact us.");
      setLoading(false);
    } catch {
      setError("We could not open PayPal. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="mt-5 w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <span className="mr-2 h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Opening PayPal...
          </>
        ) : (
          "Continue to PayPal"
        )}
      </button>
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}
