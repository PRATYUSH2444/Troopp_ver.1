import React from 'react'
import clsx from 'clsx'

/**
 * Common Shimmer Block.
 */
export const LineBlock = ({ className, height = 'h-4', width = 'w-full', rounded = 'rounded-md' }) => {
  return (
    <div
      className={clsx(
        'shimmer-bg relative overflow-hidden',
        height,
        width,
        rounded,
        className
      )}
    />
  )
}

/**
 * Avatar Circular Shimmer.
 */
export const AvatarSkeleton = ({ size = 'md', className }) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    xxl: 'w-[120px] h-[120px]'
  }

  return (
    <div
      className={clsx(
        'shimmer-bg rounded-full',
        sizeClasses[size],
        className
      )}
    />
  )
}

/**
 * Premium ActivityCard wireframe loader.
 * Matches the layout of ActivityCard: cover image (16:9), creator strip, title (2 lines), tags/meta, and slot progress bar.
 */
export const CardSkeleton = () => {
  return (
    <div className="bg-[#1a2129] border border-[rgba(255,255,255,0.08)] rounded-3xl shadow-lg overflow-hidden flex flex-col p-4 gap-3.5 w-full">
      {/* 1. Cover Image Placeholder */}
      <LineBlock height="h-44" width="w-full" rounded="rounded-2xl" />

      {/* 2. Creator Strip */}
      <div className="flex items-center gap-2">
        <AvatarSkeleton size="sm" />
        <div className="flex flex-col gap-1 flex-1">
          <LineBlock height="h-2.5" width="w-1/3" />
          <LineBlock height="h-2" width="w-1/4" />
        </div>
        <LineBlock height="h-4.5" width="w-14" rounded="rounded-full" />
      </div>

      {/* 3. Title (two lines) */}
      <div className="flex flex-col gap-1.5 mt-1">
        <LineBlock height="h-3.5" width="w-11/12" />
        <LineBlock height="h-3.5" width="w-3/4" />
      </div>

      {/* 4. Details metadata */}
      <div className="flex gap-4 items-center">
        <LineBlock height="h-3" width="w-14" />
        <LineBlock height="h-3" width="w-24" />
        <LineBlock height="h-3" width="w-16" />
      </div>

      {/* 5. Slot progress bar */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex justify-between items-center">
          <LineBlock height="h-2.5" width="w-1/4" />
          <LineBlock height="h-2.5" width="w-10" />
        </div>
        <LineBlock height="h-2" width="w-full" rounded="rounded-full" />
      </div>
    </div>
  )
}

/**
 * Feed Skeleton.
 * Shows 3 ActivityCard skeletons in a grid/list.
 */
export const FeedSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

/**
 * Profile Skeleton.
 * Renders avatar circle, name bar, badge pill, stats row of 3 bars, and tab headers.
 */
export const ProfileSkeleton = () => {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 w-full px-4 py-8">
      {/* Top Header Card */}
      <div className="bg-[#1a2129] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden shadow-lg">
        <AvatarSkeleton size="xl" />
        <div className="flex-1 flex flex-col items-center sm:items-start gap-2">
          <LineBlock height="h-6" width="w-48" />
          <LineBlock height="h-3" width="w-24" />
          <LineBlock height="h-3" width="w-3/4" className="mt-1" />
        </div>
      </div>

      {/* Verification status pill banner */}
      <div className="bg-[#1a2129] border border-[rgba(255,255,255,0.08)] rounded-3xl p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3 flex-1">
          <AvatarSkeleton size="xs" />
          <div className="flex flex-col gap-1 flex-1">
            <LineBlock height="h-3" width="w-32" />
            <LineBlock height="h-2.5" width="w-64" />
          </div>
        </div>
      </div>

      {/* Stats row of 3 bars */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a2129] border border-[rgba(255,255,255,0.08)] rounded-3xl p-4 flex flex-col items-center gap-2 shadow-lg">
            <LineBlock height="h-5" width="w-12" />
            <LineBlock height="h-2.5" width="w-16" />
          </div>
        ))}
      </div>

      {/* Tab bar header */}
      <div className="bg-[#1a2129] border border-[rgba(255,255,255,0.08)] rounded-2xl p-1.5 flex gap-2 w-full shadow-lg">
        <LineBlock height="h-8" width="w-1/2" rounded="rounded-xl" />
        <LineBlock height="h-8" width="w-1/2" rounded="rounded-xl" />
      </div>
    </div>
  )
}

/**
 * Trust Card Skeleton.
 * Large avatar circle, two name bars, circular score outline, and 4 detail stats rows.
 */
export const TrustCardSkeleton = () => {
  return (
    <div className="bg-[#1a2129] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 flex flex-col items-center gap-6 w-full max-w-sm mx-auto shadow-lg">
      {/* Large circle avatar */}
      <AvatarSkeleton size="xl" />
      
      {/* Two name bars */}
      <div className="flex flex-col items-center gap-2 w-full">
        <LineBlock height="h-5" width="w-32" />
        <LineBlock height="h-3.5" width="w-20" />
      </div>

      {/* Circular score indicator outline */}
      <div className="relative w-28 h-28 flex items-center justify-center border-4 border-[rgba(255,255,255,0.08)] rounded-full my-1">
        <div className="flex flex-col items-center gap-1.5">
          <LineBlock height="h-4" width="w-8" />
          <LineBlock height="h-2.5" width="w-10" />
        </div>
      </div>

      {/* 4 stats rows */}
      <div className="flex flex-col gap-3 w-full border-t border-[rgba(255,255,255,0.08)] pt-4 mt-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <LineBlock height="h-3" width="w-24" />
            <LineBlock height="h-3" width="w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Realistic alternating chat log load simulator.
 * Animates left/right bubble shapes of varying block widths for high realism.
 */
export const ChatSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full bg-stone-50/10">
      {/* Left bubble */}
      <div className="flex items-start gap-2.5 max-w-[75%]">
        <AvatarSkeleton size="sm" />
        <div className="flex flex-col gap-1 bg-stone-105 border border-stone-200/50 rounded-2xl rounded-tl-none p-3 w-48 shadow-sm">
          <LineBlock height="h-2" width="w-1/2" />
          <LineBlock height="h-3.5" width="w-full" className="mt-1" />
        </div>
      </div>

      {/* Right bubble */}
      <div className="flex items-start gap-2.5 max-w-[75%] self-end">
        <div className="flex flex-col gap-1 bg-stone-900/5 border border-stone-900/10 rounded-2xl rounded-tr-none p-3 w-56 shadow-sm">
          <LineBlock height="h-3.5" width="w-full" />
          <LineBlock height="h-3" width="w-4/5" className="mt-1" />
        </div>
        <AvatarSkeleton size="sm" />
      </div>

      {/* Left bubble (short) */}
      <div className="flex items-start gap-2.5 max-w-[75%]">
        <AvatarSkeleton size="sm" />
        <div className="flex flex-col gap-1 bg-stone-105 border border-stone-200/50 rounded-2xl rounded-tl-none p-3 w-32 shadow-sm">
          <LineBlock height="h-3.5" width="w-full" />
        </div>
      </div>

      {/* Right bubble (medium) */}
      <div className="flex items-start gap-2.5 max-w-[75%] self-end">
        <div className="flex flex-col gap-1 bg-stone-900/5 border border-stone-900/10 rounded-2xl rounded-tr-none p-3 w-40 shadow-sm">
          <LineBlock height="h-3.5" width="w-5/6" />
          <LineBlock height="h-2.5" width="w-2/3" className="mt-1" />
        </div>
        <AvatarSkeleton size="sm" />
      </div>

      {/* Left bubble (long) */}
      <div className="flex items-start gap-2.5 max-w-[75%]">
        <AvatarSkeleton size="sm" />
        <div className="flex flex-col gap-1 bg-stone-105 border border-stone-200/50 rounded-2xl rounded-tl-none p-3 w-64 shadow-sm">
          <LineBlock height="h-2.5" width="w-1/3" />
          <LineBlock height="h-3.5" width="w-full" className="mt-1" />
          <LineBlock height="h-3.5" width="w-4/5" className="mt-1" />
        </div>
      </div>
    </div>
  )
}
