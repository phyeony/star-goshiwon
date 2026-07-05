"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ADDITIONAL_REVIEW_CATEGORY_LABELS,
  BASIC_REVIEW_CATEGORY_LABELS,
  LOW_SCORE_COMMENT_THRESHOLD,
  SMILEY_SCORES,
} from "@/lib/review-validation";

const SMILEY_FACES = ["😞", "🙁", "🙂", "😄"] as const;

function SmileyRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (score: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-1">
        {SMILEY_SCORES.map((score, i) => (
          <button
            key={score}
            type="button"
            aria-label={`${label}: ${score} out of 10`}
            aria-pressed={value === score}
            onClick={() => onChange(value === score ? null : score)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition ${
              value === score
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 bg-white opacity-60 hover:opacity-100"
            }`}
          >
            {SMILEY_FACES[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({
  token,
  initialGuestName,
  roomType,
}: {
  token: string;
  initialGuestName: string;
  roomType: string;
}) {
  const [score, setScore] = useState<number | null>(null);
  const [basic, setBasic] = useState<Record<string, number | null>>({});
  const [additional, setAdditional] = useState<Record<string, number | null>>(
    {}
  );
  const [title, setTitle] = useState("");
  const [positive, setPositive] = useState("");
  const [negative, setNegative] = useState("");
  const [guestName, setGuestName] = useState(initialGuestName);
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const needsComment =
    score !== null &&
    score <= LOW_SCORE_COMMENT_THRESHOLD &&
    !positive.trim() &&
    !negative.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (score === null) {
      setError("Please choose an overall score.");
      return;
    }
    if (needsComment) {
      setError(
        "For a low score, please add a short comment about what went wrong."
      );
      return;
    }
    setSubmitting(true);
    try {
      const toRows = (record: Record<string, number | null>) =>
        Object.entries(record)
          .filter(([, s]) => s !== null)
          .map(([label, s]) => ({ label, score: s as number }));
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          guest_name: guestName,
          country,
          score,
          title,
          positive,
          negative,
          basic_categories: toRows(basic),
          additional_categories: toRows(additional),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(
          body.error === "already_used"
            ? "This link has already been used."
            : body.error === "expired"
              ? "This review link has expired."
              : (body.error ?? "Something went wrong. Please try again.")
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Thank you for your review!
        </h2>
        <p className="mt-3 text-base leading-7 text-gray-700">
          Your review has been received and will appear on our reviews page
          after a quick check.
        </p>
        <Link
          href="/reviews"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          See guest reviews
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 focus:border-indigo-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-gray-500">Your stay</p>
        <p className="mt-1 text-base font-semibold text-gray-900">{roomType}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <label className="text-base font-bold text-gray-900">
          Overall score <span className="text-red-600">*</span>
        </label>
        <p className="mt-1 text-sm text-gray-500">1 = poor, 10 = excellent</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={score === n}
              onClick={() => setScore(n)}
              className={`h-11 rounded-lg border text-base font-semibold transition ${
                score === n
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-base font-bold text-gray-900">Rate your stay</p>
        <p className="mt-1 text-sm text-gray-500">
          Optional — tap a face, tap again to clear.
        </p>
        <div className="mt-3 divide-y divide-gray-100">
          {BASIC_REVIEW_CATEGORY_LABELS.map((label) => (
            <SmileyRow
              key={label}
              label={label}
              value={basic[label] ?? null}
              onChange={(s) => setBasic((prev) => ({ ...prev, [label]: s }))}
            />
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-gray-700">
          A bit more detail
        </p>
        <div className="mt-1 divide-y divide-gray-100">
          {ADDITIONAL_REVIEW_CATEGORY_LABELS.map((label) => (
            <SmileyRow
              key={label}
              label={label}
              value={additional[label] ?? null}
              onChange={(s) =>
                setAdditional((prev) => ({ ...prev, [label]: s }))
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <label
            htmlFor="review-title"
            className="text-sm font-medium text-gray-700"
          >
            Title <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="review-title"
            type="text"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`mt-1 ${inputClass}`}
            placeholder="Sum up your stay in one line"
          />
        </div>
        <div>
          <label
            htmlFor="review-positive"
            className="text-sm font-medium text-gray-700"
          >
            What did you like? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="review-positive"
            rows={3}
            maxLength={2000}
            value={positive}
            onChange={(e) => setPositive(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label
            htmlFor="review-negative"
            className="text-sm font-medium text-gray-700"
          >
            What could be better?{" "}
            <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="review-negative"
            rows={3}
            maxLength={2000}
            value={negative}
            onChange={(e) => setNegative(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="review-name"
            className="text-sm font-medium text-gray-700"
          >
            Your name <span className="text-red-600">*</span>
          </label>
          <input
            id="review-name"
            type="text"
            required
            maxLength={80}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label
            htmlFor="review-country"
            className="text-sm font-medium text-gray-700"
          >
            Country <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="review-country"
            type="text"
            maxLength={60}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={`mt-1 ${inputClass}`}
            placeholder="e.g. US"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
