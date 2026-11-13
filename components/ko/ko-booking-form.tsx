"use client";

import { useState } from "react";

export interface KoRoomOption {
  slug: string;
  name: string;
  priceLabel: string;
  monthlyKrw?: number | null;
  depositKrw?: number | null;
}

interface Props {
  rooms: KoRoomOption[];
  initialRoom?: string;
  /** Shown after sending, for guests who want to call. */
  contactPhone: string;
  contactPhoneHref: string;
  /** Room page: the room is fixed, so show it as text instead of a select. */
  singleRoom?: boolean;
}

interface Sent {
  lines: [string, string][];
}

const won = (krw: number) => `${krw.toLocaleString("ko-KR")}원`;

function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const inputClass =
  "block h-12 w-full min-w-0 border border-[#C9CCCF] bg-white px-3.5 text-[15px] text-[#16181A] outline-none focus:border-[#16181A] md:h-[52px] md:text-base";
const labelClass = "mb-1.5 block text-[13px] font-semibold md:text-sm";

export function KoBookingForm({ rooms, initialRoom, contactPhone, contactPhoneHref, singleRoom }: Props) {
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

  const selectedRoom = rooms.find((r) => r.slug === roomSlug);
  const monthly = selectedRoom?.monthlyKrw ?? null;
  const deposit = selectedRoom?.depositKrw ?? null;

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
      const room = rooms.find((r) => r.slug === roomSlug);
      const [, mm, dd] = moveIn.split("-");
      setSent({
        lines: [
          ["방", room ? `${room.name} · ${room.priceLabel}` : roomSlug],
          ["입실 희망일", moveIn ? `${Number(mm)}월 ${Number(dd)}일` : "-"],
          ["예상 기간", `${months}개월`],
          ["이름", name.trim()],
          ["연락처", phone.trim()],
        ],
      });
    } catch {
      setError("인터넷 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className={singleRoom ? "" : "border border-[#DCDEE0] bg-white p-5 md:p-9"} role="status">
        <p className="text-lg font-extrabold md:text-2xl">예약 요청을 받았습니다</p>
        <p className="mt-2 text-sm leading-relaxed text-[#3A3F43] md:text-base">
          빈 방을 확인한 뒤 남겨주신 번호로 입금 안내를 드릴게요. 아직 결제된 것은 없어요.
        </p>
        <dl className="mt-4 bg-[#F3F4F5] p-4 text-sm">
          {sent.lines.map(([k, v]) => (
            <div key={k} className="flex gap-4 py-1">
              <dt className="w-20 shrink-0 text-[#5A5F63]">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <a
          href={contactPhoneHref}
          className="mt-4 flex h-[54px] w-full items-center justify-center border border-[#16181A] text-base font-extrabold"
        >
          급하시면 전화 주세요 · {contactPhone}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={singleRoom ? "" : "md:border md:border-[#DCDEE0] md:bg-white md:p-9"}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-2.5 gap-y-3.5 md:gap-x-4 md:gap-y-[18px]">
        {singleRoom ? null : (
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
        <label className="block min-w-0">
          <span className={labelClass}>입실 희망일</span>
          <input
            type="date"
            value={moveIn}
            min={todayKst()}
            onChange={(e) => setMoveIn(e.target.value)}
            // iOS Safari gives date inputs a wide intrinsic width; reset it so the field fits its column.
            className={`${inputClass} appearance-none text-left [&::-webkit-date-and-time-value]:text-left`}
            required
          />
        </label>
        <label className="block min-w-0">
          <span className={labelClass}>예상 이용 기간</span>
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
        {monthly ? (
          <div className="col-span-2 bg-[#F3F4F5] px-4 py-4 text-sm" aria-live="polite">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-extrabold">월 이용료</span>
              <span className="text-2xl font-extrabold tracking-[-0.5px]">{won(monthly)}</span>
            </div>
            <p className="mt-0.5 text-right text-xs text-[#5A5F63]">
              전기 · 수도 · 가스 · 인터넷 포함, 추가 관리비 없음
            </p>

            <div className="mt-3 border-t border-[#DCDEE0] pt-3 text-[13px] text-[#5A5F63]">
              <div className="flex justify-between gap-3 py-0.5">
                <span>보증금 (퇴실할 때 돌려드려요)</span>
                <span>{deposit ? won(deposit) : "별도"}</span>
              </div>
              <div className="flex justify-between gap-3 py-0.5">
                <span>입실 전 입금 (첫 달 + 보증금)</span>
                <span>{won(monthly + (deposit ?? 0))}</span>
              </div>
              {months > 1 ? (
                <div className="flex justify-between gap-3 py-0.5">
                  <span>{months}개월 이용료 합계</span>
                  <span>{won(monthly * months)}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
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
              href="/ko/policy"
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
            동의하지 않을 수 있으며, 이 경우 전화로 직접 문의해 주세요.
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
        요청만으로는 결제되지 않습니다. 빈 방을 확인한 뒤 남겨주신 번호로 연락드려요.
      </p>
    </form>
  );
}
