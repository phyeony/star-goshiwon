"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };
type NavGroup = { label: string; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

const navItems: NavEntry[] = [
  { href: "/admin/availability", label: "예약 현황" },
  { href: "/admin/requests", label: "예약 요청" },
  { href: "/admin/reviews", label: "후기 관리" },
  {
    label: "객실",
    items: [
      { href: "/admin/rooms", label: "객실 타입" },
      { href: "/admin/room-units", label: "객실 번호" },
    ],
  },
  { href: "/admin/email-templates", label: "이메일 템플릿" },
  { href: "/admin/document-templates", label: "문서 양식" },
  {
    label: "기타",
    items: [
      { href: "/admin/dashboard", label: "대시보드" },
      { href: "/admin/pricing", label: "요금 분석" },
      { href: "/admin/inbox", label: "받은 메일" },
    ],
  },
];

function isLink(entry: NavEntry): entry is NavLink {
  return "href" in entry;
}

export function AdminNav() {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const desktopNavRef = useRef<HTMLElement>(null);

  // Close both menus on navigation.
  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    if (!openGroup) return;

    function handlePointerDown(event: MouseEvent) {
      if (!desktopNavRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenGroup(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openGroup]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isGroupActive(group: NavGroup) {
    return group.items.some((item) => isActive(item.href));
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
          <nav
            ref={desktopNavRef}
            className="hidden items-center gap-4 text-sm font-medium lg:flex"
          >
            {navItems.map((entry) => {
              if (isLink(entry)) {
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className={
                      isActive(entry.href)
                        ? "text-indigo-600"
                        : "text-gray-600 hover:text-indigo-600"
                    }
                  >
                    {entry.label}
                  </Link>
                );
              }

              const expanded = openGroup === entry.label;
              return (
                <div key={entry.label} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroup(expanded ? null : entry.label)
                    }
                    aria-expanded={expanded}
                    aria-haspopup="true"
                    className={`inline-flex items-center gap-1 ${
                      isGroupActive(entry)
                        ? "text-indigo-600"
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                  >
                    {entry.label}
                    <span aria-hidden className="text-[0.625rem]">
                      ▼
                    </span>
                  </button>
                  {expanded && (
                    <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {entry.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenGroup(null)}
                          className={
                            isActive(item.href)
                              ? "block bg-gray-50 px-3 py-2 text-indigo-600"
                              : "block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                          }
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {open && (
          <nav className="grid grid-cols-2 gap-2 border-t border-gray-100 py-3 text-sm font-medium lg:hidden">
            {navItems.map((entry) => {
              if (isLink(entry)) {
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={() => setOpen(false)}
                    className={
                      isActive(entry.href)
                        ? "rounded-lg bg-gray-50 px-3 py-2 text-indigo-600"
                        : "rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    }
                  >
                    {entry.label}
                  </Link>
                );
              }

              return (
                <div key={entry.label} className="col-span-2">
                  <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase text-gray-400">
                    {entry.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {entry.items.map((item) => (
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
                  </div>
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
