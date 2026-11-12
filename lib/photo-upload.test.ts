import { describe, it, expect } from "vitest";
import { hasImageSignature, parsePhotoUpload } from "./photo-upload";
import { PHOTO_WIDTHS } from "./site-photos";

const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

function form(overrides: Record<string, string | Blob | null> = {}, bytes = WEBP) {
  const f = new FormData();
  const base: Record<string, string | Blob | null> = {
    ext: "webp",
    width: "4032",
    height: "3024",
    caption_en: "  Shared Kitchen  ",
    caption_ko: "공용 주방",
    original_filename: "IMG_0001.jpg",
  };
  for (const w of PHOTO_WIDTHS) base[`w${w}`] = new Blob([bytes], { type: "image/webp" });
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (v !== null) f.set(k, v);
  }
  return f;
}

describe("hasImageSignature", () => {
  it("recognises webp and jpeg headers", () => {
    expect(hasImageSignature(WEBP, "webp")).toBe(true);
    expect(hasImageSignature(JPEG, "jpg")).toBe(true);
    expect(hasImageSignature(JPEG, "webp")).toBe(false);
    expect(hasImageSignature(new TextEncoder().encode("<svg onload=…>"), "jpg")).toBe(false);
  });
});

describe("parsePhotoUpload", () => {
  it("accepts a complete upload and trims captions", async () => {
    const result = await parsePhotoUpload(form());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.caption_en).toBe("Shared Kitchen");
    expect(result.value.caption_ko).toBe("공용 주방");
    expect(result.value.variants.map((v) => v.width)).toEqual([...PHOTO_WIDTHS]);
    expect(result.value).toMatchObject({ ext: "webp", width: 4032, height: 3024 });
  });

  it("rejects a missing size version", async () => {
    expect(await parsePhotoUpload(form({ w960: null }))).toEqual({ ok: false, error: "missing_variant_960" });
  });

  it("rejects files that aren't the format they claim", async () => {
    expect(await parsePhotoUpload(form({}, JPEG))).toEqual({ ok: false, error: "invalid_image" });
  });

  it("takes an optional room number", async () => {
    const none = await parsePhotoUpload(form());
    expect(none.ok && none.value.room_unit_id).toBe(null);
    const tagged = await parsePhotoUpload(form({ room_unit_id: "5729d8c6-665b-4a54-a586-408f18e90db8" }));
    expect(tagged.ok && tagged.value.room_unit_id).toBe("5729d8c6-665b-4a54-a586-408f18e90db8");
    expect(await parsePhotoUpload(form({ room_unit_id: "402" }))).toEqual({ ok: false, error: "invalid_room_unit" });
  });

  it("rejects unknown formats and bad sizes", async () => {
    expect(await parsePhotoUpload(form({ ext: "png" }))).toEqual({ ok: false, error: "invalid_format" });
    expect(await parsePhotoUpload(form({ width: "0" }))).toEqual({ ok: false, error: "invalid_size" });
  });
});
