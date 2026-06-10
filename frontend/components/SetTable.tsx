import { Exercise } from '@/types/workout'

type Props = {
  exercise: Exercise
}

export default function SetTable({ exercise }: Props) {
  return (
    <div className="px-4 py-3.5 border-b border-gray-100 last:border-b-0">

      {/* Exercise name + set count */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-900">
          {exercise.name}
        </span>
        <span className="text-xs text-gray-400">
          {exercise.sets.length} sets
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 mb-1">
        <span className="text-xs text-gray-400 font-medium">Set</span>
        <span className="text-xs text-gray-400 font-medium">Weight</span>
        <span className="text-xs text-gray-400 font-medium">Reps</span>
      </div>

      {/* Set rows */}
      {exercise.sets.map((set, index) => (
        <div
          key={index}
          className="grid grid-cols-3 py-2 border-t border-gray-50"
        >
          <span className="text-xs text-gray-400">
            Set {index + 1}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {set.weight > 0 ? (
              <>
                {set.weight}
                <span className="text-xs font-normal text-gray-400 ml-0.5">kg</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">bodyweight</span>
            )}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {set.reps}
            <span className="text-xs font-normal text-gray-400 ml-0.5">reps</span>
          </span>
        </div>
      ))}

    </div>
  )
}
