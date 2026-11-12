import { getSupabaseServiceClient } from "./supabase";
import { getPhotosBaseUrl } from "./photo-storage";
import {
  FALLBACK_SHARED_PHOTOS,
  photoSrc,
  type DisplayPhoto,
  type PhotoExt,
  type PhotoSectionKind,
  type SitePhoto,
  type SitePhotoPlacement,
} from "./site-photos";
import type { RoomImage } from "./types";

// ─── Library ───

export async function listSitePhotos(): Promise<SitePhoto[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("site_photos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as SitePhoto[]) ?? [];
}

export async function listPhotoPlacements(): Promise<SitePhotoPlacement[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("site_photo_placements")
    .select("id, section, room_id, photo_id, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as SitePhotoPlacement[]) ?? [];
}

export async function getSitePhoto(id: string): Promise<SitePhoto | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("site_photos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as SitePhoto | null) ?? null;
}

export async function insertUploadedPhoto(input: {
  id: string;
  path: string;
  ext: PhotoExt;
  width: number;
  height: number;
  caption_en: string;
  caption_ko: string;
  original_filename: string | null;
  room_unit_id: string | null;
}): Promise<SitePhoto> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("site_photos")
    .insert({ ...input, source: "r2" })
    .select()
    .single();
  if (error) throw error;
  return data as SitePhoto;
}

export type SitePhotoPatch = Partial<
  Pick<SitePhoto, "caption_en" | "caption_ko" | "room_unit_id">
>;

export async function updateSitePhoto(
  id: string,
  patch: SitePhotoPatch
): Promise<SitePhoto | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("site_photos")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return (data as SitePhoto | null) ?? null;
}

/** Deletes the row (and, by cascade, its placements). */
export async function deleteSitePhotoRow(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("site_photos").delete().eq("id", id);
  if (error) throw error;
}

/** Replaces a section's photos, in order, in one transaction. */
export async function setPhotoSection(
  section: PhotoSectionKind,
  roomId: string | null,
  photoIds: string[]
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.rpc("set_photo_section", {
    p_section: section,
    p_room_id: roomId,
    p_photo_ids: photoIds,
  });
  if (error) throw error;
}

// ─── Public pages ───

type PlacementWithPhoto = {
  id: string;
  room_id: string | null;
  sort_order: number;
  created_at: string;
  site_photos: SitePhoto | null;
};

/** The select fragment that embeds a room's gallery on a rooms query. */
export const ROOM_PHOTOS_SELECT =
  "site_photo_placements(id, room_id, sort_order, created_at, site_photos(*))";

/** Turns embedded placements into the RoomImage list the room pages use. */
export function placementsToRoomImages(
  placements: PlacementWithPhoto[] | null | undefined,
  base: string = getPhotosBaseUrl()
): RoomImage[] {
  return (placements ?? [])
    .filter((p): p is PlacementWithPhoto & { site_photos: SitePhoto } => Boolean(p.site_photos))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      id: p.id,
      room_id: p.room_id ?? "",
      url: photoSrc(p.site_photos, base),
      alt: p.site_photos.caption_en,
      alt_ko: p.site_photos.caption_ko,
      sort_order: p.sort_order,
      created_at: p.created_at,
    }));
}

/** Shared-spaces photos for the home pages (English and /ko). Falls back to
 * the original hard-coded set when the database can't be reached, so a local
 * preview without credentials still renders. */
export async function getSharedSpacePhotos(): Promise<DisplayPhoto[]> {
  let supabase;
  try {
    supabase = getSupabaseServiceClient();
  } catch {
    return FALLBACK_SHARED_PHOTOS;
  }
  const { data, error } = await supabase
    .from("site_photo_placements")
    .select("sort_order, site_photos(*)")
    .eq("section", "shared")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getSharedSpacePhotos error:", error);
    return FALLBACK_SHARED_PHOTOS;
  }
  const base = getPhotosBaseUrl();
  return ((data ?? []) as unknown as { site_photos: SitePhoto | null }[])
    .map((row) => row.site_photos)
    .filter((photo): photo is SitePhoto => Boolean(photo))
    .map((photo) => ({
      id: photo.id,
      src: photoSrc(photo, base),
      caption_en: photo.caption_en,
      caption_ko: photo.caption_ko,
    }));
}
