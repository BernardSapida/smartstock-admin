# Polish Details

The tiny details that separate good designs from exceptional ones. Most users can't name these, but they feel them.

---

## Kerning on large text

At font sizes above **70–80px**, letter spacing matters significantly. Fonts are designed for readability at body sizes — at display sizes, the default spacing feels loose.

```css
/* Apply negative letter spacing to large display text */
.display-xl { font-size: 6rem;   letter-spacing: -0.04em; }
.display-lg { font-size: 4rem;   letter-spacing: -0.03em; }
.display-md { font-size: 2.5rem; letter-spacing: -0.02em; }
/* Below ~70px — no adjustment needed, browsers handle it */
.heading    { font-size: 1.5rem; letter-spacing: -0.01em; }
.body       { font-size: 1rem;   letter-spacing: 0; }
```

**Range:** -2% to -4% for large display text. Start at -2%, go more negative if it still looks loose.

**Why it matters:** Disjointed spacing on large text looks like a font problem. It's not — it's a kerning problem. Tightening it makes headlines feel intentional and refined.

---

## Nested corner radius

When one rounded element sits inside another, the inner corner must be smaller — not equal.

**The formula:**
```
inner radius = outer radius − gap between corners
```

**Example:**
```css
.card { border-radius: 30px; padding: 10px; }
/* Gap between card edge and inner element = 10px */
/* Correct inner radius: 30 - 10 = 20px */
.card-inner { border-radius: 20px; }
```

**Pill shapes:** Exempt — the distance is equal all the way around, so matching radii look correct.

**iOS corner smoothing:** In Figma, enabling "iOS corner smoothing" on corners creates a subtle taper before the corner hits — the Apple-style continuous curvature. Dial it to max for the smoothest feel.

**The visual problem without correction:**
- The straight edges of inner and outer elements are parallel and equidistant
- At the corners, the outer rounds away while the inner doesn't adjust — the distance between them grows
- Result: the inner element looks like it has sharper corners than intended

---

## Card layouts — don't be boring

A default "label: value" list layout misses opportunities for visual hierarchy and scannability.

**Card layout improvements:**

1. **Remove redundant labels** — if the UI implies the label, the label is noise:
   ```
   ❌ Location: San Francisco    ✅ 📍 San Francisco
   ❌ Price: $150/night          ✅ $150/night  ⭐ 4.8
   ```

2. **Group related information:**
   ```
   Name + Location (go together)
   Price + Rating (go together)
   Details: beds, baths, guests (go together)
   Check-in + Check-out (go together, but less important than above)
   ```

3. **Rank by importance** — most important info first, least important last. In a rental listing, pricing and rating are more important than check-in dates.

4. **Stack related pairs, right-align secondary data:**
   ```
   Sunset Villa          ⭐ 4.8
   San Francisco, CA     $150/night
   🛏 2  🛁 1  👥 4
   Check-in: Mar 20  →  Check-out: Mar 25
   ```

5. **Use icons for context** — replace text labels with recognizable icons where possible.

---

## Remove lines from lists

Lines (dividers) add visual noise. Use spacing first:

```css
/* Preferred: space items far enough apart */
.list-item + .list-item { margin-top: 20px; }

/* If items must be tight: alternating background */
.list-item:nth-child(even) { background: hsl(0, 0%, 97%); }

/* Lines: use only when items are very dense and spacing alone fails */
.list-item + .list-item { border-top: 1px solid hsl(0, 0%, 93%); }
```

**The principle:** The fewer visual elements needed to communicate the same thing, the better. Every line is an element. Eliminate elements whenever spacing achieves the same separation.

---

## Better background colors (not pure black/white)

Using a very dark or light tint of the accent color instead of pure black or white adds cohesion:

```css
/* Dark mode — dark blue instead of pure black (GitHub pattern) */
--bg-base: hsl(220, 20%, 6%);    /* dark blue-gray, not #000 */

/* Light mode — warm off-white instead of pure white */
--bg-base: hsl(40, 20%, 97%);    /* warm cream */

/* Light mode — brand-tinted light background */
--bg-base: hsl(260, 15%, 97%);   /* purple-gray */
```

**Tailwind shortcut (zero guesswork):**
```
Light mode: [color]-50 for background, [color]-500 for accent
Dark mode:  [color]-950 for background, [color]-300 for primary text color
```

Works for every color in the Tailwind palette. Impossible to make a bad-looking combination.

---

## Creating depth in dark mode (without shadows)

Shadows are nearly invisible on dark backgrounds. Use background color increments instead:

```css
/* Take the base dark color and increment brightness slightly */
--bg-base:    hsl(220, 20%, 7%);   /* darkest — page */
--bg-surface: hsl(220, 16%, 11%);  /* +4 brightness, -4 saturation — cards */
--bg-raised:  hsl(220, 12%, 15%);  /* repeat — popovers, modals */
--bg-top:     hsl(220, 8%,  19%);  /* top-most layer — tooltips */
```

Each layer is visually distinct, creating clear depth without any shadows. The pattern:
- Increase brightness by ~4
- Decrease saturation by ~4
- Repeat for as many layers as needed

---

## Consistent spacing — the 8px nudge in Figma

In Figma: Preferences → Nudge Amount → change from 10 to 8.

This ensures every small adjustment stays aligned with the 8px grid automatically. Small misalignments (e.g., 13px instead of 16px) are invisible individually but collectively make a design feel "off".

For larger sizes (100px+), rounding to the nearest 5 or 10 is fine — the difference between 120px and 128px is imperceptible.

---

## Matching color palettes using HSB

When creating related colors for illustrations, icons, or UI elements that should feel cohesive:

1. Start with base color (e.g., blue: H=210, S=60, B=80)
2. For a darker shade: increase S by ~20, decrease B by ~10
3. For an even darker shade: increase S by ~20 more, decrease B by ~10 more
4. For hue variation: shift H toward blue/purple (~20 points) for darker feel; shift toward yellow/red for lighter feel

```
Base:   H=210, S=60, B=80
Shade:  H=215, S=80, B=70   ← darker, slightly more saturated
Dark:   H=220, S=100, B=60  ← darkest
```

This technique produces cohesive multi-color palettes (folders, tags, category icons) that feel like they belong together.

---

## Shadow color matching

Shadows on colored backgrounds should be tinted to match:

```css
/* White/neutral background — gray shadow is fine */
.card { box-shadow: 0 2px 8px rgba(0,0,0,0.10); }

/* Purple background — use purple-tinted shadow */
.card { box-shadow: 0 4px 16px hsl(260, 50%, 15%, 0.3); }

/* Blue background — use blue-tinted shadow */
.card { box-shadow: 0 4px 16px hsl(220, 60%, 15%, 0.25); }
```

A gray shadow on a colored background looks like it was copy-pasted from another design — it breaks visual harmony. Tinting the shadow to match the background makes it feel intentional and cohesive.