import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { apiRequest } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'
import ActivityCard from '../components/activity/ActivityCard.jsx'
import MagicBento from '../components/landing/MagicBento.jsx'
import DotField from '../components/landing/DotField.jsx'
import BorderGlow from '../components/landing/BorderGlow.jsx'
import TrooppShowcase from '../components/landing/TrooppShowcase.jsx'
import './Landing.css'

// Static adventure categories list
const CATEGORIES = [
  { label: '🏔 Trek', desc: 'Mountain expeditions and trail climbs' },
  { label: '🚴 Cycling', desc: 'Highway loops and gravel tours' },
  { label: '🚗 Road Trip', desc: 'Scenic interstate highway routes' },
  { label: '🌙 Night Drive', desc: 'Midnight highway drives' },
  { label: '⛺ Camping', desc: 'Campfire stays and wilderness sites' },
  { label: '🏛 Heritage Walk', desc: 'Ancient monuments and guided walks' },
  { label: '📸 Photography Walk', desc: 'Scenic visual walkabouts' },
  { label: '☀️ Day Trip', desc: 'Single-day outdoor matches' }
]

const CATEGORIES_CONFIG = {
  '🏔 Trek': {
    title: 'Trekking',
    accent: '#10b981', // Emerald Green
    hsl: '160 84 39',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
      </svg>
    )
  },
  '🚴 Cycling': {
    title: 'Cycling',
    accent: '#0ea5e9', // Sky Blue
    hsl: '199 89 48',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 12H5.5M12 17.5V14l-3-4h3l3.5 3"/>
      </svg>
    )
  },
  '🚗 Road Trip': {
    title: 'Road Trip',
    accent: '#ff6a2c', // Orange
    hsl: '17 100 58',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M13 17h2M9 17h4"/>
      </svg>
    )
  },
  '🌙 Night Drive': {
    title: 'Night Drive',
    accent: '#a855f7', // Purple
    hsl: '270 91 65',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>
    )
  },
  '⛺ Camping': {
    title: 'Camping',
    accent: '#22c55e', // Forest Green
    hsl: '142 70 45',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21 12 4 5 21M12 4v17M10 12h4M2 21h20"/>
      </svg>
    )
  },
  '🏛 Heritage Walk': {
    title: 'Heritage Walk',
    accent: '#f59e0b', // Amber
    hsl: '38 92 50',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18v-8M8 18v-8M12 18v-8M16 18v-8M20 18v-8M2 20h20M2 22h20M3 8l9-5 9 5"/>
      </svg>
    )
  },
  '📸 Photography Walk': {
    title: 'Photography Walk',
    accent: '#8b5cf6', // Violet
    hsl: '258 90 66',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
      </svg>
    )
  },
  '☀️ Day Trip': {
    title: 'Day Trip',
    accent: '#eab308', // Yellow
    hsl: '45 93 47',
    icon: (color) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>
    )
  }
}

// FAQ Items
const FAQ_ITEMS = [
  {
    q: 'How does the Behavioral Trust Score work?',
    a: 'Your trust score starts at 50 and increases as you complete profile milestones, add emergency contacts (+10), and receive high reliability reviews from co-travelers after completed trips. Cancellations or verified rule violations result in deductions.'
  },
  {
    q: 'What happens if I trigger the SOS emergency trigger?',
    a: 'Triggering SOS instantly broadcasts your GPS coordinates to all other trip room participants via WebSockets, and logs outbound Twilio SMS messages notifying your pre-configured emergency contacts with live tracking links.'
  },
  {
    q: 'Can I host women-only activities on Troopp?',
    a: 'Absolutely. Hostesses can flag an activity as "Women Only" during creation. The platform validates travelers seeking to join against their profile gender, maintaining safe, gated spaces.'
  }
]

const Landing = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Dynamic public statistics state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalCities: 0
  })
  const [featuredActivities, setFeaturedActivities] = useState([])
  const [loading, setLoading] = useState(true)

  // Navigation states
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [faqOpenIndex, setFaqOpenIndex] = useState(null)

  // Newsletter email state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)

  // Body scroll lock side effect when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // SEO dynamic header update
  useEffect(() => {
    document.title = 'Troopp — Verified Peer-to-Peer Travel & Trust Network'
    
    // Add Meta Descriptions dynamically
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Discover day hikes, road trips, and stays hosted by verified travelers. Verify your identity, review traveler trust scores, and set off safely.')
    }

    // Add JSON-LD Structured Data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.innerHTML = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Troopp',
      'url': window.location.origin,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${window.location.origin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // Check scroll position for header visual styles
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch home statistics and featured activities
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await apiRequest('/public/home')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setStats(json.data.stats || { totalUsers: 0, totalActivities: 0, totalCities: 0 })
            setFeaturedActivities(json.data.featuredActivities || [])
          }
        }
      } catch (err) {
        console.error('Failed to retrieve public home metrics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHomeData()
  }, [])

  // Auto-redirect if already signed in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed')
    }
  }, [isAuthenticated, navigate])

  const handleCTA = () => {
    haptics.lightTap()
    setIsMobileMenuOpen(false)
    navigate('/signup')
  }

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail) return
    haptics.success()
    setNewsletterSubscribed(true)
    setNewsletterEmail('')
  }

  const toggleFaq = (index) => {
    haptics.lightTap()
    setFaqOpenIndex(faqOpenIndex === index ? null : index)
  }

  return (
    <div className="landing-container">
      
      {/* 1. Sticky Navbar Header */}
      <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #ff6a2c, #d9481a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontFamily: 'Space Grotesk', fontSize: '16px' }}>T</div>
          <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>Troopp</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          {['Features', 'How It Works', 'Trust', 'FAQ'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              className="nav-link"
            >
              {link}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { haptics.lightTap(); navigate('/login') }}
            style={{ display: 'flex', alignItems: 'center', height: '36px', padding: '0 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#f3f1ea', cursor: 'pointer', transition: 'all 150ms' }}
            onMouseOver={(e) => (e.target.style.background = 'rgba(255,255,255,0.04)')}
            onMouseOut={(e) => (e.target.style.background = 'transparent')}
          >
            Sign In
          </button>
          <button
            onClick={handleCTA}
            style={{ display: 'flex', alignItems: 'center', height: '36px', padding: '0 18px', background: 'linear-gradient(135deg, #ff6a2c, #d9481a)', border: 'none', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: 'white', cursor: 'pointer', transition: 'transform 150ms', boxShadow: '0 4px 14px rgba(255,106,44,0.3)' }}
            onMouseOver={(e) => (e.target.style.transform = 'scale(1.03)')}
            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
            className="hidden sm:flex"
          >
            Get Started
          </button>
          
          {/* Hamburger toggle button */}
          <button
            onClick={() => { haptics.lightTap(); setIsMobileMenuOpen(!isMobileMenuOpen) }}
            style={{ background: 'none', border: 'none', color: '#9ba6ad', padding: '6px', cursor: 'pointer' }}
            className="flex md:hidden"
            aria-label="Toggle Navigation Drawer"
            aria-expanded={isMobileMenuOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 497 }}
            />
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#0c1013', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 498, padding: '90px 24px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {['Features', 'How It Works', 'Trust', 'FAQ'].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ fontSize: '16px', fontWeight: '700', color: '#f3f1ea', textDecoration: 'none' }}
                >
                  {link}
                </a>
              ))}
              <button
                onClick={handleCTA}
                style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #ff6a2c, #d9481a)', border: 'none', borderRadius: '100px', fontSize: '13px', fontWeight: '700', color: 'white', cursor: 'pointer', marginTop: '10px' }}
              >
                Get Started
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION */}
      <section className="hero-section">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly={true}
          gradientFrom="rgba(255, 255, 255, 0.22)"
          gradientTo="rgba(255, 255, 255, 0.12)"
          glowColor="rgba(255, 106, 44, 0.25)"
        />
        <div className="hero-content">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-pill"
          >
            🎒 PEER-TO-PEER CO-COORDINATION PLATFORM
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-title"
          >
            Your friends are busy.<br />
            <span style={{ background: 'linear-gradient(135deg, #ff6a2c 0%, #ffc94d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your weekend isn't.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-subtitle"
          >
            Find verified co-travelers nearby. Check Behavioral Trust Scores. Track waypoints check-ins. Go places safely together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hero-buttons"
          >
            <button
              onClick={handleCTA}
              style={{ display: 'flex', alignItems: 'center', height: '48px', padding: '0 28px', background: 'linear-gradient(135deg, #ff6a2c, #d9481a)', border: 'none', borderRadius: '100px', fontSize: '13px', fontWeight: '800', color: 'white', cursor: 'pointer', transition: 'all 200ms ease', boxShadow: '0 8px 24px rgba(255,106,44,0.35)' }}
              onMouseOver={(e) => (e.target.style.transform = 'translateY(-2px) scale(1.02)')}
              onMouseOut={(e) => (e.target.style.transform = 'translateY(0) scale(1)')}
            >
              Start Your Journey
            </button>
            <a
              href="#features"
              style={{ display: 'flex', alignItems: 'center', height: '48px', padding: '0 28px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px', fontSize: '13px', fontWeight: '700', color: '#f3f1ea', cursor: 'pointer', textDecoration: 'none', transition: 'all 150ms' }}
              onMouseOver={(e) => (e.target.style.background = '#212b33')}
              onMouseOut={(e) => (e.target.style.background = '#1a2129')}
            >
              See How It Works
            </a>
          </motion.div>

          {/* Dynamic Statistics Block */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-stats"
          >
            <div className="stat-pill">
              <span style={{ color: '#ff6a2c' }}>● {stats.totalUsers || 0}</span> Travelers Registered
            </div>
            <div className="stat-pill">
              <span style={{ color: '#4fbe8e' }}>● {stats.totalActivities || 0}</span> Trips Hosted
            </div>
            <div className="stat-pill">
              <span style={{ color: '#3b82f6' }}>● {stats.totalCities || 0}</span> Cities Covered
            </div>
          </motion.div>
        </div>

        {/* Floating background blur highlights */}
        <div style={{ position: 'absolute', top: '25%', left: '15%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,106,44,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      </section>

      {/* LIVE FEATURED ACTIVITIES PREVIEW SECTION */}
      {featuredActivities.length > 0 && (
        <section className="landing-section">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: 0 }}>Upcoming Journeys near you</h3>
            <p style={{ fontSize: '13px', color: '#9ba6ad', marginTop: '6px' }}>Real database co-travel matches scheduling right now.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {featuredActivities.map((activity, index) => (
              <ActivityCard key={activity.id} activity={activity} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* 3. PROBLEM → SOLUTION */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="landing-section"
      >
        <div className="split-grid">
          
          {/* Left - Problem */}
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#ff5470', textTransform: 'uppercase', letterSpacing: '0.08em' }}>The Chaos</span>
            <h3 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', lineHeight: 1.15, margin: '8px 0 20px' }}>Traditional travel planning is broken.</h3>
            
            <div className="problem-list">
              {[
                { title: 'WhatsApp Coordination Hell', desc: 'Endless threads of silent followups, dropouts, and zero structure.' },
                { title: 'Unknown Traveler Risks', desc: 'Hosting or joining strangers without reputation score checks.' },
                { title: 'Cancellations last-minute', desc: 'Flaky members pulling out right before departure with zero reputation impacts.' }
              ].map((p, i) => (
                <div key={i} className="list-item">
                  <span style={{ color: '#ff5470', fontSize: '18px', fontWeight: '700' }}>✕</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '14px', color: '#f3f1ea' }}>{p.title}</strong>
                    <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Solution */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '30px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#4fbe8e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>The Troopp Way</span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Space Grotesk', lineHeight: 1.2, margin: '8px 0 20px', color: '#4fbe8e' }}>Seamless. Gated. Secure.</h3>
            
            <div className="solution-list">
              {[
                { title: 'Gated Trip Rooms', desc: 'Automated checklist controls, polling trackers, and split ledgers.' },
                { title: 'Emergency Contacts', desc: 'Secure connection with pre-configured emergency contacts.' },
                { title: 'Behavioral reputation', desc: 'Account trust scoring linking contact details and rating history.' }
              ].map((s, i) => (
                <div key={i} className="list-item">
                  <span style={{ color: '#4fbe8e', fontSize: '18px', fontWeight: '700' }}>✓</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '14px', color: '#f3f1ea' }}>{s.title}</strong>
                    <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. HOW IT WORKS TIMELINE */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="landing-section"
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#ff6a2c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Execution Route</span>
          <h3 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: '8px 0 0' }}>How Troopp Works</h3>
        </div>

        <div className="how-works-split-grid">
          {/* LEFT: Existing timeline (unchanged) */}
          <div className="timeline-container" style={{ marginTop: 0 }}>
            {[
              { step: '01', title: 'Link Contacts & Build Trust', desc: 'Register with your college email and link emergency contacts (+10 trust points).' },
              { step: '02', title: 'Discover & Join Matches', desc: 'Filter trips by category, difficulty, or price. Request to join and get reviewed by the host.' },
              { step: '03', title: 'Co-coordinate inside Trip Rooms', desc: 'Use checklist tools, ledger splits, and safety check-ins inside gated rooms.' },
              { step: '04', title: 'Travel Together & Build Reputation', desc: 'Share coordinates safely via locations, and leave verified ratings after checkout to build your score.' }
            ].map((item, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div className="timeline-dot" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff6a2c', letterSpacing: '0.05em' }}>STEP {item.step}</span>
                  <strong style={{ fontSize: '16px', color: '#f3f1ea' }}>{item.title}</strong>
                  <span style={{ fontSize: '13px', color: '#9ba6ad', maxWidth: '600px', lineHeight: 1.4, marginTop: '2px' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Smartphone showcase (completely interactive) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <TrooppShowcase />
          </div>
        </div>
      </motion.section>

      {/* 5. CORE FEATURES GRID */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="landing-section"
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#ff6a2c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature Matrix</span>
          <h3 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: '8px 0 0' }}>Core Capabilities</h3>
        </div>

        <MagicBento 
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect={true}
          spotlightRadius={400}
          particleCount={12}
          glowColor="255, 106, 44"
          disableAnimations={false}
        />
      </motion.section>

      {/* 6. TRUST & SAFETY ACCENT */}
      <motion.section id="trust" className="trust-section">
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#4fbe8e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trust Layer</span>
          <h3 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: 0 }}>Safety isn't a feature. It's the foundation.</h3>
          <p style={{ fontSize: '14px', color: '#9ba6ad', lineHeight: 1.5, maxWidth: '600px', margin: '0 auto' }}>
            We implement university email verification, emergency contact linking, and community review tracking.
          </p>
        </div>
      </motion.section>

      {/* 7. CATEGORIES CAROUSEL */}
      <section className="landing-section">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#ff6a2c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Adventure Filters</span>
          <h3 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: '8px 0 0' }}>Activity Types</h3>
        </div>

        <div className="categories-slider scrollbar-thin" style={{ padding: '28px 12px', gap: '24px' }}>
          {CATEGORIES.map((cat, index) => {
            const config = CATEGORIES_CONFIG[cat.label] || {
              title: cat.label,
              accent: '#ff6a2c',
              hsl: '17 100 58',
              icon: (c) => <span>📍</span>
            }

            return (
              <BorderGlow
                key={index}
                edgeSensitivity={35}
                glowColor={config.hsl}
                backgroundColor="#1a2129"
                borderRadius={20}
                glowRadius={35}
                glowIntensity={0.9}
                coneSpread={25}
                animated={true}
                colors={[config.accent, '#ff6a2c', '#1a2129']}
                style={{ flexShrink: 0, transition: 'transform 200ms ease' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div 
                  style={{
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '16px',
                    width: '230px',
                    minHeight: '200px',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Icon Container with soft glassmorphism/neumorphism */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {config.icon(config.accent)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <strong style={{ fontSize: '18px', fontWeight: '800', color: '#f3f1ea', fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }}>
                      {config.title}
                    </strong>
                    <span style={{ fontSize: '12.5px', color: '#9ba6ad', lineHeight: 1.45 }}>
                      {cat.desc}
                    </span>
                  </div>
                </div>
              </BorderGlow>
            )
          })}
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <motion.section
        id="faq"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '700px', margin: '0 auto' }}
        className="landing-section"
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#ff6a2c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inquiries</span>
          <h3 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: '8px 0 0' }}>FAQ</h3>
        </div>

        <div className="accordion-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = faqOpenIndex === index
            return (
              <div key={index} className="accordion-item">
                <div
                  onClick={() => toggleFaq(index)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '700',
                    fontSize: '14.5px',
                    userSelect: 'none'
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ color: '#ff6a2c', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 200ms' }}>＋</span>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 20px 20px', fontSize: '13px', color: '#9ba6ad', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </motion.section>

      {/* 9. CONTACT & NEWSLETTER */}
      <section className="landing-section" style={{ textAlign: 'center' }}>
        <div className="newsletter-card">
          <h3 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: 0 }}>Subscribe to newsletter</h3>
          <p style={{ fontSize: '13.5px', color: '#9ba6ad', marginTop: '6px', marginBottom: '24px' }}>Receive safety reports and adventure schedules near your college.</p>
          
          {newsletterSubscribed ? (
            <span style={{ fontSize: '14px', color: '#4fbe8e', fontWeight: '700' }}>✓ Subscribed successfully!</span>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                style={{ flex: 1, minWidth: '220px', height: '44px', background: '#10151a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', padding: '0 16px', color: '#f3f1ea', fontSize: '13px', outline: 'none' }}
                required
              />
              <button
                type="submit"
                style={{ height: '44px', padding: '0 24px', background: '#ff6a2c', color: 'white', border: 'none', borderRadius: '100px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section style={{ background: 'radial-gradient(circle at bottom, rgba(255,106,44,0.08) 0%, transparent 60%)', padding: '100px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <h3 style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'Space Grotesk', margin: 0 }}>Your next adventure starts here.</h3>
          <button
            onClick={handleCTA}
            style={{ display: 'flex', alignItems: 'center', height: '52px', padding: '0 32px', background: 'linear-gradient(135deg, #ff6a2c, #d9481a)', border: 'none', borderRadius: '100px', fontSize: '14px', fontWeight: '800', color: 'white', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,106,44,0.4)' }}
          >
            Create Your Free Account
          </button>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#090c0e', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/terms" style={{ fontSize: '12px', color: '#6b757c', textDecoration: 'none' }}>Terms & Conditions</Link>
            <Link to="/privacy" style={{ fontSize: '12px', color: '#6b757c', textDecoration: 'none' }}>Privacy Policy</Link>
          </div>
          <span style={{ fontSize: '11px', color: '#6b757c' }}>
            © {new Date().getFullYear()} Troopp Travel Inc. All rights reserved.
          </span>
        </div>
      </footer>

    </div>
  )
}

export default Landing
export { Landing }
