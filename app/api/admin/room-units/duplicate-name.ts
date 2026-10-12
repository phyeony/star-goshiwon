import { NextResponse } from "next/server";

export function duplicateNameResponse(name: string) {
  return NextResponse.json(
    { error: `이미 등록된 객실 번호입니다: ${name.trim()}` },
    { status: 409 }
  );
}

/** Postgres unique_violation — the `room_units_name_unique` index caught a race. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}
