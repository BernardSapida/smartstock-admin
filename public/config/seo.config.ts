// SEO & metadata config — update this file to manage all app-level meta.
// Per-route titles are composed as: `${page} | ${seo.name}`

export const seo = {
  // App identity
  name: 'TanstactStart Bernard',
  description: 'A premium, high-end monolith project template.',

  // Base URL — used for canonical links and OG URLs
  url: process.env.BASE_URL ?? 'http://localhost:3000',

  // Default OG image — place file in /public/og-image.png
  ogImage: '/og-image.png',

  // Twitter / X card
  twitter: {
    card: 'summary_large_image' as const,
    site: '@tanstack',   
    creator: '@tanstack',
  },

  // Title pattern — used across all routes
  // Usage: seo.title('Dashboard') → 'Dashboard | TanstactStart Bernard'
  title: (page?: string) => page ? `${page} | TanstactStart Bernard` : 'TanstactStart Bernard',
} as const
