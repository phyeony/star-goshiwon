import { RoomForm } from "@/components/admin/room-form";

export default function NewRoomPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        객실 추가
      </h1>
      <RoomForm />
    </div>
  );
}
