'use client'

import { useState } from 'react'

type CalendarProps = {
  exercisedDates: string[]   // ISO date strings e.g. "2026-05-19"
}

const MONTH_NAMES = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December'
]

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function ExerciseCalendar({ exercisedDates }: CalendarProps) {
  const dates = Array.isArray(exercisedDates) ? exercisedDates : []
  const today = new Date()

  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear]   = useState(today.getFullYear())

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  function getStartOffset(): number {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }

  function getDaysInMonth(): number {
    return new Date(currentYear, currentMonth + 1, 0).getDate()
  }

  function isExercised(day: number): boolean {
    const mm = String(currentMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return dates.includes(`${currentYear}-${mm}-${dd}`)
  }

  function isPast(day: number): boolean {
    const date = new Date(currentYear, currentMonth, day)
    return date <= today
  }

  function isToday(day: number): boolean {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  const daysInMonth   = getDaysInMonth()
  const startOffset   = getStartOffset()

  const allDays       = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const pastDays      = allDays.filter(d => isPast(d))
  const exerciseCount = pastDays.filter(d => isExercised(d)).length
  const restCount     = pastDays.length - exerciseCount
  const consistency   = pastDays.length > 0
    ? Math.round((exerciseCount / pastDays.length) * 100)
    : 0

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
          >
            <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
          </button>

          <span className="text-sm font-medium text-gray-900 w-28 text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>

          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
          >
            <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
          </button>
        </div>

        {/* Month summary button — text hidden on mobile to prevent overlap */}
        <button className="flex items-center gap-1.5 text-xs font-medium bg-teal-50 text-teal-800 px-3 min-h-[44px] rounded-lg hover:bg-teal-100">
          <i className="ti ti-chart-bar text-sm" aria-hidden="true" />
          <span className="hidden sm:inline">Month summary</span>
        </button>

      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(day => (
          <div key={day} className="text-center text-xs text-gray-300 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid — aspect-square cells are naturally ~44px on 375px screens */}
      <div className="grid grid-cols-7 gap-1">

        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {allDays.map(day => {
          const exercised = isExercised(day) && isPast(day)
          const past      = isPast(day) && !exercised
          const future    = !isPast(day)
          const today_    = isToday(day)

          return (
            <div
              key={day}
              className={`
                aspect-square flex items-center justify-center
                rounded-lg text-xs font-medium
                ${exercised ? 'bg-teal-50 text-teal-800'  : ''}
                ${past      ? 'text-gray-400'              : ''}
                ${future    ? 'text-gray-200'              : ''}
                ${today_    ? 'ring-1 ring-teal-500'       : ''}
              `}
            >
              {day}
            </div>
          )
        })}

      </div>

      {/* Summary bar */}
      <div className="flex gap-2 items-center flex-wrap mt-4 pt-4 border-t border-gray-100">
        <span className="text-xs bg-teal-50 text-teal-800 font-medium px-3 py-1.5 rounded-full">
          {exerciseCount} exercise days
        </span>
        <span className="text-xs bg-gray-50 text-gray-400 px-3 py-1.5 rounded-full">
          {restCount} rest days
        </span>
        <span className="text-xs text-gray-300">
          {consistency}% consistency
        </span>
      </div>

    </div>
  )
}
