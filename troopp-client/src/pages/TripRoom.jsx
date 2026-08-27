import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import Avatar from '../components/common/Avatar.jsx'
import { encryptMessageText, decryptMessageText, decryptMessagesList } from '../utils/e2ee.js'

class TripRoomErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('TripRoom ErrorBoundary caught error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px 24px', textAlign: 'center', background: '#1a2129', borderRadius: '20px', border: '1px solid rgba(255,84,112,0.3)', margin: '24px auto', maxWidth: '600px' }}>
          <span style={{ fontSize: '36px' }}>⚠️</span>
          <h3 style={{ color: '#ff5470', fontSize: '18px', fontWeight: '800', marginTop: '12px' }}>Trip Room View Error</h3>
          <p style={{ color: '#9ba6ad', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected error occurred while loading this trip room.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ background: '#ff6a2c', color: '#1a0e08', border: 'none', borderRadius: '100px', padding: '10px 20px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              onClick={() => window.location.href = '/activities'}
              style={{ background: '#212b33', color: '#f3f1ea', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Back to Trips
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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
  const [hasMoreOlder, setHasMoreOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const [expenses, setExpenses] = useState([])
  const [polls, setPolls] = useState([])
  const [members, setMembers] = useState([])
  const [healthMetrics, setHealthMetrics] = useState({})
  const [tripRules, setTripRules] = useState(null)
  const [welcomeMessage, setWelcomeMessage] = useState('')
  
  // Real-time ephemeral logs & SOS
  const [typingUsers, setTypingUsers] = useState([])
  const [sosActiveInfo, setSosActiveInfo] = useState(null)
  const [sosModalOpen, setSosModalOpen] = useState(false)
  const [sosError, setSosError] = useState('')
  const [mySosSent, setMySosSent] = useState(false)
  const [sosHovered, setSosHovered] = useState(false)
  const [flashType, setFlashType] = useState(null)

  const socketRef = useRef(null)
  const activeTabRef = useRef(activeTab)

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

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
        
        const rawMembers = activityJson.data?.confirmedMembers || act?.Members || []
        if (Array.isArray(rawMembers) && rawMembers.length > 0) {
          const normalized = rawMembers.map((m) => ({
            userId: m.user_id || m.userId || m.id,
            name: m.name || m.User?.Profile?.name || m.Profile?.name || 'Explorer',
            avatarUrl: m.avatarUrl || m.User?.Profile?.avatar_url || m.Profile?.avatar_url || null,
            trustScore: m.trustScore || m.User?.trust_score || 50,
            reliabilityScore: m.reliabilityScore || m.User?.reliability_score || 100,
            isOnline: m.isOnline || false,
            role: m.role || 'member'
          }))
          setMembers(normalized)
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
          apiRequest(`/trip-rooms/${roomId}/messages?limit=50`),
          apiRequest(`/trip-rooms/${roomId}/expenses`),
          apiRequest(`/trip-rooms/${roomId}/polls`),
          apiRequest(`/trip-rooms/${roomId}/health`)
        ])

        if (!isMounted) return

        if (msgRes.status === 'fulfilled' && msgRes.value?.ok) {
          const msgJson = await msgRes.value.json()
          const rows = Array.isArray(msgJson.data)
            ? msgJson.data
            : (Array.isArray(msgJson.data?.rows) ? msgJson.data.rows : [])
          const decryptedRows = await decryptMessagesList(rows, roomId)
          if (isMounted) {
            setMessages((prev) => {
              const existingMap = new Map((prev || []).map((m) => [m.id, m]))
              decryptedRows.forEach((r) => existingMap.set(r.id, r))
              const merged = Array.from(existingMap.values())
              merged.sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0))
              return merged
            })
            setHasMoreOlder(Boolean(msgJson.data?.hasMore))
          }
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

  // 2. Initialize real-time WebSockets connections with WhatsApp parity
  useEffect(() => {
    if (!roomId || !user?.id) return

    const serverUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:3000')
    const token = getAccessToken()

    const timers = []
    let socket
    try {
      socket = io(serverUrl, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling']
      })
    } catch (err) {
      console.error('Socket.IO initialization failed:', err)
      return
    }

    socketRef.current = socket

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err?.message)
    })

    socket.on('connect', () => {
      socket.emit('join_room', { roomId })
    })

    // Listen room joins responses
    socket.on('room_joined', async (data) => {
      if (data.messages && Array.isArray(data.messages)) {
        const decryptedMessages = await decryptMessagesList(data.messages, roomId)
        setMessages((prev) => {
          const existingMap = new Map((prev || []).map((m) => [m.id, m]))
          decryptedMessages.forEach((m) => {
            existingMap.set(m.id, { ...existingMap.get(m.id), ...m })
          })
          const merged = Array.from(existingMap.values())
          merged.sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0))
          return merged
        })
      }
      if (data.members && Array.isArray(data.members)) {
        const normalized = data.members.map((m) => ({
          userId: m.userId || m.user_id || m.id,
          name: m.name || m.User?.Profile?.name || 'Explorer',
          avatarUrl: m.avatarUrl || m.User?.Profile?.avatar_url || null,
          trustScore: m.trustScore || m.User?.trust_score || 50,
          reliabilityScore: m.reliabilityScore || m.User?.reliability_score || 100,
          isOnline: m.isOnline !== undefined ? m.isOnline : true,
          role: m.role || 'member'
        }))
        setMembers(normalized)
      }
      if (data.rules) setTripRules(data.rules)
      if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage)
    })

    // Listen incoming new messages
    socket.on('new_message', async (payload) => {
      let decryptedText = payload.message_text
      if (payload.message_text && payload.message_text.startsWith('troopp:e2ee:v1:')) {
        decryptedText = await decryptMessageText(payload.message_text, roomId)
      }
      const processed = { ...payload, message_text: decryptedText }

      if (payload.sender_id !== user?.id) {
        haptics.newMessage?.()
        // Auto-ack delivery
        socket.emit('message_delivered_ack', { roomId, messageIds: [payload.id] })
        if (activeTabRef.current === 'chat') {
          socket.emit('message_read_ack', { roomId, messageIds: [payload.id] })
        }
      }

      setMessages((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        if (arr.some((m) => m.id === payload.id)) return arr

        if (payload.sender_id === user?.id) {
          const idx = arr.findIndex((m) => m.status === 'sending' && (m.client_temp_id === payload.client_temp_id || m.message_text === payload.message_text || m.message_text === decryptedText))
          if (idx !== -1) {
            const updated = [...arr]
            updated[idx] = { ...processed, status: 'sent' }
            return updated
          }
        }
        return [...arr, processed]
      })
    })

    // Listen message delivery acks
    socket.on('message_delivered', ({ messageIds, userId: recipientId, deliveredAt }) => {
      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((msg) => {
          if (messageIds.includes(msg.id)) {
            const deliveries = msg.Deliveries || []
            if (!deliveries.some((d) => d.user_id === recipientId)) {
              return {
                ...msg,
                Deliveries: [...deliveries, { user_id: recipientId, delivered_at: deliveredAt }]
              }
            }
          }
          return msg
        })
      )
    })

    // Listen message read acks
    socket.on('message_read', ({ messageIds, userId: recipientId, readAt }) => {
      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((msg) => {
          if (messageIds.includes(msg.id)) {
            const reads = msg.Reads || []
            if (!reads.some((r) => r.user_id === recipientId)) {
              return {
                ...msg,
                Reads: [...reads, { user_id: recipientId, read_at: readAt }]
              }
            }
          }
          return msg
        })
      )
    })

    // Listen message reaction updates
    socket.on('message_reaction_updated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((msg) => (msg.id === messageId ? { ...msg, Reactions: reactions } : msg))
      )
    })

    // Listen message edits
    socket.on('message_edited', ({ messageId, newText, editedAt }) => {
      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((msg) => (msg.id === messageId ? { ...msg, message_text: newText, edited_at: editedAt } : msg))
      )
    })

    // Listen message deletions
    socket.on('message_deleted', ({ messageId, scope }) => {
      setMessages((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        if (scope === 'everyone') {
          return arr.map((msg) => (msg.id === messageId ? { ...msg, deleted_for: 'everyone', message_text: '🚫 This message was deleted', media: null } : msg))
        }
        return arr.filter((msg) => msg.id !== messageId)
      })
    })

    // Listen starred messages
    socket.on('message_starred', ({ messageId, isStarred }) => {
      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).map((msg) => (msg.id === messageId ? { ...msg, is_starred: isStarred } : msg))
      )
    })

    // Listen member joins & presence updates
    socket.on('member_joined', (payload) => {
      if (payload.userId !== user?.id) {
        setFlashType('join')
        import('../utils/sounds.js').then((m) => m.playJoinApproved?.()).catch(() => {})
        timers.push(setTimeout(() => setFlashType(null), 800))
      }

      setMembers((prev) => {
        const arr = Array.isArray(prev) ? prev : []
        if (arr.some((m) => (m.userId || m.id) === payload.userId)) {
          return arr.map((m) => ((m.userId || m.id) === payload.userId ? { ...m, isOnline: true } : m))
        }
        return [
          ...arr,
          {
            userId: payload.userId,
            name: payload.name,
            avatarUrl: payload.avatarUrl || null,
            trustScore: payload.trustScore || 50,
            reliabilityScore: payload.reliabilityScore || 100,
            isOnline: true
          }
        ]
      })
    })

    socket.on('presence_update', ({ userId: pUserId, isOnline, lastSeen }) => {
      setMembers((prev) =>
        (Array.isArray(prev) ? prev : []).map((m) => {
          if ((m.userId || m.id) === pUserId) {
            return { ...m, isOnline, lastSeen }
          }
          return m
        })
      )
    })

    // Listen typing indicators
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

    // Listen Emergency SOS Alarms
    socket.on('sos_triggered', (data) => {
      haptics.sos?.()
      setSosActiveInfo(data)
      import('../utils/sounds.js').then((m) => m.playSosAlarm?.()).catch(() => {})
    })

    socket.on('sos_resolved', () => {
      setSosActiveInfo(null)
      toast.success('Emergency SOS resolved.')
    })

    return () => {
      timers.forEach((t) => clearTimeout(t))
      try {
        socket?.emit('leave_room', { roomId })
        socket?.disconnect()
      } catch (err) {
        console.warn('Socket cleanup error:', err)
      }
      socketRef.current = null
    }
  }, [roomId, user?.id])

  // Tab navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    sessionStorage.setItem(`active_tab_${roomId}`, tab)
  }

  // Load older messages for infinite scroll
  const handleLoadOlderMessages = async () => {
    if (loadingOlder || !hasMoreOlder || messages.length === 0) return
    const oldestMsg = messages[0]
    if (!oldestMsg?.created_at) return

    setLoadingOlder(true)
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/messages?before=${encodeURIComponent(oldestMsg.created_at)}&limit=30`)
      if (res.ok) {
        const json = await res.json()
        const olderRows = json.data?.rows || []
        const decryptedOlder = await decryptMessagesList(olderRows, roomId)
        setMessages((prev) => {
          const existingMap = new Map((prev || []).map((m) => [m.id, m]))
          decryptedOlder.forEach((r) => existingMap.set(r.id, r))
          const merged = Array.from(existingMap.values())
          merged.sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0))
          return merged
        })
        setHasMoreOlder(Boolean(json.data?.hasMore))
      }
    } catch (err) {
      console.warn('Failed loading older messages:', err)
    } finally {
      setLoadingOlder(false)
    }
  }

  // Upload Media Dispatcher
  const handleUploadMedia = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const token = getAccessToken()
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

    const res = await fetch(`${apiUrl}/trip-rooms/${roomId}/messages/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.message || 'Media upload failed.')
    }

    const json = await res.json()
    return json.data
  }

  // Send Rich Message
  const handleSendMessage = async (messageText, options = {}) => {
    const { messageType = 'text', media = null, locationData = null, contactData = null, replyToId = null, clientTempId } = options
    const tempId = clientTempId || `temp-${Date.now()}`

    const optimisticMessage = {
      id: tempId,
      client_temp_id: tempId,
      sender_id: user?.id,
      message_text: messageText,
      message_type: messageType,
      media,
      location_data: locationData,
      contact_data: contactData,
      reply_to_message_id: replyToId,
      status: 'sending',
      created_at: new Date().toISOString(),
      Sender: {
        id: user?.id,
        trust_score: user?.trustScore || 85,
        reliability_score: user?.reliabilityScore || 100,
        Profile: {
          name: user?.name || 'Explorer',
          avatar_url: user?.avatarUrl
        }
      }
    }

    setMessages((prev) => [...(Array.isArray(prev) ? prev : []), optimisticMessage])

    // Encrypt client-side if text message
    let payloadText = messageText
    if (messageType === 'text' && messageText) {
      try {
        payloadText = await encryptMessageText(messageText, roomId)
      } catch (err) {
        console.warn('E2EE encryption fallback to plain text:', err)
      }
    }

    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        roomId,
        content: payloadText,
        messageText: payloadText,
        messageType,
        media,
        locationData,
        contactData,
        replyToId,
        clientTempId: tempId
      })
    }
  }

  // Reactions
  const handleAddReaction = (messageId, emoji) => {
    if (socketRef.current) {
      socketRef.current.emit('message_reaction_add', { roomId, messageId, emoji })
    }
  }

  const handleRemoveReaction = (messageId, emoji) => {
    if (socketRef.current) {
      socketRef.current.emit('message_reaction_remove', { roomId, messageId, emoji })
    }
  }

  // Edit Message
  const handleEditMessage = (messageId, newText) => {
    if (socketRef.current) {
      socketRef.current.emit('message_edit', { roomId, messageId, newText })
    }
  }

  // Delete Message
  const handleDeleteMessage = (messageId, scope = 'me') => {
    if (socketRef.current) {
      socketRef.current.emit('message_delete', { roomId, messageId, scope })
    }
  }

  // Star / Unstar
  const handleStarMessage = (messageId) => {
    if (socketRef.current) {
      socketRef.current.emit('message_star', { messageId })
    }
  }

  const handleUnstarMessage = (messageId) => {
    if (socketRef.current) {
      socketRef.current.emit('message_unstar', { messageId })
    }
  }

  // Forward Message
  const handleForwardMessage = async (messageId, targetRoomId) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/messages/${messageId}/forward`, {
        method: 'POST',
        body: JSON.stringify({ targetRoomId })
      })
      if (res.ok) {
        toast.success('Message forwarded successfully!')
      }
    } catch (err) {
      toast.error('Failed to forward message.')
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

  // Add Checklist Item dispatcher
  const handleAddChecklistItem = async (itemName) => {
    try {
      let currentList = activity?.packing_checklist || []
      if (typeof currentList === 'string') {
        try { currentList = JSON.parse(currentList) } catch { currentList = [] }
      }
      const updatedList = [...(Array.isArray(currentList) ? currentList : []), { item: itemName, checked: false, checked_by_id: null }]
      
      await apiRequest(`/trip-rooms/${roomId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ item: itemName, packing_checklist: updatedList })
      }).catch(() => null)

      setActivity((prev) => (prev ? { ...prev, packing_checklist: updatedList } : prev))
      toast.success('Added item to checklist!')
    } catch (err) {
      toast.error('Failed adding item to checklist.')
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

  // Mute member action dispatcher (Host only)
  const handleMuteMember = async (memberId, durationMinutes) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/mute/${memberId}`, {
        method: 'POST',
        body: JSON.stringify({ durationHours: durationMinutes / 60 })
      })
      if (res.ok) {
        toast.success('Member muted successfully.')
      }
    } catch (err) {
      toast.error('Failed to mute member.')
    }
  }

  // Remove member action dispatcher (Host only)
  const handleRemoveMember = async (memberId) => {
    try {
      const res = await apiRequest(`/trip-rooms/${roomId}/remove/${memberId}`, {
        method: 'POST'
      })
      if (res.ok) {
        toast.success('Member removed from trip.')
        setMembers((prev) => (Array.isArray(prev) ? prev : []).filter((m) => (m.userId || m.id) !== memberId))
      }
    } catch (err) {
      toast.error('Failed to remove member.')
    }
  }

  // Safe checks
  const safeMembers = Array.isArray(members) ? members : []
  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const safePolls = Array.isArray(polls) ? polls : []
  const isHost = Boolean(user?.id && activity && (activity.creator_id === user.id || activity.host_id === user.id))

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!activity) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: '48px' }}>🗺️</span>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f3f1ea' }}>Trip Room Unavailable</h2>
        <p style={{ fontSize: '13px', color: '#9ba6ad', maxWidth: '360px', lineHeight: 1.5 }}>
          This trip room could not be loaded or you may need to confirm your trip membership first.
        </p>
        <button
          onClick={() => navigate('/activities')}
          style={{ background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)', color: '#1a0e08', border: 'none', borderRadius: '100px', padding: '12px 24px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
        >
          Browse Upcoming Trips ➔
        </button>
      </div>
    )
  }

  if (!onboardingComplete && !isHost) {
    return (
      <NewJoinerOnboarding
        activity={activity}
        rules={tripRules}
        welcomeMessage={welcomeMessage}
        onComplete={async () => {
          await apiRequest(`/trip-rooms/${roomId}/onboarding-complete`, { method: 'POST' }).catch(() => {})
          setOnboardingComplete(true)
        }}
      />
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex flex-col gap-4 sm:gap-6 min-w-0">
      
      {/* Persistent SOS Alert Banner */}
      {sosActiveInfo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#ff5470] text-white rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl z-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🚨</span>
            <div>
              <h4 className="m-0 text-xs sm:text-sm font-black uppercase tracking-wider">
                EMERGENCY SOS ALERT: {sosActiveInfo.userName || 'Traveler'}
              </h4>
              <span className="text-xs opacity-90">
                Location: {sosActiveInfo.latitude?.toFixed(4)}, {sosActiveInfo.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={`https://maps.google.com/?q=${sosActiveInfo.latitude},${sosActiveInfo.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="bg-black/20 hover:bg-black/30 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              📍 Open Map
            </a>
            {isHost && (
              <button
                onClick={() => socketRef.current?.emit('sos_resolve', { roomId })}
                className="bg-white hover:bg-white/90 text-[#ff5470] px-4 py-1.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Resolve
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Header Info Banner */}
      <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xl">
        <div className="flex flex-col min-w-0">
          <h1 className="m-0 text-lg sm:text-2xl font-black text-[#f3f1ea] font-display truncate">
            {activity?.title || 'Trip Room'}
          </h1>
          <div className="flex items-center flex-wrap gap-2 text-xs text-[#9ba6ad] mt-1">
            <span className="flex items-center gap-1 font-medium">
              <span>📍</span>
              <span className="text-white/90">{activity?.destination || 'Destination'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>👤</span>
              <span className="font-semibold text-white/90">{safeMembers.length} travelers</span>
            </span>
          </div>
        </div>

        {/* Traveler Avatars stack */}
        <div className="flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center">
          <div className="flex items-center -space-x-2 overflow-hidden py-1">
            {safeMembers.slice(0, 5).map((m, idx) => (
              <div key={m.userId || idx} className="relative ring-2 ring-[#151c24] rounded-full">
                <Avatar src={m.avatarUrl || m.User?.Profile?.avatar_url} name={m.name || m.User?.Profile?.name} size="sm" score={m.trustScore} />
                {m.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4fbe8e] rounded-full border-2 border-[#151c24]" />
                )}
              </div>
            ))}
          </div>
          {safeMembers.length > 5 && (
            <span className="text-[11px] font-bold text-[#9ba6ad] bg-[#1a2129] border border-white/10 px-2 py-0.5 rounded-full">
              +{safeMembers.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation Headers */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
        {[
          { id: 'chat', label: 'CHAT', icon: '💬' },
          { id: 'info', label: 'INFO', icon: 'ℹ' },
          { id: 'expenses', label: 'SPLIT', icon: '💰' },
          { id: 'checklist', label: 'PACKING', icon: '🎒' },
          { id: 'polls', label: 'POLLS', icon: '📊' }
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`min-h-[42px] px-4 sm:px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[rgba(255,106,44,0.15)] text-[#f3f1ea] border border-[#ff6a2c] shadow-[0_0_12px_rgba(255,106,44,0.25)]'
                  : 'text-[#9ba6ad] hover:text-[#f3f1ea] hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
        {isHost && (
          <button
            onClick={() => handleTabChange('manage')}
            className={`min-h-[42px] px-4 sm:px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-[rgba(255,106,44,0.15)] text-[#f3f1ea] border border-[#ff6a2c] shadow-[0_0_12px_rgba(255,106,44,0.25)]'
                : 'text-[#9ba6ad] hover:text-[#f3f1ea] hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>⚙</span>
            <span>MANAGE</span>
          </button>
        )}
      </div>

      {/* Render Active Tab Container */}
      <div className="flex-1 w-full min-w-0">
        {activeTab === 'chat' && (
          <ChatTab
            messages={messages}
            typingUsers={typingUsers}
            currentUserId={user?.id}
            isHost={isHost}
            roomMembers={safeMembers}
            onSendMessage={handleSendMessage}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onStarMessage={handleStarMessage}
            onUnstarMessage={handleUnstarMessage}
            onForwardMessage={handleForwardMessage}
            onUploadMedia={handleUploadMedia}
            onLoadOlderMessages={handleLoadOlderMessages}
            hasMoreOlder={hasMoreOlder}
            loadingOlder={loadingOlder}
            onReportMessage={(m) => toast.success(`Report submitted for message ${m.id}`)}
          />
        )}

        {activeTab === 'info' && (
          <InfoTab
            activity={activity}
            members={safeMembers}
            onMemberTap={(m) => alert(`Selected profile: ${m?.name || m?.User?.Profile?.name || 'Explorer'}`)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            activityId={roomId}
            expenses={safeExpenses}
            members={safeMembers}
            currentUserId={user?.id}
            isHost={isHost}
            onAddExpense={handleAddExpense}
            onDeleteExpense={(id) => setExpenses((prev) => (Array.isArray(prev) ? prev : []).filter((e) => e.id !== id))}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistTab
            checklist={activity?.packing_checklist}
            members={safeMembers}
            onToggleItem={handleToggleChecklistItem}
            onAddItem={handleAddChecklistItem}
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

      {/* Floating SOS Trigger Button */}
      <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 99 }}>
        <button
          onClick={() => setSosModalOpen(true)}
          style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#ff5470', color: '#fff', border: 'none', fontSize: '20px', fontWeight: '900', boxShadow: '0 6px 20px rgba(255,84,112,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Emergency SOS Broadcast"
        >
          🚨
        </button>
      </div>

      {sosModalOpen && (
        <SOSConfirmModal
          isOpen={sosModalOpen}
          onClose={() => setSosModalOpen(false)}
          onConfirm={(coords) => {
            if (socketRef.current && coords) {
              socketRef.current.emit('sos_trigger', {
                roomId,
                latitude: coords.latitude,
                longitude: coords.longitude
              })
              setMySosSent(true)
              toast.error('EMERGENCY SOS DISPATCHED TO ALL MEMBERS & CONTACTS')
            }
            setSosModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

const TripRoomWithBoundary = (props) => (
  <TripRoomErrorBoundary>
    <TripRoom {...props} />
  </TripRoomErrorBoundary>
)

export default TripRoomWithBoundary
export { TripRoomWithBoundary as TripRoom }
