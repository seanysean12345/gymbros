-- Comprehensive fix for groups RLS policies
-- This ensures all necessary policies exist and are correctly configured

-- First, let's check and fix the groups table policies
-- Drop all existing policies on groups to start fresh
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Anyone can view groups by invite code" ON groups;
DROP POLICY IF EXISTS "Group admins can update" ON groups;
DROP POLICY IF EXISTS "Groups are viewable by members" ON groups;

-- Make sure RLS is enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to SELECT any group (needed for invite code lookup and returning inserted rows)
CREATE POLICY "Anyone can view groups" ON groups
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to INSERT groups where they are the creator
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow group admins to UPDATE their groups
CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Now fix group_members policies
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON group_members;
DROP POLICY IF EXISTS "Users can view group co-members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- Make sure RLS is enabled
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own memberships
CREATE POLICY "Users can view own memberships" ON group_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow users to see co-members in their groups
CREATE POLICY "Users can view co-members" ON group_members
  FOR SELECT TO authenticated
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Allow any authenticated user to INSERT themselves into a group
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own membership (leave group)
CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
