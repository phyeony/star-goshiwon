"use client";

import { useEffect, useState } from "react";

// Kept in this tab's sessionStorage by the booking form, never in a URL
// (analytics records URLs). Missing (another tab, a reload much later):
// the guest uses the link in the confirmation email instead.
export const verifyUrlKey = (requestId: string) => `verify-url:${requestId}`;

/** "Now or later" booking verification on the request success page. */
export function VerifyNowCard({ requestId, email }: { requestId: string; email: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [later, setLater] = useState(false);

  useEffect(() => {
    try {
      setUrl(window.sessionStorage.getItem(verifyUrlKey(requestId)));
    } catch {
      setUrl(null);
    }
  }, [requestId]);

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-left mb-6">
      <h2 className="text-lg font-semibold text-indigo-900">Finish your booking verification</h2>
      <p className="mt-2 text-sm text-indigo-800">
        We need it before we can approve your booking. You can do it now, or later once your questions are answered.
        It takes about a minute.
      </p>
      {later ? (
        <p className="mt-4 text-sm text-indigo-800">
          No problem. We&apos;ve emailed the link to <strong>{email}</strong>, so you can do it any time.
        </p>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {url && (
            <a
              href={url}
              rel="noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Verify now
            </a>
          )}
          <button
            type="button"
            onClick={() => setLater(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-indigo-800 border border-indigo-300 bg-white hover:bg-indigo-50"
          >
            {url ? "I'll do it later" : "Use the link in your email"}
          </button>
        </div>
      )}
    </div>
  );
}
