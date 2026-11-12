"use client";

import Link from "next/link";
import { useState } from "react";
import { koSite } from "@/lib/ko-site";

const nav = [
  { href: "/ko#rooms", label: "방 · 가격" },
  { href: "/ko#shared", label: "공용 공간" },
  { href: "/ko#location", label: "오시는 길" },
  { href: "/ko#faq", label: "자주 묻는 질문" },
];

export function KoHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#DCDEE0] bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:h-[72px] md:px-12">
        <Link href="/ko" aria-label="스타고시원 노량진" className="flex w-fit flex-col leading-none">
          <span className="text-xl font-extrabold tracking-[-0.6px] md:text-2xl">스타고시원</span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="h-px flex-1 bg-[#5A5F63]/50" />
            <span className="whitespace-nowrap text-[11px] font-semibold tracking-[3px] text-[#5A5F63] md:text-xs">
              노량진
            </span>
            <span className="h-px flex-1 bg-[#5A5F63]/50" />
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-semibold md:flex" aria-label="주요 메뉴">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-black">
              {item.label}
            </a>
          ))}
          <Link href="/" hrefLang="en" className="font-normal text-[#5A5F63]">
            EN
          </Link>
          <span className="flex gap-2">
            <a
              href={koSite.phoneHref}
              className="border border-[#16181A] px-4 py-2.5 text-sm font-extrabold"
            >
              {koSite.phone}
            </a>
            <a href="/ko#booking" className="bg-[#16181A] px-5 py-2.5 text-sm font-extrabold text-white">
              예약하기
            </a>
          </span>
        </nav>

        <div className="flex items-center gap-3.5 text-[13px] md:hidden">
          <Link href="/" hrefLang="en" className="text-[#5A5F63]">
            EN
          </Link>
          <a href="/ko#booking" className="bg-[#16181A] px-3.5 py-2 font-extrabold text-white">
            예약하기
          </a>
          <button
            type="button"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-6 w-6 flex-col justify-center gap-1.5"
          >
            <span className={`block h-[1.5px] bg-[#16181A] transition ${open ? "translate-y-[3.75px] rotate-45" : ""}`} />
            <span className={`block h-[1.5px] bg-[#16181A] transition ${open ? "-translate-y-[3.75px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-[#DCDEE0] bg-white px-5 pb-4 md:hidden" aria-label="모바일 메뉴">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-[#EEF0F1] py-3.5 text-[15px] font-semibold"
            >
              {item.label}
            </a>
          ))}
          <a
            href={koSite.phoneHref}
            className="mt-3 flex h-12 items-center justify-center border border-[#16181A] text-sm font-extrabold"
          >
            전화 문의 {koSite.phone}
          </a>
        </nav>
      )}
    </header>
  );
}
