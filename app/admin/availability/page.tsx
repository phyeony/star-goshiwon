import { AvailabilityManager } from "@/components/admin/availability-manager";
import {
  getRoomUnitBlocks,
  getRoomUnitsWithRoom,
  getRooms,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{
    room_id?: string;
    room_unit_id?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { room_id: roomId, room_unit_id: roomUnitId, from, to } =
    await searchParams;
  const [rooms, units, blocks] = await Promise.all([
    getRooms(),
    getRoomUnitsWithRoom(),
    getRoomUnitBlocks(),
  ]);

  return (
    <AvailabilityManager
      rooms={rooms}
      units={units}
      blocks={blocks}
      initialRoomId={roomId}
      initialRoomUnitId={roomUnitId}
      initialFrom={from}
      initialTo={to}
    />
  );
}
