'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

type MuscleGroupOption = { id: number; name: string }
type ExerciseOption    = { id: number; name: string }
type SetEntry          = { setNumber: number; weight: string; reps: string }
type ExerciseEntry     = ExerciseOption & { selected: boolean; sets: SetEntry[] }

type Props = {
  open:                  boolean
  onClose:               () => void
  muscleGroups:          MuscleGroupOption[]
  defaultMuscleGroupId?: number
  defaultDate?:          string
  onSaved:               () => void
}

export default function LogSessionModal({
  open, onClose, muscleGroups, defaultMuscleGroupId, defaultDate, onSaved,
}: Props) {
  const [step,            setStep]            = useState<1 | 2>(1)
  const [groups,          setGroups]          = useState<MuscleGroupOption[]>([])
  const [muscleGroupId,   setMuscleGroupId]   = useState<number | null>(null)
  const [date,            setDate]            = useState('')
  const [exercises,       setExercises]       = useState<ExerciseEntry[]>([])
  const [newGroupName,    setNewGroupName]    = useState('')
  const [addingGroup,     setAddingGroup]     = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep(1)
      setGroups(muscleGroups)
      setMuscleGroupId(defaultMuscleGroupId ?? null)
      setDate(defaultDate ?? new Date().toISOString().split('T')[0])
      setExercises([])
      setNewGroupName('')
      setAddingGroup(false)
      setNewExerciseName('')
      setSaving(false)
      setError(null)
    }
  }, [open, muscleGroups, defaultMuscleGroupId, defaultDate])

  async function addMuscleGroup() {
    const name = newGroupName.trim()
    if (!name) return
    setAddingGroup(true)
    setError(null)
    try {
      const res  = await apiFetch('/api/muscle-groups', {
        method: 'POST',
        body:   JSON.stringify({ name }),
      })
      const group: MuscleGroupOption = await res.json()
      setGroups(prev => [...prev, group])
      setMuscleGroupId(group.id)
      setNewGroupName('')
    } catch {
      setError('Could not add muscle group')
    } finally {
      setAddingGroup(false)
    }
  }

  async function goToStep2() {
    if (!muscleGroupId) return
    try {
      const res  = await apiFetch(`/api/exercises?muscleGroupId=${muscleGroupId}`)
      const data: ExerciseOption[] = await res.json()
      setExercises(data.map(e => ({ ...e, selected: false, sets: [] })))
      setStep(2)
    } catch {
      setError('Could not load exercises')
    }
  }

  function toggleExercise(id: number) {
    setExercises(prev => prev.map(e => {
      if (e.id !== id) return e
      return e.selected
        ? { ...e, selected: false, sets: [] }
        : { ...e, selected: true, sets: [{ setNumber: 1, weight: '', reps: '' }] }
    }))
  }

  function addSet(exerciseId: number) {
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e
      return { ...e, sets: [...e.sets, { setNumber: e.sets.length + 1, weight: '', reps: '' }] }
    }))
  }

  function removeSet(exerciseId: number, index: number) {
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e
      const sets = e.sets.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNumber: i + 1 }))
      return { ...e, sets }
    }))
  }

  function updateSet(exerciseId: number, index: number, field: 'weight' | 'reps', value: string) {
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e
      const sets = e.sets.map((s, i) => i === index ? { ...s, [field]: value } : s)
      return { ...e, sets }
    }))
  }

  async function addNewExercise() {
    const name = newExerciseName.trim()
    if (!name || !muscleGroupId) return
    try {
      const res = await apiFetch('/api/exercise-definitions', {
        method: 'POST',
        body:   JSON.stringify({ name, muscleGroupId }),
      })
      const newEx: ExerciseOption = await res.json()
      setExercises(prev => [...prev, { ...newEx, selected: true, sets: [{ setNumber: 1, weight: '', reps: '' }] }])
      setNewExerciseName('')
    } catch {
      setError('Could not add exercise')
    }
  }

  async function saveSession() {
    if (!muscleGroupId) return
    const selected = exercises.filter(e => e.selected && e.sets.length > 0)

    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          muscleGroupId,
          date,
          exercises: selected.map(e => ({
            exerciseDefinitionId: e.id,
            sets: e.sets.map(s => ({
              setNumber: s.setNumber,
              weight:    parseFloat(s.weight) || 0,
              reps:      parseInt(s.reps, 10) || 0,
            })),
          })),
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      onSaved()
      onClose()
    } catch {
      setError('Could not save session')
      setSaving(false)
    }
  }

  const hasExercises = exercises.some(e => e.selected && e.sets.length > 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-medium text-gray-900">Log session</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
          >
            <i className="ti ti-x text-sm" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {error && (
            <p className="text-sm text-red-500 mb-3">{error}</p>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <p className="text-xs font-medium text-gray-500 mb-2">Muscle group</p>

              {groups.length === 0 && (
                <p className="text-xs text-gray-300 mb-3">No muscle groups yet — add one below</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setMuscleGroupId(g.id)}
                    className={`px-4 min-h-[44px] rounded-full text-sm font-medium border transition-colors ${
                      muscleGroupId === g.id
                        ? 'bg-teal-700 text-teal-50 border-teal-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              {/* Add new muscle group */}
              <div className="flex gap-2 mb-5 pt-1 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="New muscle group…"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMuscleGroup()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-3 text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  onClick={addMuscleGroup}
                  disabled={!newGroupName.trim() || addingGroup}
                  className="px-4 min-h-[44px] bg-teal-50 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-100 disabled:opacity-40"
                >
                  Add
                </button>
              </div>

              <p className="text-xs font-medium text-gray-500 mb-2">Date</p>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-base text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <p className="text-xs text-gray-400 mb-4">
                Select exercises below, or skip straight to{' '}
                <span className="font-medium text-gray-500">"Mark as exercised"</span>{' '}
                to just log the day.
              </p>

              {exercises.map(exercise => (
                <div key={exercise.id} className="mb-3">
                  <button
                    onClick={() => toggleExercise(exercise.id)}
                    className={`w-full flex items-center justify-between px-4 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
                      exercise.selected
                        ? 'bg-teal-50 border-teal-200 text-teal-800'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{exercise.name}</span>
                    <i className={`ti ${exercise.selected ? 'ti-check' : 'ti-plus'} text-sm`} aria-hidden="true" />
                  </button>

                  {exercise.selected && (
                    <div className="mt-2 pl-2">
                      {exercise.sets.map((set, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-400 w-10 shrink-0">Set {set.setNumber}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="kg"
                            value={set.weight}
                            onChange={e => updateSet(exercise.id, i, 'weight', e.target.value)}
                            className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-base text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <span className="text-xs text-gray-300">×</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="reps"
                            value={set.reps}
                            onChange={e => updateSet(exercise.id, i, 'reps', e.target.value)}
                            className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-base text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          {exercise.sets.length > 1 && (
                            <button
                              onClick={() => removeSet(exercise.id, i)}
                              className="ml-auto w-8 h-8 flex items-center justify-center text-gray-300 hover:text-gray-500"
                            >
                              <i className="ti ti-x text-xs" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addSet(exercise.id)}
                        className="text-xs text-teal-700 font-medium hover:text-teal-800 mt-0.5 min-h-[44px] flex items-center"
                      >
                        + Add set
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="New exercise name…"
                  value={newExerciseName}
                  onChange={e => setNewExerciseName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNewExercise()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-3 text-base text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  onClick={addNewExercise}
                  disabled={!newExerciseName.trim()}
                  className="px-4 min-h-[44px] bg-teal-50 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-100 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          {step === 1 ? (
            <button
              onClick={goToStep2}
              disabled={!muscleGroupId}
              className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-teal-50 text-sm font-medium min-h-[44px] rounded-lg"
            >
              Next
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium min-h-[44px] rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={saveSession}
                disabled={saving}
                className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-teal-50 text-sm font-medium min-h-[44px] rounded-lg"
              >
                {saving ? 'Saving…' : hasExercises ? 'Save session' : 'Mark as exercised'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
