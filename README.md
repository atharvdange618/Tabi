# <img src="social-avatar.png" alt="Tabi Logo" height="64" align="center" /> Tabi

> **A collaborative itinerary planning platform. Plan trips together, not in separate chat threads.**

Tabi (旅, Japanese for _journey_) is a full-stack collaborative trip planning web app designed for groups. Create a trip, invite members, build a day-wise itinerary, track your budget, manage files, and handle reservations in one shared workspace. Strict role-based access keeps your plans secure so nobody accidentally breaks your itinerary.

Built for the ChaiCode Buildathon.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)
![Bun](https://img.shields.io/badge/Bun-1-FBF0DF?style=flat-square&logo=bun)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)
[![React Doctor](https://www.react.doctor/share/badge?p=client&s=96&w=64&f=30)](https://www.react.doctor/share?p=client&s=96&w=64&f=30)

---

## Features

### Trip Planning

- Create trips with specific dates and custom descriptions
- Auto-generate a day-wise timeline based on your trip dates
- Add activity cards specifying type, time, location, estimated cost, and notes
- Reorder activities within and across days using drag-and-drop
- **Time Conflict Detection**: Server warns (non-blocking) when two activities overlap on the same day
- **Map View**: Interactive Leaflet map geocoding all activity locations, with color-coded markers by type and marker clustering

### Collaboration

- **Member Management**: Invite members via email, handling pending invites gracefully for unregistered users
- **Role-Based Access**: Enforce permissions (Owner, Editor, Viewer) validated on the server, not just hidden in the UI
- **Ownership Transfer**: Owners can transfer ownership to any member via an acceptance workflow - creates pending request, target receives notification to accept/decline
- **Comments**: Comment on specific days or individual activities with threaded replies and **emoji reactions**
- **Polls**: Create multi-option group polls, vote in real-time, declare a winner and close the poll
- **Real-Time Notifications**: Event-driven notification system with bell icon + unread badge, toast notifications, and 10-second polling
- **Activity Tracking**: Get notified about ownership changes, new comments, expenses, member updates, and content modifications

### Organization

- **Trip Overview**: Dashboard tab with stat cards, budget progress bar, upcoming reservations, checklist summary, active polls, and member roster
- **Checklists**: Maintain multiple checklists per trip for packing, to-dos, and pre-departure tasks
- **File Management**: Attach files like tickets and images, hosted securely via Cloudinary
- **Reservations**: Enter manual reservations for flights, hotels, restaurants, and car rentals
- **Budget Tracking**: Track expenses (with optional file attachments) with automatic notifications to all trip members and view breakdowns by category
- **Notification Center**: Centralized notification hub with unread badges, auto-expiring notifications (90 days), and event-driven updates

### Security

- Verify JWT tokens via Clerk on every protected route
- Use Helmet and HPP to secure headers and prevent HTTP parameter pollution
- Validate request bodies on both client and server using Zod
- Block non-member access immediately keeping trip existence private

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client                          │
│   Next.js 16 (App Router) + TypeScript              │
│                                                     │
│   TanStack Query ──── server state / caching (10s)  │
│   Zustand ─────────── UI state (sidebar, active day)│
│   Axios ───────────── API client + Clerk token      │
│   React Hook Form + Zod ── form validation          │
│   NotificationCenter ─ real-time notifications      │
└────────────────────┬────────────────────────────────┘
                     │ REST (Bearer JWT)
                     ▼
┌─────────────────────────────────────────────────────┐
│                     Server                          │
│   Express + TypeScript (Bun runtime)                │
│                                                     │
│   @clerk/express ─── JWT verification middleware    │
│   permissions.ts ─── role-based route guards        │
│   Zod middleware  ─── request body validation       │
│   Helmet + HPP    ─── security headers              │
│   EventEmitter    ─── notification events           │
└────────────────────┬────────────────────────────────┘
                     │ Mongoose ODM
                     ▼
┌─────────────────────────────────────────────────────┐
│                     MongoDB                         │
│   trips · days · activities · comments              │
│   checklists · files · reservations · expenses      │
│   notifications · polls · pending ownership         │
└─────────────────────────────────────────────────────┘

External Services
  Clerk      ── auth, session management, user sync
  Cloudinary ── file and image storage
```

---

## Tech Stack

| Layer        | Technology               |
| ------------ | ------------------------ |
| Framework    | Next.js 16 (App Router)  |
| Language     | TypeScript (strict)      |
| Runtime      | Bun                      |
| Styling      | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query v5        |
| Client state | Zustand                  |
| API client   | Axios                    |
| Auth         | Clerk                    |
| Forms        | React Hook Form + Zod    |
| Database     | MongoDB Atlas            |
| ODM          | Mongoose                 |
| Security     | Helmet, HPP              |
| Media        | Cloudinary               |
| Charts       | Recharts                 |
| Toasts       | Sonner                   |
| Date picker  | react-day-picker         |
| Icons        | Lucide React             |

---

## Getting Started

### Prerequisites

You need the following installed or set up to run this project:

- Node.js >= 20
- Bun >= 1.0
- MongoDB Atlas account (free M0 works)
- Clerk account (free tier)
- Cloudinary account (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/atharvdange618/Tabi.git
cd Tabi
```

### 2. Set up the server

Start by installing backend dependencies:

```bash
cd server
bun install
```

Create a `server/.env` file and fill in your keys:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:3000
```

Start the development server:

```bash
bun run dev
```

The Express server will start on `http://localhost:8000`.

### 3. Set up the client

Open a new terminal window and navigate to the client workspace:

```bash
cd client
bun install
```

Create a `client/.env.local` file and fill in your keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start the Next.js development server:

```bash
bun run dev
```

The client will start on `http://localhost:3000`.

### 4. Configure Clerk webhook

To sync Clerk user data into your MongoDB `users` collection, add a webhook in your Clerk Dashboard pointing to:

```text
http://localhost:8000/api/v1/webhooks/clerk
```

Make sure to subscribe to the `user.created` and `user.updated` events. Grab the Webhook Secret provided by Clerk and add it to your `server/.env` file as `CLERK_WEBHOOK_SECRET`. This step is necessary to ensure user references work correctly for trips and invites.

---

## Role-Based Access

The platform assigns roles to participants to protect shared content. These limits are validated during server requests.

| Action                | Owner | Editor | Viewer |
| --------------------- | :---: | :----: | :----: |
| Edit trip metadata    |  ✅   |   ❌   |   ❌   |
| Add / edit activities |  ✅   |   ✅   |   ❌   |
| Manage checklists     |  ✅   |   ✅   |   ❌   |
| Upload / delete files |  ✅   |   ✅   |   ❌   |
| Add reservations      |  ✅   |   ✅   |   ❌   |
| Track expenses        |  ✅   |   ✅   |   ❌   |
| Post comments         |  ✅   |   ✅   |   ✅   |
| View all content      |  ✅   |   ✅   |   ✅   |
| Invite members        |  ✅   |   ❌   |   ❌   |
| Transfer ownership    |  ✅   |   ❌   |   ❌   |
| Accept ownership      |  ✅   |   ✅   |   ✅   |
| Delete trip           |  ✅   |   ❌   |   ❌   |

---

## Deployment

| Service  | Platform      |
| -------- | ------------- |
| Frontend | Vercel        |
| Backend  | Hostinger     |
| Database | MongoDB Atlas |
| Auth     | Clerk         |
| Media    | Cloudinary    |

**Live Platform:** [tabi.atharvdangedev.in](https://tabi.atharvdangedev.in)

---

## Design

Tabi utilizes a **neobrutalism + pastel** design system to stand out:

- Distinctive `2px` dark borders (`#1A1A1A`) on interactive elements
- Offset drop shadows (`4px 4px 0px #1A1A1A`) with zero blur
- Soft pastel fills like blue (`#93CDFF`), peach (`#FFD6C0`), and mint (`#B8F0D4`)
- Clean typography hierarchy balancing **Space Grotesk** (headings), **DM Sans** (body), and **JetBrains Mono** (mono/IDs)

---

## License

MIT - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built by <a href="https://github.com/atharvdange618">Atharv Dange</a></p>
  <p><em>旅   journey</em></p>
</div>
