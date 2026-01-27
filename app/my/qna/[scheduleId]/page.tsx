'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface Qna {
  id: number
  title: string
  question: string
  answer: string | null
  isPublic: boolean
  createdAt: string
  answeredAt: string | null
  user: {
    id: number
    name: string
    nickname: string | null
  }
  admin: {
    id: number
    name: string
  } | null
}

interface Schedule {
  id: number
  cohort: number
  courseTitle: string
}

export default function QnaListPage() {
  const params = useParams()
  const scheduleId = parseInt(params.scheduleId as string)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [qnas, setQnas] = useState<Qna[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedQna, setSelectedQna] = useState<Qna | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    isPublic: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQnas()
  }, [scheduleId])

  const fetchQnas = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cohort-qna?scheduleId=${scheduleId}`)
      const data = await res.json()

      if (res.ok) {
        setSchedule(data.schedule)
        setQnas(data.qnas)
        setError(null)
      } else {
        setError(data.error || 'QnA를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('QnA를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.question) {
      alert('제목과 질문 내용을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/cohort-qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          ...formData
        })
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({ title: '', question: '', isPublic: true })
        fetchQnas()
      } else {
        const data = await res.json()
        alert(data.error || '질문 등록에 실패했습니다.')
      }
    } catch (err) {
      alert('질문 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <Link
              href="/my/enrollments"
              className="mt-4 inline-block text-indigo-600 hover:underline"
            >
              내 구매 목록으로 돌아가기
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
            <span>Q&A</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {schedule?.courseTitle} {schedule?.cohort}기 Q&A
              </h1>
              <p className="mt-1 text-gray-600">궁금한 점을 질문하세요</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              질문하기
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {qnas.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 질문이 없습니다</h3>
              <p className="mt-2 text-gray-500">첫 번째 질문을 등록해보세요.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                질문하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {qnas.map((qna) => (
                <div
                  key={qna.id}
                  className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition"
                  onClick={() => setSelectedQna(qna)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            qna.answer
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {qna.answer ? '답변완료' : '답변대기'}
                          </span>
                          {!qna.isPublic && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              비공개
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{qna.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{qna.question}</p>
                        <div className="mt-2 text-xs text-gray-400">
                          {qna.user.nickname || qna.user.name} · {formatDate(qna.createdAt)}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 뒤로가기 */}
          <div className="mt-6">
            <Link
              href="/my/enrollments"
              className="inline-flex items-center text-gray-600 hover:text-indigo-600"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              내 구매 목록으로
            </Link>
          </div>
        </div>
      </div>

      {/* 질문 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">질문하기</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="질문 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  질문 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={5}
                  placeholder="궁금한 점을 자세히 적어주세요"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">다른 수강생에게도 공개</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">체크하면 같은 기수 수강생도 질문과 답변을 볼 수 있습니다.</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '질문 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 질문 상세 모달 */}
      {selectedQna && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedQna.answer
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedQna.answer ? '답변완료' : '답변대기'}
                  </span>
                  {!selectedQna.isPublic && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      비공개
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedQna(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedQna.title}</h2>
              <div className="text-xs text-gray-500 mb-4">
                {selectedQna.user.nickname || selectedQna.user.name} · {formatDate(selectedQna.createdAt)}
              </div>

              {/* 질문 내용 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Q</span>
                  <span className="text-sm font-medium text-gray-700">질문</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedQna.question}</p>
              </div>

              {/* 답변 */}
              {selectedQna.answer ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">A</span>
                    <span className="text-sm font-medium text-gray-700">답변</span>
                    {selectedQna.admin && (
                      <span className="text-xs text-gray-500">
                        · {selectedQna.admin.name} · {selectedQna.answeredAt && formatDate(selectedQna.answeredAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedQna.answer}</p>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-yellow-800">아직 답변이 등록되지 않았습니다.</p>
                  <p className="text-sm text-yellow-600 mt-1">관리자가 확인 후 답변해드립니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}
