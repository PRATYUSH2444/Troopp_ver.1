import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthModal from '../../components/auth/AuthModal.jsx'
import Button from '../../components/common/Button.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { haptics } from '../../utils/haptics.js'

// Recursive Nested Comment Node Component
const CommentNode = ({ comment, depth = 0, onVote, onReply, onEdit, onReport, currentUserId, onDelete }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [submittingEdit, setSubmittingEdit] = useState(false)

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
  const trustScore = comment.User?.trust_score ?? 50

  return (
    <div className="flex flex-col gap-2 mt-3 text-left">
      <div className="flex gap-2.5">
        {depth > 0 && (
          <div className="flex justify-center w-5 shrink-0 relative">
            <div
              className="w-[2px] bg-[#1c2130] hover:bg-[#ff6a2c]/50 cursor-pointer transition-colors h-full absolute left-1/2 -translate-x-1/2 rounded-full"
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#9096ab]">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-[#5c6178] hover:text-[#f3f4f8] font-mono text-[10px] w-4 h-4 rounded bg-[#181c29] border border-[#262b3a] flex items-center justify-center cursor-pointer"
            >
              {collapsed ? '+' : '−'}
            </button>
            <Avatar
              src={comment.User?.Profile?.avatar_url}
              name={comment.User?.Profile?.name || 'Explorer'}
              size="xs"
              score={trustScore}
            />
            <Link to={comment.user_id ? `/profile/${comment.user_id}` : '#'} className="font-bold text-[#f3f4f8] hover:text-[#ff6a2c] text-decoration-none">
              {comment.User?.Profile?.name || '[deleted]'}
            </Link>
            {trustScore > 0 && (
              <span className="text-[10px] font-mono font-bold text-[#33d189] bg-[#122a20] px-1.5 py-0.2 rounded border border-[#33d189]/30">
                ★ {trustScore}
              </span>
            )}
            <span className="text-[#5c6178]">•</span>
            <span className="text-[11px] text-[#5c6178]">
              {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {!collapsed && (
            <div className="pl-6 pt-1 flex flex-col gap-2">
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
                  className="flex flex-col gap-2 p-3 rounded-xl bg-[#181c29] border border-[#262b3a] my-1"
                >
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full text-xs bg-[#0c1017] border border-[#262b3a] rounded-lg p-2 text-[#f3f4f8] outline-none resize-none min-h-[60px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 text-xs text-[#9096ab] hover:text-[#f3f4f8] bg-transparent border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEdit}
                      className="px-3 py-1 text-xs font-bold text-[#1a0e08] bg-[#ff6a2c] rounded-lg border-none cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs sm:text-sm text-[#c4c5d9] leading-relaxed m-0 whitespace-pre-line">
                  {comment.content}
                </p>
              )}

              {/* Comment Actions Toolbar */}
              {!isDeleted && (
                <div className="flex items-center gap-3 text-xs text-[#5c6178] pt-1">
                  <div className="flex items-center gap-1 bg-[#181c29] px-2 py-0.5 rounded-lg border border-[#262b3a]">
                    <button
                      onClick={() => handleVoteClick(1)}
                      className={`border-none bg-transparent cursor-pointer text-xs ${comment.user_vote === 1 ? 'text-[#ff6a2c]' : 'text-[#5c6178] hover:text-[#f3f4f8]'}`}
                    >
                      ▲
                    </button>
                    <span className="font-mono font-bold text-[11px] text-[#f3f4f8]">{comment.score || 0}</span>
                    <button
                      onClick={() => handleVoteClick(-1)}
                      className={`border-none bg-transparent cursor-pointer text-xs ${comment.user_vote === -1 ? 'text-[#ff5470]' : 'text-[#5c6178] hover:text-[#f3f4f8]'}`}
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    onClick={() => setReplyOpen(!replyOpen)}
                    className="text-xs text-[#9096ab] hover:text-[#ff6a2c] bg-transparent border-none cursor-pointer font-semibold"
                  >
                    Reply
                  </button>

                  {isAuthor && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-[#9096ab] hover:text-[#f3f4f8] bg-transparent border-none cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(comment.id)}
                        className="text-xs text-[#ff5470] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Delete
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onReport?.('comment', comment.id)}
                    className="text-xs text-[#5c6178] hover:text-[#ff5470] bg-transparent border-none cursor-pointer ml-auto"
                  >
                    Report
                  </button>
                </div>
              )}

              {/* Reply Box */}
              {replyOpen && (
                <form onSubmit={handleReplySubmit} className="flex flex-col gap-2 p-3 bg-[#181c29] border border-[#262b3a] rounded-xl my-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your constructive reply..."
                    className="w-full bg-[#0c1017] border border-[#262b3a] rounded-lg p-2.5 text-xs text-[#f3f4f8] placeholder:text-[#5c6178] outline-none resize-none min-h-[70px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyOpen(false)}
                      className="px-3 py-1.5 text-xs text-[#9096ab] hover:text-[#f3f4f8] bg-transparent border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReply || !replyText.trim()}
                      className="px-4 py-1.5 text-xs font-bold bg-[#ff6a2c] text-[#1a0e08] rounded-lg border-none cursor-pointer disabled:opacity-50"
                    >
                      {submittingReply ? 'Posting...' : 'Post Reply'}
                    </button>
                  </div>
                </form>
              )}

              {/* Nested Child Comments */}
              {comment.children && comment.children.length > 0 && (
                <div className="flex flex-col gap-2">
                  {comment.children.map(child => (
                    <CommentNode
                      key={child.id}
                      comment={child}
                      depth={depth + 1}
                      onVote={onVote}
                      onReply={onReply}
                      onEdit={onEdit}
                      onReport={onReport}
                      onDelete={onDelete}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * PostDetail — Full Thread View with Nested Comments and Trip Proof
 */
const PostDetail = () => {
  const { postId } = useParams()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const triggerAuthModal = (action) => {
    setPendingAction(() => action)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = () => {
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    fetchPostDetails?.()
    fetchComments?.()
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
