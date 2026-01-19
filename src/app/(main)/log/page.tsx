'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, getCategoryColor } from '@/lib/utils'
import {
  Dumbbell,
  Activity,
  Footprints,
  Target,
  Heart,
  User,
  Plus,
  ArrowLeft,
  Check,
  X,
  Timer,
} from 'lucide-react'
import type { Exercise, ExerciseCategory, WorkoutInProgress, ExerciseSetInProgress } from '@/types'

const categoryIcons: Record<ExerciseCategory, React.ElementType> = {
  chest: Dumbbell,
  back: Activity,
  legs: Footprints,
  shoulders: Target,
  arms: Dumbbell,
  core: Target,
  cardio: Heart,
  full_body: User,
  custom: Plus,
}

const categories: { id: ExerciseCategory; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'full_body', label: 'Full Body' },
]

type ViewState = 'category' | 'exercises' | 'workout'

export default function LogPage() {
  const router = useRouter()
  const supabase = createClient()

  const [view, setView] = useState<ViewState>('category')
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [workout, setWorkout] = useState<WorkoutInProgress | null>(null)
  const [workoutName, setWorkoutName] = useState('')
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restTimerEnabled, setRestTimerEnabled] = useState(true)
  const [restTimerSeconds, setRestTimerSeconds] = useState(90)
  const [saving, setSaving] = useState(false)

  // Load user preferences
  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('rest_timer_enabled, rest_timer_seconds')
          .eq('id', user.id)
          .single()

        if (profile) {
          setRestTimerEnabled(profile.rest_timer_enabled)
          setRestTimerSeconds(profile.rest_timer_seconds)
        }
      }
    }
    loadPreferences()
  }, [supabase])

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return

    const interval = setInterval(() => {
      setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null))
    }, 1000)

    return () => clearInterval(interval)
  }, [restTimer])

  // Fetch exercises when category is selected
  useEffect(() => {
    if (!selectedCategory) return

    async function fetchExercises() {
      setLoading(true)
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', selectedCategory)
        .eq('is_preset', true)
        .order('name')

      setExercises(data || [])
      setLoading(false)
    }

    fetchExercises()
  }, [selectedCategory, supabase])

  const startWorkout = () => {
    setWorkout({
      id: crypto.randomUUID(),
      name: workoutName || 'Workout',
      started_at: new Date(),
      exercises: [],
    })
    setView('workout')
  }

  const addExerciseToWorkout = (exercise: Exercise) => {
    if (!workout) return

    const newExercise = {
      id: crypto.randomUUID(),
      exercise,
      sets: [
        {
          id: crypto.randomUUID(),
          set_number: 1,
          weight: undefined,
          reps: undefined,
          is_warmup: false,
          completed: false,
        },
      ],
    }

    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise],
    })
    setView('workout')
    setSelectedCategory(null)
  }

  const addSet = (exerciseIndex: number) => {
    if (!workout) return

    const exercise = workout.exercises[exerciseIndex]
    const lastSet = exercise.sets[exercise.sets.length - 1]

    const newSet: ExerciseSetInProgress = {
      id: crypto.randomUUID(),
      set_number: exercise.sets.length + 1,
      weight: lastSet?.weight,
      reps: lastSet?.reps,
      is_warmup: false,
      completed: false,
    }

    const updatedExercises = [...workout.exercises]
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    }

    setWorkout({ ...workout, exercises: updatedExercises })
  }

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof ExerciseSetInProgress,
    value: number | boolean | undefined
  ) => {
    if (!workout) return

    const updatedExercises = [...workout.exercises]
    const exercise = updatedExercises[exerciseIndex]
    const sets = [...exercise.sets]

    sets[setIndex] = { ...sets[setIndex], [field]: value }
    updatedExercises[exerciseIndex] = { ...exercise, sets }

    setWorkout({ ...workout, exercises: updatedExercises })
  }

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    updateSet(exerciseIndex, setIndex, 'completed', true)

    // Start rest timer if enabled
    if (restTimerEnabled) {
      setRestTimer(restTimerSeconds)
    }
  }

  const removeExercise = (exerciseIndex: number) => {
    if (!workout) return

    const updatedExercises = workout.exercises.filter((_, i) => i !== exerciseIndex)
    setWorkout({ ...workout, exercises: updatedExercises })
  }

  const saveWorkout = async () => {
    if (!workout || workout.exercises.length === 0) return

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create workout record
      const { data: workoutRecord, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: workout.name,
          started_at: workout.started_at.toISOString(),
          ended_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Insert exercises and sets
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i]

        const { data: workoutExercise, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutRecord.id,
            exercise_id: exercise.exercise.id,
            order_index: i,
          })
          .select()
          .single()

        if (exerciseError) throw exerciseError

        // Insert completed sets
        const completedSets = exercise.sets.filter((s) => s.completed)
        if (completedSets.length > 0) {
          const { error: setsError } = await supabase.from('exercise_sets').insert(
            completedSets.map((set) => ({
              workout_exercise_id: workoutExercise.id,
              set_number: set.set_number,
              weight: set.weight || null,
              reps: set.reps || null,
              is_warmup: set.is_warmup,
            }))
          )

          if (setsError) throw setsError
        }
      }

      // Update streak
      const today = new Date().toISOString().split('T')[0]
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (streak) {
        const lastDate = streak.last_workout_date
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        let newStreak = streak.current_streak

        if (lastDate === today) {
          // Already worked out today, no change
        } else if (lastDate === yesterdayStr) {
          // Consecutive day
          newStreak += 1
        } else {
          // Streak broken, start fresh
          newStreak = 1
        }

        await supabase
          .from('streaks')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_workout_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
      }

      // Create activity feed entry
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'workout_completed',
        reference_id: workoutRecord.id,
        metadata: {
          workout_name: workout.name,
          exercise_count: workout.exercises.length,
        },
      })

      router.push(`/log/${workoutRecord.id}`)
    } catch (error: unknown) {
      console.error('Error saving workout:', error)
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      alert(`Failed to save workout: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  // Category Selection View
  if (view === 'category' && !workout) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Start Workout
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          What are you training today?
        </p>

        <div className="mb-6">
          <Input
            label="Workout Name (optional)"
            placeholder="Push Day, Leg Day, etc."
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {categories.map((category) => {
            const Icon = categoryIcons[category.id]
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  startWorkout()
                  setView('exercises')
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                  'border-gray-200 bg-white hover:border-brand-500 hover:bg-brand-50',
                  'dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500 dark:hover:bg-brand-900/20'
                )}
              >
                <div className={cn('p-3 rounded-full', getCategoryColor(category.id))}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {category.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Exercise Selection View
  if (view === 'exercises') {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setView(workout ? 'workout' : 'category')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
              {selectedCategory?.replace('_', ' ')} Exercises
            </h1>
            <p className="text-sm text-gray-500">Select an exercise to add</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === category.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading exercises...</div>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => addExerciseToWorkout(exercise)}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {exercise.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {exercise.equipment || 'Bodyweight'} • {exercise.muscle_groups?.join(', ')}
                  </p>
                </div>
                <Plus className="h-5 w-5 text-brand-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Active Workout View
  if (view === 'workout' && workout) {
    return (
      <div className="px-4 py-6">
        {/* Rest Timer Overlay */}
        {restTimer !== null && restTimer > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-64 text-center">
              <CardContent className="py-8">
                <Timer className="h-12 w-12 mx-auto mb-4 text-brand-600" />
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-gray-500 mb-4">Rest Time</p>
                <Button variant="outline" onClick={() => setRestTimer(null)}>
                  Skip Rest
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {workout.name}
            </h1>
            <p className="text-sm text-gray-500">
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={saveWorkout}
            loading={saving}
            disabled={workout.exercises.length === 0}
          >
            Finish
          </Button>
        </div>

        {/* Exercises */}
        <div className="space-y-4 mb-6">
          {workout.exercises.map((exercise, exerciseIndex) => (
            <Card key={exercise.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{exercise.exercise.name}</CardTitle>
                <button
                  onClick={() => removeExercise(exerciseIndex)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
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
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={set.id}
                      className={cn(
                        'grid grid-cols-12 gap-2 items-center p-2 rounded-lg',
                        set.completed
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-gray-50 dark:bg-gray-800'
                      )}
                    >
                      <div className="col-span-2 text-center font-medium">
                        {set.set_number}
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          placeholder="lbs"
                          value={set.weight || ''}
                          onChange={(e) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'weight',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          disabled={set.completed}
                          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          placeholder="reps"
                          value={set.reps || ''}
                          onChange={(e) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'reps',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          disabled={set.completed}
                          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {set.completed ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <button
                            onClick={() => completeSet(exerciseIndex, setIndex)}
                            disabled={!set.weight || !set.reps}
                            className="p-1 rounded-full bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => addSet(exerciseIndex)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Set
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Exercise Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setView('exercises')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </div>
    )
  }

  return null
}
