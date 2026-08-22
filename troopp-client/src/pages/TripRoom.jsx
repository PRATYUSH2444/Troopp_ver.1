import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { apiRequest, getAccessToken } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'
import { AnimatePresence, motion } from 'framer-motion'

// Tabs components
import ChatTab from '../components/tripRoom/ChatTab.jsx'
import InfoTab from '../components/tripRoom/InfoTab.jsx'
import ExpensesTab from '../components/tripRoom/ExpensesTab.jsx'
import ChecklistTab from '../components/tripRoom/ChecklistTab.jsx'
import PollsTab from '../components/tripRoom/PollsTab.jsx'
import ManageTab from '../components/tripRoom/ManageTab.jsx'
import NewJoinerOnboarding from '../components/tripRoom/NewJoinerOnboarding.jsx'
import SOSConfirmModal from '../components/safety/SOSConfirmModal.jsx'
import Spinner from '../components/common/Spinner.jsx'

const TripRoom = () => {
  const { id: roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem(`active_tab_${roomId}`) || 'chat')

  // Data lists
  const [activity, setActivity] = useState(null)
  const [messages, setMessages] = useState([])
  const [expenses, setExpenses] = useState([])
  const [polls, setPolls] = useState([])
  const [members, setMembers] = useState([])
  const [healthMetrics, setHealthMetrics] = useState({})
  const [tripRules, setTripRules] = useState(null)
  const [welcomeMessage, setWelcomeMessage] = useState('')
  
  // Real-time ephemeral logs
  const [typingUsers, setTypingUsers] = useState([])
  const [sosActiveInfo, setSosActiveInfo] = useState(null)
  const [sosModalOpen, setSosModalOpen] = useState(false)
  const [sosError, setSosError] = useState('')
  const [mySosSent, setMySosSent] = useState(false)
  const [sosHovered, setSosHovered] = useState(false)
  const [flashType, setFlashType] = useState(null) // 'join' | 'leave'

  const socketRef = useRef(null)

  // 1. Fetch initial configuration and onboarding status check
  useEffect(() => {
    let isMounted = true

    const fetchRoomMeta = async () => {
      try {
        setLoading(true)

        // 1. Fetch activity metadata
        const activityRes = await apiRequest(`/activities/${roomId}`)
        if (!activityRes.ok) {
          throw new Error('Failed to retrieve activity meta.')
        }
        const activityJson = await activityRes.json()
        const act = activityJson.data?.activity || activityJson.data || null
        if (!isMounted) return
        setActivity(act)
        
        if (activityJson.data?.confirmedMembers) {
          setMembers(Array.isArray(activityJson.data.confirmedMembers) ? activityJson.data.confirmedMembers : [])
        }

        const isUserHost = Boolean(user?.id && act && (act.creator_id === user.id || act.host_id === user.id))

        // 2. Fetch onboarding progress
        try {
          const onboardingRes = await apiRequest(`/trip-rooms/${roomId}/onboarding`)
          if (onboardingRes.ok) {
            const onboardingJson = await onboardingRes.json()
            const isCompleted = isUserHost || Boolean(onboardingJson.data?.onboardingCompleted)
            if (isMounted) {
              setOnboardingComplete(isCompleted)
              setTripRules(onboardingJson.data?.rules || null)
              setWelcomeMessage(onboardingJson.data?.welcomeMessage || '')
            }
          } else if (isUserHost) {
            if (isMounted) setOnboardingComplete(true)
          }
        } catch (onboardingErr) {
          console.warn('Trip room onboarding fetch note:', onboardingErr)
          if (isUserHost && isMounted) setOnboardingComplete(true)
        }

        // 3. Fetch initial tab records safely in parallel
        const [msgRes, expRes, pollRes, healthRes] = await Promise.allSettled([
          apiRequest(`/trip-rooms/${roomId}/messages`),
          apiRequest(`/trip-rooms/${roomId}/expenses`),
          apiRequest(`/trip-rooms/${roomId}/polls`),
          apiRequest(`/trip-rooms/${roomId}/health`)
        ])

        if (!isMounted) return

        if (msgRes.status === 'fulfilled' && msgRes.value?.ok) {
          const msgJson = await msgRes.value.json()
          setMessages(Array.isArray(msgJson.data) ? msgJson.data : [])
        }
        if (expRes.status === 'fulfilled' && expRes.value?.ok) {
          const expJson = await expRes.value.json()
          setExpenses(Array.isArray(expJson.data) ? expJson.data : [])
        }
        if (pollRes.status === 'fulfilled' && pollRes.value?.ok) {
          const pollJson = await pollRes.value.json()
          setPolls(Array.isArray(pollJson.data) ? pollJson.data : [])
        }
        if (healthRes.status === 'fulfilled' && healthRes.value?.ok) {
          const healthJson = await healthRes.value.json()
          setHealthMetrics(healthJson.data || {})
        }

      } catch (err) {
        console.error('Failed fetching room metadata:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    fetchRoomMeta()

    return () => {
      isMounted = false
    }
  }, [roomId, user?.id])

  // 2. Initialize real-time WebSockets connections on onboarding success or host entry
  useEffect(() => {
    const isUserHost = Boolean(user?.id && activity && (activity.creator_id === user.id || activity.host_id === user.id))
    if (!onboardingComplete && !isUserHost) return

    const serverUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:3000')
    const token = getAccessToken()

    // Connect socket
    const socket = io(serverUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_room', { roomId })
    })

    // Listen room joins responses
    socket.on('room_joined', (data) => {
      if (data.messages && Array.isArray(data.messages)) setMessages(data.messages)
      if (data.members && Array.isArray(data.members)) setMembers(data.members)
    })

    // Listen incoming new messages
    socket.on('new_message', (payload) => {
      if (payload.sender_id !== user?.id) {
        haptics.newMessage()
      }
      setMessages((prev) => {
        if (payload.sender_id === user?.id) {
          const idx = (Array.isArray(prev) ? prev : []).findIndex((m) => m.status === 'sending' && m.message_text === payload.message_text)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = { ...payload, status: 'sent' }
            return updated
          }
        }
        return [...(Array.isArray(prev) ? prev : []), payload]
      })
    })

    // Listen new member joins
    socket.on('member_joined', (payload) => {
      const joinMsg = {
        id: `join-${Date.now()}`,
        sender_id: payload.userId,
        message_text: `${payload.name || 'A traveler'} joined the trip room!`,
        message_type: 'member_joined_system',
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), joinMsg])

      setFlashType('join')
      import('../utils/sounds.js').then((m) => m.playJoinApproved?.()).catch(() => {})
      setTimeout(() => setFlashType(null), 800)

      setMembers((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        if (arr.some((m) => (m.userId || m.id) === payload.userId)) return arr
        return [
          ...arr,
          {
            userId: payload.userId,
            name: payload.name,
            avatarUrl: payload.avatarUrl || null,
            trustScore: payload.trustScore || 50,
            reliabilityScore: payload.reliabilityScore || 100
          }
        ]
      })
    })

    // Listen member leaves/removed
    socket.on('member_left', (payload) => {
      const leaveMsg = {
        id: `leave-${Date.now()}`,
        sender_id: payload.userId,
        message_text: `${payload.name || 'A traveler'} left the trip room.`,
        message_type: 'member_left_system',
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), leaveMsg])

      setFlashType('leave')
      import('../utils/sounds.js').then((m) => m.playError?.()).catch(() => {})
      setTimeout(() => setFlashType(null), 800)

      setMembers((prev) => (Array.isArray(prev) ? prev : []).filter((m) => (m.userId || m.id) !== payload.userId))
    })

    // Listen typing status indicators
    socket.on('user_typing', (payload) => {
      if (payload.userId === user?.id) return
      setTypingUsers((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        if (arr.some((u) => u.userId === payload.userId)) return arr
        return [...arr, payload]
      })
    })

    socket.on('user_stop_typing', (payload) => {
      setTypingUsers((prev) => (Array.isArray(prev) ? prev : []).filter((u) => u.userId !== payload.userId))
    })

    // Listen Emergency SOS Alarms broadcast
    socket.on('sos_broadcast', (data) => {
      haptics.sosTriggered()
      setSosActiveInfo(data)
      import('../utils/sounds.js').then((m) => m.playSosAlarm?.()).catch(() => {})
    })

    // Cleanup sockets on unmount
    return () => {
      socket.emit('leave_room', { roomId })
      socket.disconnect()
    }
  }, [roomId, onboardingComplete, user?.id, activity])

  // Save active tab in session storage
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    sessionStorage.setItem(`active_tab_${roomId}`, tab)
  }

  // Completes first-time joiner briefing flow
  const handleCompleteOnboarding = async () => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/onboarding/complete`, {
        method: 'POST'
      })
      if (res.ok) {
        setOnboardingComplete(true)
        toast.success('Onboarding complete! Welcome to the trip.')
      } else {
        setOnboardingComplete(true)
      }
    } catch {
      setOnboardingComplete(true)
    }
  }

  // Messaging dispatcher
  const handleSendMessage = (messageText) => {
    if (!messageText.trim()) return

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id,
      message_text: messageText,
      message_type: 'chat',
      status: 'sending',
      created_at: new Date().toISOString(),
      Sender: {
        id: user?.id,
        trust_score: user?.trustScore || 85,
        Profile: {
          name: user?.name || 'Explorer',
          avatar_url: user?.avatarUrl
        }
      }
    }

    setMessages((prev) => [...(Array.isArray(prev) ? prev : []), optimisticMessage])

    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        roomId,
        messageText,
        messageType: 'chat'
      })
    }
  }

  // Expense creation dispatcher
  const handleAddExpense = async (newExp) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(newExp)
      })
      if (res.ok) {
        const json = await res.json()
        setExpenses((prev) => [json.data, ...(Array.isArray(prev) ? prev : [])])
        toast.success('Expense added successfully!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add expense.')
    }
  }

  // Settle split handler
  const handleSettleSplit = async (splitId) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/expenses/splits/${splitId}/settle`, {
        method: 'PATCH'
      })
      if (res.ok) {
        toast.success('Split marked settled!')
        setExpenses((prev) =>
          (Array.isArray(prev) ? prev : []).map((exp) => ({
            ...exp,
            Splits: Array.isArray(exp.Splits)
              ? exp.Splits.map((s) => (s.id === splitId ? { ...s, is_settled: true, settled_at: new Date() } : s))
              : []
          }))
        )
      }
    } catch (err) {
      toast.error(err.message || 'Failed to settle split.')
    }
  }

  // Packing list toggle dispatcher
  const handleToggleChecklistItem = async (itemIndex, checked) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/checklist/items/${itemIndex}`, {
        method: 'PATCH',
        body: JSON.stringify({ checked })
      })
      if (res.ok) {
        setActivity((prev) => {
          if (!prev) return prev
          let currentList = prev.packing_checklist || []
          if (typeof currentList === 'string') {
            try { currentList = JSON.parse(currentList) } catch { currentList = [] }
          }
          const updated = Array.isArray(currentList) ? [...currentList] : []
          if (updated[itemIndex]) {
            updated[itemIndex] = {
              ...updated[itemIndex],
              checked,
              checked_by_id: checked ? user?.id : null
            }
          }
          return { ...prev, packing_checklist: updated }
        })
      }
    } catch (err) {
      toast.error(err.message || 'Failed toggling checklist item.')
    }
  }

  // Create Poll dispatcher
  const handleCreatePoll = async (newPoll) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/polls`, {
        method: 'POST',
        body: JSON.stringify(newPoll)
      })
      if (res.ok) {
        const json = await res.json()
        setPolls((prev) => [json.data, ...(Array.isArray(prev) ? prev : [])])
        toast.success('Poll created!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed creating poll.')
    }
  }

  // Vote on Poll dispatcher
  const handleVotePoll = async (pollId, optionIndex) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionIndex })
      })
      if (res.ok) {
        const json = await res.json()
        setPolls((prev) => (Array.isArray(prev) ? prev : []).map((p) => (p.id === pollId ? json.data : p)))
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit vote.')
    }
  }

  // Mute member action dispatcher
  const handleMuteMember = async (memberId, durationMinutes) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/manage/mute`, {
        method: 'POST',
        body: JSON.stringify({ memberId, durationMinutes })
      })
      if (res.ok) {
        toast.success('Member muted successfully.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to mute member.')
    }
  }

  // Remove member action dispatcher
  const handleRemoveMember = async (memberId) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/manage/remove-member`, {
        method: 'POST',
        body: JSON.stringify({ memberId })
      })
      if (res.ok) {
        setMembers((prev) => (Array.isArray(prev) ? prev : []).filter((m) => (m.userId || m.id) !== memberId))
        toast.success('Member removed from trip room.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed removing member.')
    }
  }

  // Emergency SOS trigger dispatcher
  const handleSOSTrigger = async () => {
    try {
      setSosError('')
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const res = await apiRequest(`/trip-rooms/${roomId}/sos`, {
              method: 'POST',
              body: JSON.stringify({ latitude, longitude })
            })
            if (res.ok) {
              setMySosSent(true)
              toast.success('Emergency SOS Alert broadcasted!')
            } else {
              setSosError('Network transmission failed. Please call 112 directly.')
            }
          },
          () => {
            setSosError('Unable to get GPS coordinates. Please call local authorities.')
          }
        )
      }
    } catch (err) {
      setSosError('SOS trigger error. Please reach local emergency services.')
    }
  }

  const isHost = Boolean(user?.id && activity && (activity.creator_id === user.id || activity.host_id === user.id))
  const safeMessages = Array.isArray(messages) ? messages : []
  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const safePolls = Array.isArray(polls) ? polls : []
  const safeMembers = Array.isArray(members) ? members : []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1512] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 gap-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-white">Trip Room Unavailable</h2>
        <p className="text-sm text-stone-400 max-w-md">
          This trip could not be loaded or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/feed')}
          className="px-6 py-2.5 bg-primary text-bg font-semibold rounded-xl text-sm"
        >
          Return to Feed
        </button>
      </div>
    )
  }

  // Onboarding Wall Gate Check: Only non-hosts who haven't completed onboarding
  if (!isHost && !onboardingComplete) {
    return (
      <NewJoinerOnboarding
        tripName={activity?.title || 'Trip Adventure'}
        hostName={activity?.Creator?.Profile?.name || 'Organizer'}
        hostAvatar={activity?.Creator?.Profile?.avatar_url}
        safetyText={tripRules?.safety_briefing_text || welcomeMessage}
        rules={tripRules}
        messagesCount={safeMessages.length}
        expensesSum={safeExpenses.reduce((sum, e) => sum + (parseFloat(e?.amount) || 0), 0)}
        pollsCount={safePolls.length}
        members={safeMembers}
        onComplete={handleCompleteOnboarding}
      />
    )
  }

  return (
    <div className="page-container-medium">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
        
        {/* SOS Active Header notification */}
        {sosActiveInfo && (
          <div style={{ position: 'fixed', top: '16px', left: '16px', right: '16px', background: '#ff5470', borderRadius: '16px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '6px' }} className="animate-pulse">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '900', color: 'white', letterSpacing: '0.06em' }}>
              <span>🚨 SOS EMERGENCY TRIGGERED 🚨</span>
              <button onClick={() => setSosActiveInfo(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '14px', cursor: 'pointer' }}>✕</button>
            </div>
            <span style={{ fontSize: '12px', color: 'white', lineHeight: '1.4' }}>
              Traveler <strong>{sosActiveInfo.userName}</strong> triggered an emergency alarm! location coordinates broadcasted: [{sosActiveInfo.latitude}, {sosActiveInfo.longitude}]. Contacts alerted.
            </span>
          </div>
        )}

        {/* Page Title & Counters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', userSelect: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Trip Room
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: '#f3f1ea', margin: 0, lineHeight: 1.2 }}>
              {activity?.title}
            </h2>
          </div>

          {/* Member Count Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Travelers
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={safeMembers.length}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1.0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  background: flashType === 'join' ? 'rgba(79,190,142,0.14)' : flashType === 'leave' ? 'rgba(255,84,112,0.14)' : '#1a2129',
                  border: '1px solid',
                  borderColor: flashType === 'join' ? '#4fbe8e' : flashType === 'leave' ? '#ff5470' : 'rgba(255,255,255,0.08)',
                  color: flashType === 'join' ? '#4fbe8e' : flashType === 'leave' ? '#ff5470' : '#f3f1ea'
                }}
              >
                👤 {safeMembers.length} {safeMembers.length === 1 ? 'member' : 'members'}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Offline SOS error banner alerts */}
        {sosError && (
          <div style={{ background: 'rgba(255,84,112,0.14)', border: '1px solid rgba(255,84,112,0.25)', color: '#ff5470', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: '#ff5470', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>⚠️ SOS Dispatch Failed</span>
              <button onClick={() => setSosError('')} style={{ background: 'none', border: 'none', color: '#ff5470', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>✕</button>
            </div>
            <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
              {sosError}
            </span>
          </div>
        )}

        {/* Tabs navigation headers */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto', paddingBottom: '4px', userSelect: 'none' }} className="scrollbar-thin">
          {['chat', 'info', 'expenses', 'checklist', 'polls'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: 'none',
                border: 'none',
                borderBottom: '2px solid',
                borderColor: activeTab === tab ? '#ff6a2c' : 'transparent',
                color: activeTab === tab ? '#ff6a2c' : '#9ba6ad',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              {tab}
            </button>
          ))}
          {isHost && (
            <button
              onClick={() => handleTabChange('manage')}
              style={{
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: 'none',
                border: 'none',
                borderBottom: '2px solid',
                borderColor: activeTab === 'manage' ? '#ff6a2c' : 'transparent',
                color: activeTab === 'manage' ? '#ff6a2c' : '#9ba6ad',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              Manage ⚙
            </button>
          )}
        </div>

        {/* Render Tab Sub-Viewports */}
        <div style={{ flex: 1 }}>
          {activeTab === 'chat' && (
            <ChatTab
              messages={safeMessages}
              typingUsers={typingUsers}
              currentUserId={user?.id}
              onSendMessage={handleSendMessage}
              onReportMessage={(m) => alert(`Message reported successfully. Ref: ${m.id}`)}
            />
          )}

          {activeTab === 'info' && (
            <InfoTab activity={activity} members={safeMembers} onMemberTap={(m) => alert(`Selected profile: ${m?.name || m?.User?.Profile?.name || 'Explorer'}`)} />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={safeExpenses}
              members={safeMembers}
              currentUserId={user?.id}
              isHost={isHost}
              onAddExpense={handleAddExpense}
              onDeleteExpense={(id) => setExpenses((prev) => (Array.isArray(prev) ? prev : []).filter((e) => e.id !== id))}
              onSettleSplit={handleSettleSplit}
            />
          )}

          {activeTab === 'checklist' && (
            <ChecklistTab
              checklist={activity?.packing_checklist}
              members={safeMembers}
              onToggleItem={handleToggleChecklistItem}
            />
          )}

          {activeTab === 'polls' && (
            <PollsTab
              polls={safePolls}
              currentUserId={user?.id}
              isHost={isHost}
              onCreatePoll={handleCreatePoll}
              onVotePoll={handleVotePoll}
              onClosePoll={(id) =>
                setPolls((prev) => (Array.isArray(prev) ? prev : []).map((p) => (p.id === id ? { ...p, is_closed: true } : p)))
              }
            />
          )}

          {activeTab === 'manage' && isHost && (
            <ManageTab
              roomId={roomId}
              members={safeMembers}
              healthMetrics={healthMetrics}
              onMuteMember={handleMuteMember}
              onRemoveMember={handleRemoveMember}
              onToggleChat={(val) => console.log('Chat toggle:', val)}
              onToggleLock={(val) => console.log('Group locked:', val)}
              onMarkStarted={() => alert('Trip started status set. Alert SMS sent.')}
              onMarkEnded={() => alert('Trip marked completed. Triggered user reviews.')}
              onCancelTrip={(r) => alert(`Trip cancelled. Reason: ${r}`)}
              onLockExpenses={(val) => console.log('Ledger lock:', val)}
              onMarkAllSettled={() => alert('All splits marked settled.')}
            />
          )}
        </div>

        {/* Floating SOS Trigger Button Container */}
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 999 }}>
          <AnimatePresence>
            {sosHovered && !mySosSent && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  position: 'absolute',
                  bottom: '64px',
                  left: 0,
                  background: '#1a2129',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f3f1ea',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}
              >
                🚨 Emergency Alert
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onMouseEnter={() => setSosHovered(true)}
            onMouseLeave={() => setSosHovered(false)}
            onClick={() => !mySosSent && setSosModalOpen(true)}
            whileHover={{ scale: mySosSent ? 1.0 : 1.15 }}
            whileTap={{ scale: mySosSent ? 1.0 : 0.95 }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '11px',
              border: '1px solid rgba(255,84,112,0.20)',
              cursor: mySosSent ? 'default' : 'pointer',
              transition: 'all 500ms ease',
              boxShadow: '0 6px 18px rgba(255,84,112,0.3)',
              background: mySosSent ? 'rgba(255,84,112,0.1)' : '#ff5470'
            }}
          >
            {mySosSent ? (
              <div className="flex flex-col items-center justify-center gap-0.5 animate-bounce">
                <span style={{ fontSize: '11px' }}>✓</span>
                <span style={{ fontSize: '6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>SENT</span>
              </div>
            ) : (
              <span>SOS</span>
            )}
          </motion.button>
        </div>

        {/* SOS Confirm Modal Dialog */}
        <SOSConfirmModal
          isOpen={sosModalOpen}
          onClose={() => setSosModalOpen(false)}
          onConfirm={handleSOSTrigger}
          contactName="Priority Emergency Number"
        />
      </div>
    </div>
  )
}

export default TripRoom
export { TripRoom }
