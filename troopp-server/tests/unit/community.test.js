import { jest } from '@jest/globals'
import * as communityService from '../../src/services/community.service.js'
import Board from '../../src/models/Board.js'
import BoardMember from '../../src/models/BoardMember.js'
import Post from '../../src/models/Post.js'
import Comment from '../../src/models/Comment.js'
import Vote from '../../src/models/Vote.js'
import SavedItem from '../../src/models/SavedItem.js'

// Mock Sequelize Models individually
jest.mock('../../src/models/Board.js')
jest.mock('../../src/models/BoardMember.js')
jest.mock('../../src/models/Post.js')
jest.mock('../../src/models/Comment.js')
jest.mock('../../src/models/Vote.js')
jest.mock('../../src/models/SavedItem.js')

describe('Community Service Unit Tests', () => {
  let mockUser
  let mockBoard
  let mockPost
  let mockComment
  let mockVote

  beforeEach(() => {
    jest.clearAllMocks()

    mockUser = { id: 'user-1', name: 'Pratyush Prakash', role: 'member' }
    
    mockBoard = {
      id: 'board-1',
      name: 'himachal-treks',
      display_name: 'Himachal Treks',
      description: 'Himachal travel guide board',
      type: 'public',
      increment: jest.fn().mockResolvedValue(true),
      decrement: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ id: 'board-1', name: 'himachal-treks', display_name: 'Himachal Treks' })
    }

    mockPost = {
      id: 'post-1',
      board_id: 'board-1',
      user_id: 'user-1',
      title: 'Solo Trip to Spiti',
      type: 'text',
      content: 'Beautiful trip notes',
      upvotes: 1,
      downvotes: 0,
      score: 1,
      destroy: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ id: 'post-1', title: 'Solo Trip to Spiti', score: 1 })
    }

    mockComment = {
      id: 'comment-1',
      post_id: 'post-1',
      user_id: 'user-1',
      parent_id: null,
      content: 'Great guide!',
      upvotes: 1,
      downvotes: 0,
      score: 1,
      destroy: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ id: 'comment-1', content: 'Great guide!', score: 1 })
    }

    mockVote = {
      id: 'vote-1',
      user_id: 'user-1',
      target_type: 'post',
      target_id: 'post-1',
      vote_value: 1,
      save: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true)
    }

    Board.create = jest.fn().mockResolvedValue(mockBoard)
    Board.findOne = jest.fn().mockResolvedValue(mockBoard)
    Board.findAll = jest.fn().mockResolvedValue([mockBoard])
    BoardMember.create = jest.fn().mockResolvedValue({ id: 'member-1' })
    BoardMember.findOne = jest.fn().mockResolvedValue(null)
    BoardMember.findOrCreate = jest.fn().mockResolvedValue([{ id: 'member-1' }, true])
    BoardMember.destroy = jest.fn().mockResolvedValue(1)
    
    Post.create = jest.fn().mockResolvedValue(mockPost)
    Post.findOne = jest.fn().mockResolvedValue(mockPost)
    Post.findAll = jest.fn().mockResolvedValue([mockPost])
    Post.update = jest.fn().mockResolvedValue([1])
    Post.findByPk = jest.fn().mockResolvedValue(mockPost)

    Comment.create = jest.fn().mockResolvedValue(mockComment)
    Comment.findAll = jest.fn().mockResolvedValue([mockComment])
    Comment.findByPk = jest.fn().mockResolvedValue(mockComment)

    Vote.findOne = jest.fn().mockResolvedValue(mockVote)
    Vote.create = jest.fn().mockResolvedValue(mockVote)

    SavedItem.findOne = jest.fn().mockResolvedValue(null)
    SavedItem.create = jest.fn().mockResolvedValue({ id: 'save-1' })
  })

  test('createBoard creates a board and registers creator as admin', async () => {
    const board = await communityService.createBoard('user-1', {
      name: 'himachal-treks',
      display_name: 'Himachal Treks'
    })
    
    expect(board).toBeDefined()
    expect(Board.create).toHaveBeenCalled()
    expect(BoardMember.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        role: 'admin'
      }),
      expect.any(Object)
    )
  })

  test('subscribeBoard creates BoardMember entry and increments member count', async () => {
    const res = await communityService.subscribeBoard('user-1', 'himachal-treks')
    expect(res.subscribed).toBe(true)
    expect(BoardMember.findOrCreate).toHaveBeenCalled()
    expect(mockBoard.increment).toHaveBeenCalledWith('member_count', { by: 1, transaction: expect.any(Object) })
  })

  test('unsubscribeBoard destroys BoardMember entry and decrements member count', async () => {
    const res = await communityService.unsubscribeBoard('user-1', 'himachal-treks')
    expect(res.subscribed).toBe(false)
    expect(BoardMember.destroy).toHaveBeenCalled()
    expect(mockBoard.decrement).toHaveBeenCalledWith('member_count', { by: 1, transaction: expect.any(Object) })
  })

  test('createPost creates post and auto-upvotes it', async () => {
    const post = await communityService.createPost('user-1', {
      board_name: 'himachal-treks',
      title: 'Solo Trip to Spiti',
      type: 'text'
    })

    expect(post).toBeDefined()
    expect(Post.create).toHaveBeenCalled()
    expect(Vote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        target_type: 'post',
        vote_value: 1
      })
    )
  })

  test('toggleSaveItem toggles bookmark status of a post', async () => {
    const firstCall = await communityService.toggleSaveItem('user-1', 'post', 'post-1')
    expect(firstCall.saved).toBe(true)
    expect(SavedItem.create).toHaveBeenCalled()

    // Mock item already exists to test unsave toggling
    SavedItem.findOne = jest.fn().mockResolvedValue({
      destroy: jest.fn().mockResolvedValue(true)
    })
    const secondCall = await communityService.toggleSaveItem('user-1', 'post', 'post-1')
    expect(secondCall.saved).toBe(false)
  })
})
