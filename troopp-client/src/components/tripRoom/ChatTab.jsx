import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'

/**
 * Renders the real-time chat tab with auto-scrolling messages list.
 */
const ChatTab = ({ messages = [], typingUsers = [], onSendMessage, currentUserId, onReportMessage }) => {
  const [inputText, setInputText] = useState('')
  const [reportModalMessage, setReportModalMessage] = useState(null)
  
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = () => {
    if (!inputText.trim()) return
    onSendMessage(inputText.trim())
    setInputText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const safeMessages = Array.isArray(messages) ? messages : []
  const safeTypingUsers = Array.isArray(typingUsers) ? typingUsers : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '500px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', overflow: 'hidden' }} ref={containerRef}>
      
      {/* Messages Viewport */}
      <div style={{ flex: 1, minHeight: 0, background: '#10151a', position: 'relative', overflowY: 'auto', padding: '12px 0' }} className="scrollbar-thin">
        {safeMessages.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
            <span style={{ fontSize: '32px' }}>💬</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#9ba6ad' }}>Start chatting below</span>
            <p style={{ fontSize: '11px', color: '#6b757c', maxWidth: '240px' }}>Introduce yourself to other members before setting off.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safeMessages.map((msg, index) => {
              if (!msg) return null

              const isOwn = msg.sender_id === currentUserId
              const senderName = msg.Sender?.Profile?.name || 'Explorer'
              const senderAvatar = msg.Sender?.Profile?.avatar_url
              const trustScore = msg.Sender?.trust_score || 50

              if (msg.message_type === 'announcement') {
                return (
                  <div key={msg.id || index} style={{ padding: '4px 16px' }}>
                    <div style={{ background: 'rgba(255,201,77,0.06)', border: '1px solid #ffc94d', padding: '14px', borderRadius: '16px', display: 'flex', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,201,77,0.16)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px', color: '#ffc94d' }}>
                        📢
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffc94d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Announcement by {senderName}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#f3f1ea', lineHeight: '1.4', fontWeight: '600' }}>
                          {msg.message_text}
                        </p>
                        <span style={{ fontSize: '10px', color: '#6b757c', marginTop: '2px' }}>
                          {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              if (msg.message_type === 'member_joined_system') {
                return (
                  <div key={msg.id || index} style={{ padding: '4px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      style={{
                        width: '100%',
                        background: 'rgba(79,190,142,0.1)',
                        border: '1px solid rgba(79,190,142,0.2)',
                        color: '#4fbe8e',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                    >
                      🎉 {msg.message_text}
                    </motion.div>
                  </div>
                )
              }

              if (msg.message_type === 'system') {
                return (
                  <div key={msg.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#6b757c', fontStyle: 'italic', padding: '2px 16px' }}>
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {msg.message_text}
                    </motion.span>
                  </div>
                )
              }

              // Default chat text bubble
              const isSending = msg.status === 'sending'
              return (
                <div
                  key={msg.id || index}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setReportModalMessage(msg)
                  }}
                  onClick={() => {
                    setReportModalMessage(msg)
                  }}
                >
                  <motion.div
                    initial={{ x: isOwn ? 20 : -20, scale: 0.95, opacity: 0 }}
                    animate={{ x: 0, scale: 1, opacity: isSending ? 0.6 : 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    style={{ display: 'flex', gap: '10px', padding: '4px 16px', flexDirection: isOwn ? 'row-reverse' : 'row' }}
                  >
                    {/* Avatar */}
                    <div style={{ flexShrink: 0 }}>
                      <Avatar src={senderAvatar} name={senderName} size="sm" score={trustScore} />
                    </div>

                    {/* Bubble */}
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', marginBottom: '2px', padding: '0 4px' }}>
                        {senderName} · <span style={{ fontSize: '10px', fontWeight: '700', color: '#ff6a2c' }}>{trustScore}</span>
                      </span>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '14px',
                          fontSize: '13px',
                          lineHeight: 1.4,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          transition: 'all 300ms ease',
                          background: isOwn ? 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)' : '#212b33',
                          color: isOwn ? '#1a0e08' : '#f3f1ea',
                          border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          borderTopRightRadius: isOwn ? '0px' : '14px',
                          borderTopLeftRadius: isOwn ? '14px' : '0px'
                        }}
                      >
                        {msg.message_text}
                      </div>
                      {!isSending && (
                        <span style={{ fontSize: '10px', color: '#6b757c', marginTop: '4px', padding: '0 4px' }}>
                          {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {safeTypingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, duration: 0.2 }}
            style={{
              padding: '6px 16px',
              background: '#1a2129',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: '11px',
              color: '#9ba6ad',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              originX: 0
            }}
          >
            <span style={{ fontWeight: '700' }}>{safeTypingUsers.map((u) => u?.userName || 'Traveler').join(', ')}</span> is typing
            <span style={{ display: 'flex', gap: '3px', marginLeft: '4px', alignItems: 'center', height: '8px' }}>
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }}
                style={{ width: '4px', height: '4px', background: '#9ba6ad', borderRadius: '50%' }}
              />
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }}
                style={{ width: '4px', height: '4px', background: '#9ba6ad', borderRadius: '50%' }}
              />
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }}
                style={{ width: '4px', height: '4px', background: '#9ba6ad', borderRadius: '50%' }}
              />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Textarea Input Bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px', display: 'flex', gap: '10px', alignItems: 'end', background: '#1a2129' }}>
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message group chat..."
          style={{
            flex: 1,
            maxHeight: '96px',
            background: '#212b33',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#f3f1ea',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.4
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transition: 'all 150ms ease',
            border: 'none',
            background: inputText.trim()
              ? 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)'
              : '#212b33',
            color: inputText.trim() ? '#1a0e08' : '#6b757c',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          ➔
        </button>
      </div>

      {/* Report context menu dialog */}
      {reportModalMessage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,16,19,0.75)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '320px', boxShadow: '0 12px 36px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ba6ad' }}>Message Operations</h4>
              <p style={{ fontSize: '12px', color: '#f3f1ea', fontStyle: 'italic', marginTop: '6px' }}>"{reportModalMessage.message_text}"</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  onReportMessage(reportModalMessage)
                  setReportModalMessage(null)
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  background: 'rgba(255,84,112,0.14)',
                  color: '#ff5470',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background-color 150ms'
                }}
              >
                🚨 Report this Message
              </button>
              <button
                onClick={() => setReportModalMessage(null)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#212b33',
                  borderRadius: '12px',
                  color: '#9ba6ad',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatTab
export { ChatTab }
