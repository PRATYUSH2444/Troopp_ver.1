import React from 'react'
import MemoryCard from '../memory/MemoryCard.jsx'

/**
 * Tab pane inside profile pages listing past trip memories.
 */
const MemoryWallTab = ({ trips = [] }) => {
  // Sort trips chronologically by date descending
  const sortedTrips = [...trips].sort((a, b) => new Date(b.date_time) - new Date(a.date_time))

  return (
    <div className="flex flex-col gap-4 text-text-primary">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-extrabold text-text-primary">Your Memories</h3>
        <span className="text-[10px] text-text-secondary leading-snug">
          Relive adventures and view shared photo galleries from your completed trips.
        </span>
      </div>

      {sortedTrips.length === 0 ? (
        <div className="text-center py-20 bg-stone-50/50 border border-border/80 border-dashed rounded-2xl flex flex-col items-center gap-2">
          <span className="text-2xl">📸</span>
          <h4 className="text-xs font-bold text-text-primary">Your memories will appear here</h4>
          <p className="text-[10px] text-text-secondary max-w-xs leading-relaxed">
            Once you complete your first physical weekend getaway with a Troopp group, the shared memory wall will unlock!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 mt-2">
          {sortedTrips.map((trip) => (
            <MemoryCard
              key={trip.id}
              activityId={trip.id}
              tripName={trip.title}
              date={trip.date_time}
              coverPhoto={trip.cover_photo_url}
              type={trip.type || 'trek'}
              members={trip.Members || []}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MemoryWallTab
export { MemoryWallTab }
