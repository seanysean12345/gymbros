'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Trophy, Copy, Check, UserPlus } from 'lucide-react'
import { formatRelativeTime, generateInviteCode } from '@/lib/utils'
import type { Group, ActivityFeedItem, Challenge } from '@/types'

interface GroupWithMembers extends Group {
  member_count?: number
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

    // Fetch user's groups - using two separate queries to avoid RLS join issues
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map(m => m.group_id)
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)

      if (groupsData) {
        setGroups(groupsData)
      }
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
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {group.name}
                    </p>
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
                  </div>
                </div>
              ))}
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
