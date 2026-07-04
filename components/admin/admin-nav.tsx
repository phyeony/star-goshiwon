"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin/availability", label: "예약 현황" },
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/inbox", label: "받은 메일" },
  { href: "/admin/requests", label: "예약 요청" },
  { href: "/admin/rooms", label: "객실 타입" },
  { href: "/admin/room-units", label: "객실 번호" },
  { href: "/admin/email-templates", label: "이메일 템플릿" },
];

export function AdminNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-14 items-center justify-between gap-3 py-2">
          <Link href="/admin" className="font-bold text-gray-900">
            스타고시원 관리자
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 lg:hidden"
            aria-label="관리자 메뉴 열기"
            aria-expanded={open}
          >
            <span className="sr-only">메뉴</span>
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 bg-gray-700" />
              <span className="block h-0.5 w-5 bg-gray-700" />
              <span className="block h-0.5 w-5 bg-gray-700" />
            </span>
          </button>
          <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-indigo-600"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {open && (
          <nav className="grid grid-cols-2 gap-2 border-t border-gray-100 py-3 text-sm font-medium lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  isActive(item.href)
                    ? "rounded-lg bg-gray-50 px-3 py-2 text-indigo-600"
                    : "rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
