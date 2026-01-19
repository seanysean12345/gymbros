import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, TrendingUp, Award, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatWeight } from '@/lib/utils'

// Types for Supabase query results
type ExerciseData = { id: string; name: string; category: string }
type SetData = { weight: number | null; reps: number | null }
type WorkoutExerciseData = {
  id: string
  exercise: ExerciseData | null
  exercise_sets: SetData[]
}
type WorkoutData = {
  id: string
  name: string | null
  started_at: string
  workout_exercises: WorkoutExerciseData[]
}
type PRData = {
  id: string
  value: number
  achieved_at: string
  exercise: { name: string } | null
}

export default async function ProgressPage() {
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

  // Fetch recent workouts
  const { data: recentWorkoutsRaw } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        id,
        exercise:exercises (id, name, category),
        exercise_sets (*)
      )
    `)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  const recentWorkouts = recentWorkoutsRaw as unknown as WorkoutData[] | null

  // Fetch personal records
  const { data: personalRecordsRaw } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercises (name)
    `)
    .eq('user_id', user.id)
    .eq('record_type', 'max_weight')
    .order('achieved_at', { ascending: false })
    .limit(5)

  const personalRecords = personalRecordsRaw as unknown as PRData[] | null

  // Calculate total volume this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  const { data: weekWorkoutsRaw } = await supabase
    .from('workouts')
    .select(`
      workout_exercises (
        exercise_sets (weight, reps)
      )
    `)
    .eq('user_id', user.id)
    .gte('started_at', weekStart.toISOString())

  type WeekWorkout = { workout_exercises: { exercise_sets: SetData[] }[] }
  const weekWorkouts = weekWorkoutsRaw as unknown as WeekWorkout[] | null

  let weeklyVolume = 0
  weekWorkouts?.forEach((workout) => {
    workout.workout_exercises?.forEach((exercise) => {
      exercise.exercise_sets?.forEach((set) => {
        if (set.weight && set.reps) {
          weeklyVolume += set.weight * set.reps
        }
      })
    })
  })

  // Get unique exercises from recent workouts for quick access
  const exerciseMap = new Map<string, ExerciseData>()
  recentWorkouts?.forEach((workout) => {
    workout.workout_exercises?.forEach((we) => {
      if (we.exercise && !exerciseMap.has(we.exercise.id)) {
        exerciseMap.set(we.exercise.id, we.exercise)
      }
    })
  })
  const frequentExercises = Array.from(exerciseMap.values()).slice(0, 6)

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Progress
      </h1>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">
            {weekWorkouts?.length || 0}
          </div>
          <div className="text-xs text-gray-500">Workouts This Week</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">
            {weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}k` : weeklyVolume}
          </div>
          <div className="text-xs text-gray-500">{unit} This Week</div>
        </Card>
      </div>

      {/* Personal Records */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            Recent PRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalRecords && personalRecords.length > 0 ? (
            <div className="space-y-3">
              {personalRecords.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pr.exercise?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(pr.achieved_at)}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-brand-600">
                    {formatWeight(pr.value, unit)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No PRs recorded yet. Start lifting to set some records!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Exercise Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Track Exercise Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {frequentExercises.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {frequentExercises.map((exercise) => (
                <Link
                  key={exercise.id}
                  href={`/progress/exercise/${exercise.id}`}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {exercise.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{exercise.category}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Log workouts to track exercise progress
            </p>
          )}
        </CardContent>
      </Card>

      {/* Workout History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            Workout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentWorkouts && recentWorkouts.length > 0 ? (
            <div className="space-y-2">
              {recentWorkouts.map((workout) => {
                // Calculate workout volume
                let volume = 0
                workout.workout_exercises?.forEach((we: WorkoutExerciseData) => {
                  we.exercise_sets?.forEach((set: SetData) => {
                    if (set.weight && set.reps) {
                      volume += set.weight * set.reps
                    }
                  })
                })

                return (
                  <Link
                    key={workout.id}
                    href={`/log/${workout.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {workout.name || 'Workout'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(workout.started_at)} • {workout.workout_exercises?.length || 0} exercises
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {volume > 1000 ? `${(volume / 1000).toFixed(1)}k` : volume} {unit}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No workouts yet. Start your fitness journey!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
