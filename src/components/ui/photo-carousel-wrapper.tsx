'use client'

import { useState } from 'react'
import { PhotoCarousel, PhotoModal } from './photo-carousel'
import type { ProgressPhoto, Profile } from '@/types'

interface PhotoWithProfile extends ProgressPhoto {
  profile: Profile
}

interface PhotoCarouselWrapperProps {
  photos: PhotoWithProfile[]
  className?: string
}

export function PhotoCarouselWrapper({ photos, className }: PhotoCarouselWrapperProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithProfile | null>(null)

  return (
    <>
      <PhotoCarousel
        photos={photos}
        className={className}
        onPhotoClick={setSelectedPhoto}
      />
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  )
}
