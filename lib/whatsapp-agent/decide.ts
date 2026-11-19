import type {
  AgentSettings,
  Category,
  ConversationState,
  MenOnlyState,
  Understanding,
} from "./types";

// Code — not the model — decides what is sent. The model labels the turn
// (understanding) and drafts a reply; this function applies the owner's
// rules to those labels. Spec: plan/whatsapp-agent.md §1.

export type Outcome =
  | "send" // send the reply, then mark the guest's messages read
  | "send_check_only" // first contact with a question we can't answer: send only the men-only check, draft the rest, leave unread
  | "send_decline" // guest's answer rules them out: send the fixed decline
  | "send_document_pending" // confirmed guest asked for a residence confirmation
  | "draft" // silent handoff: nothing sent, nothing marked read
  | "skip"; // bot off for this chat: no draft either

export interface DecideInput {
  settings: AgentSettings;
  state: ConversationState;
  understanding: Understanding | null; // null = the model failed or timed out
  facts: {
    hasQuote: boolean; // a price was computed for this turn's room + dates
    freeRooms: number | null; // null = availability not looked up
  };
  guardProblems: string[]; // from guard.ts; any problem forces a handoff
}

export interface Decision {
  outcome: Outcome;
  markRead: boolean;
  appendMenOnlyCheck: boolean;
  newMenOnlyState: MenOnlyState;
  // Why it was handed off, for the admin page (English; the model's
  // reason_ko is shown alongside).
  reasons: string[];
}

// Safe to answer for anyone who is not (yet) a confirmed guest.
const SAFE_PROSPECT: ReadonlySet<Category> = new Set([
  "pricing",
  "location",
  "rules",
  "booking_how_to",
  "availability",
  "men_only",
  "short_stay",
  "smalltalk",
]);

// Confirmed guests get generic answers only (spec §1.6).
const SAFE_CONFIRMED: ReadonlySet<Category> = new Set([
  "location",
  "rules",
  "pricing", // only with a computed quote, checked below
  "short_stay",
  "smalltalk",
]);

export function isConfirmedGuest(state: ConversationState): boolean {
  return state.linkedBooking?.status === "confirmed";
}

export function nextMenOnlyState(
  current: MenOnlyState,
  isFirstContact: boolean,
  signal: Understanding["men_only_signal"] | undefined,
): MenOnlyState {
  if (current === "confirmed" || current === "not_eligible") return current;
  if (signal === "declined") return "not_eligible";
  if (signal === "confirmed") return "confirmed";
  return isFirstContact || current === "unasked" ? "asked" : current;
}

export function decide(input: DecideInput): Decision {
  const { settings, state, understanding: u, facts, guardProblems } = input;
  const confirmedGuest = isConfirmedGuest(state);
  const newMenOnlyState = confirmedGuest
    ? state.menOnlyState
    : nextMenOnlyState(state.menOnlyState, state.isFirstContact, u?.men_only_signal);

  const handoff = (reasons: string[]): Decision => ({
    outcome: "draft",
    markRead: false,
    appendMenOnlyCheck: false,
    newMenOnlyState,
    reasons,
  });

  if (state.botState === "off") {
    return { ...handoff(["bot off for this chat"]), outcome: "skip" };
  }
  if (state.menOnlyState === "not_eligible") {
    return handoff(["closed: not eligible"]);
  }

  const canSend = settings.mode === "live" && state.botState === "active";
  const switchOn = (c: Category) => settings.autoSend[c] === true;

  if (!u) return handoff(["agent error"]);

  // The decline is a fixed text, so it goes out even if the drafted reply
  // tripped the guard.
  if (!confirmedGuest && newMenOnlyState === "not_eligible") {
    return canSend && switchOn("men_only")
      ? {
          outcome: "send_decline",
          markRead: true,
          appendMenOnlyCheck: false,
          newMenOnlyState,
          reasons: [],
        }
      : handoff(["not eligible (decline not sent: auto-send off)"]);
  }

  if (
    confirmedGuest &&
    u.categories.length === 1 &&
    u.categories[0] === "residence_document" &&
    u.guest_language === "en"
  ) {
    return canSend && switchOn("residence_document")
      ? {
          outcome: "send_document_pending",
          markRead: true,
          appendMenOnlyCheck: false,
          newMenOnlyState,
          reasons: [],
        }
      : handoff(["residence document requested"]);
  }

  const reasons: string[] = [];
  if (u.guest_language !== "en") reasons.push("not in English");
  if (u.needs_human) reasons.push("model asked for the manager");
  for (const p of guardProblems) reasons.push(`reply check: ${p}`);

  const safe = confirmedGuest ? SAFE_CONFIRMED : SAFE_PROSPECT;
  for (const c of u.categories) {
    if (!safe.has(c)) reasons.push(`needs manager: ${c}`);
    else if (!switchOn(c)) reasons.push(`auto-send off: ${c}`);
  }
  // Without dates the reply just asks for them; with dates and nothing free,
  // the manager may know better (spec §1.2).
  if (u.categories.includes("availability") && facts.freeRooms === 0) {
    reasons.push("no free room found for those dates");
  }
  if (confirmedGuest && u.categories.includes("pricing") && !facts.hasQuote) {
    reasons.push("price question without room and dates");
  }

  const askCheck =
    !confirmedGuest && (newMenOnlyState === "asked" || newMenOnlyState === "unasked");

  if (reasons.length === 0) {
    if (!canSend) return handoff([settings.mode === "live" ? "bot paused" : `mode ${settings.mode}`]);
    return {
      outcome: "send",
      markRead: true,
      appendMenOnlyCheck: askCheck,
      newMenOnlyState,
      reasons: [],
    };
  }

  // First contact with a question we can't answer: still ask the men-only
  // check so the guest isn't left waiting, but leave the message unread
  // because its question is still open.
  if (state.isFirstContact && askCheck && canSend && switchOn("men_only")) {
    return {
      outcome: "send_check_only",
      markRead: false,
      appendMenOnlyCheck: true,
      newMenOnlyState,
      reasons,
    };
  }
  return handoff(reasons);
}
