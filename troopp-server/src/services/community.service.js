import { Op } from 'sequelize'
import sequelize from '../config/db.js'
import {
  Board,
  BoardMember,
  Post,
  Comment,
  Vote,
  PollVote,
  SavedItem,
  CommunityReport,
  ModAction,
  User,
  Profile,
  Notification
} from '../models/index.js'
import { getRedisClient, isRedisHealthy } from '../config/redis.js'
import logger from '../config/logger.js'
import { broadcastVoteUpdate, broadcastNewComment } from '../helpers/communitySocket.js'

// Base64 Pagination Helpers
const encodeCursor = (data) => {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

const decodeCursor = (cursorStr) => {
  if (!cursorStr) return null
  try {
    return JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf-8'))
  } catch (err) {
    return null
  }
}

const calculateHotScore = (score, createdAt) => {
  const order = Math.log10(Math.max(1, Math.abs(score)))
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0
  const dateObj = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const seconds = Math.floor(dateObj.getTime() / 1000) - 1735689600
  return Number((order * sign + seconds / 45000).toFixed(7))
}

// Caching Helpers
const getCacheKey = (type, idOrQuery) => `community:${type}:${idOrQuery}`

const cacheGet = async (key) => {
  if (!isRedisHealthy()) return null
  try {
    const redis = getRedisClient()
    if (redis) {
      const val = await redis.get(key)
      return val ? JSON.parse(val) : null
    }
  } catch (err) {
    logger.error(`Redis cache get failed for key ${key}:`, err)
  }
  return null
}

const cacheSet = async (key, val, ttlSeconds = 60) => {
  if (!isRedisHealthy()) return
  try {
    const redis = getRedisClient()
    if (redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(val))
    }
  } catch (err) {
    logger.error(`Redis cache set failed for key ${key}:`, err)
  }
}

const cacheDelete = async (key) => {
  if (!isRedisHealthy()) return
  try {
    const redis = getRedisClient()
    if (redis) {
      await redis.del(key)
    }
  } catch (err) {
    logger.error(`Redis cache delete failed for key ${key}:`, err)
  }
}

export const createBoard = async (userId, data) => {
  const transaction = await sequelize.transaction()
  try {
    const { name, display_name, description, type, flair_options, rules } = data

    // 1. Create board record
    const board = await Board.create(
      {
        creator_id: userId,
        name,
        display_name,
        description,
        type: type || 'public',
        flair_options: flair_options || [],
        rules: rules || [],
        member_count: 1
      },
      { transaction }
    )

    // 2. Automatically make creator an admin moderator member
    await BoardMember.create(
      {
        board_id: board.id,
        user_id: userId,
        role: 'admin'
      },
      { transaction }
    )

    await transaction.commit()
    await cacheDelete('community:boards:list')
    return board
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

export const getBoard = async (boardName) => {
  const cacheKey = getCacheKey('board', boardName)
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const board = await Board.findOne({ where: { name: boardName } })
  if (!board) return null

  const boardData = board.toJSON()
  await cacheSet(cacheKey, boardData, 120) // 2 min cache
  return boardData
}

export const listBoards = async (query = '', limit = 10, cursor = null) => {
  const limitVal = parseInt(limit, 10) || 10
  const decoded = decodeCursor(cursor)

  const whereClause = {}
  if (query) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${query}%` } },
      { display_name: { [Op.iLike]: `%${query}%` } }
    ]
  }

  if (decoded) {
    whereClause.id = { [Op.lt]: decoded.id }
  }

  const boards = await Board.findAll({
    where: whereClause,
    order: [['id', 'DESC']],
    limit: limitVal + 1
  })

  const hasNextPage = boards.length > limitVal
  const items = hasNextPage ? boards.slice(0, limitVal) : boards
  const nextCursor = hasNextPage ? encodeCursor({ id: items[items.length - 1].id }) : null

  return { items, nextCursor }
}

export const subscribeBoard = async (userId, boardName) => {
  const board = await Board.findOne({ where: { name: boardName } })
  if (!board) throw new Error('Board not found')

  const transaction = await sequelize.transaction()
  try {
    const [member, created] = await BoardMember.findOrCreate({
      where: { board_id: board.id, user_id: userId },
      defaults: { role: 'member' },
      transaction
    })

    if (created) {
      await board.increment('member_count', { by: 1, transaction })
    }

    await transaction.commit()
    await cacheDelete(getCacheKey('board', boardName))
    return { subscribed: true }
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

export const unsubscribeBoard = async (userId, boardName) => {
  const board = await Board.findOne({ where: { name: boardName } })
  if (!board) throw new Error('Board not found')

  const transaction = await sequelize.transaction()
  try {
    const deleted = await BoardMember.destroy({
      where: { board_id: board.id, user_id: userId },
      transaction
    })

    if (deleted > 0) {
      await board.decrement('member_count', { by: 1, transaction })
    }

    await transaction.commit()
    await cacheDelete(getCacheKey('board', boardName))
    return { subscribed: false }
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

export const getSubscriptionStatus = async (userId, boardName) => {
  const board = await Board.findOne({ where: { name: boardName } })
  if (!board) return { subscribed: false, role: null }

  const member = await BoardMember.findOne({
    where: { board_id: board.id, user_id: userId }
  })

  return {
    subscribed: !!member,
    role: member ? member.role : null
  }
}

export const createPost = async (userId, data) => {
  const { board_name, title, type, content, media_urls, link_url, trip_report_details, flair_id } = data

  let boardId = null
  if (board_name) {
    const board = await Board.findOne({ where: { name: board_name } })
    if (!board) throw new Error('Board not found')
    boardId = board.id

    const membership = await BoardMember.findOne({ where: { board_id: board.id, user_id: userId } })
    if (membership && membership.is_banned) {
      throw new Error('Access denied: you are banned from posting on this board.')
    }

    // Verify user is not banned from the board if restricted rules apply
    if (board.type === 'private' || board.type === 'restricted') {
      if (!membership && board.type === 'private') {
        throw new Error('Access denied: private board membership required.')
      }
      if (!membership && board.type === 'restricted') {
        throw new Error('Access denied: restricted board membership required to post.')
      }
    }
  }

  const post = await Post.create({
    board_id: boardId,
    user_id: userId,
    title,
    type: type || 'text',
    content,
    media_urls: media_urls || [],
    link_url,
    trip_report_details,
    flair_id,
    upvotes: 1,
    downvotes: 0,
    score: 1,
    hot_score: calculateHotScore(1, new Date())
  })

  // Auto-upvote own post
  await Vote.create({
    user_id: userId,
    target_type: 'post',
    target_id: post.id,
    vote_value: 1
  })

  if (board_name) {
    await cacheDelete(getCacheKey('feed', `${board_name}:hot`))
    await cacheDelete(getCacheKey('feed', `${board_name}:new`))
  }
  await cacheDelete(getCacheKey('feed', 'global:hot'))
  await cacheDelete(getCacheKey('feed', 'global:new'))

  return post
}

export const getPost = async (postId, currentUserId = null) => {
  const post = await Post.findOne({
    where: { id: postId, deleted_at: null },
    include: [
      {
        model: User,
        attributes: ['id', 'trust_score', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      },
      {
        model: Board,
        attributes: ['id', 'name', 'display_name']
      }
    ]
  })

  if (!post) return null

  let userVote = 0
  let isSaved = false

  if (currentUserId) {
    const voteRecord = await Vote.findOne({
      where: { user_id: currentUserId, target_type: 'post', target_id: postId }
    })
    if (voteRecord) userVote = voteRecord.vote_value

    const savedRecord = await SavedItem.findOne({
      where: { user_id: currentUserId, target_type: 'post', target_id: postId }
    })
    isSaved = !!savedRecord
  }

  const postJSON = post.toJSON()
  postJSON.user_vote = userVote
  postJSON.is_saved = isSaved

  if (postJSON.type === 'poll') {
    const options = postJSON.trip_report_details?.options || []
    const votes = await PollVote.findAll({
      where: { post_id: postId },
      attributes: ['option_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['option_id'],
      raw: true
    })
    const votesMap = new Map(votes.map(v => [v.option_id, parseInt(v.count, 10)]))
    postJSON.poll_results = options.map((opt, idx) => ({
      option_id: String(idx),
      option_text: opt,
      votes: votesMap.get(String(idx)) || 0
    }))
    
    let userSelection = null
    if (currentUserId) {
      const userVoteRecord = await PollVote.findOne({
        where: { post_id: postId, user_id: currentUserId }
      })
      if (userVoteRecord) {
        userSelection = userVoteRecord.option_id
      }
    }
    postJSON.poll_user_selection = userSelection
  }

  return postJSON
}

export const listPosts = async (boardName = null, sort = 'hot', limit = 15, cursor = null, currentUserId = null) => {
  const limitVal = parseInt(limit, 10) || 15
  const decoded = decodeCursor(cursor)

  let boardId = null
  if (boardName) {
    const board = await Board.findOne({ where: { name: boardName } })
    if (!board) throw new Error('Board not found')
    boardId = board.id
  }

  const whereClause = { deleted_at: null }
  if (boardId) {
    whereClause.board_id = boardId
  }

  let order = []
  if (sort === 'hot') {
    if (decoded) {
      whereClause[Op.or] = [
        { hot_score: { [Op.lt]: decoded.hot_score } },
        {
          hot_score: decoded.hot_score,
          id: { [Op.lt]: decoded.id }
        }
      ]
    }
    order = [['hot_score', 'DESC'], ['id', 'DESC']]
  } else if (sort === 'top') {
    if (decoded) {
      whereClause[Op.or] = [
        { score: { [Op.lt]: decoded.score } },
        {
          score: decoded.score,
          id: { [Op.lt]: decoded.id }
        }
      ]
    }
    order = [['score', 'DESC'], ['id', 'DESC']]
  } else {
    // default to 'new'
    if (decoded) {
      whereClause[Op.or] = [
        { created_at: { [Op.lt]: new Date(decoded.created_at) } },
        {
          created_at: new Date(decoded.created_at),
          id: { [Op.lt]: decoded.id }
        }
      ]
    }
    order = [['created_at', 'DESC'], ['id', 'DESC']]
  }

  const posts = await Post.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        attributes: ['id', 'trust_score', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      },
      {
        model: Board,
        attributes: ['id', 'name', 'display_name']
      }
    ],
    order,
    limit: limitVal + 1
  })

  const hasNextPage = posts.length > limitVal
  const items = hasNextPage ? posts.slice(0, limitVal) : posts

  // Fetch vote statuses if user is logged in
  if (currentUserId && items.length > 0) {
    const postIds = items.map((p) => p.id)
    const votes = await Vote.findAll({
      where: {
        user_id: currentUserId,
        target_type: 'post',
        target_id: { [Op.in]: postIds }
      }
    })
    const saved = await SavedItem.findAll({
      where: {
        user_id: currentUserId,
        target_type: 'post',
        target_id: { [Op.in]: postIds }
      }
    })

    const voteMap = new Map(votes.map((v) => [v.target_id, v.vote_value]))
    const savedMap = new Map(saved.map((s) => [s.target_id, true]))

    items.forEach((item) => {
      item.setDataValue('user_vote', voteMap.get(item.id) || 0)
      item.setDataValue('is_saved', savedMap.get(item.id) || false)
    })
  } else {
    items.forEach((item) => {
      item.setDataValue('user_vote', 0)
      item.setDataValue('is_saved', false)
    })
  }

  // Fetch poll statistics if posts include polls
  for (const item of items) {
    if (item.type === 'poll') {
      const options = item.trip_report_details?.options || []
      const votes = await PollVote.findAll({
        where: { post_id: item.id },
        attributes: ['option_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['option_id'],
        raw: true
      })
      const votesMap = new Map(votes.map((v) => [v.option_id, parseInt(v.count, 10)]))
      item.setDataValue('poll_results', options.map((opt, idx) => ({
        option_id: String(idx),
        option_text: opt,
        votes: votesMap.get(String(idx)) || 0
      })))

      let userSelection = null
      if (currentUserId) {
        const userVoteRecord = await PollVote.findOne({
          where: { post_id: item.id, user_id: currentUserId }
        })
        if (userVoteRecord) {
          userSelection = userVoteRecord.option_id
        }
      }
      item.setDataValue('poll_user_selection', userSelection)
    }
  }

  let nextCursor = null
  if (hasNextPage && items.length > 0) {
    const lastItem = items[items.length - 1]
    if (sort === 'hot') {
      nextCursor = encodeCursor({ hot_score: lastItem.hot_score, id: lastItem.id })
    } else if (sort === 'top') {
      nextCursor = encodeCursor({ score: lastItem.score, id: lastItem.id })
    } else {
      nextCursor = encodeCursor({ created_at: lastItem.created_at.getTime(), id: lastItem.id })
    }
  }

  return { items, nextCursor }
}

export const castVote = async (userId, targetType, targetId, voteValue) => {
  if (voteValue !== -1 && voteValue !== 0 && voteValue !== 1) {
    throw new Error('Invalid vote value')
  }

  const transaction = await sequelize.transaction()
  try {
    // 1. Fetch previous vote if any
    const prevVote = await Vote.findOne({
      where: { user_id: userId, target_type: targetType, target_id: targetId },
      transaction
    })

    const prevVal = prevVote ? prevVote.vote_value : 0
    if (prevVal === voteValue) {
      await transaction.commit()
      return { success: true } // No change
    }

    // 2. Upsert/Destroy Vote
    if (voteValue === 0) {
      if (prevVote) {
        await prevVote.destroy({ transaction })
      }
    } else {
      if (prevVote) {
        prevVote.vote_value = voteValue
        await prevVote.save({ transaction })
      } else {
        await Vote.create(
          {
            user_id: userId,
            target_type: targetType,
            target_id: targetId,
            vote_value: voteValue
          },
          { transaction }
        )
      }
    }

    // 3. Compute score shifts
    let upvoteDelta = 0
    let downvoteDelta = 0

    // Remove previous weight
    if (prevVal === 1) upvoteDelta -= 1
    if (prevVal === -1) downvoteDelta -= 1

    // Add new weight
    if (voteValue === 1) upvoteDelta += 1
    if (voteValue === -1) downvoteDelta += 1

    const scoreDelta = upvoteDelta - downvoteDelta

    // 4. Atomically mutate counts
    if (targetType === 'post') {
      const post = await Post.findByPk(targetId, { transaction, lock: transaction.LOCK.UPDATE })
      if (post) {
        const newScore = post.score + scoreDelta
        const newHotScore = calculateHotScore(newScore, post.createdAt)
        await Post.update(
          {
            upvotes: sequelize.literal(`upvotes + ${upvoteDelta}`),
            downvotes: sequelize.literal(`downvotes + ${downvoteDelta}`),
            score: newScore,
            hot_score: newHotScore
          },
          { where: { id: targetId }, transaction }
        )
      }
    } else if (targetType === 'comment') {
      await Comment.update(
        {
          upvotes: sequelize.literal(`upvotes + ${upvoteDelta}`),
          downvotes: sequelize.literal(`downvotes + ${downvoteDelta}`),
          score: sequelize.literal(`score + ${scoreDelta}`)
        },
        { where: { id: targetId }, transaction }
      )
    }

    await transaction.commit()

    if (targetType === 'post') {
      Post.findByPk(targetId).then((updatedPost) => {
        if (updatedPost) {
          broadcastVoteUpdate(targetId, updatedPost.upvotes, updatedPost.downvotes, updatedPost.score)
        }
      }).catch((err) => logger.error('Failed to broadcast post vote update:', err))
    }

    return { success: true }
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

export const createComment = async (userId, postId, content, parentId = null) => {
  const transaction = await sequelize.transaction()
  try {
    const post = await Post.findByPk(postId, { transaction })
    if (!post) throw new Error('Post not found')

    if (post.board_id) {
      const membership = await BoardMember.findOne({
        where: { board_id: post.board_id, user_id: userId },
        transaction
      })
      if (membership && membership.is_banned) {
        throw new Error('Access denied: you are banned from commenting on this board.')
      }
    }

    const comment = await Comment.create(
      {
        post_id: postId,
        user_id: userId,
        parent_id: parentId,
        content,
        upvotes: 1,
        downvotes: 0,
        score: 1
      },
      { transaction }
    )

    // Auto-upvote own comment
    await Vote.create(
      {
        user_id: userId,
        target_type: 'comment',
        target_id: comment.id,
        vote_value: 1
      },
      { transaction }
    )

    // Increment post's comment count
    await Post.update(
      { comment_count: sequelize.literal('comment_count + 1') },
      { where: { id: postId }, transaction }
    )

    // Trigger Notification creations
    try {
      const { Notification, Profile } = await import('../models/index.js')
      let parentComment = null
      if (parentId) {
        parentComment = await Comment.findByPk(parentId, { transaction })
        if (parentComment && parentComment.user_id !== userId) {
          await Notification.create({
            user_id: parentComment.user_id,
            type: 'comment_reply',
            title: 'New Reply to Comment',
            body: `Someone replied to your comment: "${content.substring(0, 50)}..."`,
            data: { postId, commentId: comment.id, parentCommentId: parentId }
          }, { transaction })
        }
      } else {
        if (post.user_id !== userId) {
          await Notification.create({
            user_id: post.user_id,
            type: 'post_reply',
            title: 'New Reply to Post',
            body: `Someone commented on your post: "${content.substring(0, 50)}..."`,
            data: { postId, commentId: comment.id }
          }, { transaction })
        }
      }

      // Check for @mentions
      const mentionMatches = content.match(/@(\w+)/g) || []
      const mentionNames = [...new Set(mentionMatches.map(m => m.slice(1)))]
      for (const name of mentionNames) {
        const profile = await Profile.findOne({
          where: sequelize.where(
            sequelize.fn('lower', sequelize.col('name')),
            name.toLowerCase()
          ),
          transaction
        })
        if (profile && profile.user_id !== userId) {
          const isAlreadyNotified = parentId 
            ? (profile.user_id === parentComment?.user_id) 
            : (profile.user_id === post.user_id)

          if (!isAlreadyNotified) {
            await Notification.create({
              user_id: profile.user_id,
              type: 'mention',
              title: 'New Mention',
              body: `You were mentioned in a comment: "${content.substring(0, 50)}..."`,
              data: { postId, commentId: comment.id }
            }, { transaction })
          }
        }
      }
    } catch (notifErr) {
      logger.error('Failed to create community notifications:', notifErr)
    }

    await transaction.commit()
    
    // Broadcast the new comment to the post room as a side-effect
    try {
      broadcastNewComment(postId, comment)
    } catch (err) {
      logger.error('Failed to broadcast new comment socket event:', err)
    }

    return comment
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

export const listComments = async (postId, currentUserId = null) => {
  // Fetch comments in flat format (including soft deleted ones to preserve hierarchy)
  const comments = await Comment.findAll({
    where: { post_id: postId },
    paranoid: false,
    include: [
      {
        model: User,
        attributes: ['id', 'trust_score', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ],
    order: [['score', 'DESC'], ['created_at', 'ASC']]
  })

  // Fetch votes if user is logged in
  if (currentUserId && comments.length > 0) {
    const commentIds = comments.map((c) => c.id)
    const votes = await Vote.findAll({
      where: {
        user_id: currentUserId,
        target_type: 'comment',
        target_id: { [Op.in]: commentIds }
      }
    })
    const voteMap = new Map(votes.map((v) => [v.target_id, v.vote_value]))
    comments.forEach((c) => {
      c.setDataValue('user_vote', voteMap.get(c.id) || 0)
    })
  } else {
    comments.forEach((c) => {
      c.setDataValue('user_vote', 0)
    })
  }

  // Construct nested tree
  const commentMap = {}
  comments.forEach((comment) => {
    const item = comment.toJSON()
    if (comment.deleted_at) {
      item.content = '[deleted]'
      item.User = {
        id: null,
        trust_score: 0,
        reliability_score: 0,
        Profile: { name: '[deleted]', avatar_url: null, gender: null }
      }
    }
    commentMap[comment.id] = { ...item, replies: [] }
  })

  const commentTree = []
  comments.forEach((comment) => {
    const item = commentMap[comment.id]
    if (comment.parent_id) {
      const parent = commentMap[comment.parent_id]
      if (parent) {
        parent.replies.push(item)
      } else {
        // Orphaned comment (parent deleted from DB altogether)
        commentTree.push(item)
      }
    } else {
      commentTree.push(item)
    }
  })

  return commentTree
}

export const toggleSaveItem = async (userId, targetType, targetId) => {
  const existing = await SavedItem.findOne({
    where: { user_id: userId, target_type: targetType, target_id: targetId }
  })

  if (existing) {
    await existing.destroy()
    return { saved: false }
  } else {
    await SavedItem.create({
      user_id: userId,
      target_type: targetType,
      target_id: targetId
    })
    return { saved: true }
  }
}

export const softDeletePost = async (userId, postId) => {
  const post = await Post.findByPk(postId)
  if (!post) throw new Error('Post not found')

  // Verify ownership or admin moderation
  const user = await User.findByPk(userId)
  const isAuthor = post.user_id === userId
  const isAdmin = user && user.role === 'admin'

  let isModerator = false
  if (post.board_id) {
    const modMembership = await BoardMember.findOne({
      where: { board_id: post.board_id, user_id: userId, role: { [Op.in]: ['moderator', 'admin'] } }
    })
    isModerator = !!modMembership
  }

  if (!isAuthor && !isAdmin && !isModerator) {
    throw new Error('Unauthorized deletion request')
  }

  // Soft delete post
  await post.destroy() // paranoid: true handles soft delete internally via deleted_at

  // Log mod action if deleted by moderator/admin
  if ((isAdmin || isModerator) && !isAuthor && post.board_id) {
    await ModAction.create({
      board_id: post.board_id,
      moderator_id: userId,
      action: 'remove_post',
      target_id: postId,
      reason: 'Deleted by moderator'
    })
  }

  return { deleted: true }
}

export const softDeleteComment = async (userId, commentId) => {
  const comment = await Comment.findByPk(commentId)
  if (!comment) throw new Error('Comment not found')

  if (comment.user_id !== userId) {
    const user = await User.findByPk(userId)
    const isAdmin = user && user.role === 'admin'
    if (!isAdmin) throw new Error('Unauthorized deletion request')
  }

  // Soft delete comment
  await comment.destroy()
  return { deleted: true }
}

export const editPost = async (userId, postId, content) => {
  const post = await Post.findByPk(postId)
  if (!post) throw new Error('Post not found')

  if (post.user_id !== userId) {
    throw new Error('Unauthorized edit request')
  }

  post.content = content
  post.edited_at = new Date()
  await post.save()

  // Clear cache
  if (post.board_id) {
    const board = await Board.findByPk(post.board_id)
    if (board) {
      await cacheDelete(getCacheKey('feed', `${board.name}:hot`))
      await cacheDelete(getCacheKey('feed', `${board.name}:new`))
    }
  }
  await cacheDelete(getCacheKey('feed', 'global:hot'))
  await cacheDelete(getCacheKey('feed', 'global:new'))

  return post
}

export const editComment = async (userId, commentId, content) => {
  const comment = await Comment.findByPk(commentId)
  if (!comment) throw new Error('Comment not found')

  if (comment.user_id !== userId) {
    throw new Error('Unauthorized edit request')
  }

  comment.content = content
  comment.edited_at = new Date()
  await comment.save()

  return comment
}

export const reportItem = async (userId, targetType, targetId, reason) => {
  if (targetType !== 'post' && targetType !== 'comment') {
    throw new Error('Invalid target type for report')
  }

  const report = await CommunityReport.create({
    reporter_id: userId,
    target_type: targetType,
    target_id: targetId,
    reason,
    status: 'open'
  })

  return report
}

export const listModerationQueue = async (userId) => {
  const user = await User.findByPk(userId)
  const isSuperAdmin = user && user.role === 'admin'

  const moderatedMemberships = await BoardMember.findAll({
    where: { user_id: userId, role: { [Op.in]: ['moderator', 'admin'] } }
  })
  const moderatedBoardIds = moderatedMemberships.map((m) => m.board_id)

  if (!isSuperAdmin && moderatedBoardIds.length === 0) {
    throw new Error('Access denied: moderator privileges required')
  }

  const reports = await CommunityReport.findAll({
    where: { status: 'open' },
    order: [['createdAt', 'DESC']]
  })

  const enrichedReports = []
  for (const report of reports) {
    let targetItem = null
    let boardId = null
    let boardName = null

    if (report.target_type === 'post') {
      const post = await Post.findByPk(report.target_id, {
        include: [{ model: Board, attributes: ['id', 'name'] }]
      })
      if (post) {
        targetItem = {
          id: post.id,
          title: post.title,
          content: post.content,
          type: post.type
        }
        boardId = post.Board?.id
        boardName = post.Board?.name
      }
    } else if (report.target_type === 'comment') {
      const comment = await Comment.findByPk(report.target_id, {
        include: [
          {
            model: Post,
            include: [{ model: Board, attributes: ['id', 'name'] }]
          }
        ]
      })
      if (comment) {
        targetItem = {
          id: comment.id,
          content: comment.content
        }
        boardId = comment.Post?.Board?.id
        boardName = comment.Post?.Board?.name
      }
    }

    // Filter out reports that this moderator doesn't manage, unless they are a superadmin
    if (isSuperAdmin || (boardId && moderatedBoardIds.includes(boardId))) {
      const reporter = await User.findByPk(report.reporter_id, {
        include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
      })
      
      enrichedReports.push({
        id: report.id,
        target_type: report.target_type,
        target_id: report.target_id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        board_name: boardName,
        reporter_name: reporter?.Profile?.name || 'Anonymous',
        target: targetItem
      })
    }
  }

  return enrichedReports
}

export const resolveModerationAction = async (userId, reportId, actionType) => {
  const report = await CommunityReport.findByPk(reportId)
  if (!report) throw new Error('Report not found')

  const user = await User.findByPk(userId)
  const isSuperAdmin = user && user.role === 'admin'

  let targetBoardId = null
  if (report.target_type === 'post') {
    const post = await Post.findByPk(report.target_id)
    if (post) targetBoardId = post.board_id
  } else if (report.target_type === 'comment') {
    const comment = await Comment.findByPk(report.target_id, {
      include: [{ model: Post }]
    })
    if (comment && comment.Post) targetBoardId = comment.Post.board_id
  }

  let isModerator = false
  if (targetBoardId) {
    const modMembership = await BoardMember.findOne({
      where: { board_id: targetBoardId, user_id: userId, role: { [Op.in]: ['moderator', 'admin'] } }
    })
    isModerator = !!modMembership
  }

  if (!isSuperAdmin && !isModerator) {
    throw new Error('Unauthorized moderation resolution')
  }

  if (actionType === 'approve') {
    report.status = 'reviewed'
    await report.save()
  } else if (actionType === 'remove') {
    report.status = 'actioned'
    await report.save()

    // Perform soft delete on the reported item
    if (report.target_type === 'post') {
      const targetPost = await Post.findByPk(report.target_id)
      await Post.destroy({ where: { id: report.target_id } })
      if (targetBoardId) {
        await ModAction.create({
          board_id: targetBoardId,
          moderator_id: userId,
          action: 'remove_post',
          target_id: report.target_id,
          reason: 'Removed via moderator queue review'
        })
      }
      if (targetPost && targetPost.user_id) {
        await Notification.create({
          user_id: targetPost.user_id,
          type: 'mod_action',
          title: 'Post Removed',
          body: `Your post titled "${targetPost.title}" was removed by moderation.`,
          data: { postId: targetPost.id }
        })
      }
    } else if (report.target_type === 'comment') {
      const targetComment = await Comment.findByPk(report.target_id)
      await Comment.destroy({ where: { id: report.target_id } })
      if (targetComment && targetComment.user_id) {
        await Notification.create({
          user_id: targetComment.user_id,
          type: 'mod_action',
          title: 'Comment Removed',
          body: 'Your comment was removed by moderation.',
          data: { commentId: targetComment.id }
        })
      }
    }
  }

  return { success: true }
}

export const castPollVote = async (userId, postId, optionId) => {
  const post = await Post.findByPk(postId)
  if (!post) throw new Error('Post not found')
  if (post.type !== 'poll') throw new Error('Post is not a poll')

  // Enforce single-vote restriction using unique model constraint index
  const transaction = await sequelize.transaction()
  try {
    const [voteRecord, created] = await PollVote.findOrCreate({
      where: { post_id: postId, user_id: userId },
      defaults: { option_id: optionId },
      transaction
    })

    if (!created) {
      throw new Error('You have already voted on this poll')
    }

    await transaction.commit()
    return { success: true }
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

export const banMember = async (userId, boardName, targetUserId, reason) => {
  const board = await Board.findOne({ where: { name: boardName } })
  if (!board) throw new Error('Board not found')

  const user = await User.findByPk(userId)
  const isSuperAdmin = user && user.role === 'admin'

  const modMembership = await BoardMember.findOne({
    where: { board_id: board.id, user_id: userId, role: { [Op.in]: ['moderator', 'admin'] } }
  })
  const isModerator = !!modMembership

  if (!isSuperAdmin && !isModerator) {
    throw new Error('Unauthorized ban request')
  }

  const [membership, created] = await BoardMember.findOrCreate({
    where: { board_id: board.id, user_id: targetUserId },
    defaults: { role: 'member', is_banned: true, ban_reason: reason }
  })

  if (!created) {
    membership.is_banned = true
    membership.ban_reason = reason
    await membership.save()
  }

  await ModAction.create({
    board_id: board.id,
    moderator_id: userId,
    action: 'ban_member',
    target_id: targetUserId,
    reason
  })

  // Create ban notification
  try {
    await Notification.create({
      user_id: targetUserId,
      type: 'mod_action',
      title: `Banned from b/${board.display_name || board.name}`,
      body: `You have been banned from b/${board.display_name || board.name}. Reason: ${reason || 'No reason provided.'}`,
      data: { board_id: board.id, board_name: board.name }
    })
  } catch (notifErr) {
    logger.error('Failed to create ban notification:', notifErr)
  }

  return { success: true }
}

export const unbanMember = async (userId, boardName, targetUserId) => {
  const board = await Board.findOne({ where: { name: boardName } })
  if (!board) throw new Error('Board not found')

  const user = await User.findByPk(userId)
  const isSuperAdmin = user && user.role === 'admin'

  const modMembership = await BoardMember.findOne({
    where: { board_id: board.id, user_id: userId, role: { [Op.in]: ['moderator', 'admin'] } }
  })
  const isModerator = !!modMembership

  if (!isSuperAdmin && !isModerator) {
    throw new Error('Unauthorized unban request')
  }

  const membership = await BoardMember.findOne({
    where: { board_id: board.id, user_id: targetUserId }
  })

  if (membership) {
    membership.is_banned = false
    membership.ban_reason = null
    await membership.save()
  }

  await ModAction.create({
    board_id: board.id,
    moderator_id: userId,
    action: 'unban_member',
    target_id: targetUserId,
    reason: 'Unbanned by moderator'
  })

  return { success: true }
}

export const listNotifications = async (userId, limit = 20, cursor = null) => {
  const limitNum = parseInt(limit) || 20
  const where = { user_id: userId }

  if (cursor) {
    const decodedDate = new Date(Buffer.from(cursor, 'base64').toString('ascii'))
    if (!isNaN(decodedDate.getTime())) {
      where.createdAt = { [Op.lt]: decodedDate }
    }
  }

  const notifications = await Notification.findAll({
    where,
    limit: limitNum + 1,
    order: [['createdAt', 'DESC']]
  })

  let nextCursor = null
  if (notifications.length > limitNum) {
    const lastItem = notifications[limitNum - 1]
    nextCursor = Buffer.from(lastItem.createdAt.toISOString()).toString('base64')
    notifications.pop()
  }

  return {
    notifications,
    nextCursor
  }
}

export const markNotificationAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId }
  })
  if (!notification) {
    throw new Error('Notification not found')
  }

  notification.is_read = true
  notification.read_at = new Date()
  await notification.save()

  return notification
}

export const searchCommunity = async (queryStr) => {
  if (!queryStr || !queryStr.trim()) {
    return { boards: [], posts: [] }
  }

  // Format query string for tsquery: e.g. "Hiking Lonavala" -> "Hiking & Lonavala" or "Hiking:* & Lonavala:*"
  const formattedQuery = queryStr
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => `${word}:*`)
    .join(' & ')

  // Fetch ranked boards
  const boards = await Board.findAll({
    attributes: [
      'id', 'name', 'display_name', 'description', 'avatar_url', 'member_count',
      [
        sequelize.literal(`ts_rank(to_tsvector('english', name || ' ' || coalesce(description, '')), to_tsquery('english', :query))`),
        'rank'
      ]
    ],
    where: sequelize.literal(`to_tsvector('english', name || ' ' || coalesce(description, '')) @@ to_tsquery('english', :query)`),
    replacements: { query: formattedQuery },
    order: [[sequelize.literal('rank'), 'DESC']],
    limit: 10
  })

  // Fetch ranked posts (with User/Profile and Board associations)
  const posts = await Post.findAll({
    attributes: [
      'id', 'board_id', 'user_id', 'title', 'type', 'content', 'media_urls', 'upvotes', 'downvotes', 'score', 'hot_score', 'created_at', 'updated_at',
      [
        sequelize.literal(`ts_rank(to_tsvector('english', title || ' ' || coalesce(content, '')), to_tsquery('english', :query))`),
        'rank'
      ]
    ],
    where: sequelize.literal(`to_tsvector('english', title || ' ' || coalesce(content, '')) @@ to_tsquery('english', :query)`),
    replacements: { query: formattedQuery },
    include: [
      {
        model: User,
        attributes: ['id', 'trust_score', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      },
      {
        model: Board,
        attributes: ['id', 'name', 'display_name']
      }
    ],
    order: [[sequelize.literal('rank'), 'DESC']],
    limit: 20
  })

  return {
    boards,
    posts
  }
}


