// Database types - these mirror the Supabase schema

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  preferred_unit: 'lbs' | 'kg'
  rest_timer_enabled: boolean
  rest_timer_seconds: number
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  joined_at: string
  role: 'admin' | 'member'
}

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  muscle_groups: string[]
  equipment: string | null
  metrics: ExerciseMetric[]
  is_preset: boolean
  created_by: string | null
  created_at: string
}

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'full_body'
  | 'custom'

export type ExerciseMetric = 'weight' | 'reps' | 'sets' | 'distance' | 'time' | 'duration'

export interface Workout {
  id: string
  user_id: string
  name: string | null
  started_at: string
  ended_at: string | null
  notes: string | null
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  order_index: number
  created_at: string
  // Joined data
  exercise?: Exercise
  sets?: ExerciseSet[]
}

export interface ExerciseSet {
  id: string
  workout_exercise_id: string
  set_number: number
  weight: number | null
  reps: number | null
  duration_seconds: number | null
  distance: number | null
  is_warmup: boolean
  is_pr: boolean
  notes: string | null
  created_at: string
}

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_id: string
  record_type: 'max_weight' | 'max_reps' | 'max_volume' | 'fastest_time' | 'longest_distance'
  value: number
  achieved_at: string
  workout_id: string | null
  created_at: string
}

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_workout_date: string | null
  updated_at: string
}

export interface Trophy {
  id: string
  name: string
  description: string | null
  icon: string
  category: 'strength' | 'consistency' | 'cardio' | 'social'
  requirement_type: string
  requirement_value: number
  is_preset: boolean
  created_at: string
}

export interface UserTrophy {
  user_id: string
  trophy_id: string
  earned_at: string
  trophy?: Trophy
}

export interface Challenge {
  id: string
  group_id: string
  created_by: string
  name: string
  description: string | null
  challenge_type: 'weekly_volume' | 'streak' | 'custom' | 'specific_exercise'
  target_exercise_id: string | null
  target_value: number | null
  metric: string
  starts_at: string
  ends_at: string
  created_at: string
}

export interface ChallengeParticipant {
  challenge_id: string
  user_id: string
  current_value: number
  completed: boolean
  completed_at: string | null
  // Joined data
  profile?: Profile
}

export interface ActivityFeedItem {
  id: string
  user_id: string
  activity_type: 'workout_completed' | 'pr_achieved' | 'trophy_earned' | 'challenge_won' | 'streak_milestone'
  reference_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  // Joined data
  profile?: Profile
}

// UI Types
export interface WorkoutInProgress {
  id: string
  name: string
  started_at: Date
  exercises: WorkoutExerciseInProgress[]
}

export interface WorkoutExerciseInProgress {
  id: string
  exercise: Exercise
  sets: ExerciseSetInProgress[]
}

export interface ExerciseSetInProgress {
  id: string
  set_number: number
  weight?: number
  reps?: number
  duration_seconds?: number
  distance?: number
  is_warmup: boolean
  completed: boolean
}
