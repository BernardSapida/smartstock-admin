# Junior vs Senior Design Patterns

Concrete before/after patterns. The gap is rarely about skill — it's about consistently applying fundamentals.

---

## The four universal upgrades

These four changes move almost any design from junior to senior:

1. **Color discipline** — accent color on primary CTAs only
2. **Hierarchy** — one primary action, one secondary, one tertiary (never equals)
3. **Spacing** — related elements closer, unrelated elements farther; outside-in method
4. **Visual presence** — a subtle background tint, illustration, or image transforms "blah" into presence

---

## Login / Form screens

### Junior mistakes

```
❌ Accent color on: input border, icon, label, link, header, button — everything
❌ [SIGN IN]     ← full width button, primary color
❌ [REGISTER]    ← same size, same weight, same color — equally weighted
❌ Label "Email address"   — 14px gray regular
❌ Placeholder "you@..."   — 14px gray regular  ← indistinguishable from label
❌ Link "Forgot password?" — 14px gray regular  ← invisible as a link
```

### Senior patterns

```css
/* Accent appears only on primary CTA */
.btn-primary   { background: var(--accent); color: white; }
.btn-secondary { background: transparent; border: 1px solid var(--border); }
.link          { color: var(--text-secondary); text-decoration: underline; }
.input         { border-color: var(--border); }  /* never accent color */
.input-label   { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
.input-placeholder { color: var(--text-tertiary); font-weight: 400; }
```

```html
<!-- Clear hierarchy: one primary, one secondary (text link only) -->
<button class="btn-primary" style="width:100%">Sign in</button>
<p>Don't have an account? <a href="/register">Register →</a></p>
```

**Proximity grouping:**
```
Logo / brand mark          ← 48px+ above form
                           ← breathing room
"Sign in"                  ← form title
  ↕ 24px
[Email input]
[Password input]
  ↕ 8px                   ← tight — password and "forgot" are related
"Forgot password?"
  ↕ 24px
[Sign in button]
  ↕ 32px                  ← larger gap — register is less related
"Don't have an account? Register →"
```

---

## Dashboards

### Junior mistakes

- Giant nav bar + sidebar steal visual weight from data (wrong focal point)
- Logo and "Dashboard" label are more prominent than the actual content
- Brand color on every chart, every graph, every pie — all identical, nothing distinguishable
- Notification badges use brand color → invisible against the background
- Heavy drop shadows compensating for poor contrast
- Red logout button (misuses system color)
- Ambiguous search: does it filter this widget or the whole page?

### Senior patterns

```css
/* Brand color used sparingly — only CTAs and active nav states */
.nav-link.active  { color: var(--brand); }
.btn-primary      { background: var(--brand); }
/* Charts use data colors, not brand colors */
.chart-series-1   { fill: hsl(210, 70%, 55%); }   /* distinct per series */
.chart-series-2   { fill: hsl(30,  80%, 55%); }
.chart-series-3   { fill: hsl(140, 60%, 45%); }
```

```css
/* Section separation without decoration — contrast does the work */
.sidebar { background: hsl(0, 0%, 97%); }
.main    { background: hsl(0, 0%, 100%); }
/* No divider line needed — tint difference is sufficient */
```

```css
/* System colors used correctly */
.badge-error   { background: hsl(0, 80%, 95%); color: hsl(0, 70%, 35%); }
.badge-success { background: hsl(140, 60%, 94%); color: hsl(140, 55%, 25%); }
.btn-logout    { color: var(--text-secondary); }  /* logout ≠ error — don't use red */
```

```css
/* Stylistic choices (e.g., neo-brutalist shadows) only on focal elements */
.card-featured { box-shadow: 4px 4px 0 #000; }  /* intentional, specific */
.card-standard { box-shadow: none; }              /* not applied universally */
```

---

## Complex web apps (Zillow/Airbnb-style)

### Junior mistakes

- Sidebar, content listing, and map feel "muddy" — not enough contrast between zones
- Price highlighted in accent color — prices are content, not CTAs
- Text too small AND too light — if it can't pass WCAG contrast, remove it or fix it
- Card outlines so light they're invisible
- Heavy drop shadows everywhere — symptom of poor color/contrast planning

### Senior patterns

```css
/* Three distinct zones — no divider lines */
.sidebar  { background: hsl(220, 10%, 97%); border-right: 1px solid hsl(220, 10%, 92%); }
.listings { background: hsl(0, 0%, 100%); }
.map      { background: hsl(220, 8%,  93%); }  /* tinted to feel cohesive */
```

```css
/* Price is content, not a CTA */
.listing-price { color: var(--text-primary); font-weight: 600; }  /* prominent but neutral */
.btn-add       { background: var(--accent); }                      /* accent = action only */
```

```css
/* Card separation: subtle, not heavy */
.listing-card { border: 0.5px solid hsl(0, 0%, 88%); border-radius: 12px; }
/* OR: very subtle shadow */
.listing-card { box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
/* NOT both — one is enough */
```

---

## Component consistency rules

```css
/* Every instance of the same component must be identical */
.search-bar {
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: 0 12px;
}
/* If it appears twice on the page, it must look exactly the same both times */

/* Corner radius system — pick and enforce */
--radius-sm:  4px;   /* chips, tags, badges */
--radius-md:  8px;   /* inputs, buttons, small cards */
--radius-lg:  12px;  /* large cards, modals */
--radius-xl:  16px;  /* sheet overlays, feature cards */
```

Inconsistency signals amateur work faster than almost anything else.

---

## Icon rules

- All icons from the **same library**, same stroke weight, same style
- Missing icons on interactive cards force users to read more — add them
- Icons without labels: only acceptable for universally known shapes (home, search, user, close, settings)
- Ambiguous icons: add tooltip on hover
- **Exception:** Different icon styles are allowed in visually separate areas serving different purposes (nav icons vs content icons vs status icons) — as long as they never appear side by side

---

## Interactive feedback — every state

| State | Required treatment |
|-------|-------------------|
| Default | Base appearance |
| Hover | Subtle bg change, underline, or color shift |
| Active/pressed | Scale(0.97) or darken slightly |
| Loading | Gray out + spinner; or skeleton screen |
| Disabled | ~50% opacity, `cursor: not-allowed`, no pointer events |
| Success | Fill icon + badge/count update + toast |
| Error | Red border on input + error message below (not above) |
| Empty | Empty state with illustration + CTA |

**Missing loading state = broken feel.** If a click triggers async work and nothing changes, users think the click didn't register. Gray it out immediately.

```css
.btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
.btn.loading  { opacity: 0.7; cursor: wait; }
.btn.loading::after { content: ''; /* spinner animation */ }
```

---

## Redundancy checklist

Before shipping any component, ask of each element:
- ✅ Would removing this break understanding or function? → Keep it
- ❌ Is this an arrow on a swipeable mobile carousel? → Remove
- ❌ Is this decorative stroke not aiding contrast? → Remove or dim significantly
- ❌ Is this label text saying what the icon already says? → Remove one
- ❌ Is this shadow compensating for poor contrast? → Fix the contrast instead
- ❌ Is this button doing the same thing as a swipe gesture on mobile? → Remove