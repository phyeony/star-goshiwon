import Link from "next/link";
import { koSite } from "@/lib/ko-site";

export function KoFooter() {
  return (
    <footer className="border-t border-[#DCDEE0] px-5 pb-28 pt-9 text-xs leading-[1.9] text-[#5A5F63] md:px-12 md:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:justify-between">
        <div>
          <div className="mb-1 text-[15px] font-extrabold text-[#16181A]">스타고시원</div>
          <div>{koSite.address}</div>
          <a href={koSite.kakaoChannelUrl} target="_blank" rel="noopener noreferrer" className="underline">
            카카오톡 채널
          </a>
        </div>
        <div className="flex gap-4 md:items-start">
          <Link href="/ko/policy">이용 약관</Link>
          <Link href="/ko/policy#privacy">개인정보 처리</Link>
          <Link href="/" hrefLang="en">English</Link>
        </div>
      </div>
    </footer>
  );
}
