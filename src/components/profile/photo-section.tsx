'use client'

import { useState } from 'react'
import { Camera, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PhotoUpload } from '@/components/ui/photo-upload'
import { formatRelativeTime } from '@/lib/utils'
import type { ProgressPhoto } from '@/types'

interface ProfilePhotoSectionProps {
  userId: string
  photos: ProgressPhoto[]
  hasUploadedThisPeriod: boolean
  requiresUpload: boolean
}

export function ProfilePhotoSection({
  userId,
  photos,
  hasUploadedThisPeriod,
  requiresUpload,
}: ProfilePhotoSectionProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)

  const needsUpload = requiresUpload && !hasUploadedThisPeriod

  return (
    <>
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Progress Photos
              </h3>
              {needsUpload && (
                <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
                  Required
                </span>
              )}
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
            >
              <Camera className="h-4 w-4" />
              {hasUploadedThisPeriod ? 'Add More' : 'Upload'}
            </button>
          </div>

          {photos.length > 0 ? (
            <div className="space-y-3">
              {/* Photo grid */}
              <div className="grid grid-cols-4 gap-2">
                {photos.slice(0, 4).map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square overflow-hidden relative group"
                    style={{
                      border: '2px solid',
                      borderColor: '#3A3A3A #1A1A1A #1A1A1A #3A3A3A',
                    }}
                  >
                    <img
                      src={photo.photo_url}
                      alt="Progress"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  </button>
                ))}
              </div>

              {photos.length > 4 && (
                <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                  View all {photos.length} photos
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div
              className="text-center py-6"
              style={{
                background: '#0A0A0A',
                border: '2px dashed #3A3A3A',
              }}
            >
              <Camera className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-500">No progress photos yet</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 text-sm text-brand-600 hover:text-brand-700"
              >
                Upload your first photo
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="w-full max-w-md">
            <PhotoUpload
              userId={userId}
              onUploadComplete={() => {
                setShowUploadModal(false)
                // Refresh the page to show new photo
                window.location.reload()
              }}
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      {/* Photo detail modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
            style={{
              border: '4px solid',
              borderColor: '#808080 #404040 #303030 #707070',
            }}
          >
            <img
              src={selectedPhoto.photo_url}
              alt="Progress"
              className="w-full"
            />

            <div
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)',
              }}
            >
              <p className="text-gray-400 text-sm">
                {formatRelativeTime(selectedPhoto.created_at)}
              </p>
              {selectedPhoto.caption && (
                <p className="text-white mt-1">{selectedPhoto.caption}</p>
              )}
            </div>

            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 p-2 text-white/70 hover:text-white bg-black/50"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
