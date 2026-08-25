import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import { toast } from 'react-hot-toast'

// Helper: Format date separator
const formatDateSeparator = (dateStr) => {
  if (!dateStr) return 'Today'
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// Helper: Format audio duration in mm:ss
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉']

/**
 * WhatsApp-Parity Trip Room Chat Component
 */
const ChatTab = ({
  messages = [],
  typingUsers = [],
  onSendMessage,
  currentUserId,
  onReportMessage,
  onAddReaction,
  onRemoveReaction,
  onEditMessage,
  onDeleteMessage,
  onStarMessage,
  onUnstarMessage,
  onForwardMessage,
  onUploadMedia,
  onLoadOlderMessages,
  hasMoreOlder = false,
  loadingOlder = false,
  isHost = false,
  roomMembers = [],
  lastReadTimestamp = null
}) => {
  // Input state
  const [inputText, setInputText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState('')

  // Attachment & Voice state
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [mediaUploading, setMediaUploading] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  // In-Chat Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMatches, setSearchMatches] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  // Gallery & Starred Modals
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryTab, setGalleryTab] = useState('media') // 'media' | 'docs' | 'links'
  const [starredOpen, setStarredOpen] = useState(false)
  const [lightboxMedia, setLightboxMedia] = useState(null)
  const [selectedReactionMessage, setSelectedReactionMessage] = useState(null)

  // Context menu & Modals
  const [activeContextMenuMsg, setActiveContextMenuMsg] = useState(null)
  const [reportModalMessage, setReportModalMessage] = useState(null)
  const [forwardModalMessage, setForwardModalMessage] = useState(null)
  const [targetRoomInput, setTargetRoomInput] = useState('')

  // Scroll & Unread Floating Pill
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [unreadCountBelow, setUnreadCountBelow] = useState(0)
  const messagesEndRef = useRef(null)
  const viewportRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Audio Playback state
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1.0)
  const audioPlayerRef = useRef(new Audio())

  // Safe arrays
  const safeMessages = useMemo(() => (Array.isArray(messages) ? messages : []), [messages])
  const safeTypingUsers = useMemo(() => (Array.isArray(typingUsers) ? typingUsers : []), [typingUsers])

  // Group messages by day & sender continuity
  const messageGroups = useMemo(() => {
    const groups = []
    let currentDay = null
    let currentGroup = []

    safeMessages.forEach((msg, idx) => {
      if (!msg) return
      const day = new Date(msg.created_at || Date.now()).toDateString()
      if (day !== currentDay) {
        if (currentGroup.length > 0) {
          groups.push({ day: currentDay, messages: currentGroup })
        }
        currentDay = day
        currentGroup = [msg]
      } else {
        currentGroup.push(msg)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ day: currentDay, messages: currentGroup })
    }
    return groups
  }, [safeMessages])

  // In-Chat Search match finder
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([])
      setCurrentMatchIndex(0)
      return
    }
    const query = searchQuery.toLowerCase()
    const matches = safeMessages.filter((m) => m?.message_text && m.message_text.toLowerCase().includes(query))
    setSearchMatches(matches)
    setCurrentMatchIndex(0)
  }, [searchQuery, safeMessages])

  // Jump to search match
  const handleNextSearchMatch = () => {
    if (searchMatches.length === 0) return
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length
    setCurrentMatchIndex(nextIdx)
    scrollToMessageId(searchMatches[nextIdx].id)
  }

  const handlePrevSearchMatch = () => {
    if (searchMatches.length === 0) return
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length
    setCurrentMatchIndex(prevIdx)
    scrollToMessageId(searchMatches[prevIdx].id)
  }

  const scrollToMessageId = (id) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.transition = 'background-color 0.4s'
      el.style.backgroundColor = 'rgba(255,106,44,0.25)'
      setTimeout(() => {
        el.style.backgroundColor = 'transparent'
      }, 1500)
    }
  }

  // Handle Scroll Viewport for auto-scroll and older messages load
  const handleScroll = () => {
    if (!viewportRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
    const distanceToBottom = scrollHeight - scrollTop - clientHeight

    if (distanceToBottom > 150) {
      setShowScrollBottom(true)
    } else {
      setShowScrollBottom(false)
      setUnreadCountBelow(0)
    }

    if (scrollTop === 0 && hasMoreOlder && !loadingOlder && onLoadOlderMessages) {
      onLoadOlderMessages()
    }
  }

  // Auto-scroll on new message if near bottom
  useEffect(() => {
    if (!viewportRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150

    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    } else if (safeMessages.length > 0) {
      const lastMsg = safeMessages[safeMessages.length - 1]
      if (lastMsg?.sender_id !== currentUserId) {
        setUnreadCountBelow((prev) => prev + 1)
      }
    }
  }, [safeMessages.length, currentUserId])

  // Audio Playback handler
  const handleTogglePlayAudio = (id, url) => {
    if (playingAudioId === id) {
      audioPlayerRef.current.pause()
      setPlayingAudioId(null)
    } else {
      audioPlayerRef.current.src = url
      audioPlayerRef.current.playbackRate = audioPlaybackRate
      audioPlayerRef.current.play()
      setPlayingAudioId(id)

      audioPlayerRef.current.onended = () => setPlayingAudioId(null)
    }
  }

  const handleCyclePlaybackRate = () => {
    const rates = [1.0, 1.5, 2.0]
    const nextRate = rates[(rates.indexOf(audioPlaybackRate) + 1) % rates.length]
    setAudioPlaybackRate(nextRate)
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = nextRate
    }
  }

  // Voice Note Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' })
        stream.getTracks().forEach((track) => track.stop())

        if (recordingSeconds > 1 && onUploadMedia) {
          setMediaUploading(true)
          try {
            const mediaMeta = await onUploadMedia(file)
            onSendMessage('', {
              messageType: 'audio',
              media: { ...mediaMeta, duration: recordingSeconds },
              replyToId: replyingTo?.id
            })
            setReplyingTo(null)
          } catch (err) {
            toast.error('Voice note upload failed.')
          } finally {
            setMediaUploading(false)
          }
        }
      }

      mediaRecorderRef.current.start()
      setIsRecordingVoice(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1)
      }, 1000)
    } catch (err) {
      toast.error('Microphone access denied or unavailable.')
    }
  }

  const stopVoiceRecording = (cancel = false) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      if (cancel) {
        audioChunksRef.current = []
      }
      mediaRecorderRef.current.stop()
    }
    setIsRecordingVoice(false)
    setRecordingSeconds(0)
  }

  // File Upload handler
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadMedia) return
    setMediaUploading(true)
    setAttachmentMenuOpen(false)

    try {
      const mediaMeta = await onUploadMedia(file)
      let messageType = 'document'
      if (file.type.startsWith('image/')) messageType = 'image'
      else if (file.type.startsWith('video/')) messageType = 'video'
      else if (file.type.startsWith('audio/')) messageType = 'audio'

      onSendMessage('', {
        messageType,
        media: mediaMeta,
        replyToId: replyingTo?.id
      })
      setReplyingTo(null)
      toast.success('Media shared successfully!')
    } catch (err) {
      toast.error(err.message || 'Media upload failed.')
    } finally {
      setMediaUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Location share handler
  const handleShareCurrentLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser.')
    }
    setAttachmentMenuOpen(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSendMessage('📍 Shared Current Location', {
          messageType: 'location',
          locationData: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: 'Current Location'
          },
          replyToId: replyingTo?.id
        })
        setReplyingTo(null)
        toast.success('Location shared!')
      },
      () => toast.error('Unable to fetch GPS location.')
    )
  }

  // Sending text message
  const handleSend = () => {
    if (editingMessage) {
      if (!editText.trim()) return
      onEditMessage?.(editingMessage.id, editText.trim())
      setEditingMessage(null)
      setEditText('')
      return
    }

    if (!inputText.trim()) return
    onSendMessage(inputText.trim(), {
      messageType: 'text',
      replyToId: replyingTo?.id
    })
    setInputText('')
    setReplyingTo(null)
    setEmojiPickerOpen(false)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Ticks status icon renderer
  const renderStatusTicks = (msg) => {
    if (msg.sender_id !== currentUserId) return null

    if (msg.status === 'sending') {
      return <span style={{ fontSize: '10px', color: '#9ba6ad' }}>🕒</span>
    }
    if (msg.status === 'failed') {
      return (
        <span
          onClick={(e) => {
            e.stopPropagation()
            onSendMessage(msg.message_text, { clientTempId: msg.client_temp_id, messageType: msg.message_type, media: msg.media })
          }}
          style={{ fontSize: '11px', color: '#ff5470', cursor: 'pointer', fontWeight: '800' }}
          title="Failed. Tap to retry"
        >
          ⚠️
        </span>
      )
    }

    const isReadByAll = msg.Reads && msg.Reads.length > 1
    const isDelivered = msg.Deliveries && msg.Deliveries.length > 1

    if (isReadByAll) {
      return <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '900' }}>✓✓</span>
    }
    if (isDelivered) {
      return <span style={{ fontSize: '11px', color: '#9ba6ad', fontWeight: '800' }}>✓✓</span>
    }
    return <span style={{ fontSize: '11px', color: '#9ba6ad' }}>✓</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '620px', background: '#161c22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', overflow: 'hidden', position: 'relative' }}>
      
      {/* Top Action Bar (In-Chat Search, Media Gallery, Starred) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#1a2129', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#f3f1ea' }}>Trip Room Chat</span>
          <span style={{ fontSize: '11px', color: '#9ba6ad', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '12px' }}>
            {safeMessages.length} messages
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{ background: searchOpen ? 'rgba(255,106,44,0.15)' : 'none', border: 'none', color: searchOpen ? '#ff6a2c' : '#9ba6ad', cursor: 'pointer', fontSize: '14px', padding: '6px 8px', borderRadius: '8px' }}
            title="Search in chat"
          >
            🔍
          </button>
          <button
            onClick={() => setGalleryOpen(true)}
            style={{ background: 'none', border: 'none', color: '#9ba6ad', cursor: 'pointer', fontSize: '14px', padding: '6px 8px', borderRadius: '8px' }}
            title="Media, Links & Docs"
          >
            📁
          </button>
          <button
            onClick={() => setStarredOpen(true)}
            style={{ background: 'none', border: 'none', color: '#ffc94d', cursor: 'pointer', fontSize: '14px', padding: '6px 8px', borderRadius: '8px' }}
            title="Starred Messages"
          >
            ⭐
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar View */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#11161b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat..."
              autoFocus
              style={{ flex: 1, background: '#1c242c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 12px', color: '#f3f1ea', fontSize: '12px', outline: 'none' }}
            />
            {searchMatches.length > 0 && (
              <span style={{ fontSize: '11px', color: '#9ba6ad' }}>
                {currentMatchIndex + 1} of {searchMatches.length}
              </span>
            )}
            <button onClick={handlePrevSearchMatch} disabled={searchMatches.length === 0} style={{ background: 'none', border: 'none', color: '#9ba6ad', cursor: 'pointer', fontSize: '14px' }}>▲</button>
            <button onClick={handleNextSearchMatch} disabled={searchMatches.length === 0} style={{ background: 'none', border: 'none', color: '#9ba6ad', cursor: 'pointer', fontSize: '14px' }}>▼</button>
            <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} style={{ background: 'none', border: 'none', color: '#ff5470', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Messages Viewport */}
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        style={{ flex: 1, minHeight: 0, background: '#0e1216', position: 'relative', overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}
        className="scrollbar-thin"
      >
        {/* Load older messages indicator */}
        {hasMoreOlder && (
          <div style={{ textAlign: 'center', padding: '6px' }}>
            <button
              onClick={onLoadOlderMessages}
              disabled={loadingOlder}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ba6ad', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}
            >
              {loadingOlder ? 'Loading older...' : '↑ Load older messages'}
            </button>
          </div>
        )}

        {safeMessages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px', opacity: 0.8 }}>
            <span style={{ fontSize: '36px' }}>💬</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#f3f1ea' }}>Trip Room Chat</span>
            <p style={{ fontSize: '12px', color: '#9ba6ad', maxWidth: '280px' }}>Say hello, share live locations, split trip costs, and plan your journey!</p>
          </div>
        ) : (
          messageGroups.map((group, gIdx) => (
            <React.Fragment key={group.day || gIdx}>
              {/* Sticky Date Separator */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                <span style={{ background: '#1c242c', border: '1px solid rgba(255,255,255,0.08)', color: '#9ba6ad', fontSize: '10px', fontWeight: '800', padding: '3px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {formatDateSeparator(group.day)}
                </span>
              </div>

              {group.messages.map((msg, mIdx) => {
                if (!msg) return null
                const isOwn = msg.sender_id === currentUserId
                const senderName = msg.Sender?.Profile?.name || 'Explorer'
                const senderAvatar = msg.Sender?.Profile?.avatar_url
                const trustScore = msg.Sender?.trust_score || 50
                const isConsecutive = mIdx > 0 && group.messages[mIdx - 1]?.sender_id === msg.sender_id

                // System message renderer
                if (msg.message_type?.includes('system')) {
                  return (
                    <div key={msg.id || mIdx} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                      <span style={{ background: 'rgba(79,190,142,0.12)', border: '1px solid rgba(79,190,142,0.2)', color: '#4fbe8e', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '14px' }}>
                        {msg.message_text}
                      </span>
                    </div>
                  )
                }

                // Announcement message renderer
                if (msg.message_type === 'announcement') {
                  return (
                    <div key={msg.id || mIdx} style={{ margin: '6px 0' }}>
                      <div style={{ background: 'rgba(255,201,77,0.08)', border: '1px solid #ffc94d', padding: '12px 16px', borderRadius: '16px', display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>📢</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '11px', fontWeight: '900', color: '#ffc94d', textTransform: 'uppercase' }}>Host Announcement by {senderName}</span>
                          <p style={{ fontSize: '13px', color: '#f3f1ea', marginTop: '2px', fontWeight: '600' }}>{msg.message_text}</p>
                          <span style={{ fontSize: '10px', color: '#9ba6ad' }}>{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  )
                }

                // Deleted message
                if (msg.deleted_for === 'everyone') {
                  return (
                    <div key={msg.id || mIdx} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', margin: '2px 0' }}>
                      <div style={{ background: '#1c242c', border: '1px solid rgba(255,255,255,0.06)', color: '#6b757c', fontSize: '12px', fontStyle: 'italic', padding: '6px 12px', borderRadius: '12px' }}>
                        🚫 This message was deleted
                      </div>
                    </div>
                  )
                }

                // Regular chat bubble
                return (
                  <div
                    key={msg.id || mIdx}
                    id={`msg-${msg.id}`}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setActiveContextMenuMsg(msg)
                    }}
                    style={{ display: 'flex', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', marginTop: isConsecutive ? '2px' : '8px' }}
                  >
                    {/* Avatar on first consecutive message */}
                    {!isOwn && (
                      <div style={{ width: '28px', height: '28px', visibility: isConsecutive ? 'hidden' : 'visible' }}>
                        <Avatar src={senderAvatar} name={senderName} size="xs" score={trustScore} />
                      </div>
                    )}

                    {/* Bubble container */}
                    <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                      
                      {/* Sender name for group clarity */}
                      {!isOwn && !isConsecutive && (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff6a2c', marginBottom: '2px', paddingLeft: '4px' }}>
                          {senderName}
                        </span>
                      )}

                      {/* Bubble card */}
                      <div
                        style={{
                          background: isOwn ? 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)' : '#1f2730',
                          color: isOwn ? '#1a0e08' : '#f3f1ea',
                          borderRadius: '16px',
                          borderTopRightRadius: isOwn ? (isConsecutive ? '16px' : '4px') : '16px',
                          borderTopLeftRadius: !isOwn ? (isConsecutive ? '16px' : '4px') : '16px',
                          padding: '8px 12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          position: 'relative',
                          border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.06)'
                        }}
                      >
                        {/* Quoted Reply block */}
                        {msg.ReplyTo && (
                          <div
                            onClick={() => scrollToMessageId(msg.ReplyTo.id)}
                            style={{
                              background: isOwn ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                              borderLeft: `3px solid ${isOwn ? '#1a0e08' : '#ff6a2c'}`,
                              borderRadius: '8px',
                              padding: '4px 8px',
                              marginBottom: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontSize: '10px', fontWeight: '800', color: isOwn ? '#1a0e08' : '#ff6a2c' }}>
                              {msg.ReplyTo.Sender?.Profile?.name || 'Replied Message'}
                            </span>
                            <p style={{ fontSize: '11px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                              {msg.ReplyTo.message_text || 'Media attachment'}
                            </p>
                          </div>
                        )}

                        {/* Rich Media Renderers */}
                        {/* Image */}
                        {msg.message_type === 'image' && msg.media?.url && (
                          <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '6px', cursor: 'pointer' }} onClick={() => setLightboxMedia(msg.media.url)}>
                            <img src={msg.media.url} alt="Shared" style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '10px' }} />
                          </div>
                        )}

                        {/* Video */}
                        {msg.message_type === 'video' && msg.media?.url && (
                          <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                            <video src={msg.media.url} controls style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '10px' }} />
                          </div>
                        )}

                        {/* Voice note / Audio */}
                        {msg.message_type === 'audio' && msg.media?.url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', minWidth: '180px' }}>
                            <button
                              onClick={() => handleTogglePlayAudio(msg.id, msg.media.url)}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', background: isOwn ? '#1a0e08' : '#ff6a2c', color: isOwn ? '#ff6a2c' : '#1a0e08', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}
                            >
                              {playingAudioId === msg.id ? '⏸' : '▶'}
                            </button>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                                <motion.div animate={{ width: playingAudioId === msg.id ? '100%' : '0%' }} transition={{ duration: msg.media?.duration || 5, ease: 'linear' }} style={{ height: '100%', background: isOwn ? '#1a0e08' : '#ff6a2c', borderRadius: '2px' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.8 }}>
                                <span>🎤 {formatDuration(msg.media?.duration)}</span>
                                <span onClick={handleCyclePlaybackRate} style={{ cursor: 'pointer', fontWeight: '800' }}>{audioPlaybackRate}x</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Document */}
                        {msg.message_type === 'document' && msg.media?.url && (
                          <a href={msg.media.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', textDecoration: 'none', color: 'inherit', marginBottom: '4px' }}>
                            <span style={{ fontSize: '20px' }}>📄</span>
                            <div style={{ overflow: 'hidden' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{msg.media.filename || 'Document'}</span>
                              <span style={{ fontSize: '10px', opacity: 0.7 }}>{(msg.media.size / 1024).toFixed(0)} KB</span>
                            </div>
                          </a>
                        )}

                        {/* Location */}
                        {msg.message_type === 'location' && msg.location_data && (
                          <a href={`https://maps.google.com/?q=${msg.location_data.latitude},${msg.location_data.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '10px', textDecoration: 'none', color: 'inherit', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '18px' }}>📍</span>
                              <span style={{ fontSize: '12px', fontWeight: '800' }}>{msg.location_data.label || 'Location'}</span>
                            </div>
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>Tap to open in Google Maps</span>
                          </a>
                        )}

                        {/* Message Text */}
                        {msg.message_text && (
                          <p style={{ fontSize: '13px', lineHeight: 1.4, margin: 0, fontWeight: '500', wordBreak: 'break-word' }}>
                            {msg.message_text}
                          </p>
                        )}

                        {/* Message Meta (Timestamp, Edited, Star, Ticks) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '3px', fontSize: '10px', opacity: 0.75 }}>
                          {msg.is_starred && <span>⭐</span>}
                          {msg.edited_at && <span>(edited)</span>}
                          <span>{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {renderStatusTicks(msg)}
                        </div>
                      </div>

                      {/* Reactions Summary Pill */}
                      {msg.Reactions && msg.Reactions.length > 0 && (
                        <div
                          onClick={() => setSelectedReactionMessage(msg)}
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#1c242c', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', marginTop: '-6px', zIndex: 2, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                        >
                          {Array.from(new Set(msg.Reactions.map((r) => r.emoji))).slice(0, 3).map((emoji) => (
                            <span key={emoji} style={{ fontSize: '11px' }}>{emoji}</span>
                          ))}
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ba6ad', marginLeft: '2px' }}>{msg.Reactions.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            style={{ position: 'absolute', bottom: '72px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: '#1f2730', border: '1px solid rgba(255,255,255,0.15)', color: '#f3f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.4)', cursor: 'pointer', zIndex: 10 }}
          >
            ↓
            {unreadCountBelow > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ff6a2c', color: '#1a0e08', fontSize: '10px', fontWeight: '900', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCountBelow}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Typing Indicator Bar */}
      <AnimatePresence>
        {safeTypingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '4px 16px', background: '#161c22', fontSize: '11px', color: '#9ba6ad', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontWeight: '700' }}>
              {safeTypingUsers.length === 1
                ? `${safeTypingUsers[0]?.userName || 'Traveler'} is typing...`
                : safeTypingUsers.length === 2
                ? `${safeTypingUsers[0]?.userName} and ${safeTypingUsers[1]?.userName} are typing...`
                : 'Several travelers are typing...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replying-to Preview Banner */}
      {replyingTo && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', background: '#1c242c', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ borderLeft: '3px solid #ff6a2c', paddingLeft: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#ff6a2c' }}>Replying to {replyingTo.Sender?.Profile?.name || 'Traveler'}</span>
            <p style={{ fontSize: '11px', color: '#9ba6ad', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
              {replyingTo.message_text || 'Media attachment'}
            </p>
          </div>
          <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#ff5470', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Editing Message Banner */}
      {editingMessage && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', background: '#1c242c', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#38bdf8' }}>Editing Message</span>
            <p style={{ fontSize: '11px', color: '#9ba6ad', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
              {editingMessage.message_text}
            </p>
          </div>
          <button onClick={() => { setEditingMessage(null); setEditText('') }} style={{ background: 'none', border: 'none', color: '#ff5470', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Composer Input Area */}
      <div style={{ padding: '8px 12px', background: '#1a2129', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'flex-end', gap: '8px', position: 'relative' }}>
        
        {/* Attachment & Emoji Trigger Buttons */}
        <button
          onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
          style={{ background: 'none', border: 'none', color: '#9ba6ad', fontSize: '18px', cursor: 'pointer', padding: '6px' }}
          title="Emoji Picker"
        >
          😊
        </button>

        <button
          onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
          style={{ background: 'none', border: 'none', color: '#9ba6ad', fontSize: '18px', cursor: 'pointer', padding: '6px' }}
          title="Attach media or files"
        >
          📎
        </button>

        <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} />

        {/* Attachment Bottom Sheet / Popover */}
        <AnimatePresence>
          {attachmentMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{ position: 'absolute', bottom: '60px', left: '16px', background: '#1f2730', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 12px 28px rgba(0,0,0,0.4)', zIndex: 20, minWidth: '180px' }}
            >
              <button
                onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*,video/*'); fileInputRef.current?.click() }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f3f1ea', fontSize: '12px', fontWeight: '600', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
              >
                📸 Photos & Videos
              </button>
              <button
                onClick={() => { fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.txt'); fileInputRef.current?.click() }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f3f1ea', fontSize: '12px', fontWeight: '600', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
              >
                📄 Document / PDF
              </button>
              <button
                onClick={handleShareCurrentLocation}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f3f1ea', fontSize: '12px', fontWeight: '600', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
              >
                📍 Current Location
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Quick Picker */}
        <AnimatePresence>
          {emojiPickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{ position: 'absolute', bottom: '60px', left: '16px', background: '#1f2730', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '8px 12px', display: 'flex', gap: '6px', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
            >
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText((prev) => prev + emoji)
                    setEmojiPickerOpen(false)
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-growing Textarea Input / Voice recording status */}
        {isRecordingVoice ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,84,112,0.15)', borderRadius: '12px', border: '1px solid #ff5470' }}>
            <span style={{ fontSize: '12px', color: '#ff5470', fontWeight: '800' }}>🔴 Recording: {formatDuration(recordingSeconds)}</span>
            <button onClick={() => stopVoiceRecording(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff5470', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Cancel ✕</button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={editingMessage ? editText : inputText}
            onChange={(e) => (editingMessage ? setEditText(e.target.value) : setInputText(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? 'Update message...' : 'Message trip room...'}
            style={{ flex: 1, maxHeight: '96px', background: '#212b33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '8px 12px', fontSize: '13px', color: '#f3f1ea', resize: 'none', outline: 'none', lineHeight: 1.4 }}
          />
        )}

        {/* Action Button: Morph between Send / Mic */}
        {isRecordingVoice ? (
          <button
            onClick={() => stopVoiceRecording(false)}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4fbe8e', color: '#1a0e08', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}
          >
            ✓
          </button>
        ) : (inputText.trim() || editText.trim() || mediaUploading) ? (
          <button
            onClick={handleSend}
            disabled={mediaUploading}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)', color: '#1a0e08', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' }}
          >
            {mediaUploading ? '⏳' : '➔'}
          </button>
        ) : (
          <button
            onClick={startVoiceRecording}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#212b33', color: '#9ba6ad', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
            title="Record Voice Note"
          >
            🎙️
          </button>
        )}
      </div>

      {/* Message Context Action Modal */}
      {activeContextMenuMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setActiveContextMenuMsg(null)}>
          <div style={{ background: '#1f2730', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '16px', width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Quick Reactions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {COMMON_EMOJIS.slice(0, 6).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onAddReaction?.(activeContextMenuMsg.id, emoji)
                    setActiveContextMenuMsg(null)
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Actions */}
            <button onClick={() => { setReplyingTo(activeContextMenuMsg); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f3f1ea', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}>
              ↩ Reply
            </button>
            <button onClick={() => { setForwardModalMessage(activeContextMenuMsg); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f3f1ea', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}>
              ↗ Forward
            </button>
            <button onClick={() => { if (activeContextMenuMsg.is_starred) onUnstarMessage?.(activeContextMenuMsg.id); else onStarMessage?.(activeContextMenuMsg.id); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f3f1ea', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}>
              ⭐ {activeContextMenuMsg.is_starred ? 'Unstar Message' : 'Star Message'}
            </button>
            {activeContextMenuMsg.message_text && (
              <button onClick={() => { navigator.clipboard.writeText(activeContextMenuMsg.message_text); toast.success('Copied to clipboard!'); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#f3f1ea', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}>
                📋 Copy Text
              </button>
            )}
            {activeContextMenuMsg.sender_id === currentUserId && (Date.now() - new Date(activeContextMenuMsg.created_at).getTime()) < 15 * 60 * 1000 && (
              <button onClick={() => { setEditingMessage(activeContextMenuMsg); setEditText(activeContextMenuMsg.message_text || ''); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#38bdf8', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}>
                ✏ Edit (15m window)
              </button>
            )}
            <button onClick={() => { onDeleteMessage?.(activeContextMenuMsg.id, 'me'); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ff5470', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}>
              🗑 Delete for Me
            </button>
            {(activeContextMenuMsg.sender_id === currentUserId || isHost) && (
              <button onClick={() => { onDeleteMessage?.(activeContextMenuMsg.id, 'everyone'); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ff5470', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer', fontWeight: '700' }}>
                🚫 Delete for Everyone
              </button>
            )}
            <button onClick={() => { setReportModalMessage(activeContextMenuMsg); setActiveContextMenuMsg(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#9ba6ad', fontSize: '13px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}>
              🚨 Report
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Media Viewer Modal */}
      {lightboxMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setLightboxMedia(null)}>
          <img src={lightboxMedia} alt="Enlarged view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }} />
        </div>
      )}

      {/* Starred Messages View Modal */}
      {starredOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '400px', maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffc94d' }}>⭐ Starred Messages</span>
              <button onClick={() => setStarredOpen(false)} style={{ background: 'none', border: 'none', color: '#9ba6ad', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {safeMessages.filter((m) => m.is_starred).length === 0 ? (
                <p style={{ fontSize: '12px', color: '#9ba6ad', textAlign: 'center', margin: '20px 0' }}>No starred messages yet.</p>
              ) : (
                safeMessages.filter((m) => m.is_starred).map((msg) => (
                  <div key={msg.id} style={{ background: '#212b33', padding: '10px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff6a2c' }}>{msg.Sender?.Profile?.name || 'Traveler'}</span>
                    <p style={{ fontSize: '12px', color: '#f3f1ea', margin: '4px 0' }}>{msg.message_text}</p>
                    <span style={{ fontSize: '10px', color: '#9ba6ad' }}>{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media & Docs Gallery Modal */}
      {galleryOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '440px', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#f3f1ea' }}>📁 Shared Content</span>
              <button onClick={() => setGalleryOpen(false)} style={{ background: 'none', border: 'none', color: '#9ba6ad', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              {['media', 'docs', 'links'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGalleryTab(tab)}
                  style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize', color: galleryTab === tab ? '#ff6a2c' : '#9ba6ad', cursor: 'pointer' }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {safeMessages.filter((m) => m.media || (galleryTab === 'links' && m.message_text?.includes('http'))).length === 0 ? (
                <p style={{ fontSize: '12px', color: '#9ba6ad', textAlign: 'center', margin: '20px 0' }}>No shared {galleryTab} found.</p>
              ) : (
                safeMessages
                  .filter((m) => (galleryTab === 'media' && ['image', 'video'].includes(m.message_type)) || (galleryTab === 'docs' && ['document', 'audio'].includes(m.message_type)) || (galleryTab === 'links' && m.message_text?.includes('http')))
                  .map((msg) => (
                    <div key={msg.id} style={{ background: '#212b33', padding: '8px', borderRadius: '10px' }}>
                      {msg.media?.url && <a href={msg.media.url} target="_blank" rel="noreferrer" style={{ color: '#ff6a2c', fontSize: '12px' }}>{msg.media.filename || msg.media.url}</a>}
                      {msg.message_text && <p style={{ fontSize: '12px', color: '#f3f1ea', margin: '2px 0' }}>{msg.message_text}</p>}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwardModalMessage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#f3f1ea' }}>Forward Message</span>
            <input
              type="text"
              value={targetRoomInput}
              onChange={(e) => setTargetRoomInput(e.target.value)}
              placeholder="Enter Target Trip ID / Room ID"
              style={{ background: '#212b33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', color: '#f3f1ea', fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (!targetRoomInput.trim()) return toast.error('Please enter a target Room ID')
                  onForwardMessage?.(forwardModalMessage.id, targetRoomInput.trim())
                  setForwardModalMessage(null)
                  setTargetRoomInput('')
                  toast.success('Message forwarded!')
                }}
                style={{ flex: 1, background: '#ff6a2c', color: '#1a0e08', border: 'none', borderRadius: '10px', padding: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Forward
              </button>
              <button onClick={() => setForwardModalMessage(null)} style={{ background: '#212b33', border: '1px solid rgba(255,255,255,0.1)', color: '#9ba6ad', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalMessage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#ff5470' }}>🚨 Report Message</span>
            <p style={{ fontSize: '12px', color: '#f3f1ea', fontStyle: 'italic' }}>"{reportModalMessage.message_text}"</p>
            <button
              onClick={() => {
                onReportMessage?.(reportModalMessage)
                setReportModalMessage(null)
                toast.success('Message reported to moderators.')
              }}
              style={{ background: '#ff5470', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
            >
              Submit Report
            </button>
            <button onClick={() => setReportModalMessage(null)} style={{ background: '#212b33', border: '1px solid rgba(255,255,255,0.1)', color: '#9ba6ad', borderRadius: '10px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatTab
export { ChatTab }
