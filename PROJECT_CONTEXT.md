# Health Tracker — Project Context

## Stack
- Frontend: Next.js **16.2.7** App Router, Tailwind CSS v4, TypeScript
- Backend: Express.js v5
- Database: PostgreSQL (Docker)
- ORM: Prisma 7
- Monorepo: /frontend and /backend folders at project root

## CRITICAL: Next.js 16 differences from Next.js 14
- **`middleware.ts` is DEPRECATED and RENAMED to `proxy.ts`**
  - File must be at `frontend/proxy.ts` (project root, same level as `app/`)
  - Exported function must be named `proxy` (not `middleware`)
  - `export const config = { matcher: [...] }` still works the same way
- Always read `frontend/node_modules/next/dist/docs/` before writing Next.js code
- AGENTS.md in frontend says: "Heed deprecation notices"

## Prisma 7 quirks (important)
- Datasource config lives in `prisma.config.ts`, NOT in `schema.prisma`
- Requires `@prisma/adapter-pg` driver adapter passed to PrismaClient constructor
- Seed command uses `node` with a `.js` file (not ts-node) due to ESM config
- `prisma.config.ts` holds datasource URL, migrations path, and seed command

## Database
- Running via Docker on port 5432
- Connection: postgresql://health-tracker:secret@localhost:5432/health_db
- PrismaClient must be constructed with adapter:
  ```js
  const { PrismaPg } = require('@prisma/adapter-pg')
  const { PrismaClient } = require('@prisma/client')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })
  ```

## Schema (6 tables)
- User — id, email, password, name, createdAt
- MuscleGroup — id, name, userId
- ExerciseDefinition — id, name, muscleGroupId
- Session — id, date, userId, muscleGroupId
- SessionExercise — id, sessionId, exerciseDefinitionId
- Set — id, sessionExerciseId, setNumber, weight (Float), reps

## Seeded test user
- email: ishu@example.com
- password: password123
- userId: 1
- Has: Chest, Triceps, Back, Biceps, Legs, Shoulders muscle groups
- Has: 2 chest sessions (May 19, June 05) and 1 triceps session (June 05) with full sets

## Authentication (implemented)
- Backend: JWT via `jsonwebtoken`. Secret in `backend/.env` as `JWT_SECRET`
- Middleware: `backend/middleware/auth.js` — reads `Authorization: Bearer <token>`, verifies JWT, attaches `req.user.userId`
- All API endpoints are protected with `authenticate` middleware
- Token payload: `{ userId: number }`
- Tokens expire in 7 days

### Auth endpoints
- `POST /api/auth/register` — body: `{ name, email, password }` → returns `{ token, user: { id, name, email } }`
- `POST /api/auth/login` — body: `{ email, password }` → returns `{ token, user: { id, name, email } }` or 401

### Frontend auth architecture
- **`frontend/lib/auth.ts`** — `saveToken(token)`, `getToken()`, `removeToken()`, `isLoggedIn()`, `getUserId()`
  - `saveToken` saves to localStorage AND sets a non-HttpOnly flag cookie `auth_flag=1` (so proxy.ts can read it server-side)
  - `removeToken` clears both localStorage and the cookie
  - `getUserId()` decodes JWT payload client-side via `atob()` — no verification (backend verifies)
- **`frontend/lib/api.ts`** — `apiFetch(path, init?)` wrapper around fetch
  - Automatically adds `Authorization: Bearer <token>` header
  - Always sets `Content-Type: application/json`
  - On 401: calls `removeToken()` and redirects to `/login`
  - Use `apiFetch` for ALL API calls in the app (never raw `fetch` to the backend)
- **`frontend/proxy.ts`** — route guard (Next.js 16 proxy, replaces middleware.ts)
  - Unauthenticated user → /dashboard redirects to /login
  - Authenticated user → /login or /register redirects to /dashboard
  - Reads `auth_flag` cookie (set by `saveToken`)

### Auth pages
- `/login` — `frontend/app/login/page.tsx`
- `/register` — `frontend/app/register/page.tsx`

## Frontend pages
- `/login` — email + password sign-in form
- `/register` — name + email + password registration form
- `/dashboard` — main page with two tabs (protected by proxy.ts)
  - Tab 1 Overview: stat cards + exercise calendar
  - Tab 2 Workout log: muscle group selector + session navigator
  - Top bar has "Log workout" button + logout button (ti-logout icon)

## Components built
- StatCard.tsx — stat card with value, label, icon (tabler), sub text
- ExerciseCalendar.tsx — monthly calendar, exercise days highlighted in teal, prev/next month navigation, month summary bar. Takes `exercisedDates: string[]` (ISO date strings)
- WorkoutLog.tsx — muscle group pill selector + renders SessionView. Takes `onLogSession?: (muscleGroupId: number) => void`
- SessionView.tsx — single session card with ← → navigation between sessions, dot indicators. Uses clamped safeIndex to prevent out-of-bounds crash when switching muscle groups
- SetTable.tsx — one exercise with set rows (set number, weight, reps)
- LogSessionModal.tsx — two-step modal: Step 1 picks muscle group + date, Step 2 toggles exercises and enters sets per exercise. Supports adding new exercises to DB inline

## Types (frontend/types/workout.ts)
```ts
type Set = { weight: number; reps: number }
type Exercise = { name: string; sets: Set[] }
type Session = { date: string; exercises: Exercise[] }
type MuscleGroup = { id: number; name: string; sessions: Session[] }
```

## Design system
- Minimal, clean, wellness feel
- Single accent color: teal
  - Primary: #0F6E56 (teal-700) — buttons, active states, icons
  - Light: #E1F5EE (teal-50) — backgrounds, badges, exercise day cells
  - Text on teal: #085041 (teal-800)
- All neutrals otherwise: gray scale
- Tabler icons loaded via CDN in layout.tsx:
  https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css
- Cards: white bg, 0.5px border-gray-100, rounded-xl
- Buttons: bg-teal-700 text-teal-50 rounded-lg
- All inputs: `text-base` (16px minimum) to prevent iOS auto-zoom on focus

## API endpoints (all in backend/index.js, all require Bearer token)

### POST /api/auth/register (public)
```json
{ "name": "Vishal", "email": "v@example.com", "password": "pass" }
→ { "token": "...", "user": { "id": 2, "name": "Vishal", "email": "v@example.com" } }
```

### POST /api/auth/login (public)
```json
{ "email": "ishu@example.com", "password": "password123" }
→ { "token": "...", "user": { "id": 1, "name": "Ishu", "email": "ishu@example.com" } }
```

### GET /api/muscle-groups (auth required)
Returns all muscle groups for the authenticated user with nested sessions → exercises → sets.
Dates formatted as "Tuesday, May 19, 2026" (US locale, UTC timezone).
```json
[{ "id": 1, "name": "Chest", "sessions": [...] }]
```

### GET /api/stats (auth required)
```json
{ "gymSessions": 3, "exerciseDays": 2, "dayStreak": 0 }
```

### GET /api/sessions (auth required)
Returns unique ISO date strings for all sessions. Used by ExerciseCalendar.
```json
["2026-05-19", "2026-06-05"]
```

### GET /api/exercises?muscleGroupId=1 (auth required)
Returns exercise definitions for a muscle group (for LogSessionModal step 2):
```json
[{ "id": 1, "name": "Bench press" }, ...]
```

### GET /api/exercise-definitions (auth required)
Returns all muscle groups with their exercises grouped:
```json
[{ "id": 1, "name": "Chest", "exercises": [...] }]
```

### POST /api/exercise-definitions (auth required)
Adds a new exercise to a muscle group:
```json
{ "name": "Pec deck", "muscleGroupId": 1 }
```

### POST /api/sessions (auth required)
Creates a full session. userId comes from the JWT — do NOT send it in the body.
```json
{
  "muscleGroupId": 1,
  "date": "2026-06-09",
  "exercises": [
    {
      "exerciseDefinitionId": 1,
      "sets": [{ "setNumber": 1, "weight": 10, "reps": 8 }]
    }
  ]
}
```

## Log session UI flow (built)
Two-step modal (`LogSessionModal.tsx`) triggered from:
- "Log workout" button in top bar (no pre-selection)
- "Log session" button in WorkoutLog tab (pre-selects current muscle group)

### Step 1 — Session details
- Pick muscle group (pill buttons, pre-selected if opened from WorkoutLog)
- Pick date (date input, defaults to today)

### Step 2 — Add exercises
- Exercises loaded from GET /api/exercises?muscleGroupId=
- Toggle exercises on/off; selecting one auto-adds one set row
- Per-set weight + reps inputs, "+ Add set", "×" to remove a set (min 1 set)
- "Add new exercise" text input at bottom — POSTs to /api/exercise-definitions, auto-selects it
- "Save session" calls POST /api/sessions, then silently refreshes all dashboard data

## Domain rules (important for building correctly)
- Each set has INDEPENDENT weight and reps — never group as "3×8"
- Progression = more reps at same weight, OR more weight, OR added a set
- Each muscle group is a SEPARATE session even if trained same day
  (e.g. Monday = Chest session + Triceps session, both dated Monday)
- Muscle groups and exercise definitions are DB-driven, not hardcoded
- All data is user-scoped — every query filters by userId from JWT (never hardcoded)

## Training split (for seed data reference)
- Mon/Thu: Chest + Triceps
- Tue/Fri: Back + Biceps
- Wed/Sat: Legs + Shoulders
- Sun: Rest

## Known bugs fixed
- SessionView crash when switching muscle groups: index clamped with `Math.min(currentIndex, sessions.length - 1)` during render instead of relying on useEffect (which fires after render)

## Progress
1. ~~Build Express API endpoints~~ ✓
2. ~~Connect Next.js frontend to API (replace hardcoded data)~~ ✓
3. ~~Build log session form (two-step flow)~~ ✓
4. ~~Add authentication (login/register pages, JWT)~~ ✓
5. Mobile-friendly layout pass

## Environment
- Backend runs on port 5000: `npm run dev` from `/backend`
- Frontend runs on port 3000: `npm run dev` from `/frontend`
- `frontend/.env.local` must have: `NEXT_PUBLIC_API_URL=http://192.168.1.132:5000`
  (use LAN IP so both laptop browser and iPhone on same WiFi can reach backend)
- `backend/.env` has `DATABASE_URL` and `JWT_SECRET`
