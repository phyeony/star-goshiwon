# Admin Room Availability Calendar

## Summary

Build an admin-only availability system based on **physical room units**, not just public room types. Each booking request must be matched to an available physical room before admin can approve/send the PayPal payment link.

Guests can still submit requests from the public site even if inventory is full. Availability is used internally so the admin can decide whether to approve or reject requests, including requests that overlap with bookings from other platforms.

## Key Changes

- Add physical room inventory:
  - `room_units`: physical rooms belonging to existing public room types.
  - `room_unit_blocks`: date ranges that reserve or block a physical room.
  - `booking_requests.assigned_room_unit_id`: selected physical room for direct platform requests.
- Keep existing `rooms` as public room types:
  - Economy Room.
  - Room with Private Shower.
  - Room with Private Shower and Toilet.
- Add admin physical room management:
  - Admin creates, renames, deactivates, and sorts physical rooms under each room type.
  - Do not hardcode or seed guessed room names.
- Add an admin availability page:
  - Filter by room type and date range.
  - Show a compact room-by-date view.
  - Show blocks from direct booking requests and external platforms.
  - Allow admin to add, edit, and delete manual external blocks.
- Update request approval flow:
  - On booking request detail, show available physical rooms for the requested room type and stay dates.
  - Require admin to select an available physical room before approval/payment-link sending.
  - Approval creates or updates a tentative block for that physical room.
  - Successful payment marks the block confirmed.
  - Declined, expired, or closed unpaid requests release or cancel their platform-created block.

## Data Rules

- A room unit is unavailable when an active block overlaps the requested stay:
  - `block.check_in_date < request.check_out_date`
  - `block.check_out_date > request.check_in_date`
- Check-out dates are exclusive, so same-day checkout/check-in is allowed.
- Manual external blocks use `source = "external"` and do not require a booking request.
- Platform-created blocks use `source = "direct"` and may reference `booking_request_id`.
- Public room type availability remains unchanged in this phase.

## Test Plan

- Unit-test date overlap availability logic, including same-day turnover.
- Test available unit lookup by room type/date range.
- Test inactive or cancelled blocks do not make a room unavailable.
- Test approval/payment-link sending fails without `assigned_room_unit_id`.
- Test manual external block create, update, and delete APIs.
- Test admin flow:
  - create physical room units,
  - add an external block,
  - open a booking request,
  - see unavailable and available units,
  - assign an available unit,
  - approve and send payment link.
- Regression-test existing request submission and PayPal confirmation flow.

## Assumptions

- This is admin-only for now; no guest-facing availability search.
- External platform bookings are entered manually.
- Admin creates the initial physical rooms.
- Availability is checked per physical room, while pricing and public content stay per room type.
