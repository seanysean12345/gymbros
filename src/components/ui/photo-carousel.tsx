'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import type { ProgressPhoto, Profile } from '@/types'

interface PhotoWithProfile extends ProgressPhoto {
  profile: Profile
}

interface PhotoCarouselProps {
  photos: PhotoWithProfile[]
  className?: string
  onPhotoClick?: (photo: PhotoWithProfile) => void
}

export function PhotoCarousel({
  photos,
  className,
  onPhotoClick,
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Reset to first photo when photos change
  useEffect(() => {
    setActiveIndex(0)
  }, [photos.length])

  if (photos.length === 0) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{
          background: 'linear-gradient(180deg, #0A0A0A 0%, #050505 100%)',
          borderBottom: '3px solid',
          borderColor: '#3A3A3A',
        }}
      >
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm uppercase tracking-wide">No progress photos yet</p>
            <p className="text-xs text-gray-600 mt-1">Be the first to share!</p>
          </div>
        </div>
      </div>
    )
  }

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length)
  }

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  // Touch/mouse handlers for swipe
  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    const diff = startX - clientX
    setScrollLeft(diff)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (scrollLeft > 50) {
      goToNext()
    } else if (scrollLeft < -50) {
      goToPrev()
    }
    setScrollLeft(0)
  }

  const getCardStyle = (index: number) => {
    const diff = index - activeIndex
    const absDiff = Math.abs(diff)

    // Base transforms
    let translateX = diff * 120 // Spacing between cards
    let translateZ = -absDiff * 100 // Depth
    let rotateY = diff * -35 // Rotation angle
    let scale = 1 - absDiff * 0.15 // Scale reduction
    let opacity = 1 - absDiff * 0.3

    // Clamp values
    if (absDiff > 2) {
      opacity = 0
    }
    scale = Math.max(0.7, scale)

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex: 10 - absDiff,
    }
  }

  return (
    <div
      className={cn('relative overflow-hidden select-none', className)}
      style={{
        background: 'linear-gradient(180deg, #0A0A0A 0%, #050505 100%)',
        borderBottom: '3px solid',
        borderColor: '#3A3A3A',
      }}
    >
      {/* Chrome accent at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-20"
        style={{
          background: 'linear-gradient(90deg, #606060, #A0A0A0, #606060)',
        }}
      />

      {/* Cover Flow Container */}
      <div
        ref={containerRef}
        className="relative h-72 flex items-center justify-center"
        style={{ perspective: '1000px' }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        {/* Cards */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="absolute cursor-pointer transition-all duration-300 ease-out"
              style={getCardStyle(index)}
              onClick={() => {
                if (index === activeIndex) {
                  onPhotoClick?.(photo)
                } else {
                  setActiveIndex(index)
                }
              }}
            >
              <div
                className="relative w-48 h-48 overflow-hidden"
                style={{
                  border: '4px solid',
                  borderColor: '#808080 #404040 #303030 #707070',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                }}
              >
                {/* Photo */}
                <img
                  src={photo.photo_url}
                  alt={photo.profile?.display_name || 'Progress photo'}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Reflection effect */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  }}
                />

                {/* User info overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                  }}
                >
                  <p
                    className="text-white text-xs truncate"
                    style={{
                      fontFamily:
                        'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
                      fontStyle: 'italic',
                      textShadow: '1px 1px 2px #000',
                    }}
                  >
                    {photo.profile?.display_name || photo.profile?.username || 'Unknown'}
                  </p>
                  <p className="text-gray-400 text-[10px]">
                    {formatRelativeTime(photo.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
          {photos.slice(0, Math.min(photos.length, 10)).map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'w-2 h-2 transition-all',
                index === activeIndex
                  ? 'bg-red-500 scale-125'
                  : 'bg-gray-600 hover:bg-gray-500'
              )}
            />
          ))}
          {photos.length > 10 && (
            <span className="text-gray-500 text-xs ml-1">+{photos.length - 10}</span>
          )}
        </div>
      )}
    </div>
  )
}

interface PhotoModalProps {
  photo: PhotoWithProfile
  onClose: () => void
}

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onClick={onClose}
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
          src={photo.photo_url}
          alt={photo.profile?.display_name || 'Progress photo'}
          className="w-full"
        />

        {/* Info overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 flex items-center justify-center text-white font-bold"
              style={{
                background: 'linear-gradient(180deg, #CC0000 0%, #880000 100%)',
                border: '2px solid #FF0000',
              }}
            >
              {(photo.profile?.display_name || photo.profile?.username || '?')[0].toUpperCase()}
            </div>

            <div>
              <p
                className="text-white"
                style={{
                  fontFamily:
                    'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
                  fontStyle: 'italic',
                }}
              >
                {photo.profile?.display_name || photo.profile?.username}
              </p>
              <p className="text-gray-400 text-sm">
                {formatRelativeTime(photo.created_at)}
              </p>
            </div>
          </div>

          {photo.caption && (
            <p className="text-gray-300 mt-3 text-sm">{photo.caption}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-white/70 hover:text-white bg-black/50"
        >
          <ChevronLeft className="w-6 h-6 rotate-45" />
        </button>
      </div>
    </div>
  )
}
