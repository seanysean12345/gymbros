'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Trophy, Copy, Check, UserPlus, Settings, Camera, ChevronDown, ChevronUp } from 'lucide-react'
import { formatRelativeTime, generateInviteCode } from '@/lib/utils'
import { hasUploadedInPeriod, getStartOfPeriod } from '@/lib/supabase/storage'
import type { Group, ActivityFeedItem, Challenge, ProgressPhoto } from '@/types'

interface GroupWithMembers extends Group {
  member_count?: number
  userRole?: 'admin' | 'member'
}

interface MemberWithUploadStatus {
  user_id: string
  profile: {
    id: string
    username: string
    display_name: string | null
  }
  hasUploaded: boolean
}

export default function SocialPage() {
  const router = useRouter()
  const supabase = createClient()

  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<Record<string, MemberWithUploadStatus[]>>({})
  const [userPhotos, setUserPhotos] = useState<ProgressPhoto[]>([])
  const [updatingSettings, setUpdatingSettings] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)

    // Fetch user's groups - using two separate queries to avoid RLS join issues
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map(m => m.group_id)
      const membershipMap = Object.fromEntries(memberships.map(m => [m.group_id, m.role]))

      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)

      if (groupsData) {
        setGroups(groupsData.map(g => ({
          ...g,
          userRole: membershipMap[g.id] as 'admin' | 'member',
        })))
      }
    }

    // Fetch user's progress photos
    const { data: photos } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)

    if (photos) {
      setUserPhotos(photos as ProgressPhoto[])
    }

    // Fetch activity feed from group members
    const { data: feed } = await supabase
      .from('activity_feed')
      .select(`
        *,
        profile:profiles (username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (feed) {
      setActivityFeed(feed as unknown as ActivityFeedItem[])
    }

    // Fetch active challenges
    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .gte('ends_at', new Date().toISOString())
      .order('ends_at', { ascending: true })
      .limit(5)

    if (challengeData) {
      setChallenges(challengeData as Challenge[])
    }

    setLoading(false)
  }

  async function createGroup() {
    if (!newGroupName.trim()) return

    setCreating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const inviteCode = generateInviteCode()

      // Create the group and return the created row
      const { data: group, error: insertError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single()

      console.log('Insert result:', { group, insertError })

      if (insertError) {
        console.error('Group INSERT error:', insertError)
        throw new Error(`Insert failed: ${insertError.message} (code: ${insertError.code})`)
      }

      if (!group) {
        throw new Error('Group was not created - RLS policy may be blocking the insert')
      }

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        })

      if (memberError) throw memberError

      setNewGroupName('')
      setShowCreateGroup(false)
      loadData()
    } catch (err: unknown) {
      console.error('Group creation error:', err)
      const error = err as { message?: string; details?: string; hint?: string; code?: string }
      setError(error?.message || error?.details || 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  async function joinGroup() {
    if (!joinCode.trim()) return

    setJoining(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Find the group
      const { data: group, error: findError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', joinCode.toUpperCase().trim())
        .single()

      if (findError || !group) {
        throw new Error('Invalid invite code')
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        throw new Error('You are already a member of this group')
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member',
        })

      if (joinError) throw joinError

      setJoinCode('')
      setShowJoinGroup(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group')
    } finally {
      setJoining(false)
    }
  }

  function copyInviteCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function loadGroupMembers(groupId: string, group: GroupWithMembers) {
    // Fetch all members of this group
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)

    if (!members || members.length === 0) return

    const memberIds = members.map(m => m.user_id)

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', memberIds)

    // Fetch progress photos for these members
    const { data: photos } = await supabase
      .from('progress_photos')
      .select('user_id, week_of')
      .in('user_id', memberIds)

    const frequency = (group.photo_upload_frequency || 'weekly') as 'daily' | 'weekly' | 'monthly'

    const membersWithStatus: MemberWithUploadStatus[] = (profiles || []).map(profile => ({
      user_id: profile.id,
      profile,
      hasUploaded: hasUploadedInPeriod(profile.id, photos || [], frequency),
    }))

    setGroupMembers(prev => ({ ...prev, [groupId]: membersWithStatus }))
  }

  async function toggleGroupExpand(groupId: string, group: GroupWithMembers) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null)
    } else {
      setExpandedGroup(groupId)
      if (!groupMembers[groupId]) {
        await loadGroupMembers(groupId, group)
      }
    }
  }

  async function updateGroupSettings(groupId: string, photoRequired: boolean, frequency: string) {
    setUpdatingSettings(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          photo_upload_required: photoRequired,
          photo_upload_frequency: frequency,
        })
        .eq('id', groupId)

      if (updateError) throw updateError

      // Update local state
      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, photo_upload_required: photoRequired, photo_upload_frequency: frequency as 'daily' | 'weekly' | 'monthly' }
          : g
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setUpdatingSettings(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Social
      </h1>

      {/* Groups Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            My Groups
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJoinGroup(!showJoinGroup)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateGroup(!showCreateGroup)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create Group Form */}
          {showCreateGroup && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Create New Group</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Button onClick={createGroup} loading={creating}>
                  Create
                </Button>
              </div>
            </div>
          )}

          {/* Join Group Form */}
          {showJoinGroup && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Join Group</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Invite code (e.g., ABC123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <Button onClick={joinGroup} loading={joining}>
                  Join
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Groups List */}
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group) => {
                const isExpanded = expandedGroup === group.id
                const members = groupMembers[group.id] || []
                const frequency = (group.photo_upload_frequency || 'weekly') as 'daily' | 'weekly' | 'monthly'
                const userHasUploaded = hasUploadedInPeriod(currentUserId || '', userPhotos, frequency)
                const needsUpload = group.photo_upload_required && !userHasUploaded

                return (
                  <div
                    key={group.id}
                    className="rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {group.name}
                        </p>
                        {group.photo_upload_required && (
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                            <Camera className="h-3 w-3" />
                            {group.photo_upload_frequency}
                          </span>
                        )}
                        {needsUpload && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">
                          {group.invite_code}
                        </span>
                        <button
                          onClick={() => copyInviteCode(group.invite_code)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {copiedCode === group.invite_code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleGroupExpand(group.id, group)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Settings */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-4">
                        {/* Admin Settings */}
                        {group.userRole === 'admin' && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Group Settings
                            </h4>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  Require Photo Uploads
                                </p>
                                <p className="text-xs text-gray-500">
                                  Members must upload progress photos
                                </p>
                              </div>
                              <button
                                onClick={() => updateGroupSettings(
                                  group.id,
                                  !group.photo_upload_required,
                                  group.photo_upload_frequency || 'weekly'
                                )}
                                disabled={updatingSettings}
                                className={`w-12 h-6 rounded-full transition-colors ${
                                  group.photo_upload_required
                                    ? 'bg-green-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    group.photo_upload_required ? 'translate-x-6' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </div>

                            {group.photo_upload_required && (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  Upload Frequency
                                </p>
                                <select
                                  value={group.photo_upload_frequency || 'weekly'}
                                  onChange={(e) => updateGroupSettings(
                                    group.id,
                                    group.photo_upload_required,
                                    e.target.value
                                  )}
                                  disabled={updatingSettings}
                                  className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Members List with Upload Status */}
                        {group.photo_upload_required && members.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Members
                            </h4>
                            <div className="space-y-2">
                              {members.map((member) => (
                                <div
                                  key={member.user_id}
                                  className="flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-gray-700/50"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        member.hasUploaded
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                      }`}
                                    >
                                      {(member.profile.display_name || member.profile.username)?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span
                                      className={`text-sm ${
                                        member.hasUploaded
                                          ? 'text-gray-900 dark:text-white'
                                          : 'text-red-600 dark:text-red-400 font-medium'
                                      }`}
                                    >
                                      {member.profile.display_name || member.profile.username}
                                    </span>
                                  </div>
                                  {member.hasUploaded ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <span className="text-xs text-red-500">Missing photo</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">No groups yet</p>
              <p className="text-sm text-gray-400">
                Create a group or join one with an invite code to compete with friends!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Challenges */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {challenges.length > 0 ? (
            <div className="space-y-2">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {challenge.name}
                    </p>
                    <span className="text-xs text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
                      {challenge.challenge_type.replace('_', ' ')}
                    </span>
                  </div>
                  {challenge.description && (
                    <p className="text-sm text-gray-500">{challenge.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Ends {formatRelativeTime(challenge.ends_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">No active challenges</p>
              <p className="text-sm text-gray-400">
                Join a group to participate in challenges!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          {activityFeed.length > 0 ? (
            <div className="space-y-3">
              {activityFeed.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 text-sm font-medium flex-shrink-0">
                    {activity.profile?.display_name?.[0] || activity.profile?.username?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">
                        {activity.profile?.display_name || activity.profile?.username}
                      </span>
                      {' '}
                      {activity.activity_type === 'workout_completed' && 'completed a workout'}
                      {activity.activity_type === 'pr_achieved' && 'hit a new PR'}
                      {activity.activity_type === 'trophy_earned' && 'earned a trophy'}
                      {activity.activity_type === 'challenge_won' && 'won a challenge'}
                      {activity.activity_type === 'streak_milestone' && 'reached a streak milestone'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">
                Activity from you and your group members will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
