# Project Approach

## Starting Point: Define the Problem Precisely

The temptation with a "collaborative trip planner" is to build something generic. I deliberately narrowed the scope to one specific pain point: **the communication overhead of planning a group trip**. The WhatsApp chaos, the shared spreadsheet nobody maintains, the post-trip money awkwardness. Tabi is built to eliminate exactly those three things not to be a travel discovery or booking platform.

This constraint shaped every technical decision that followed.

---

## Architecture Decision: Separate API, Not Next.js API Routes

The first real decision was whether to use Next.js API routes or a separate Express server. I went with a separate Express server running on Bun for three reasons:

**Independent deployment.** Both the API and frontend run on Hostinger KVM2. This means both can be managed from a single server, simplifying deployment and eliminating cross-platform CORS complexity.

**Explicit middleware control.** The security middleware stack `helmet()` → `hpp()` → `cors()` → `express.json()` → `clerkMiddleware()` → `requireAuth` → `resolveDbUser` → `requireMembership` → `requireRole` → `validate(schema)` needs to be explicit, ordered, and testable. Next.js API routes don't provide this level of control. Express does.

**Testability.** The Express `app` object can be imported directly by Supertest without starting a server, making integration tests fast and without port conflicts. This matters for writing reliable tests around the permission system.

The trade-off is two deployment pipelines and CORS configuration. That's an acceptable cost for a project of this scope.

---

## Authorization: 403 for Non-Members

When a user requests a trip they're not a member of, the API returns **403**. A 404 is only returned when the URL contains an invalid MongoDB ObjectId (a `CastError`), which is a separate concern handled in the error catch path.

Since trip IDs are MongoDB ObjectIds (not sequential integers), enumeration is hard already. The `requireMembership` middleware returns 403 for "you're not a member" and relies on the CastError handler returning 404 for genuinely non-existent trip IDs.

---

## State Management: Three Domains, Three Tools

The client state is split into exactly three non-overlapping domains:

**Server state** → TanStack Query. Everything fetched from the API. Trips, days, activities, members, expenses, files. Mutations go through `useMutation` and invalidate the appropriate query keys on success. A centralized key factory (`lib/queryKeys.ts`) ensures consistent cache invalidation across the app.

**UI state** → Zustand. Things that don't come from the server: which day tab is active, whether the sidebar is open, command palette state. Lightweight, no reducers, no boilerplate.

**Form state** → React Hook Form + Zod. Every form is uncontrolled until submit, validated against the same Zod schemas that the server uses. The shared schema lives in `shared/validations/` it's imported by both the Next.js client and the Express server, so client and server validation are never out of sync.

These three tools never cross their domain boundaries. That constraint is enforced by convention, but it's stated explicitly in the codebase architecture notes so every contributor knows the rule.

---

## Invite System: Two Paths

The invite system has a complexity worth explaining. There are two fundamentally different cases:

**Case 1: Inviting an existing Tabi user.** A `trip_member` document is created with `status: "pending"`. An email is sent with accept/decline links. When accepted, the status flips to `"active"`. Simple.

**Case 2: Inviting someone who doesn't have a Tabi account yet.** Creating a pending `trip_member` record for a user that doesn't exist yet would require creating a placeholder user record, which creates orphaned data if they never sign up. Instead, a `pending_invite` document is created with a signed token and the invitee's email. When they sign up via Clerk and accept the invite, the `pending_invite` is looked up by token, the user's email is matched, and they're added as a member. The token expires after 7 days and is invalidated on use.

This dual-path approach avoids polluting the users collection with accounts for people who may never join.

---

## File Uploads: Always Proxied

Files never go client → Cloudinary directly. Every upload goes client → Express → Cloudinary. This is a deliberate choice:

1. Cloudinary credentials never leave the server.
2. The server can enforce MIME type validation before the upload reaches Cloudinary.
3. The server creates the file document in MongoDB atomically with the Cloudinary upload, so there's no window where Cloudinary has the file but the database doesn't.

When a file is deleted, the server calls `cloudinary.uploader.destroy()` with the `public_id` before removing the database record.

---

## Database: Index-First Design

The database indexes weren't an afterthought. The access patterns were defined first, and indexes were designed around them:

The hottest query in the system "is this user a member of this trip?" runs on every single authenticated request to a trip resource. The compound index `{ tripId: 1, userId: 1 }` on `trip_members` serves this query and also enforces the uniqueness constraint. One index, two jobs.

The dashboard query ("all active trips for this user") hits `trip_members` with `{ userId: 1, status: 1 }` not the `trips` collection. The client doesn't fetch trips by `createdBy`; it fetches trip memberships first, then populates the trip details. This means the `trip_members` collection is the access gateway for nearly all trip data.

---

## What Was Built First

The development order was intentional:

1. **Auth + middleware stack first.** Get Clerk integration, JWT verification, `resolveDbUser`, `requireMembership`, and `requireRole` working before building any feature. Every subsequent feature inherits a solid permission system for free.
2. **Trip CRUD + member management.** The core entity and the invite/accept flow.
3. **Itinerary.** Days auto-generated on trip creation, activities per day, drag-to-reorder.
4. **Budget.** Expense logging, category breakdown.
5. **Files, checklists, reservations.** Parallel features that share the same permission infrastructure.
6. **Frontend.** Built on top of stable API contracts, not simultaneously with them.

This order meant the permission model was never retrofitted it was there from the first route.
