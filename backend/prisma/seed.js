import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: 'postgresql://health-tracker:secret@localhost:5432/health_db' })
const prisma = new PrismaClient({ adapter })

async function main() {

  const hashedPassword = await bcrypt.hash('password123', 10)
  const user = await prisma.user.create({
    data: { email: 'ishu@example.com', password: hashedPassword, name: 'Ishu' }
  })
  console.log('Created user:', user.email)

  const chest     = await prisma.muscleGroup.create({ data: { name: 'Chest',     userId: user.id } })
  const triceps   = await prisma.muscleGroup.create({ data: { name: 'Triceps',   userId: user.id } })
  const back      = await prisma.muscleGroup.create({ data: { name: 'Back',      userId: user.id } })
  const biceps    = await prisma.muscleGroup.create({ data: { name: 'Biceps',    userId: user.id } })
  const legs      = await prisma.muscleGroup.create({ data: { name: 'Legs',      userId: user.id } })
  const shoulders = await prisma.muscleGroup.create({ data: { name: 'Shoulders', userId: user.id } })
  console.log('Created muscle groups')

  const benchPress        = await prisma.exerciseDefinition.create({ data: { name: 'Bench press',        muscleGroupId: chest.id   } })
  const inclineDumbbell   = await prisma.exerciseDefinition.create({ data: { name: 'Incline dumbbell',   muscleGroupId: chest.id   } })
  const cableFly          = await prisma.exerciseDefinition.create({ data: { name: 'Cable fly',          muscleGroupId: chest.id   } })
  const tricepPushdown    = await prisma.exerciseDefinition.create({ data: { name: 'Tricep pushdown',    muscleGroupId: triceps.id } })
  const overheadExtension = await prisma.exerciseDefinition.create({ data: { name: 'Overhead extension', muscleGroupId: triceps.id } })
  const skullCrushers     = await prisma.exerciseDefinition.create({ data: { name: 'Skull crushers',     muscleGroupId: triceps.id } })
  console.log('Created exercise definitions')

  // Chest session 1 — May 19
  const chestSession1 = await prisma.session.create({
    data: { date: new Date('2026-05-19'), userId: user.id, muscleGroupId: chest.id }
  })
  const benchS1 = await prisma.sessionExercise.create({
    data: { sessionId: chestSession1.id, exerciseDefinitionId: benchPress.id }
  })
  await prisma.set.createMany({ data: [
    { sessionExerciseId: benchS1.id, setNumber: 1, weight: 10, reps: 8 },
    { sessionExerciseId: benchS1.id, setNumber: 2, weight: 10, reps: 7 },
    { sessionExerciseId: benchS1.id, setNumber: 3, weight: 12, reps: 6 },
  ]})
  const inclineS1 = await prisma.sessionExercise.create({
    data: { sessionId: chestSession1.id, exerciseDefinitionId: inclineDumbbell.id }
  })
  await prisma.set.createMany({ data: [
    { sessionExerciseId: inclineS1.id, setNumber: 1, weight: 8, reps: 10 },
    { sessionExerciseId: inclineS1.id, setNumber: 2, weight: 8, reps: 9  },
    { sessionExerciseId: inclineS1.id, setNumber: 3, weight: 8, reps: 8  },
  ]})
  const cableS1 = await prisma.sessionExercise.create({
    data: { sessionId: chestSession1.id, exerciseDefinitionId: cableFly.id }
  })
  await prisma.set.createMany({ data: [
    { sessionExerciseId: cableS1.id, setNumber: 1, weight: 6, reps: 12 },
    { sessionExerciseId: cableS1.id, setNumber: 2, weight: 6, reps: 12 },
    { sessionExerciseId: cableS1.id, setNumber: 3, weight: 6, reps: 10 },
  ]})
  console.log('Created chest session 1')

  // Chest session 2 — June 05
  const chestSession2 = await prisma.session.create({
    data: { date: new Date('2026-06-05'), userId: user.id, muscleGroupId: chest.id }
  })
  const benchS2 = await prisma.sessionExercise.create({
    data: { sessionId: chestSession2.id, exerciseDefinitionId: benchPress.id }
  })
  await prisma.set.createMany({ data: [
    { sessionExerciseId: benchS2.id, setNumber: 1, weight: 10, reps: 10 },
    { sessionExerciseId: benchS2.id, setNumber: 2, weight: 12, reps: 8  },
    { sessionExerciseId: benchS2.id, setNumber: 3, weight: 12, reps: 7  },
  ]})
  const inclineS2 = await prisma.sessionExercise.create({
    data: { sessionId: chestSession2.id, exerciseDefinitionId: inclineDumbbell.id }
  })
  await prisma.set.createMany({ data: [
    { sessionExerciseId: inclineS2.id, setNumber: 1, weight: 8,  reps: 10 },
    { sessionExerciseId: inclineS2.id, setNumber: 2, weight: 8,  reps: 9  },
    { sessionExerciseId: inclineS2.id, setNumber: 3, weight: 10, reps: 8  },
  ]})
  console.log('Created chest session 2')

  // Triceps session — June 05
  const tricepsSession1 = await prisma.session.create({
    data: { date: new Date('2026-06-05'), userId: user.id, muscleGroupId: triceps.id }
  })
  const pushdownS1 = await prisma.sessionExercise.create({
    data: { sessionId: tricepsSession1.id, exerciseDefinitionId: tricepPushdown.id }
  })
  await prisma.set.createMany({ data: [
    { sessionExerciseId: pushdownS1.id, setNumber: 1, weight: 15, reps: 12 },
    { sessionExerciseId: pushdownS1.id, setNumber: 2, weight: 15, reps: 10 },
    { sessionExerciseId: pushdownS1.id, setNumber: 3, weight: 15, reps: 9  },
  ]})
  const overheadS1 = await prisma.sessionExercise.create({
    data: { sessionId: tricepsSession1.id, exerciseDefinitionId: overheadExtension.id }
  })
  await prisma.set.createMany({ data: [
    { sessionExerciseId: overheadS1.id, setNumber: 1, weight: 10, reps: 10 },
    { sessionExerciseId: overheadS1.id, setNumber: 2, weight: 10, reps: 9  },
    { sessionExerciseId: overheadS1.id, setNumber: 3, weight: 10, reps: 8  },
  ]})
  console.log('Created triceps session')
  console.log('Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })