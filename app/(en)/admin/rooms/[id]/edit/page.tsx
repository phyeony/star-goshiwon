import { notFound } from "next/navigation";
import { getRoomById } from "@/lib/queries";
import { RoomForm } from "@/components/admin/room-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRoomPage({ params }: Props) {
  const { id } = await params;
  const room = await getRoomById(id);
  if (!room) notFound();

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        객실 수정: {room.name}
      </h1>
      <RoomForm room={room} />
    </div>
  );
}
