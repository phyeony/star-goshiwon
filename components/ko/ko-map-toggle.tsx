"use client";

import { useEffect, useRef, useState } from "react";

// Interactive Naver / Kakao maps for the /ko location section.
// Both need a free browser key, set at build time:
//   NEXT_PUBLIC_NAVER_MAP_KEY  - NAVER Cloud Platform > Maps > Application "Client ID"
//   NEXT_PUBLIC_KAKAO_MAP_KEY  - Kakao Developers app "JavaScript key"
// Register the site domains (and http://localhost:3000) with each. Without a key
// the tab shows the address with a button that opens that map app instead.

const NAVER_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_KEY ?? "";
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

type Provider = "naver" | "kakao";

interface Props {
  lat: number;
  lng: number;
  name: string;
  naverUrl: string;
  kakaoUrl: string;
  address: string;
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

// A black name tag with a pin tail, used as the marker on both maps.
function pinHtml(name: string) {
  return `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;pointer-events:none">
<div style="background:#16181A;color:#fff;font:800 13px/1 Pretendard,-apple-system,sans-serif;padding:8px 12px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.25)">${name}</div>
<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #16181A"></div></div>`;
}

export function KoMapToggle({ lat, lng, name, naverUrl, kakaoUrl, address }: Props) {
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
          new maps.Marker({ position: center, map, title: name, icon: { content: pinHtml(name), anchor: new maps.Point(0, 0) } });
        }
        if (provider === "kakao" && kakaoRef.current) {
          const { maps } = window.kakao;
          const center = new maps.LatLng(lat, lng);
          const map = new maps.Map(kakaoRef.current, { center, level: 3 });
          new maps.CustomOverlay({ position: center, content: pinHtml(name), map, yAnchor: 0, xAnchor: 0 });
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
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
          >
            <span dangerouslySetInnerHTML={{ __html: pinHtml(name).replace("transform:translate(-50%,-100%);", "") }} />
            <span className="text-sm text-[#3A3F43]">{address}</span>
            <span className="border-b border-[#16181A] pb-0.5 text-sm font-semibold">{appLabel} →</span>
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
