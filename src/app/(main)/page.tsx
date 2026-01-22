import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Flame, Trophy, TrendingUp, Plus, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PhotoCarouselWrapper } from '@/components/ui/photo-carousel-wrapper'
import { UploadRequiredBanner } from '@/components/ui/upload-required-banner'
import { formatRelativeTime, getStreakStatus } from '@/lib/utils'
import { getStartOfPeriod, hasUploadedInPeriod } from '@/lib/supabase/storage'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles redirect to /login if not authenticated
  if (!user) {
    return null
  }

  // Fetch user profile
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

  // Fetch recent workouts
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (
        id,
        exercise:exercises (name)
      )
    `)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(3)

  // Fetch activity feed (own + group members)
  const { data: activityFeed } = await supabase
    .from('activity_feed')
    .select(`
      *,
      profile:profiles (username, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch user's groups (two-step query for RLS)
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = memberships?.map((m) => m.group_id) || []

  // Fetch groups with photo requirements
  const { data: groups } = groupIds.length > 0
    ? await supabase
        .from('groups')
        .select('id, name, photo_upload_required, photo_upload_frequency')
        .in('id', groupIds)
    : { data: [] }

  // Fetch all group member IDs for photo fetching
  const { data: allGroupMembers } = groupIds.length > 0
    ? await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds)
    : { data: [] }

  const allMemberIds = Array.from(new Set(allGroupMembers?.map((m) => m.user_id) || []))

  // Fetch progress photos from all group members
  const { data: progressPhotos } = allMemberIds.length > 0
    ? await supabase
        .from('progress_photos')
        .select(`
          *,
          profile:profiles (id, username, display_name, avatar_url)
        `)
        .in('user_id', allMemberIds)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }

  // Fetch user's own photos for upload check
  const { data: userPhotos } = await supabase
    .from('progress_photos')
    .select('id, user_id, week_of')
    .eq('user_id', user.id)

  // Determine which groups require uploads that the user hasn't fulfilled
  const groupsRequiringUpload = (groups || [])
    .filter((g) => g.photo_upload_required)
    .filter((g) => {
      const frequency = g.photo_upload_frequency || 'weekly'
      return !hasUploadedInPeriod(user.id, userPhotos || [], frequency as 'daily' | 'weekly' | 'monthly')
    })
    .map((g) => g.name)

  const streakStatus = getStreakStatus(streak?.last_workout_date || null)
  const displayName = profile?.display_name || profile?.username || 'Athlete'
  const currentStreak = streak?.current_streak || 0

  // Get greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Progress Photo Carousel */}
      {progressPhotos && progressPhotos.length > 0 && (
        <PhotoCarouselWrapper photos={progressPhotos as any} />
      )}

      {/* Upload Required Banner */}
      {groupsRequiringUpload.length > 0 && (
        <UploadRequiredBanner
          userId={user.id}
          groupNames={groupsRequiringUpload}
        />
      )}

      <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {displayName}!
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <Flame className={`h-5 w-5 ${streakStatus === 'active' ? 'text-orange-500' : streakStatus === 'at_risk' ? 'text-yellow-500' : 'text-gray-400'}`} />
          <span className="text-gray-600 dark:text-gray-300">
            {currentStreak > 0 ? (
              <>{currentStreak} day streak</>
            ) : (
              <>Start your streak today!</>
            )}
          </span>
          {streakStatus === 'at_risk' && (
            <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
              Work out today to keep it!
            </span>
          )}
        </div>
      </div>

      {/* Today's Activity */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Today&apos;s Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentWorkouts && recentWorkouts.length > 0 && recentWorkouts[0].started_at &&
           new Date(recentWorkouts[0].started_at).toDateString() === new Date().toDateString() ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {recentWorkouts[0].name || 'Workout'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {recentWorkouts[0].workout_exercises?.length || 0} exercises
                  </p>
                </div>
                <span className="text-green-600 text-sm font-medium">Completed</span>
              </div>
              <Link href={`/log/${recentWorkouts[0].id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Details
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                No workout yet today
              </p>
              <Link href="/log">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start Workout
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-brand-600">{currentStreak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-brand-600">{streak?.longest_streak || 0}</div>
          <div className="text-xs text-gray-500">Best Streak</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-brand-600">{recentWorkouts?.length || 0}</div>
          <div className="text-xs text-gray-500">This Week</div>
        </Card>
      </div>

      {/* Active Challenges */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Active Challenges
          </CardTitle>
          <Link href="/social/challenges" className="text-sm text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <p className="mb-2">No active challenges</p>
            <Link href="/social">
              <Button variant="outline" size="sm">
                Join a group to compete
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Friend Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Friend Activity</CardTitle>
          <Link href="/social" className="text-sm text-brand-600 hover:text-brand-700">
            See all
          </Link>
        </CardHeader>
        <CardContent>
          {activityFeed && activityFeed.length > 0 ? (
            <div className="space-y-3">
              {activityFeed.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 text-sm font-medium">
                    {activity.profile?.display_name?.[0] || activity.profile?.username?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.profile?.display_name || activity.profile?.username}</span>
                      {' '}
                      {activity.activity_type === 'workout_completed' && 'completed a workout'}
                      {activity.activity_type === 'pr_achieved' && 'hit a new PR'}
                      {activity.activity_type === 'trophy_earned' && 'earned a trophy'}
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
            <div className="text-center py-4 text-gray-500">
              <p className="mb-2">No recent activity</p>
              <p className="text-sm">Join a group to see what your friends are up to!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      {recentWorkouts && recentWorkouts.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Recent Workouts
            </CardTitle>
            <Link href="/progress" className="text-sm text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/log/${workout.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {workout.name || 'Workout'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {workout.workout_exercises?.length || 0} exercises • {formatRelativeTime(workout.started_at)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
