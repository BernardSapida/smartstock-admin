# Theming Setup

How to wire up a complete Tailwind v4 + HeroUI v3 theme from scratch. Get this right at the start of every project — wrong theme setup cascades into every component.

---

## Project setup order

1. Install dependencies
2. Configure Tailwind v4 CSS file
3. Configure HeroUI provider
4. Define semantic color tokens
5. Set up dark mode
6. Define typography scale
7. Verify with a test component

---

## 1. Installation

```bash
# HeroUI v3 with Tailwind v4
npm install @heroui/react framer-motion

# Tailwind v4
npm install tailwindcss @tailwindcss/vite
# or with PostCSS:
npm install tailwindcss @tailwindcss/postcss
```

---

## 2. Tailwind v4 CSS configuration

Tailwind v4 is CSS-first — no `tailwind.config.js`. Everything goes in your main CSS file:

```css
/* app/globals.css or src/index.css */
@import "tailwindcss";

@theme {
  /* ─── Typography ─── */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Type scale — rem for accessibility */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */
  --text-6xl:  3.75rem;    /* 60px */

  /* Fluid display text (landing pages) */
  --text-display-sm: clamp(2rem, 4vw, 3rem);
  --text-display:    clamp(2.5rem, 5vw, 4.5rem);
  --text-display-lg: clamp(3rem, 6vw, 5.5rem);

  /* ─── Spacing ─── */
  /* 8px base grid — all spacing is a multiple of 8 */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-20: 80px;
  --spacing-24: 96px;

  /* ─── Border radius ─── */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* ─── Breakpoints ─── */
  --breakpoint-sm:  640px;
  --breakpoint-md:  768px;
  --breakpoint-lg:  1024px;
  --breakpoint-xl:  1280px;
  --breakpoint-2xl: 1536px;

  /* ─── Shadows ─── */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.08);
  --shadow-md:  0 1px 3px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg:  0 4px 6px rgba(0,0,0,0.08), 0 10px 30px rgba(0,0,0,0.10);
  --shadow-xl:  0 8px 16px rgba(0,0,0,0.10), 0 24px 48px rgba(0,0,0,0.12);
}
```

---

## 3. HeroUI provider setup

Wrap your entire app in `HeroUIProvider`. This enables theming, accessibility, and toast notifications.

```tsx
// app/layout.tsx (Next.js App Router)
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "sonner";  // recommended toast library with HeroUI

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <HeroUIProvider>
          {children}
          <Toaster richColors position="top-right" />
        </HeroUIProvider>
      </body>
    </html>
  );
}

// For Vite/React (main.tsx)
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HeroUIProvider>
    <App />
    <Toaster richColors position="top-right" />
  </HeroUIProvider>
);
```

---

## 4. HeroUI theme configuration

HeroUI v3 uses a plugin-based theme system. Configure it in your CSS:

```css
/* globals.css — after @import "tailwindcss" */

/* HeroUI theme via plugin (if using CSS config approach) */
/* Or configure via heroui() plugin in your build tool */
```

```ts
// For Vite — vite.config.ts
import { heroui } from "@heroui/react";
import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [
    tailwindcss(),
  ],
  css: {
    // HeroUI works with Tailwind v4 CSS-first config
  }
}
```

**HeroUI color customization:**
```tsx
// main.tsx or layout.tsx
import { HeroUIProvider, createTheme } from "@heroui/react";

// Custom theme extending HeroUI defaults
const customTheme = {
  themes: {
    light: {
      colors: {
        primary: {
          50:  "#f0f4ff",
          100: "#dbe4ff",
          200: "#bac8ff",
          300: "#91a7ff",
          400: "#748ffc",
          500: "#5c7cfa",   // ← your brand color (base)
          600: "#4c6ef5",
          700: "#4263eb",
          800: "#3b5bdb",
          900: "#364fc7",
          DEFAULT: "#5c7cfa",
          foreground: "#ffffff",
        },
        // danger, warning, success stay as HeroUI defaults (system colors)
      },
    },
    dark: {
      colors: {
        primary: {
          // Same hue, adjusted for dark mode
          DEFAULT: "#748ffc",
          foreground: "#ffffff",
        },
      },
    },
  },
};
```

---

## 5. Dark mode setup

HeroUI v3 handles dark mode via a class on the `html` element. Three approaches:

### Approach A: System preference only (simplest)
```tsx
// layout.tsx — auto-detects system preference
<html className="dark" lang="en">  // or remove className for light
```

### Approach B: Toggle with localStorage (recommended for most apps)
```tsx
// hooks/useTheme.ts
import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as "light" | "dark") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme, toggleTheme: () => setTheme(t => t === "dark" ? "light" : "dark") };
}

// Usage in a toggle component
import { Switch } from "@heroui/react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Switch
      isSelected={theme === "dark"}
      onChange={toggleTheme}
      size="sm"
      aria-label="Toggle dark mode"
    />
  );
}
```

### Approach C: Next.js with next-themes (best for Next.js)
```bash
npm install next-themes
```
```tsx
// providers.tsx
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </ThemeProvider>
  );
}
```

---

## 6. Semantic color tokens

Define these once in your CSS. Use them everywhere — never hardcode colors in components.

```css
/* globals.css */
:root {
  /* Background layers (light mode) */
  --bg-base:    hsl(0, 0%, 100%);   /* page background */
  --bg-surface: hsl(0, 0%, 97%);    /* cards, panels */
  --bg-raised:  hsl(0, 0%, 94%);    /* popovers, elevated */

  /* Text (light mode) */
  --text-primary:   hsl(0, 0%, 9%);
  --text-secondary: hsl(0, 0%, 40%);
  --text-tertiary:  hsl(0, 0%, 60%);

  /* Borders */
  --border-subtle:  hsl(0, 0%, 92%);
  --border-default: hsl(0, 0%, 86%);
  --border-strong:  hsl(0, 0%, 70%);
}

.dark {
  /* Background layers (dark mode) */
  --bg-base:    hsl(220, 13%, 8%);   /* page background — not pure black */
  --bg-surface: hsl(220, 11%, 12%);  /* cards, panels */
  --bg-raised:  hsl(220, 9%, 16%);   /* popovers, elevated */

  /* Text (dark mode) */
  --text-primary:   hsl(0, 0%, 90%);   /* NOT pure white — too harsh */
  --text-secondary: hsl(0, 0%, 60%);
  --text-tertiary:  hsl(0, 0%, 40%);

  /* Borders */
  --border-subtle:  hsl(220, 9%, 18%);
  --border-default: hsl(220, 9%, 22%);
  --border-strong:  hsl(220, 9%, 30%);
}
```

---

## 7. Typography setup

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--bg-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Heading defaults */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--text-primary);
}

/* Prose / body text */
p { line-height: 1.7; color: var(--text-secondary); }
p.lead { font-size: var(--text-lg); color: var(--text-secondary); }

/* Links */
a { color: inherit; }
```

---

## 8. Global utility classes

Helpful reusable classes to define once:

```css
/* globals.css */

/* Container */
.container-page {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: 1.5rem;
}

@media (min-width: 768px) {
  .container-page { padding-inline: 2rem; }
}

/* Section spacing */
.section { padding-block: 5rem; }
.section-lg { padding-block: 7rem; }

/* Prose width */
.prose-width { max-width: 65ch; }

/* Focus ring (for custom interactive elements) */
.focus-ring {
  outline: none;
}
.focus-ring:focus-visible {
  ring: 2px solid var(--color-primary);
  ring-offset: 2px;
}
```

---

## 9. Complete starter template

```tsx
// A minimal but complete page shell with everything wired up
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <Navbar isBordered className="border-default-200">
        <NavbarBrand>
          <span className="font-semibold text-inherit">AppName</span>
        </NavbarBrand>
        <NavbarContent justify="end">
          <ThemeToggle />
          <Button color="primary" size="sm">Get started</Button>
        </NavbarContent>
      </Navbar>

      {/* Page content */}
      <main id="main-content" className="container-page py-8">
        {children}
      </main>
    </div>
  );
}
```

---

## Common setup mistakes

| Mistake | Fix |
|---------|-----|
| Using `tailwind.config.js` with v4 | Move all config to `@theme {}` in CSS |
| Wrapping only part of the app in HeroUIProvider | Wrap the entire app at the root level |
| Using `px` for font sizes | Use `rem` — allows browser font scaling |
| Hardcoding colors in components | Always use CSS variables or HeroUI color tokens |
| Not setting `suppressHydrationWarning` on `<html>` | Add it — prevents dark mode hydration mismatch in Next.js |
| Forgetting `lang` attribute on `<html>` | Always set — required for accessibility and SEO |
| Two Toaster instances | One `<Toaster />` at the app root, never inside pages |