-- Fix groups and group_members INSERT policies
-- These may have been affected by previous migrations

-- Ensure groups INSERT policy exists
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Ensure group_members INSERT policy exists
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add a more permissive SELECT policy for groups to allow finding by invite code
DROP POLICY IF EXISTS "Anyone can view groups by invite code" ON groups;
CREATE POLICY "Anyone can view groups by invite code" ON groups
  FOR SELECT USING (true);
