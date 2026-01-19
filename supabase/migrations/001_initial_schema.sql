-- GymBros Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_unit TEXT DEFAULT 'lbs' CHECK (preferred_unit IN ('lbs', 'kg')),
  rest_timer_enabled BOOLEAN DEFAULT TRUE,
  rest_timer_seconds INT DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTR(NEW.id::TEXT, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GROUPS (friend circles)
-- ============================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  PRIMARY KEY (group_id, user_id)
);

-- ============================================
-- EXERCISES
-- ============================================
CREATE TABLE exercises (
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

-- ============================================
-- WORKOUTS
-- ============================================
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercise_sets (
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

-- ============================================
-- PERSONAL RECORDS
-- ============================================
CREATE TABLE personal_records (
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

-- ============================================
-- STREAKS
-- ============================================
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_workout_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create streak record for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================
-- TROPHIES
-- ============================================
CREATE TABLE trophies (
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

CREATE TABLE user_trophies (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trophy_id UUID REFERENCES trophies(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, trophy_id)
);

-- ============================================
-- CHALLENGES
-- ============================================
CREATE TABLE challenges (
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

CREATE TABLE challenge_participants (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_value DECIMAL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (challenge_id, user_id)
);

-- ============================================
-- ACTIVITY FEED
-- ============================================
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('workout_completed', 'pr_achieved', 'trophy_earned', 'challenge_won', 'streak_milestone')),
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_workouts_user_date ON workouts(user_id, started_at DESC);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id);
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_challenges_group ON challenges(group_id, ends_at DESC);
CREATE INDEX idx_personal_records_user ON personal_records(user_id, exercise_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_exercises_preset ON exercises(is_preset) WHERE is_preset = TRUE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
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

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Groups: Members can read, admins can update
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

-- Exercises: Presets visible to all, custom only to creator
CREATE POLICY "Preset exercises are viewable by everyone" ON exercises FOR SELECT USING (is_preset = TRUE);
CREATE POLICY "Users can view own custom exercises" ON exercises FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can create custom exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = created_by AND is_preset = FALSE);
CREATE POLICY "Users can update own custom exercises" ON exercises FOR UPDATE USING (created_by = auth.uid() AND is_preset = FALSE);
CREATE POLICY "Users can delete own custom exercises" ON exercises FOR DELETE USING (created_by = auth.uid() AND is_preset = FALSE);

-- Workouts: Own workouts + group members can view
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

-- Workout exercises & sets: Follow workout permissions
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
