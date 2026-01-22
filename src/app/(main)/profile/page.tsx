import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, Trophy, LogOut, ChevronRight, Flame, Camera, Image } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProfilePhotoSection } from '@/components/profile/photo-section'
import { hasUploadedInPeriod } from '@/lib/supabase/storage'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch streak
  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch workout count
  const { count: workoutCount } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch trophy count
  const { count: trophyCount } = await supabase
    .from('user_trophies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch groups - using two separate queries to avoid RLS join issues
  const { data: groupMemberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  type GroupData = { id: string; name: string; invite_code: string; photo_upload_required: boolean; photo_upload_frequency: string }
  let groups: GroupData[] = []

  if (groupMemberships && groupMemberships.length > 0) {
    const groupIds = groupMemberships.map(m => m.group_id)
    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name, invite_code, photo_upload_required, photo_upload_frequency')
      .in('id', groupIds)

    if (groupsData) {
      groups = groupsData as GroupData[]
    }
  }

  // Fetch user's progress photos
  const { data: progressPhotos } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Check if user has uploaded this week for groups that require it
  const groupsRequiringUpload = groups
    .filter(g => g.photo_upload_required)

  const hasUploadedThisPeriod = groupsRequiringUpload.length === 0 ||
    groupsRequiringUpload.every(g =>
      hasUploadedInPeriod(user.id, progressPhotos || [], (g.photo_upload_frequency || 'weekly') as 'daily' | 'weekly' | 'monthly')
    )

  const displayName = profile?.display_name || profile?.username || 'Athlete'
  const username = profile?.username || 'user'

  return (
    <div className="px-4 py-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-20 w-20 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 text-3xl font-bold">
          {displayName[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayName}
          </h1>
          <p className="text-gray-500">@{username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">{workoutCount || 0}</div>
          <div className="text-xs text-gray-500">Workouts</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600 flex items-center justify-center gap-1">
            <Flame className="h-5 w-5 text-orange-500" />
            {streak?.current_streak || 0}
          </div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-bold text-brand-600">{trophyCount || 0}</div>
          <div className="text-xs text-gray-500">Trophies</div>
        </Card>
      </div>

      {/* Progress Photos Section */}
      <ProfilePhotoSection
        userId={user.id}
        photos={progressPhotos || []}
        hasUploadedThisPeriod={hasUploadedThisPeriod}
        requiresUpload={groupsRequiringUpload.length > 0}
      />

      {/* Trophies Section */}
      <Link href="/profile/trophies">
        <Card className="mb-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Trophies</p>
                <p className="text-sm text-gray-500">{trophyCount || 0} earned</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
      </Link>

      {/* Groups Section */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">My Groups</h3>
            <Link href="/social" className="text-sm text-brand-600 hover:text-brand-700">
              Manage
            </Link>
          </div>
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <span className="text-gray-900 dark:text-white">
                    {group.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    Code: {group.invite_code}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No groups yet. Join or create one!</p>
          )}
        </CardContent>
      </Card>

      {/* Settings Link */}
      <Link href="/profile/settings">
        <Card className="mb-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">Settings</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
      </Link>

      {/* Sign Out */}
      <form action="/api/auth/signout" method="POST">
        <Button variant="secondary" className="w-full" type="submit">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </form>
    </div>
  )
}
