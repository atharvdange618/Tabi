# Project Learnings

## The Permission System Pays Off Later

Building the full middleware stack: `requireAuth` → `resolveDbUser` → `requireMembership` → `requireRole` before building any feature felt like over-engineering at first. It wasn't. Every feature added after that expenses, files, checklists, reservations inherited the permission model for free. Adding a new protected route is two lines: apply `requireMembership`, optionally apply `requireRole(['owner', 'editor'])`. There was never a moment of "oh, we need to add auth to this" because it was already there.

The lesson: invest in cross-cutting infrastructure early. It's not premature optimization. It's laying a floor everyone else builds on top of.

---

## Shared Schemas Are Worth the Setup Cost

Putting Zod schemas in a `shared/` directory that both the client and server import felt like extra setup at the start. But the moment a schema changed say, adding a `travelerCount` field to the create trip payload it was one change in one file and both layers updated simultaneously. No "I updated the server validation but forgot the client" bugs. No divergence.

The pattern: one `shared/validations/index.ts` file exported via the `shared` workspace package (`"name": "shared"` in `shared/package.json`). The Next.js client imports it as a package (`from "shared/validations"`), and Express uses a relative import (`../../../shared/validations/index.ts`). Works with both Bun and the Next.js build without any extra bundling config.

---

## The Dual-Path Invite System Was More Complex Than Expected

The invite flow started simple: send email, user clicks link, they join. Then the edge cases appeared. What if the email belongs to someone who already has an account? What if it doesn't? What if the token expires? What if the same person is invited twice?

The solution `pending_invites` for unknown emails, `trip_member status: "pending"` for existing users was the right one, but it took two iterations to land on. The first approach (only `pending_invites` for everyone) created orphaned pending_invite records for existing users and made the accept flow awkward. The second approach (check for existing user on invite, route accordingly) is cleaner but requires more up-front work.

The learning: model your edge cases before writing a single line of the happy path.

---

## Bun + Express Is Production-Ready

There was genuine uncertainty about whether Bun would cause issues with Express and the Node.js ecosystem. It didn't. Bun's Node.js compatibility layer handled Express, Mongoose, Multer, Clerk's SDK, and every other library without issues. Cold starts are noticeably faster than Node.js on the same hardware, and memory usage is lower.

The one nuance: Bun's `Bun.serve()` is not used here Express is still the server abstraction, just running inside Bun's runtime. That distinction matters if you're looking at Bun's native HTTP docs and wondering why things look different.

---

## 403 vs 404: Knowing What Your Middleware Actually Returns

The authorization middleware returns **403** for non-members, not 404. A 404 is only produced for a genuinely invalid MongoDB ObjectId via the CastError catch path a separate concern entirely.

This matters for client-side error handling: a 403 means "you don't have access", a 404 means "invalid ID". The client can and should differentiate these. Assuming both collapse to 404 would lead to misleading error states for the user.

---

## MongoDB's Lack of Foreign Keys Is Fine, Until It Isn't

For most of this project, not having foreign key constraints didn't matter. All writes go through a single Express API, so there's no risk of a rogue process writing invalid references. The service layer enforces referential integrity manually.

Where it became real work: cascade deletes. When a trip is deleted, 11 collections need to be cleaned up. In PostgreSQL, `ON DELETE CASCADE` on the foreign keys handles this. In MongoDB, you write a `deleteTripCascade` service function that manually deletes from each collection in sequence. It's not hard but it's explicit code that needs to be maintained, and it needs tests to verify it actually runs. That's the honest trade-off with MongoDB's document model at this scale.

---

## Next.js App Router Needs `'use client'` More Than Expected

Several libraries that seemed "compatible" with the App Router turned out to need `'use client'` wrappers because they access browser APIs internally. Recharts (`useEffect` for responsive containers), react-day-picker (event listeners), and a few shadcn components needed wrapper files before they could be used in Server Components or server-rendered layouts.

The pattern used: `'use client'` is added directly at the top of each feature component that needs it `BudgetTab.tsx`, `ItineraryTab.tsx`, `ReservationsTab.tsx`, etc. There is no centralized `client-wrappers/` directory; the boundary is declared at the component level where it's actually needed.

---

## What Would Be Done Differently

**Real-time updates with WebSockets.** The current architecture is request-response only. Multiple users editing the same trip simultaneously see each other's changes only on the next fetch or after a mutation invalidates the query cache. A WebSocket layer (Socket.io or a Hono WebSocket adapter on the API) would make collaboration genuinely real-time. This was deferred due to time, not complexity.

**Optimistic updates on more mutations.** Currently optimistic updates are only used for activity reordering and checklist toggling. They should also cover expense creation and file uploads the UI feedback would be noticeably snappier.

**Rate limiting on the invite endpoint.** The invite endpoint sends emails and creates database records. It currently has no rate limiting beyond what Clerk's JWT verification provides. A simple `express-rate-limit` on that specific route would prevent spam.
