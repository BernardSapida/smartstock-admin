# Comment #3 - Audit Logs: Date Range Filter

> **Objective:** Filter audit records by date. Add Start/End filters. Display
> only logs in the range. Apply to: User actions, Inventory updates, Recipe
> modifications, Other recorded system activities.

All on **Web Admin → Audit Logs**, except where it says to act on the phone.

---

## Test 3.1 - Mobile actions now reach the log (the underlying fix)

Before this work, the mobile app wrote **no** audit entries - so everything
staff did on the phone was invisible. Verify that is fixed first.

1. On the **phone** (staff), add a batch to any product (e.g. +2 kg Sugar).
2. On **Web Admin → Audit Logs**.

✅ A new row appears, e.g. **"Added 2 kg to Sugar"**, User = the staff member,
   Module = **Inventory**, within a second or two.
⚠️ Old behavior: nothing from the phone ever appeared.

3. On the phone, create or edit a recipe.

✅ A **Recipes** row appears (CREATE / UPDATE).

---

## Test 3.2 - Module filter (the panel's four categories)

The module chips map exactly to the panel's bullets:

| Panel wording | Module chip |
|---------------|-------------|
| User actions | **Auth**, **Users** |
| Inventory updates | **Inventory** |
| Recipe modifications | **Recipes** |
| Other system activities | **Inspections**, **Expiry** |

1. Click the **Inventory** chip.

✅ Only inventory rows show.

2. Click **Recipes**, then **All modules**.

✅ Filters accordingly; "All modules" shows everything.

---

## Test 3.3 - Date range filter

1. Set the range to **Jul 1, 2026 – Jul 13, 2026**.

✅ Only entries whose timestamp falls in that range show.
✅ The header reads e.g. "N events from Jul 1, 2026 to Jul 13, 2026".

2. Set a range with no activity (e.g. a future week).

✅ Table shows **"No audit logs in this date range."** (not a generic empty).

3. **Clear** the range.

✅ Returns to most-recent events.

---

## Test 3.4 - Date + module + search combine

1. Set a date range that has data.
2. Click the **Inventory** chip.
3. Type part of a product name in the search box.

✅ The three filters stack (date AND module AND text).

---

## Test 3.5 - Logout is recorded (timing-sensitive)

1. On the phone, **log out**.
2. Web Audit Logs.

✅ An **Auth / LOGOUT** row for that staff member appears.
⚠️ If missing: the logout write must land *before* Firebase signs out. Report it.

---

## If the table won't load / console shows an index error

The date range uses `where` + `orderBy` on the **same** field (`timestamp`),
which needs no composite index. But if Firestore prints an error with a link,
click the link once to create the index, wait ~1 min, and retry. Report it if
it happens.

---

## Pass criteria

- [ ] Actions done on the **phone** now appear in the web audit log
- [ ] Module chips filter (Inventory / Recipes / Auth / Inspections / …)
- [ ] Date range shows only in-range entries; header states the range
- [ ] Empty range shows the range-specific empty message
- [ ] Date + module + search combine
- [ ] Logout produces an Auth row
