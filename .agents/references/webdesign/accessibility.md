# Accessibility

Accessibility is not optional — it affects usability for everyone, improves SEO, and is legally required in many contexts. The good news: HeroUI v3 handles most of it automatically. Your job is to not break it.

---

## What HeroUI v3 handles automatically

HeroUI is built on React Aria, which provides:
- ✅ ARIA roles (`role="button"`, `role="dialog"`, `role="listbox"`, etc.)
- ✅ Keyboard navigation (Tab, Enter, Space, Escape, Arrow keys)
- ✅ Focus management (traps focus in modals, returns focus on close)
- ✅ Screen reader announcements for state changes
- ✅ Touch and pointer events normalized
- ✅ Reduced motion support

**Your responsibility:** Don't override these with custom styles or incorrect HTML that breaks the accessibility foundation.

---

## WCAG contrast ratios

The most commonly failed accessibility requirement. Always check before shipping.

| Text type | Minimum contrast ratio | AA level |
|-----------|----------------------|----------|
| Normal text (<18px or <14px bold) | 4.5:1 | AA |
| Large text (≥18px or ≥14px bold) | 3:1 | AA |
| UI components, icons, focus rings | 3:1 | AA |
| Decorative elements | None | — |

**In Tailwind v4 / HeroUI — safe contrast combos:**

```jsx
// Dark mode — safe text colors on dark backgrounds
<p className="text-foreground">           {/* primary — ~90% lightness */}
<p className="text-default-700">          {/* secondary — good contrast */}
<p className="text-default-500">          {/* tertiary — check at small sizes */}
// text-default-400 and below may fail at small sizes — avoid for body text

// Light mode — safe text colors on white backgrounds
<p className="text-default-900">          {/* primary */}
<p className="text-default-600">          {/* secondary — check */}
// text-default-400 and below will fail WCAG at body text size
```

**Danger zones:**
- Light gray text on white background (very common failure)
- Brand color text on white if the brand color is a mid-tone
- White text on yellow, lime, or light brand colors
- Placeholder text — HeroUI handles this but check if you override it

**Tools:** Use browser DevTools accessibility panel, or `axe` browser extension, or Tailwind's own contrast checker.

---

## Focus states

Focus rings tell keyboard users where they are. Never remove them — style them instead.

**HeroUI handles focus rings automatically.** Don't add `outline-none` or `focus:outline-none` without replacing with a visible alternative.

```jsx
// WRONG — removes focus ring entirely
<button className="focus:outline-none">Click me</button>

// RIGHT — HeroUI Button has focus ring built in
<Button>Click me</Button>

// RIGHT — if building custom interactive element
<button className="
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-primary
  focus-visible:ring-offset-2
">
  Click me
</button>
```

**`focus-visible` vs `focus`:** Use `focus-visible:` — it shows the ring only for keyboard navigation, not mouse clicks. This is the correct modern behavior.

---

## Semantic HTML

HeroUI components use correct semantic elements internally. When writing custom HTML:

```html
<!-- Headings — one h1 per page, logical order -->
<h1>Page title</h1>       <!-- one per page -->
<h2>Section title</h2>    <!-- major sections -->
<h3>Subsection</h3>       <!-- within sections -->
<!-- Never skip levels (h1 → h3) for visual sizing — use CSS instead -->

<!-- Buttons vs links -->
<button>                  <!-- triggers an action (submit, open modal, toggle) -->
<a href="...">            <!-- navigates to a URL -->
<!-- Never use <div onClick> or <span onClick> for interactive elements -->

<!-- Lists -->
<ul> / <ol>               <!-- use for navigation menus, feature lists, option sets -->
<nav>                     <!-- wraps navigation links -->
<main>                    <!-- one per page — main content area -->
<aside>                   <!-- sidebar, supplementary content -->
<article>                 <!-- self-contained content (blog post, card) -->
<section>                 <!-- thematic grouping with a heading -->
```

---

## ARIA labels

HeroUI handles most ARIA automatically. Add `aria-label` when the element's purpose isn't clear from its text content:

```jsx
// Icon-only buttons ALWAYS need aria-label
<Button isIconOnly aria-label="Close dialog">
  <XIcon />
</Button>

// Search inputs
<Input aria-label="Search projects" placeholder="Search..." />

// Tables need aria-label
<Table aria-label="Recent transactions">

// Images — always add alt text
<img src="chart.png" alt="Revenue growth chart showing 40% increase in Q4" />
<img src="decoration.png" alt="" />  {/* empty alt for decorative images */}

// Loading states — announce to screen readers
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>
```

---

## Keyboard navigation

HeroUI handles keyboard nav for its components. For custom interactive elements:

```jsx
// Dropdown/menu keyboard support (HeroUI handles this automatically)
// Custom clickable cards — make them keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="focus-visible:ring-2 focus-visible:ring-primary rounded-lg cursor-pointer"
>
  Card content
</div>

// Skip navigation link (put at top of page)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
>
  Skip to main content
</a>
<main id="main-content">...</main>
```

---

## Color — don't rely on color alone

Color alone cannot convey meaning — some users are color blind, others use high contrast mode.

```jsx
// WRONG — only color differentiates
<div className="text-green-500">Success</div>
<div className="text-red-500">Error</div>

// RIGHT — color + icon + text
<div className="flex items-center gap-2 text-success-700">
  <CheckCircleIcon className="w-4 h-4" />
  <span>Payment successful</span>
</div>
<div className="flex items-center gap-2 text-danger-700">
  <XCircleIcon className="w-4 h-4" />
  <span>Payment failed</span>
</div>

// Form errors — color + icon + descriptive message
<Input
  isInvalid={!!error}
  errorMessage={error}  // HeroUI adds error icon + color automatically
/>
```

---

## Reduced motion

HeroUI respects `prefers-reduced-motion` automatically via Framer Motion. For custom animations:

```css
/* In your CSS — always wrap animations in this media query */
@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

/* Or use Tailwind's motion utilities */
/* motion-safe:transition-transform — only applies when motion is OK */
/* motion-reduce:transition-none — disables when motion is reduced */
```

```jsx
<div className="motion-safe:transition-transform motion-safe:hover:scale-105">
  Card
</div>
```

---

## Form accessibility

```jsx
// HeroUI Input handles label association automatically
// If building custom inputs, always associate labels explicitly

// WRONG — label not associated
<label>Email</label>
<input type="email" />

// RIGHT — using htmlFor / id
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Required fields — communicate in multiple ways
<Input
  label="Email"
  isRequired                          // adds visual indicator
  aria-required="true"               // tells screen readers
  description="Required field"       // visible description
/>

// Error messages — associate with input
<Input
  id="email"
  isInvalid={!!errors.email}
  errorMessage={errors.email}        // HeroUI links this to the input automatically
/>
```

---

## Quick accessibility audit checklist

Before shipping any page or component:

- [ ] All images have `alt` text (empty `alt=""` for decorative images)
- [ ] All interactive elements are keyboard accessible (Tab, Enter, Space)
- [ ] All icon-only buttons have `aria-label`
- [ ] Focus rings are visible on all interactive elements
- [ ] No information conveyed by color alone
- [ ] Heading levels are logical and not skipped
- [ ] Form inputs have associated labels
- [ ] Error messages are descriptive and associated with the field
- [ ] WCAG AA contrast passes on all text (use browser devtools to check)
- [ ] Page has a single `<h1>` and a `<main>` element
- [ ] `<a>` tags navigate, `<button>` tags act — not interchangeable