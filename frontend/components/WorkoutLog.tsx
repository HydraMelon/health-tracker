'use client'

import { useState } from 'react'
import { MuscleGroup } from '@/types/workout'
import SessionView from './SessionView'

type Props = {
  muscleGroups:   MuscleGroup[]
  onLogSession?:  (muscleGroupId: number) => void
}

export default function WorkoutLog({ muscleGroups, onLogSession }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selected = muscleGroups[selectedIndex]

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-medium text-gray-900">Workout log</h2>
          <p className="text-xs text-gray-400 mt-0.5">Set by set, session by session</p>
        </div>
        <button
          onClick={() => onLogSession?.(muscleGroups[selectedIndex].id)}
          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-teal-50 text-xs font-medium px-3 py-2 rounded-lg"
        >
          <i className="ti ti-plus" aria-hidden="true" />
          Log session
        </button>
      </div>

      {/* Muscle group selector */}
      <div className="flex gap-2 flex-wrap mb-5">
        {muscleGroups.map((group, index) => (
          <button
            key={group.name}
            onClick={() => setSelectedIndex(index)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              index === selectedIndex
                ? 'bg-teal-700 text-teal-50 border-teal-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* Session view */}
      {selected.sessions.length > 0 ? (
        <SessionView muscleGroup={selected} />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">No sessions logged yet</p>
          <p className="text-xs text-gray-300 mt-1">Tap "Log session" to add your first</p>
        </div>
      )}

    </div>
  )
}