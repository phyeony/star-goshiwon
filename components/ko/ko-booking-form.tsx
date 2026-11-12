"use client";

import { useState } from "react";

export interface KoRoomOption {
  slug: string;
  name: string;
  priceLabel: string;
}

interface Props {
  rooms: KoRoomOption[];
  initialRoom?: string;
  kakaoChatUrl: string;
  /** Room page: the room is fixed, so show it as text instead of a select. */
  singleRoom?: boolean;
}

interface Sent {
  message: string;
  chatUrl: string;
}

function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const inputClass =
  "block h-12 w-full border border-[#C9CCCF] bg-white px-3.5 text-[15px] text-[#16181A] outline-none focus:border-[#16181A] md:h-[52px] md:text-base";
const labelClass = "mb-1.5 block text-[13px] font-semibold md:text-sm";

export function KoBookingForm({ rooms, initialRoom, kakaoChatUrl, singleRoom }: Props) {
  const [roomSlug, setRoomSlug] = useState(
    rooms.some((r) => r.slug === initialRoom) ? initialRoom! : rooms[0]?.slug ?? ""
  );
  const [moveIn, setMoveIn] = useState("");
  const [months, setMonths] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [menOnly, setMenOnly] = useState(false);
  const [policies, setPolicies] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!menOnly) {
      setError("남성 전용 고시원임을 확인해 주세요.");
      return;
    }
    if (!policies) {
      setError("이용 약관을 읽고 동의해 주세요.");
      return;
    }
    if (!agreed) {
      setError("개인정보 수집 · 이용에 동의해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ko/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_slug: roomSlug,
          move_in_date: moveIn,
          stay_months: months,
          guest_name: name,
          guest_phone: phone,
          notes,
          privacy_accepted: agreed,
          men_only_acknowledged: menOnly,
          policies_accepted: policies,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const first = body?.errors?.[0]?.message;
        setError(first || body?.error || "잠시 후 다시 시도해 주세요.");
        return;
      }
      setSent({ message: body.kakao_message, chatUrl: body.kakao_chat_url || kakaoChatUrl });
    } catch {
      setError("인터넷 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyAndOpen() {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(sent.message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    window.location.href = sent.chatUrl;
  }

  if (sent) {
    return (
      <div className={singleRoom ? "" : "border border-[#DCDEE0] bg-white p-5 md:p-9"} role="status">
        <p className="text-lg font-extrabold md:text-2xl">예약 요청을 받았습니다</p>
        <p className="mt-2 text-sm leading-relaxed text-[#3A3F43] md:text-base">
          아래 내용을 카카오톡으로 보내주시면 더 빨리 답장드릴 수 있어요. 보내지 않아도 요청은
          접수되었고, 빈 방을 확인한 뒤 남겨주신 번호로 연락드립니다.
        </p>
        <pre className="mt-4 whitespace-pre-wrap bg-[#F3F4F5] p-4 font-sans text-sm leading-relaxed">
          {sent.message}
        </pre>
        <button
          type="button"
          onClick={copyAndOpen}
          className="mt-4 flex h-[54px] w-full items-center justify-center bg-[#FEE500] text-base font-extrabold text-[#191919]"
        >
          메시지 복사하고 카카오톡 열기
        </button>
        <p className="mt-2 text-xs text-[#5A5F63]">
          {copied
            ? "복사했어요. 카카오톡 채팅창에 붙여넣고 보내 주세요."
            : "카카오톡이 열리면 채팅창에 붙여넣고 보내 주세요."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={singleRoom ? "" : "md:border md:border-[#DCDEE0] md:bg-white md:p-9"}>
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 md:gap-x-4 md:gap-y-[18px]">
        {singleRoom ? (
          <div className="col-span-2 flex items-baseline justify-between border-b border-[#DCDEE0] pb-3">
            <span className="text-base font-extrabold">
              {rooms.find((r) => r.slug === roomSlug)?.name}
            </span>
            <span className="text-base font-extrabold">
              {rooms.find((r) => r.slug === roomSlug)?.priceLabel}
            </span>
          </div>
        ) : (
        <label className="col-span-2 block">
          <span className={labelClass}>방 종류</span>
          <select
            value={roomSlug}
            onChange={(e) => setRoomSlug(e.target.value)}
            className={inputClass}
            required
          >
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name} · {r.priceLabel}
              </option>
            ))}
          </select>
        </label>
        )}
        <label className="block">
          <span className={labelClass}>입실 희망일</span>
          <input
            type="date"
            value={moveIn}
            min={todayKst()}
            onChange={(e) => setMoveIn(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>이용 기간</span>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className={inputClass}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}개월
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 block md:col-span-1">
          <span className={labelClass}>이름</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
            className={inputClass}
            required
          />
        </label>
        <label className="col-span-2 block md:col-span-1">
          <span className={labelClass}>휴대폰 번호</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            autoComplete="tel"
            className={inputClass}
            required
          />
        </label>
        <label className="col-span-2 block">
          <span className={labelClass}>
            요청 사항 <span className="font-normal text-[#5A5F63]">(선택)</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="방 보기를 원하는 시간 등"
            className="block w-full border border-[#C9CCCF] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[#16181A]"
          />
        </label>
      </div>

      <div className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-[#3A3F43] md:text-sm">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={menOnly}
            onChange={(e) => setMenOnly(e.target.checked)}
            className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#16181A]"
          />
          <span>남성 전용 고시원임을 확인했습니다. (필수)</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={policies}
            onChange={(e) => setPolicies(e.target.checked)}
            className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#16181A]"
          />
          <span>
            <a
              href="/policies/ko"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              이용 약관
            </a>
            을 읽었고 동의합니다. (필수)
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#16181A]"
          />
          <span>
            개인정보 수집 · 이용 동의 (필수){" "}
            <button
              type="button"
              onClick={() => setShowPrivacy((v) => !v)}
              className="underline"
              aria-expanded={showPrivacy}
            >
              {showPrivacy ? "닫기" : "보기"}
            </button>
          </span>
        </label>
        {showPrivacy && (
          <div className="mt-2 bg-[#F3F4F5] p-3 text-xs leading-relaxed text-[#3A3F43]">
            수집 항목: 이름, 휴대폰 번호
            <br />
            이용 목적: 예약 문의 답변, 빈 방 및 입금 안내
            <br />
            보유 기간: 문의 처리 후 1년. 입실하는 경우 계약 관련 법령이 정한 기간 동안 보관합니다.
            <br />
            동의하지 않을 수 있으며, 이 경우 카카오톡으로 직접 문의해 주세요.
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-[#C62828]" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-[18px] flex h-[54px] w-full items-center justify-center bg-[#16181A] text-base font-extrabold text-white disabled:opacity-60 md:h-[58px] md:text-[17px]"
      >
        {submitting ? "보내는 중…" : "예약 요청 보내기"}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-[#5A5F63]">
        요청만으로는 결제되지 않습니다. 보내고 나면 카카오톡으로 같은 내용을 보낼 수 있어요.
      </p>
    </form>
  );
}
