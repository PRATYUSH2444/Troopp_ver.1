import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import RatingForm from '../../components/rating/RatingForm.jsx'
import RatingThanks from '../../components/rating/RatingThanks.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { haptics } from '../../utils/haptics.js'
import { playRating } from '../../utils/sounds.js'

/**
 * Stepper wizard coordinating mutual co-traveler ratings for completed activities.
 */
const RatingPage = () => {
  const { id: activityId } = useParams()
  const navigate = useNavigate()

  // State managers
  const [step, setStep] = useState(1) // 1: rating form, 2: success thanks
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [activity, setActivity] = useState(null)
  
  // Timer bounds
  const [timeLeftText, setTimeLeftText] = useState('')

  useEffect(() => {
    const fetchRateableDetails = async () => {
      try {
        // Mock fetch rateable members: axios.get(`/api/v1/ratings/${activityId}/members`)
        await new Promise((r) => setTimeout(r, 500))

        setActivity({
          id: activityId,
          title: 'Harishchandragad Monsoon Trek & Night Camping',
          date_time: '2026-07-15T06:00:00Z'
        })

        setMembers([
          {
            userId: 'user-2',
            name: 'Priya Sharma',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
          },
          {
            userId: 'user-3',
            name: 'Vikram Malhotra',
            avatarUrl: null
          }
        ])
      } catch (err) {
        console.error('Failed retrieving rateable members list:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRateableDetails()
  }, [activityId])

  // 48-Hour timer tick-down
  useEffect(() => {
    if (!activity) return

    const updateTimer = () => {
      const tripTime = new Date(activity.date_time).getTime()
      const windowExpiry = tripTime + 48 * 60 * 60 * 1000
      const diff = windowExpiry - Date.now()

      if (diff <= 0) {
        setTimeLeftText('Expired')
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeftText(`${hours}h ${minutes}m left to submit`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [activity])

  const handleSubmitRatings = async (ratingsArray) => {
    setLoading(true)
    try {
      // Mock dispatch submission: axios.post(`/api/v1/ratings/${activityId}`, { ratings: ratingsArray })
      await new Promise((r) => setTimeout(r, 600))
      haptics.ratingSubmit()
      playRating()
      setStep(2)
    } catch (err) {
      console.error('Failed submitting traveler ratings:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-20 px-4">
      {/* Header title */}
      {step === 1 && (
        <div className="flex flex-col gap-1 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
              Mutual Feedback
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md">
              🕒 {timeLeftText}
            </span>
          </div>
          <h2 className="text-sm font-extrabold text-text-primary leading-tight">
            Rate your co-travelers from: <span className="text-primary">{activity?.title}</span>
          </h2>
        </div>
      )}

      {/* Main steppers switcher */}
      <div className="flex-1">
        {step === 1 ? (
          <RatingForm members={members} onSubmit={handleSubmitRatings} />
        ) : (
          <RatingThanks />
        )}
      </div>
    </div>
  )
}

export default RatingPage
export { RatingPage }
