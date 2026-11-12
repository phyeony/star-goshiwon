import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KoHeader } from "@/components/ko/ko-header";
import { KoFooter } from "@/components/ko/ko-footer";
import { ImageGallery } from "@/components/image-lightbox";
import { TrackEvent } from "@/components/analytics/track-event";
import { KoBookingForm } from "@/components/ko/ko-booking-form";
import {
  formatManwon,
  getKoRooms,
  koRoomDetail,
  koRoomFeature,
  koRoomName,
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
  "외창",
  "침대",
  "책상 · 의자",
  "미니 냉장고",
  "냉난방기",
  "와이파이",
  "밥 제공",
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
      <TrackEvent
        event="room_viewed"
        properties={{ room_slug: room.slug, room_name: name, room_status: room.status, locale: "ko" }}
      />
      <KoHeader />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-5 md:px-12 md:pt-8">
        <nav className="mb-4 text-sm text-[#5A5F63]">
          <Link href="/ko#rooms">방 · 가격</Link>
          <span className="mx-2">/</span>
          <span className="text-[#16181A]">{name}</span>
        </nav>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="w-full lg:w-[62%]">
            {images.length > 0 && (
              <>
                <ImageGallery images={images} roomName={name} lang="ko" />
                <p className="-mt-5 mb-7 text-[13px] leading-relaxed text-[#5A5F63]">
                  사진은 예시입니다. 방은 같은 종류 안에서 배정되며,{" "}
                  <strong className="font-semibold text-[#16181A]">
                    같은 종류의 방은 크기와 시설이 같습니다.
                  </strong>
                </p>
              </>
            )}

            <p className="text-[13px] font-semibold text-[#5A5F63]">{koSite.tagline}</p>
            <div className="mt-1 flex items-start justify-between gap-4">
              <h1 className="text-[28px] font-extrabold tracking-[-0.8px] md:text-[36px]">{name}</h1>
              <span className="whitespace-nowrap text-[28px] font-extrabold tracking-[-0.8px] md:text-[36px]">
                {priceLabel(room)}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#5A5F63]">
              보증금 {formatManwon(koSite.depositKrw)} · 공과금 · 인터넷 포함 · 1개월부터
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-[#3A3F43]">{koRoomDetail(room)}</p>

            <h2 className="mt-8 text-lg font-extrabold">방 안에 있는 것</h2>
            <ul className="mt-3 grid grid-cols-2 border-t border-[#16181A] text-sm md:grid-cols-3">
              {included.map((item) => (
                <li key={item} className="border-b border-[#DCDEE0] py-2.5">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside id="inquiry" className="w-full scroll-mt-20 lg:w-[38%]">
            <div className="border border-[#DCDEE0] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-extrabold">입실 문의</h2>
              <p className="mb-5 mt-1 text-sm text-[#5A5F63]">
                입실일과 기간을 남겨주세요.{" "}
                <strong className="font-semibold text-[#16181A]">요청만으로는 결제되지 않아요.</strong>
              </p>
              <KoBookingForm
                rooms={rooms.map((r) => ({
                  slug: r.slug,
                  name: koRoomName(r),
                  priceLabel: priceLabel(r),
                  monthlyKrw: r.monthly_rate_krw ?? null,
                  depositKrw: koSite.depositKrw,
                }))}
                initialRoom={room.slug}
                kakaoChatUrl={koSite.kakaoChatUrl}
                singleRoom
              />
            </div>
          </aside>
        </div>
      </main>
      <KoFooter />
    </>
  );
}
