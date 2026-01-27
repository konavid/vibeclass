'use client'

import { useState, useEffect } from 'react'

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
    email: string
  }
  admin: {
    id: number
    name: string
  } | null
  schedule: {
    id: number
    cohort: number
    course: {
      title: string
    }
  }
}

export default function AdminQnaPage() {
  const [qnas, setQnas] = useState<Qna[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('unanswered') // all, answered, unanswered
  const [selectedQna, setSelectedQna] = useState<Qna | null>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [unansweredCount, setUnansweredCount] = useState(0)

  useEffect(() => {
    fetchQnas()
  }, [filter])

  const fetchQnas = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/cohort-qna?status=${filter}`)
      const data = await res.json()

      if (res.ok) {
        setQnas(data.qnas)
        setUnansweredCount(data.unansweredCount)
      }
    } catch (err) {
      console.error('QnA 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async () => {
    if (!selectedQna || !answer.trim()) {
      alert('답변 내용을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/admin/cohort-qna', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedQna.id,
          answer: answer.trim()
        })
      })

      if (res.ok) {
        setSelectedQna(null)
        setAnswer('')
        fetchQnas()
      } else {
        alert('답변 등록에 실패했습니다.')
      }
    } catch (err) {
      alert('답변 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/cohort-qna?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchQnas()
      }
    } catch (err) {
      console.error('삭제 실패:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openAnswerModal = (qna: Qna) => {
    setSelectedQna(qna)
    setAnswer(qna.answer || '')
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Q&A 관리</h1>
          {unansweredCount > 0 && (
            <p className="text-sm text-red-600 mt-1">
              미답변 질문 {unansweredCount}건이 있습니다.
            </p>
          )}
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('unanswered')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'unanswered'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          미답변
        </button>
        <button
          onClick={() => setFilter('answered')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'answered'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          답변완료
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
      </div>

      {/* QnA 목록 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : qnas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">
            {filter === 'unanswered' ? '미답변 질문이 없습니다.' : '등록된 질문이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">과정/기수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">질문</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qnas.map((qna) => (
                <tr key={qna.id} className={!qna.answer ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      qna.answer
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {qna.answer ? '답변완료' : '미답변'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {qna.schedule.course.title} {qna.schedule.cohort}기
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{qna.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{qna.question}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{qna.user.nickname || qna.user.name}</div>
                    <div className="text-xs text-gray-500">{qna.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(qna.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => openAnswerModal(qna)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {qna.answer ? '답변수정' : '답변하기'}
                    </button>
                    <button
                      onClick={() => handleDelete(qna.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 답변 모달 */}
      {selectedQna && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-sm text-gray-500">
                    {selectedQna.schedule.course.title} {selectedQna.schedule.cohort}기
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{selectedQna.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedQna.user.nickname || selectedQna.user.name} ({selectedQna.user.email})
                    · {formatDate(selectedQna.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedQna(null)
                    setAnswer('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 질문 내용 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Q</span>
                  <span className="text-sm font-medium text-gray-700">질문 내용</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedQna.question}</p>
              </div>

              {/* 답변 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답변 내용
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={6}
                  placeholder="답변을 입력하세요..."
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedQna(null)
                    setAnswer('')
                  }}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleAnswer}
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '답변 등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
