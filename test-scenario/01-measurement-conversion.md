# Comment #1 - Measurement Conversion (Seasoning / Ingredients)

> **Objective:** Convert kitchen measurements to grams. tbsp→g, tsp→g, for
> sugar, salt, seasonings, etc. Recipe calculations AND inventory deductions
> must use the correct gram equivalent, automatically when preparing recipes.
>
> Example: 1 tbsp sugar = 12.5 g · 1 tsp sugar = 4.2 g

Prerequisite: **Sugar** product exists (kg, density 0.845, 5 kg batch on hand) -
see `00-setup.md`.

---

## Test 1.1 - Spoon toggle + tablespoon weight (Web Admin)

Spoon measurement is behind a toggle, **"Measurable by spoon (tbsp / tsp)"**,
that works like the existing *Measurable* switch. It appears only for
**mass-stocked** products (display unit g or kg). Instead of asking for a
"density", the form asks **"Weight of 1 level tablespoon (g)"** - how a cook
actually thinks. There is **no pre-filled value**: the user types it.

**Adding a new product:**
1. Inventory → Add Product → display unit **kg** → type name **Sugar**.
2. Switch **"Measurable by spoon"** ON.

✅ A field **"Weight of 1 level tablespoon (g)"** appears, **empty**.
✅ Helper text suggests references (sugar ≈ 12.5 g, salt ≈ 18 g, flour ≈ 8 g).
3. Type **12.5**.

✅ Preview reads **1 tbsp = 12.5 g · 1 tsp = 4.17 g · 1 cup = 200 g** (tsp and
   cup are derived from your tablespoon figure).
4. Try to Save with the toggle ON but the weight **blank**.

✅ Blocked with **"Enter the weight of 1 tablespoon."**

**Editing an existing product that already has a value:**
5. Inventory → a saved spoon-measurable product → Edit.

✅ Toggle **ON**, the tablespoon weight shows the **saved** number (this is the
   stored value, not a guess).
> Note: a legacy/seeded product still converts at recipe time via a name
> fallback, but the form now shows its effective tablespoon weight instead of a
> confusing "0".

**Salt** → enter **18 g** per tbsp. Different from sugar - the weight is
per-ingredient, not one global number.

**Turning spoons OFF:**
6. On any mass product, switch the toggle **OFF**, Save, reopen.

✅ Toggle stays OFF, and in a recipe that product offers **only g/kg** (no
   tbsp) - even if its name is a known seasoning. "Off" is honored.

---

## Test 1.2 - tbsp/tsp selectable in a recipe (Web Admin)

1. Recipes → **Add recipe**.
2. Add ingredient **Sugar**, quantity **1**.
3. Open the **unit** dropdown.

✅ **`tbsp` and `tsp` appear** in the list.
⚠️ If only g/kg appear, the fix regressed.

4. Pick **tbsp**.

✅ A hint under the row reads **"Deducts 12.5 g from stock"**.

Save the recipe (name it "Sugar Test", instructions required).

---

## Test 1.3 - tbsp/tsp selectable in a recipe (MOBILE)

This surface was broken until late in the work - test it explicitly.

1. On the phone: Recipes → add/edit a recipe → add ingredient **Sugar**.
2. Open the unit picker.

✅ **tbsp / tsp / cup** are offered for Sugar.
⚠️ Old behavior: only g/kg - tbsp was literally not selectable on mobile.

---

## Test 1.4 - Deduction is correct on WEB (the main test)

1. Note Sugar on hand: **5 kg** (= 5000 g).
2. Recipes → "Sugar Test" → **Prepare** → **1 serving** → confirm.
3. Go to Inventory → Sugar.

✅ On hand is now **4.9875 kg** (5000 g − 12.5 g).
⚠️ Old behavior: web REFUSED the recipe ("cannot cook / unit mismatch").

---

## Test 1.5 - Deduction is correct on MOBILE and MATCHES web

1. Top Sugar back up to a known amount (add a batch so it's e.g. 5 kg again).
2. On the **phone**: Recipes → "Sugar Test" → Prepare → 1 serving → confirm.
3. Check Sugar on hand.

✅ Dropped by **12.5 g** - the SAME as web.
⚠️ Old behavior: mobile deducted **1 g** (≈12× too little) - silently wrong.

> This is the single most important check: web and mobile deduct the *same*
> gram amount for the same recipe.

---

## Test 1.6 - tsp and scaling

1. New recipe: **Sugar, 1 tsp**. Prepare 1 serving.

✅ Sugar drops by **~4.2 g**.

2. Prepare that same recipe with **3 servings**.

✅ Sugar drops by **~12.5 g** (3 × 4.16). Conversion scales linearly.

---

## Test 1.7 - Spoons only when the admin enables them (negative test)

1. Add a product **"Mystery Powder"**, unit **kg**. Leave the spoon toggle OFF.
2. In a recipe, add **Mystery Powder** and open the unit dropdown.

✅ Only **g / kg** offered - **no tbsp/tsp**.

3. Edit Mystery Powder, turn the toggle **ON**, type a tablespoon weight (e.g.
   **10 g**), Save.
4. Back in the recipe, reopen its unit dropdown.

✅ **tbsp/tsp now appear**, and 1 tbsp deducts **10 g**. The toggle + weight is
   what enables them - nothing is guessed.

---

## Test 1.8 - No duplicate products

1. Inventory → Add Product → name **Sugar** (which already exists) → fill the
   rest → Save.

✅ Blocked with **"A product with this name already exists."** (case-insensitive
   - "sugar", "SUGAR" all match). No second Sugar is created.

2. Edit the existing Sugar, keep its name, Save.

✅ Allowed - a product may keep its own name.

(Same behavior on the **mobile** Add Product form.)

---

## Pass criteria

- [ ] Spoon toggle asks for **tablespoon weight in grams** (not "density g/ml")
- [ ] No pre-filled value on a new product - user types it
- [ ] Saving with the toggle on but weight blank is blocked
- [ ] tbsp/tsp selectable for sugar on **web** after entering 12.5 g
- [ ] tbsp/tsp selectable for sugar on **mobile**
- [ ] 1 tbsp sugar deducts **12.5 g** on web
- [ ] 1 tbsp sugar deducts **12.5 g** on mobile (same as web)
- [ ] 1 tsp sugar deducts ~4.2 g
- [ ] Product with the toggle OFF does NOT offer tbsp/tsp
- [ ] Creating a product whose name already exists is blocked (web + mobile)
