# Task 8 — Personal Trainer Portal

> **Feature Owner:** TBD  
> **Status:** Planning  
> **Dependencies:** Phase 8 (Clerk Auth + CouchDB Proxy) — ✅ Complete  
> **Payment/Subscription Model:** Deferred — will be designed and integrated separately

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Roles & Personas](#2-user-roles--personas)
3. [Feature Breakdown](#3-feature-breakdown)
4. [Data Model](#4-data-model)
5. [Database Strategy](#5-database-strategy)
6. [API Design](#6-api-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Screen Inventory](#8-screen-inventory)
9. [UI/UX Specifications](#9-uiux-specifications)
10. [Sync & Real-Time Architecture](#10-sync--real-time-architecture)
11. [Implementation Phases](#11-implementation-phases)
12. [Open Questions & Future Considerations](#12-open-questions--future-considerations)

---

## 1. Overview

### What

A **Personal Trainer (PT) Portal** that extends FitForge from a solo fitness app into a connected trainer↔client platform. Personal trainers enroll on the platform, users discover and subscribe to trainers, and trainers guide their clients through custom routines and progress monitoring — all while preserving FitForge's local-first, offline-capable architecture.

### Why

- Users get **professional guidance** without leaving the app they already track workouts in
- Trainers get a **lightweight digital tool** to manage clients, prescribe routines, and track progress — no separate app needed
- FitForge becomes a **platform** with network effects (more trainers → more users → more trainers)

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Local-first preserved** | User workout data stays in PouchDB. PTs see synced snapshots, never raw user databases |
| **PT is a user too** | Trainers use the same app — they just have an additional "Trainer" role unlocked |
| **Non-intrusive** | Users who don't want a PT see zero UI changes to existing screens |
| **Subscription-agnostic** | The PT↔User bridge is built as a relationship model; payment/billing plugs in later |
| **Privacy by design** | Users explicitly opt-in to share progress data; PTs only see what users consent to |

---

## 2. User Roles & Personas

### 2.1 Regular User (Existing)

- Creates routines, executes workouts, tracks progress
- **New capability:** Browse PT directory, subscribe to a PT, receive suggested routines, share progress

### 2.2 Personal Trainer (New Role)

- Is also a regular user (can do their own workouts)
- **Additional capabilities:**
  - Create a public trainer profile (bio, specializations, certifications, photo)
  - View subscribed clients' progress dashboards
  - Create and suggest routines to individual clients
  - See client workout history, PRs, compliance rate

### 2.3 Role Determination

Trainer role is **additive** — a Clerk user gets `role: "trainer"` added to their profile. They don't lose any user capabilities.

```
Regular User ──[enrolls as PT]──> User + Trainer Role
```

**No separate login flow.** Trainers use the same sign-in. The app detects their role and shows additional trainer UI.

---

## 3. Feature Breakdown

### 3.1 PT Enrollment (Trainer-Side)

| Feature | Description |
|---------|-------------|
| **Trainer Application** | User fills out trainer profile form (bio, specializations, certifications, experience, photo) |
| **Profile Review** | MVP: Auto-approved. Future: Admin review queue |
| **Trainer Profile Management** | Edit bio, update certifications, set availability status (accepting clients / full) |
| **Trainer Dashboard** | Dedicated view showing client list, pending requests, recent client activity |

### 3.2 PT Discovery (User-Side)

| Feature | Description |
|---------|-------------|
| **Trainer Directory** | Browsable, searchable list of enrolled trainers |
| **Trainer Detail Page** | Full profile: bio, specializations, certifications, rating, client count |
| **Filter & Search** | Filter by specialization (strength, cardio, flexibility, weight loss, etc.), search by name |
| **Specialization Chips** | Visual filter chips matching the existing FilterChip design pattern |

### 3.3 Subscription / Connection (Bridge)

| Feature | Description |
|---------|-------------|
| **Subscribe Request** | User sends subscription request to a trainer |
| **Request Approval** | Trainer accepts/declines incoming requests |
| **Active Connection** | Once approved, PT↔User bridge is established |
| **Unsubscribe** | Either party can end the connection |
| **Connection Limit** | MVP: User can subscribe to 1 PT at a time. Future: Multiple PTs with different specializations |
| **Payment Gate** | Deferred — connection is free for now; payment hooks will wrap the subscribe flow later |

### 3.4 Progress Sharing (User → PT)

| Feature | Description |
|---------|-------------|
| **Progress Snapshot** | System generates periodic snapshots of user's workout data for PT consumption |
| **Shared Data** | Workout history, PRs, compliance rate (completed vs planned), body stats, streak |
| **Privacy Controls** | User can toggle what data categories are shared |
| **Read-Only Access** | PT can view but never modify user's data |
| **Real-Time Sync** | When user completes a workout, PT's client view updates on next sync |

### 3.5 Routine Suggestions (PT → User)

| Feature | Description |
|---------|-------------|
| **Create Routine for Client** | PT uses the existing routine builder, tags it for a specific client |
| **Suggest Routine** | Routine appears in user's "Suggested Routines" inbox |
| **Accept / Decline** | User can preview the routine, then accept (copies to their routines) or decline |
| **Routine Notes** | PT can attach text notes to suggested routines (guidance, goals, etc.) |
| **Suggestion History** | Both PT and user can see history of suggested routines and their status |

### 3.6 Trainer Dashboard (PT-Side)

| Feature | Description |
|---------|-------------|
| **Client List** | All active clients with quick stats (last workout, streak, compliance) |
| **Client Detail** | Deep-dive into individual client's progress, charts, PRs |
| **Client Workout History** | Read-only view of client's recent sessions |
| **Pending Requests** | Incoming subscription requests to approve/decline |
| **Quick Actions** | Suggest routine, view progress, send note |

---

## 4. Data Model

### 4.1 New Interfaces

```typescript
// ── Trainer Profile ──────────────────────────────────────────

type TrainerStatus = 'pending' | 'active' | 'suspended';
type AvailabilityStatus = 'accepting' | 'full' | 'paused';

type TrainerSpecialization =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'weight_loss'
  | 'bodybuilding'
  | 'powerlifting'
  | 'rehabilitation'
  | 'sports_performance'
  | 'general_fitness';

interface TrainerCertification {
  name: string;           // e.g., "NASM-CPT", "ACE-CPT"
  issuedBy: string;       // e.g., "NASM", "ACE"
  year: number;           // Year earned
}

interface TrainerProfile {
  _id: string;            // "trainer_{clerkUserId}"
  type: 'trainer_profile';
  clerkUserId: string;
  displayName: string;
  bio: string;            // Max 500 chars
  specializations: TrainerSpecialization[];
  certifications: TrainerCertification[];
  experienceYears: number;
  photoUrl?: string;      // Clerk profile image or custom upload
  status: TrainerStatus;  // MVP: auto-set to 'active'
  availability: AvailabilityStatus;
  clientCount: number;    // Denormalized for directory display
  rating?: number;        // Future: 1-5 average from client reviews
  createdAt: string;      // ISO 8601
  updatedAt: string;
}

// ── PT ↔ User Connection ────────────────────────────────────

type ConnectionStatus = 'pending' | 'active' | 'declined' | 'ended';

interface TrainerConnection {
  _id: string;            // "connection_{recipientId}_{requesterId}_{timestamp}"
  type: 'trainer_connection';
  trainerId: string;      // Clerk userId of the trainer
  clientId: string;       // Clerk userId of the user
  status: ConnectionStatus;
  requestedAt: string;
  respondedAt?: string;
  endedAt?: string;
  endedBy?: 'trainer' | 'client';
  // Privacy settings (controlled by client)
  sharedData: {
    workoutHistory: boolean;
    personalRecords: boolean;
    bodyStats: boolean;
    streakData: boolean;
  };
}

// ── Routine Suggestion ──────────────────────────────────────

type SuggestionStatus = 'pending' | 'accepted' | 'declined' | 'expired';

interface RoutineSuggestion {
  _id: string;            // "suggestion_{trainerId}_{clientId}_{timestamp}"
  type: 'routine_suggestion';
  trainerId: string;
  clientId: string;
  routineSnapshot: Routine;  // Full routine data (frozen copy)
  trainerNote?: string;      // Guidance from PT (max 1000 chars)
  status: SuggestionStatus;
  suggestedAt: string;
  respondedAt?: string;
  acceptedRoutineId?: string; // If accepted, the ID of the user's copy
}

// ── Client Progress Snapshot ────────────────────────────────

interface ClientProgressSnapshot {
  _id: string;            // "progress_{clientId}_{date}"
  type: 'client_progress';
  clientId: string;
  trainerId: string;
  snapshotDate: string;   // ISO 8601 date
  // Aggregated stats
  recentWorkouts: WorkoutSummaryBrief[];  // Last 7 sessions
  weeklyVolume: number;
  monthlyWorkoutCount: number;
  currentStreak: number;
  complianceRate: number;  // 0-1 (workouts done / workouts planned)
  prs: PersonalRecord[];
  bodyWeightKg?: number;
  energyScore?: number;    // Latest recovery meter score
  createdAt: string;
}

interface WorkoutSummaryBrief {
  sessionId: string;
  routineName: string | null;
  completedAt: string;
  durationSec: number;
  totalCalories: number;
  exerciseCount: number;
  avgRpe?: number;
}

// ── Trainer Notification ────────────────────────────────────

type TrainerNotificationType =
  | 'new_subscription_request'
  | 'client_completed_workout'
  | 'client_achieved_pr'
  | 'client_unsubscribed'
  | 'suggestion_accepted'
  | 'suggestion_declined';

interface TrainerNotification {
  _id: string;
  type: 'trainer_notification';
  trainerId: string;
  notificationType: TrainerNotificationType;
  title: string;
  body: string;
  relatedEntityId?: string;  // connectionId, suggestionId, etc.
  read: boolean;
  createdAt: string;
}
```

### 4.2 Extended Existing Interfaces

```typescript
// UserProfile — add trainer role flag + PT connection reference
interface UserProfile {
  // ... existing fields ...

  // NEW: Trainer portal fields
  isTrainer: boolean;               // Default: false
  trainerProfileId?: string;        // "trainer_{clerkUserId}" if enrolled
  activeTrainerId?: string;         // Clerk userId of subscribed PT (null if none)
  activeConnectionId?: string;       // Connection document ID
}
```

---

## 5. Database Strategy

### 5.1 New PouchDB Databases

The PT portal introduces **server-side only** data that doesn't fit the local-first PouchDB model because it spans multiple users. We use a **hybrid approach:**

| Data | Storage | Reason |
|------|---------|--------|
| Trainer profiles | **Server-side (CouchDB)** via API | Public directory — needs to be queryable across all users |
| Connections | **Server-side (CouchDB)** via API | Spans two users — neither user "owns" it unilaterally |
| Routine suggestions | **Server-side (CouchDB)** via API + local cache | PT creates on server, user pulls to local |
| Progress snapshots | **Server-side (CouchDB)** via API | Generated from user data, readable by PT |
| Trainer notifications | **Server-side (CouchDB)** via API | Cross-user events |

### 5.2 Server-Side CouchDB Databases

```
fitforge_trainers                    # All trainer profiles (global, queryable)
fitforge_connections                 # All PT↔User connections
fitforge_suggestions                 # All routine suggestions
fitforge_progress_snapshots          # Client progress snapshots
fitforge_trainer_notifications       # PT notifications
```

**Access control:** The Next.js API layer enforces authorization. Users can only read/write their own data. PTs can only read data from their connected clients.

### 5.3 Local Cache Strategy

For offline resilience, certain PT data is cached in the user's local PouchDB:

```typescript
// User's local cache (new DB instance)
const ptCacheDb = new PouchDB('fitforge_pt_cache');

// Cached documents:
// - Active trainer profile (for display when offline)
// - Pending routine suggestions (for offline preview)
// - Connection status
```

### 5.4 Document ID Patterns

```
trainer_{clerkUserId}                           # Trainer profile
connection_{recipientId}_{requesterId}_{ts}     # PT↔User connection
suggestion_{trainerId}_{clientId}_{ts}          # Routine suggestion
progress_{clientId}_{YYYY-MM-DD}                # Daily progress snapshot
notification_{trainerId}_{ts}                   # Trainer notification
```

---

## 6. API Design

### 6.1 New API Routes

All routes are authenticated via Clerk middleware. The API layer handles authorization checks.

#### Trainer Profile

```
POST   /api/trainers                    # Enroll as trainer (create profile)
GET    /api/trainers                    # List trainers (directory, paginated)
GET    /api/trainers/[trainerId]        # Get trainer detail
PUT    /api/trainers/[trainerId]        # Update trainer profile (self only)
GET    /api/trainers/me                 # Get own trainer profile
```

#### Connections

```
POST   /api/connections                 # User sends subscription request
GET    /api/connections                 # List own connections (as user or trainer)
GET    /api/connections/[id]            # Get connection detail
PATCH  /api/connections/[id]/respond    # Trainer accepts/declines
PATCH  /api/connections/[id]/end        # Either party ends connection
GET    /api/connections/active          # Get current active connection (user-side)
```

#### Routine Suggestions

```
POST   /api/suggestions                 # PT creates suggestion for client
GET    /api/suggestions                 # List suggestions (filtered by role)
GET    /api/suggestions/[id]            # Get suggestion detail
PATCH  /api/suggestions/[id]/respond    # User accepts/declines
GET    /api/suggestions/pending         # User's pending suggestions count (badge)
```

#### Client Progress (PT-Side)

```
GET    /api/clients                     # PT's connected client list with brief stats
GET    /api/clients/[clientId]/progress # Client progress detail (PT must be connected)
GET    /api/clients/[clientId]/workouts # Client workout history (PT must be connected)
GET    /api/clients/[clientId]/prs      # Client PRs (PT must be connected)
```

#### Notifications

```
GET    /api/trainer-notifications       # PT's notifications (paginated)
PATCH  /api/trainer-notifications/[id]/read  # Mark as read
POST   /api/trainer-notifications/read-all   # Mark all as read
```

### 6.2 API Response Patterns

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }

// Paginated list
{
  success: true,
  data: T[],
  pagination: {
    total: number,
    page: number,
    pageSize: number,
    hasMore: boolean
  }
}
```

### 6.3 Authorization Matrix

| Endpoint | Regular User | Trainer | Condition |
|----------|-------------|---------|-----------|
| `GET /api/trainers` | ✅ Read | ✅ Read | Public directory |
| `POST /api/trainers` | ✅ Create own | — | Becomes trainer |
| `PUT /api/trainers/[id]` | — | ✅ Own only | `trainerId === userId` |
| `POST /api/connections` | ✅ Request | — | Can only request, not approve |
| `PATCH /connections/[id]/respond` | — | ✅ | Only trainer in connection |
| `GET /api/clients/[id]/progress` | — | ✅ | Only if connected & active |
| `POST /api/suggestions` | — | ✅ | Only to connected clients |
| `PATCH /suggestions/[id]/respond` | ✅ | — | Only the target client |

---

## 7. Authentication & Authorization

### 7.1 Clerk Role Integration

Trainer status is stored in two places:

1. **Clerk User Metadata** — `publicMetadata.role: "trainer"` (for middleware-level checks)
2. **PouchDB UserProfile** — `isTrainer: true` (for local UI rendering)

```typescript
// Setting trainer role via Clerk (server-side, during enrollment)
import { clerkClient } from '@clerk/nextjs/server';

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { role: 'trainer' },
});
```

### 7.2 Middleware Updates

```typescript
// src/middleware.ts — extend public routes
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/splash(.*)',
  '/onboarding(.*)',
  '/api/auth(.*)',
  '/api/trainers',           // Public directory listing (GET only)
  '/api/trainers/[^/]+$',   // Public trainer detail (GET only)
]);

// Trainer-only routes
const isTrainerRoute = createRouteMatcher([
  '/trainer(.*)',
  '/api/clients(.*)',
  '/api/trainer-notifications(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Trainer route guard
  if (isTrainerRoute(request)) {
    const { sessionClaims } = await auth();
    if (sessionClaims?.metadata?.role !== 'trainer') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
});
```

### 7.3 Client-Side Role Check

```typescript
// Hook: useIsTrainer
import { useUser } from '@clerk/nextjs';

export function useIsTrainer(): boolean {
  const { user } = useUser();
  return user?.publicMetadata?.role === 'trainer';
}
```

---

## 8. Screen Inventory

### New Screens

| # | Screen | Route | Role | Phase |
|---|--------|-------|------|-------|
| S-PT-01 | Trainer Directory | `/trainers` | User | PT Phase 1 |
| S-PT-02 | Trainer Detail | `/trainers/[id]` | User | PT Phase 1 |
| S-PT-03 | Trainer Enrollment | `/trainer/enroll` | User → Trainer | PT Phase 1 |
| S-PT-04 | Trainer Dashboard | `/trainer` | Trainer | PT Phase 2 |
| S-PT-05 | Client List | `/trainer/clients` | Trainer | PT Phase 2 |
| S-PT-06 | Client Detail | `/trainer/clients/[id]` | Trainer | PT Phase 3 |
| S-PT-07 | Suggest Routine (Sheet) | overlay on S-PT-06 | Trainer | PT Phase 3 |
| S-PT-08 | Suggested Routines Inbox | `/routines/suggested` | User | PT Phase 3 |
| S-PT-09 | Suggestion Preview | `/routines/suggested/[id]` | User | PT Phase 3 |
| S-PT-10 | My Trainer (User View) | `/my-trainer` | User | PT Phase 2 |
| S-PT-11 | Subscription Requests | `/trainer/requests` | Trainer | PT Phase 2 |
| S-PT-12 | PT Notifications | `/trainer/notifications` | Trainer | PT Phase 4 |
| S-PT-13 | Privacy Settings | (sheet on profile) | User | PT Phase 2 |

### Modified Existing Screens

| Screen | Change |
|--------|--------|
| **Dashboard (S-05)** | Add "My Trainer" card if subscribed; add "Suggested Routines" badge |
| **Profile (S-18)** | Add "Become a Trainer" CTA if not trainer; show trainer badge if trainer |
| **Routines List** | Add "Suggested" tab/section for PT-suggested routines |
| **BottomNav** | Add trainer tab (briefcase icon) — visible only when `isTrainer === true` |

---

## 9. UI/UX Specifications

### 9.1 S-PT-01 — Trainer Directory

**Route:** `/trainers`  
**Access:** All authenticated users  
**Purpose:** Browse and discover personal trainers

```
┌─────────────────────────────────┐
│  ◀  Find a Trainer              │  ← glass-nav-bar
├─────────────────────────────────┤
│  [🔍 Search trainers...]        │  ← SearchBar (reuse existing)
│                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐    │  ← FilterChip row (horizontal scroll)
│  │Strength│ │Cardio│ │Rehab │   │     specialization filters
│  └──────┘ └──────┘ └──────┘    │
│                                  │
│  ┌───────────────────────────┐  │  ← Trainer cards (stagger list)
│  │  [📷]  Jane Smith         │  │
│  │        ★ 4.8 · 12 clients │  │
│  │        Strength · Cardio   │  │
│  │        ┌──────────────┐   │  │
│  │        │ View Profile  │   │  │  ← ghost button
│  │        └──────────────┘   │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  [📷]  Mike Johnson       │  │
│  │        ★ 4.5 · 8 clients  │  │
│  │        Powerlifting        │  │
│  │        ┌──────────────┐   │  │
│  │        │ View Profile  │   │  │
│  │        └──────────────┘   │  │
│  └───────────────────────────┘  │
│                                  │
│       ─── BottomNav ───         │
└─────────────────────────────────┘
```

**Specs:**
- Trainer cards use `.glass` material with rounded-2xl
- Avatar: 48pt circle, left-aligned
- Name: `text-base font-semibold` (headline)
- Stats: `text-xs font-medium text-[var(--brand-text-2)]`
- Specialization chips: small pill badges with category gradients
- Empty state: "No trainers found" with illustration

### 9.2 S-PT-02 — Trainer Detail

**Route:** `/trainers/[id]`  
**Purpose:** Full trainer profile with subscribe CTA

```
┌─────────────────────────────────┐
│  ◀  Trainer Profile             │
├─────────────────────────────────┤
│                                  │
│         [LARGE AVATAR]           │  ← 96pt circle, lime ring if "accepting"
│         Jane Smith               │  ← text-3xl font-extrabold
│         ★ 4.8 rating             │  ← lime stars
│                                  │
│  ┌───────────────────────────┐  │
│  │  📋 About                  │  │  ← glass card
│  │  "Certified NASM trainer   │  │
│  │   specializing in..."      │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  🎯 Specializations       │  │
│  │  ┌──────┐ ┌──────┐       │  │  ← gradient chips
│  │  │Strength│ │Cardio│      │  │
│  │  └──────┘ └──────┘       │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  📜 Certifications        │  │
│  │  • NASM-CPT (2020)        │  │
│  │  • ACE-CPT (2018)         │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  📊 Stats                 │  │
│  │  12 Clients · 3yr exp     │  │
│  │  Accepting new clients ✅  │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌──────────────────────────┐   │
│  │     SUBSCRIBE TO TRAINER  │   │  ← PrimaryButton (lime pill)
│  └──────────────────────────┘   │
│                                  │
└─────────────────────────────────┘
```

**Interaction states:**
- If already subscribed to this trainer → "UNSUBSCRIBE" (danger style)
- If subscribed to a different trainer → "Switch Trainer" with confirmation
- If subscription pending → "REQUEST PENDING" (disabled)
- If trainer is "full" → "NOT ACCEPTING CLIENTS" (disabled, muted)

### 9.3 S-PT-03 — Trainer Enrollment

**Route:** `/trainer/enroll`  
**Purpose:** User enrolls as a personal trainer

```
┌─────────────────────────────────┐
│  ◀  Become a Trainer            │
├─────────────────────────────────┤
│                                  │
│  🏋️ Share Your Expertise        │  ← text-3xl font-extrabold
│  Help others reach their        │
│  fitness goals.                  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Display Name              │  │  ← pre-filled from Clerk
│  │  [Jane Smith            ]  │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Bio (what makes you great)│  │
│  │  [                        ]│  │  ← textarea, max 500 chars
│  │  [                        ]│  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Specializations (pick 1-3)│  │
│  │  ┌──────┐ ┌──────┐       │  │  ← selectable chips (max 3)
│  │  │Strength│ │Cardio│      │  │
│  │  └──────┘ └──────┘       │  │
│  │  ┌──────┐ ┌──────┐       │  │
│  │  │Rehab  │ │Flex  │      │  │
│  │  └──────┘ └──────┘       │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Certifications            │  │
│  │  [+ Add Certification]     │  │  ← repeatable row
│  │  ┌─────────────────────┐  │  │
│  │  │ Name: [NASM-CPT   ] │  │  │
│  │  │ Issuer: [NASM     ] │  │  │
│  │  │ Year: [2020       ] │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Years of Experience       │  │
│  │  [  3  ] years             │  │  ← number stepper
│  └───────────────────────────┘  │
│                                  │
│  ┌──────────────────────────┐   │
│  │     SUBMIT APPLICATION    │   │  ← PrimaryButton
│  └──────────────────────────┘   │
│                                  │
└─────────────────────────────────┘
```

### 9.4 S-PT-04 — Trainer Dashboard

**Route:** `/trainer`  
**Access:** Trainers only  
**Purpose:** Overview of trainer's practice

```
┌─────────────────────────────────┐
│  Trainer Hub                     │  ← glass-nav-bar, no back button (tab root)
├─────────────────────────────────┤
│                                  │
│  Good morning, Jane 👋           │  ← time-based greeting (reuse dashboard pattern)
│                                  │
│  ┌───────────────────────────┐  │
│  │  📊 Quick Stats            │  │  ← glass card
│  │  ┌──────┐ ┌──────┐       │  │
│  │  │  12  │ │  3   │       │  │
│  │  │Clients│ │Pending│      │  │
│  │  └──────┘ └──────┘       │  │
│  │  ┌──────┐ ┌──────┐       │  │
│  │  │  47  │ │  89% │       │  │
│  │  │Routines│ │Comply│     │  │  ← average client compliance
│  │  │Suggested│             │  │
│  │  └──────┘ └──────┘       │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  🔔 Pending Requests (3)  │  │  ← tappable, navigates to S-PT-11
│  │  ┌──────────────────────┐ │  │
│  │  │ Alex M. · 2h ago     │ │  │  ← compact request card
│  │  │ [Accept] [Decline]   │ │  │
│  │  └──────────────────────┘ │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  👥 Recent Client Activity │  │
│  │                            │  │
│  │  Alex M. completed Push Day│  │  ← activity feed
│  │  12 min ago · 340 kcal     │  │
│  │                            │  │
│  │  Sarah K. achieved new PR  │  │
│  │  1h ago · Bench Press 80kg │  │
│  │                            │  │
│  │  [View All Clients →]      │  │
│  └───────────────────────────┘  │
│                                  │
│       ─── BottomNav ───         │  ← includes trainer tab
└─────────────────────────────────┘
```

### 9.5 S-PT-05 — Client List

**Route:** `/trainer/clients`  
**Purpose:** All connected clients with filters

```
┌─────────────────────────────────┐
│  ◀  My Clients                  │
├─────────────────────────────────┤
│  [🔍 Search clients...]         │
│                                  │
│  All (12) · Active (10) · New(2)│  ← segmented control
│                                  │
│  ┌───────────────────────────┐  │
│  │ [AV] Alex M.              │  │  ← avatar initials
│  │      Last: 2h ago · 🔥 14 │  │  ← last workout + streak
│  │      Compliance: 92%      │  │
│  │      ──────────────────   │  │  ← lime progress bar
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │ [SK] Sarah K.             │  │
│  │      Last: 1d ago · 🔥 7  │  │
│  │      Compliance: 78%      │  │
│  │      ──────────────────   │  │
│  └───────────────────────────┘  │
│                                  │
└─────────────────────────────────┘
```

### 9.6 S-PT-06 — Client Detail

**Route:** `/trainer/clients/[id]`  
**Purpose:** Deep-dive into client progress (read-only)

```
┌─────────────────────────────────┐
│  ◀  Alex M.                     │
├─────────────────────────────────┤
│                                  │
│  ┌───────────────────────────┐  │
│  │  [AV]  Alex Martinez      │  │  ← client header card
│  │        Member since Jan '26│  │
│  │        🔥 14-day streak    │  │
│  └───────────────────────────┘  │
│                                  │
│  Overview · Workouts · PRs      │  ← tabs (reuse tab animation pattern)
│  ─────────────────────────────  │
│                                  │
│  [Overview Tab]                  │
│  ┌───────────────────────────┐  │
│  │  Quick Stats               │  │
│  │  ┌────┐ ┌────┐ ┌────┐   │  │
│  │  │ 23 │ │89% │ │ 6  │   │  │
│  │  │Work│ │Rate│ │PRs │   │  │
│  │  │outs│ │    │ │    │   │  │
│  │  └────┘ └────┘ └────┘   │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Volume Trend (8 weeks)    │  │  ← reuse VolumeTrendChart
│  │  [████ ██ ████ ███ █████] │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Body Part Focus           │  │  ← reuse BodyPartChart
│  │  Chest  ████████           │  │
│  │  Legs   ██████             │  │
│  │  Back   █████              │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌──────────────────────────┐   │
│  │   SUGGEST A ROUTINE       │   │  ← PrimaryButton → opens S-PT-07
│  └──────────────────────────┘   │
│                                  │
└─────────────────────────────────┘
```

### 9.7 S-PT-08 — Suggested Routines Inbox (User Side)

**Route:** `/routines/suggested`  
**Purpose:** User views routines suggested by their PT

```
┌─────────────────────────────────┐
│  ◀  Suggested Routines          │
├─────────────────────────────────┤
│                                  │
│  From: Jane Smith (Your PT)     │  ← trainer attribution
│                                  │
│  ┌───────────────────────────┐  │
│  │  🆕 Push Day — Strength    │  │  ← pending suggestion
│  │  "Focus on progressive     │  │
│  │   overload this week"      │  │  ← trainer note preview
│  │  3 phases · ~45 min        │  │
│  │  Suggested 2h ago          │  │
│  │  ┌─────────┐ ┌─────────┐ │  │
│  │  │ Preview  │ │ Accept  │ │  │
│  │  └─────────┘ └─────────┘ │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  ✅ Leg Day — Lower Body   │  │  ← accepted suggestion
│  │  Accepted 3 days ago       │  │
│  │  [View Routine →]          │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  ❌ Core Blast (Declined)  │  │  ← declined (muted)
│  └───────────────────────────┘  │
│                                  │
└─────────────────────────────────┘
```

### 9.8 S-PT-10 — My Trainer (User View)

**Route:** `/my-trainer`  
**Purpose:** User's view of their active PT connection

```
┌─────────────────────────────────┐
│  ◀  My Trainer                  │
├─────────────────────────────────┤
│                                  │
│  ┌───────────────────────────┐  │
│  │  [AVATAR]  Jane Smith     │  │
│  │  ★ 4.8 · Strength, Cardio │  │
│  │  Connected since Feb 2026  │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  📬 Suggested Routines (1) │  │  ← badge count, navigates to S-PT-08
│  │  [View Suggestions →]      │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  🔒 Privacy Settings      │  │
│  │  Workout History     [✅] │  │  ← toggle switches
│  │  Personal Records    [✅] │  │
│  │  Body Stats          [❌] │  │
│  │  Streak Data         [✅] │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │  📊 What Your PT Sees     │  │
│  │  Preview of shared data... │  │  ← transparency: show user exactly
│  └───────────────────────────┘  │     what the PT can access
│                                  │
│  ┌──────────────────────────┐   │
│  │     UNSUBSCRIBE           │   │  ← danger style button
│  └──────────────────────────┘   │
│                                  │
└─────────────────────────────────┘
```

---

## 10. Sync & Real-Time Architecture

### 10.1 Data Flow Diagram

```
┌─────────────────────┐          ┌──────────────────────────────┐
│                     │          │                              │
│   USER DEVICE       │          │     SERVER (Next.js API)     │
│                     │          │                              │
│ ┌─────────────────┐ │  HTTPS   │ ┌──────────────────────────┐│
│ │ PouchDB (local) │─┼──────────┼→│ /api/couch/* (existing)  ││ ← User's own workout data
│ │ routines,       │ │  sync    │ │ → CouchDB per-user DBs   ││   (unchanged from Phase 8)
│ │ workouts, etc.  │ │          │ └──────────────────────────┘│
│ └─────────────────┘ │          │                              │
│                     │          │ ┌──────────────────────────┐│
│ ┌─────────────────┐ │  REST    │ │ /api/trainers/*          ││
│ │ TanStack Query  │─┼──────────┼→│ /api/connections/*       ││ ← PT portal data
│ │ (cache layer)   │ │  API     │ │ /api/suggestions/*       ││   (new, server-authoritative)
│ │ PT data cache   │ │  calls   │ │ /api/clients/*           ││
│ └─────────────────┘ │          │ │ → CouchDB shared DBs     ││
│                     │          │ └──────────────────────────┘│
└─────────────────────┘          └──────────────────────────────┘
```

### 10.2 Key Insight: Hybrid Architecture

The PT portal uses a **server-authoritative** model for cross-user data, unlike the existing local-first pattern:

| Existing (Local-First) | PT Portal (Server-Authoritative) |
|------------------------|----------------------------------|
| PouchDB ← writes first | API ← writes first |
| Sync to CouchDB in background | TanStack Query caches API responses |
| Works fully offline | Requires connectivity for PT features |
| User owns all data | Data spans multiple users |

**Graceful degradation:** When offline, PT features show cached data with "Last updated X ago" indicators. Core workout tracking (local-first) still works without any PT dependency.

### 10.3 Progress Snapshot Generation

Progress snapshots are generated **server-side** when a PT requests client data:

```
PT opens Client Detail
  → GET /api/clients/[id]/progress
    → Server reads client's synced CouchDB data
    → Aggregates into ClientProgressSnapshot
    → Caches with 15-minute TTL
    → Returns to PT
```

**No background jobs.** Snapshots are computed on-demand with short-lived caching. For MVP this keeps the architecture simple.

### 10.4 Routine Suggestion Flow

```
PT creates routine in builder
  → Tags for client → POST /api/suggestions
    → Server stores RoutineSuggestion doc
    → [Future: Push notification to user]

User opens Suggested Routines
  → GET /api/suggestions/pending
    → Displays suggestion cards

User accepts suggestion
  → PATCH /api/suggestions/[id]/respond { status: 'accepted' }
    → Server marks suggestion as accepted
    → Client-side: copies routineSnapshot into local PouchDB as new Routine
    → User now owns the routine (can edit, execute, etc.)
```

---

## 11. Implementation Phases

### PT Phase 1 — Trainer Enrollment & Directory (Foundation)

**Goal:** Trainers can enroll; users can browse and view trainer profiles.  
**Estimate:** ~2 weeks

#### Tasks

**Data Layer**
- [ ] Define new TypeScript interfaces in `src/types/index.ts` (TrainerProfile, TrainerSpecialization, TrainerCertification, etc.)
- [ ] Create CouchDB shared database setup for `fitforge_trainers`
- [ ] Create API provisioning for trainer database (extend `provision-couch` or separate script)

**API Routes**
- [ ] `POST /api/trainers` — create trainer profile (enrollment)
- [ ] `GET /api/trainers` — list trainers with pagination, search, filter
- [ ] `GET /api/trainers/[trainerId]` — single trainer detail
- [ ] `PUT /api/trainers/[trainerId]` — update own profile
- [ ] `GET /api/trainers/me` — get own trainer profile

**Clerk Integration**
- [ ] Add `role: "trainer"` to Clerk `publicMetadata` on enrollment
- [ ] Create `useIsTrainer()` hook
- [ ] Update middleware for trainer-only route protection

**Components**
- [ ] `TrainerCard` — directory list item (avatar, name, rating, specializations)
- [ ] `TrainerDetailView` — full profile display
- [ ] `TrainerEnrollmentForm` — multi-step form (bio, specializations, certifications, experience)

**Pages**
- [ ] `/trainers` — Trainer Directory (S-PT-01)
- [ ] `/trainers/[id]` — Trainer Detail (S-PT-02)
- [ ] `/trainer/enroll` — Enrollment Form (S-PT-03)

**Navigation**
- [ ] Add "Find a Trainer" entry point on Profile page
- [ ] Add "Become a Trainer" CTA on Profile page (conditional: not already trainer)

---

### PT Phase 2 — Connections & Trainer Dashboard

**Goal:** Users can subscribe to trainers; trainers get a dashboard with client management.  
**Estimate:** ~2 weeks

#### Tasks

**Data Layer**
- [ ] Define TrainerConnection, ConnectionStatus interfaces
- [ ] Create `fitforge_connections` CouchDB database
- [ ] Add `isTrainer`, `activeTrainerId`, `activeConnectionId` to UserProfile type

**API Routes**
- [ ] `POST /api/connections` — user sends subscription request
- [ ] `GET /api/connections` — list connections (role-aware)
- [ ] `PATCH /api/connections/[id]/respond` — trainer accepts/declines
- [ ] `PATCH /api/connections/[id]/end` — either party ends
- [ ] `GET /api/connections/active` — user's current active connection
- [ ] `GET /api/clients` — trainer's connected client list

**Stores**
- [ ] Create `useTrainerStore` (or extend existing) — active connection state, trainer profile cache
- [ ] TanStack Query hooks: `useTrainers()`, `useTrainer(id)`, `useConnections()`, `useClients()`

**Components**
- [ ] `SubscribeButton` — context-aware (subscribe/pending/unsubscribe)
- [ ] `ConnectionRequestCard` — accept/decline UI for trainer
- [ ] `ClientCard` — trainer's client list item
- [ ] `TrainerDashboard` — stats grid + request queue + activity feed
- [ ] `MyTrainerCard` — user's subscribed trainer summary card
- [ ] `PrivacySettingsSheet` — toggle what data is shared

**Pages**
- [ ] `/trainer` — Trainer Dashboard (S-PT-04)
- [ ] `/trainer/clients` — Client List (S-PT-05)
- [ ] `/trainer/requests` — Pending Requests (S-PT-11)
- [ ] `/my-trainer` — My Trainer view (S-PT-10)

**Navigation**
- [ ] Add trainer tab to BottomNav (conditional on `isTrainer`)
- [ ] Add "My Trainer" card to Dashboard (conditional on active subscription)

---

### PT Phase 3 — Routine Suggestions & Client Progress

**Goal:** PTs can view client progress and suggest routines; users can accept/decline suggestions.  
**Estimate:** ~2 weeks

#### Tasks

**Data Layer**
- [ ] Define RoutineSuggestion, SuggestionStatus, ClientProgressSnapshot interfaces
- [ ] Create `fitforge_suggestions` and `fitforge_progress_snapshots` CouchDB databases

**API Routes**
- [ ] `POST /api/suggestions` — PT creates routine suggestion
- [ ] `GET /api/suggestions` — list suggestions (role-aware filter)
- [ ] `GET /api/suggestions/pending` — user's pending suggestion count
- [ ] `PATCH /api/suggestions/[id]/respond` — user accepts/declines
- [ ] `GET /api/clients/[clientId]/progress` — aggregated client stats
- [ ] `GET /api/clients/[clientId]/workouts` — client workout history
- [ ] `GET /api/clients/[clientId]/prs` — client PRs

**Components**
- [ ] `SuggestRoutineSheet` — bottom sheet for PT to select/create routine for client
- [ ] `SuggestionCard` — user-side suggestion (preview, accept, decline)
- [ ] `ClientProgressView` — reuse VolumeTrendChart, BodyPartChart for PT's client view
- [ ] `ClientWorkoutList` — read-only session history for PT
- [ ] `SuggestionBadge` — notification badge on routines tab

**Pages**
- [ ] `/trainer/clients/[id]` — Client Detail with progress (S-PT-06)
- [ ] `/routines/suggested` — Suggested Routines Inbox (S-PT-08)
- [ ] `/routines/suggested/[id]` — Suggestion Preview (S-PT-09)

**Flows**
- [ ] PT: Routine builder → tag for client → POST suggestion
- [ ] User: Accept suggestion → copy routine to local PouchDB → navigate to routine detail

---

### PT Phase 4 — Notifications & Polish

**Goal:** Real-time notifications for trainers; polish and edge cases.  
**Estimate:** ~1 week

#### Tasks

**Data Layer**
- [ ] Define TrainerNotification type
- [ ] Create `fitforge_trainer_notifications` CouchDB database

**API Routes**
- [ ] `GET /api/trainer-notifications` — paginated notifications
- [ ] `PATCH /api/trainer-notifications/[id]/read` — mark read
- [ ] `POST /api/trainer-notifications/read-all` — mark all read

**Components**
- [ ] `NotificationBell` — in trainer nav bar with unread count badge
- [ ] `NotificationList` — full notification feed
- [ ] `NotificationItem` — individual notification row

**Pages**
- [ ] `/trainer/notifications` — Notification Center (S-PT-12)

**Polish & Edge Cases**
- [ ] Offline graceful degradation for all PT screens
- [ ] Empty states for all lists (no clients, no suggestions, no notifications)
- [ ] Loading skeletons for all API-driven screens
- [ ] Error states with retry actions
- [ ] Animations: push/pop variants for all new pages, stagger for lists
- [ ] Safe area compliance on all new screens

---

### PT Phase 5 — Payment & Subscription (Future)

> **Deferred.** The connection model is built to be payment-agnostic. When ready:

- [ ] Integrate payment provider (Stripe, RevenueCat, etc.)
- [ ] Subscription tiers (free trial, monthly, per-session)
- [ ] Payment status checks in connection approval flow
- [ ] Trainer earnings dashboard
- [ ] Invoice/receipt generation
- [ ] Refund handling

---

## 12. Open Questions & Future Considerations

### Open Questions

| # | Question | Impact | Decision Needed By |
|---|----------|--------|-------------------|
| 1 | **PT approval process** — Auto-approve or admin review? | MVP: auto-approve. Consider verification badges later | PT Phase 1 |
| 2 | **Connection limit** — Can users have multiple PTs? | MVP: 1 PT at a time. Could extend to multiple (e.g., strength PT + cardio PT) | PT Phase 2 |
| 3 | **Trainer directory visibility** — Is the directory page public (unauthenticated) or authenticated-only? | Currently planned as authenticated. Public could help marketing | PT Phase 1 |
| 4 | **Chat/messaging** — Should PT↔User have direct messaging? | Deferred. Start with routine suggestions + notes only | PT Phase 5+ |
| 5 | **Trainer can execute workouts** — Should PT's own workouts count toward client stats? | No — PT's own data is separate. Only PouchDB is synced per-user | N/A (clarified) |
| 6 | **Group coaching** — Can a PT create a routine and blast it to all clients? | Deferred. Start with 1:1 suggestions | PT Phase 5+ |
| 7 | **Client can rate PT** — Reviews and star ratings? | Deferred. Add after payment model to ensure real connections | PT Phase 5+ |
| 8 | **Trainer profile photo** — Use Clerk avatar or custom upload? | Start with Clerk avatar. Add custom upload later if needed | PT Phase 1 |

### Future Enhancements (Post-MVP)

- **In-app messaging** — real-time chat between PT and client
- **Video exercise demos** — PT can record custom exercise videos
- **Program templates** — PT creates multi-week periodized programs
- **Group classes** — PT broadcasts routines to all clients simultaneously
- **Live session** — PT monitors client's workout in real-time
- **Trainer verification badges** — admin-verified credentials
- **Review & rating system** — clients rate trainers after N sessions
- **Trainer analytics** — client retention, average compliance, revenue tracking
- **White-label** — PTs can brand the app for their business
- **Calendar integration** — scheduled sessions with PT, reminders

---

## File Structure (New Files)

```
src/
├── app/
│   ├── (app)/
│   │   ├── trainers/
│   │   │   ├── page.tsx                    # S-PT-01: Trainer Directory
│   │   │   └── [id]/
│   │   │       └── page.tsx                # S-PT-02: Trainer Detail
│   │   ├── trainer/
│   │   │   ├── page.tsx                    # S-PT-04: Trainer Dashboard
│   │   │   ├── enroll/
│   │   │   │   └── page.tsx                # S-PT-03: Enrollment Form
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx                # S-PT-05: Client List
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx            # S-PT-06: Client Detail
│   │   │   ├── requests/
│   │   │   │   └── page.tsx                # S-PT-11: Subscription Requests
│   │   │   └── notifications/
│   │   │       └── page.tsx                # S-PT-12: Notifications
│   │   ├── my-trainer/
│   │   │   └── page.tsx                    # S-PT-10: My Trainer
│   │   └── routines/
│   │       └── suggested/
│   │           ├── page.tsx                # S-PT-08: Suggestions Inbox
│   │           └── [id]/
│   │               └── page.tsx            # S-PT-09: Suggestion Preview
│   └── api/
│       ├── trainers/
│       │   ├── route.ts                    # POST (enroll) + GET (list)
│       │   ├── me/
│       │   │   └── route.ts                # GET own profile
│       │   └── [trainerId]/
│       │       └── route.ts                # GET + PUT trainer
│       ├── connections/
│       │   ├── route.ts                    # POST + GET
│       │   ├── active/
│       │   │   └── route.ts                # GET active connection
│       │   └── [id]/
│       │       ├── respond/
│       │       │   └── route.ts            # PATCH accept/decline
│       │       └── end/
│       │           └── route.ts            # PATCH end connection
│       ├── suggestions/
│       │   ├── route.ts                    # POST + GET
│       │   ├── pending/
│       │   │   └── route.ts                # GET pending count
│       │   └── [id]/
│       │       └── respond/
│       │           └── route.ts            # PATCH accept/decline
│       ├── clients/
│       │   ├── route.ts                    # GET client list
│       │   └── [clientId]/
│       │       ├── progress/
│       │       │   └── route.ts            # GET progress
│       │       ├── workouts/
│       │       │   └── route.ts            # GET workout history
│       │       └── prs/
│       │           └── route.ts            # GET PRs
│       └── trainer-notifications/
│           ├── route.ts                    # GET notifications
│           ├── read-all/
│           │   └── route.ts                # POST mark all read
│           └── [id]/
│               └── read/
│                   └── route.ts            # PATCH mark read
├── components/
│   └── trainer/
│       ├── TrainerCard.tsx                  # Directory list item
│       ├── TrainerDetailView.tsx            # Full profile
│       ├── TrainerEnrollmentForm.tsx        # Enrollment wizard
│       ├── TrainerDashboard.tsx             # PT dashboard
│       ├── SubscribeButton.tsx              # Context-aware subscribe CTA
│       ├── ConnectionRequestCard.tsx        # Accept/decline card
│       ├── ClientCard.tsx                   # Client list item
│       ├── ClientProgressView.tsx           # Client stats (reuses charts)
│       ├── SuggestRoutineSheet.tsx          # Suggest routine bottom sheet
│       ├── SuggestionCard.tsx               # User-side suggestion card
│       ├── SuggestionBadge.tsx              # Notification badge
│       ├── MyTrainerCard.tsx                # Dashboard trainer summary
│       ├── PrivacySettingsSheet.tsx         # Data sharing toggles
│       ├── NotificationBell.tsx             # Trainer nav notification icon
│       └── NotificationItem.tsx             # Notification row
├── hooks/
│   ├── useIsTrainer.ts                     # Role check hook
│   ├── useTrainerProfile.ts                # Trainer's own profile
│   ├── useTrainers.ts                      # Directory listing (TanStack Query)
│   ├── useConnections.ts                   # Connection management
│   ├── useClients.ts                       # Trainer's client list
│   ├── useSuggestions.ts                   # Routine suggestions
│   ├── useClientProgress.ts               # Client progress data
│   └── useTrainerNotifications.ts         # Notification polling
└── types/
    └── index.ts                            # Extended with all new interfaces
```

---

## Summary

The Personal Trainer Portal transforms FitForge from a solo training tool into a connected platform. By using a **hybrid architecture** (local-first for workouts, server-authoritative for cross-user PT features), we preserve the offline capability that makes FitForge special while adding the multi-user collaboration that trainers need.

The implementation is split into **4 phases** (+ 1 future payment phase), each independently shippable:

| Phase | Deliverable | Key Capability |
|-------|------------|----------------|
| PT Phase 1 | Enrollment + Directory | Trainers can join; users can browse |
| PT Phase 2 | Connections + Dashboard | Users subscribe; trainers manage clients |
| PT Phase 3 | Suggestions + Progress | PTs guide clients with routines and data |
| PT Phase 4 | Notifications + Polish | Real-time updates, production readiness |
| PT Phase 5 | Payment (Future) | Monetization layer |

**Payment and subscription billing is explicitly deferred** — the bridge model is designed to have payment gates plugged in at the connection approval step without architectural changes.

---

**Created:** March 2026  
**Last Updated:** March 2026  
**Document Version:** 1.0
