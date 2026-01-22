'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [preferredUnit, setPreferredUnit] = useState<'lbs' | 'kg'>('lbs')
  const [restTimerEnabled, setRestTimerEnabled] = useState(true)
  const [restTimerSeconds, setRestTimerSeconds] = useState(90)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setUsername(profileData.username || '')
      setDisplayName(profileData.display_name || '')
      setPreferredUnit(profileData.preferred_unit || 'lbs')
      setRestTimerEnabled(profileData.rest_timer_enabled ?? true)
      setRestTimerSeconds(profileData.rest_timer_seconds || 90)
    }

    setLoading(false)
  }

  async function saveSettings() {
    if (!profile) return

    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        display_name: displayName.trim() || null,
        preferred_unit: preferredUnit,
        rest_timer_enabled: restTimerEnabled,
        rest_timer_seconds: restTimerSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        <Button onClick={saveSettings} loading={saving} disabled={saving}>
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Profile Settings */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workout Settings */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Workout Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weight Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight Unit
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPreferredUnit('lbs')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  preferredUnit === 'lbs'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                Pounds (lbs)
              </button>
              <button
                onClick={() => setPreferredUnit('kg')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  preferredUnit === 'kg'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}
              >
                Kilograms (kg)
              </button>
            </div>
          </div>

          {/* Rest Timer Toggle */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rest Timer
                </label>
                <p className="text-xs text-gray-500">Show rest timer between sets</p>
              </div>
              <button
                onClick={() => setRestTimerEnabled(!restTimerEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  restTimerEnabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    restTimerEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rest Timer Duration */}
          {restTimerEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rest Timer Duration
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={restTimerSeconds}
                  onChange={(e) => setRestTimerSeconds(Math.max(15, Math.min(300, parseInt(e.target.value) || 90)))}
                  min={15}
                  max={300}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">seconds</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[60, 90, 120, 180].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => setRestTimerSeconds(seconds)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      restTimerSeconds === seconds
                        ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 border-brand-300 dark:border-brand-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
