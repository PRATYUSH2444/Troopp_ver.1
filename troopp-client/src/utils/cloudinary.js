/**
 * Helper to dynamically inject Cloudinary transformation parameters.
 */
export const CLOUDINARY_TRANSFORMS = {
  ACTIVITY_CARD: 'c_fill,w_400,h_300,q_auto,f_auto',
  CHAT_AVATAR: 'c_fill,w_40,h_40,q_auto,f_auto',
  PROFILE_AVATAR: 'c_fill,w_200,h_200,q_auto,f_auto',
  TRUST_SNAPSHOT: 'c_fill,w_56,h_56,q_auto,f_auto',
  MEMORY_WALL_COVER: 'c_fill,w_400,h_300,q_auto,f_auto'
}

export const getTransformedImageUrl = (url, transform = '') => {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url // Bypass if not hosted on Cloudinary
  
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return url
  
  const prefix = url.substring(0, uploadIndex + 8) // Up to "/upload/"
  const suffix = url.substring(uploadIndex + 8) // Filename & ID
  
  const cleanTransform = transform.startsWith('/') ? transform.substring(1) : transform
  const formattedTransform = cleanTransform.endsWith('/') ? cleanTransform : `${cleanTransform}/`
  
  return `${prefix}${formattedTransform}${suffix}`
}

export default getTransformedImageUrl
