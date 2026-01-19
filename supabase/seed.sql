-- GymBros Seed Data
-- Run this after the initial schema migration

-- ============================================
-- PRESET EXERCISES
-- ============================================

-- Chest
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
  ('Bench Press (Barbell)', 'chest', ARRAY['chest', 'triceps', 'shoulders'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Incline Bench Press', 'chest', ARRAY['upper chest', 'triceps', 'shoulders'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Decline Bench Press', 'chest', ARRAY['lower chest', 'triceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Press', 'chest', ARRAY['chest', 'triceps', 'shoulders'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Incline Dumbbell Press', 'chest', ARRAY['upper chest', 'triceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Fly', 'chest', ARRAY['chest'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Cable Crossover', 'chest', ARRAY['chest'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Push-ups', 'chest', ARRAY['chest', 'triceps', 'shoulders'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Chest Dip', 'chest', ARRAY['chest', 'triceps'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Pec Deck', 'chest', ARRAY['chest'], 'machine', ARRAY['weight', 'reps'], TRUE);

-- Back
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
  ('Deadlift', 'back', ARRAY['lower back', 'hamstrings', 'glutes'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Barbell Row', 'back', ARRAY['lats', 'rhomboids', 'biceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Pull-ups', 'back', ARRAY['lats', 'biceps'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Chin-ups', 'back', ARRAY['lats', 'biceps'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Lat Pulldown', 'back', ARRAY['lats', 'biceps'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Seated Cable Row', 'back', ARRAY['lats', 'rhomboids'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('T-Bar Row', 'back', ARRAY['lats', 'rhomboids'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Row', 'back', ARRAY['lats', 'rhomboids'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Face Pulls', 'back', ARRAY['rear delts', 'rhomboids'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Hyperextension', 'back', ARRAY['lower back', 'glutes'], 'bodyweight', ARRAY['weight', 'reps'], TRUE);

-- Legs
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
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
  ('Hip Thrust', 'legs', ARRAY['glutes', 'hamstrings'], 'barbell', ARRAY['weight', 'reps'], TRUE);

-- Shoulders
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
  ('Overhead Press', 'shoulders', ARRAY['shoulders', 'triceps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Dumbbell Shoulder Press', 'shoulders', ARRAY['shoulders', 'triceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Arnold Press', 'shoulders', ARRAY['shoulders'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Lateral Raise', 'shoulders', ARRAY['side delts'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Front Raise', 'shoulders', ARRAY['front delts'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Rear Delt Fly', 'shoulders', ARRAY['rear delts'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Upright Row', 'shoulders', ARRAY['shoulders', 'traps'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Shrugs', 'shoulders', ARRAY['traps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE),
  ('Machine Shoulder Press', 'shoulders', ARRAY['shoulders'], 'machine', ARRAY['weight', 'reps'], TRUE);

-- Arms
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
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
  ('Concentration Curl', 'arms', ARRAY['biceps'], 'dumbbell', ARRAY['weight', 'reps'], TRUE);

-- Core
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
  ('Plank', 'core', ARRAY['core'], 'bodyweight', ARRAY['duration'], TRUE),
  ('Crunches', 'core', ARRAY['abs'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Leg Raise', 'core', ARRAY['lower abs'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Hanging Leg Raise', 'core', ARRAY['lower abs'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Russian Twist', 'core', ARRAY['obliques'], 'bodyweight', ARRAY['weight', 'reps'], TRUE),
  ('Ab Wheel Rollout', 'core', ARRAY['core'], 'ab wheel', ARRAY['reps'], TRUE),
  ('Cable Crunch', 'core', ARRAY['abs'], 'cable', ARRAY['weight', 'reps'], TRUE),
  ('Dead Bug', 'core', ARRAY['core'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Mountain Climbers', 'core', ARRAY['core'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Side Plank', 'core', ARRAY['obliques'], 'bodyweight', ARRAY['duration'], TRUE);

-- Cardio
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
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
  ('Sprints', 'cardio', ARRAY['legs', 'cardiovascular'], NULL, ARRAY['distance', 'reps'], TRUE);

-- Full Body
INSERT INTO exercises (name, category, muscle_groups, equipment, metrics, is_preset) VALUES
  ('Burpees', 'full_body', ARRAY['full body'], 'bodyweight', ARRAY['reps'], TRUE),
  ('Kettlebell Swing', 'full_body', ARRAY['glutes', 'hamstrings', 'core'], 'kettlebell', ARRAY['weight', 'reps'], TRUE),
  ('Clean and Press', 'full_body', ARRAY['full body'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Thrusters', 'full_body', ARRAY['legs', 'shoulders'], 'barbell', ARRAY['weight', 'reps'], TRUE),
  ('Turkish Get-up', 'full_body', ARRAY['full body'], 'kettlebell', ARRAY['weight', 'reps'], TRUE),
  ('Battle Ropes', 'full_body', ARRAY['arms', 'core'], 'ropes', ARRAY['time'], TRUE),
  ('Box Jumps', 'full_body', ARRAY['legs'], 'box', ARRAY['reps'], TRUE),
  ('Farmer''s Walk', 'full_body', ARRAY['grip', 'core', 'legs'], 'dumbbell', ARRAY['weight', 'distance'], TRUE);

-- ============================================
-- PRESET TROPHIES
-- ============================================

-- Consistency trophies
INSERT INTO trophies (name, description, icon, category, requirement_type, requirement_value) VALUES
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
  ('Year of Iron', 'Maintain a 365-day streak', '⭐', 'consistency', 'streak_days', 365);

-- Strength trophies
INSERT INTO trophies (name, description, icon, category, requirement_type, requirement_value) VALUES
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
  ('Volume King', 'Lift 25,000 lbs in one workout', '👑', 'strength', 'workout_volume', 25000);

-- Cardio trophies
INSERT INTO trophies (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('First Mile', 'Run 1 mile', '🏃', 'cardio', 'run_distance', 1),
  ('5K Finisher', 'Run 5 kilometers (3.1 miles)', '🏃‍♂️', 'cardio', 'run_distance', 3.1),
  ('10K Finisher', 'Run 10 kilometers (6.2 miles)', '🏃‍♀️', 'cardio', 'run_distance', 6.2),
  ('Half Marathon', 'Run 13.1 miles', '🥇', 'cardio', 'run_distance', 13.1),
  ('Marathon', 'Run 26.2 miles', '🏅', 'cardio', 'run_distance', 26.2),
  ('Cardio Starter', 'Complete 10 cardio sessions', '❤️', 'cardio', 'cardio_sessions', 10),
  ('Cardio Regular', 'Complete 50 cardio sessions', '❤️‍🔥', 'cardio', 'cardio_sessions', 50);

-- Social trophies
INSERT INTO trophies (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('Team Player', 'Join a group', '👋', 'social', 'groups_joined', 1),
  ('Squad Leader', 'Create a group', '🤝', 'social', 'groups_created', 1),
  ('Challenger', 'Participate in 5 challenges', '🎮', 'social', 'challenges_joined', 5),
  ('Champion', 'Win a challenge', '🥇', 'social', 'challenges_won', 1),
  ('Dominant', 'Win 5 challenges', '🏆', 'social', 'challenges_won', 5),
  ('Undefeated', 'Win 10 challenges', '👑', 'social', 'challenges_won', 10);
