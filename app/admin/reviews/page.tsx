import {
  getReviewInvites,
  getReviews,
  reviewInviteUrl,
} from "@/lib/review-queries";
import { getRooms } from "@/lib/queries";
import { ReviewAdmin } from "@/components/admin/review-admin";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, invites, rooms] = await Promise.all([
    getReviews(),
    getReviewInvites(),
    getRooms(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">후기 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        후기 초대 링크를 만들어 보내고, 제출된 후기를 승인하면 사이트에
        게시됩니다.
      </p>
      <div className="mt-6">
        <ReviewAdmin
          reviews={reviews}
          invites={invites.map((invite) => ({
            ...invite,
            url: reviewInviteUrl(invite.token),
          }))}
          roomTypeNames={rooms.map((room) => room.name)}
        />
      </div>
    </div>
  );
}
