// Canned messages the manager sends from the admin chat page with one tap.
// They go out as normal texts, so only inside the 24-hour window after the
// guest's last message (Meta's rule); outside it the buttons are disabled.

import { linkInsteadMessage, verificationMessage } from "@/lib/passport/messages";
import { siteConfig } from "@/lib/site-data";
import { goshiwonIntro, MEN_ONLY_CHECK } from "@/lib/whatsapp-agent/facts";

export interface QuickReply {
  key: string;
  label: string; // Korean, on the button
  text: string; // English, to the guest
  /** Sending it counts as asking the men-only question. */
  asksMenOnly?: boolean;
  /**
   * Carries a fresh upload link for the chat's linked booking request
   * (lib/passport). `text` is then only the preview; the sent text is
   * withLink(url).
   */
  sendsVerificationLink?: boolean;
  /** With sendsVerificationLink: the text sent, given the real link. */
  withLink?: (url: string) => string;
}

/** Shown on the button in place of the real link. */
export const LINK_PLACEHOLDER = "[verification link]";

export const QUICK_REPLIES: QuickReply[] = [
  {
    key: "verification",
    label: "인증 링크 보내기",
    text: verificationMessage(LINK_PLACEHOLDER),
    sendsVerificationLink: true,
    withLink: verificationMessage,
  },
  {
    key: "id_not_here",
    label: "채팅 말고 링크로",
    text: linkInsteadMessage(LINK_PLACEHOLDER),
    sendsVerificationLink: true,
    withLink: linkInsteadMessage,
  },
  { key: "goshiwon_intro", label: "고시원 안내", text: goshiwonIntro(siteConfig.url) },
  { key: "men_only", label: "남성 확인", text: MEN_ONLY_CHECK, asksMenOnly: true },
  {
    key: "will_reply",
    label: "확인 후 답장",
    text: "Thanks for your message! The manager will check and get back to you soon.",
  },
];

export function quickReply(key: string): QuickReply | undefined {
  return QUICK_REPLIES.find((q) => q.key === key);
}

// Same margin as the booking-received message: don't send right at the edge.
const WINDOW_MS = 24 * 60 * 60 * 1000 - 10 * 60 * 1000;

/** Whether a normal text can still reach the guest. */
export function canSendText(lastGuestMessageAt: string | null, now = new Date()): boolean {
  if (!lastGuestMessageAt) return false;
  const t = Date.parse(lastGuestMessageAt);
  return !Number.isNaN(t) && now.getTime() - t < WINDOW_MS;
}
