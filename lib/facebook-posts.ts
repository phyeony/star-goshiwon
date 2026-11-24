// Facebook group posting tracker (admin → 페이스북 홍보). Client-safe types
// and helpers; database access lives in facebook-queries.ts.

export interface FacebookGroup {
  id: string;
  name: string;
  url: string;
  notes: string;
  sort_order: number;
  created_at: string;
}

export interface FacebookPost {
  id: string;
  title: string;
  body: string;
  /** site_photos ids, in the order they should be attached. */
  photo_ids: string[];
  sort_order: number;
  created_at: string;
}

export interface FacebookPostLogEntry {
  id: string;
  group_id: string;
  post_id: string | null;
  posted_at: string;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Start of the current week (Monday 00:00 Korea time) as a Date. */
export function weekStartKst(now: Date = new Date()): Date {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const daysSinceMonday = (kst.getUTCDay() + 6) % 7;
  const mondayKstMidnight = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate() - daysSinceMonday
  );
  return new Date(mondayKstMidnight - KST_OFFSET_MS);
}

/** "11월 24일 (화)" in Korea time. */
export function formatKstDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(iso));
}

/** Whole days between two instants, counted on Korea-time calendar dates. */
export function kstDaysBetween(fromIso: string, now: Date = new Date()): number {
  const day = (d: Date) => Math.floor((d.getTime() + KST_OFFSET_MS) / 86_400_000);
  return day(now) - day(new Date(fromIso));
}

export interface GroupStatus {
  group: FacebookGroup;
  /** Newest first. */
  history: FacebookPostLogEntry[];
  last: FacebookPostLogEntry | null;
  postedThisWeek: boolean;
  /** The post to use next in this group: never used there, else least recently used. */
  suggestedPostId: string | null;
}

export function suggestPost(
  posts: FacebookPost[],
  history: FacebookPostLogEntry[]
): string | null {
  if (posts.length === 0) return null;
  const lastUsed = new Map<string, number>();
  for (const entry of history) {
    if (!entry.post_id) continue;
    const t = new Date(entry.posted_at).getTime();
    if (t > (lastUsed.get(entry.post_id) ?? -Infinity)) lastUsed.set(entry.post_id, t);
  }
  const ordered = [...posts].sort((a, b) => a.sort_order - b.sort_order);
  const unused = ordered.find((p) => !lastUsed.has(p.id));
  if (unused) return unused.id;
  return ordered.reduce((best, p) =>
    (lastUsed.get(p.id) ?? 0) < (lastUsed.get(best.id) ?? 0) ? p : best
  ).id;
}

export function groupStatuses(
  groups: FacebookGroup[],
  posts: FacebookPost[],
  log: FacebookPostLogEntry[],
  now: Date = new Date()
): GroupStatus[] {
  const weekStart = weekStartKst(now).getTime();
  return [...groups]
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
    .map((group) => {
      const history = log
        .filter((e) => e.group_id === group.id)
        .sort((a, b) => b.posted_at.localeCompare(a.posted_at));
      const last = history[0] ?? null;
      return {
        group,
        history,
        last,
        postedThisWeek: !!last && new Date(last.posted_at).getTime() >= weekStart,
        suggestedPostId: suggestPost(posts, history),
      };
    });
}

/** Accepts only http(s) Facebook links, so the admin page never opens anything else. */
export function normalizeGroupUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (host !== "facebook.com" && !host.endsWith(".facebook.com") && host !== "fb.com") {
    return null;
  }
  url.protocol = "https:";
  return url.toString();
}
