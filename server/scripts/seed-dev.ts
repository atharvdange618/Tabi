/* eslint-disable no-console, no-await-in-loop -- one-off dev script, inserts run in order */
/**
 * Seed local dev data for one existing user (signed in once via Clerk, so the
 * User row exists). Re-running replaces the seeded trips; nothing else is touched.
 *
 *   pnpm seed [email]
 *
 * Run from the host against the compose Mongo with
 *   MONGODB_URI="mongodb://127.0.0.1:27017/tabi?directConnection=true"
 */
import mongoose, { type Types } from "mongoose";
import {
  User,
  Trip,
  TripMember,
  Day,
  Activity,
  Comment,
  Checklist,
  ChecklistItem,
  Reservation,
  BudgetSettings,
  Expense,
  Notification,
} from "../src/models/index.ts";
import { getDatesInRange } from "../src/lib/helpers.ts";

const email = process.argv[2] ?? "atharvdange618@gmail.com";
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

const FRIENDS = [
  { clerkId: "seed_priya", email: "priya@example.com", name: "Priya Sharma" },
  { clerkId: "seed_rohan", email: "rohan@example.com", name: "Rohan Mehta" },
  { clerkId: "seed_kavya", email: "kavya@example.com", name: "Kavya Iyer" },
];

interface SeedActivity {
  title: string;
  type: "sightseeing" | "food" | "transport" | "accommodation" | "activity" | "other";
  startTime?: string;
  endTime?: string;
  location?: string;
  estimatedCost?: number;
}

interface SeedTrip {
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  tags: string[];
  budget: number;
  owner: number; // index into `people`; 0 is the target user
  members: { person: number; role: "editor" | "viewer" }[];
  days: { label: string; activities: SeedActivity[] }[];
  expenses: {
    description: string;
    amount: number;
    category: "accommodation" | "food" | "transport" | "activities" | "shopping" | "misc";
    paidBy: number;
  }[];
  checklists: { title: string; items: { label: string; checked: boolean }[] }[];
  reservations: {
    type: "flight" | "hotel" | "car_rental" | "restaurant" | "activity" | "other";
    title: string;
    provider: string;
    confirmationNumber: string;
    datetime: string;
    status: "confirmed" | "pending";
  }[];
}

const TRIPS: SeedTrip[] = [
  {
    title: "Kyoto and Tokyo in autumn",
    description: "A week of temples, food alleys and the shinkansen.",
    destination: "Kyoto, Japan",
    startDate: "2026-11-12",
    endDate: "2026-11-18",
    isPublic: false,
    tags: ["japan", "autumn", "food"],
    budget: 450000,
    owner: 0,
    members: [
      { person: 1, role: "editor" },
      { person: 2, role: "viewer" },
    ],
    days: [
      {
        label: "Arrive in Kyoto",
        activities: [
          { title: "Land at Kansai, Haruka to Kyoto", type: "transport", startTime: "09:30", endTime: "11:00", location: "Kansai International Airport", estimatedCost: 2200 },
          { title: "Check in at the ryokan", type: "accommodation", startTime: "15:00", location: "Gion, Kyoto" },
          { title: "Dinner on Pontocho alley", type: "food", startTime: "19:30", location: "Pontocho, Kyoto", estimatedCost: 6000 },
        ],
      },
      {
        label: "Eastern Kyoto",
        activities: [
          { title: "Fushimi Inari at sunrise", type: "sightseeing", startTime: "06:30", endTime: "09:00", location: "Fushimi Inari Taisha" },
          { title: "Kiyomizu-dera", type: "sightseeing", startTime: "11:00", endTime: "13:00", location: "Kiyomizu-dera", estimatedCost: 1500 },
          { title: "Tea ceremony", type: "activity", startTime: "15:00", endTime: "16:00", location: "Higashiyama", estimatedCost: 4000 },
        ],
      },
      {
        label: "Arashiyama",
        activities: [
          { title: "Bamboo grove walk", type: "sightseeing", startTime: "08:00", location: "Arashiyama" },
          { title: "Tofu lunch near Tenryu-ji", type: "food", startTime: "12:30", estimatedCost: 3500 },
        ],
      },
      { label: "Shinkansen to Tokyo", activities: [{ title: "Nozomi to Tokyo", type: "transport", startTime: "10:00", endTime: "12:15", location: "Kyoto Station", estimatedCost: 14000 }] },
    ],
    expenses: [
      { description: "Ryokan, 3 nights", amount: 96000, category: "accommodation", paidBy: 0 },
      { description: "JR passes", amount: 75000, category: "transport", paidBy: 1 },
      { description: "Pontocho dinner", amount: 18000, category: "food", paidBy: 2 },
      { description: "Tea ceremony", amount: 12000, category: "activities", paidBy: 0 },
    ],
    checklists: [
      {
        title: "Packing",
        items: [
          { label: "Passport", checked: true },
          { label: "Universal adapter", checked: true },
          { label: "Light jacket", checked: false },
          { label: "Comfortable walking shoes", checked: false },
        ],
      },
      {
        title: "Before we fly",
        items: [
          { label: "Apply for Japan visa", checked: true },
          { label: "Buy travel insurance", checked: false },
          { label: "Load Suica on phone", checked: false },
        ],
      },
    ],
    reservations: [
      { type: "flight", title: "BOM to KIX", provider: "Japan Airlines", confirmationNumber: "JL7Q2K", datetime: "2026-11-11T23:50:00Z", status: "confirmed" },
      { type: "hotel", title: "Gion ryokan", provider: "Booking.com", confirmationNumber: "4417820931", datetime: "2026-11-12T06:00:00Z", status: "confirmed" },
      { type: "restaurant", title: "Kaiseki dinner", provider: "Tabelog", confirmationNumber: "", datetime: "2026-11-14T10:30:00Z", status: "pending" },
    ],
  },
  {
    title: "Goa with the college gang",
    description: "Long weekend in North Goa.",
    destination: "Goa, India",
    startDate: "2026-02-20",
    endDate: "2026-02-23",
    isPublic: false,
    tags: ["beach", "weekend"],
    budget: 60000,
    owner: 0,
    members: [
      { person: 1, role: "editor" },
      { person: 2, role: "editor" },
      { person: 3, role: "viewer" },
    ],
    days: [
      {
        label: "Fly in, Anjuna",
        activities: [
          { title: "Flight to Mopa", type: "transport", startTime: "07:15", endTime: "08:30", location: "Mumbai" },
          { title: "Scooter rentals", type: "transport", startTime: "11:00", location: "Anjuna", estimatedCost: 1600 },
          { title: "Sunset at Vagator", type: "sightseeing", startTime: "17:45", location: "Vagator Beach" },
        ],
      },
      {
        label: "Old Goa and Panjim",
        activities: [
          { title: "Basilica of Bom Jesus", type: "sightseeing", startTime: "10:00", location: "Old Goa" },
          { title: "Fish thali in Fontainhas", type: "food", startTime: "13:30", location: "Fontainhas, Panjim", estimatedCost: 2400 },
        ],
      },
    ],
    expenses: [
      { description: "Villa, 3 nights", amount: 27000, category: "accommodation", paidBy: 0 },
      { description: "Scooters", amount: 4800, category: "transport", paidBy: 2 },
      { description: "Thalassa dinner", amount: 8600, category: "food", paidBy: 1 },
      { description: "Souvenirs", amount: 2100, category: "shopping", paidBy: 3 },
    ],
    checklists: [
      {
        title: "Packing",
        items: [
          { label: "Sunscreen", checked: true },
          { label: "Swimwear", checked: true },
        ],
      },
    ],
    reservations: [
      { type: "hotel", title: "Assagao villa", provider: "Airbnb", confirmationNumber: "HMX4RZ9P", datetime: "2026-02-20T08:30:00Z", status: "confirmed" },
    ],
  },
  {
    title: "Spiti Valley road trip",
    description: "Manali to Kaza and back over Kunzum La.",
    destination: "Spiti Valley, India",
    startDate: "2027-06-08",
    endDate: "2027-06-14",
    isPublic: true,
    tags: ["mountains", "roadtrip"],
    budget: 120000,
    owner: 1,
    members: [{ person: 0, role: "editor" }],
    days: [
      {
        label: "Manali to Kaza",
        activities: [
          { title: "Early start over Atal Tunnel", type: "transport", startTime: "05:30", location: "Manali" },
          { title: "Chai at Chandratal turnoff", type: "food", startTime: "11:00", location: "Batal" },
        ],
      },
    ],
    expenses: [
      { description: "SUV rental", amount: 42000, category: "transport", paidBy: 1 },
      { description: "Homestay deposit", amount: 6000, category: "accommodation", paidBy: 0 },
    ],
    checklists: [{ title: "Gear", items: [{ label: "Thermals", checked: false }, { label: "Power bank", checked: false }] }],
    reservations: [
      { type: "car_rental", title: "Scorpio N, 7 days", provider: "Zoomcar", confirmationNumber: "ZC-88213", datetime: "2027-06-08T00:00:00Z", status: "pending" },
    ],
  },
];

// Seed data is static, so a missing index means the fixtures are wrong.
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`Seed data has no item at index ${index}`);
  }
  return item;
}

await mongoose.connect(uri);

const target = await User.findOne({ email: email.toLowerCase() });
if (!target) {
  throw new Error(`No user with email ${email}. Sign in once so Clerk creates the user row.`);
}

const friends = await Promise.all(
  FRIENDS.map((f) =>
    User.findOneAndUpdate({ clerkId: f.clerkId }, f, { upsert: true, returnDocument: "after" }),
  ),
);
const people: Types.ObjectId[] = [target._id, ...friends.map((f) => f._id)];

// Drop the previous seed run for these trips so re-running stays idempotent.
const stale = await Trip.find({
  title: { $in: TRIPS.map((t) => t.title) },
  createdBy: { $in: people },
}).select("_id");
const staleIds = stale.map((t) => t._id);
if (staleIds.length > 0) {
  const checklistIds = (await Checklist.find({ tripId: { $in: staleIds } }).select("_id")).map((c) => c._id);
  await Promise.all([
    ChecklistItem.deleteMany({ checklistId: { $in: checklistIds } }),
    ...[TripMember, Day, Activity, Comment, Checklist, Reservation, BudgetSettings, Expense, Notification].map(
      (model) => (model as typeof Day).deleteMany({ tripId: { $in: staleIds } }),
    ),
  ]);
  await Trip.deleteMany({ _id: { $in: staleIds } });
}

for (const t of TRIPS) {
  const owner = at(people, t.owner);
  const trip = await Trip.create({
    title: t.title,
    description: t.description,
    destination: t.destination,
    startDate: new Date(t.startDate),
    endDate: new Date(t.endDate),
    travelerCount: t.members.length + 1,
    isPublic: t.isPublic,
    tags: t.tags,
    createdBy: owner,
  });
  const tripId = trip._id;

  await TripMember.insertMany([
    { tripId, userId: owner, role: "owner", status: "active", invitedBy: owner, joinedAt: new Date() },
    ...t.members.map((m) => ({
      tripId,
      userId: at(people, m.person),
      role: m.role,
      status: "active",
      invitedBy: owner,
      joinedAt: new Date(),
    })),
  ]);
  await BudgetSettings.create({ tripId, totalBudget: t.budget });

  const days = await Day.insertMany(
    getDatesInRange(trip.startDate, trip.endDate).map((date, i) => ({
      tripId,
      date,
      label: t.days[i]?.label ?? "",
    })),
  );

  for (const [i, seedDay] of t.days.entries()) {
    const day = at(days, i);
    const activities = await Activity.insertMany(
      seedDay.activities.map((a, position) => ({ ...a, dayId: day._id, tripId, position, createdBy: owner })),
    );
    const first = activities[0];
    if (i === 0 && first) {
      const friend = at(people, at(t.members, 0).person);
      const questions = await Comment.insertMany([
        { tripId, targetType: "activity", targetId: first._id, authorId: friend, body: "Should we book this in advance?", reactions: [{ emoji: "👍", users: [owner] }] },
      ]);
      await Comment.insertMany([
        { tripId, targetType: "activity", targetId: first._id, authorId: at(people, 0), parentId: at(questions, 0)._id, body: "Yes, I'll grab it this week." },
        { tripId, targetType: "day", targetId: day._id, authorId: at(people, 0), body: "Let's keep the first evening light." },
      ]);
    }
  }

  await Expense.insertMany(
    t.expenses.map((e) => ({ ...e, tripId, paidBy: at(people, e.paidBy), date: trip.startDate, createdBy: at(people, e.paidBy) })),
  );

  for (const [position, c] of t.checklists.entries()) {
    const checklist = await Checklist.create({ tripId, title: c.title, position, createdBy: owner });
    await ChecklistItem.insertMany(
      c.items.map((item, itemPosition) => ({
        checklistId: checklist._id,
        label: item.label,
        isChecked: item.checked,
        checkedBy: item.checked ? owner : null,
        checkedAt: item.checked ? new Date() : null,
        position: itemPosition,
      })),
    );
  }

  await Reservation.insertMany(
    t.reservations.map((r) => ({ ...r, tripId, datetime: new Date(r.datetime), createdBy: owner })),
  );

  const actor = at(people, at(t.members, 0).person === 0 ? t.owner : at(t.members, 0).person);
  await Notification.insertMany([
    { userId: at(people, 0), tripId, type: "expense_added", actorId: actor, message: `New expense "${at(t.expenses, 0).description}" added to "${t.title}"`, isRead: false },
    { userId: at(people, 0), tripId, type: "comment_created", actorId: actor, message: `New comment added to activity in "${t.title}"`, isRead: true },
  ]);

  console.log(`Seeded "${t.title}"`);
}

await mongoose.disconnect();
