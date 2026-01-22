-- Progress Photos Feature Migration
-- Adds photo accountability system for groups

-- ============================================
-- CREATE PROGRESS PHOTOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  week_of DATE NOT NULL, -- Monday of the week this counts for
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries by user and date
CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON progress_photos(user_id, week_of DESC);
CREATE INDEX IF NOT EXISTS idx_progress_photos_week ON progress_photos(week_of DESC);

-- ============================================
-- ADD PHOTO REQUIREMENT COLUMNS TO GROUPS
-- ============================================

ALTER TABLE groups ADD COLUMN IF NOT EXISTS photo_upload_required BOOLEAN DEFAULT false;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS photo_upload_frequency TEXT DEFAULT 'weekly'
  CHECK (photo_upload_frequency IN ('daily', 'weekly', 'monthly'));

-- ============================================
-- ROW LEVEL SECURITY FOR PROGRESS PHOTOS
-- ============================================

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Users can view their own photos
CREATE POLICY "Users can view own photos" ON progress_photos
  FOR SELECT USING (user_id = auth.uid());

-- Group members can view each other's photos
CREATE POLICY "Group members can view photos" ON progress_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = progress_photos.user_id
    )
  );

-- Users can upload their own photos
CREATE POLICY "Users can upload own photos" ON progress_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos (optional - plan says no deletion, but keeping for flexibility)
-- CREATE POLICY "Users can delete own photos" ON progress_photos
--   FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET SETUP (Run in Supabase Dashboard)
-- ============================================
-- Note: Storage bucket and policies should be created via Supabase Dashboard or CLI:
--
-- 1. Create bucket named 'progress-photos' with public access disabled
--
-- 2. Add storage policies:
--    - INSERT: authenticated users can upload to their own folder (user_id/*)
--    - SELECT: users can view files in folders of users they share a group with
--    - DELETE: disabled (no deletion allowed per requirements)
--
-- Example storage policy SQL (run in Dashboard > SQL Editor):
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);
--
-- CREATE POLICY "Users can upload own photos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Group members can view photos"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'progress-photos' AND
--   EXISTS (
--     SELECT 1 FROM group_members gm1
--     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
--     WHERE gm1.user_id = auth.uid()
--     AND gm2.user_id::text = (storage.foldername(name))[1]
--   )
-- );
