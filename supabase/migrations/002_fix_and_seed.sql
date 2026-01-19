-- Fix missing tables and seed data
-- This handles cases where some tables already exist

-- ============================================
-- CREATE MISSING TABLES (IF NOT EXISTS)
-- ============================================

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  PRIMARY KEY (group_id, user_id)
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body', 'custom')),
  muscle_groups TEXT[] DEFAULT '{}',
  equipment TEXT,
  metrics TEXT[] NOT NULL DEFAULT '{weight,reps}',
  is_preset BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INT NOT NULL,
  weight DECIMAL,
  reps INT,
  duration_seconds INT,
  distance DECIMAL,
  is_warmup BOOLEAN DEFAULT FALSE,
  is_pr BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Records
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume', 'fastest_time', 'longest_distance')),
  value DECIMAL NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, record_type)
);

-- Streaks
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_workout_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trophies
CREATE TABLE IF NOT EXISTS trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT CHECK (category IN ('strength', 'consistency', 'cardio', 'social')),
  requirement_type TEXT NOT NULL,
  requirement_value DECIMAL NOT NULL,
  is_preset BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_trophies (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trophy_id UUID REFERENCES trophies(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, trophy_id)
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('weekly_volume', 'streak', 'custom', 'specific_exercise')),
  target_exercise_id UUID REFERENCES exercises(id),
  target_value DECIMAL,
  metric TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_value DECIMAL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (challenge_id, user_id)
);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('workout_completed', 'pr_achieved', 'trophy_earned', 'challenge_won', 'streak_milestone')),
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (CREATE IF NOT EXISTS not available, so use DO block)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workouts_user_date') THEN
    CREATE INDEX idx_workouts_user_date ON workouts(user_id, started_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workout_exercises_workout') THEN
    CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exercise_sets_workout_exercise') THEN
    CREATE INDEX idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_feed_user') THEN
    CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_challenges_group') THEN
    CREATE INDEX idx_challenges_group ON challenges(group_id, ends_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_personal_records_user') THEN
    CREATE INDEX idx_personal_records_user ON personal_records(user_id, exercise_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_members_user') THEN
    CREATE INDEX idx_group_members_user ON group_members(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exercises_preset') THEN
    CREATE INDEX idx_exercises_preset ON exercises(is_preset) WHERE is_preset = TRUE;
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to avoid conflicts), then recreate
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Group members can view groups" ON groups;
DROP POLICY IF EXISTS "Anyone can view groups by invite code" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update" ON groups;
DROP POLICY IF EXISTS "Group members can view memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Preset exercises are viewable by everyone" ON exercises;
DROP POLICY IF EXISTS "Users can view own custom exercises" ON exercises;
DROP POLICY IF EXISTS "Users can create custom exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update own custom exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete own custom exercises" ON exercises;
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
DROP POLICY IF EXISTS "Group members can view each others workouts" ON workouts;
DROP POLICY IF EXISTS "Users can create own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can view own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Group members can view workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can manage own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can view own exercise sets" ON exercise_sets;
DROP POLICY IF EXISTS "Group members can view exercise sets" ON exercise_sets;
DROP POLICY IF EXISTS "Users can manage own exercise sets" ON exercise_sets;
DROP POLICY IF EXISTS "Users can view own PRs" ON personal_records;
DROP POLICY IF EXISTS "Group members can view PRs" ON personal_records;
DROP POLICY IF EXISTS "Users can manage own PRs" ON personal_records;
DROP POLICY IF EXISTS "Users can view own streak" ON streaks;
DROP POLICY IF EXISTS "Group members can view streaks" ON streaks;
DROP POLICY IF EXISTS "Users can update own streak" ON streaks;
DROP POLICY IF EXISTS "Trophies are viewable by everyone" ON trophies;
DROP POLICY IF EXISTS "Users can view own trophies" ON user_trophies;
DROP POLICY IF EXISTS "Group members can view trophies" ON user_trophies;
DROP POLICY IF EXISTS "System can award trophies" ON user_trophies;
DROP POLICY IF EXISTS "Group members can view challenges" ON challenges;
DROP POLICY IF EXISTS "Group members can create challenges" ON challenges;
DROP POLICY IF EXISTS "Group members can view participants" ON challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON challenge_participants;
DROP POLICY IF EXISTS "Users can view own activity" ON activity_feed;
DROP POLICY IF EXISTS "Group members can view activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can create own activity" ON activity_feed;

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Groups
CREATE POLICY "Group members can view groups" ON groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid()));
CREATE POLICY "Anyone can view groups by invite code" ON groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update" ON groups FOR UPDATE
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'));

-- Group members
CREATE POLICY "Group members can view memberships" ON group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Exercises
CREATE POLICY "Preset exercises are viewable by everyone" ON exercises FOR SELECT USING (is_preset = TRUE);
CREATE POLICY "Users can view own custom exercises" ON exercises FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can create custom exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = created_by AND is_preset = FALSE);
CREATE POLICY "Users can update own custom exercises" ON exercises FOR UPDATE USING (created_by = auth.uid() AND is_preset = FALSE);
CREATE POLICY "Users can delete own custom exercises" ON exercises FOR DELETE USING (created_by = auth.uid() AND is_preset = FALSE);

-- Workouts
CREATE POLICY "Users can view own workouts" ON workouts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Group members can view each others workouts" ON workouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = workouts.user_id
  ));
CREATE POLICY "Users can create own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON workouts FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises
CREATE POLICY "Users can view own workout exercises" ON workout_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM workouts WHERE id = workout_id AND user_id = auth.uid()));
CREATE POLICY "Group members can view workout exercises" ON workout_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workouts w
    JOIN group_members gm1 ON gm1.user_id = w.user_id
    JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id = auth.uid()
    WHERE w.id = workout_id
  ));
CREATE POLICY "Users can manage own workout exercises" ON workout_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM workouts WHERE id = workout_id AND user_id = auth.uid()));

-- Exercise sets
CREATE POLICY "Users can view own exercise sets" ON exercise_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  ));
CREATE POLICY "Group members can view exercise sets" ON exercise_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    JOIN group_members gm1 ON gm1.user_id = w.user_id
    JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id = auth.uid()
    WHERE we.id = workout_exercise_id
  ));
CREATE POLICY "Users can manage own exercise sets" ON exercise_sets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  ));

-- Personal records
CREATE POLICY "Users can view own PRs" ON personal_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Group members can view PRs" ON personal_records FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = personal_records.user_id
  ));
CREATE POLICY "Users can manage own PRs" ON personal_records FOR ALL USING (user_id = auth.uid());

-- Streaks
CREATE POLICY "Users can view own streak" ON streaks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Group members can view streaks" ON streaks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = streaks.user_id
  ));
CREATE POLICY "Users can update own streak" ON streaks FOR UPDATE USING (user_id = auth.uid());

-- Trophies
CREATE POLICY "Trophies are viewable by everyone" ON trophies FOR SELECT USING (true);

-- User trophies
CREATE POLICY "Users can view own trophies" ON user_trophies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Group members can view trophies" ON user_trophies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = user_trophies.user_id
  ));
CREATE POLICY "System can award trophies" ON user_trophies FOR INSERT WITH CHECK (user_id = auth.uid());

-- Challenges
CREATE POLICY "Group members can view challenges" ON challenges FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members WHERE group_id = challenges.group_id AND user_id = auth.uid()));
CREATE POLICY "Group members can create challenges" ON challenges FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM group_members WHERE group_id = challenges.group_id AND user_id = auth.uid()));

-- Challenge participants
CREATE POLICY "Group members can view participants" ON challenge_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM challenges c
    JOIN group_members gm ON gm.group_id = c.group_id
    WHERE c.id = challenge_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM challenges c
    JOIN group_members gm ON gm.group_id = c.group_id
    WHERE c.id = challenge_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own participation" ON challenge_participants FOR UPDATE USING (user_id = auth.uid());

-- Activity feed
CREATE POLICY "Users can view own activity" ON activity_feed FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Group members can view activity" ON activity_feed FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = activity_feed.user_id
  ));
CREATE POLICY "Users can create own activity" ON activity_feed FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- TRIGGERS (recreate if needed)
-- ============================================

-- Auto-create streak record for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.streaks (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================
-- SEED EXERCISES (only if empty)
-- ============================================

-- Check if exercises exist, only seed if table is empty
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset)
SELECT * FROM (VALUES
  ('Bench Press (Barbell)', 'chest', ARRAY['chest', 'triceps', 'shoulders'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Incline Bench Press', 'chest', ARRAY['upper chest', 'triceps', 'shoulders'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Decline Bench Press', 'chest', ARRAY['lower chest', 'triceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Press', 'chest', ARRAY['chest', 'triceps', 'shoulders'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Incline Dumbbell Press', 'chest', ARRAY['upper chest', 'triceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Fly', 'chest', ARRAY['chest'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Cable Crossover', 'chest', ARRAY['chest'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Push-ups', 'chest', ARRAY['chest', 'triceps', 'shoulders'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Chest Dip', 'chest', ARRAY['chest', 'triceps'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Pec Deck', 'chest', ARRAY['chest'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Deadlift', 'back', ARRAY['lower back', 'hamstrings', 'glutes'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Barbell Row', 'back', ARRAY['lats', 'rhomboids', 'biceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Pull-ups', 'back', ARRAY['lats', 'biceps'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Chin-ups', 'back', ARRAY['lats', 'biceps'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Lat Pulldown', 'back', ARRAY['lats', 'biceps'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Seated Cable Row', 'back', ARRAY['lats', 'rhomboids'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('T-Bar Row', 'back', ARRAY['lats', 'rhomboids'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Row', 'back', ARRAY['lats', 'rhomboids'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Face Pulls', 'back', ARRAY['rear delts', 'rhomboids'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Hyperextension', 'back', ARRAY['lower back', 'glutes'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Squat (Barbell)', 'legs', ARRAY['quads', 'glutes', 'hamstrings'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Front Squat', 'legs', ARRAY['quads', 'core'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Leg Press', 'legs', ARRAY['quads', 'glutes'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Romanian Deadlift', 'legs', ARRAY['hamstrings', 'glutes'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Leg Curl', 'legs', ARRAY['hamstrings'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Leg Extension', 'legs', ARRAY['quads'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Calf Raise (Standing)', 'legs', ARRAY['calves'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Calf Raise (Seated)', 'legs', ARRAY['calves'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Lunges', 'legs', ARRAY['quads', 'glutes'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Bulgarian Split Squat', 'legs', ARRAY['quads', 'glutes'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Hack Squat', 'legs', ARRAY['quads'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Hip Thrust', 'legs', ARRAY['glutes', 'hamstrings'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Overhead Press', 'shoulders', ARRAY['shoulders', 'triceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Shoulder Press', 'shoulders', ARRAY['shoulders', 'triceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Arnold Press', 'shoulders', ARRAY['shoulders'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Lateral Raise', 'shoulders', ARRAY['side delts'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Front Raise', 'shoulders', ARRAY['front delts'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Rear Delt Fly', 'shoulders', ARRAY['rear delts'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Upright Row', 'shoulders', ARRAY['shoulders', 'traps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Shrugs', 'shoulders', ARRAY['traps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Machine Shoulder Press', 'shoulders', ARRAY['shoulders'], 'machine', ARRAY['weight', 'reps'], TRUE),
  ('Barbell Curl', 'arms', ARRAY['biceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Curl', 'arms', ARRAY['biceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Hammer Curl', 'arms', ARRAY['biceps', 'forearms'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Preacher Curl', 'arms', ARRAY['biceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Cable Curl', 'arms', ARRAY['biceps'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Tricep Pushdown', 'arms', ARRAY['triceps'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Skull Crushers', 'arms', ARRAY['triceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Overhead Tricep Extension', 'arms', ARRAY['triceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Close-Grip Bench Press', 'arms', ARRAY['triceps', 'chest'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Tricep Dips', 'arms', ARRAY['triceps'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Concentration Curl', 'arms', ARRAY['biceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Plank', 'core', ARRAY['core'], 'bodyweight', ARRAY['duration'], TRUE),
  ('Crunches', 'core', ARRAY['abs'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Leg Raise', 'core', ARRAY['lower abs'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Hanging Leg Raise', 'core', ARRAY['lower abs'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Russian Twist', 'core', ARRAY['obliques'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Ab Wheel Rollout', 'core', ARRAY['core'], 'ab wheel', ARRAY['reps'], TRUE),
  ('Cable Crunch', 'core', ARRAY['abs'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Dead Bug', 'core', ARRAY['core'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Mountain Climbers', 'core', ARRAY['core'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Side Plank', 'core', ARRAY['obliques'], 'bodyweight', ARRAY['duration'], TRUE),
  ('Running (Treadmill)', 'cardio', ARRAY['legs', 'cardiovascular'], 'treadmill', ARRAY['distance', 'time'], TRUE),
  ('Running (Outdoor)', 'cardio', ARRAY['legs', 'cardiovascular'], NULL, ARRAY['distance', 'time'], TRUE),
  ('Cycling (Stationary)', 'cardio', ARRAY['legs', 'cardiovascular'], 'bike', ARRAY['distance', 'time'], TRUE),
  ('Cycling (Outdoor)', 'cardio', ARRAY['legs', 'cardiovascular'], 'bike', ARRAY['distance', 'time'], TRUE),
  ('Rowing Machine', 'cardio', ARRAY['full body', 'cardiovascular'], 'rower', ARRAY['distance', 'time'], TRUE),
  ('Elliptical', 'cardio', ARRAY['legs', 'cardiovascular'], 'elliptical', ARRAY['distance', 'time'], TRUE),
  ('Stair Climber', 'cardio', ARRAY['legs', 'cardiovascular'], 'stair machine', ARRAY['time'], TRUE),
  ('Swimming', 'cardio', ARRAY['full body', 'cardiovascular'], NULL, ARRAY['distance', 'time'], TRUE),
  ('Jump Rope', 'cardio', ARRAY['legs', 'cardiovascular'], 'jump rope', ARRAY['time'], TRUE),
  ('Walking', 'cardio', ARRAY['legs', 'cardiovascular'], NULL, ARRAY['distance', 'time'], TRUE),
  ('HIIT', 'cardio', ARRAY['full body', 'cardiovascular'], NULL, ARRAY['time'], TRUE),
  ('Sprints', 'cardio', ARRAY['legs', 'cardiovascular'], NULL, ARRAY['distance', 'reps'], TRUE),
  ('Burpees', 'full_body', ARRAY['full body'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Kettlebell Swing', 'full_body', ARRAY['glutes', 'hamstrings', 'core'], 'kettlebell', ARRAY['weight', 'reps'], TRUE),
  ('Clean and Press', 'full_body', ARRAY['full body'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Thrusters', 'full_body', ARRAY['legs', 'shoulders'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Turkish Get-up', 'full_body', ARRAY['full body'], 'kettlebell', ARRAY['weight', 'reps'], TRUE),
  ('Battle Ropes', 'full_body', ARRAY['arms', 'core'], 'ropes', ARRAY['time'], TRUE),
  ('Box Jumps', 'full_body', ARRAY['legs'], 'box', ARRAY['reps'], TRUE),
  ('Farmers Walk', 'full_body', ARRAY['grip', 'core', 'legs'], 'dumbbell', ARRAY['weight', 'distance'], TRUE)
) AS v(name, category, muscle_groups, equipment, metrics, is_preset)
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE is_preset = TRUE LIMIT 1);

-- ============================================
-- SEED TROPHIES (only if empty)
-- ============================================
INSERT INTO trophies (name, description, icon, category, requirement_type, requirement_value)
SELECT * FROM (VALUES
  ('First Steps', 'Complete your first workout', '🌱', 'consistency', 'total_workouts', 1),
  ('Getting Started', 'Complete 5 workouts', '🚀', 'consistency', 'total_workouts', 5),
  ('Dedicated', 'Complete 10 workouts', '📅', 'consistency', 'total_workouts', 10),
  ('Committed', 'Complete 25 workouts', '💪', 'consistency', 'total_workouts', 25),
  ('Century Club', 'Complete 100 workouts', '💯', 'consistency', 'total_workouts', 100),
  ('Veteran', 'Complete 250 workouts', '🎖️', 'consistency', 'total_workouts', 250),
  ('Week Warrior', 'Maintain a 7-day streak', '🔥', 'consistency', 'streak_days', 7),
  ('Two Week Terror', 'Maintain a 14-day streak', '🔥', 'consistency', 'streak_days', 14),
  ('Monthly Monster', 'Maintain a 30-day streak', '🔥', 'consistency', 'streak_days', 30),
  ('Quarterly Crusher', 'Maintain a 90-day streak', '🏆', 'consistency', 'streak_days', 90),
  ('Half Year Hero', 'Maintain a 180-day streak', '👑', 'consistency', 'streak_days', 180),
  ('Year of Iron', 'Maintain a 365-day streak', '⭐', 'consistency', 'streak_days', 365),
  ('PR Hunter', 'Set 5 personal records', '🎯', 'strength', 'pr_count', 5),
  ('PR Machine', 'Set 25 personal records', '🏋️', 'strength', 'pr_count', 25),
  ('PR Legend', 'Set 100 personal records', '🌟', 'strength', 'pr_count', 100),
  ('One Plate Bench', 'Bench press 135 lbs', '🏋️', 'strength', 'bench_weight', 135),
  ('Two Plate Bench', 'Bench press 225 lbs', '🏋️‍♂️', 'strength', 'bench_weight', 225),
  ('Three Plate Bench', 'Bench press 315 lbs', '🏋️‍♀️', 'strength', 'bench_weight', 315),
  ('One Plate Squat', 'Squat 135 lbs', '🦵', 'strength', 'squat_weight', 135),
  ('Two Plate Squat', 'Squat 225 lbs', '🦵', 'strength', 'squat_weight', 225),
  ('Three Plate Squat', 'Squat 315 lbs', '🦵', 'strength', 'squat_weight', 315),
  ('Four Plate Squat', 'Squat 405 lbs', '🦵', 'strength', 'squat_weight', 405),
  ('Ton Lifter', 'Lift 2,000 lbs in one workout', '📦', 'strength', 'workout_volume', 2000),
  ('Heavy Hauler', 'Lift 10,000 lbs in one workout', '🚛', 'strength', 'workout_volume', 10000),
  ('Volume King', 'Lift 25,000 lbs in one workout', '👑', 'strength', 'workout_volume', 25000),
  ('First Mile', 'Run 1 mile', '🏃', 'cardio', 'run_distance', 1),
  ('5K Finisher', 'Run 5 kilometers (3.1 miles)', '🏃‍♂️', 'cardio', 'run_distance', 3.1),
  ('10K Finisher', 'Run 10 kilometers (6.2 miles)', '🏃‍♀️', 'cardio', 'run_distance', 6.2),
  ('Half Marathon', 'Run 13.1 miles', '🥇', 'cardio', 'run_distance', 13.1),
  ('Marathon', 'Run 26.2 miles', '🏅', 'cardio', 'run_distance', 26.2),
  ('Cardio Starter', 'Complete 10 cardio sessions', '❤️', 'cardio', 'cardio_sessions', 10),
  ('Cardio Regular', 'Complete 50 cardio sessions', '❤️‍🔥', 'cardio', 'cardio_sessions', 50),
  ('Team Player', 'Join a group', '👋', 'social', 'groups_joined', 1),
  ('Squad Leader', 'Create a group', '🤝', 'social', 'groups_created', 1),
  ('Challenger', 'Participate in 5 challenges', '🎮', 'social', 'challenges_joined', 5),
  ('Champion', 'Win a challenge', '🥇', 'social', 'challenges_won', 1),
  ('Dominant', 'Win 5 challenges', '🏆', 'social', 'challenges_won', 5),
  ('Undefeated', 'Win 10 challenges', '👑', 'social', 'challenges_won', 10)
) AS v(name, description, icon, category, requirement_type, requirement_value)
WHERE NOT EXISTS (SELECT 1 FROM trophies WHERE is_preset = TRUE LIMIT 1);

-- Create streak for existing users who don't have one
INSERT INTO streaks (user_id)
SELECT id FROM profiles WHERE id NOT IN (SELECT user_id FROM streaks)
ON CONFLICT DO NOTHING;
