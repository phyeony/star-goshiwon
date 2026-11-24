import { listFacebookGroups, listFacebookPostLog, listFacebookPosts } from "@/lib/facebook-queries";
import { listSitePhotos } from "@/lib/photo-queries";
import { getPhotosBaseUrl } from "@/lib/photo-storage";
import { photoDownloadName, photoDownloadUrl } from "@/lib/photo-download";
import { photoSrc } from "@/lib/site-photos";
import { getOptimizedImageSrc } from "@/lib/optimized-images";
import { FacebookAdmin, type FbPhoto } from "@/components/admin/facebook-admin";

export const dynamic = "force-dynamic";

export default async function AdminFacebookPage() {
  const [groups, posts, log, photos] = await Promise.all([
    listFacebookGroups(),
    listFacebookPosts(),
    listFacebookPostLog(),
    listSitePhotos(),
  ]);
  const base = getPhotosBaseUrl();
  const library: FbPhoto[] = photos.map((p) => ({
    id: p.id,
    caption: p.caption_ko || p.caption_en || p.original_filename || "",
    thumb: getOptimizedImageSrc(photoSrc(p, base), 384),
    full: photoDownloadUrl(p),
    fileName: photoDownloadName(p),
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">페이스북 그룹 홍보</h1>
      <p className="mt-1 text-sm text-gray-500">
        그룹 열기 → 글 복사해서 붙여넣기 → 사진 붙여넣기(또는 저장 후 첨부) → 게시한 뒤 &lsquo;게시함&rsquo; 누르기.
        한 주는 월요일에 시작합니다 (한국 시간).
      </p>
      <div className="mt-6">
        <FacebookAdmin groups={groups} posts={posts} log={log} photos={library} />
      </div>
    </div>
  );
}
