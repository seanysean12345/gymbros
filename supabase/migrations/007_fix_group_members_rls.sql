-- Fix group_members RLS policy - the previous one had a self-referential query
-- that can cause infinite recursion issues

-- Drop the problematic policy
DROP POLICY IF EXISTS "group_members_select" ON group_members;

-- Create a simpler policy - users can see their own memberships
-- This avoids the self-referential query issue
CREATE POLICY "group_members_select" ON group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());
