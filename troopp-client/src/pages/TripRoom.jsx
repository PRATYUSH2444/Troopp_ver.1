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
    const fetchRoomMeta = async () => {
      try {
        // Fetch activity metadata
        const activityRes = await apiRequest(`/activities/${roomId}`)
        if (!activityRes.ok) throw new Error('Failed to retrieve activity meta.')
        const activityJson = await activityRes.json()
        setActivity(activityJson.data?.activity || null)
        if (activityJson.data?.confirmedMembers) {
          setMembers(activityJson.data.confirmedMembers)
        }

        // Fetch onboarding progress
        const onboardingRes = await apiRequest(`/trip-rooms/${roomId}/onboarding`)
        if (onboardingRes.ok) {
          const onboardingJson = await onboardingRes.json()
          setOnboardingComplete(onboardingJson.data?.onboardingCompleted || false)
          setTripRules(onboardingJson.data?.rules || null)
          setWelcomeMessage(onboardingJson.data?.welcomeMessage || '')
        }

        // Fetch initial static tab records
        const [msgRes, expRes, pollRes, healthRes] = await Promise.all([
          apiRequest(`/trip-rooms/${roomId}/messages`),
          apiRequest(`/trip-rooms/${roomId}/expenses`),
          apiRequest(`/trip-rooms/${roomId}/polls`),
          apiRequest(`/trip-rooms/${roomId}/health`)
        ])

        if (msgRes.ok) {
          const msgJson = await msgRes.json()
          setMessages(msgJson.data || [])
        }
        if (expRes.ok) {
          const expJson = await expRes.json()
          setExpenses(expJson.data || [])
        }
        if (pollRes.ok) {
          const pollJson = await pollRes.json()
          setPolls(pollJson.data || [])
        }
        if (healthRes.ok) {
          const healthJson = await healthRes.json()
          setHealthMetrics(healthJson.data || {})
        }

      } catch (err) {
        console.error('Failed fetching room metadata:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRoomMeta()
  }, [roomId])

  // 2. Initialize real-time WebSockets connections on onboarding success
  useEffect(() => {
    if (!onboardingComplete) return

    const serverUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:3000'
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
      if (data.messages) setMessages(data.messages)
      if (data.members) setMembers(data.members)
    })

    // Listen incoming new messages
    socket.on('new_message', (payload) => {
      if (payload.sender_id !== user?.id) {
        haptics.newMessage()
      }
      setMessages((prev) => {
        if (payload.sender_id === user?.id) {
          const idx = prev.findIndex((m) => m.status === 'sending' && m.message_text === payload.message_text)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = { ...payload, status: 'sent' }
            return updated
          }
        }
        return [...prev, payload]
      })
    })

    // Listen new member joins
    socket.on('member_joined', (payload) => {
      const joinMsg = {
        id: `join-${Date.now()}`,
        sender_id: payload.userId,
        message_text: `${payload.name} joined the trip room!`,
        message_type: 'member_joined_system',
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, joinMsg])

      setFlashType('join')
      import('../utils/sounds.js').then((m) => m.playJoinApproved())
      setTimeout(() => setFlashType(null), 800)

      setMembers((prev) => {
        if (prev.some((m) => m.userId === payload.userId)) return prev
        return [
          ...prev,
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
      setMessages((prev) => [...prev, leaveMsg])

      setFlashType('leave')
      import('../utils/sounds.js').then((m) => m.playError())
      setTimeout(() => setFlashType(null), 800)

      setMembers((prev) => prev.filter((m) => m.userId !== payload.userId))
    })

    // Listen typing status indicators
    socket.on('user_typing', (payload) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === payload.userId)) return prev
        return [...prev, payload]
      })

      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId))
      }, 3000)
    })

    // Listen checklist item changes
    socket.on('checklist_item_updated', (payload) => {
      setActivity((prev) => {
        if (!prev) return prev
        const updatedChecklist = [...(prev.packing_checklist || [])]
        if (updatedChecklist[payload.itemIndex]) {
          updatedChecklist[payload.itemIndex].checked = payload.isChecked
          updatedChecklist[payload.itemIndex].checked_by_id = payload.isChecked ? payload.userId : null
        }
        return {
          ...prev,
          packing_checklist: updatedChecklist
        }
      })
    })

    // Listen polls votes
    socket.on('poll_updated', (payload) => {
      setPolls((prev) =>
        prev.map((p) => (p.id === payload.pollId ? { ...p, votes: payload.votes } : p))
      )
    })

    // Listen new polls
    socket.on('poll_created', (payload) => {
      setPolls((prev) => [payload.poll, ...prev])
    })

    // Listen expense logs updates
    socket.on('expense_updated', (payload) => {
      setExpenses((prev) => [payload.expense, ...prev])
    })

    // Listen expense settlements
    socket.on('split_settled', (payload) => {
      setExpenses((prev) =>
        prev.map((e) => {
          const updatedSplits = e.Splits?.map((s) => (s.id === payload.splitId ? payload.split : s))
          return { ...e, Splits: updatedSplits }
        })
      )
    })

    // Listen emergency SOS broadcasts
    socket.on('sos_triggered', (payload) => {
      setSosActiveInfo(payload)
      setTimeout(() => setSosActiveInfo(null), 10000)
    })

    // Listen hosts action drops
    socket.on('member_removed', (payload) => {
      if (payload.userId === user?.id) {
        toast.error('You have been removed from this trip by the host.')
        navigate('/feed')
      } else {
        setMembers((prev) => prev.filter((m) => m.userId !== payload.userId))
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [onboardingComplete, roomId, user, navigate])

  const handleTabChange = (tabName) => {
    haptics.tabSwitch()
    setActiveTab(tabName)
    sessionStorage.setItem(`active_tab_${roomId}`, tabName)
  }

  // Socket triggers dispatchers
  const handleSendMessage = (text) => {
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id,
      message_text: text,
      message_type: 'chat',
      created_at: new Date().toISOString(),
      status: 'sending',
      Sender: {
        id: user?.id,
        trust_score: user?.trustScore || 80,
        Profile: {
          name: user?.name || 'Explorer',
          avatar_url: user?.avatarUrl || null
        }
      }
    }
    setMessages((prev) => [...prev, tempMsg])
    if (socketRef.current) {
      socketRef.current.emit('send_message', { roomId, content: text })
    }
  }

  const handleToggleChecklistItem = (index, isChecked) => {
    if (socketRef.current) {
      socketRef.current.emit('checklist_update', { roomId, itemIndex: index, isChecked })
    }
  }

  const handleVotePoll = (pollId, optionIndex) => {
    if (socketRef.current) {
      socketRef.current.emit('poll_vote', { roomId, pollId, optionIndex })
    }
  }

  const handleSOSTrigger = (coords) => {
    if (!navigator.onLine) {
      setSosError('SOS failed — no internet connection. Call emergency services directly on 112.')
      setSosModalOpen(false)
      return
    }

    setSosError('')

    if (socketRef.current) {
      haptics.sos()
      socketRef.current.emit('sos_trigger', {
        roomId,
        latitude: coords.latitude,
        longitude: coords.longitude
      })
    }
    setSosModalOpen(false)
    setMySosSent(true)
    setTimeout(() => {
      setMySosSent(false)
    }, 10000)
  }

  // Production API handlers bindings
  const handleAddExpense = async (data) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const json = await res.json()
        setExpenses((prev) => [json.data, ...prev])
        toast.success('Expense added.')
      }
    } catch (err) {
      toast.error('Failed to save expense record.')
    }
  }

  const handleSettleSplit = async (splitId) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/expenses/splits/${splitId}/settle`, {
        method: 'POST'
      })
      if (res.ok) {
        const json = await res.json()
        setExpenses((prev) =>
          prev.map((e) => {
            const updatedSplits = e.Splits?.map((s) => (s.id === splitId ? json.data : s))
            return { ...e, Splits: updatedSplits }
          })
        )
        toast.success('Split marked settled.')
      }
    } catch (err) {
      toast.error('Failed settling split.')
    }
  }

  const handleCreatePoll = async (data) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/polls`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const json = await res.json()
        setPolls((prev) => [json.data, ...prev])
        toast.success('Poll created successfully!')
      }
    } catch (err) {
      toast.error('Failed creating group poll.')
    }
  }

  const handleMuteMember = async (targetUserId, hours) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/mute/${targetUserId}`, {
        method: 'POST',
        body: JSON.stringify({ hours })
      })
      if (res.ok) {
        toast.success(`User muted for ${hours} hours.`)
      }
    } catch (err) {
      toast.error('Mute action failed.')
    }
  }

  const handleRemoveMember = async (targetUserId) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/remove/${targetUserId}`, {
        method: 'POST'
      })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== targetUserId))
        toast.success('Member removed from room.')
      }
    } catch (err) {
      toast.error('Remove action failed.')
    }
  }

  const handleCompleteOnboarding = async () => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/onboarding-complete`, {
        method: 'POST'
      })
      if (res.ok) {
        setOnboardingComplete(true)
      }
    } catch (err) {
      toast.error('Failed saving onboarding signature.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#10151a' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  // Fallback if activity data could not be fetched
  if (!activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: '#10151a', color: '#f3f1ea' }}>
        <h2 className="text-xl font-bold mb-2">Trip Room Unavailable</h2>
        <p className="text-sm text-text-secondary mb-6">Could not load this trip room's information.</p>
        <button
          onClick={() => navigate('/feed')}
          className="px-6 py-2.5 bg-primary text-bg font-semibold rounded-xl text-sm"
        >
          Return to Feed
        </button>
      </div>
    )
  }

  const safeMessages = Array.isArray(messages) ? messages : []
  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const safePolls = Array.isArray(polls) ? polls : []
  const safeMembers = Array.isArray(members) ? members : []

  // Onboarding Wall Gate Check
  if (!onboardingComplete) {
    return (
      <NewJoinerOnboarding
        tripName={activity?.title}
        hostName={activity?.Creator?.Profile?.name || 'Leader'}
        hostAvatar={activity?.Creator?.Profile?.avatar_url}
        safetyText={tripRules?.safety_briefing_text || welcomeMessage}
        rules={tripRules}
        messagesCount={safeMessages.length}
        expensesSum={safeExpenses.reduce((sum, e) => sum + parseFloat(e?.amount || 0), 0)}
        pollsCount={safePolls.length}
        members={safeMembers}
        onComplete={handleCompleteOnboarding}
      />
    )
  }

  const isHost = user?.id === activity?.creator_id

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#10151a', padding: '28px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
        
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
            <InfoTab activity={activity} members={safeMembers} onMemberTap={(m) => alert(`Selected profile: ${m.name}`)} />
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
                <span style={{ fontSize: '6px', tracking: '-0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>SENT</span>
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
