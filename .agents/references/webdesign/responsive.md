# Responsive Design

How to build layouts that work across all screen sizes using Tailwind v4 breakpoints and HeroUI v3 components.

---

## Tailwind v4 breakpoints

Tailwind v4 uses the same breakpoint names but with a refreshed CSS-first config approach. All breakpoints are **mobile-first** — unprefixed classes apply to all sizes, prefixed classes apply at that size and above.

| Prefix | Min-width | Typical target |
|--------|-----------|----------------|
| (none) | 0px | Mobile — always the default |
| `sm:` | 640px | Large mobile / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Small desktop / landscape tablet |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Large desktop |

**Custom breakpoints in Tailwind v4 (CSS-first config):**
```css
@import "tailwindcss";

@theme {
  --breakpoint-xs: 480px;   /* custom — use sparingly */
  --breakpoint-3xl: 1920px; /* custom for wide monitors */
}
```

---

## The mobile-first mindset

Always design and code mobile first. Add complexity as screen size increases — never remove it.

```html
<!-- Mobile: stacked full-width, Desktop: side by side -->
<div class="flex flex-col lg:flex-row gap-6">
  <div class="w-full lg:w-1/2">...</div>
  <div class="w-full lg:w-1/2">...</div>
</div>
```

**Common stacking patterns:**

| Mobile | Desktop |
|--------|---------|
| Single column | 2–3 columns |
| Full-width cards | Card grid |
| Bottom nav | Side nav |
| Hidden sidebar | Visible sidebar |
| Stacked form fields | Inline form fields |
| Icon only | Icon + label |

---

## Layout patterns by screen size

### Navigation
```html
<!-- Mobile: bottom tab bar | Desktop: sidebar -->
<nav class="
  fixed bottom-0 left-0 right-0 flex justify-around   <!-- mobile bottom nav -->
  lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-64 lg:flex-col lg:justify-start  <!-- desktop sidebar -->
">
```

With HeroUI v3:
```jsx
// Use Navbar for top bar (landing pages, simple apps)
// Use a custom sidebar pattern for dashboards
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";

// Responsive: show mobile menu button below md, hide above
<Navbar>
  <NavbarBrand>Logo</NavbarBrand>
  <NavbarContent className="hidden md:flex">
    {/* Desktop nav links */}
  </NavbarContent>
  <NavbarContent className="md:hidden">
    {/* Mobile menu trigger */}
  </NavbarContent>
</Navbar>
```

### Dashboard layout
```html
<!-- Dashboard: sidebar hidden on mobile, visible on lg+ -->
<div class="flex h-screen">
  <aside class="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
    <!-- Sidebar -->
  </aside>
  <main class="flex-1 lg:pl-64 overflow-auto">
    <!-- Content -->
  </main>
</div>
```

### Card grids
```html
<!-- 1 col mobile → 2 col tablet → 3 col desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  <Card />
</div>

<!-- Metric cards: 2 col mobile → 4 col desktop -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard />
</div>
```

### Hero sections
```html
<!-- Mobile: stacked, centered | Desktop: side by side -->
<section class="
  flex flex-col items-center text-center gap-8 py-16 px-6
  lg:flex-row lg:text-left lg:items-center lg:gap-16 lg:py-24 lg:px-12
">
  <div class="lg:w-1/2"><!-- Text content --></div>
  <div class="lg:w-1/2"><!-- Image/illustration --></div>
</section>
```

---

## Responsive typography

In Tailwind v4, use fluid typography with `clamp()` via CSS variables, or use responsive text size classes:

```html
<!-- Responsive text sizes -->
<h1 class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight">
<h2 class="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
<p class="text-sm md:text-base leading-relaxed">
```

**Fluid typography with clamp (Tailwind v4 CSS config):**
```css
@theme {
  --text-display: clamp(2.5rem, 5vw, 5rem);   /* scales between 40px–80px */
  --text-heading: clamp(1.5rem, 3vw, 2.5rem); /* scales between 24px–40px */
}
```

**Text width constraint — always:**
```html
<p class="max-w-prose">  <!-- ~65ch, built into Tailwind -->
<!-- or -->
<p class="max-w-2xl">    <!-- 672px, good for body text -->
```

---

## Responsive spacing

```html
<!-- Padding scales up with screen size -->
<section class="px-4 md:px-8 lg:px-12 py-12 md:py-16 lg:py-24">

<!-- Gap scales up -->
<div class="flex flex-col gap-4 md:gap-6 lg:gap-8">

<!-- Container with responsive max-width -->
<div class="container mx-auto px-4 md:px-6 lg:px-8">
```

**Tailwind v4 container configuration:**
```css
@theme {
  --container-padding: 1rem;  /* default container side padding */
}
```

---

## HeroUI v3 responsive props

HeroUI v3 components accept responsive prop objects on many properties:

```jsx
// Size responsive
<Button size={{ base: "sm", md: "md", lg: "lg" }}>Click me</Button>

// Column count in a grid component
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
  <Card />
</div>
```

---

## Images and media

```html
<!-- Responsive image — never overflow container -->
<img class="w-full h-auto object-cover" src="..." alt="...">

<!-- Responsive aspect ratio -->
<div class="aspect-video md:aspect-[4/3] lg:aspect-video overflow-hidden rounded-lg">
  <img class="w-full h-full object-cover">
</div>

<!-- Hide/show by breakpoint -->
<img class="block md:hidden" src="mobile-image.jpg">   <!-- mobile only -->
<img class="hidden md:block" src="desktop-image.jpg">  <!-- desktop only -->
```

---

## What to never do

- **Never design desktop first** — adding breakpoints to remove things is harder than adding things progressively
- **Never use fixed pixel widths** — use `w-full`, `max-w-*`, `min-w-*`, or grid/flex proportions
- **Never hide important content on mobile** — if it's important, it should be accessible on all screens; restructure instead of hiding
- **Never use `px` for font sizes** — use Tailwind's text scale or `rem` values so browser scaling works
- **Never rely on hover-only interactions on mobile** — touch devices have no hover state; all functionality must be accessible via tap