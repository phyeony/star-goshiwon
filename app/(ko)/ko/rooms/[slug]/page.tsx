import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KoHeader } from "@/components/ko/ko-header";
import { KoFooter } from "@/components/ko/ko-footer";
import { OptimizedPhoto } from "@/components/optimized-photo";
import { KoBookingForm } from "@/components/ko/ko-booking-form";
import {
  formatManwon,
  getKoRooms,
  koRoomDetail,
  koRoomFeature,
  koRoomName,
  koRoomStatus,
  koSite,
  sortedImages,
} from "@/lib/ko-site";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function findRoom(slug: string) {
  const rooms = await getKoRooms();
  return rooms.find((r) => r.slug === slug) ?? null;
}

function priceLabel(room: { monthly_rate_krw?: number | null }) {
  return room.monthly_rate_krw ? `월 ${formatManwon(room.monthly_rate_krw)}` : "가격 문의";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const room = await findRoom(slug).catch(() => null);
  if (!room) return {};
  const name = koRoomName(room);
  const price = room.monthly_rate_krw ? `월 ${formatManwon(room.monthly_rate_krw)}` : "가격 문의";
  return {
    title: { absolute: `${name} ${price} | 노량진 고시원 스타고시원` },
    description: `노량진 고시원 스타고시원 ${name}. ${koRoomFeature(room)}, ${price}. 공과금 · 인터넷 포함, 상도역 도보 5분.`,
    alternates: {
      canonical: `/ko/rooms/${room.slug}`,
      languages: { ko: `/ko/rooms/${room.slug}`, en: `/rooms/${room.slug}` },
    },
  };
}

const included = [
  "창문",
  "침대",
  "책상 · 의자",
  "미니 냉장고",
  "냉난방기",
  "와이파이",
  "전기 · 수도 · 가스 포함",
  "밥 · 김치 제공",
];

export default async function KoRoomPage({ params }: { params: Params }) {
  const { slug } = await params;
  const rooms = await getKoRooms();
  const room = rooms.find((r) => r.slug === slug);
  if (!room) notFound();

  const images = sortedImages(room);
  const name = koRoomName(room);

  return (
    <>
      <KoHeader />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-5 md:px-12 md:pt-10">
        <Link href="/ko#rooms" className="text-sm text-[#5A5F63]">
          ← 방 종류 전체 보기
        </Link>

        <div className="mt-4 md:grid md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5 md:order-2">
            <div className="md:sticky md:top-28">
              <p className="text-[13px] font-semibold text-[#5A5F63]">{koSite.tagline}</p>
              <h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.8px] md:text-[40px]">
                {name}
              </h1>
              <p className="mt-1 text-2xl font-extrabold md:text-3xl">
                {room.monthly_rate_krw ? `월 ${formatManwon(room.monthly_rate_krw)}` : "가격 문의"}
                {room.deposit_krw != null && (
                  <span className="ml-2 text-base font-semibold text-[#5A5F63]">
                    보증금 {formatManwon(room.deposit_krw)}
                  </span>
                )}
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-[#3A3F43]">{koRoomDetail(room)}</p>
              <p className="mt-2 text-sm font-semibold text-[#1F7A4D]">{koRoomStatus[room.status]}</p>

              <ul className="mt-5 grid grid-cols-2 border-t border-[#16181A] text-sm">
                {included.map((item) => (
                  <li key={item} className="border-b border-[#DCDEE0] py-2.5">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex gap-2">
                <a
                  href="#inquiry"
                  className="flex h-12 flex-1 items-center justify-center bg-[#16181A] text-[15px] font-extrabold text-white"
                >
                  입실 문의하기
                </a>
                <a
                  href={koSite.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 flex-1 items-center justify-center bg-[#FEE500] text-[15px] font-extrabold text-[#191919]"
                >
                  카카오톡 문의
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-2 md:order-1 md:col-span-7 md:mt-0 md:grid-cols-2">
            {images.map((img, i) => (
              <OptimizedPhoto
                key={img.id}
                src={img.url}
                alt={`${name} 사진 ${i + 1}`}
                sizes="(min-width: 768px) 30vw, 100vw"
                loading={i < 2 ? "eager" : "lazy"}
                className={`w-full object-cover ${i === 0 ? "h-[260px] md:col-span-2 md:h-[420px]" : "h-[220px] md:h-[240px]"}`}
              />
            ))}
          </div>
        </div>

        <section id="inquiry" className="mt-12 scroll-mt-16 bg-[#F3F4F5] px-5 py-8 -mx-5 md:mx-0 md:mt-20 md:grid md:scroll-mt-24 md:grid-cols-12 md:gap-12 md:px-10 md:py-12">
          <div className="md:col-span-5">
            <p className="text-[11px] font-semibold tracking-[2px] text-[#5A5F63]">BOOKING</p>
            <h2 className="mb-2 mt-1.5 text-2xl font-extrabold tracking-[-0.6px] md:text-[32px]">
              {name} 입실 문의
            </h2>
            <p className="mb-4 text-sm leading-[1.7] text-[#3A3F43] md:text-base">
              입실 희망일과 기간을 남겨주시면 빈 방을 확인하고 입금 안내를 드립니다. 요청만으로는
              결제되지 않습니다.
            </p>
          </div>
          <div className="md:col-span-7">
            <KoBookingForm
              rooms={rooms.map((r) => ({
                slug: r.slug,
                name: koRoomName(r),
                priceLabel: priceLabel(r),
              }))}
              initialRoom={room.slug}
              kakaoChatUrl={koSite.kakaoChatUrl}
            />
          </div>
        </section>
      </main>
      <KoFooter />
    </>
  );
}
