let audioCtx = null

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

const isSoundEnabled = () => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('troopp_sounds_enabled') === 'true'
}

/**
 * Ascending two-tone chime (C then E, 50ms each, sine wave, low volume 0.1)
 */
export const playSuccess = () => {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  
  // Play C5 (523.25Hz)
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(523.25, now)
  gain1.gain.setValueAtTime(0.1, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.05)

  // Play E5 (659.25Hz) with 50ms delay
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(659.25, now + 0.05)
  gain2.gain.setValueAtTime(0.1, now + 0.05)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now + 0.05)
  osc2.stop(now + 0.1)
}

/**
 * Descending tone (E then C, 50ms each, sawtooth wave, low volume 0.1)
 */
export const playError = () => {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  
  // Play E4 (329.63Hz)
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sawtooth'
  osc1.frequency.setValueAtTime(329.63, now)
  gain1.gain.setValueAtTime(0.1, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.05)

  // Play C4 (261.63Hz) with 50ms delay
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sawtooth'
  osc2.frequency.setValueAtTime(261.63, now + 0.05)
  gain2.gain.setValueAtTime(0.1, now + 0.05)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now + 0.05)
  osc2.stop(now + 0.1)
}

/**
 * Single soft blip (440Hz, 30ms, sine wave, very low volume 0.05)
 */
export const playMessage = () => {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, now)
  gain.gain.setValueAtTime(0.05, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.03)
}

/**
 * Ascending three-tone melody (C-E-G, 60ms each, sine wave, volume 0.1)
 */
export const playJoinApproved = () => {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5
  
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + idx * 0.06)
    gain.gain.setValueAtTime(0.1, now + idx * 0.06)
    gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.06)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + idx * 0.06)
    osc.stop(now + (idx + 1) * 0.06)
  })
}

/**
 * Gentle sparkle (rapid high-frequency ascending notes, 200ms total)
 */
export const playRating = () => {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const noteCount = 6
  const step = 0.200 / noteCount // 200ms total
  
  for (let i = 0; i < noteCount; i++) {
    const freq = 1000 + i * 200 // 1000Hz to 2000Hz sparkle
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * step)
    gain.gain.setValueAtTime(0.05, now + i * step)
    gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * step)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * step)
    osc.stop(now + (i + 1) * step)
  }
}
