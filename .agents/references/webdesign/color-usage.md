# Color Usage — Applying Color in UI

How to apply color once you have a palette. These are the rules that separate mature, professional UIs from amateur ones.

---

## CTA color discipline

The accent color (10%) is the most abused element in junior UI design.

**Use accent color ONLY on:**
- Primary interactive buttons
- Active nav/tab states
- Key links that need to stand out

**Never use accent color on:**
- Input borders (default state)
- Passive icons (decorative use)
- Labels and headings
- Price displays
- Multiple competing elements simultaneously

> "If everything is on fire, nothing is on fire." — Color attention is finite. Spending it everywhere means it's worth nothing.

**Icons generally need no color.** Their job is to be recognizable symbols. Reserve color on icons only for communicating status (active tab, error, success).

---

## Neutral balance

The background should stay in the background. This is called **neutral balance** — the same idea as white space, but with color.

**Background rules:**
- Almost never use bright colors for backgrounds
- Start with a neutral gray background, white/light foreground
- Exception: add a tiny hint of brand hue to the neutral gray for character (e.g., slightly purple-gray)

**The Headspace technique:** Take brand color at very low opacity/lightness for card backgrounds — adds color without overpowering.

**When in doubt, use a border instead of a background color.** A simple border is often cleaner than adding another color layer.

**Light mode background options:**
1. White page bg + slightly off-white card bg (most common)
2. Very light brand tint as page bg + white card bg (adds character)
3. Reversed: colored bg + white card (works for small UI features like search bars)

**Dark mode layering (correct):**
```css
--bg-base:    hsl(0, 0%, 0%);    /* 0% — page bg, darkest */
--bg-surface: hsl(0, 0%, 5%);    /* 5% — cards, panels */
--bg-raised:  hsl(0, 0%, 10%);   /* 10% — popovers, elevated */
/* Lighter = closer to user = more important */
```

---

## System colors — use correctly, never decorate

These carry universal meaning across every interface. Never repurpose for branding:

| Color | Correct use | Never use for |
|-------|-------------|---------------|
| **Red** | Errors, destructive actions, danger | Logout button branding, decorative accents |
| **Green** | Success states, confirmations | Brand color, decorative fills |
| **Yellow/amber** | Warnings | Brand color |
| **Blue** | Informational messages | Not always — blue can be a brand color |

Red for a logout button breaks user mental models. Reserve red strictly for "this action may cause harm or loss."

---

## Pure black and white — avoid both

Most text should be a gray variant, not pure black or white.

**Dark mode text:**
```css
--text-primary:   hsl(0, 0%, 90%);   /* NOT 100% — pure white is too harsh */
--text-secondary: hsl(0, 0%, 60%);   /* muted */
--text-tertiary:  hsl(0, 0%, 40%);   /* very muted, metadata */
```

**Light mode text:**
```css
--text-primary:   hsl(0, 0%, 10%);   /* NOT 0% — softened black */
--text-secondary: hsl(0, 0%, 40%);
--text-tertiary:  hsl(0, 0%, 60%);
```

> Getting comfortable with more gray and less black/white is what differentiates mediocre from professional designers.

Reserve pure white text only for the most important elements on dark mode (logo, primary heading, key data).

---

## Dark mode — done properly, not just inverted

**"Frankenstein dark mode"** = naively inverting light mode colors. The result is usually almost-right but wrong in subtle ways.

Instead, build dark mode with its goals in mind:

1. **Borders need more contrast in dark mode** — light/dark tones need bigger differences than in light mode to be visible
2. **Text uses light grays, not pure white** — easier on the eyes
3. **Shadows don't work in dark mode** — use background color differences for depth instead
4. **Logo and brand marks may need desaturation** — highly saturated colors can look jarring on dark backgrounds

**Dark mode depth without shadows:**
```css
/* Take the dark bg, bump brightness slightly, drop saturation */
--bg-base:      hsl(220, 20%, 8%);   /* dark blue-gray */
--bg-surface:   hsl(220, 16%, 12%);  /* +4 brightness, -4 saturation */
--bg-raised:    hsl(220, 12%, 16%);  /* repeat */
/* Creates clear layering without any shadows */
```

**Light/dark mode conversion via HSL:**
```css
/* Subtract L from 100 to get starting point, then adjust with eyes */
/* Dark: L=90 (text) → Light: L=10 */
/* Dark: L=60 (secondary) → Light: L=40 */
/* Dark: L=5  (surface) → Light: L=95 */

:root { /* dark mode default */
  --bg-base: hsl(0, 0%, 5%);
  --text-primary: hsl(0, 0%, 90%);
}
[data-theme="light"] {
  --bg-base: hsl(0, 0%, 95%);     /* 100 - 5 = 95 */
  --text-primary: hsl(0, 0%, 10%); /* 100 - 90 = 10 */
}
```

---

## Shadows

**Match shadow color to background:**
```css
/* On white background */
box-shadow: 0 1px 3px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06);

/* On purple background — use purple-tinted shadow, NOT gray */
box-shadow: 0 4px 16px hsl(260, 40%, 20%, 0.3);
/* Gray shadow on colored bg looks jarring — breaks visual harmony */
```

**Two-shadow technique for realism:**
Always mix a darker/shorter shadow with a lighter/longer one:
```css
box-shadow:
  0 1px 2px rgba(0, 0, 0, 0.15),   /* close, dark — defines edge */
  0 4px 16px rgba(0, 0, 0, 0.07);  /* far, soft — creates depth */
```

**Drop shadow signal:** If you're adding heavy drop shadows to many elements, stop — it signals that color/contrast isn't working. Fix the contrast; shadows should be subtle or absent.

**Dark mode:** Shadows are nearly invisible on dark backgrounds. Use background color differences for depth instead (see dark mode section above).

---

## Element states via color

Every interactive element needs every state designed:

| State | Treatment |
|-------|-----------|
| Default | Base appearance |
| Hover | Slightly lighter or brighter version of base color |
| Active/pressed | Slightly darker version; optional: `scale(0.97)` |
| Disabled | Desaturate the color; if already gray, reduce opacity to ~40–50% |
| Loading | Gray out button, reduced opacity, show spinner |
| Error | Red border on input, red message text below |
| Success | Fill icon, update badge/count, show toast |

**Mobile note:** No hover effects on touch — use press/active states only.

**Disabled pattern:**
```css
.btn:disabled {
  background: hsl(0, 0%, 75%);
  color: hsl(0, 0%, 100%);
  cursor: not-allowed;
  /* Communicates disabled without any additional icons or labels */
}
```

---

## Deemphasize to emphasize

When primary text is already at maximum contrast (white on black), you can't make it stand out more by making it louder. Instead, make secondary content quieter.

```css
/* Dark mode — title can't go higher than L=90%, so make secondary text L=55% */
.title     { color: hsl(0, 0%, 90%); }  /* prominent */
.secondary { color: hsl(0, 0%, 55%); }  /* quiet — makes title feel louder by contrast */
.tertiary  { color: hsl(0, 0%, 38%); }  /* very quiet */
```

This technique is used everywhere in professional UI — the hierarchy comes from the quiet elements, not the loud ones.