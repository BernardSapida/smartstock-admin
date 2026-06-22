# Color System — Building a Palette

How to build a cohesive, professional color palette from scratch. Every UI color palette has three categories: **brand colors**, **supporting/semantic colors**, and **neutrals**.

---

## Color format: which to use and when

**HSL** (`hsl(hue, saturation%, lightness%)`)
- Best for: lightness math, dark/light mode switching, type color hierarchy
- Weakness: handles saturation at shade extremes unnaturally (dark/light shades lose color)
- `hsl(220, 80%, 50%)` — readable, easy to derive dark/light variants

**HSB** (Hue, Saturation, Brightness) — used in Figma color picker
- Best for: manually picking shade scales; finer control over color feel
- Use when building a palette in Figma — switch from hex to HSB in the color picker

**OKLCH** (`oklch(lightness chroma hue)`)
- Most perceptually accurate — shade increments look most natural
- Tailwind v4 default; chroma (C) rarely exceeds 0.15–0.2 for UI; lightness 0–1
- Best for new projects; produces the most even-looking shade scales

**Rule of thumb:** Use HSL for code variables (easy math). Use HSB in Figma when picking colors. Consider OKLCH for greenfield projects using Tailwind v4.

---

## The 60-30-10 Rule

Every UI should use color in roughly these proportions:

| Role | % | What it is |
|------|---|------------|
| **Base/neutral** | 60% | White, off-white, light gray, or dark bg in dark mode |
| **Primary/brand** | 30% | Brand color — used for important areas and character |
| **Accent/CTA** | 10% | Call-to-action color — reserved for "click me" moments only |

**The rule can be flipped:** 60% can be a bright color with neutrals as the 30%, as long as the 10% accent remains disciplined.

**This is a guideline, not a law.** Breaking it slightly is fine. Ignoring it entirely produces designs that feel like a yard sale.

---

## 5-Step palette building process

### Step 1 — Find a starting point (brand color)
- Usually handed to you from the brand; if not, pick one
- Good middle colors sit in the **upper-right section** of the color picker
- It should work well as a **button background**
- Use color tools for inspiration: coolors.co, colorhunt.co, huemint.com

### Step 2 — Pick supporting/semantic colors
Four minimum: green (success), orange/yellow (warning), red (error/danger), blue (info).

**Keep supporting colors cohesive with the brand color:**
```
Brand purple: saturation=70, brightness=60
Green:        saturation=65–75, brightness=55–65  ← within 5–10 of brand
Red:          saturation=68–72, brightness=58–62  ← same rule
```
Match saturation and brightness, then adjust hue freely.

### Step 3 — Create shade scales (9 shades, 100–900)
Place base color at **500**. Build outward along an arc from top-left to bottom-right of the color picker.

```
900 (darkest):  ~90–100 saturation, ~20–30 brightness  → text on light bg
700:            mid-dark
500 (base):     your starting color                     → button background
300:            mid-light
100 (lightest): ~5–10 saturation, ~95–100 brightness   → tinted background, alert bg
```

**Process:**
1. Pick 100 and 900 first (extreme ends)
2. Pick 300 and 700 (midpoints between ends and 500)
3. Fill in 200, 400, 600, 800

**Squint test:** Blur all shade scales side by side — each scale's lightness should progress evenly. If the line looks "squiggly" across scales, adjust until consistent. Inconsistent scales mean swapping `yellow-200` for `blue-200` won't look cohesive.

### Step 4 — Create neutrals
Same arc process, but the curve goes the **opposite direction** (strongly desaturating). Darker shades stay further left to avoid oversaturation.

Pick a middle gray and expand outward. Add a tiny hint of brand hue to the neutral for character:
```css
/* Plain gray */
--neutral-500: hsl(0, 0%, 50%);
/* Purple-tinted gray — more character, still neutral */
--neutral-500: hsl(260, 5%, 50%);
```

### Step 5 — Test in actual UI
- Plug colors into real components: buttons, cards, alerts, text
- Check: do you have all needed options? Does it look cohesive? Does it pass WCAG contrast?
- If a color feels too saturated/neon next to others, bring down saturation on that scale
- **Tweak, don't add.** Avoid creating new shades — adjust existing ones. Max 10 shades per color.

---

## Shade naming convention

Use semantic names that work in both dark and light mode:

```css
/* Background layers (dark mode: darkest at base, lightest on top) */
--bg-base:    hsl(0, 0%, 0%);   /* darkest — page background */
--bg-surface: hsl(0, 0%, 5%);   /* cards, panels */
--bg-raised:  hsl(0, 0%, 10%);  /* popovers, elevated elements */

/* Light mode equivalents */
--bg-base:    hsl(0, 0%, 100%); /* lightest — page background */
--bg-surface: hsl(0, 0%, 97%);  /* cards, panels */
--bg-raised:  hsl(0, 0%, 93%);  /* elevated elements */
```

Avoid names like "bg-dark" and "bg-light" — they break in the opposite mode. Use "bg-base", "bg-surface", "bg-raised" instead.

---

## Brand color adaptation

Don't be locked in by brand guidelines if they produce inaccessible or ugly UI:

- If brand color fails WCAG with white text: **darken it** until it passes, or switch to white-on-brand
- Use **analogous colors** (adjacent on the wheel) for gradient depth
- Use **complementary colors** (opposite on the wheel) for secondary accents
- Examples: Mailchimp (bright yellow primary + complementary turquoise); Airbnb (bright pink + deep pink)

**Rotate slightly on the color wheel to expand a limited palette:**
```
Brand purple (hue: 280) → rotate -20° → blue (hue: 260) for storage bar
Brand purple (hue: 280) → rotate +40° → pink (hue: 320) for highlights
```

---

## Tailwind v4 shortcut (if using Tailwind)

For a foolproof light/dark palette using any color:
```
Light mode: background = [color]-50, accent = [color]-500
Dark mode:  background = [color]-950, primary text color = [color]-300
```
Works for every color on the Tailwind palette with zero guesswork.