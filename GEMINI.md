# GEMINI.md

Read this file at the start of every session.
If `PROJECT_CONTEXT.md` exists in the project root, read it immediately after.
If `PROJECT_CONTEXT.md` does not exist, stop and tell the user to run project-agent first.

---

## Core Principles — Apply Before Any Action

These rules govern every agent in this pipeline without exception:

1. **Action plan before code** — always output a plan and wait for **"Proceed"**
2. **Read before write** — scan every relevant existing file before proposing changes
3. **Exact scope** — implement only what is explicitly asked; no additions, no omissions
4. **No assumptions** — if something is not in `PROJECT_CONTEXT.md` or a spec file, ask
5. **Stack is fixed** — never suggest installing new packages without flagging it first
6. **Stay in your lane** — each agent owns its domain; never cross into another agent's territory
7. **No file path comments** — never add `// path/to/file.ts` as the first line of any generated file
8. **Windows terminal** — all shell commands must use PowerShell syntax, not bash
9. **One component per file** — never define multiple components or inline a component inside a page file
10. **Read HeroUI docs first** — read `AGENTS.md` then `.heroui-docs/[component].md` before any HeroUI component
11. **Never touch `auth.prisma`** — better-auth base models are sacred

---

## Stack (Fixed — Do Not Change)

This project is cloned from a pre-configured base repo. Everything is already installed.

| Concern | Library / Tool |
|---------|---------------|
| Framework | TanStack Start (React, file-based routing) |
| UI Components | HeroUI v3 — always first; custom only if HeroUI cannot do it |
| Styling | Tailwind CSS v4 — CSS-first, `src/styles.css` |
| Auth | better-auth — email + password pre-configured |
| Validation | Zod |
| Global State | Zustand |
| Animations | HeroUI v3 native CSS animations |
| Forms | react-hook-form + Zod |
| Dates | Moment.js |
| E2E Testing | Cypress |
| Unit Testing | Vitest |
| Database | PostgreSQL + Prisma (multi-file schema in `prisma/models/`) |
| Architecture | Monolith (full-stack, single codebase) |
| API Layer | tRPC — all data queries and mutations |
| Route Guards | `createServerFn` — auth/role checks only, never data fetching |
| Icons | Lucide React |

---

## Responsibility Split — tRPC vs createServerFn

| Concern | Tool | Where |
|---------|------|-------|
| Data queries (GET) | tRPC `query` | `src/integrations/trpc/routers/[feature].router.ts` |
| Data mutations (create, update, delete) | tRPC `mutation` | `src/integrations/trpc/routers/[feature].router.ts` |
| Auth check (is user logged in?) | `assertAuthenticatedFn` | `beforeLoad` in route file |
| Role check (is user allowed?) | `assertAuthenticatedRoleFn` | `beforeLoad` in route file |
| Redirect logged-in users | `redirectAuthenticatedUserFn` | `beforeLoad` in route file |

**Never use tRPC for auth checks. Never use createServerFn for data fetching.**

---

## Project Structure (Fixed)

```
src/
  styles.css                    ← Tailwind v4 + HeroUI imports, @theme block, fonts

  config/
    navigation.config.ts        ← all nav items with role visibility — never hardcode in components
    query-client.ts             ← TanStack Query client instance + global config
    seo.config.ts               ← all SEO/meta — update here, never in route files

  integrations/
    tanstack-query/
      root-provider.tsx         ← TanStack Query provider setup
    trpc/
      init.ts                   ← createTRPCRouter, publicProcedure, protectedProcedure
      react.ts                  ← useTRPC() hook — client-side tRPC access
      router.ts                 ← root router — registers all feature routers
      routers/
        [feature].router.ts     ← one file per feature

  components/                   ← shared, feature-unaware UI components
    ThemeToggle.tsx
    NotFound.tsx
    feedback/
      QueryError.tsx            ← global fetch error + retry — use for ALL isError states

  errors/
    AppError.ts
    ErrorBoundary.tsx           ← wrap every feature-level component
    error-messages.ts

  hooks/                        ← global hooks with no feature dependency
    use-debounce.ts
    use-media-query.ts
    use-outside-click.ts

  store/                        ← app-level Zustand (cross-feature)
    auth.store.ts
    ui.store.ts

  types/
    api.types.ts                ← ApiResponse<T>, PaginatedResponse<T>
    auth.types.ts               ← Session, User (from better-auth)
    common.types.ts             ← shared enums: Role, Status

  utils/
    cn.ts                       ← Tailwind class merge utility
    config.ts                   ← USER_ROLES and app-wide constants
    format.ts                   ← date (moment), currency, truncation helpers

  features/
    auth/                       ← pre-configured — do not recreate any part of this
      functions/
        auth.functions.ts       ← assertAuthenticatedFn, assertAuthenticatedRoleFn,
                                   redirectAuthenticatedUserFn
      hooks/
        useAuth.ts              ← useAuth() — client-side session access
      lib/
        session.ts              ← getSession() via better-auth + getRequestHeaders
      utils/
        better-auth.ts          ← better-auth instance config

    [feature]/
      components/               ← feature-scoped UI (one component per file)
      hooks/
        use-[actor]-[feature]-queries.ts
        use-[actor]-[feature]-mutations.ts
      store/
        [feature].store.ts      ← feature-scoped Zustand (UI state only — not server data)
      types/
        index.ts
      validations/
        schema/
          create-[feature].schema.ts
          update-[feature].schema.ts
        rules/
          [feature].rules.ts
      config/
        [feature].config.ts     ← enums, constants, dropdown options for this feature

  routes/                       ← TanStack Start file-based page routes (thin — no logic)

prisma/
  models/
    schema.prisma               ← generator + datasource config only — never modify
    auth.prisma                 ← better-auth base models — NEVER MODIFY
    user.prisma                 ← User project field extensions only
    [feature].prisma            ← one per feature, created by backend-agent
  generated/                    ← auto-generated Prisma client — never edit manually
  seed.ts                       ← test user seeding for Cypress e2e tests
```

---

## File Suffix Conventions

| Suffix | Contains | Example |
|--------|----------|---------|
| `.router.ts` | tRPC router + Prisma queries | `orders.router.ts` |
| `.functions.ts` | `createServerFn` definitions (auth only) | `auth.functions.ts` |
| `.store.ts` | Zustand store | `orders.store.ts` |
| `.schema.ts` | Zod validation schema | `create-order.schema.ts` |
| `.config.ts` | Constants, enums, dropdown options | `orders.config.ts` |
| `.types.ts` | TypeScript types and interfaces | `auth.types.ts` |

---

## tRPC Pattern

### Router structure — Prisma called directly, no service layer

```typescript
import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure } from '../init'
import { prisma } from '@/lib/prisma'
import { CreateOrderSchema } from '@/features/orders/validations/schema/create-order.schema'

export const ordersRouter = {
  list: publicProcedure
    .query(async () => {
      return prisma.order.findMany({ orderBy: { createdAt: 'desc' } })
    }),

  myOrders: protectedProcedure
    .query(async ({ ctx }) => {
      return prisma.order.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
      })
    }),

  create: protectedProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ input, ctx }) => {
      return prisma.order.create({
        data: { ...input, userId: ctx.user.id },
      })
    }),
} satisfies TRPCRouterRecord
```

### Register every new router in `src/integrations/trpc/router.ts`

```typescript
import { ordersRouter } from './routers/orders.router'

export const trpcRouter = createTRPCRouter({
  orders: ordersRouter,
})
```

### Procedure types

| Procedure | Use when |
|-----------|----------|
| `publicProcedure` | No auth required — public data |
| `protectedProcedure` | Auth required — `ctx.user` is available |

### Query keys — always from tRPC, never manual

```typescript
queryClient.invalidateQueries({ queryKey: trpc.orders.list.queryKey() })
await context.queryClient.prefetchQuery(context.trpc.orders.list.queryOptions())
```

**Never create manual `query-keys.ts` files for tRPC procedures.**

Hook naming: `use-[actor]-[feature]-queries.ts` / `use-[actor]-[feature]-mutations.ts`

---

## Prisma Rules

- Import: `import { PrismaClient } from 'prisma/generated/client'` — never `@prisma/client`
- Schema files live in `prisma/models/` — one file per domain
- `prisma/models/auth.prisma` — better-auth base models — **NEVER TOUCH**
- `prisma/models/user.prisma` — User project field extensions only
- `prisma/models/schema.prisma` — generator + datasource config — **NEVER TOUCH**
- New feature models → create `prisma/models/[feature].prisma`
- Every new model must have `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- All FK relations must have explicit relation names

---

## HeroUI v3 Rules

**Before writing any HeroUI component — in this exact order:**
1. Read `AGENTS.md` at the project root
2. Read `.heroui-docs/[component].md` for the specific component being used

Never guess v3 API from memory. v3 changed significantly from v2.

### v2 patterns that are WRONG in v3

| v2 (never use) | v3 (correct) |
|----------------|-------------|
| `<HeroUIProvider>` | No provider needed — removed |
| `classNames={{ base: '...' }}` | `className="..."` — single prop only |
| `useSwitch()`, `useInput()` | Compound components — hooks removed |
| `useDisclosure()` | `useOverlayState()` |
| `<Avatar>` | `<Avatar.Root>` |
| `border-small`, `rounded-small` | `border`, `rounded-sm` — standard Tailwind |
| Framer Motion | Native CSS animations built into v3 |
| `primary` color | `accent` — color system renamed |

### Component quick reference

| Need | HeroUI v3 |
|------|-----------|
| Data list | `<Table>` |
| Overlay | `<Modal>` |
| Text input | `<TextField>` |
| Select | `<Select>` |
| Checkbox | `<Checkbox>` |
| Radio | `<RadioGroup>` |
| Alerts/feedback | `<Alert>`, `<Badge>` |
| Navigation | `<Tabs>`, `<Breadcrumbs>`, `<Navbar>` |
| Action | `<Button>`, `<Dropdown>` |
| Content loading | `<Skeleton>` — shaped like the content |
| Action loading | `<Spinner>` — buttons and inline actions only |

---

## Theming & Branding

Colors live in `src/styles.css` under `@theme`. Set per project by project-agent.

| Variable | Tailwind Class | Usage |
|----------|---------------|-------|
| `--color-app-base` | `bg-app-base` / `text-app-base` | Page and surface backgrounds |
| `--color-app-brand` | `bg-app-brand` / `text-app-brand` | CTAs, active states, navigation |
| `--color-app-secondary` | `bg-app-secondary` / `text-app-secondary` | Buttons, success states, tags |
| `--color-app-accent` | `bg-app-accent` / `text-app-accent` | Badges, highlights, indicators |

- Always use `app-*` Tailwind classes — never raw hex values anywhere
- `app-brand` only on CTAs and active states — not on labels, backgrounds, or icons
- If `PROJECT_CONTEXT.md` branding values are still placeholder colors — stop and ask user to run project-agent first

---

## Navigation & Menu Pattern

`src/config/navigation.config.ts` is the single source of truth for all menus.
Never hardcode navigation links or role checks in components.

```typescript
const menu = getNavigation(user.role) // filters by role, including children
```

---

## SEO & Metadata Pattern

`src/config/seo.config.ts` is the single source of truth for all page meta.
Never hardcode title or meta values directly in route files.

```typescript
import { seo } from '@/config/seo.config'

head: () => ({
  meta: [
    { title: seo.title('Dashboard') },
    { name: 'robots', content: 'noindex' }, // all protected pages
  ],
})
```

---

## Auth & Route Protection Pattern

Auth lives at `src/features/auth/` — pre-configured, do not recreate any file.

```typescript
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    return await assertAuthenticatedRoleFn({
      data: { allowedRoles: [USER_ROLES.ADMIN] },
    })
  },
})
```

| Function | Purpose |
|----------|---------|
| `assertAuthenticatedFn` | Session check — throws `notFound()` if no session |
| `assertAuthenticatedRoleFn` | Session + role check — redirects to `/unauthorized` |
| `redirectAuthenticatedUserFn` | Redirects logged-in users away from public pages |

- Protection always in `beforeLoad` — never in component body or loader
- Client session access: `useAuth()` — never call `getSession()` in a component
- Role values: always `USER_ROLES.X` from `@/utils/config` — never hardcode strings

---

## Component & Data State Rules

- **One component per file** — every component listed in a spec gets its own file
- **Page files are thin** — route files only compose components, handle auth/SEO/loader
- **Loading** — every data-fetching component renders `<Skeleton>` shaped like the content
- **Error** — every data-fetching component renders `<QueryError>` from `src/components/feedback/`
- **Empty** — every list component renders an empty state: icon + heading + CTA
- **ErrorBoundary** — every feature-level component is wrapped in `<ErrorBoundary>`

```
src/routes/feature/index.tsx
  └── function FeaturePage()
       ├── <ErrorBoundary>
       │     └── <FeatureTable />     ← Skeleton → data | QueryError
       └── <ErrorBoundary>
             └── <FeatureForm />
```

---

## Agent Pipeline

| Agent | File | When to Use |
|-------|------|-------------|
| **Project Agent** | `.agents/project-agent.md` | First on every new project |
| **Spec Agent** | `.agents/spec-agent.md` | After project-agent |
| **Backend Agent** | `.agents/backend-agent.md` | After spec-agent |
| **Frontend Agent** | `.agents/frontend-agent.md` | After backend-agent |
| **Unit Test Agent** | `.agents/unit-test-agent.md` | After BOTH backend + frontend complete |
| **E2E Test Agent** | `.agents/e2e-test-agent.md` | After frontend-agent |
| **Clean Code Agent** | `.agents/clean-code-agent.md` | Anytime |

```
project-agent → spec-agent → backend-agent → frontend-agent
                                  ↓                ↓
                           unit-test-agent   e2e-test-agent
                                                    ↕
                                            clean-code-agent
```

---

## Reference Files

```
.agents/
  references/
    webdesign/              ← frontend-agent loads on demand per task
      layout-composition.md
      color-system.md
      color-usage.md
      typography.md
      spacing.md
      dashboard.md
      ux-patterns.md
      polish.md
      junior-vs-senior.md
      responsive.md
      components.md
      accessibility.md
      animation.md
      landing-page.md

.heroui-docs/               ← frontend-agent loads per component used
  AGENTS.md                 ← always read first before any HeroUI component
  [component].md            ← read the specific file for each component
```