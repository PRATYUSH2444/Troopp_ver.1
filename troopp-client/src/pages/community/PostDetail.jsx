import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthModal from '../../components/auth/AuthModal.jsx'
import Button from '../../components/common/Button.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { haptics } from '../../utils/haptics.js'

// Recursive Comment Node Component
const CommentNode = ({ comment, depth = 0, onVote, onReply, onEdit, onReport, currentUserId, onDelete }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('Spam')
  const [submittingReport, setSubmittingReport] = useState(false)

  const handleVoteClick = (value) => {
    onVote(comment.id, value, comment.user_vote)
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSubmittingReply(true)
    try {
      await onReply(comment.id, replyText)
      setReplyText('')
      setReplyOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingReply(false)
    }
  }

  const isAuthor = comment.user_id === currentUserId
  const isDeleted = comment.content === '[deleted]'

  return (
    <div className="flex flex-col gap-2 mt-4 text-left">
      <div className="flex gap-3">
        {depth > 0 && (
          <div className="flex justify-center w-6 shrink-0 relative">
            <div
              className="w-[1.5px] bg-border hover:bg-accent/40 cursor-pointer transition-colors h-full absolute left-1/2 -translate-x-1/2"
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
        )}

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-text-tertiary">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-text-tertiary hover:text-accent font-bold font-mono text-center w-4 h-4 rounded hover:bg-surface-raised flex items-center justify-center border border-border"
            >
              {collapsed ? '+' : '−'}
            </button>
            <Avatar
              src={comment.User?.Profile?.avatar_url}
              name={comment.User?.Profile?.name || 'Explorer'}
              size="xs"
              gender={comment.User?.Profile?.gender}
            />
            <Link to={comment.user_id ? `/profile/${comment.user_id}` : '#'} className="hover:underline font-bold text-text-secondary">
              {comment.User?.Profile?.name || '[deleted]'}
            </Link>
            {comment.User?.trust_score !== undefined && comment.User?.trust_score > 0 && (
              <span className="bg-moss-soft text-moss px-1.5 py-0.5 rounded text-[9px] font-bold">
                ★ {comment.User?.trust_score}
              </span>
            )}
            <span>•</span>
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>

          {!collapsed && (
            <div className="pl-6 pt-1.5 flex flex-col gap-2">
              {isEditing ? (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!editText.trim()) return
                    setSubmittingEdit(true)
                    try {
                      await onEdit(comment.id, editText)
                      setIsEditing(false)
                    } catch (err) {
                      console.error(err)
                    } finally {
                      setSubmittingEdit(false)
                    }
                  }} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface-raised)', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '6px' }}
                >
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{
                      width: '100%',
                      fontSize: '13px',
                      background: 'var(--bg)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '10px',
                      padding: '10px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      resize: 'none',
                      minHeight: '70px'
                    }}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button type="button" onClick={() => setIsEditing(false)} variant="ghost" style={{ padding: '2px 12px', height: '28px', fontSize: '11px', borderRadius: '6px' }}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={submittingEdit} variant="primary" style={{ padding: '2px 14px', height: '28px', fontSize: '11px', borderRadius: '6px' }}>
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <p className={`text-xs leading-relaxed text-text-secondary ${isDeleted ? 'italic text-text-tertiary' : ''}`}>
                  {comment.content}
                  {comment.edited_at && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '6px', fontStyle: 'italic' }}>(edited)</span>}
                </p>
              )}

              {reportOpen && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setSubmittingReport(true)
                    try {
                      await onReport('comment', comment.id, reportReason)
                      setReportOpen(false)
                      alert('Comment reported successfully to moderators.')
                    } catch (err) {
                      console.error(err)
                    } finally {
                      setSubmittingReport(false)
                    }
                  }} 
                  style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--surface-raised)', padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: '10px', marginTop: '6px' }}
                >
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{
                      background: 'var(--bg)',
                      border: '1.5px solid var(--border)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="Spam">Spam</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Misinformation">Misinformation</option>
                    <option value="Inappropriate">Inappropriate</option>
                    <option value="Other">Other</option>
                  </select>
                  <Button type="submit" loading={submittingReport} variant="primary" style={{ padding: '2px 10px', height: '28px', fontSize: '11px', borderRadius: '6px' }}>
                    Submit
                  </Button>
                  <Button type="button" onClick={() => setReportOpen(false)} variant="ghost" style={{ padding: '2px 10px', height: '28px', fontSize: '11px', borderRadius: '6px' }}>
                    Cancel
                  </Button>
                </form>
              )}

              {!isDeleted && (
                <div className="flex items-center gap-4 text-[11px] text-text-tertiary mt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleVoteClick(1)}
                      className={`hover:text-accent transition-colors ${comment.user_vote === 1 ? 'text-accent' : ''}`}
                    >
                      ▲
                    </button>
                    <span className="font-bold font-mono text-text-secondary">{comment.score}</span>
                    <button
                      onClick={() => handleVoteClick(-1)}
                      className={`hover:text-danger transition-colors ${comment.user_vote === -1 ? 'text-danger' : ''}`}
                    >
                      ▼
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setReplyOpen(!replyOpen)}
                    className="hover:text-accent transition-colors font-semibold"
                  >
                    Reply
                  </button>

                  {isAuthor ? (
                    <>
                      <button
                        onClick={() => {
                          setEditText(comment.content)
                          setIsEditing(!isEditing)
                        }}
                        className="hover:text-accent transition-colors font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(comment.id)}
                        className="hover:text-danger transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    currentUserId && (
                      <button
                        onClick={() => setReportOpen(!reportOpen)}
                        className="hover:text-warning transition-colors font-semibold"
                      >
                        Report
                      </button>
                    )
                  )}
                </div>
              )}

              {replyOpen && (
                <form onSubmit={handleReplySubmit} className="mt-3 flex flex-col gap-2 p-3 bg-surface-raised/30 border border-border rounded-xl">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a supportive reply..."
                    className="w-full text-xs bg-bg border border-border rounded-lg p-2.5 focus:outline-none focus:border-accent text-text-primary resize-none min-h-[70px]"
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button 
                      type="button" 
                      onClick={() => setReplyOpen(false)} 
                      variant="ghost"
                      style={{
                        padding: '4px 14px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        color: 'var(--text-secondary)',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '11.5px'
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      loading={submittingReply} 
                      variant="primary"
                      style={{
                        padding: '4px 16px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '11.5px',
                        boxShadow: '0 2px 8px rgba(255,106,44,0.25)'
                      }}
                    >
                      Submit Reply
                    </Button>
                  </div>
                </form>
              )}

              {comment.replies && comment.replies.map(reply => (
                <CommentNode
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onVote={onVote}
                  onReply={onReply}
                  onEdit={onEdit}
                  onReport={onReport}
                  currentUserId={currentUserId}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

const PostDetail = () => {
  const { postId } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // State
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newCommentText, setNewCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  // Edit / Report Post
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [postEditText, setPostEditText] = useState('')
  const [submittingPostEdit, setSubmittingPostEdit] = useState(false)

  const [postReportOpen, setPostReportOpen] = useState(false)
  const [postReportReason, setPostReportReason] = useState('Spam')
  const [submittingPostReport, setSubmittingPostReport] = useState(false)

  // Poll state
  const [selectedPollOption, setSelectedPollOption] = useState(null)
  const [votingPoll, setVotingPoll] = useState(false)

  // Auth intercept
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const fetchPostDetails = async () => {
    try {
      const res = await apiRequest(`/community/posts/${postId}`)
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          setPost(json.data.post)
          setPostEditText(json.data.post.content || '')
          return
        }
      }
      setPost(null)
    } catch (err) {
      console.error(err)
      setPost(null)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await apiRequest(`/community/posts/${postId}/comments`)
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          setComments(json.data.comments || [])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchPostDetails(), fetchComments()]).finally(() => setLoading(false))
  }, [postId, isAuthenticated])

  const triggerAuthModal = (action) => {
    setPendingAction(() => action)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = () => {
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    fetchPostDetails()
    fetchComments()
  }

  const handlePostVote = async (value, currentVote) => {
    haptics.impactLight()
    if (!isAuthenticated) {
      triggerAuthModal(() => handlePostVote(value, currentVote))
      return
    }

    const targetValue = currentVote === value ? 0 : value
    setPost(prev => {
      let upvoteShift = 0
      let downvoteShift = 0
      if (currentVote === 1) upvoteShift -= 1
      if (currentVote === -1) downvoteShift -= 1
      if (targetValue === 1) upvoteShift += 1
      if (targetValue === -1) downvoteShift += 1
      return {
        ...prev,
        user_vote: targetValue,
        score: prev.score + (upvoteShift - downvoteShift)
      }
    })

    try {
      await apiRequest('/community/votes', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'post', target_id: postId, vote_value: targetValue })
      })
    } catch (err) {
      console.error('Post vote failed:', err)
      fetchPostDetails()
    }
  }

  const handleCommentVote = async (commentId, value, currentVote) => {
    haptics.impactLight()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleCommentVote(commentId, value, currentVote))
      return
    }

    const targetValue = currentVote === value ? 0 : value

    const updateCommentScore = (list) => {
      return list.map(c => {
        if (c.id === commentId) {
          let upvoteShift = 0
          let downvoteShift = 0
          if (currentVote === 1) upvoteShift -= 1
          if (currentVote === -1) downvoteShift -= 1
          if (targetValue === 1) upvoteShift += 1
          if (targetValue === -1) downvoteShift += 1
          return {
            ...c,
            user_vote: targetValue,
            score: c.score + (upvoteShift - downvoteShift)
          }
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateCommentScore(c.replies) }
        }
        return c
      })
    }

    setComments(prev => updateCommentScore(prev))

    try {
      await apiRequest('/community/votes', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'comment', target_id: commentId, vote_value: targetValue })
      })
    } catch (err) {
      console.error('Comment vote failed:', err)
      fetchComments()
    }
  }

  const handlePostSave = async () => {
    haptics.impactLight()
    if (!isAuthenticated) {
      triggerAuthModal(handlePostSave)
      return
    }

    setPost(prev => ({ ...prev, is_saved: !prev.is_saved }))
    try {
      await apiRequest('/community/saved-items/toggle', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'post', target_id: postId })
      })
    } catch (err) {
      console.error(err)
      fetchPostDetails()
    }
  }

  const handleTopLevelCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newCommentText.trim()) return

    if (!isAuthenticated) {
      triggerAuthModal(() => handleTopLevelCommentSubmit(e))
      return
    }

    setCommentSubmitting(true)
    try {
      const res = await apiRequest(`/community/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newCommentText })
      })
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success') {
          setNewCommentText('')
          fetchComments()
          fetchPostDetails()
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentId, text) => {
    if (!isAuthenticated) {
      triggerAuthModal(() => handleReplySubmit(parentId, text))
      return
    }
    const res = await apiRequest(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: text, parent_id: parentId })
    })
    if (res.ok) {
      const json = await res.json()
      if (json.status === 'success') {
        fetchComments()
        fetchPostDetails()
      }
    }
  }

  const handleCommentEdit = async (commentId, text) => {
    const res = await apiRequest(`/community/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content: text })
    })
    if (res.ok) {
      const json = await res.json()
      if (json.status === 'success') {
        fetchComments()
      }
    }
  }

  const handleReportItem = async (targetType, targetId, reason) => {
    await apiRequest('/community/reports', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason })
    })
  }

  const handleCommentDelete = async (commentId) => {
    haptics.impactLight()
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    try {
      await apiRequest(`/community/comments/${commentId}`, { method: 'DELETE' })
      fetchComments()
    } catch (err) {
      console.error('Comment delete failed:', err)
    }
  }

  const handlePostDelete = async () => {
    haptics.impactLight()
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return
    try {
      await apiRequest(`/community/posts/${postId}`, { method: 'DELETE' })
      navigate('/community')
    } catch (err) {
      console.error('Post delete failed:', err)
    }
  }

  const handlePollVoteSubmit = async () => {
    if (selectedPollOption === null) return
    setVotingPoll(true)
    try {
      const res = await apiRequest(`/community/posts/${postId}/poll/vote`, {
        method: 'POST',
        body: JSON.stringify({ option_id: selectedPollOption })
      })
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success') {
          fetchPostDetails()
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to cast vote')
    } finally {
      setVotingPoll(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-xl font-bold font-display text-accent">Discussion Not Found</h2>
        <p className="text-xs text-text-secondary">The community discussion post may have been deleted by moderator rule filters.</p>
        <Button onClick={() => navigate('/community')} variant="primary">Back to Community Home</Button>
      </div>
    )
  }

  const isPostAuthor = post.user_id === user?.id
  const isPostAdmin = user?.role === 'admin'
  const totalPollVotes = post.poll_results?.reduce((sum, r) => sum + r.votes, 0) || 0

  return (
    <div className="page-container-medium select-none">
      
      {/* Breadcrumb row */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <Link to="/community" className="hover:text-accent font-semibold">Home</Link>
          <span>/</span>
          {post.Board && (
            <Link to={`/community/b/${post.Board.name}`} className="hover:text-accent font-bold">
              b/{post.Board.name}
            </Link>
          )}
        </div>
        <button onClick={() => navigate(-1)} className="hover:text-accent transition-colors font-semibold">
          ← Back
        </button>
      </div>

      {/* Post Container */}
      <div className="community-card flex overflow-hidden">
        
        {/* Left vote bar */}
        <div className="community-vote-rail py-5">
          <button
            onClick={() => handlePostVote(1, post.user_vote)}
            className={`p-1.5 rounded-lg transition-colors ${
              post.user_vote === 1 ? 'text-accent bg-accent-soft' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-raised'
            }`}
          >
            ▲
          </button>
          <span className="text-xs font-bold font-mono my-1.5 text-text-secondary">
            {post.score}
          </span>
          <button
            onClick={() => handlePostVote(-1, post.user_vote)}
            className={`p-1.5 rounded-lg transition-colors ${
              post.user_vote === -1 ? 'text-danger' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-raised'
            }`}
          >
            ▼
          </button>
        </div>

        {/* Post main details */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          
          {/* Header info */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-text-tertiary">
            <span>Posted by</span>
            <Avatar
              src={post.User?.Profile?.avatar_url}
              name={post.User?.Profile?.name || 'Explorer'}
              size="xs"
              gender={post.User?.Profile?.gender}
            />
            <Link to={`/profile/${post.user_id}`} className="hover:underline font-bold text-text-secondary">
              {post.User?.Profile?.name || 'Explorer'}
            </Link>
            <span className="bg-moss-soft text-moss px-1.5 py-0.5 rounded text-[10px] font-bold">
              ★ {post.User?.trust_score ?? 50}
            </span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Title */}
          <h1 className="text-lg font-bold leading-tight font-display tracking-tight text-text-primary">
            {post.title}
          </h1>

          {/* Media / Image Rendering */}
          {post.type === 'image' && post.media_urls && post.media_urls.length > 0 && (
            <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img 
                src={post.media_urls[0]} 
                alt={post.title} 
                style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: 'var(--bg)' }} 
              />
            </div>
          )}

          {/* Link Rendering */}
          {post.type === 'link' && post.link_url && (
            <div style={{ marginTop: '8px' }}>
              <a 
                href={post.link_url} 
                target="_blank" 
                rel="noreferrer" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}
              >
                <span>🔗 Visit Link: {post.link_url}</span>
              </a>
            </div>
          )}

          {/* Poll Rendering */}
          {post.type === 'poll' && post.poll_results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '16px', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📊 Poll Choice Results ({totalPollVotes} votes cast)
              </span>
              
              {(post.poll_user_selection !== null || isPostAuthor || !isAuthenticated) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {post.poll_results.map(res => {
                    const percent = totalPollVotes > 0 ? Math.round((res.votes / totalPollVotes) * 100) : 0
                    const isUserChoice = post.poll_user_selection === res.option_id
                    return (
                      <div 
                        key={res.option_id} 
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          overflow: 'hidden',
                          background: 'var(--surface)'
                        }}
                      >
                        <div 
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            background: 'var(--accent)',
                            width: `${percent}%`,
                            zIndex: 1,
                            opacity: 0.12,
                            transition: 'width 0.4s ease'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2, fontSize: '13px', fontWeight: isUserChoice ? '700' : 'normal' }}>
                          <span>{res.option_text} {isUserChoice && '✔️'}</span>
                          <span>{percent}% ({res.votes})</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {post.poll_results.map(res => (
                      <label 
                        key={res.option_id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border)',
                          cursor: 'pointer',
                          background: 'var(--surface)'
                        }}
                      >
                        <input
                          type="radio"
                          name="poll_option"
                          value={res.option_id}
                          checked={selectedPollOption === res.option_id}
                          onChange={() => setSelectedPollOption(res.option_id)}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{res.option_text}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handlePollVoteSubmit}
                    disabled={selectedPollOption === null || votingPoll}
                    loading={votingPoll}
                    variant="primary"
                    style={{ alignSelf: 'flex-start', marginTop: '4px', padding: '6px 20px', height: '36px', borderRadius: '8px' }}
                  >
                    Submit Vote
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Post Content Body / Edit box */}
          {isEditingPost ? (
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                setSubmittingPostEdit(true)
                try {
                  const res = await apiRequest(`/community/posts/${postId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ content: postEditText })
                  })
                  if (res.ok) {
                    const json = await res.json()
                    if (json.status === 'success') {
                      setIsEditingPost(false)
                      fetchPostDetails()
                    }
                  }
                } catch (err) {
                  console.error(err)
                } finally {
                  setSubmittingPostEdit(false)
                }
              }} 
              className="flex flex-col gap-2 p-3 bg-surface-raised border border-border rounded-xl mt-2"
            >
              <textarea
                value={postEditText}
                onChange={(e) => setPostEditText(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '120px'
                }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button type="button" onClick={() => setIsEditingPost(false)} variant="ghost" style={{ padding: '4px 14px', height: '32px', fontSize: '12px' }}>
                  Cancel
                </Button>
                <Button type="submit" loading={submittingPostEdit} variant="primary" style={{ padding: '4px 16px', height: '32px', fontSize: '12px' }}>
                  Save Post
                </Button>
              </div>
            </form>
          ) : (
            post.content && (
              <p className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap mt-2">
                {post.content}
                {post.edited_at && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '6px', fontStyle: 'italic' }}>(edited)</span>}
              </p>
            )
          )}

          {/* Trip Report details map placeholder */}
          {post.type === 'trip_report' && post.trip_report_details && (
            <div className="p-4 bg-surface-raised border border-border rounded-xl flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-accent uppercase tracking-wider font-display">🗺️ Pinpoint Trip Route Details</span>
              <div className="text-xs text-text-secondary">
                <strong>Destination:</strong> {post.trip_report_details.destination || 'Unmarked Location'}
              </div>
              {post.trip_report_details.coordinates && (
                <div className="text-xs text-text-tertiary">
                  <strong>Coordinates:</strong> {post.trip_report_details.coordinates[1]}, {post.trip_report_details.coordinates[0]}
                </div>
              )}
            </div>
          )}

          {postReportOpen && (
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                setSubmittingPostReport(true)
                try {
                  await handleReportItem('post', postId, postReportReason)
                  setPostReportOpen(false)
                  alert('Post reported successfully to moderators.')
                } catch (err) {
                  console.error(err)
                } finally {
                  setSubmittingPostReport(false)
                }
              }} 
              style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--surface-raised)', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '12px', marginTop: '12px' }}
            >
              <select
                value={postReportReason}
                onChange={(e) => setPostReportReason(e.target.value)}
                style={{
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Misinformation">Misinformation</option>
                <option value="Inappropriate">Inappropriate</option>
                <option value="Other">Other</option>
              </select>
              <Button type="submit" loading={submittingPostReport} variant="primary" style={{ padding: '4px 14px', height: '32px', fontSize: '12px' }}>
                Submit Report
              </Button>
              <Button type="button" onClick={() => setPostReportOpen(false)} variant="ghost" style={{ padding: '4px 14px', height: '32px', fontSize: '12px' }}>
                Cancel
              </Button>
            </form>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePostSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  color: post.is_saved ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: post.is_saved ? '600' : 'normal',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-raised)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg style={{ width: '16px', height: '16px' }} fill={post.is_saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.022H6.407a1.69 1.69 0 00-1.688 1.69v16.14l7.281-4.708 7.281 4.708V4.712a1.69 1.69 0 00-1.688-1.69z" />
                </svg>
                <span>{post.is_saved ? 'Saved' : 'Save'}</span>
              </button>

              {isPostAuthor && (
                <button
                  onClick={() => setIsEditingPost(!isEditingPost)}
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-raised)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Edit
                </button>
              )}

              {!isPostAuthor && isAuthenticated && (
                <button
                  onClick={() => setPostReportOpen(!postReportOpen)}
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-raised)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Report
                </button>
              )}
            </div>

            {(isPostAuthor || isPostAdmin) && (
              <button
                onClick={handlePostDelete}
                className="text-xs text-text-tertiary hover:text-danger font-semibold transition-colors px-3 py-1.5 rounded-xl hover:bg-danger-soft/20"
              >
                Delete Post
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Comment Composer */}
      <div 
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
          Join the discussion
        </span>
        <form onSubmit={handleTopLevelCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="What are your thoughts or travel tips?"
            style={{
              width: '100%',
              fontSize: '13px',
              background: 'var(--bg)',
              border: '1.5px solid var(--border)',
              borderRadius: '12px',
              padding: '14px',
              outline: 'none',
              color: 'var(--text-primary)',
              resize: 'none',
              minHeight: '90px'
            }}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              loading={commentSubmitting}
              variant="primary"
              style={{
                padding: '10px 24px',
                height: '40px',
                borderRadius: '12px',
                border: 'none',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                cursor: 'pointer',
                fontWeight: '700',
                boxShadow: '0 4px 14px rgba(255,106,44,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Post Comment
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div 
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          Comments ({post.comment_count})
        </span>

        {comments.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '24px 0', textAlign: 'center', margin: 0 }}>No comments posted yet. Ask a question or share advice!</p>
        ) : (
          <div className="divide-y divide-border/20">
            {comments.map(comment => (
              <CommentNode
                key={comment.id}
                comment={comment}
                depth={0}
                onVote={handleCommentVote}
                onReply={handleReplySubmit}
                onEdit={handleCommentEdit}
                onReport={handleReportItem}
                currentUserId={user?.id}
                onDelete={handleCommentDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default PostDetail
