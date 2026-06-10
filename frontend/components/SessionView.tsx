'use client'

import { useState } from 'react'
import { MuscleGroup } from '@/types/workout'
import SetTable from './SetTable';

type Props = {
  muscleGroup: MuscleGroup
}

export default function SessionView({ muscleGroup }: Props) {
  const { sessions } = muscleGroup

  const [currentIndex, setCurrentIndex] = useState(sessions.length - 1)

  // Clamp so a stale index from a previous muscle group never goes out of bounds
  const safeIndex  = Math.min(currentIndex, sessions.length - 1)
  const session    = sessions[safeIndex]
  const isFirst    = safeIndex === 0
  const isLast     = safeIndex === sessions.length - 1
  const totalCount = sessions.length

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

      {/* Navigation header — 44px buttons, date truncates instead of overflowing */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">

        <button
          onClick={() => setCurrentIndex(safeIndex - 1)}
          disabled={isFirst}
          aria-label="Previous session"
          className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
        </button>

        <div className="text-center min-w-0 px-2">
          <p className="text-sm font-medium text-gray-900 truncate">{session.date}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Session {safeIndex + 1} of {totalCount}
          </p>
        </div>

        <button
          onClick={() => setCurrentIndex(safeIndex + 1)}
          disabled={isLast}
          aria-label="Next session"
          className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
        </button>

      </div>

      {/* Exercises */}
      {session.exercises.map((exercise, index) => (
        <SetTable key={index} exercise={exercise} />
      ))}

      {/* Dot navigation */}
      <div className="flex items-center justify-center gap-1.5 py-3 border-t border-gray-100">
        {sessions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to session ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === safeIndex
                ? 'w-4 bg-teal-700'
                : 'w-1.5 bg-gray-200 hover:bg-gray-300'
            }`}
          />
        ))}
      </div>

    </div>
  )
}
