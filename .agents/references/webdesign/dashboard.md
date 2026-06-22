# Dashboard Design

Dashboards are different from landing pages and marketing sites. They are **tools** — they should prioritize usability and information clarity above aesthetics and brand expression.

---

## Sidebar structure

The sidebar is the spine of the product. It houses persistent, globally relevant elements.

**Top-to-bottom order:**
1. Logo or profile management (profile picture + dropdown arrow = clickable affordance)
2. Primary navigation links (icon + short label)
3. Secondary/grouped links (group by relevance)
4. Settings and help → bottom (rarely used)

**Nav link design:**
```html
<!-- Icon + label pattern — enables collapsible sidebar and badges -->
<a class="nav-link" href="/dashboard">
  <svg class="nav-icon">...</svg>
  <span class="nav-label">Dashboard</span>
  <span class="nav-badge">3</span>  <!-- notification count or "new" chip -->
</a>
```

**Collapsible sidebar:** When collapsed, show icon only — requires universally recognizable icons for all nav items. Always show active state indicator (rectangle, border-left accent, or background highlight).

**Nesting:** As link count grows, nest into dropdowns. Never show all links flat — cognitive load increases linearly with link count.

---

## Main dashboard layout principles

**Content reflects user priorities.** What goes in the main section should be the most important thing for that specific tool:
- Project management → project status
- Finance → investments and balance
- Link tracker → recent links + click metrics

**Typography is smaller and denser than landing pages:**
```css
/* Dashboard body text — smaller base */
--text-base: 0.875rem;  /* 14px instead of 16px */
--text-sm:   0.75rem;   /* 12px for metadata */
```

**Grids are followed strictly** — nearly all screen space is used, so alignment matters more.

**Top bar:** Reserved for important page actions or simple navigation only. Keep it minimal — every pixel in the top bar steals from content area.

**Keep displayed data simple:**
- Favicon + shortened link + actual URL + timestamp + click count
- Brief description for context (GitHub pattern)
- Avoid showing too many columns — users can click through for detail

---

## The 4 dashboard components

Master these four and you can build virtually any dashboard page:

### 1. Lists and tables
Most common component. Three ways to create separation between rows:
- **Space** — preferred; simplest, least visual noise
- **Lines/dividers** — use sparingly; only when spacing alone isn't enough
- **Alternating background color** — for dense tables where spacing is tight

Tables need interactivity to be useful:
```html
<div class="table-toolbar">
  <input type="search" placeholder="Search...">
  <select><!-- Filter --></select>
  <button><!-- Sort --></button>
</div>
<table>...</table>
```

Bulk action pattern: selecting multiple rows reveals a contextual action bar — a micro-interaction that scales functionality without cluttering the default view.

### 2. Cards
Includes charts, metric summaries, toast notifications. Most dashboards are comprised of many cards.

**Card separation:**
- Dark mode: use border (`border: 1px solid hsl(0,0%,18%)`)
- Light mode: use background color difference (`background: hsl(0,0%,98%)`)
- Keep margins well-spaced — tight card grids look cluttered

**Card grid:**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
```

### 3. User input
Forms, modals, settings pages. Tables with forms inside cards (Vercel pattern — powerful for settings).

### 4. Tabs
Add pages without cluttering the sidebar. Show different views of related data without losing page context (Notion pattern). Perfect for: analytics breakdowns, settings categories, data filters.

---

## Modals, popovers, toasts, and new pages

**Popover:** Simple, non-blocking. User can click away without consequences.
- Use for: display settings, quick filters, tooltips
- Triggered by: hover or click on a low-stakes control

**Modal:** More complex, blocking. User must act before continuing.
- Use for: creating/editing content that relates to what's displayed
- Always follow with a toast notification confirming the change
- Requires: clear primary action button, clear cancel/close

**Toast notification:**
- Use when making user aware of something without taking over the screen
- Perfect for: post-modal confirmations, warnings, errors, background job completion
- Frequently missed by junior designers — always include them for state-changing actions

**New page:** For permanent or large context (e.g., link detail page).
- Always include: back button or breadcrumb navigation
- Rule: if content is "permanent" (a record, a detail view), it deserves its own page

---

## Charts

**The basics every chart needs:**
- Grid lines (horizontal reference lines)
- Axis labels with numbers (both axes)
- Summary or aggregate stat at top
- Date range selector

**Bar charts:**
- Flat tops (not rounded) — rounded tops make it hard to read exact values
- Icons or favicons next to bars for identification
- Hover: show value + context bubble; dim non-hovered bars

**Line charts:**
- Hover: show exact value at cursor position with tooltip
- Clear color differentiation between multiple data series

**Anti-patterns:**
- Charts with no vertical axis → unreadable
- More bars than data points (e.g., 16 bars for 7 days)
- All bars/slices in the same brand color → nothing is distinguishable
- Rounded bar tops → can't read exact values
- Over-designed "Dribbble charts" → visually impressive, practically useless

---

## Micro-interactions on dashboards

Dashboard animations are more restrained than marketing pages — focused on function, not delight:

- **Chart hover:** value tooltip + dim other bars/lines
- **Row selection:** checkbox appears on hover, bulk action bar slides in on selection
- **Loading states:** skeleton screens preferred over spinners for content areas

**Optimistic UI** — the most impactful micro-interaction pattern for dashboards:
```
User clicks "Delete" →
  1. Item disappears from list immediately (optimistic)
  2. API request fires in background
  3. If success: nothing changes (already removed)
  4. If error: item reappears + show error toast
```
Eliminates the awkward pause between action and response. Gmail delete is the canonical example.

---

## What makes a dashboard feel slow vs fast

| Slow | Fast |
|------|------|
| Spinner on every action | Optimistic UI |
| Full page reload on filter change | Partial re-render |
| Modal opens before data loads | Open modal immediately, load data inside |
| Loading state shows for <100ms | Suppress loading indicator under 100ms |

Users want a **snappy, fast** dashboard above all else. Every perceived performance improvement increases trust and satisfaction.