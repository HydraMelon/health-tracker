const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('./middleware/auth');
const logger = require('./logger');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

// ── Request logging ───────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    logger.error(`POST /api/auth/register — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    logger.error(`POST /api/auth/login — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Protected endpoints ───────────────────────────────────────────────────────

app.post('/api/muscle-groups', authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });

  try {
    const group = await prisma.muscleGroup.create({
      data: { name: name.trim(), userId: req.user.userId },
    });
    res.status(201).json({ id: group.id, name: group.name });
  } catch (err) {
    logger.error(`POST /api/muscle-groups — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/muscle-groups', authenticate, async (req, res) => {
  try {
    const groups = await prisma.muscleGroup.findMany({
      where: { userId: req.user.userId },
      include: {
        sessions: {
          orderBy: { date: 'asc' },
          include: {
            sessionExercises: {
              include: {
                exerciseDefinition: true,
                sets: { orderBy: { setNumber: 'asc' } },
              },
            },
          },
        },
      },
    });

    const result = groups.map(group => ({
      id: group.id,
      name: group.name,
      sessions: group.sessions.map(session => ({
        date: session.date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          timeZone: 'UTC',
        }),
        exercises: session.sessionExercises.map(se => ({
          name: se.exerciseDefinition.name,
          sets: se.sets.map(s => ({ weight: s.weight, reps: s.reps })),
        })),
      })),
    }));

    res.json(result);
  } catch (err) {
    logger.error(`GET /api/muscle-groups — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.userId },
      select: { date: true },
    });

    const gymSessions = sessions.length;

    const uniqueDates = [...new Set(sessions.map(s => s.date.toISOString().split('T')[0]))];
    const exerciseDays = uniqueDates.length;

    uniqueDates.sort().reverse();
    let dayStreak = 0;
    if (uniqueDates.length > 0) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const mostRecent = new Date(uniqueDates[0]);
      const gapDays = Math.round((today - mostRecent) / 86400000);
      if (gapDays <= 1) {
        let prev = mostRecent;
        for (const dateStr of uniqueDates) {
          const d = new Date(dateStr);
          const diff = Math.round((prev - d) / 86400000);
          if (diff === 0 || diff === 1) {
            dayStreak++;
            prev = d;
          } else {
            break;
          }
        }
      }
    }

    res.json({ gymSessions, exerciseDays, dayStreak });
  } catch (err) {
    logger.error(`GET /api/stats — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.userId },
      select: { date: true },
    });

    const uniqueDates = [...new Set(sessions.map(s => s.date.toISOString().split('T')[0]))];
    res.json(uniqueDates);
  } catch (err) {
    logger.error(`GET /api/sessions — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/exercise-definitions', authenticate, async (req, res) => {
  try {
    const muscleGroups = await prisma.muscleGroup.findMany({
      where: { userId: req.user.userId },
      include: {
        exerciseDefinitions: {
          select: { id: true, name: true },
        },
      },
    });

    const result = muscleGroups.map(g => ({
      id: g.id,
      name: g.name,
      exercises: g.exerciseDefinitions,
    }));

    res.json(result);
  } catch (err) {
    logger.error(`GET /api/exercise-definitions — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/exercises', authenticate, async (req, res) => {
  const muscleGroupId = parseInt(req.query.muscleGroupId);
  if (!muscleGroupId) return res.status(400).json({ error: 'muscleGroupId required' });

  try {
    const exercises = await prisma.exerciseDefinition.findMany({
      where: {
        muscleGroupId,
        muscleGroup: { userId: req.user.userId },   // verify ownership
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(exercises);
  } catch (err) {
    logger.error(`GET /api/exercises — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/exercise-definitions', authenticate, async (req, res) => {
  const { name, muscleGroupId } = req.body;
  if (!name || !muscleGroupId) return res.status(400).json({ error: 'name and muscleGroupId required' });

  try {
    const group = await prisma.muscleGroup.findFirst({
      where: { id: muscleGroupId, userId: req.user.userId },
    });
    if (!group) return res.status(403).json({ error: 'Forbidden' });

    const exercise = await prisma.exerciseDefinition.create({
      data: { name: name.trim(), muscleGroupId },
    });
    res.status(201).json(exercise);
  } catch (err) {
    logger.error(`POST /api/exercise-definitions — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sessions', authenticate, async (req, res) => {
  const { muscleGroupId, date, exercises } = req.body;
  const userId = req.user.userId;

  if (!muscleGroupId || !date) {
    return res.status(400).json({ error: 'muscleGroupId and date required' });
  }

  try {
    const group = await prisma.muscleGroup.findFirst({
      where: { id: muscleGroupId, userId },
    });
    if (!group) return res.status(403).json({ error: 'Forbidden' });

    const session = await prisma.session.create({
      data: { userId, muscleGroupId, date: new Date(date) },
    });

    for (const exercise of (exercises ?? [])) {
      const sessionExercise = await prisma.sessionExercise.create({
        data: { sessionId: session.id, exerciseDefinitionId: exercise.exerciseDefinitionId },
      });
      if (exercise.sets?.length) {
        await prisma.set.createMany({
          data: exercise.sets.map(s => ({
            sessionExerciseId: sessionExercise.id,
            setNumber: s.setNumber,
            weight: s.weight,
            reps: s.reps,
          })),
        });
      }
    }

    res.status(201).json({ id: session.id });
  } catch (err) {
    logger.error(`POST /api/sessions — ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Unhandled errors ──────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  logger.error(`Unhandled error — ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})