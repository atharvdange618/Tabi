# Tabi: Collaborative Trip Planning Platform

**旅** (tabi) means _journey_ in Japanese. Not travel as in booking tickets, but the whole experience the planning, the chaos, the shared memories. That's what this app is about.

---

## What is Tabi?

Tabi is a real-time collaborative trip planning platform that solves a very specific problem: group trip planning is chaotic. There's a WhatsApp group where links get buried, a Google Sheet that only one person updates, and a post-trip "who owes who" conversation that nobody wants to have.

Tabi brings everything into one place the itinerary, the budget, the files, the checklists, and the reservations and lets the whole group plan together, with role-based access so everyone knows what they can and can't touch.

---

## Core Features

### Trip Overview

A dashboard tab that surfaces the most important trip information in one glance. Displays stat cards for trip status (upcoming/ongoing/completed with days countdown), duration, member count, and budget usage percentage. A live budget progress bar changes color as spend approaches the limit (mint → amber → red). Below the stat cards: upcoming reservations (next 3), checklist pending item count, active poll previews, and the full member roster with role badges.

### Itinerary Planning

Day-by-day planning with drag-and-drop reordering. When a trip is created with a date range, the server auto-generates Day documents for every date in the range so the skeleton exists immediately. Activities are added per day with time, duration, notes, and category.

**Time Conflict Detection**: When an activity is created or updated with a `startTime`, the server checks for overlapping time ranges against other activities on the same day. If there's an overlap, the API returns the saved activity plus a `warnings: ["time_conflict"]` array so the client can surface an alert to the user without blocking the save.

**Map View**: The itinerary tab includes an interactive map (Leaflet + OpenStreetMap) that geocodes activity locations via the Nominatim API and plots color-coded markers by activity type. Markers cluster at lower zoom levels. Clicking a marker opens a popup with the activity title, type, location, and start time.

### Real-time Collaboration

Multiple members can plan together. Changes reflect across all connected members. Role-based access controls who can edit vs. who can only view.

**Comments with Emoji Reactions**: Members can comment on specific days or individual activities. Comments support emoji reactions any member can react with an emoji, and reaction counts are shown inline.

### Polls

A dedicated tab for group decision-making. Editors and owners can create polls with a question and 2–10 options. Members vote by clicking an option the bar fills proportionally to show live vote percentages. Owners/editors can close a poll and declare a winner (automatically set to the leading option, which is overridable). Closed polls are preserved and displayed separately with the winning option marked by a trophy icon.

### Budget Tracking

A dedicated budget tab with expense logging, per-category breakdown, and a visual spending summary. Each expense records who paid, the amount, the category, and can optionally be linked to a specific activity or an uploaded file for documentation. The system tracks total planned budget vs. actual spend.

### File Management

All trip-related files (flight confirmations, hotel bookings, visa documents) are uploaded and stored centrally via Cloudinary. Files are attached to the trip not scattered across 7 different chat threads. Access is gated by trip membership, so files are private to the group.

### Checklists

Packing lists, pre-trip TODOs, anything that needs tracking before or during the trip. Per-checklist progress tracking shows completion percentage live.

### Reservations Hub

A structured log for all bookings flights, hotels, car rentals, restaurants. Each entry stores the confirmation number (displayed in monospace for readability), provider, datetime, and can be linked to an uploaded file.

### Invite System

Members are invited by email. The system handles two cases: if the invitee already has a Tabi account, a `pending` trip_member record is created and the invite is sent via Resend. If they don't have an account yet, a `pending_invite` document with a signed token is created. When they sign up and accept, the invite is resolved and they're added to the trip automatically. Token expiry is enforced at 7 days.

### Role-Based Access Control

Three roles: **Owner** (full control, can delete the trip, transfer ownership), **Editor** (can create/edit/delete content), **Viewer** (read-only). Permissions are enforced at the API level not just hidden in the UI. Direct API calls can't bypass role restrictions.

**Ownership Transfer**: Owners can transfer ownership to any active member. The process requires acceptance: the owner initiates a transfer which creates a pending request, the target member receives a notification and can accept or decline the transfer. Upon acceptance, the old owner becomes an editor and the target becomes the new owner. All trip members are notified of the change.

**Leave Trip**: Non-owners can leave a trip at any time. Owners must transfer ownership before leaving. When someone leaves, all remaining members are notified.

### Notification System

Real-time in-app notifications keep users informed of trip activity. The system supports multiple event types:

- **Ownership changes**: When ownership is transferred or someone leaves
- **Content updates**: New comments, activities, expenses, reservations
- **Member changes**: New invites, role updates

Notifications appear in a **notification center** (bell icon with unread badge) and as **toast notifications** for immediate awareness. The system uses event-driven architecture with 10-second polling for real-time updates without WebSocket complexity.

Notifications auto-expire after 90 days to prevent database bloat.

### Public Trip View

Any trip can be shared as a read-only public page. The public view shows the full itinerary but hides budget details, files, checklists, and reservations. Designed for sharing trip plans with people who aren't on the platform.

---

## Architecture Overview

Tabi consists of three deployable units:

**Client** Next.js 16 (App Router) on Hostinger KVM2. Handles rendering, routing, and client-side state. Uses TanStack Query for server state, Zustand for UI state, React Hook Form + Zod for form management.

**Server** Express.js on Hostinger KVM2, running on Bun runtime. Handles all business logic, data access, and file uploads. Uses a layered architecture: Routes → Controllers → Services → Models.

**Database** MongoDB Atlas (M0 free cluster) via Mongoose 9.x.

Two external services:

- **Clerk** owns authentication entirely. The client uses Clerk's UI components. The server verifies JWTs. User data is synced via webhooks.
- **Cloudinary** handles all media storage. Files always flow client → server → Cloudinary, never directly from the client, so credentials stay server-side.

### Request Lifecycle

Every authenticated request follows this path:

1. Client calls `clerk.session.getToken()` via Axios interceptor
2. Request hits Express with `Authorization: Bearer <JWT>`
3. Middleware stack processes in order: `helmet()` → `hpp()` → `cors()` → `express.json()` → `clerkMiddleware()` → `requireAuth` → `resolveDbUser` → `requireMembership` → `requireRole` → `validate(schema)`
4. Controller calls the appropriate service function
5. Service executes Mongoose queries against Atlas
6. Response flows back through Express to the client

The `requireMembership` middleware returns **403** when a user isn't a member of a trip. A 404 is only returned for `CastError` (invalid MongoDB ObjectId in the URL param).

---

## Database Design

16 collections: `users`, `trips`, `trip_members`, `pending_invites`, `days`, `activities`, `comments`, `checklists`, `checklist_items`, `files`, `reservations`, `budget_settings`, `expenses`, `settlements`, `notifications`, `polls`.

The most queried collection is `trip_members` every single authenticated request to a trip resource hits this collection first to verify membership. The compound index `{ tripId: 1, userId: 1 }` serves both the uniqueness constraint and the permission check in a single lookup.

Key design decisions:

- **Hard deletes only.** Soft deletes add complexity (filtering `deletedAt: null` everywhere) that isn't justified at this scope. Trip deletion cascades via a `deleteTripCascade` service function.
- **`pending_invites` vs `trip_members status: "pending"`.** Invites to existing users create a pending `trip_member` record. Invites to unknown emails create a `pending_invite` with a signed token. This avoids creating user records for people who never sign up.
- **Days auto-generated on trip creation.** When a trip is created with a date range, the server creates one Day document per calendar date immediately. The itinerary skeleton always exists.
- **Shared Zod schemas.** Both client and server import validation schemas from a shared `shared/validations/` directory in the monorepo. Client-side validation and server-side validation are always in sync.

---

## Security

- **Authentication**: Clerk JWTs verified on every request. No custom token tables, no refresh token logic on the server Clerk handles all of it.
- **Authorization**: Two-layer model. Membership check (are you in this trip?) then role check (do you have permission for this action?). Both enforced in Express middleware, not just the UI.
- **Input validation**: Every payload validated twice React Hook Form + Zod on the client for UX, and Zod middleware on the server for security. Same schema, both layers.
- **File uploads**: Cloudinary credentials are server-only. No signed upload URLs sent to clients. All uploads are proxied through Express.
- **Environment separation**: Client only has `NEXT_PUBLIC_*` variables. All secrets (Clerk secret, MongoDB URI, Cloudinary credentials) live on the server only.
