import React, { useState, useEffect } from 'react'

/**
 * ProgressiveImage - A progressive image loader component implementing the "blur-up" technique.
 * Specially optimized to parse Cloudinary image URLs and fetch a low-quality `q_1,w_20` micro-thumbnail first.
 */
export const ProgressiveImage = ({ src, alt, className, style, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState('')
  const [isBlurry, setIsBlurry] = useState(true)

  useEffect(() => {
    if (!src) return

    // Calculate low quality Cloudinary or fallback thumbnail URL
    let lowQualityUrl = src
    if (src.includes('cloudinary.com') && src.includes('/upload/')) {
      lowQualityUrl = src.replace('/upload/', '/upload/q_1,w_20/')
    } else if (src.includes('images.unsplash.com')) {
      // Unsplash alternative helper
      lowQualityUrl = src.includes('?') 
        ? `${src.split('?')[0]}?auto=format&fit=crop&w=20&q=1` 
        : `${src}?auto=format&fit=crop&w=20&q=1`
    }

    setCurrentSrc(lowQualityUrl)
    setIsBlurry(true)

    // Preload full high-resolution image in background
    const img = new Image()
    img.src = src
    img.onload = () => {
      setCurrentSrc(src)
      setIsBlurry(false)
    }
  }, [src])

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} transition-all duration-400`}
      style={{
        ...style,
        filter: isBlurry ? 'blur(20px)' : 'blur(0px)',
        transform: isBlurry ? 'scale(1.03)' : 'scale(1)', // prevents white bleeding edges from blur
        willChange: 'filter'
      }}
      {...props}
    />
  )
}

export default ProgressiveImage
