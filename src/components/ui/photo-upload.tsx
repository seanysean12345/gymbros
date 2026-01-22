'use client'

import { useState, useRef } from 'react'
import { Camera, X, Upload, Check } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  uploadProgressPhoto,
  getStartOfWeek,
} from '@/lib/supabase/storage'

interface PhotoUploadProps {
  userId: string
  onUploadComplete?: (photoUrl: string) => void
  onClose?: () => void
  className?: string
}

export function PhotoUpload({
  userId,
  onUploadComplete,
  onClose,
  className,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    try {
      // Upload to storage
      const result = await uploadProgressPhoto(userId, selectedFile)

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed')
      }

      // Save to database
      const supabase = createClient()
      const weekOf = getStartOfWeek()

      const { error: dbError } = await supabase.from('progress_photos').insert({
        user_id: userId,
        photo_url: result.url,
        caption: caption || null,
        week_of: weekOf.toISOString().split('T')[0],
      })

      if (dbError) {
        throw new Error(dbError.message)
      }

      setSuccess(true)
      onUploadComplete?.(result.url)

      // Auto close after success
      setTimeout(() => {
        onClose?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setCaption('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      className={cn('relative', className)}
      style={{
        background: 'linear-gradient(180deg, #1A1A1A 0%, #0F0F0F 100%)',
        border: '2px solid',
        borderColor: '#3A3A3A #1A1A1A #0A0A0A #2A2A2A',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: '1px solid #2A2A2A' }}
      >
        <h3
          className="text-lg uppercase tracking-wide text-white"
          style={{
            fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
            fontStyle: 'italic',
            textShadow: '2px 2px 0 #000',
          }}
        >
          Progress Photo
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Top chrome accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, #606060, #A0A0A0, #606060)',
        }}
      />

      <div className="p-4 space-y-4">
        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="w-16 h-16 flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(180deg, #2A5A2A 0%, #1A3A1A 100%)',
                border: '2px solid #3A7A3A',
              }}
            >
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-green-400 uppercase tracking-wide font-semibold">
              Photo Uploaded!
            </p>
          </div>
        ) : (
          <>
            {/* Image preview or upload zone */}
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full aspect-square object-cover"
                  style={{
                    border: '3px solid',
                    borderColor: '#606060 #303030 #202020 #505050',
                  }}
                />
                <button
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1 bg-black/70 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square flex flex-col items-center justify-center gap-3 transition-colors"
                style={{
                  background: '#0A0A0A',
                  border: '2px dashed #3A3A3A',
                }}
              >
                <Camera className="w-12 h-12 text-gray-500" />
                <span className="text-gray-400 uppercase tracking-wide text-sm">
                  Tap to add photo
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Caption input */}
            {preview && (
              <div>
                <label
                  className="block text-xs uppercase tracking-wide text-gray-400 mb-1"
                  style={{
                    fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
                    fontStyle: 'italic',
                  }}
                >
                  Caption (optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="How are you feeling?"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-black text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                  style={{
                    border: '2px solid',
                    borderColor: '#2A2A2A #1A1A1A #1A1A1A #2A2A2A',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                className="px-3 py-2 text-sm text-red-400"
                style={{
                  background: 'rgba(255,0,0,0.1)',
                  border: '1px solid rgba(255,0,0,0.3)',
                }}
              >
                {error}
              </div>
            )}

            {/* Upload button */}
            {preview && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                loading={uploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface PhotoUploadButtonProps {
  userId: string
  onUploadComplete?: (photoUrl: string) => void
  hasUploadedThisPeriod?: boolean
  className?: string
}

export function PhotoUploadButton({
  userId,
  onUploadComplete,
  hasUploadedThisPeriod,
  className,
}: PhotoUploadButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          'relative flex items-center gap-2 px-4 py-2 transition-colors',
          hasUploadedThisPeriod
            ? 'bg-gray-800 text-gray-400'
            : 'bg-red-900/50 text-red-300 hover:bg-red-900',
          className
        )}
        style={{
          border: '2px solid',
          borderColor: hasUploadedThisPeriod
            ? '#3A3A3A #1A1A1A #1A1A1A #3A3A3A'
            : '#CC0000 #660000 #550000 #AA0000',
        }}
      >
        <Camera className="w-5 h-5" />
        <span
          className="uppercase tracking-wide text-sm"
          style={{
            fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
            fontStyle: 'italic',
          }}
        >
          {hasUploadedThisPeriod ? 'Photo Added' : 'Add Progress Photo'}
        </span>
        {!hasUploadedThisPeriod && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Modal overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="w-full max-w-md">
            <PhotoUpload
              userId={userId}
              onUploadComplete={(url) => {
                onUploadComplete?.(url)
                setShowModal(false)
              }}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
