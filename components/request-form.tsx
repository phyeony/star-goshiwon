"use client";

import { FormEvent, useMemo, useState } from "react";
import { property, rooms } from "@/lib/site-data";
import { formatEstimate, getStayEstimate } from "@/lib/pricing";

type SubmitState = {
  submitted: boolean;
  summary: string;
};

export function RequestForm() {
  const [selectedRoomSlug, setSelectedRoomSlug] = useState(rooms[0]?.slug ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ submitted: false, summary: "" });
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.slug === selectedRoomSlug) ?? rooms[0],
    [selectedRoomSlug]
  );
  const estimate = useMemo(
    () =>
      selectedRoom
        ? getStayEstimate({
            room: selectedRoom,
            checkIn,
            checkOut
          })
        : null,
    [checkIn, checkOut, selectedRoom]
  );

  const contactLinks = useMemo(() => {
    const encoded = encodeURIComponent(submitState.summary || "I would like to request a booking.");
    return {
      whatsapp: `${property.whatsappHref}?text=${encoded}`,
      email: `mailto:${property.email}?subject=Request%20to%20Book&body=${encoded}`,
      kakao: property.kakaotalkHref
    };
  }, [submitState.summary]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedRoom || !estimate?.isValid || estimate.total === null) {
      setError("Please choose a room and valid stay dates to calculate the estimated total.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const summary = [
      `Hello, I want to request a stay at ${property.name}.`,
      `Guest: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      `Room: ${formData.get("room")}`,
      `Check-in: ${formData.get("checkIn")}`,
      `Check-out: ${formData.get("checkOut")}`,
      `Guests: ${formData.get("guests")}`,
      `Estimated total: ${formatEstimate(estimate.total)}`,
      `Pricing basis: ${estimate.label}`,
      `Message: ${formData.get("message")}`
    ].join("\n");

    setIsSubmitting(true);

    const response = await fetch("/api/booking-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        roomSlug: selectedRoom.slug,
        roomName: selectedRoom.name,
        checkIn: formData.get("checkIn"),
        checkOut: formData.get("checkOut"),
        guests: Number(formData.get("guests")),
        message: formData.get("message"),
        estimatedTotal: estimate.total,
        pricingBasis: estimate.label,
        nights: estimate.nights
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not send your booking request. Please try again.");
      return;
    }

    setSubmitState({ submitted: true, summary });
    event.currentTarget.reset();
    setSelectedRoomSlug(rooms[0]?.slug ?? "");
    setCheckIn("");
    setCheckOut("");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={handleSubmit} className="rounded-[32px] bg-white p-8 shadow-card">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Full name
            <input required name="name" className="rounded-2xl border border-black/10 bg-sand px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Email
            <input
              required
              type="email"
              name="email"
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Room type
            <select
              required
              name="room"
              value={selectedRoom?.name ?? ""}
              onChange={(event) => {
                const room = rooms.find((entry) => entry.name === event.target.value);
                if (room) {
                  setSelectedRoomSlug(room.slug);
                }
              }}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3"
            >
              {rooms.map((room) => (
                <option key={room.slug}>{room.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Guests
            <select name="guests" className="rounded-2xl border border-black/10 bg-sand px-4 py-3">
              <option>1</option>
              <option>2</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Check-in
            <input
              required
              type="date"
              name="checkIn"
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Check-out
            <input
              required
              type="date"
              name="checkOut"
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink md:col-span-2">
            Message
            <textarea
              name="message"
              rows={5}
              placeholder="Tell us about your stay, nationality, visa status, or arrival time."
              className="rounded-2xl border border-black/10 bg-sand px-4 py-3"
            />
          </label>
        </div>
        <div className="mt-6 rounded-[28px] bg-mist p-5 text-sm text-ink">
          <p className="font-semibold text-ink">Estimated stay cost</p>
          {selectedRoom ? (
            <div className="mt-3 space-y-2 leading-6 text-ink/75">
              <p>
                Room: <span className="font-semibold text-ink">{selectedRoom.name}</span>
              </p>
              <p>
                Rate: ${selectedRoom.priceNight}/night or ${selectedRoom.priceMonth}/month
              </p>
              <p>
                {estimate?.isValid && estimate.total !== null
                  ? `${formatEstimate(estimate.total)} for ${estimate.nights} night${estimate.nights === 1 ? "" : "s"}`
                  : "Choose valid dates to see the estimated total."}
              </p>
              <p>{estimate?.description ?? "Monthly rates are used for longer stays."}</p>
            </div>
          ) : null}
        </div>
        {error ? <p className="mt-4 text-sm font-medium text-coral">{error}</p> : null}
        <button
          disabled={isSubmitting}
          className="mt-6 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send request"}
        </button>
      </form>

      <aside className="rounded-[32px] bg-pine p-8 text-white">
        <h3 className="font-display text-3xl">How booking works</h3>
        <ol className="mt-5 space-y-4 text-sm leading-6 text-white/80">
          <li>1. Choose a room and send your request with dates.</li>
          <li>2. The host reviews availability and stay details manually.</li>
          <li>3. You receive a follow-up by email or messaging app before anything is confirmed.</li>
        </ol>

        {submitState.submitted ? (
          <div className="mt-8 rounded-[28px] bg-white/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">Request sent</p>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Your stay is pending host review. Continue the conversation in your preferred channel.
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm font-semibold">
              <a className="rounded-full bg-white px-4 py-3 text-center text-ink" href={contactLinks.email}>
                Send by Email
              </a>
              <a className="rounded-full bg-white px-4 py-3 text-center text-ink" href={contactLinks.whatsapp}>
                Continue in WhatsApp
              </a>
              <a className="rounded-full border border-white/40 px-4 py-3 text-center text-white" href={contactLinks.kakao}>
                Continue in KakaoTalk
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] bg-white/10 p-5 text-sm leading-6 text-white/80">
            This form now stores booking requests in Supabase. Add your project URL, service role key, and table setup to activate it.
          </div>
        )}
      </aside>
    </div>
  );
}
