-- Comprehensive RLS cleanup for groups and group_members tables
-- This migration drops all existing policies and recreates clean, simple ones

-- Drop ALL existing policies on groups
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'groups' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON groups', pol.policyname); END LOOP;
END $$;

-- Drop ALL existing policies on group_members
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'group_members' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON group_members', pol.policyname); END LOOP;
END $$;

-- Recreate clean policies for groups
-- All authenticated users can view all groups (needed for invite code lookups and joins)
CREATE POLICY "groups_select" ON groups FOR SELECT TO authenticated USING (true);

-- Only the creator can insert a group
CREATE POLICY "groups_insert" ON groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Only group admins can update the group
CREATE POLICY "groups_update" ON groups FOR UPDATE TO authenticated
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Recreate clean policies for group_members
-- Members can only see other members in groups they belong to
CREATE POLICY "group_members_select" ON group_members FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- Users can only insert themselves as members
CREATE POLICY "group_members_insert" ON group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can only remove themselves from groups
CREATE POLICY "group_members_delete" ON group_members FOR DELETE TO authenticated USING (user_id = auth.uid());
