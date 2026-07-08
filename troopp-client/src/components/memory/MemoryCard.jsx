import React from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../common/Avatar.jsx'

/**
 * Renders a preview card for a past trip memory wall.
 */
const MemoryCard = ({ activityId, tripName, date, coverPhoto = null, type = 'trek', members = [] }) => {
  const navigate = useNavigate()

  // Get color gradient matching activity type
  const getGradient = (tripType) => {
    switch (tripType) {
      case 'trek':
        return 'from-emerald-600 to-teal-800'
      case 'road_trip':
        return 'from-amber-500 to-orange-750'
      case 'cycling':
        return 'from-cyan-500 to-blue-700'
      default:
        return 'from-stone-600 to-stone-850'
    }
  }

  const handleCardClick = () => {
    navigate(`/memory-walls/${activityId}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-surface border border-border/80 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[180px]"
    >
      {/* Cover Image / Gradient */}
      <div className="w-full h-24 relative flex items-center justify-center overflow-hidden bg-stone-100">
        {coverPhoto ? (
          <img src={coverPhoto} alt={tripName} className="w-full h-full object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(type)} opacity-90`} />
        )}
        
        {/* Type Icon Badge overlay */}
        <span className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
          {type}
        </span>
      </div>

      {/* Details info */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-extrabold text-text-primary truncate leading-tight">
            {tripName}
          </span>
          <span className="text-[9px] text-text-secondary mt-0.5">
            {new Date(date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Members Avatars Stack (max 5) */}
        {members.length > 0 && (
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {members.slice(0, 5).map((m, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full overflow-hidden border border-white bg-stone-200 text-[8px] font-bold flex items-center justify-center text-stone-600 shadow-sm"
                title={m.name}
              >
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  m.name[0]
                )}
              </div>
            ))}
            {members.length > 5 && (
              <span className="text-[8px] font-bold text-text-secondary pl-2">
                +{members.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoryCard
export { MemoryCard }
