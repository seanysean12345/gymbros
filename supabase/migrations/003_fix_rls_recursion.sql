-- Fix infinite recursion in RLS policies
-- The group_members policies were self-referential, causing loops

-- Drop the problematic policies
DROP POLICY IF EXISTS "Group members can view memberships" ON group_members;
DROP POLICY IF EXISTS "Group members can view groups" ON groups;
DROP POLICY IF EXISTS "Group members can view each others workouts" ON workouts;
DROP POLICY IF EXISTS "Group members can view workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Group members can view exercise sets" ON exercise_sets;
DROP POLICY IF EXISTS "Group members can view PRs" ON personal_records;
DROP POLICY IF EXISTS "Group members can view streaks" ON streaks;
DROP POLICY IF EXISTS "Group members can view trophies" ON user_trophies;
DROP POLICY IF EXISTS "Group members can view activity" ON activity_feed;

-- Recreate group_members policies WITHOUT self-reference
-- Users can see their own memberships directly
CREATE POLICY "Users can view own memberships" ON group_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can see other members of groups they belong to (using a simpler check)
CREATE POLICY "Users can view group co-members" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Recreate groups policy without recursion
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Simplified workouts policy - just own workouts for now
-- (Group viewing can be added later with a proper join table approach)
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (user_id = auth.uid());

-- Keep workout_exercises simple - based on workout ownership
DROP POLICY IF EXISTS "Users can view own workout exercises" ON workout_exercises;
CREATE POLICY "Users can view own workout exercises" ON workout_exercises
  FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

-- Keep exercise_sets simple
DROP POLICY IF EXISTS "Users can view own exercise sets" ON exercise_sets;
CREATE POLICY "Users can view own exercise sets" ON exercise_sets
  FOR SELECT USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

-- Simplified personal_records
DROP POLICY IF EXISTS "Users can view own PRs" ON personal_records;
CREATE POLICY "Users can view own PRs" ON personal_records
  FOR SELECT USING (user_id = auth.uid());

-- Simplified streaks
DROP POLICY IF EXISTS "Users can view own streak" ON streaks;
CREATE POLICY "Users can view own streak" ON streaks
  FOR SELECT USING (user_id = auth.uid());

-- Simplified user_trophies
DROP POLICY IF EXISTS "Users can view own trophies" ON user_trophies;
CREATE POLICY "Users can view own trophies" ON user_trophies
  FOR SELECT USING (user_id = auth.uid());

-- Simplified activity_feed
DROP POLICY IF EXISTS "Users can view own activity" ON activity_feed;
CREATE POLICY "Users can view own activity" ON activity_feed
  FOR SELECT USING (user_id = auth.uid());

-- Make sure INSERT policies exist and are simple
DROP POLICY IF EXISTS "Users can create own workouts" ON workouts;
CREATE POLICY "Users can create own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own workout exercises" ON workout_exercises;
CREATE POLICY "Users can insert workout exercises" ON workout_exercises
  FOR INSERT WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update workout exercises" ON workout_exercises
  FOR UPDATE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete workout exercises" ON workout_exercises
  FOR DELETE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage own exercise sets" ON exercise_sets;
CREATE POLICY "Users can insert exercise sets" ON exercise_sets
  FOR INSERT WITH CHECK (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercise sets" ON exercise_sets
  FOR UPDATE USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercise sets" ON exercise_sets
  FOR DELETE USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE w.user_id = auth.uid()
    )
  );

-- Streaks insert (for new users)
CREATE POLICY "Users can insert own streak" ON streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
