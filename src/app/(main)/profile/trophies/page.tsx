import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Trophy as TrophyType, UserTrophy } from '@/types'

const categoryLabels: Record<string, string> = {
  consistency: 'Consistency',
  strength: 'Strength',
  cardio: 'Cardio',
  social: 'Social',
}

const categoryColors: Record<string, string> = {
  consistency: 'text-orange-500',
  strength: 'text-red-500',
  cardio: 'text-blue-500',
  social: 'text-purple-500',
}

export default async function TrophiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all trophies
  const { data: allTrophies } = await supabase
    .from('trophies')
    .select('*')
    .order('category')
    .order('requirement_value')

  // Fetch user's earned trophies
  const { data: userTrophies } = await supabase
    .from('user_trophies')
    .select('trophy_id, earned_at')
    .eq('user_id', user.id)

  const earnedTrophyIds = new Set(userTrophies?.map(ut => ut.trophy_id) || [])
  const earnedTrophiesMap = new Map(
    userTrophies?.map(ut => [ut.trophy_id, ut.earned_at]) || []
  )

  // Group trophies by category
  const trophiesByCategory: Record<string, TrophyType[]> = {}
  for (const trophy of allTrophies || []) {
    const category = trophy.category || 'other'
    if (!trophiesByCategory[category]) {
      trophiesByCategory[category] = []
    }
    trophiesByCategory[category].push(trophy as TrophyType)
  }

  const earnedCount = userTrophies?.length || 0
  const totalCount = allTrophies?.length || 0

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trophies</h1>
          <p className="text-sm text-gray-500">{earnedCount} of {totalCount} earned</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 transition-all"
            style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Trophies by Category */}
      {Object.entries(trophiesByCategory).map(([category, trophies]) => (
        <Card key={category} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className={`text-base flex items-center gap-2 ${categoryColors[category] || 'text-gray-500'}`}>
              <Trophy className="h-4 w-4" />
              {categoryLabels[category] || category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trophies.map((trophy) => {
                const isEarned = earnedTrophyIds.has(trophy.id)
                const earnedAt = earnedTrophiesMap.get(trophy.id)

                return (
                  <div
                    key={trophy.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isEarned
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-800 opacity-60'
                    }`}
                  >
                    <div className={`text-2xl ${!isEarned && 'grayscale'}`}>
                      {trophy.icon || '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                          {trophy.name}
                        </p>
                        {!isEarned && <Lock className="h-3 w-3 text-gray-400" />}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{trophy.description}</p>
                      {isEarned && earnedAt && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Earned {new Date(earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {Object.keys(trophiesByCategory).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No trophies available yet</p>
            <p className="text-sm text-gray-400 mt-1">Keep working out to unlock achievements!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
