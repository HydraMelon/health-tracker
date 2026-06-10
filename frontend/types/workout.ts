export type Set = {
  weight: number    // 0 for bodyweight exercises
  reps: number
}

export type Exercise = {
  name: string
  sets: Set[]
}

export type Session = {
  date: string        // e.g. "Thursday, June 05 2026"
  exercises: Exercise[]
}

export type MuscleGroup = {
  id: number
  name: string
  sessions: Session[]
}