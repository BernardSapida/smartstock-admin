# Comment #5 - Web and Mobile Full Integration (Synchronization)

> **Objective:** Both platforms stay fully synchronized. Fix sync issues between
> web and mobile. Updates made on one platform must be immediately reflected on
> the other.

**Setup:** put the Web Admin and the mobile app **side by side** and do NOT press
refresh during these tests. Firestore pushes changes live (`onSnapshot`), so a
change on one side should appear on the other within ~1 second.

---

## Test 5.1 - Inventory syncs both ways

1. Web Admin → Inventory → add **2 kg** to Sugar.

✅ The mobile Inventory screen updates Sugar's on-hand **without refresh**.

2. On the phone → change a batch quantity.

✅ The web Inventory number updates live.

---

## Test 5.2 - Inspections sync (the specific issue the client raised)

The client noted: an inspection created on the web did **not** show on mobile.

1. Web Admin → Inspections → **Assign inspection** to the staff user.

✅ The mobile **Assigned** tab shows it within ~1 second, no refresh.

2. On the phone, complete that inspection.

✅ The web Inspections table flips it to **Completed** live.

---

## Test 5.3 - Notifications sync to STAFF (the main fix)

The client noted the mobile notification data was static. Root cause: every
notification was addressed to `admin` only, and the mobile app had no concept of
an `all` broadcast - so the staff notification screen was **permanently empty**,
not frozen.

1. Cause a stock alert: drop a product below its minimum threshold, OR add a
   batch that expires within 7 days.
2. On the **phone** (staff) → **Notifications** screen.

✅ A **low-stock / out-of-stock / expiring** notification appears for staff.
⚠️ Old behavior: staff notifications were always empty (alerts went to admin
   only).

3. Assign an inspection from the web (Test 5.2).

✅ Staff also receives a **"New inspection assigned"** notification.

4. On the phone, tap **Mark all as read**.

✅ They clear and **stay** cleared (don't bounce back on refresh).

---

## Test 5.4 - Recipes and preparations sync

1. Web Admin → create a recipe.

✅ It appears in the mobile Recipes list live.

2. Prepare a recipe on the phone.

✅ Web Inventory reflects the deducted stock, and the web Production report gains
   the record.

---

## Test 5.5 - Disposal syncs

1. On the phone, dispose part of a batch after an inspection (file 04).

✅ Web Inventory shows the reduced quantity live, and the disposal shows in the
   web audit log / inventory history.

---

## Why this works (for the defense)

Firestore is **real-time by default** - `onSnapshot` is a live push over a
websocket, not polling. No extra service or refresh button is involved. The
earlier "static" behavior was **empty result sets** caused by mismatched fields,
not a missing live connection:

- Mobile's notification-target type didn't include `all`, and all alerts targeted
  `admin`, so staff listened to an inbox that could never fill.
- One inspection-assignment write used the wrong field name (`read` instead of
  `isRead`), so it never matched the reader's query.

Both are fixed, so the live sync that was always there now actually has data
flowing through it.

---

## Pass criteria

- [ ] Inventory change on one platform appears on the other without refresh
- [ ] Web-assigned inspection appears on mobile live
- [ ] Completing an inspection on mobile updates the web live
- [ ] Staff receive stock/expiry notifications on mobile (no longer empty)
- [ ] Mark-all-read clears and stays cleared
- [ ] Recipe create + prepare + disposal all propagate across platforms
