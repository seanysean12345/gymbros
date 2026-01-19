import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Dumbbell, Clock, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatWeight, formatDuration, getCategoryColor } from '@/lib/utils'

type SetData = {
  id: string
  set_number: number
  weight: number | null
  reps: number | null
  is_warmup: boolean
  is_pr: boolean
}

type ExerciseData = {
  id: string
  name: string
  category: string
  equipment: string | null
}

type WorkoutExerciseData = {
  id: string
  order_index: number
  exercise: ExerciseData | null
  exercise_sets: SetData[]
}

type WorkoutData = {
  id: string
  name: string | null
  started_at: string
  ended_at: string | null
  notes: string | null
  user_id: string
  workout_exercises: WorkoutExerciseData[]
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile for unit preference
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_unit')
    .eq('id', user.id)
    .single()

  const unit = (profile?.preferred_unit as 'lbs' | 'kg') || 'lbs'

  // Fetch workout with exercises and sets
  const { data: workoutRaw, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        id,
        order_index,
        exercise:exercises (id, name, category, equipment),
        exercise_sets (*)
      )
    `)
    .eq('id', workoutId)
    .single()

  if (error || !workoutRaw) {
    notFound()
  }

  const workout = workoutRaw as unknown as WorkoutData

  // Check if user owns this workout or is in same group
  if (workout.user_id !== user.id) {
    // Check group membership
    const { data: sharedGroup } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .in('group_id',
        await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', workout.user_id)
          .then(res => res.data?.map(g => g.group_id) || [])
      )
      .limit(1)

    if (!sharedGroup || sharedGroup.length === 0) {
      notFound()
    }
  }

  // Sort exercises by order_index
  const sortedExercises = [...(workout.workout_exercises || [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  // Calculate total volume
  let totalVolume = 0
  let totalSets = 0
  sortedExercises.forEach((we) => {
    we.exercise_sets?.forEach((set) => {
      if (set.weight && set.reps) {
        totalVolume += set.weight * set.reps
        totalSets++
      }
    })
  })

  // Calculate duration
  let durationSeconds = 0
  if (workout.started_at && workout.ended_at) {
    const start = new Date(workout.started_at)
    const end = new Date(workout.ended_at)
    durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/progress"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {workout.name || 'Workout'}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(workout.started_at)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center py-3">
          <div className="text-xl font-bold text-brand-600">
            {sortedExercises.length}
          </div>
          <div className="text-xs text-gray-500">Exercises</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-xl font-bold text-brand-600">
            {totalSets}
          </div>
          <div className="text-xs text-gray-500">Sets</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-xl font-bold text-brand-600">
            {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
          </div>
          <div className="text-xs text-gray-500">{unit}</div>
        </Card>
      </div>

      {/* Duration */}
      {durationSeconds > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Clock className="h-4 w-4" />
          <span>Duration: {formatDuration(durationSeconds)}</span>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {sortedExercises.map((workoutExercise) => {
          const exercise = workoutExercise.exercise
          if (!exercise) return null

          const sets = workoutExercise.exercise_sets || []
          const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number)

          // Calculate exercise volume
          let exerciseVolume = 0
          sortedSets.forEach((set) => {
            if (set.weight && set.reps) {
              exerciseVolume += set.weight * set.reps
            }
          })

          return (
            <Card key={workoutExercise.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(exercise.category)}`}>
                    <Dumbbell className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{exercise.name}</CardTitle>
                    <p className="text-xs text-gray-500 capitalize">
                      {exercise.category} {exercise.equipment && `• ${exercise.equipment}`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Sets Header */}
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 mb-2 px-1">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-4">Weight</div>
                  <div className="col-span-4">Reps</div>
                  <div className="col-span-2"></div>
                </div>

                {/* Sets */}
                <div className="space-y-1">
                  {sortedSets.map((set) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="col-span-2 text-center font-medium text-sm">
                        {set.set_number}
                      </div>
                      <div className="col-span-4 text-sm">
                        {set.weight ? formatWeight(set.weight, unit) : '-'}
                      </div>
                      <div className="col-span-4 text-sm">
                        {set.reps || '-'}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {set.is_pr && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Exercise Volume */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 text-right">
                  Volume: {exerciseVolume > 1000 ? `${(exerciseVolume / 1000).toFixed(1)}k` : exerciseVolume} {unit}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Notes */}
      {workout.notes && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{workout.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
