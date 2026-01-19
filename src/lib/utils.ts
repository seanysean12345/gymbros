import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWeight(weight: number, unit: 'lbs' | 'kg'): string {
  return `${weight} ${unit}`
}

export function convertWeight(weight: number, from: 'lbs' | 'kg', to: 'lbs' | 'kg'): number {
  if (from === to) return weight
  if (from === 'lbs' && to === 'kg') return Math.round(weight * 0.453592 * 10) / 10
  return Math.round(weight * 2.20462 * 10) / 10
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatDistance(distance: number, unit: 'mi' | 'km'): string {
  return `${distance.toFixed(2)} ${unit}`
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function calculateVolume(sets: { weight?: number | null; reps?: number | null }[]): number {
  return sets.reduce((total, set) => {
    if (set.weight && set.reps) {
      return total + set.weight * set.reps
    }
    return total
  }, 0)
}

export function getStreakStatus(lastWorkoutDate: string | null): 'active' | 'at_risk' | 'broken' {
  if (!lastWorkoutDate) return 'broken'

  const last = new Date(lastWorkoutDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  last.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000)

  if (diffDays === 0) return 'active'
  if (diffDays === 1) return 'at_risk'
  return 'broken'
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    chest: 'Dumbbell',
    back: 'Activity',
    legs: 'Footprints',
    shoulders: 'CircleDot',
    arms: 'Grip',
    core: 'Target',
    cardio: 'Heart',
    full_body: 'User',
    custom: 'Plus',
  }
  return icons[category] || 'Dumbbell'
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    chest: 'bg-red-500',
    back: 'bg-blue-500',
    legs: 'bg-purple-500',
    shoulders: 'bg-orange-500',
    arms: 'bg-green-500',
    core: 'bg-yellow-500',
    cardio: 'bg-pink-500',
    full_body: 'bg-indigo-500',
    custom: 'bg-gray-500',
  }
  return colors[category] || 'bg-gray-500'
}
