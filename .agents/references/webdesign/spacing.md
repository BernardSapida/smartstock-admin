# Spacing

Spacing signals relationship. Elements that are closer together feel more related. Elements that are farther apart feel more independent. This is the most important mental model for spacing decisions.

---

## The 8px grid system

All spacing values should be multiples of 8px (or 4px for micro-gaps):

| Value | Name | Use case |
|-------|------|----------|
| 4px | Micro | Icon-to-label gaps, tight inline pairs |
| 8px | Base | Between sibling elements inside a component |
| 16px | Medium | Internal card/component padding |
| 24px | Large | Wrapper padding, title-to-content gap |
| 32px | Section | Between major content sections |
| 48px | Page | Between top-level page sections on desktop |
| 64–96px | Hero | Vertical padding on hero and marketing sections |

Use the same system for corner radii and icon sizes where possible.

---

## The Outside-In Method

Apply spacing from outermost layer inward. Each layer uses less space than the one containing it.

```
Page edge
  └── Wrapper padding:          24px  ← screen breathing room
        └── Between sections:       32–48px ← largest internal gap
              └── Title → content:      24px  ← "this heading belongs here"
                    └── Card padding:       16px  ← inside the component
                          └── Element gaps:    6–8px ← smallest unit
```

**Layer 1 — Wrapper / screen padding (24–30px desktop, 16–24px mobile)**
Content never touches the viewport edge.

**Layer 2 — Between major sections (32–48px)**
The gap between distinctly different content groups. This large gap says: *these are separate topics*.

**Layer 3 — Heading to its content group (24px)**
The heading belongs to the content below it — it should be pulled toward its content, not floating between sections.

**Layer 4 — Component internal padding (16px)**
Padding inside cards, buttons, inputs. Tighter than section gaps — contents of a card are closely related.

**Layer 5 — Individual elements (6–8px)**
Minimum 6px between any two visible elements. Below this, things read as merged or broken.

---

## The relationship multiplier rule

If the gap between an element and its closest neighbor is `1×`, the gap between that element and a less-related neighbor should be `2×`.

```
Section heading
  ↕ 24px (1×) — heading belongs to the cards below
[Card 1] [Card 2] [Card 3]
  ↕ 48px (2×) — next section is unrelated to these cards
Section heading
```

**In code:**
```css
.section-heading { margin-bottom: 24px; }   /* 1× — close to its content */
.section + .section { margin-top: 48px; }   /* 2× — between sections */
```

Applies everywhere: hero text → CTA (close), CTA → next section (far), card title → card body (close), card → next card (farther).

---

## Dashboard-specific spacing

Dashboards use **smaller font sizes and tighter spacing** than landing pages — more content density is required:

- Content is compressed because more elements share the screen
- Grids are followed more strictly (most/all of the screen is used)
- Even tighter spacing is acceptable if the grid is consistent

```css
/* Landing page section spacing */
.section + .section { margin-top: 96px; }

/* Dashboard section spacing */
.dashboard-section + .dashboard-section { margin-top: 24px; }
```

---

## Hard rules

| Rule | Value |
|------|-------|
| Minimum element gap | 6px |
| Tappable target spacing (mobile) | 12–42px apart |
| All values divisible by 4 | Required |
| Parent gap > child gap | Always |

---

## Lines vs spacing for list separation

Prefer spacing over divider lines:

```css
/* Use spacing — cleaner, less visual noise */
.list-item + .list-item { margin-top: 16px; }

/* If spacing must be tight and items need separation: alternating background rows */
.list-item:nth-child(even) { background: hsl(0, 0%, 97%); }

/* Avoid: divider lines everywhere — adds clutter without adding clarity */
.list-item + .list-item { border-top: 1px solid #eee; } /* use only when necessary */
```

Rule: the fewer visual elements used to communicate the same thing, the better.

---

## Common mistakes

- **Same gap everywhere** — flattens hierarchy; everything feels equally related
- **No wrapper** — content bleeding to viewport edges; looks unfinished
- **Title too far from its content** — the heading visually disowns the content it belongs to
- **Mobile too tight** — mobile needs more vertical spacing than desktop, not less
- **Inconsistent padding** — a card with 16px top and 24px side looks unbalanced

---

## CSS implementation

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
}

.container { padding-inline: var(--space-6); max-width: 1200px; margin-inline: auto; }
.section + .section { margin-top: var(--space-12); }
.section-title { margin-bottom: var(--space-6); }
.card { padding: var(--space-4); gap: var(--space-2); }
.tag-row { gap: var(--space-2); }
```

**Tailwind:** `gap-1`=4px, `gap-2`=8px, `gap-4`=16px, `gap-6`=24px, `gap-8`=32px, `gap-12`=48px