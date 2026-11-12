import { describe, expect, it } from "vitest";
import { photoDownloadName, photoDownloadUrl, uniqueNames } from "./photo-download";

const r2 = {
  source: "r2" as const,
  path: "photos/2f1c0000-0000-4000-8000-000000000000",
  ext: "webp" as const,
  original_filename: "IMG_1234.HEIC",
  caption_ko: "",
  caption_en: "",
};

describe("photoDownloadUrl", () => {
  it("uses the same-origin /media route for the largest upload", () => {
    expect(photoDownloadUrl(r2)).toBe("/media/photos/2f1c0000-0000-4000-8000-000000000000-1600.webp");
  });
  it("uses the original file for static photos", () => {
    expect(photoDownloadUrl({ source: "static", path: "/images/common/laundry.png", ext: null })).toBe(
      "/images/common/laundry.png"
    );
  });
});

describe("photoDownloadName", () => {
  it("prefers the Korean caption and adds the room number", () => {
    expect(photoDownloadName({ ...r2, caption_ko: "책상/선반" }, "301")).toBe("301호 책상 선반.webp");
  });
  it("falls back to the original file name, with the stored extension", () => {
    expect(photoDownloadName(r2)).toBe("IMG_1234.webp");
  });
  it("uses the static file's own extension", () => {
    expect(
      photoDownloadName({ ...r2, source: "static", path: "/images/common/laundry.png", ext: null, original_filename: null })
    ).toBe("laundry.png");
  });
});

describe("uniqueNames", () => {
  it("numbers duplicates", () => {
    expect(uniqueNames(["a.jpg", "A.jpg", "b.jpg", "a.jpg"])).toEqual(["a.jpg", "A (2).jpg", "b.jpg", "a (3).jpg"]);
  });
});
