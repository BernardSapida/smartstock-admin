# PROJECT_CONTEXT.md

## Identity
- **Name:** TanStack Start REST Template
- **Description:** A minimal starting template for full-rest applications using TanStack Start and REST communication.

## Branding
| Variable | Hex | Usage | Source |
|----------|-----|-------|--------|
| `--color-app-base` | #fbfff8 | Background | Default |
| `--color-app-brand` | #4fb8b2 | CTA, active states, navigation, icons | Default |
| `--color-app-secondary` | #2f6a4a | Buttons, success states, tags | Default |
| `--color-app-accent` | #328f97 | Badges, subtle highlights, indicators | Default |

- **Visual tone:** Minimal

## Roles & Permissions
| Role | Access Summary |
|------|---------------|
| User | Access public areas, login, register, view/edit their own profile. |
| Admin | Same as user, but has access to admin-only profile views. |

- **Public area:** Yes — Landing page accessible without authentication.

## Features
| Feature | Roles | MVP | Full Release |
|---------|-------|-----|-------------|
| Sign-in / Sign-up | All | ✅ | ✅ |
| User Profile | Admin, User | ✅ | ✅ |
| Role-based Protection | Admin, User | ✅ | ✅ |

## Data Entities
- **Base (setup repo):** User, Session
- **New:** None beyond base entities.

## Integrations
None

## Background Jobs
None

## Constraints
- Mobile-first responsive design.
- Consistency with project structure rules (where applicable to REST).

## Deployment
- **Target:** Netlify
