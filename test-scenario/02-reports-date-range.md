# Comment #2 - Reports Module: Date Range Filter

> **Objective:** Generate reports within a selected date range. Add Start Date
> and End Date filters. Display only records within the period. Apply to all
> report types **where applicable**.
>
> Example: Reports from July 1, 2026 to July 13, 2026.

All on **Web Admin → Reports**.

---

## Test 2.1 - Which tabs have a date filter

Open Reports and click through the four tabs.

| Tab | Expected |
|-----|----------|
| **Restock** | **No** date picker. A note: reflects *current* stock. |
| **Can Cook** | **No** date picker. Same note. |
| **Production** | Date picker labeled **"Prepared between"** |
| **Expiry** | Date picker labeled **"Expiring between"** |

✅ Production and Expiry show the picker; Restock and Can Cook show the
explanatory note instead.

> Why Restock/Can-Cook have no range: they are computed from *current* stock
> levels. The system stores no historical snapshot of past stock, so
> "restock report for July 1–5" cannot be answered from existing data. The
> client approved this scope, and the panel's own wording was "where applicable."

---

## Test 2.2 - Production date range actually filters

Prerequisite: prepare at least one recipe **today** (see file 01) so there is a
production record dated today.

1. Reports → **Production** tab.
2. Set the range to **Jul 1, 2026 – Jul 13, 2026** (or a range that includes
   today).

✅ Today's preparation appears in the table.

3. Now set the range to a window in the past that excludes today (e.g.
   **Jun 1 – Jun 5**).

✅ The row **disappears** - only in-range records show.

4. Click **Clear**.

✅ All records return.

---

## Test 2.3 - Expiry date range filters

1. Make sure a batch exists with an expiry date (add a Sugar batch with an
   expiration a few days out).
2. Reports → **Expiry** tab.
3. Set the range to include that expiry date.

✅ The batch appears.

4. Set a range that excludes it.

✅ It disappears.

---

## Test 2.4 - CSV export respects the range

1. On the **Production** tab with a date range applied (e.g. Jul 1–13).
2. Click **Export CSV**.
3. Open the downloaded file.

✅ It contains **only** the rows visible under the current filter - not the
whole history.

---

## Test 2.5 - Presets and clear

On Production or Expiry, try the preset buttons:

- **Today** · **Last 7 days** · **Last 30 days** · **This month**

✅ Each sets the range and the table updates.
✅ **Clear** removes the range (back to all records).

---

## Pass criteria

- [ ] Production and Expiry have a date range; Restock and Can Cook do not (with
      a note explaining why)
- [ ] Setting a range on Production hides out-of-range preparations
- [ ] Setting a range on Expiry hides out-of-range batches
- [ ] CSV export matches the filtered rows
- [ ] Presets and Clear work
