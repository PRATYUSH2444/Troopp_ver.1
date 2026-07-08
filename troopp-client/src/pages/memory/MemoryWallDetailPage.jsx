import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../../components/common/Avatar.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import { apiRequest } from '../../utils/api.js'
import confetti from 'canvas-confetti'

/**
 * Detailed Memory Wall page displaying shared trip photos.
 */
const MemoryWallDetailPage = () => {
  const { id: activityId } = useParams()
  
  // Data State
  const [loading, setLoading] = useState(true)
  const [wallData, setWallData] = useState(null)
  const [photos, setPhotos] = useState([])
  const [members, setMembers] = useState([])
  const [isWithinWindow, setIsWithinWindow] = useState(false)
  
  // Upload State
  const [uploadQueue, setUploadQueue] = useState([]) // [ { name, progress, error } ]
  
  // Lightbox State
  const [activePhotoIndex, setActivePhotoIndex] = useState(null)

  const [milestone, setMilestone] = useState(null)
  
  useEffect(() => {
    const checkMilestones = async () => {
      try {
        const res = await apiRequest('/profiles/me')
        if (res.ok) {
          const json = await res.json()
          const tripsCount = json.data?.profile?.trips_completed || 0
          
          const allowedMilestones = [1, 5, 10, 25]
          if (allowedMilestones.includes(tripsCount)) {
            const key = `troopp_milestone_celebrated_${tripsCount}`
            const alreadyCelebrated = localStorage.getItem(key)
            if (!alreadyCelebrated) {
              setMilestone(tripsCount)
              setTimeout(() => {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.2 }
                })
              }, 300)
            }
          }
        }
      } catch (err) {
        console.error('Milestones check failed:', err)
      }
    }
    checkMilestones()
  }, [])

  useEffect(() => {
    const fetchMemoryWallDetails = async () => {
      try {
        // Mock fetch details: axios.get(`/api/v1/memory-walls/${activityId}`)
        await new Promise((r) => setTimeout(r, 600)) // Latency

        const mockWall = {
          activity: {
            title: 'Harishchandragad Monsoon Trek & Night Camping',
            date_time: '2026-07-15T06:00:00Z',
            destination: 'Bhandardara, Maharashtra'
          },
          photos: [
            {
              id: 'photo-1',
              url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80',
              caption: 'Summit sunrise view',
              uploader: { name: 'Priya Sharma' }
            },
            {
              id: 'photo-2',
              url: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=800&q=80',
              caption: 'Crossing the water stream crossing',
              uploader: { name: 'Raj Malhotra' }
            },
            {
              id: 'photo-3',
              url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
              caption: 'Morning tent breakfast tea',
              uploader: { name: 'Vikram Malhotra' }
            }
          ]
        }

        setWallData(mockWall)
        setPhotos(mockWall.photos)
        
        setMembers([
          { userId: 'user-1', name: 'Raj Malhotra', avatarUrl: null, trustScore: 80 },
          { userId: 'user-2', name: 'Priya Sharma', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', trustScore: 72 },
          { userId: 'user-3', name: 'Vikram Malhotra', avatarUrl: null, trustScore: 55 }
        ])

        // Verify window constraint: trip completed and within 48 hours
        const tripTime = new Date(mockWall.activity.date_time).getTime()
        const windowExpiry = tripTime + 48 * 60 * 60 * 1000
        // For local development simulation, we'll allow uploading
        setIsWithinWindow(true)
      } catch (err) {
        console.error('Failed retrieving memory wall details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMemoryWallDetails()
  }, [activityId])

  // Dropzone config hooks
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024, // 5MB cap
    onDrop: async (acceptedFiles) => {
      // Simulate file upload with incremental progress
      const queueList = acceptedFiles.map((file) => ({
        name: file.name,
        progress: 0,
        error: null
      }))
      setUploadQueue((prev) => [...prev, ...queueList])

      acceptedFiles.forEach((file, idx) => {
        let currentProgress = 0
        const interval = setInterval(async () => {
          currentProgress += 20
          
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.name === file.name ? { ...item, progress: currentProgress } : item
            )
          )

          if (currentProgress >= 100) {
            clearInterval(interval)
            
            // Add uploaded photo directly to list view
            const mockNewUrl = URL.createObjectURL(file)
            const newPhotoObj = {
              id: `photo-new-${Date.now()}-${idx}`,
              url: mockNewUrl,
              caption: file.name.split('.')[0] || 'New Memory',
              uploader: { name: 'You' }
            }

            setPhotos((prev) => [newPhotoObj, ...prev])
            
            // Clear queue item after delay
            setTimeout(() => {
              setUploadQueue((prev) => prev.filter((item) => item.name !== file.name))
            }, 2000)
          }
        }, 300)
      })
    }
  })

  // Lightbox controls
  const handlePrev = () => {
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNext = () => {
    setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const coverHeroPhoto = photos[0]?.url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'

  const milestoneTexts = {
    1: { title: "First Trip!", desc: "You went on your first trip! 🎉", style: "from-orange-500 to-rose-500" },
    5: { title: "Explorer!", desc: "You are now an Explorer! 🥾", style: "from-blue-500 to-indigo-500" },
    10: { title: "Seasoned Traveler!", desc: "You are now a Seasoned Traveler! ✈️", style: "from-emerald-500 to-teal-500" },
    25: { title: "Troopp Legend!", desc: "You are now a Troopp Legend! 👑", style: "from-amber-500 to-yellow-600" }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 pb-20 relative">
      {/* Sliding Milestone Banner */}
      <AnimatePresence>
        {milestone && milestoneTexts[milestone] && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className={`w-full p-4 text-white relative shadow-lg overflow-hidden flex flex-col items-center justify-center text-center gap-1 bg-gradient-to-r rounded-2xl ${milestoneTexts[milestone].style}`}
          >
            <button
              onClick={() => {
                localStorage.setItem(`troopp_milestone_celebrated_${milestone}`, 'true')
                setMilestone(null)
              }}
              className="absolute top-3 right-4 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center font-bold text-xs select-none"
            >
              ✕
            </button>
            <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
              Achievement Unlocked: {milestoneTexts[milestone].title}
            </span>
            <h3 className="font-heading font-black text-sm leading-snug">
              {milestoneTexts[milestone].desc}
            </h3>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Back navigation header */}
      <div className="flex items-center gap-3 px-4 mt-4">
        <Link
          to="/profile/me"
          className="w-10 h-10 border border-border rounded-xl hover:bg-stone-50 flex items-center justify-center text-xs font-bold"
        >
          ←
        </Link>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Memory Wall</span>
          <h2 className="text-sm font-extrabold text-text-primary truncate max-w-[280px]">
            {wallData?.activity.title}
          </h2>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="w-full h-48 relative overflow-hidden rounded-2xl shadow-inner mx-4 max-w-[calc(105%-2rem)]">
        <img src={coverHeroPhoto} alt="" className="w-full h-full object-cover filter brightness-[0.7]" />
        <div className="absolute inset-x-4 bottom-4 z-10 flex flex-col text-white">
          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Completed Adventure</span>
          <h3 className="text-sm font-extrabold leading-tight mt-0.5">{wallData?.activity.title}</h3>
          <span className="text-[10px] text-stone-200 mt-1">📍 Destination: {wallData?.activity.destination}</span>
        </div>
      </div>

      {/* Confirmed travelers rails scroll */}
      <div className="flex flex-col gap-2 px-4">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Travelers on this Trip
        </span>
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-thin">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-2 flex-shrink-0 bg-stone-50 border border-border/80 px-3 py-1.5 rounded-full">
              <Avatar src={m.avatarUrl} name={m.name} size="sm" score={m.trustScore} />
              <span className="text-[10px] font-bold text-text-primary">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drag & Drop Photo Uploader Section */}
      {isWithinWindow && (
        <div className="flex flex-col gap-2.5 px-4">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Share your photos (48hr window open)
          </span>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-primary bg-stone-50/50' : 'border-border hover:border-text-secondary/30 bg-surface'
            }`}
          >
            <input {...getInputProps()} />
            <span className="text-2xl block mb-1">📸</span>
            <span className="text-xs font-bold text-text-primary">Drag & drop or tap to select photos</span>
            <p className="text-[9px] text-text-secondary mt-1">Up to 10 files max · 5MB limit each · JPG/PNG formats</p>
          </div>

          {/* Uploading progresses list */}
          {uploadQueue.length > 0 && (
            <div className="flex flex-col gap-2 bg-stone-50 p-3.5 rounded-xl border border-border/80 text-[10px]">
              {uploadQueue.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-text-secondary font-semibold">
                    <span className="truncate max-w-[80%]">{item.name}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shared Photos grid layout */}
      <div className="flex flex-col gap-2.5 px-4">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Shared Memories ({photos.length})
        </span>

        {photos.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border/80 rounded-2xl flex flex-col items-center gap-2">
            <span className="text-2xl">🖼️</span>
            <h4 className="text-xs font-bold text-text-primary">No photos shared yet</h4>
            <p className="text-[10px] text-text-secondary">Be the first to share pictures from your weekend trip!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setActivePhotoIndex(index)}
                className="bg-stone-50 border border-border/60 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all group flex flex-col"
              >
                <div className="w-full h-32 overflow-hidden bg-stone-100 relative">
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5 flex flex-col">
                  <span className="text-[10px] font-bold text-text-primary truncate">{item.caption}</span>
                  <span className="text-[8px] text-text-secondary mt-0.5">Uploaded by {item.uploader?.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox full-screen viewer overlay */}
      <AnimatePresence>
        {activePhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/95 z-[9999] flex flex-col justify-between p-4"
          >
            {/* Header close and download triggers */}
            <div className="flex justify-between items-center text-white pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-stone-200">
                Photo {activePhotoIndex + 1} of {photos.length}
              </span>
              <div className="flex items-center gap-4">
                <a
                  href={photos[activePhotoIndex].url}
                  download={`troopp-memory-${activePhotoIndex + 1}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white text-xs"
                  title="Download photo"
                >
                  ⇩
                </a>
                <button
                  onClick={() => setActivePhotoIndex(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Slider viewport */}
            <div className="flex-grow flex items-center justify-between gap-4 relative">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-extrabold text-white text-xs z-10"
              >
                ◀
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center p-2">
                <img
                  src={photos[activePhotoIndex].url}
                  alt={photos[activePhotoIndex].caption}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              </div>

              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-extrabold text-white text-xs z-10"
              >
                ▶
              </button>
            </div>

            {/* Caption info */}
            <div className="text-center text-white pb-6">
              <span className="block text-xs font-extrabold">{photos[activePhotoIndex].caption}</span>
              <span className="text-[9px] text-stone-300 mt-1 block">
                Uploaded by {photos[activePhotoIndex].uploader?.name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MemoryWallDetailPage
export { MemoryWallDetailPage }
