'use client'

import { useState } from 'react'
import { Camera, AlertTriangle, X } from 'lucide-react'
import { PhotoUpload } from './photo-upload'
import { cn } from '@/lib/utils'

interface UploadRequiredBannerProps {
  userId: string
  groupNames: string[]
  onUploadComplete?: () => void
  className?: string
}

export function UploadRequiredBanner({
  userId,
  groupNames,
  onUploadComplete,
  className,
}: UploadRequiredBannerProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || groupNames.length === 0) {
    return null
  }

  const groupText =
    groupNames.length === 1
      ? groupNames[0]
      : groupNames.length === 2
      ? `${groupNames[0]} and ${groupNames[1]}`
      : `${groupNames[0]} and ${groupNames.length - 1} other groups`

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden',
          className
        )}
        style={{
          background: 'linear-gradient(90deg, #880000 0%, #CC0000 50%, #880000 100%)',
          border: '2px solid',
          borderColor: '#FF5050 #660000 #550000 #FF2020',
        }}
      >
        {/* Animated pulse overlay */}
        <div
          className="absolute inset-0 opacity-30 animate-pulse"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          }}
        />

        <div className="relative flex items-center justify-between p-3 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="min-w-0">
              <p
                className="text-white text-sm font-semibold uppercase tracking-wide truncate"
                style={{
                  fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
                  fontStyle: 'italic',
                  textShadow: '1px 1px 2px #000',
                }}
              >
                Progress Photo Required
              </p>
              <p className="text-red-200 text-xs truncate">
                Upload for {groupText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white transition-colors"
              style={{
                fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
                fontStyle: 'italic',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Camera className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom highlight */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        />
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="w-full max-w-md">
            <PhotoUpload
              userId={userId}
              onUploadComplete={() => {
                onUploadComplete?.()
                setShowUpload(false)
              }}
              onClose={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
