import type { Metadata } from "next";
import Link from "next/link";
import { KoHeader } from "@/components/ko/ko-header";
import { KoFooter } from "@/components/ko/ko-footer";
import { KoBookingForm } from "@/components/ko/ko-booking-form";
import { OptimizedPhoto } from "@/components/optimized-photo";
import { siteConfig } from "@/lib/site-data";
import {
  formatManwon,
  getKoRooms,
  koFaqs,
  koRoomFeature,
  koRoomName,
  koRoomStatus,
  koSite,
  koTransit,
  lowestMonthlyKrw,
  sortedImages,
} from "@/lib/ko-site";
import type { RoomWithImages } from "@/lib/types";

export const dynamic = "force-dynamic";

function priceLabel(room: RoomWithImages) {
  return room.monthly_rate_krw ? `월 ${formatManwon(room.monthly_rate_krw)}` : "가격 문의";
}

export async function generateMetadata(): Promise<Metadata> {
  const rooms = await getKoRooms().catch(() => []);
  const lowest = lowestMonthlyKrw(rooms);
  const priceText = lowest ? `월 ${formatManwon(lowest)}부터` : "1인실 · 공과금 포함";
  const title = `노량진 고시원 스타고시원 | 상도역 5분 · ${priceText}`;
  const description = `노량진 고시원 스타고시원. 상도역 도보 5분, 노량진역 도보 10분. ${
    lowest ? `월 ${formatManwon(lowest)}부터, ` : ""
  }공과금 · 인터넷 포함, 1개월부터 입실 가능한 남성 전용 고시원(고시텔)입니다.`;
  return {
    title: { absolute: title },
    description,
    keywords: [
      "노량진 고시원",
      "노량진 고시텔",
      "노량진 원룸텔",
      "노량진 고시원 가격",
      "상도역 고시원",
      "상도동 고시원",
      "숭실대 고시원",
      "동작구 고시원",
    ],
    alternates: {
      canonical: "/ko",
      languages: { ko: "/ko", en: "/", "x-default": "/" },
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url.replace(/\/$/, "")}/ko`,
      siteName: "스타고시원",
      locale: "ko_KR",
      type: "website",
      images: [{ url: "/images/private-shower/7.window-day.jpg", alt: "스타고시원 외창 있는 방" }],
    },
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[2px] text-[#5A5F63] md:text-xs md:tracking-[2.5px]">
      {children}
    </p>
  );
}

export default async function KoHomePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room: initialRoom } = await searchParams;
  const rooms = await getKoRooms();
  const lowest = lowestMonthlyKrw(rooms);
  const deposit = koSite.depositKrw;
  const base = siteConfig.url.replace(/\/$/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "스타고시원",
    alternateName: "Star Goshiwon",
    description: "노량진 · 상도역 근처 남성 전용 고시원. 공과금 · 인터넷 포함, 1개월부터 입실.",
    url: `${base}/ko`,
    image: `${base}/images/private-shower/7.window-day.jpg`,
    ...(lowest ? { priceRange: `월 ${formatManwon(lowest)}부터` } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: "만양로12가길 64",
      addressLocality: "동작구",
      addressRegion: "서울특별시",
      postalCode: "06937",
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.coordinates.lat,
      longitude: siteConfig.coordinates.lng,
    },
    hasMap: siteConfig.naverMapUrl,
    sameAs: [siteConfig.naverMapUrl, siteConfig.kakao],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KoHeader />

      <main>
        {/* Price first. On phones this is a short text block so the first room
            card shows on the first screen; on desktop it sits on a photo. */}
        <section className="relative md:h-[520px] md:bg-[#16181A]">
          <OptimizedPhoto
            src="/images/private-shower/7.window-day.jpg"
            alt="스타고시원 외창 있는 방"
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 hidden h-full w-full object-cover opacity-55 md:block"
          />
          <div className="relative mx-auto max-w-6xl px-5 pt-6 md:absolute md:inset-x-0 md:bottom-16 md:px-12 md:pt-0 md:text-white">
            <h1>
              <span className="block text-[13px] font-semibold text-[#5A5F63] md:text-lg md:text-white">
                {koSite.tagline}
              </span>
              <span className="mt-1.5 block text-[32px] font-extrabold leading-tight tracking-[-1px] md:mt-3 md:text-[88px] md:leading-[1.1] md:tracking-[-3px]">
                {lowest ? `월 ${formatManwon(lowest)}부터` : "공과금 포함 1인실"}
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#3A3F43] md:mt-4 md:text-xl md:text-white">
              {deposit != null ? `보증금 ${formatManwon(deposit)} · ` : ""}공과금 포함 · 1개월부터
            </p>
          </div>
        </section>

        <section id="rooms" className="mx-auto max-w-6xl scroll-mt-16 px-5 pt-6 md:scroll-mt-20 md:px-12 md:pt-20">
          <div className="md:flex md:items-end md:justify-between">
            <div>
              <SectionLabel>ROOMS</SectionLabel>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.4px] md:mt-2.5 md:text-[40px] md:tracking-[-1.2px]">
                방 · 가격
              </h2>
            </div>
            <p className="hidden text-sm text-[#5A5F63] md:block">
              모든 방에 외창 · 침대 · 책상 · 미니 냉장고 · 냉난방기
            </p>
          </div>
          <div className="mt-3 grid gap-5 md:mt-8 md:grid-cols-3">
            {rooms.map((room) => {
              const images = sortedImages(room);
              const cover = images[0];
              return (
                <article key={room.id} className="border border-[#DCDEE0]">
                  <Link href={`/ko/rooms/${room.slug}`} className="relative block">
                    {cover && (
                      <OptimizedPhoto
                        src={cover.url}
                        alt={`${koRoomName(room)} 사진`}
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="block h-[210px] w-full object-cover md:h-[280px]"
                      />
                    )}
                    <span className="absolute bottom-2.5 right-2.5 bg-[#16181A]/80 px-2.5 py-1 text-xs font-semibold text-white md:text-[13px]">
                      사진 {images.length}장 ›
                    </span>
                  </Link>
                  <div className="px-4 pb-4 pt-3.5 md:px-5 md:pb-5 md:pt-[18px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[19px] font-extrabold md:text-[22px]">{koRoomName(room)}</h3>
                      <span className="whitespace-nowrap text-[19px] font-extrabold md:text-[22px]">
                        {priceLabel(room)}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between gap-3 text-[13px] text-[#5A5F63] md:mt-1.5 md:text-[15px]">
                      <span>{koRoomFeature(room)}</span>
                      <span className="whitespace-nowrap font-semibold text-[#1F7A4D]">
                        {koRoomStatus[room.status]}
                      </span>
                    </div>
                    <div className="mt-3.5 flex gap-2 md:mt-[18px]">
                      <Link
                        href={`/ko/rooms/${room.slug}`}
                        className="flex h-11 flex-1 items-center justify-center border border-[#16181A] text-sm font-semibold md:h-[46px] md:text-[15px]"
                      >
                        자세히 보기
                      </Link>
                      <Link
                        href={`/ko?room=${room.slug}#booking`}
                        className="flex h-11 flex-1 items-center justify-center bg-[#16181A] text-sm font-extrabold text-white md:h-[46px] md:text-[15px]"
                      >
                        예약하기
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-[#5A5F63] md:hidden">
            모든 방에 외창, 침대, 책상 · 의자, 미니 냉장고, 냉난방기, 와이파이가 있습니다.
          </p>
        </section>

        <section id="shared" className="mx-auto max-w-6xl scroll-mt-16 px-5 pt-14 md:grid md:scroll-mt-20 md:grid-cols-12 md:items-end md:gap-14 md:px-12 md:pt-28">
          <div className="md:col-span-5">
            <SectionLabel>SHARED</SectionLabel>
            <h2 className="mb-4 mt-1.5 text-2xl font-extrabold tracking-[-0.6px] md:mb-5 md:mt-2.5 md:text-[40px] md:tracking-[-1.2px]">
              같이 쓰는 공간
            </h2>
            <p className="text-sm leading-[1.7] text-[#3A3F43] md:mb-7 md:text-[17px] md:leading-[1.8]">
              주방에는 밥이 준비되어 있습니다. 세탁실, 정수기, 전자레인지, 발코니를 함께
              쓰고, 택배는 대신 보관해 드립니다.
            </p>
            <OptimizedPhoto
              src="/images/common/rice-cooker.jpg"
              alt="공용 주방 밥솥"
              sizes="40vw"
              className="hidden h-[300px] w-full object-cover md:block"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1.5 md:col-span-7 md:mt-0 md:grid-cols-5 md:gap-5">
            <OptimizedPhoto
              src="/images/common/balcony.jpg"
              alt="공용 발코니"
              sizes="(min-width: 768px) 35vw, 100vw"
              className="col-span-2 h-[170px] w-full object-cover md:col-span-3 md:h-[480px]"
            />
            <OptimizedPhoto
              src="/images/common/rice-cooker.jpg"
              alt="공용 주방 밥솥"
              sizes="50vw"
              className="h-[130px] w-full object-cover md:hidden"
            />
            <OptimizedPhoto
              src="/images/economy/2.desk.jpg"
              alt="방 안 책상"
              sizes="(min-width: 768px) 25vw, 50vw"
              className="h-[130px] w-full object-cover md:col-span-2 md:h-[480px]"
            />
          </div>
        </section>

        <section id="location" className="mx-auto max-w-6xl scroll-mt-16 px-5 pt-14 md:grid md:scroll-mt-20 md:grid-cols-12 md:gap-14 md:px-12 md:pt-28">
          <div className="md:order-2 md:col-span-5">
            <SectionLabel>LOCATION</SectionLabel>
            <h2 className="mb-4 mt-1.5 text-2xl font-extrabold tracking-[-0.6px] md:mb-6 md:mt-2.5 md:text-[40px] md:tracking-[-1.2px]">
              오시는 길
            </h2>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero/optimized/hill-street-night-1280.webp"
            alt="고시원 앞 골목"
            loading="lazy"
            className="h-[200px] w-full object-cover md:order-1 md:col-span-7 md:row-span-2 md:h-[440px]"
          />
          <div className="md:order-3 md:col-span-5">
            <div className="mt-3.5 text-[15px] font-semibold md:mt-0 md:text-[19px]">{koSite.address}</div>
            <ul className="mt-3 border-t border-[#16181A] text-sm md:mt-5 md:text-base">
              {koTransit.map((t) => (
                <li key={t.place} className="flex justify-between border-b border-[#DCDEE0] py-3 md:py-3.5">
                  <span>{t.place}</span>
                  <span className="font-semibold">{t.time}</span>
                </li>
              ))}
            </ul>
            <a
              href={koSite.naverMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 inline-block border-b border-[#16181A] pb-0.5 text-sm font-semibold md:mt-5 md:text-base"
            >
              네이버 지도 열기 →
            </a>
          </div>
        </section>

        <section id="booking" className="mt-14 scroll-mt-14 bg-[#F3F4F5] md:mt-32 md:scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-10 md:grid md:grid-cols-12 md:gap-14 md:px-12 md:py-20">
            <div className="md:col-span-5">
              <SectionLabel>BOOKING</SectionLabel>
              <h2 className="mb-2 mt-1.5 text-2xl font-extrabold tracking-[-0.6px] md:mb-4 md:mt-2.5 md:text-[40px] md:tracking-[-1.2px]">
                예약 요청
              </h2>
              <p className="mb-4 text-sm leading-[1.7] text-[#3A3F43] md:mb-0 md:text-[17px] md:leading-[1.8]">
                요청을 남기면 빈 방을 확인하고 남겨주신 번호로 입금 안내를 드립니다. 카카오톡으로
                같은 내용을 보내주시면 더 빨리 답장드려요.
              </p>
              <div className="mt-10 hidden border-t border-[#16181A] md:block">
                <a
                  href={koSite.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between border-b border-[#C9CCCF] py-5"
                >
                  <span>
                    <span className="block text-sm text-[#5A5F63]">방을 먼저 보고 싶다면</span>
                    <span className="mt-1 block text-[22px] font-extrabold">방 보기 예약</span>
                  </span>
                  <span className="self-center text-[22px]">→</span>
                </a>
                <a
                  href={koSite.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between border-b border-[#C9CCCF] py-5"
                >
                  <span>
                    <span className="block text-sm text-[#5A5F63]">바로 물어보고 싶다면</span>
                    <span className="mt-1 block text-[22px] font-extrabold">카카오톡 문의</span>
                  </span>
                  <span className="self-center text-[22px]">→</span>
                </a>
              </div>
            </div>
            <div className="md:col-span-7">
              <KoBookingForm
                key={initialRoom ?? "default"}
                rooms={rooms.map((r) => ({
                  slug: r.slug,
                  name: koRoomName(r),
                  priceLabel: priceLabel(r),
                  monthlyKrw: r.monthly_rate_krw ?? null,
                  depositKrw: koSite.depositKrw,
                }))}
                initialRoom={initialRoom}
                kakaoChatUrl={koSite.kakaoChatUrl}
              />
              <div className="mt-6 border-t border-[#C9CCCF] md:hidden">
                <a
                  href={koSite.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between border-b border-[#DCDEE0] py-4 text-[15px] font-semibold"
                >
                  <span>방을 먼저 보고 싶다면 · 방 보기 예약</span>
                  <span>→</span>
                </a>
                <a
                  href={koSite.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between py-4 text-[15px] font-semibold"
                >
                  <span>바로 물어보고 싶다면 · 카카오톡 문의</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl scroll-mt-16 px-5 pb-12 pt-12 md:grid md:scroll-mt-20 md:grid-cols-12 md:gap-10 md:px-12 md:pb-24 md:pt-24">
          <div className="md:col-span-3">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-[-0.6px] md:mt-2.5 md:text-[32px]">
              자주 묻는 질문
            </h2>
          </div>
          <div className="mt-4 border-t border-[#16181A] md:col-span-9 md:mt-0">
            {koFaqs.map((f) => (
              <details key={f.q} className="group border-b border-[#DCDEE0]">
                <summary className="flex cursor-pointer list-none justify-between gap-4 py-4 text-[15px] md:py-5 md:text-lg [&::-webkit-details-marker]:hidden">
                  <span>{f.q}</span>
                  <span className="transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 text-sm leading-[1.7] text-[#3A3F43] md:pb-5 md:text-base">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <KoFooter />
    </>
  );
}
