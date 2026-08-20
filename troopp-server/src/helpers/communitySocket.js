import logger from '../config/logger.js'

const voteDebounceCache = {} // postId -> { timeoutId, lastEmitTime, upvotes, downvotes, score }

export const broadcastVoteUpdate = (postId, upvotes, downvotes, score) => {
  const io = global.io
  if (!io) return

  const now = Date.now()
  const cache = voteDebounceCache[postId]

  if (cache) {
    cache.upvotes = upvotes
    cache.downvotes = downvotes
    cache.score = score

    // If 1 second has elapsed since last broadcast, flush immediately
    if (now - cache.lastEmitTime >= 1000) {
      if (cache.timeoutId) clearTimeout(cache.timeoutId)
      emitNow(postId)
    }
  } else {
    // Initialize cache and schedule emit in 1 second
    voteDebounceCache[postId] = {
      upvotes,
      downvotes,
      score,
      lastEmitTime: now,
      timeoutId: setTimeout(() => emitNow(postId), 1000)
    }
  }
}

const emitNow = (postId) => {
  const cache = voteDebounceCache[postId]
  if (!cache) return

  const io = global.io
  if (io) {
    logger.debug(`[SOCKET BROADCAST]: Emitting post:vote_updated to room post:${postId} | Score: ${cache.score}`)
    io.to(`post:${postId}`).emit('post:vote_updated', {
      postId,
      upvotes: cache.upvotes,
      downvotes: cache.downvotes,
      score: cache.score
    })
  }

  // Delete from cache after flushing
  delete voteDebounceCache[postId]
}

export const broadcastNewComment = (postId, comment) => {
  const io = global.io
  if (io) {
    logger.debug(`[SOCKET BROADCAST]: Emitting comment:new to room post:${postId}`)
    io.to(`post:${postId}`).emit('comment:new', {
      postId,
      comment
    })
  }
}
