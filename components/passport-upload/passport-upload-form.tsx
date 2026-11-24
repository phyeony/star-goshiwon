"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type PassportUploadBooking = {
  guestName: string;
  roomName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
};

type Props = {
  booking: PassportUploadBooking;
  contactEmail: string;
  /** Where the photo is POSTed. Without it (dev preview) the upload is simulated. */
  uploadUrl?: string;
  /** Start on the "received" screen (dev preview of the end state). */
  initiallyDone?: boolean;
};

const MAX_EDGE_PX = 2000;
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

export function PassportUploadForm({
  booking,
  contactEmail,
  uploadUrl,
  initiallyDone = false,
}: Props) {
  const firstName = booking.guestName.trim().split(/\s+/)[0] || "there";
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done">(
    initiallyDone ? "done" : "idle",
  );
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose a photo (JPG, PNG or HEIC).");
      return;
    }
    if (f.size > MAX_INPUT_BYTES) {
      setError("That photo is over 20 MB. Please choose a smaller one.");
      return;
    }
    setFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please add a photo of your passport first.");
      return;
    }
    if (!consent) {
      setError("Please tick the box to agree before uploading.");
      return;
    }
    setError("");
    setStatus("uploading");
    try {
      const jpeg = await shrinkAndStrip(file);
      if (uploadUrl) {
        const body = new FormData();
        body.append("photo", jpeg, "passport.jpg");
        body.append("consent", "yes");
        const res = await fetch(uploadUrl, { method: "POST", body });
        if (!res.ok) throw new Error(`upload_failed_${res.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 900));
      }
      setStatus("done");
    } catch {
      setStatus("idle");
      setError(
        "The upload didn't go through. Please check your connection and try again.",
      );
    }
  }

  if (status === "done") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Thanks, {firstName}. We&apos;ve received your photo.
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          The manager will check it within 24 hours and email you about your
          booking. Your photo stays encrypted and is deleted automatically on
          your check-out day.
        </p>
        <p className="mt-6 text-xs text-gray-500">
          Sent the wrong photo? Just open this link again and upload a new one.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Upload */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Add a photo of your passport
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          The page with your photo and name.
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-indigo-50/60 px-3 py-2 text-xs font-medium text-indigo-900">
          <span className="inline-flex items-center gap-1"><LockIcon className="h-3.5 w-3.5" /> Encrypted</span>
          <span className="inline-flex items-center gap-1"><PersonIcon className="h-3.5 w-3.5" /> Only the manager sees it</span>
          <span className="inline-flex items-center gap-1"><TrashIcon className="h-3.5 w-3.5" /> Deleted on your check-out day</span>
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id="passport-photo"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {previewUrl ? (
          <div className="mt-4">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Your passport photo, ready to upload"
                className="mx-auto max-h-80 w-auto object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-gray-600">{file?.name}</span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="shrink-0 font-medium text-indigo-600 hover:text-indigo-700"
              >
                Choose another
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="passport-photo"
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
          >
            <CameraIcon className="h-8 w-8 text-gray-400" />
            <span className="mt-3 text-sm font-semibold text-gray-900">
              Take a photo or choose one
            </span>
            <span className="mt-1 text-xs text-gray-500">
              JPG, PNG or HEIC, up to 20 MB
            </span>
          </label>
        )}

        <ul className="mt-5 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
          <Tip>All four corners in the frame</Tip>
          <Tip>Name, photo and dates easy to read</Tip>
          <Tip>No glare or blur</Tip>
        </ul>
      </section>

      {/* Consent + submit */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 min-h-4 min-w-4 flex-none rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-900">
            I agree that Star Goshiwon may use this photo to check my identity
            for this booking, and keep it until my check-out day. (Required){" "}
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="font-medium text-indigo-600 hover:text-indigo-700"
              aria-expanded={showDetails}
            >
              {showDetails ? "Hide details" : "Details"}
            </button>
          </span>
        </label>
        {showDetails && (
          <dl className="mt-3 space-y-2 rounded-lg bg-gray-50 p-4 text-xs leading-relaxed text-gray-700">
            <DetailRow label="What we collect">
              A photo of your passport&apos;s photo page.
            </DetailRow>
            <DetailRow label="Why">
              To check your identity before we approve your booking, and to
              prepare documents you ask for during your stay.
            </DetailRow>
            <DetailRow label="How long">
              Until your check-out day, then deleted automatically. If your
              request is declined or cancelled, it&apos;s deleted within 7 days.
            </DetailRow>
            <DetailRow label="Your choice">
              You can say no. We can&apos;t approve a booking without an
              identity check, but you can message us and we&apos;ll find
              another way, such as a short video call.
            </DetailRow>
          </dl>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "uploading"}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
        >
          <LockIcon className="h-4 w-4" />
          {status === "uploading" ? "Uploading securely…" : "Upload securely"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Questions? Email{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-indigo-600 hover:underline"
          >
            {contactEmail}
          </a>{" "}
          · Read our{" "}
          <Link href="/policies#privacy" className="text-indigo-600 hover:underline">
            privacy policy
          </Link>
        </p>
      </section>
      {/* Why + how it's protected */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Why we ask for your passport
        </h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Star Goshiwon has self check-in, with no front desk. Checking your
          passport before you arrive is how we make sure the person who booked
          is the person who moves in. It keeps the house safe for everyone
          living here. During your stay we may also use it to prepare
          documents you ask for, such as a residence confirmation.
        </p>

        <h3 className="mt-6 text-sm font-semibold text-gray-900">
          How we protect your photo
        </h3>
        <ul className="mt-3 space-y-3">
          <TrustItem icon={<LockIcon />} title="Encrypted">
            Sent over a secure connection and stored encrypted. It never goes
            through WhatsApp or email.
          </TrustItem>
          <TrustItem icon={<PersonIcon />} title="Only the manager sees it">
            It isn&apos;t shared with anyone, and it isn&apos;t used for
            anything except your booking and stay.
          </TrustItem>
          <TrustItem icon={<TrashIcon />} title="Deleted on your check-out day">
            Kept encrypted while you stay with us, then deleted automatically
            on your check-out day.
          </TrustItem>
        </ul>
      </section>

    </form>
  );
}

/**
 * Re-encode as JPEG on the guest's device: caps the size and drops EXIF
 * (GPS location, camera details) before anything leaves the phone.
 */
async function shrinkAndStrip(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85),
    );
  } catch {
    // Browsers that can't decode the format (some HEIC) send the original.
    return file;
  }
}

function TrustItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <span className="text-sm text-gray-600">
        <span className="block font-semibold text-gray-900">{title}</span>
        {children}
      </span>
    </li>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon className="mt-0.5 h-4 w-4 flex-none text-green-600" />
      <span>{children}</span>
    </li>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-gray-900">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

type IconProps = { className?: string };
const base = "fill-none stroke-current";

function LockIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} className={`${base} ${className}`} aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}
function PersonIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} className={`${base} ${className}`} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} className={`${base} ${className}`} aria-hidden>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CameraIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.75} className={`${base} ${className}`} aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2.5} className={`${base} ${className}`} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
