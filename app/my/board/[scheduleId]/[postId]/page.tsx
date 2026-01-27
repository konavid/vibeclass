'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface User {
  id: number
  name: string
  nickname: string | null
  image: string | null
  role: string
}

interface Comment {
  id: number
  content: string
  createdAt: string
  updatedAt: string
  user: User
  replies?: Comment[]
}

interface Post {
  id: number
  title: string
  content: string
  isNotice: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  user: User
  schedule: {
    id: number
    cohort: number
    course: { title: string }
  }
  comments: Comment[]
  _count: { comments: number }
}

export default function BoardPostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = parseInt(params.scheduleId as string)
  const postId = parseInt(params.postId as string)

  const [post, setPost] = useState<Post | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  // 수정 모드
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editPostContent, setEditPostContent] = useState('')
  const [editIsNotice, setEditIsNotice] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cohort-board/posts/${postId}`)
      const data = await res.json()

      if (res.ok) {
        setPost(data.post)
        setIsOwner(data.isOwner)
        setIsStaff(data.isStaff)
        setError(null)
      } else {
        setError(data.error || '게시글을 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('게시글을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/cohort-board/posts/${postId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.push(`/my/board/${scheduleId}`)
      } else {
        const data = await res.json()
        alert(data.error || '삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = () => {
    if (!post) return
    setEditTitle(post.title)
    setEditPostContent(post.content)
    setEditIsNotice(post.isNotice)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editPostContent.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    try {
      const res = await fetch(`/api/cohort-board/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editPostContent.trim(),
          isNotice: isStaff ? editIsNotice : undefined
        })
      })

      if (res.ok) {
        setIsEditing(false)
        fetchPost()
      } else {
        const data = await res.json()
        alert(data.error || '수정에 실패했습니다.')
      }
    } catch (err) {
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleSubmitComment = async (parentId?: number) => {
    const content = parentId ? replyContent : commentContent
    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/cohort-board/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          parentId
        })
      })

      if (res.ok) {
        setCommentContent('')
        setReplyContent('')
        setReplyTo(null)
        fetchPost()
      } else {
        const data = await res.json()
        alert(data.error || '댓글 작성에 실패했습니다.')
      }
    } catch (err) {
      alert('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      const res = await fetch(`/api/cohort-board/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (res.ok) {
        setEditingComment(null)
        setEditContent('')
        fetchPost()
      } else {
        const data = await res.json()
        alert(data.error || '댓글 수정에 실패했습니다.')
      }
    } catch (err) {
      alert('댓글 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/cohort-board/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchPost()
      } else {
        const data = await res.json()
        alert(data.error || '댓글 삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserRole = (role: string) => {
    if (role === 'admin') return '관리자'
    if (role === 'instructor') return '강사'
    return null
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </CustomerLayout>
    )
  }

  if (error || !post) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || '게시글을 찾을 수 없습니다.'}</p>
            <Link
              href={`/my/board/${scheduleId}`}
              className="mt-4 inline-block text-indigo-600 hover:underline"
            >
              게시판으로 돌아가기
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/my/enrollments" className="hover:text-indigo-600">내 구매 목록</Link>
            <span>/</span>
            <Link href={`/my/board/${scheduleId}`} className="hover:text-indigo-600">
              {post.schedule.course.title} {post.schedule.cohort}기
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 게시글 */}
          <div className="bg-white rounded-lg shadow mb-6">
            {isEditing ? (
              /* 수정 모드 */
              <div className="p-6">
                {isStaff && (
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editIsNotice}
                        onChange={(e) => setEditIsNotice(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">공지사항</span>
                    </label>
                  </div>
                )}
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="제목"
                />
                <textarea
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="내용"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              /* 보기 모드 */
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isNotice && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                        공지
                      </span>
                    )}
                    <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">
                        {post.user.nickname || post.user.name}
                      </span>
                      {getUserRole(post.user.role) && (
                        <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                          {getUserRole(post.user.role)}
                        </span>
                      )}
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>·</span>
                      <span>조회 {post.viewCount}</span>
                    </div>
                    {(isOwner || isStaff) && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleEdit}
                          className="text-gray-600 hover:text-indigo-600"
                        >
                          수정
                        </button>
                        <button
                          onClick={handleDelete}
                          className="text-gray-600 hover:text-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-6 py-6">
                  <div className="prose max-w-none whitespace-pre-wrap">
                    {post.content}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 댓글 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">댓글 {post._count.comments}개</h2>
            </div>

            {/* 댓글 목록 */}
            <div className="divide-y divide-gray-200">
              {post.comments.map((comment) => (
                <div key={comment.id}>
                  {/* 댓글 */}
                  <CommentItem
                    comment={comment}
                    isStaff={isStaff}
                    getUserRole={getUserRole}
                    formatDate={formatDate}
                    onReply={() => {
                      setReplyTo(comment.id)
                      setReplyContent('')
                    }}
                    onEdit={() => {
                      setEditingComment(comment.id)
                      setEditContent(comment.content)
                    }}
                    onDelete={() => handleDeleteComment(comment.id)}
                    isEditing={editingComment === comment.id}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    onSaveEdit={() => handleEditComment(comment.id)}
                    onCancelEdit={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                  />

                  {/* 대댓글 입력 */}
                  {replyTo === comment.id && (
                    <div className="px-6 py-3 pl-16 bg-gray-50">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="답글을 입력하세요"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setReplyTo(null)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleSubmitComment(comment.id)}
                          disabled={submitting}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                          등록
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 대댓글 목록 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="bg-gray-50">
                      {comment.replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          isReply
                          isStaff={isStaff}
                          getUserRole={getUserRole}
                          formatDate={formatDate}
                          onEdit={() => {
                            setEditingComment(reply.id)
                            setEditContent(reply.content)
                          }}
                          onDelete={() => handleDeleteComment(reply.id)}
                          isEditing={editingComment === reply.id}
                          editContent={editContent}
                          setEditContent={setEditContent}
                          onSaveEdit={() => handleEditComment(reply.id)}
                          onCancelEdit={() => {
                            setEditingComment(null)
                            setEditContent('')
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 댓글 입력 */}
            <div className="px-6 py-4 border-t border-gray-200">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="댓글을 입력하세요"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleSubmitComment()}
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  댓글 등록
                </button>
              </div>
            </div>
          </div>

          {/* 목록 버튼 */}
          <div className="mt-6">
            <Link
              href={`/my/board/${scheduleId}`}
              className="inline-flex items-center text-gray-600 hover:text-indigo-600"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

// 댓글 아이템 컴포넌트
function CommentItem({
  comment,
  isReply = false,
  isStaff,
  getUserRole,
  formatDate,
  onReply,
  onEdit,
  onDelete,
  isEditing,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit
}: {
  comment: Comment
  isReply?: boolean
  isStaff: boolean
  getUserRole: (role: string) => string | null
  formatDate: (dateStr: string) => string
  onReply?: () => void
  onEdit: () => void
  onDelete: () => void
  isEditing: boolean
  editContent: string
  setEditContent: (content: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  return (
    <div className={`px-6 py-4 ${isReply ? 'pl-16' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-700">
            {comment.user.nickname || comment.user.name}
          </span>
          {getUserRole(comment.user.role) && (
            <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
              {getUserRole(comment.user.role)}
            </span>
          )}
          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
        </div>
        <div className="flex gap-2 text-sm">
          {onReply && (
            <button onClick={onReply} className="text-gray-500 hover:text-indigo-600">
              답글
            </button>
          )}
          <button onClick={onEdit} className="text-gray-500 hover:text-indigo-600">
            수정
          </button>
          <button onClick={onDelete} className="text-gray-500 hover:text-red-600">
            삭제
          </button>
        </div>
      </div>
      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onCancelEdit}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={onSaveEdit}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
      )}
    </div>
  )
}
