const express = require('express');
const cors = require('cors');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/muscle-groups', async (req, res) => {
  try {
    const groups = await prisma.muscleGroup.findMany({
      where: { userId: 1 },
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: 1 },
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: 1 },
      select: { date: true },
    });

    const uniqueDates = [...new Set(sessions.map(s => s.date.toISOString().split('T')[0]))];
    res.json(uniqueDates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/exercise-definitions', async (req, res) => {
  try {
    const muscleGroups = await prisma.muscleGroup.findMany({
      where: { userId: 1 },
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/exercises', async (req, res) => {
  const muscleGroupId = parseInt(req.query.muscleGroupId);
  if (!muscleGroupId) return res.status(400).json({ error: 'muscleGroupId required' });

  try {
    const exercises = await prisma.exerciseDefinition.findMany({
      where: { muscleGroupId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(exercises);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/exercise-definitions', async (req, res) => {
  const { name, muscleGroupId } = req.body;
  if (!name || !muscleGroupId) return res.status(400).json({ error: 'name and muscleGroupId required' });

  try {
    const exercise = await prisma.exerciseDefinition.create({
      data: { name: name.trim(), muscleGroupId },
    });
    res.status(201).json(exercise);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sessions', async (req, res) => {
  const { userId, muscleGroupId, date, exercises } = req.body;
  if (!userId || !muscleGroupId || !date || !exercises?.length) {
    return res.status(400).json({ error: 'userId, muscleGroupId, date, exercises required' });
  }

  try {
    const session = await prisma.session.create({
      data: { userId, muscleGroupId, date: new Date(date) },
    });

    for (const exercise of exercises) {
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(5000, '0.0.0.0', () => console.log('Server running on port 5000'));
