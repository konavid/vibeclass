'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import InstructorLayout from '@/components/instructor/InstructorLayout'

interface Qna {
  id: number
  title: string | null
  message: string
  response: string | null
  status: string
  isPublic: boolean
  createdAt: string
  respondedAt: string | null
  hiddenReason: string | null
  hiddenAt: string | null
  user: {
    id: number
    name: string
    email: string
    phone: string | null
  }
  course: {
    id: number
    title: string
  } | null
}

interface Stats {
  pending: number
  responded: number
  closed: number
  hidden: number
  total: number
}

export default function InstructorQnaPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [qnas, setQnas] = useState<Qna[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, responded: 0, closed: 0, hidden: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedQna, setSelectedQna] = useState<Qna | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isPublicReply, setIsPublicReply] = useState(false)
  const [replying, setReplying] = useState(false)
  const [hideQna, setHideQna] = useState<Qna | null>(null)
  const [hideReason, setHideReason] = useState('')
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user.role !== 'instructor' && session?.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchQnas()
  }, [session, status, router, filter])

  const fetchQnas = async () => {
    try {
      const response = await axios.get(`/api/instructor/qna?status=${filter}`)
      if (response.data.success) {
        setQnas(response.data.qnas)
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Q&A 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!selectedQna || !replyText.trim()) {
      alert('답변 내용을 입력해주세요.')
      return
    }

    setReplying(true)
    try {
      const response = await axios.post(`/api/instructor/qna/${selectedQna.id}/reply`, {
        response: replyText,
        isPublic: isPublicReply
      })

      if (response.data.success) {
        alert(response.data.message)
        setSelectedQna(null)
        setReplyText('')
        setIsPublicReply(false)
        fetchQnas()
      }
    } catch (error: any) {
      console.error('답변 등록 실패:', error)
      alert(error.response?.data?.error || '답변 등록에 실패했습니다.')
    } finally {
      setReplying(false)
    }
  }

  const handleHide = async () => {
    if (!hideQna || !hideReason.trim()) {
      alert('가리기 사유를 입력해주세요.')
      return
    }

    setHiding(true)
    try {
      const response = await axios.post(`/api/instructor/qna/${hideQna.id}/hide`, {
        reason: hideReason
      })

      if (response.data.success) {
        alert(response.data.message)
        setHideQna(null)
        setHideReason('')
        fetchQnas()
      }
    } catch (error: any) {
      console.error('가리기 실패:', error)
      alert(error.response?.data?.error || '가리기에 실패했습니다.')
    } finally {
      setHiding(false)
    }
  }

  const handleUnhide = async (qnaId: number) => {
    if (!confirm('가리기를 해제하시겠습니까?')) return

    try {
      const response = await axios.delete(`/api/instructor/qna/${qnaId}/hide`)
      if (response.data.success) {
        alert(response.data.message)
        fetchQnas()
      }
    } catch (error: any) {
      console.error('가리기 해제 실패:', error)
      alert(error.response?.data?.error || '가리기 해제에 실패했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { className: 'bg-yellow-100 text-yellow-800', text: '답변대기' }
      case 'responded':
        return { className: 'bg-green-100 text-green-800', text: '답변완료' }
      case 'closed':
        return { className: 'bg-gray-100 text-gray-800', text: '종료' }
      case 'hidden':
        return { className: 'bg-red-100 text-red-800', text: '가림' }
      default:
        return { className: 'bg-gray-100 text-gray-800', text: status }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">로딩 중...</div>
      </InstructorLayout>
    )
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">문의 관리</h1>
          <p className="text-gray-600 mt-1">수강생 문의에 답변하세요. 답변 시 SMS로 알림이 발송됩니다.</p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div
            onClick={() => setFilter('all')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border hover:border-gray-300'
            }`}
          >
            <p className={`text-sm ${filter === 'all' ? 'text-gray-300' : 'text-gray-500'}`}>전체</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white border hover:border-gray-300'
            }`}
          >
            <p className={`text-sm ${filter === 'pending' ? 'text-yellow-100' : 'text-gray-500'}`}>답변대기</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div
            onClick={() => setFilter('responded')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              filter === 'responded' ? 'bg-green-500 text-white' : 'bg-white border hover:border-gray-300'
            }`}
          >
            <p className={`text-sm ${filter === 'responded' ? 'text-green-100' : 'text-gray-500'}`}>답변완료</p>
            <p className="text-2xl font-bold">{stats.responded}</p>
          </div>
          <div
            onClick={() => setFilter('closed')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              filter === 'closed' ? 'bg-gray-500 text-white' : 'bg-white border hover:border-gray-300'
            }`}
          >
            <p className={`text-sm ${filter === 'closed' ? 'text-gray-200' : 'text-gray-500'}`}>종료</p>
            <p className="text-2xl font-bold">{stats.closed}</p>
          </div>
          <div
            onClick={() => setFilter('hidden')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              filter === 'hidden' ? 'bg-red-500 text-white' : 'bg-white border hover:border-gray-300'
            }`}
          >
            <p className={`text-sm ${filter === 'hidden' ? 'text-red-100' : 'text-gray-500'}`}>가림</p>
            <p className="text-2xl font-bold">{stats.hidden}</p>
          </div>
        </div>

        {/* 문의 목록 */}
        {qnas.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">문의가 없습니다</h3>
            <p className="text-gray-500">새로운 문의가 들어오면 SMS로 알림을 받으실 수 있습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {qnas.map((qna) => {
              const statusBadge = getStatusBadge(qna.status)
              return (
                <div
                  key={qna.id}
                  className="bg-white rounded-xl border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium">
                          {qna.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{qna.user.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                              {statusBadge.text}
                            </span>
                            {qna.isPublic && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                공개
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {qna.course?.title || '일반 문의'} · {formatDate(qna.createdAt)}
                          </div>
                        </div>
                      </div>
                      {qna.user.phone && (
                        <a
                          href={`tel:${qna.user.phone}`}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          {qna.user.phone}
                        </a>
                      )}
                    </div>

                    {qna.title && (
                      <h3 className="font-semibold text-gray-900 mb-2">{qna.title}</h3>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{qna.message}</p>

                    {/* 가림 상태 표시 */}
                    {qna.status === 'hidden' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-red-800">가리기 처리됨</span>
                          {qna.hiddenAt && (
                            <span className="text-xs text-red-600">
                              {formatDate(qna.hiddenAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-red-900 whitespace-pre-wrap">{qna.hiddenReason}</p>
                        <button
                          onClick={() => handleUnhide(qna.id)}
                          className="mt-3 px-4 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          가리기 해제
                        </button>
                      </div>
                    )}

                    {/* 답변 영역 */}
                    {qna.status !== 'hidden' && (
                      <>
                        {qna.response ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-green-800">내 답변</span>
                              {qna.respondedAt && (
                                <span className="text-xs text-green-600">
                                  {formatDate(qna.respondedAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-green-900 whitespace-pre-wrap">{qna.response}</p>
                          </div>
                        ) : (
                          <div className="mt-4">
                            {selectedQna?.id === qna.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="답변을 입력해주세요..."
                                  rows={4}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                />
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={isPublicReply}
                                      onChange={(e) => setIsPublicReply(e.target.checked)}
                                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                    />
                                    공개 답변으로 설정
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedQna(null)
                                        setReplyText('')
                                        setIsPublicReply(false)
                                      }}
                                      className="px-4 py-2 text-gray-600 hover:text-gray-900"
                                    >
                                      취소
                                    </button>
                                    <button
                                      onClick={handleReply}
                                      disabled={replying}
                                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                    >
                                      {replying ? '등록 중...' : '답변 등록'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedQna(qna)
                                    setIsPublicReply(qna.isPublic)
                                  }}
                                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                  답변하기
                                </button>
                                <button
                                  onClick={() => setHideQna(qna)}
                                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  가리기
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 가리기 모달 */}
      {hideQna && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">문의 가리기</h3>
              <p className="text-sm text-gray-500 mt-1">가리기 사유를 입력해주세요. 가림 처리된 문의는 수강생에게 표시되지 않습니다.</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 font-medium mb-1">{hideQna.user.name}님의 문의</p>
                <p className="text-gray-900 line-clamp-3">{hideQna.message}</p>
              </div>
              <textarea
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                placeholder="가리기 사유를 입력해주세요... (예: 스팸, 부적절한 내용, 중복 문의 등)"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="px-6 pb-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setHideQna(null)
                  setHideReason('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                취소
              </button>
              <button
                onClick={handleHide}
                disabled={hiding || !hideReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {hiding ? '처리 중...' : '가리기 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </InstructorLayout>
  )
}
