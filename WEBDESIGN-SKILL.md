---
name: webapp-design-principles
description: >
  Apply senior-level UI/UX design principles when building or critiquing web pages and components.
  Use this skill whenever building landing pages, dashboards, forms, login screens, navigation,
  cards, data tables, modals, charts, empty states, or any web UI — even if the user doesn't
  explicitly ask for design help. Also trigger when the user asks why something "looks off",
  "feels cluttered", "looks amateur", or wants to improve an existing design. Covers layout
  composition, visual hierarchy, color palettes and systems, typography, spacing, interactive
  feedback, UX flow, and the difference between junior and senior design decisions. This skill
  should be used proactively any time frontend code is being written or reviewed.
---

# Webapp Design Principles Skill

Encodes the design intuition of a senior UI designer into concrete, actionable rules for building and critiquing web pages and components. The goal is always the same: **the design should be invisible — content and function do the talking, not decoration**.

## Tech stack

This skill is optimized for:
- **Tailwind v4** — CSS-first config via `@theme {}`, all utility classes available
- **HeroUI v3** — built on React Aria + Framer Motion; always prefer HeroUI components over custom implementations
- **Framer Motion** — animation library, used internally by HeroUI and available for custom animations

Read the relevant reference file(s) for the task at hand. These files use lazy loading —
only read what applies to the current task, not all 15 upfront. If a reference file does
not exist in the repo yet, apply the principles from this file directly and proceed.

| File | Covers |
|------|--------|
| `references/webdesign/layout-composition.md` | Focal point, white space, visual hierarchy, rule of thirds |
| `references/webdesign/color-system.md` | Full color palette building, 60-30-10, shade scales, HSL/HSB/OKLCH, neutrals |
| `references/webdesign/color-usage.md` | CTA discipline, system colors, neutral balance, dark mode, shadows, element states |
| `references/webdesign/typography.md` | Font scale, line height, letter spacing, alignment, text width, HSL lightness for type |
| `references/webdesign/spacing.md` | Outside-in method, 8px grid, relationship multiplier, CSS implementation |
| `references/webdesign/dashboard.md` | Sidebar, layout, the 4 components, modals/popovers/toasts, charts, micro-interactions |
| `references/webdesign/ux-patterns.md` | Interaction cost, thumb zone, empty states, selection vs input, recognition over recall |
| `references/webdesign/polish.md` | Kerning on large text, nested radius, card layout, removing lines, background color tricks |
| `references/webdesign/junior-vs-senior.md` | Before/after code patterns for login screens, dashboards, complex apps |
| `references/webdesign/responsive.md` | Tailwind v4 breakpoints, mobile-first patterns, responsive typography and spacing |
| `references/webdesign/components.md` | HeroUI v3 component usage: buttons, forms, nav, modals, tables, toasts, skeletons |
| `references/webdesign/accessibility.md` | WCAG contrast, focus states, semantic HTML, ARIA, keyboard nav, color-blind safe design |
| `references/webdesign/animation.md` | Duration guidelines, easing, Tailwind transitions, Framer Motion, optimistic UI, reduced motion |
| `references/webdesign/landing-page.md` | Full landing page structure, hero anatomy, features/benefits, FAQ, CTA sections, copywriting rules |
| `references/webdesign/theming-setup.md` | Tailwind v4 + HeroUI v3 project setup, CSS @theme config, dark mode, semantic tokens, typography |

---

## How to use this skill

**When writing frontend code:** Apply all relevant principles automatically. A senior designer makes these decisions by default — don't wait to be asked.

**When critiquing a design:** Work through layout → color → typography → spacing → component quality. Fix the highest-leverage issue first.

**When something "looks off":** Run the diagnostic checklist before touching anything.

**When principles conflict:** Resolve in this order:

1. **Accessibility wins unconditionally** — WCAG contrast, focus states, and semantic HTML are never traded away for aesthetics
2. **Clarity beats density** — when white space conflicts with showing more information, default to white space unless the user has explicitly asked for a dense layout (e.g. a data table or admin grid where information density is the primary requirement)
3. **Consistency beats perfection** — a slightly imperfect solution that matches the existing component style is better than a more refined solution that introduces a new pattern
4. **Content hierarchy beats decoration** — when visual interest conflicts with legibility or scan order, remove the decoration

---

## Quick diagnostic checklist

1. **Focal point** — Is there one clear dominant element? Or are multiple things competing?
2. **Hierarchy** — Can you tell what to read/click first, second, third?
3. **Color discipline** — Is the accent color ≤10% of surfaces and only on CTAs/interactions?
4. **Neutral balance** — Is the background neutral? Is color used to add character, not dominate?
5. **White space** — Are there quiet areas that give the eye rest?
6. **Spacing system** — Do related elements sit closer than unrelated ones? Is an 8px grid followed?
7. **Typography** — Max 2 font sizes per component? Line height correct? Text width ≤65ch?
8. **Component consistency** — Same radius, weight, and style for every instance of the same component?
9. **Interactive states** — Hover, active, loading, disabled, empty, and error states all designed?
10. **Redundancy** — Does every element earn its place?
11. **Interaction cost** — Can any required steps be eliminated or combined?

---

## The single most important principle

> **Interface design is not brand design.** Once a user is inside an app, it's not a branding moment. It's a tool moment. Tools should be simple, clear, and sometimes even a little boring. The design should step aside and let the content do the work.