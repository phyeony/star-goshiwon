import { describe, it, expect } from "vitest";
import { placementsToRoomImages } from "./photo-queries";
import type { SitePhoto } from "./site-photos";

const ID = "2f1c0d3e-8a4b-4c5d-9e6f-0a1b2c3d4e5f";

function photo(over: Partial<SitePhoto>): SitePhoto {
  return {
    id: "p",
    source: "static",
    path: "/images/economy/1.main.jpg",
    ext: null,
    width: null,
    height: null,
    caption_en: "Desk",
    caption_ko: "책상",
    original_filename: null,
    created_at: "",
    ...over,
  };
}

describe("placementsToRoomImages", () => {
  it("orders the gallery and carries both captions", () => {
    const images = placementsToRoomImages(
      [
        { id: "b", room_id: "r", sort_order: 2, created_at: "", site_photos: photo({ source: "r2", path: `photos/${ID}`, ext: "jpg" }) },
        { id: "a", room_id: "r", sort_order: 1, created_at: "", site_photos: photo({}) },
        { id: "c", room_id: "r", sort_order: 3, created_at: "", site_photos: null },
      ],
      "/media"
    );
    expect(images.map((i) => i.url)).toEqual([
      "/images/economy/1.main.jpg",
      `/media/photos/${ID}-1600.jpg`,
    ]);
    expect(images[0]).toMatchObject({ alt: "Desk", alt_ko: "책상", sort_order: 1 });
  });

  it("handles a room with no photos", () => {
    expect(placementsToRoomImages(undefined, "/media")).toEqual([]);
  });
});
