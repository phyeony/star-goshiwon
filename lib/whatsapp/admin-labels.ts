// Korean labels for the /admin/whatsapp pages.

import type { Category } from "@/lib/whatsapp-agent/types";

export const CATEGORY_LABEL: Record<Category, string> = {
  pricing: "가격 문의",
  location: "위치·교통",
  rules: "규칙·시설·정책",
  booking_how_to: "예약 방법",
  availability: "빈방 문의",
  men_only: "남성 전용 확인",
  booking_status: "예약 상태 확인",
  discount: "할인 요청",
  group: "단체 문의",
  viewing: "방 보기",
  short_stay: "7박 미만",
  special_request: "특별 요청",
  complaint: "불편·고장",
  residence_document: "거주 확인서",
  media: "사진·음성·파일",
  smalltalk: "인사·감사",
  other: "기타",
};

// Categories the agent may answer by itself (decide.ts SAFE_PROSPECT /
// SAFE_CONFIRMED). Only these have a switch; the rest always go to the manager.
export const SWITCHABLE: Category[] = [
  "pricing",
  "location",
  "rules",
  "booking_how_to",
  "availability",
  "men_only",
  "short_stay",
  "smalltalk",
  "residence_document",
];

export const OUTCOME_LABEL: Record<string, string> = {
  send: "자동 답변",
  send_check_only: "남성 확인만 보내고 넘김",
  send_decline: "정중히 거절",
  send_document_pending: "확인서 준비 중 안내",
  draft: "매니저에게 넘김",
  skip: "건너뜀",
};

export const MEN_ONLY_LABEL: Record<string, string> = {
  unasked: "남성 확인 전",
  asked: "남성 확인 질문함",
  confirmed: "남성 확인됨",
  not_eligible: "대상 아님 (마감)",
};

export const SENDER_LABEL: Record<string, string> = {
  guest: "손님",
  bot: "AI 비서",
  manager: "매니저",
};

// Code-side handoff reasons (decide.ts) in Korean; the model's own reason_ko
// is shown next to them.
export function reasonLabel(reason: string): string {
  const [head, rest] = reason.split(": ");
  const cat = rest as Category;
  switch (head) {
    case "needs manager":
      return `매니저 필요: ${CATEGORY_LABEL[cat] ?? rest}`;
    case "auto-send off":
      return `자동 답변 꺼짐: ${CATEGORY_LABEL[cat] ?? rest}`;
    case "reply check":
      return `답변 검사에 걸림: ${rest}`;
  }
  const fixed: Record<string, string> = {
    "not in English": "영어가 아님",
    "model asked for the manager": "AI가 매니저 확인 요청",
    "no free room found for those dates": "해당 날짜에 빈방 없음",
    "price question without room and dates": "방·날짜 없이 가격 문의",
    "agent error": "AI 오류",
    "bot paused": "봇 일시정지 중",
    "mode shadow": "24시간 창 지남 (자유 메시지 불가)",
    "mode off": "봇 꺼짐",
    "bot off for this chat": "이 채팅 봇 꺼짐",
    "closed: not eligible": "대상 아님 (마감)",
    "residence document requested": "거주 확인서 요청",
  };
  return fixed[reason] ?? reason;
}
