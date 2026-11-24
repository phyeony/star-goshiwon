import { describe, expect, it } from "vitest";
import {
  groupStatuses,
  kstDaysBetween,
  normalizeGroupUrl,
  suggestPost,
  weekStartKst,
  type FacebookGroup,
  type FacebookPost,
  type FacebookPostLogEntry,
} from "./facebook-posts";

const post = (id: string, sort_order: number): FacebookPost => ({
  id, title: id, body: "", photo_ids: [], sort_order, created_at: "2026-11-01T00:00:00Z",
});
const group = (id: string): FacebookGroup => ({
  id, name: id, url: "https://www.facebook.com/groups/x", notes: "", sort_order: 0, created_at: "2026-11-01T00:00:00Z",
});
const log = (group_id: string, post_id: string, posted_at: string): FacebookPostLogEntry => ({
  id: `${group_id}-${post_id}-${posted_at}`, group_id, post_id, posted_at,
});

describe("weekStartKst", () => {
  it("is Monday 00:00 Korea time", () => {
    // Tuesday 2026-11-24 16:55 KST
    expect(weekStartKst(new Date("2026-11-24T07:55:00Z")).toISOString()).toBe("2026-11-22T15:00:00.000Z");
  });
  it("treats Sunday night KST as the same week", () => {
    expect(weekStartKst(new Date("2026-11-29T14:59:00Z")).toISOString()).toBe("2026-11-22T15:00:00.000Z");
  });
  it("starts a new week at Monday 00:00 KST", () => {
    expect(weekStartKst(new Date("2026-11-29T15:00:00Z")).toISOString()).toBe("2026-11-29T15:00:00.000Z");
  });
});

describe("kstDaysBetween", () => {
  it("counts Korea-time calendar days", () => {
    expect(kstDaysBetween("2026-11-23T14:59:00Z", new Date("2026-11-23T15:01:00Z"))).toBe(1);
  });
});

describe("suggestPost", () => {
  const posts = [post("a", 1), post("b", 2), post("c", 3)];
  it("picks the first post never used in the group", () => {
    expect(suggestPost(posts, [log("g", "a", "2026-11-01T00:00:00Z")])).toBe("b");
  });
  it("picks the least recently used when all were used", () => {
    expect(
      suggestPost(posts, [
        log("g", "a", "2026-11-10T00:00:00Z"),
        log("g", "b", "2026-11-03T00:00:00Z"),
        log("g", "c", "2026-11-17T00:00:00Z"),
      ])
    ).toBe("b");
  });
  it("returns null with no posts", () => {
    expect(suggestPost([], [])).toBeNull();
  });
});

describe("groupStatuses", () => {
  it("marks groups posted since Monday", () => {
    const now = new Date("2026-11-24T07:55:00Z");
    const [g1, g2] = groupStatuses(
      [group("g1"), group("g2")],
      [post("a", 1)],
      [log("g1", "a", "2026-11-23T01:00:00Z"), log("g2", "a", "2026-11-21T01:00:00Z")],
      now
    );
    expect(g1.postedThisWeek).toBe(true);
    expect(g2.postedThisWeek).toBe(false);
    expect(g2.last?.posted_at).toBe("2026-11-21T01:00:00Z");
  });
});

describe("normalizeGroupUrl", () => {
  it("accepts facebook group links", () => {
    expect(normalizeGroupUrl(" https://www.facebook.com/groups/123 ")).toBe("https://www.facebook.com/groups/123");
    expect(normalizeGroupUrl("http://m.facebook.com/groups/abc")).toBe("https://m.facebook.com/groups/abc");
  });
  it("rejects other sites and schemes", () => {
    expect(normalizeGroupUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeGroupUrl("https://evilfacebook.com/groups/1")).toBeNull();
    expect(normalizeGroupUrl("not a url")).toBeNull();
  });
});
