# Health Tracker — Project Context

## Stack
- Frontend: Next.js 14 App Router, Tailwind CSS, TypeScript
- Backend: Express.js
- Database: PostgreSQL (Docker)
- ORM: Prisma 7
- Monorepo: /frontend and /backend folders at project root

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

## Frontend pages
- /dashboard — main page with two tabs
  - Tab 1 Overview: stat cards + exercise calendar
  - Tab 2 Workout log: muscle group selector + session navigator

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

## API endpoints (all implemented in backend/index.js)

### GET /api/muscle-groups
Returns all muscle groups for userId=1 with nested sessions → exercises → sets.
Dates formatted as "Tuesday, May 19, 2026" (US locale, UTC timezone).
```json
[{ "id": 1, "name": "Chest", "sessions": [...] }]
```

### GET /api/stats
Returns stat card data for userId=1:
```json
{ "gymSessions": 3, "exerciseDays": 2, "dayStreak": 0 }
```

### GET /api/sessions
Returns unique ISO date strings for all sessions (userId=1). Used by ExerciseCalendar.
```json
["2026-05-19", "2026-06-05"]
```

### GET /api/exercises?muscleGroupId=1
Returns exercise definitions for a muscle group (for LogSessionModal step 2):
```json
[{ "id": 1, "name": "Bench press" }, ...]
```

### GET /api/exercise-definitions
Returns all muscle groups with their exercises grouped (used internally):
```json
[{ "id": 1, "name": "Chest", "exercises": [...] }]
```

### POST /api/exercise-definitions
Adds a new exercise to a muscle group (called from LogSessionModal "Add new exercise"):
```json
{ "name": "Pec deck", "muscleGroupId": 1 }
```

### POST /api/sessions
Creates a full session with exercises and sets in one call:
```json
{
  "userId": 1,
  "muscleGroupId": 1,
  "date": "2026-06-09",
  "exercises": [
    {
      "exerciseDefinitionId": 1,
      "sets": [
        { "setNumber": 1, "weight": 10, "reps": 8 }
      ]
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
- All data is user-scoped — every query must filter by userId
- userId is hardcoded to 1 everywhere until auth is added

## Training split (for seed data reference)
- Mon/Thu: Chest + Triceps
- Tue/Fri: Back + Biceps
- Wed/Sat: Legs + Shoulders
- Sun: Rest

## Known bugs fixed
- SessionView crash when switching muscle groups: index clamped with `Math.min(currentIndex, sessions.length - 1)` during render instead of relying on useEffect (which fires after render)

## Next steps in order
1. ~~Build Express API endpoints~~ ✓
2. ~~Connect Next.js frontend to API (replace hardcoded data)~~ ✓
3. ~~Build log session form (two-step flow)~~ ✓
4. Add authentication (login/register pages, JWT)
5. Mobile-friendly layout pass


## Current session status (June 09 2026)
- UI loads on iPhone at http://192.168.1.132:3000 ✓
- Network access confirmed working ✓
- Frontend still using hardcoded data
- Backend has no endpoints yet

## Immediate next steps (in this order)
1. Build Express API endpoints
2. Connect frontend to API
3. Mobile layout pass
4. Test full app on iPhone
5. Build log session form
6. Authentication

## Environment setup for API connection
Create frontend/.env.local with:
NEXT_PUBLIC_API_URL=http://192.168.1.132:5000

All API calls must use:
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/...`)

This works from both laptop browser and iPhone on same WiFi.
Backend must run with npm run dev from /backend folder.