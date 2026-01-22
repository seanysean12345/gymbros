import { createClient } from './client'

const BUCKET_NAME = 'progress-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 1080

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Compress and resize an image before upload
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = (height * MAX_DIMENSION) / width
          width = MAX_DIMENSION
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = (width * MAX_DIMENSION) / height
          height = MAX_DIMENSION
        }
      }

      canvas.width = width
      canvas.height = height

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Could not compress image'))
          }
        },
        'image/jpeg',
        0.85 // Quality
      )
    }

    img.onerror = () => reject(new Error('Could not load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload a progress photo to Supabase Storage
 */
export async function uploadProgressPhoto(
  userId: string,
  file: File
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File size must be less than 5MB' }
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'File must be an image' }
  }

  try {
    const supabase = createClient()

    // Compress the image
    const compressedBlob = await compressImage(file)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${userId}/${timestamp}.jpg`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Get the Monday of the current week (for week_of field)
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get the start of the current period based on frequency
 */
export function getStartOfPeriod(
  frequency: 'daily' | 'weekly' | 'monthly',
  date: Date = new Date()
): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  switch (frequency) {
    case 'daily':
      return d
    case 'weekly':
      return getStartOfWeek(d)
    case 'monthly':
      d.setDate(1)
      return d
    default:
      return getStartOfWeek(d)
  }
}

/**
 * Check if a user has uploaded a photo in the current period
 */
export function hasUploadedInPeriod(
  userId: string,
  photos: Array<{ user_id: string; week_of: string }>,
  frequency: 'daily' | 'weekly' | 'monthly'
): boolean {
  const periodStart = getStartOfPeriod(frequency)
  return photos.some(
    (p) =>
      p.user_id === userId &&
      new Date(p.week_of) >= periodStart
  )
}

/**
 * Format the week_of date for display
 */
export function formatWeekOf(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
