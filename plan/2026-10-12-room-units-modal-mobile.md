# 객실 번호 page: add button, modal form, mobile layout

## Context
`/admin/room-units` puts the create/edit form in a side column. On mobile the form sits below the whole list, so 수정 changes nothing on screen until the user scrolls down. There's also no visible 등록 entry point above the list, and the 6-column table forces horizontal scrolling on a phone.

Decision (from the user): **modal everywhere**. Remove the side panel, give the list the full width, and have 등록 and 수정 open the same popup on every screen size. Because the popup appears wherever the user is, the "scroll to the form" problem goes away.

## Approach

### 1. Open the modal from the URL
Keep the existing URL-param pattern so links still work and the `key` fix (4dc9ca8) still applies:
- `?new=1` opens the create modal.
- `?edit=<id>` opens the edit modal.
- No param means no modal.

Every link uses `scroll={false}` so the list keeps its scroll position when the modal opens or closes.

### 2. `components/admin/admin-modal.tsx`: reuse it, with small additions
- Add an optional `size?: "md" | "xl"` prop. `md` maps to `max-w-lg` for small forms; the default stays `xl` (`max-w-5xl`), so the email composer and document issuing are unchanged.
- Close on Escape with a `useEffect` keydown listener. This also benefits the existing users.

### 3. `components/admin/room-unit-form.tsx`
- Export a new client wrapper, `RoomUnitFormModal({ rooms, roomUnit })`. It renders `<AdminModal size="md" title={roomUnit ? "객실 번호 수정" : "객실 번호 등록"} onClose={close}>`, where `close` is `router.push("/admin/room-units", { scroll: false })`.
- `RoomUnitForm` gets an `onClose` prop, and 취소 shows in both create and edit mode.
- Drop the form's own card chrome (border, shadow, `h-fit`) and its `<h2>`, because the modal provides them. Keep the description line.
- Add `autoFocus` on the 객실 번호 input in create mode only, so editing doesn't pop up the mobile keyboard.
- Leave the save, 비활성화 and error logic unchanged. The 409 duplicate message already renders in the form's red box.

### 4. `app/admin/room-units/page.tsx`
- Add `new?: string` to `searchParams`.
- Render `<RoomUnitFormModal key={editingUnit?.id ?? "new"} …/>` only when `?new` or a valid `?edit` is present. Remove the two-column grid so the list is full width.
- In the list header, put "객실 목록" on the left and a primary `+ 객실 번호 등록` link (`?new=1`) on the right. Add the same button to the empty state.
- Make the count chips wrap with `flex-wrap`.
- **Mobile list:** below `md`, show cards (`md:hidden`). Each card has:
  - the room number in large type, with the status badge on the right
  - the room type name
  - the whole card as a tappable link to `?edit=<id>`

  Per the user, the mobile cards show **no 정렬 and no 메모**; both stay editable inside the modal. At `md` and up, the existing table with all its columns stays (`hidden md:block`). Reuse `STATUS_LABELS` and `STATUS_CLASSES` for both.

## Verification
1. `pnpm exec tsc --noEmit` and `pnpm test`.
2. `pnpm dev`. The user logs in from my Chrome tab (I can't sign in for them).
3. **Mobile:** resize the window to about 390×844 and check that:
   - the cards are readable with no horizontal scroll, and show no 정렬 or 메모
   - tapping a card opens the modal right away with the correct values
   - × and the backdrop both close it
   - 비활성화 saves (PUT 200) and the modal closes
   - adding a duplicate "401" shows the 409 message inside the modal
4. **Desktop:** check the full-width table, that 등록 and 수정 open the modal, that Escape closes it, and that the scroll position is kept.
5. Restore any dev data I change, and stop the dev server afterwards.
