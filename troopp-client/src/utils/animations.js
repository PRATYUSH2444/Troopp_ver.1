/**
 * Shared Framer Motion variant builders that respect the reduced motion parameter.
 */

export const getSlideInLeft = (reduced) => ({
  hidden: { x: reduced ? 0 : -50, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25,
      duration: reduced ? 0 : undefined
    }
  }
})

export const getSlideInRight = (reduced) => ({
  hidden: { x: reduced ? 0 : 50, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25,
      duration: reduced ? 0 : undefined
    }
  }
})

export const getFadeIn = (reduced) => ({
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: reduced ? 0 : 0.2 
    }
  }
})

export const getScaleUp = (reduced) => ({
  hidden: { scale: reduced ? 1 : 0.9, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 30,
      duration: reduced ? 0 : undefined
    }
  }
})
