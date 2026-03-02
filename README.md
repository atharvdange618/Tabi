# <img src="social-avatar.png" alt="alt text" height="64" align="center" /> Tabi 旅

> **A collaborative itinerary planning platform. Plan trips together, not in separate chat threads.**

Tabi (旅, Japanese for _journey_) is a full-stack collaborative trip planning web app built for groups. Create a trip, invite your people, build a day-wise itinerary, track your budget, manage files and reservations all in one shared workspace with proper role-based access so nobody accidentally breaks anything.

Built for ChaiCode Buildathon. MERN stack. In active development.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)
![Bun](https://img.shields.io/badge/Bun-1-FBF0DF?style=flat-square&logo=bun)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)

---

## Features

### Trip Planning

- Create trips with title, date range, description, and traveler count
- Auto-generated day-wise timeline from your trip dates
- Add activities as cards with type, time, location, estimated cost, and notes
- Drag-and-drop activity reordering within and across days

### Collaboration

- Invite members by email pending invites handled gracefully for non-registered users
- Role-based access: **Owner**, **Editor**, **Viewer** enforced on the server, not just hidden in UI
- Comment on specific days or individual activities, with one-level threaded replies

### Organization

- Multiple checklists per trip (packing, to-do, pre-departure)
- File attachments PDFs, tickets, images stored on Cloudinary
- Manual reservation entries: flights, hotels, restaurants, car rentals
- Budget tracking with per-category expense breakdown

### Security

- JWT verification via Clerk on every protected route
- Helmet + HPP for header security and HTTP parameter pollution prevention
- Zod validation on every request body, both client and server
- 404 returned for non-member trip access, trip existence is never leaked

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client                          │
│   Next.js 16 (App Router) + TypeScript              │
│                                                     │
│   TanStack Query ──── server state / caching        │
│   Zustand ─────────── UI state (sidebar, active day)│
│   Axios ───────────── API client + Clerk token      │
│   React Hook Form + Zod ── form validation          │
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
└────────────────────┬────────────────────────────────┘
                     │ Mongoose ODM
                     ▼
┌─────────────────────────────────────────────────────┐
│                     MongoDB                         │
│   trips · days · activities · comments              │
│   checklists · files · reservations · expenses      │
└─────────────────────────────────────────────────────┘

External Services
  Clerk      ── auth, session management, user sync
  Cloudinary ── file and image storage
```

---

## Tech Stack

| Layer        | Technology                 |
| ------------ | -------------------------- |
| Framework    | Next.js 16 (App Router)    |
| Language     | TypeScript (strict)        |
| Runtime      | Bun                        |
| Styling      | Tailwind CSS + shadcn/ui   |
| Server state | TanStack Query v5          |
| Client state | Zustand                    |
| API client   | Axios                      |
| Auth         | Clerk                      |
| Forms        | React Hook Form + Zod      |
| Database     | MongoDB Atlas              |
| ODM          | Mongoose                   |
| Security     | Helmet, HPP                |
| Media        | Cloudinary                 |
| Charts       | Recharts                   |
| Toasts       | Sonner                     |
| Date picker  | react-day-picker           |
| Icons        | Lucide React + react-icons |

---

## Project Structure

```
tabi/
├── client/                    # Next.js App
│   ├── app/
│   │   ├── layout.tsx         # Root layout, fonts, providers
│   │   ├── (auth)/            # Clerk sign-in / sign-up pages
│   │   ├── dashboard/         # Trip list
│   │   ├── trips/[id]/        # Trip workspace
│   │   │   ├── itinerary/
│   │   │   ├── members/
│   │   │   ├── checklists/
│   │   │   ├── files/
│   │   │   ├── reservations/
│   │   │   └── budget/
│   │   └── invites/[token]/
│   │
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── axios.ts           # Axios instance + Clerk interceptor
│   │   └── queryClient.ts
│   └── store/                 # Zustand stores
│
├── server/                    # Express API
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/            # Mongoose models
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Clerk JWT verification
│   │   │   ├── permissions.ts       # Role checks
│   │   │   └── validate.ts          # Zod middleware
│   │   └── lib/
│   │       ├── cloudinary.ts
│   │       └── db.ts
│   └── tsconfig.json
│
└── shared/                          # Shared TS types and Zod schemas
    ├── types/
    └── validations/
```

## Getting Started

### Prerequisites

```bash
node >= 20
bun >= 1.0
MongoDB Atlas account (free M0 works)
Clerk account (free tier)
Cloudinary account (free tier)
```

### 1. Clone the repository

```bash
git clone https://github.com/atharvdange618/Tabi.git
cd Tabi
```

### 2. Set up the server

```bash
cd server
bun install
```

Create `server/.env`:

```env
PORT=8000
MONGODB_URI=your_mongodb_atlas_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:3000
```

```bash
bun run dev
```

Server runs on `http://localhost:8000`.

### 3. Set up the client

```bash
cd client
bun install
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

```bash
bun run dev
```

Client runs on `http://localhost:3000`.

### 4. Configure Clerk webhook

In your Clerk dashboard, add a webhook pointing to:

```
http://localhost:8000/api/v1/webhooks/clerk
```

Subscribe to: `user.created`, `user.updated`

This syncs Clerk users into your MongoDB `users` collection so trip member references work correctly.

---

## Role-Based Access

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
| Delete trip           |  ✅   |   ❌   |   ❌   |

Role checks run server-side in Express middleware. The UI reflects permissions, but the server enforces them regardless.

---

## Deployment

| Service  | Platform      |
| -------- | ------------- |
| Frontend | Vercel        |
| Backend  | Hostinger     |
| Database | MongoDB Atlas |
| Auth     | Clerk         |
| Media    | Cloudinary    |

**Live:** [tabi.vercel.app](https://tabi.vercel.app)  
**API:** [tabi-api.hogyoku.cloud](https://tabi-api.hogyoku.cloud)

> Note: The Render free tier spins down after 15 minutes of inactivity. First request after idle may take 20-30 seconds to warm up.

---

## Design

Tabi uses a **neobrutalism + pastel** design system:

- Thick `2px` dark borders (`#1A1A1A`) on all interactive elements
- Offset drop shadows: `4px 4px 0px #1A1A1A` no blur
- Pastel fills: blue `#93CDFF`, peach `#FFD6C0`, mint `#B8F0D4`
- Typography: **Space Grotesk** (headings) + **DM Sans** (body) + **JetBrains Mono** (code/IDs)

---

## License

MIT see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built by <a href="https://github.com/atharvdange618">Atharv Dange</a></p>
  <p><em>旅   journey</em></p>
</div>
