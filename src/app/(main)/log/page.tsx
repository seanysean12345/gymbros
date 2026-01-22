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

// Fallback for crypto.randomUUID (not available over HTTP on mobile)
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
      id: generateId(),
      name: workoutName || 'Workout',
      started_at: new Date(),
      exercises: [],
    })
    setView('workout')
  }

  const addExerciseToWorkout = (exercise: Exercise) => {
    if (!workout) return

    const newExercise = {
      id: generateId(),
      exercise,
      sets: [
        {
          id: generateId(),
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
      id: generateId(),
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
        <h1 className="text-3xl text-white mb-2">
          Start Workout
        </h1>
        <p className="text-lg text-gray-400 mb-6">
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
                className="relative transform -skew-x-6 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(180deg, #D8D8D8 0%, #F0F0F0 15%, #C8C8C8 35%, #D0D0D0 50%, #B0B0B0 70%, #C0C0C0 85%, #989898 100%)',
                  border: '2px solid',
                  borderColor: '#FFFFFF #707070 #606060 #E8E8E8',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
                  padding: '24px 16px',
                }}
              >
                {/* Brushed metal texture */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(255,255,255,0.08) 1px, rgba(255,255,255,0.08) 2px)',
                  }}
                />
                {/* Content - counter skew */}
                <div className="transform skew-x-6 flex flex-col items-center gap-3 relative z-10">
                  <Icon className="h-10 w-10 text-gray-700" />
                  <span
                    className="text-gray-800 font-wwe text-xl"
                    style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
                  >
                    {category.label}
                  </span>
                </div>
                {/* Corner rivets */}
                <div
                  className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full skew-x-6"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #F0F0F0 0%, #A0A0A0 50%, #606060 100%)',
                    boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.8)',
                  }}
                />
                <div
                  className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full skew-x-6"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #F0F0F0 0%, #A0A0A0 50%, #606060 100%)',
                    boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.8)',
                  }}
                />
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
            className="transform -skew-x-6 p-2 transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(180deg, #D0D0D0 0%, #A0A0A0 100%)',
              border: '2px solid',
              borderColor: '#E0E0E0 #606060 #505050 #D0D0D0',
            }}
          >
            <ArrowLeft className="h-5 w-5 text-gray-800 skew-x-6" />
          </button>
          <div>
            <h1 className="text-xl text-white capitalize">
              {selectedCategory?.replace('_', ' ')} Exercises
            </h1>
            <p className="text-sm text-gray-400">Select an exercise to add</p>
          </div>
        </div>

        {/* Category tabs - chrome parallelogram style */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="relative transform -skew-x-6 whitespace-nowrap transition-all"
              style={{
                background: selectedCategory === category.id
                  ? 'linear-gradient(180deg, #FF3030 0%, #CC0000 50%, #880000 100%)'
                  : 'linear-gradient(180deg, #D8D8D8 0%, #E8E8E8 30%, #C0C0C0 70%, #A0A0A0 100%)',
                border: '2px solid',
                borderColor: selectedCategory === category.id
                  ? '#FF5050 #660000 #550000 #FF2020'
                  : '#FFFFFF #707070 #606060 #E8E8E8',
                padding: '10px 20px',
                boxShadow: selectedCategory === category.id
                  ? '0 0 10px rgba(255,0,0,0.4)'
                  : '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              <span
                className={cn(
                  'transform skew-x-6 block font-wwe text-lg',
                  selectedCategory === category.id ? 'text-white' : 'text-gray-800'
                )}
              >
                {category.label}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading exercises...</div>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => addExerciseToWorkout(exercise)}
                className="w-full relative transform -skew-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                style={{
                  background: 'linear-gradient(180deg, #D0D0D0 0%, #E0E0E0 20%, #C0C0C0 50%, #B0B0B0 80%, #909090 100%)',
                  border: '2px solid',
                  borderColor: '#F0F0F0 #606060 #505050 #E0E0E0',
                  padding: '16px 20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <div className="transform skew-x-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-wwe text-xl">
                      {exercise.name}
                    </p>
                    <p className="text-base text-gray-600">
                      {exercise.equipment || 'Bodyweight'} • {exercise.muscle_groups?.join(', ')}
                    </p>
                  </div>
                  <div
                    className="p-2"
                    style={{
                      background: 'linear-gradient(180deg, #FF3030 0%, #CC0000 50%, #880000 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                </div>
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
                <Button variant="secondary" onClick={() => setRestTimer(null)}>
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
                      className="grid grid-cols-12 gap-2 items-center p-3"
                      style={{
                        background: set.completed
                          ? 'linear-gradient(180deg, rgba(204,0,0,0.2) 0%, rgba(136,0,0,0.2) 100%)'
                          : 'linear-gradient(180deg, #1A1A1A 0%, #0F0F0F 100%)',
                        borderBottom: '1px solid #2A2A2A',
                      }}
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
                          className="w-full px-2 py-2 text-base text-white placeholder-gray-500 disabled:opacity-60"
                          style={{
                            background: '#0A0A0A',
                            border: '2px solid #2A2A2A',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                          }}
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
                          className="w-full px-2 py-2 text-base text-white placeholder-gray-500 disabled:opacity-60"
                          style={{
                            background: '#0A0A0A',
                            border: '2px solid #2A2A2A',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                          }}
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {set.completed ? (
                          <div
                            className="p-1.5"
                            style={{
                              background: 'linear-gradient(180deg, #FF3030 0%, #CC0000 50%, #880000 100%)',
                              boxShadow: '0 0 8px rgba(255,0,0,0.5)',
                            }}
                          >
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <button
                            onClick={() => completeSet(exerciseIndex, setIndex)}
                            disabled={!set.weight || !set.reps}
                            className="p-1.5 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                              background: 'linear-gradient(180deg, #D0D0D0 0%, #B0B0B0 50%, #909090 100%)',
                              border: '2px solid',
                              borderColor: '#E0E0E0 #606060 #505050 #D0D0D0',
                            }}
                          >
                            <Check className="h-5 w-5 text-gray-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addSet(exerciseIndex)}
                  className="w-full mt-3 py-3 transform -skew-x-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, #D0D0D0 0%, #E0E0E0 20%, #C0C0C0 50%, #B0B0B0 80%, #909090 100%)',
                    border: '2px solid',
                    borderColor: '#F0F0F0 #606060 #505050 #E0E0E0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                  }}
                >
                  <span className="skew-x-3 flex items-center justify-center gap-2 text-gray-800 font-wwe text-base">
                    <Plus className="h-5 w-5" />
                    Add Set
                  </span>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Exercise Button */}
        <button
          onClick={() => setView('exercises')}
          className="w-full py-4 transform -skew-x-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(180deg, #D8D8D8 0%, #F0F0F0 15%, #C8C8C8 35%, #D0D0D0 50%, #B0B0B0 70%, #C0C0C0 85%, #989898 100%)',
            border: '2px solid',
            borderColor: '#FFFFFF #707070 #606060 #E8E8E8',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          <span className="skew-x-6 flex items-center justify-center gap-2 text-gray-800 font-wwe text-lg">
            <Plus className="h-6 w-6" />
            Add Exercise
          </span>
        </button>
      </div>
    )
  }

  return null
}
