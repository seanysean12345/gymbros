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
      <h1 className="text-3xl text-white mb-6">
        Progress
      </h1>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center py-5">
          <div
            className="text-3xl font-wwe"
            style={{ color: '#CC0000', textShadow: '0 0 10px rgba(204,0,0,0.5)' }}
          >
            {weekWorkouts?.length || 0}
          </div>
          <div className="text-base text-gray-400 mt-1">Workouts This Week</div>
        </Card>
        <Card className="text-center py-5">
          <div
            className="text-3xl font-wwe"
            style={{ color: '#CC0000', textShadow: '0 0 10px rgba(204,0,0,0.5)' }}
          >
            {weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}k` : weeklyVolume}
          </div>
          <div className="text-base text-gray-400 mt-1">{unit} This Week</div>
        </Card>
      </div>

      {/* Personal Records */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Recent PRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalRecords && personalRecords.length > 0 ? (
            <div className="space-y-4">
              {personalRecords.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-lg text-white">
                      {pr.exercise?.name}
                    </p>
                    <p className="text-base text-gray-500">
                      {formatDate(pr.achieved_at)}
                    </p>
                  </div>
                  <div
                    className="text-2xl font-wwe"
                    style={{ color: '#CC0000' }}
                  >
                    {formatWeight(pr.value, unit)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6 text-lg">
              No PRs recorded yet. Start lifting to set some records!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Exercise Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Track Exercise Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {frequentExercises.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {frequentExercises.map((exercise) => (
                <Link
                  key={exercise.id}
                  href={`/progress/exercise/${exercise.id}`}
                  className="relative transform -skew-x-3 transition-all hover:scale-[1.02] active:scale-95 min-h-[60px]"
                  style={{
                    background: 'linear-gradient(180deg, #D0D0D0 0%, #E0E0E0 20%, #C0C0C0 50%, #B0B0B0 80%, #909090 100%)',
                    border: '2px solid',
                    borderColor: '#F0F0F0 #606060 #505050 #E0E0E0',
                    padding: '14px 12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                  }}
                >
                  <div className="transform skew-x-3">
                    <p className="text-gray-900 font-wwe text-base truncate">
                      {exercise.name}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">{exercise.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6 text-lg">
              Log workouts to track exercise progress
            </p>
          )}
        </CardContent>
      </Card>

      {/* Workout History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
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
                    className="flex items-center justify-between p-4 transition-all hover:bg-white/5 active:bg-white/10 min-h-[64px]"
                    style={{
                      borderBottom: '1px solid #2A2A2A',
                    }}
                  >
                    <div>
                      <p className="text-lg text-white">
                        {workout.name || 'Workout'}
                      </p>
                      <p className="text-base text-gray-500">
                        {formatDate(workout.started_at)} • {workout.workout_exercises?.length || 0} exercises
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base text-gray-400">
                        {volume > 1000 ? `${(volume / 1000).toFixed(1)}k` : volume} {unit}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6 text-lg">
              No workouts yet. Start your fitness journey!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
