import { RoomForm } from "@/components/admin/room-form";

export default function NewRoomPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        Add Room
      </h1>
      <RoomForm />
    </div>
  );
}
