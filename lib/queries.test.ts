import { describe, expect, it } from "vitest";
import { shouldReleaseAssignmentForCancelledBlock } from "./queries";
import type { RoomUnitBlock } from "./types";

function block(overrides: Partial<RoomUnitBlock> = {}): RoomUnitBlock {
  return {
    id: "block-1",
    room_unit_id: "unit-1",
    booking_request_id: "req-1",
    source: "direct",
    status: "cancelled",
    guest_name: "Guest",
    check_in_date: "2026-09-01",
    check_out_date: "2026-09-08",
    notes: "",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("shouldReleaseAssignmentForCancelledBlock", () => {
  it("releases the assignment when a direct block for the assigned unit is cancelled", () => {
    expect(
      shouldReleaseAssignmentForCancelledBlock(block(), {
        assigned_room_unit_id: "unit-1",
      })
    ).toBe(true);
  });

  it("ignores external blocks, which never belong to a booking request", () => {
    expect(
      shouldReleaseAssignmentForCancelledBlock(
        block({ source: "external", booking_request_id: null }),
        { assigned_room_unit_id: "unit-1" }
      )
    ).toBe(false);
  });

  it("ignores direct blocks with no linked booking request", () => {
    expect(
      shouldReleaseAssignmentForCancelledBlock(
        block({ booking_request_id: null }),
        { assigned_room_unit_id: "unit-1" }
      )
    ).toBe(false);
  });

  it("keeps a newer assignment when the request was already moved to another unit", () => {
    expect(
      shouldReleaseAssignmentForCancelledBlock(block(), {
        assigned_room_unit_id: "unit-2",
      })
    ).toBe(false);
  });

  it("is a no-op when the request has no assignment left", () => {
    expect(
      shouldReleaseAssignmentForCancelledBlock(block(), {
        assigned_room_unit_id: null,
      })
    ).toBe(false);
  });

  it("is a no-op when the booking request is missing", () => {
    expect(shouldReleaseAssignmentForCancelledBlock(block(), null)).toBe(false);
  });
});
