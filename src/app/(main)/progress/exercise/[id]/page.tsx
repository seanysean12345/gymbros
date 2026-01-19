'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, TrendingUp, Trophy, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatWeight, getCategoryColor } from '@/lib/utils'

type ExerciseData = {
  id: string
  name: string
  category: string
  equipment: string | null
  muscle_groups: string[]
}

type SetData = {
  weight: number | null
  reps: number | null
  created_at: string
}

type WorkoutExerciseData = {
  id: string
  workout: {
    id: string
    started_at: string
    name: string | null
  } | null
  exercise_sets: SetData[]
}

type PRData = {
  id: string
  record_type: string
  value: number
  achieved_at: string
}

export default function ExerciseProgressPage() {
  const params = useParams()
  const exerciseId = params.id as string
  const supabase = createClient()

  const [exercise, setExercise] = useState<ExerciseData | null>(null)
  const [history, setHistory] = useState<WorkoutExerciseData[]>([])
  const [prs, setPRs] = useState<PRData[]>([])
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's unit preference
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_unit')
        .eq('id', user.id)
        .single()

      if (profile?.preferred_unit) {
        setUnit(profile.preferred_unit as 'lbs' | 'kg')
      }

      // Fetch exercise details
      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single()

      if (exerciseData) {
        setExercise(exerciseData as ExerciseData)
      }

      // Fetch workout history for this exercise
      const { data: historyData } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          workout:workouts!inner (id, started_at, name, user_id),
          exercise_sets (weight, reps, created_at)
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (historyData) {
        setHistory(historyData as unknown as WorkoutExerciseData[])
      }

      // Fetch PRs for this exercise
      const { data: prData } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .order('achieved_at', { ascending: false })

      if (prData) {
        setPRs(prData as PRData[])
      }

      setLoading(false)
    }

    loadData()
  }, [exerciseId, supabase])

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="px-4 py-6">
        <p className="text-gray-500">Exercise not found</p>
      </div>
    )
  }

  // Calculate stats
  let maxWeight = 0
  let maxReps = 0
  let totalVolume = 0
  let totalSets = 0

  history.forEach((we) => {
    we.exercise_sets?.forEach((set) => {
      if (set.weight && set.weight > maxWeight) maxWeight = set.weight
      if (set.reps && set.reps > maxReps) maxReps = set.reps
      if (set.weight && set.reps) {
        totalVolume += set.weight * set.reps
        totalSets++
      }
    })
  })

  // Get progression data (best set per workout)
  const progressionData = history
    .filter((we) => we.workout)
    .map((we) => {
      let bestWeight = 0
      we.exercise_sets?.forEach((set) => {
        if (set.weight && set.weight > bestWeight) bestWeight = set.weight
      })
      return {
        date: we.workout!.started_at,
        weight: bestWeight,
      }
    })
    .reverse()

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
            {exercise.name}
          </h1>
          <p className="text-sm text-gray-500 capitalize">
            {exercise.category} {exercise.equipment && `• ${exercise.equipment}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">
            {maxWeight > 0 ? formatWeight(maxWeight, unit) : '-'}
          </div>
          <div className="text-xs text-gray-500">Max Weight</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">
            {maxReps > 0 ? maxReps : '-'}
          </div>
          <div className="text-xs text-gray-500">Max Reps</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">
            {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
          </div>
          <div className="text-xs text-gray-500">Total Volume ({unit})</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">
            {totalSets}
          </div>
          <div className="text-xs text-gray-500">Total Sets</div>
        </Card>
      </div>

      {/* Personal Records */}
      {prs.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prs.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {pr.record_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(pr.achieved_at)}</p>
                  </div>
                  <div className="text-lg font-bold text-yellow-600">
                    {pr.record_type === 'max_weight' ? formatWeight(pr.value, unit) : pr.value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progression Chart (simple text-based for now) */}
      {progressionData.length > 1 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Weight Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progressionData.slice(-10).map((data, index) => {
                const maxInData = Math.max(...progressionData.map(d => d.weight))
                const percentage = maxInData > 0 ? (data.weight / maxInData) * 100 : 0
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-16 text-right">
                      {formatWeight(data.weight, unit)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            Recent History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 10).map((we) => {
                if (!we.workout) return null

                const sets = we.exercise_sets || []
                const setsSummary = sets
                  .map((s) => `${s.weight || 0}×${s.reps || 0}`)
                  .join(', ')

                return (
                  <Link
                    key={we.id}
                    href={`/log/${we.workout.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {we.workout.name || 'Workout'}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDate(we.workout.started_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {sets.length} sets: {setsSummary}
                    </p>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No history yet for this exercise
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
