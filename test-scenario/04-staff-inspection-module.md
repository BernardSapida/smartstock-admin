# Comment #4 - Staff Mobile: Inspection Module

> **Objective:** Complete inspection functionality on mobile. Staff can: view
> assigned inspections, perform inspections, record results, submit reports.
> If an item is Expired or Damaged, allow it to be disposed of / removed from
> inventory after the inspection, recording the disposal in inventory history.

Needs both apps open. Prerequisite: **Sugar** with a **5 kg** batch (file 00).

---

## Test 4.1 - Assign an inspection (Web Admin)

1. Web Admin → **Inspections** → **Assign inspection**.
2. Item = **Sugar**, Batch = the 5 kg batch, Assign to = your **staff** user,
   Due date = today.
3. Assign.

✅ A pending row appears in the web Inspections table (status **Pending**).

---

## Test 4.2 - View assigned inspection (Mobile)

1. On the **phone** (staff): **Inspections** → **Assigned** tab.

✅ The Sugar inspection appears **without refreshing** (see file 05 for the sync
   angle).
✅ The **Assigned** tab shows a count badge.

---

## Test 4.3 - Perform & record the result (Mobile)

1. Tap the assigned inspection.
2. The item and batch are pre-filled (you inspect what was assigned).
3. Set condition = **Damaged**, add a note.
4. **Submit Report**.

✅ It moves to the **History** tab, marked **Damaged**.
✅ Because it's damaged + linked to a batch, the disposal sheet opens next
   (Test 4.4).

Also submit one ad-hoc inspection (tap **+**, pick an item yourself, mark
**Good**) →

✅ Saved to History, and **no** dispose option is offered for a Good item.

---

## Test 4.4 - PARTIAL disposal (the key requirement)

After marking Sugar Damaged, the disposal sheet opens pre-filled with the full
batch (5 kg).

1. Change the amount to **2** (kg).

✅ Preview reads **"3 kg will remain on hand."**

2. Confirm **Dispose & remove from stock**.

✅ Inventory → Sugar now shows **3 kg** (not zero - only 2 kg was written off).
✅ The batch still exists with the reduced quantity.

Then dispose the **whole** remaining batch on another item to confirm:

✅ Disposing the full amount **removes the batch** entirely.

---

## Test 4.5 - Disposal is in the inventory history

1. Web Admin → **Audit Logs**.

✅ Row: **"Disposed 2000 of Sugar (damaged) after inspection - 3000 left on
   hand"**, Module = Inventory, status = warning.

(The disposal is also written to the `inventory_events` history collection with
`type: "disposal"` - the same record the web's own disposal writes, so both
platforms share one history.)

---

## Test 4.6 - Guard rails

- Enter **more** than the batch holds (e.g. 9 of a 5 kg batch) →
  ✅ blocked: *"Only 5 kg available in this batch."*
- Try to dispose the same inspection **twice** →
  ✅ blocked: *"already been disposed."*
- Mark an item **Good** or **Warning** →
  ✅ **no** dispose button (only Damaged/Expired can be disposed).

---

## Test 4.7 - Admin can also dispose (Web)

1. On mobile, submit a **Damaged** inspection but DON'T dispose it.
2. Web Admin → Inspections → find that completed row → **Dispose**.
3. Enter a partial amount → preview shows remainder → confirm.

✅ Works identically to mobile (same partial logic, same history record).

---

## Pass criteria

- [ ] Admin can assign an inspection to a staff member
- [ ] Staff sees it in the **Assigned** tab (live)
- [ ] Staff can perform, set condition, and submit
- [ ] Damaged/Expired offers disposal; Good/Warning does not
- [ ] **Partial** disposal reduces the batch and leaves the remainder on hand
- [ ] Full disposal removes the batch
- [ ] Disposal appears in the audit log / inventory history
- [ ] Cannot dispose more than the batch, or dispose twice
