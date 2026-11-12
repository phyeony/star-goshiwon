import { describe, it, expect } from "vitest";
import {
  isServablePhotoKey,
  parseSectionKey,
  photoSrc,
  r2VariantKeys,
  resizedDimensions,
  sectionKey,
} from "./site-photos";
import { getOptimizedImageSrc, getOptimizedImageSrcSet } from "./optimized-images";

const ID = "2f1c0d3e-8a4b-4c5d-9e6f-0a1b2c3d4e5f";

describe("photoSrc", () => {
  it("keeps static photos at their /public path", () => {
    expect(photoSrc({ source: "static", path: "/images/economy/1.main.jpg", ext: null })).toBe(
      "/images/economy/1.main.jpg"
    );
  });

  it("points uploads at the largest version under the media base", () => {
    expect(photoSrc({ source: "r2", path: `photos/${ID}`, ext: "webp" })).toBe(
      `/media/photos/${ID}-1600.webp`
    );
    expect(
      photoSrc({ source: "r2", path: `photos/${ID}`, ext: "jpg" }, "https://photos.goshiwonseoul.com/")
    ).toBe(`https://photos.goshiwonseoul.com/photos/${ID}-1600.jpg`);
  });
});

describe("getOptimizedImageSrc", () => {
  it("still maps static photos to /images/optimized webp files", () => {
    expect(getOptimizedImageSrc("/images/economy/1.main.jpg", 640)).toBe(
      "/images/optimized/economy/1.main-640.webp"
    );
  });

  it("maps uploads to the same photo at another width, keeping the format", () => {
    expect(getOptimizedImageSrc(`/media/photos/${ID}-1600.jpg`, 384)).toBe(`/media/photos/${ID}-384.jpg`);
    expect(getOptimizedImageSrcSet(`https://photos.example.com/photos/${ID}-1600.webp`)).toContain(
      `https://photos.example.com/photos/${ID}-960.webp 960w`
    );
  });

  it("leaves other URLs alone", () => {
    expect(getOptimizedImageSrc("https://images.unsplash.com/x.jpg", 640)).toBe("https://images.unsplash.com/x.jpg");
  });
});

describe("isServablePhotoKey", () => {
  it("accepts only upload variant keys", () => {
    expect(isServablePhotoKey(`photos/${ID}-640.webp`)).toBe(true);
    expect(isServablePhotoKey(`photos/${ID}-1600.jpg`)).toBe(true);
    expect(isServablePhotoKey(`photos/${ID}.webp`)).toBe(false);
    expect(isServablePhotoKey(`../secrets/${ID}-640.webp`)).toBe(false);
    expect(isServablePhotoKey(`photos/${ID}-640.png`)).toBe(false);
  });
});

describe("r2VariantKeys", () => {
  it("lists every stored width", () => {
    expect(r2VariantKeys(`photos/${ID}`, "webp")).toEqual(
      [384, 640, 960, 1280, 1600].map((w) => `photos/${ID}-${w}.webp`)
    );
  });
});

describe("resizedDimensions", () => {
  it("scales down keeping the aspect ratio", () => {
    expect(resizedDimensions(4032, 3024, 640)).toEqual({ width: 640, height: 480 });
  });

  it("never enlarges a small photo", () => {
    expect(resizedDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe("section keys", () => {
  it("round-trips room and shared sections", () => {
    expect(parseSectionKey(sectionKey("shared", null))).toEqual({ section: "shared", roomId: null });
    expect(parseSectionKey(sectionKey("room", ID))).toEqual({ section: "room", roomId: ID });
  });

  it("rejects anything else", () => {
    expect(parseSectionKey("room:not-a-uuid")).toBeNull();
    expect(parseSectionKey("hero")).toBeNull();
  });
});
