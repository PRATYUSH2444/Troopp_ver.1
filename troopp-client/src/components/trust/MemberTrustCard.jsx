import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import ScoreBar from '../common/ScoreBar.jsx'
import TrustCircle from './TrustCircle.jsx'

/**
 * Premium Trust Card Modal showing full behavioral reputation metrics.
 */
const MemberTrustCard = ({
  isOpen,
  onClose,
  userData,
  viewMode = 'member', // 'member' | 'host'
  onAccept,
  onDecline
}) => {
  if (!isOpen || !userData) return null

  const {
    name,
    avatar_url,
    trust_score = 50,
    reliability_score = 100,
    trips_completed = 0,
    positive_rating_pct = 100,
    tenure_months = 1,
    has_valid_reports = false,
    last_traveled_date = 'N/A',
    mutual_connections = []
  } = userData

  const [currentTrust, setCurrentTrust] = useState(trust_score)
  const [currentReliability, setCurrentReliability] = useState(reliability_score)
  const [isCloseHovered, setIsCloseHovered] = useState(false)
  const [isDeclineHovered, setIsDeclineHovered] = useState(false)
  const [isAcceptHovered, setIsAcceptHovered] = useState(false)

  useEffect(() => {
    setCurrentTrust(trust_score)
    setCurrentReliability(reliability_score)
  }, [userData, trust_score, reliability_score])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 13, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow-card), 0 24px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        
        {/* Header Close Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <span style={{ fontSize: '10px', fontWeight: '850', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>
            Member Behavioral Profile
          </span>
          <button
            onClick={onClose}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: isCloseHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              transition: 'all 150ms ease'
            }}
          >
            ✕
          </button>
        </div>

        {/* Profile Card Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar src={avatar_url} name={name} size="lg" score={currentTrust} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              {name}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Troopp member since {tenure_months} month{tenure_months > 1 ? 's' : ''} ago
            </span>
          </div>
        </div>

        {/* Reputation Score Metrics Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '16px',
          alignItems: 'center',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          padding: '18px',
          borderRadius: '16px'
        }}>
          {/* Trust Circle component dial */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid var(--border)', paddingRight: '8px' }}>
            <TrustCircle score={currentTrust} size={90} />
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '6px' }}>
              Trust Score
            </span>
          </div>

          {/* Reliability Score Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reliability: <span style={{ color: 'var(--moss)', fontWeight: '950' }}>{currentReliability}%</span>
            </span>
            <ScoreBar score={currentReliability} />
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Based on showing up to confirmed trips.
            </span>
          </div>
        </div>

        {/* Simulator Panel (Darkened & Sleek) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          background: '#10151a',
          padding: '10px 14px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.04)'
        }}>
          <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Simulator:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentTrust((prev) => Math.min(100, prev + 25))}
              style={{
                padding: '4px 10px',
                background: 'rgba(79,190,142,0.08)',
                border: '1px solid rgba(79,190,142,0.2)',
                color: 'var(--moss)',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              +25 Trust
            </button>
            <button
              onClick={() => setCurrentReliability((prev) => Math.max(0, prev - 15))}
              style={{
                padding: '4px 10px',
                background: 'rgba(239,83,80,0.08)',
                border: '1px solid rgba(239,83,80,0.2)',
                color: '#ef5350',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              -15 Reliability
            </button>
          </div>
        </div>

        {/* Engagement Stats Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Engagement Stats
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '12px 6px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{trips_completed}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Trips Done</span>
            </div>
            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '12px 6px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{positive_rating_pct}%</span>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Positive Rate</span>
            </div>
            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '12px 6px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: has_valid_reports ? '#ef5350' : 'var(--moss)',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {has_valid_reports ? '🚨 Flagged' : '✅ Clear'}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Report History</span>
            </div>
          </div>
        </div>

        {/* Mutual Connections Overlay */}
        {mutual_connections && mutual_connections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mutual Connections
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              You and {name} both follow {mutual_connections.join(' and ')}
            </span>
          </div>
        )}

        {/* Trip details footer */}
        {last_traveled_date && last_traveled_date !== 'N/A' && (
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            🕒 Last active on a trip: {last_traveled_date}
          </div>
        )}

        {/* Action Panel */}
        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '18px', marginTop: '4px' }}>
          {viewMode === 'host' ? (
            <>
              <button
                onClick={onDecline}
                onMouseEnter={() => setIsDeclineHovered(true)}
                onMouseLeave={() => setIsDeclineHovered(false)}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '12px',
                  background: isDeclineHovered ? 'rgba(239,83,80,0.14)' : 'rgba(239,83,80,0.06)',
                  border: '1px solid rgba(239,83,80,0.2)',
                  color: '#ef5350',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                Decline Join
              </button>
              <button
                onClick={onAccept}
                onMouseEnter={() => setIsAcceptHovered(true)}
                onMouseLeave={() => setIsAcceptHovered(false)}
                style={{
                  flex: 2,
                  height: '42px',
                  borderRadius: '12px',
                  background: isAcceptHovered ? 'rgba(79,190,142,0.9)' : 'var(--moss)',
                  border: 'none',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: '0 4px 14px rgba(79,190,142,0.3)'
                }}
              >
                Approve & Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              Close Profile
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default MemberTrustCard
export { MemberTrustCard }
