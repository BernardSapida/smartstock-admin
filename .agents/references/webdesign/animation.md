# Animation and Transitions

Animation should serve the user — confirming actions, communicating state, and guiding attention. It should never exist purely for visual flair or slow the user down.

> Good animation is invisible. Users feel it but don't notice it. Bad animation is noticed — and then resented.

---

## What HeroUI v3 handles automatically

HeroUI v3 uses Framer Motion internally. These animations are built in — don't replace them:

- ✅ Modal open/close (scale + fade)
- ✅ Dropdown open/close (slide + fade)
- ✅ Tooltip show/hide (fade)
- ✅ Button press feedback (scale)
- ✅ Tabs transition (slide indicator)
- ✅ Accordion expand/collapse
- ✅ Toast notifications (slide in/out)
- ✅ Skeleton shimmer

**Don't add custom animations on top of HeroUI's built-in ones** — they'll stack and feel heavy.

---

## When to animate (and when not to)

| Animate | Don't animate |
|---------|--------------|
| State changes (open/close, show/hide) | Decorative elements that don't change |
| User feedback (button press, form submit) | Page backgrounds or static illustrations |
| Loading states (skeleton, spinner) | Every element on page load |
| Navigation transitions | Text that's just rendering |
| Data updates (count changes, chart updates) | Hover effects on non-interactive elements |

**The question to ask:** Does this animation communicate something to the user, or is it just moving for the sake of moving?

---

## Duration guidelines

Speed communicates weight. Fast = light, responsive. Slow = heavy, important.

| Type | Duration | Use for |
|------|----------|---------|
| Micro | 75–100ms | Button press, checkbox tick, switch toggle |
| Fast | 150–200ms | Tooltips, dropdown open, hover state |
| Default | 250–300ms | Modal open, drawer slide, tab change |
| Slow | 400–500ms | Page transitions, large content reveals |
| Never | >500ms | Any UI transition — feels broken |

```css
/* Tailwind duration utilities */
duration-75    /* 75ms  — micro interactions */
duration-150   /* 150ms — fast */
duration-200   /* 200ms — fast */
duration-300   /* 300ms — default */
duration-500   /* 500ms — slow, use sparingly */
```

---

## Easing curves

Easing makes motion feel natural — objects don't start and stop instantly in the real world.

| Easing | Tailwind class | Use for |
|--------|---------------|---------|
| Ease out | `ease-out` | Elements entering the screen (decelerates into place) |
| Ease in | `ease-in` | Elements leaving the screen (accelerates away) |
| Ease in-out | `ease-in-out` | Elements moving within the screen |
| Linear | `ease-linear` | Progress bars, loading indicators, spinners |

```jsx
// Element appearing (ease-out — starts fast, settles into place)
<div className="transition-all duration-300 ease-out transform translate-y-0 opacity-100">

// Element disappearing (ease-in — starts slow, accelerates away)
<div className="transition-all duration-200 ease-in transform -translate-y-2 opacity-0">
```

---

## Tailwind v4 transition utilities

```html
<!-- Basic transition -->
<button class="transition-colors duration-200 hover:bg-primary-600">
  Click me
</button>

<!-- Multiple properties -->
<div class="transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg">
  Card
</div>

<!-- Specific properties (better performance than transition-all) -->
<div class="transition-transform duration-200 ease-out hover:scale-102">
<div class="transition-opacity duration-150 opacity-0 group-hover:opacity-100">
<div class="transition-colors duration-200 bg-default-100 hover:bg-default-200">
```

**Performance rule:** Animate only `transform` and `opacity` when possible — these are GPU-accelerated and won't cause layout reflows. Avoid animating `width`, `height`, `margin`, `padding` — they trigger expensive layout recalculations.

```css
/* Fast (GPU) — prefer these */
transform: translateY(-4px);
opacity: 0.8;

/* Slow (triggers layout) — avoid animating */
height: auto;
margin-top: 16px;
width: 100%;
```

---

## Common animation patterns

### Fade in on mount
```jsx
// Simple fade-in for content that appears
<div className="animate-fade-in">  {/* define in @keyframes */}

// Or with Tailwind + state
const [visible, setVisible] = useState(false);
useEffect(() => setVisible(true), []);

<div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
```

### Hover lift on cards
```jsx
// Subtle — preferred for dashboards
<Card className="transition-shadow duration-200 hover:shadow-md cursor-pointer">

// More expressive — landing pages, product cards
<div className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
```

### Button press feedback
```jsx
// HeroUI Button has this built in via Framer Motion
// For custom buttons:
<button className="active:scale-95 transition-transform duration-75">
  Click me
</button>
```

### Skeleton shimmer (loading)
```jsx
// HeroUI Skeleton component has shimmer built in
import { Skeleton } from "@heroui/react";
<Skeleton className="h-4 w-3/4 rounded-lg" />

// Custom shimmer in CSS
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite ease-in-out;
}
```

### Number counter animation (metric cards)
```jsx
// For animating numbers updating in dashboards
import { useSpring, animated } from "@react-spring/web";  // or use framer-motion

const { number } = useSpring({
  number: targetValue,
  from: { number: 0 },
  config: { duration: 800, easing: easings.easeOutCubic }
});

<animated.span>{number.to(n => Math.floor(n).toLocaleString())}</animated.span>
```

### Page / route transitions
```jsx
// Keep page transitions subtle — users are navigating, not watching a show
// Fade only (most appropriate for dashboards and apps)
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.15 }}
>
  <PageContent />
</motion.div>

// Slide up (appropriate for mobile, settings pages, detail views)
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
```

---

## Staggered animations (list reveals)

For landing pages and feature sections — items appearing one after another:

```jsx
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }  // 80ms between each item
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {features.map(f => (
    <motion.li key={f.id} variants={item}>
      <FeatureCard {...f} />
    </motion.li>
  ))}
</motion.ul>
```

**Stagger rules:**
- 60–100ms between items is the sweet spot — faster feels glitchy, slower feels broken
- Only animate the first screenful of items — don't stagger items below the fold
- Only use on landing pages and first-load experiences — never on data tables or repeated interactions

---

## Optimistic UI animation

```jsx
// When user deletes an item — animate it out immediately, don't wait for API
const handleDelete = async (id) => {
  // 1. Animate item out immediately (optimistic)
  setItems(prev => prev.filter(item => item.id !== id));

  try {
    await deleteItem(id);
    toast.success("Deleted successfully");
  } catch (error) {
    // 2. Restore if error
    setItems(prev => [...prev, restoredItem]);
    toast.error("Failed to delete. Please try again.");
  }
};

// Item exit animation with Framer Motion
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <ListItem item={item} onDelete={handleDelete} />
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Reduced motion — always respect it

```jsx
// HeroUI + Framer Motion handle this automatically
// For custom animations:
import { useReducedMotion } from "framer-motion";

const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={{ opacity: 1, y: shouldReduceMotion ? 0 : 0 }}
  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
  transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
>
```

```css
/* CSS approach */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Animation anti-patterns

- **Animating on every hover** — save hover animations for interactive elements that benefit from them (cards, buttons); not every div
- **Bouncy/spring animations on UI elements** — springs feel playful; dashboards and productivity apps should feel crisp and direct
- **Animating large layout changes** — animating `width`, `height`, or `grid-template` causes jank; use `transform` instead
- **Entrance animations on everything** — if the whole page animates in, nothing feels special
- **Long animations on repeated actions** — a delete animation at 500ms feels fine once; after the 10th time it's infuriating
- **Animations that block interaction** — users should be able to click/type before animations finish