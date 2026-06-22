---
name: project-structure
description: Exhaustive map of the project's directory structure, explaining the purpose of every folder and subfolder within src. Includes coding patterns and samples.
---

# Project Structure Guide

This project is a REST-based web application built with **TanStack Start**, **HeroUI v3**, and **React Query**. It follows a strictly feature-oriented architecture.

## Root Source Directory (`src/`)

### 📂 `src/api/`
Handles the global communication layer.
- `api-client.ts`: Contains the `authenticatedFetch` and `apiFetch` wrappers. Handles global token injection, automatic 401 token refresh logic, and status code baseline handling.

### 📂 `src/components/`
Shared, domain-unaware UI components.
- `layout/`: Global structure components (e.g., `Header`, `Footer`).
- `feedback/`: Standardized status indicators like `QueryErrorState.tsx` (for fetch errors), `SkeletonLoader.tsx` (for loading states), and `NotFound.tsx`.
- `ThemeToggle.tsx`: Global dark/light mode switcher.

### 📂 `src/config/`
Centralized application-wide configurations.
- `navigation.config.ts`: The single source of truth for all menu items, role-based visibility, and post-login redirection (`getDefaultRoute`).
- `query-client.ts`: Configuration for the TanStack Query client (stale times, retries).
- `seo.config.ts`: Configuration for page metadata and titles.

### 📂 `src/errors/`
Standardized error handling and logging.
- `errors.ts`: Defines custom error classes like `UnauthorizedError` and `ForbiddenError`.
- `handler.ts`: Reusable logic to parse backend error payloads and display toasts.
- `logger.ts`: Client-side error logging wrapper (can be connected to Sentry/LogRocket).

### 📂 `src/features/`
Feature-scoped logic, components, and state. This is where most domain-specific code lives.

#### `📂 src/features/auth/` (Sample Feature)
- `api/`: Endpoint-specific fetcher calls (`auth.api.ts`).
- `components/`: UI components exclusive to auth (`LoginForm.tsx`, `RegisterForm.tsx`).
- `config/`: Feature-specific constants or API configurations (`api.config.ts`).
- `functions/`: Server-side functions (e.g., `auth.functions.ts` for TanStack Start auth guards).
- `hooks/`: Feature-specific React Query hooks (`use-auth-queries.ts`, `use-auth-mutations.ts`) and centralized keys (`auth.keys.ts`).
- `lib/`: Feature-specific library setups (e.g., JWT decoding logic).
- `store/`: Zustand stores for local UI state (NOT server data).
- `types/`: TypeScript interfaces for the domain (`auth.types.ts`).
- `utils/`: Domain-specific utility functions (`token.utils.ts`).
- `validations/`: Zod schemas for forms and data validation.

### 📂 `src/hooks/`
Exclusively for global React hooks used across multiple different features.
- `use-media-query.ts`: Hook for responsive screen size detection.
- `use-outside-click.ts`: Hook to handle interactions outside a target element.

### 📂 `src/routes/`
TanStack Start file-based routing directory.
- `__root.tsx`: The master layout that wraps every page.
- `index.tsx`: The landing page route.
- `sign-in.tsx` / `sign-up.tsx`: Authorization routes.
- `unauthorized.tsx`: Access denied page.
- `profile/`: Folder for sub-routes related to user settings.
- `dashboard/`: Folder for sub-routes related to the main application dashboard.

### 📂 `src/store/`
Global UI state stores managed with **Zustand**.
- `auth.store.ts`: High-level persistent auth state (accessToken, etc.).
- `ui.store.ts`: Global UI state like theme mode and sidebar toggles.

### 📂 `src/types/`
Global TypeScript definitions.
- `enums.ts`: Standardized application enums (e.g., `UserType`, `UserStatus`).
- `common.types.ts`: Shared utility types (e.g., `ApiResponse<T>`).

### 📂 `src/utils/`
Stateless utility functions.
- `config.ts`: High-level app constants like `USER_ROLES`.
- `helpers.ts`: Pure functions for formatting (dates, phone numbers).
- `cn.ts`: Standard class-merging utility using `clsx` and `tailwind-merge`.

### 📄 Global Source Files
- `constants.ts`: Large static data arrays (e.g., Philippine regions or product categories).
- `env.ts`: Environment variable validation schema.
- `styles.css`: Main Entry point for Tailwind CSS v4 and HeroUI imports.

---

## Standardized Coding Patterns

### 1. Centralized Query Keys
Every feature must have a `keys.ts` file to organize query identification.

```typescript
// src/features/my-feature/hooks/my-feature.keys.ts
export const queryKeys = {
  feature: {
    all: ["feature"] as const,
    list: () => [...queryKeys.feature.all, "list"] as const,
    detail: (id: string) => [...queryKeys.feature.all, "detail", id] as const,
  },
} as const;
```

### 2. Feature Queries & `queryOptions`
Use `queryOptions` for better reusability and pre-fetching support.

```typescript
// src/features/my-feature/hooks/use-my-feature-queries.ts
import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchItems } from "../api/my-feature.api";
import { queryKeys } from "./my-feature.keys";

export const getItemsQueryOptions = () => {
  return queryOptions({
    queryKey: queryKeys.feature.list(),
    queryFn: fetchItems,
    staleTime: 5 * 60 * 1000,
  });
};

export const useItems = () => useQuery(getItemsQueryOptions());
```

### 3. Server-Side Route Protection
TanStack Start uses `beforeLoad` functions to authorize routes before the UI renders.

```typescript
// src/routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";
import { resolveAuthFn } from "@/features/auth/functions/auth.functions";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await resolveAuthFn(); // Validates tokens and role server-side
    if (!user) throw redirect({ to: "/" });
    return { user };
  },
});
```
