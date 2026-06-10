'use client'

import { useState, useEffect, useCallback } from 'react'
import StatCard from '@/components/StatCard'
import ExerciseCalendar from '@/components/ExerciseCalendar'
import WorkoutLog from '@/components/WorkoutLog'
import LogSessionModal from '@/components/LogSessionModal'
import { MuscleGroup } from '@/types/workout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

type Stats = {
  gymSessions:  number
  exerciseDays: number
  dayStreak:    number
}

const TABS = ['Overview', 'Workout log']

export default function DashboardPage() {
  const [activeTab,       setActiveTab]       = useState(0)
  const [muscleGroups,    setMuscleGroups]    = useState<MuscleGroup[]>([])
  const [exercisedDates,  setExercisedDates]  = useState<string[]>([])
  const [stats,           setStats]           = useState<Stats | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState<string | null>(null)
  const [modalOpen,       setModalOpen]       = useState(false)
  const [modalGroupId,    setModalGroupId]    = useState<number | undefined>()

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [groups, dates, statsData] = await Promise.all([
        fetch(`${API_BASE}/api/muscle-groups`).then(r => r.json()),
        fetch(`${API_BASE}/api/sessions`).then(r => r.json()),
        fetch(`${API_BASE}/api/stats`).then(r => r.json()),
      ])
      setMuscleGroups(groups)
      setExercisedDates(dates)
      setStats(statsData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function openModal(muscleGroupId?: number) {
    setModalGroupId(muscleGroupId)
    setModalOpen(true)
  }

  const statCards = stats
    ? [
        { label: 'Exercise days', value: stats.exerciseDays, sub: '↑ this year', icon: 'ti-calendar-check' },
        { label: 'Running days',  value: 0,                  sub: '↑ this year', icon: 'ti-run'            },
        { label: 'Gym sessions',  value: stats.gymSessions,  sub: '↑ this year', icon: 'ti-barbell'        },
        { label: 'Day streak',    value: stats.dayStreak,    sub: 'keep going!',  icon: 'ti-flame'          },
      ]
    : []

  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8">

      {/* Top bar — stacks vertically on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Health tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your wellness at a glance</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-teal-50 text-sm font-medium px-4 min-h-[44px] rounded-lg sm:w-auto w-full"
        >
          <i className="ti ti-plus" aria-hidden="true" />
          Log workout
        </button>
      </div>

      {/* Tabs — 44px touch targets */}
      <div className="flex gap-0 border-b border-gray-100 mb-7">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 pb-2.5 min-h-[44px] inline-flex items-end text-sm font-medium border-b-2 transition-colors ${
              i === activeTab
                ? 'border-teal-700 text-teal-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center py-8">Failed to load: {error}</p>
      )}

      {!loading && !error && (
        <>
          {activeTab === 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
                {statCards.map(s => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
              <ExerciseCalendar exercisedDates={exercisedDates} />
            </>
          )}

          {activeTab === 1 && (
            <WorkoutLog muscleGroups={muscleGroups} onLogSession={openModal} />
          )}
        </>
      )}

      <LogSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        muscleGroups={muscleGroups}
        defaultMuscleGroupId={modalGroupId}
        onSaved={() => loadData(true)}
      />

    </main>
  )
}
