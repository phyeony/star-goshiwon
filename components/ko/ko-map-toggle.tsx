"use client";

import { useEffect, useRef, useState } from "react";

// Interactive Naver / Kakao maps for the /ko location section.
// Both need a free browser key, set at build time:
//   NEXT_PUBLIC_NAVER_MAP_KEY  - NAVER Cloud Platform > Maps > Application "Client ID"
//   NEXT_PUBLIC_KAKAO_MAP_KEY  - Kakao Developers app "JavaScript key"
// Register the site domains (and http://localhost:3000) with each. Without a key
// the tab shows a photo with a button that opens that map app instead.

const NAVER_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_KEY ?? "";
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

type Provider = "naver" | "kakao";

interface Props {
  lat: number;
  lng: number;
  name: string;
  naverUrl: string;
  kakaoUrl: string;
  fallbackImage: string;
}

declare global {
  interface Window {
    // Loaded at runtime from the providers' SDKs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao?: any;
  }
}

const loaded: Partial<Record<Provider, Promise<void>>> = {};

function loadScript(provider: Provider): Promise<void> {
  if (loaded[provider]) return loaded[provider]!;
  const src =
    provider === "naver"
      ? `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_KEY}`
      : `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
  loaded[provider] = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => {
      if (provider === "kakao") window.kakao.maps.load(() => resolve());
      else resolve();
    };
    el.onerror = () => {
      delete loaded[provider];
      reject(new Error(`${provider} map failed to load`));
    };
    document.head.appendChild(el);
  });
  return loaded[provider]!;
}

export function KoMapToggle({ lat, lng, name, naverUrl, kakaoUrl, fallbackImage }: Props) {
  const [provider, setProvider] = useState<Provider>("naver");
  const [failed, setFailed] = useState<Partial<Record<Provider, boolean>>>({});
  const naverRef = useRef<HTMLDivElement>(null);
  const kakaoRef = useRef<HTMLDivElement>(null);
  const drawn = useRef<Partial<Record<Provider, boolean>>>({});

  const hasKey = provider === "naver" ? Boolean(NAVER_KEY) : Boolean(KAKAO_KEY);
  const showMap = hasKey && !failed[provider];

  useEffect(() => {
    if (!showMap || drawn.current[provider]) return;
    let cancelled = false;
    loadScript(provider)
      .then(() => {
        if (cancelled) return;
        if (provider === "naver" && naverRef.current) {
          const { maps } = window.naver;
          const center = new maps.LatLng(lat, lng);
          const map = new maps.Map(naverRef.current, { center, zoom: 16 });
          new maps.Marker({ position: center, map, title: name });
        }
        if (provider === "kakao" && kakaoRef.current) {
          const { maps } = window.kakao;
          const center = new maps.LatLng(lat, lng);
          const map = new maps.Map(kakaoRef.current, { center, level: 3 });
          new maps.Marker({ position: center, map, title: name });
        }
        drawn.current[provider] = true;
      })
      .catch(() => !cancelled && setFailed((f) => ({ ...f, [provider]: true })));
    return () => {
      cancelled = true;
    };
  }, [provider, showMap, lat, lng, name]);

  const tabs: [Provider, string][] = [
    ["naver", "네이버 지도"],
    ["kakao", "카카오맵"],
  ];
  const appUrl = provider === "naver" ? naverUrl : kakaoUrl;
  const appLabel = provider === "naver" ? "네이버 지도 앱에서 열기" : "카카오맵 앱에서 열기";

  return (
    <div>
      <div className="flex border-b border-[#16181A]" role="tablist" aria-label="지도 선택">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={provider === key}
            onClick={() => setProvider(key)}
            className={`h-11 flex-1 text-sm font-semibold md:h-12 md:text-[15px] ${
              provider === key ? "bg-[#16181A] text-white" : "bg-white text-[#3A3F43]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative h-[260px] w-full bg-[#F3F4F5] md:h-[400px]">
        <div ref={naverRef} className={`absolute inset-0 ${provider === "naver" && showMap ? "" : "invisible"}`} />
        <div ref={kakaoRef} className={`absolute inset-0 ${provider === "kakao" && showMap ? "" : "invisible"}`} />
        {!showMap && (
          <a href={appUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fallbackImage} alt="고시원 앞 골목" loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-center bg-[#16181A]/85 text-sm font-semibold text-white">
              {appLabel} →
            </span>
          </a>
        )}
      </div>

      {showMap && (
        <a
          href={appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block border-b border-[#16181A] pb-0.5 text-sm font-semibold"
        >
          {appLabel} →
        </a>
      )}
    </div>
  );
}
