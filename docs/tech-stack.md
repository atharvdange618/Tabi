# Tech Stack

## Frontend

| Technology              | Version         | Role                                             |
| ----------------------- | --------------- | ------------------------------------------------ |
| **Next.js**             | 16 (App Router) | Framework routing, SSR, metadata API             |
| **React**               | 19              | UI rendering                                     |
| **TypeScript**          | 5.x             | Type safety across the entire client codebase    |
| **Tailwind CSS**        | 4.x             | Styling utility-first, no CSS files              |
| **shadcn/ui**           | latest          | Component primitives (Dialog, Tabs, Badge, etc.) |
| **TanStack Query**      | v5              | Server state management, caching, mutations      |
| **Zustand**             | v5              | Client UI state (active tab, sidebar, palette)   |
| **React Hook Form**     | v7              | Form state management                            |
| **Zod**                 | v4              | Schema validation shared with server             |
| **Axios**               | v1              | HTTP client with Clerk JWT interceptor           |
| **Clerk (Next.js SDK)** | latest          | Authentication UI components + session           |
| **Sonner**              | latest          | Toast notifications                              |
| **Lucide React**        | latest          | Icon library                                     |

---

## Backend

| Technology                | Version | Role                                          |
| ------------------------- | ------- | --------------------------------------------- |
| **Bun**                   | latest  | JavaScript runtime (replaces Node.js)         |
| **Express.js**            | v5      | HTTP server and routing                       |
| **TypeScript**            | 5.x     | Type safety across the entire server codebase |
| **Mongoose**              | 9.x     | MongoDB ODM schemas, models, query layer      |
| **Clerk (Express SDK)**   | latest  | JWT verification middleware                   |
| **Zod**                   | v4      | Request body validation middleware            |
| **Multer**                | v2      | Multipart form data parsing for file uploads  |
| **Cloudinary SDK**        | v2      | File upload and management                    |
| **Resend**                | latest  | Transactional email (invite emails)           |
| **Helmet**                | v8      | Security headers (CSP, HSTS, X-Frame-Options) |
| **HPP**                   | latest  | HTTP Parameter Pollution protection           |
| **cors**                  | v2      | Cross-origin request configuration            |
| **Vitest**                | v4      | Test runner                                   |
| **Supertest**             | v7      | HTTP integration testing                      |
| **mongodb-memory-server** | latest  | In-memory MongoDB for isolated tests          |

---

## Database

| Technology                       | Role                                             |
| -------------------------------- | ------------------------------------------------ |
| **MongoDB Atlas** (M0 free tier) | Primary database 14 collections                  |
| **Mongoose**                     | Schema enforcement, query API, index definitions |

**14 Collections:** `users`, `trips`, `trip_members`, `pending_invites`, `days`, `activities`, `comments`, `checklists`, `checklist_items`, `files`, `reservations`, `budget_settings`, `expenses`, `settlements`

---

## Infrastructure & External Services

| Service           | Platform       | Purpose                                              |
| ----------------- | -------------- | ---------------------------------------------------- |
| **Client**        | Hostinger KVM2 | Next.js frontend hosting, co-located with API server |
| **API Server**    | Hostinger KVM2 | Persistent Express/Bun process                       |
| **Database**      | MongoDB Atlas  | Managed MongoDB, M0 free cluster                     |
| **Auth**          | Clerk          | Authentication, session management, user webhooks    |
| **Media Storage** | Cloudinary     | File uploads and CDN delivery                        |
| **Email**         | Resend         | Transactional invite emails                          |

---

## Shared Code

| Path                          | Contents                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| `shared/types/index.ts`       | TypeScript interfaces for all 14 collections + API response types |
| `shared/validations/index.ts` | Zod schemas for all create/update payloads                        |

Both client and server import from `shared/` directly. No npm package publishing both live in the same monorepo and reference it via filesystem imports and TypeScript path aliases.

---

## Design System

- **Aesthetic:** Neobrutalism + pastel palette
- **Colors:** Cream `#FAFAF8`, Blue `#93CDFF`, Peach `#FFD6C0`, Mint `#B8F0D4`, Lemon `#FFF3B0`, Coral `#FFB8B8`
- **Typography:** Space Grotesk (display), DM Sans (body), JetBrains Mono (IDs and confirmation numbers), Noto Sans JP (kanji)
- **Components:** All UI built with shadcn/ui primitives + Tailwind. Inline styles are used where dynamic values can't be expressed as static Tailwind classes (e.g. computed pixel dimensions in `CalendarView`, progress bar widths, animation delays). No separate CSS files.
