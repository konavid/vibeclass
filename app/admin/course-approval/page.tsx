'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Course {
  id: number
  title: string
  description: string
  price: number
  isFree: boolean
  status: string
  approvalStatus: string
  approvalNote: string | null
  thumbnailUrl: string | null
  submittedAt: string | null
  approvedAt: string | null
  category: {
    id: number
    name: string
  }
  instructor: {
    id: number
    name: string
    email: string
    user: {
      id: number
      name: string
      email: string
    } | null
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: '승인대기', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  approved: { label: '승인됨', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '거절됨', bgColor: 'bg-red-100', textColor: 'text-red-700' },
}

export default function AdminCourseApprovalPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [approvalNote, setApprovalNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [statusFilter])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/course-approval?status=${statusFilter}`)
      const data = await res.json()
      if (data.success) {
        setCourses(data.courses)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error('강의 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (course: Course, action: 'approve' | 'reject') => {
    setSelectedCourse(course)
    setActionType(action)
    setApprovalNote('')
    setShowModal(true)
  }

  const executeAction = async () => {
    if (!selectedCourse) return

    if (actionType === 'reject' && !approvalNote.trim()) {
      alert('거절 사유를 입력해주세요.')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/admin/course-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          action: actionType,
          note: approvalNote
        })
      })

      const data = await res.json()
      if (data.success) {
        alert(`강의가 ${actionType === 'approve' ? '승인' : '거절'}되었습니다.`)
        setShowModal(false)
        fetchCourses()
      } else {
        alert(data.error || '처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('처리 실패:', error)
      alert('처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">강의 승인 관리</h1>
          <p className="mt-2 text-sm text-gray-600">강사가 등록한 강의를 검토하고 승인합니다</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 mb-1">승인 대기</p>
          <p className="text-3xl font-bold text-yellow-700">{counts.pending}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-1">승인됨</p>
          <p className="text-3xl font-bold text-green-700">{counts.approved}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-1">거절됨</p>
          <p className="text-3xl font-bold text-red-700">{counts.rejected}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          {[
            { value: 'pending', label: '승인대기' },
            { value: 'approved', label: '승인됨' },
            { value: 'rejected', label: '거절됨' },
            { value: 'all', label: '전체' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === item.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
              {item.value === 'pending' && counts.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 강의 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {statusFilter === 'pending' ? '승인 대기 중인 강의가 없습니다' : '강의가 없습니다'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {courses.map((course) => {
              const statusConfig = STATUS_CONFIG[course.approvalStatus] || STATUS_CONFIG.pending
              return (
                <div key={course.id} className="p-6 hover:bg-gray-50">
                  <div className="flex gap-6">
                    {/* 썸네일 */}
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-40 h-28 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-40 h-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-4xl text-gray-300">📚</span>
                      </div>
                    )}

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-semibold text-gray-900 truncate">
                              {course.title}
                            </h2>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <span className="inline-flex items-center gap-1 mr-4">
                              <span className="text-gray-400">카테고리:</span>
                              {course.category.name}
                            </span>
                            <span className="inline-flex items-center gap-1 mr-4">
                              <span className="text-gray-400">가격:</span>
                              {course.isFree ? '무료' : `${course.price.toLocaleString()}원`}
                            </span>
                          </div>

                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {stripHtml(course.description)}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              <span className="text-gray-400">강사:</span>{' '}
                              <span className="text-gray-700 font-medium">
                                {course.instructor?.name || '-'}
                              </span>
                              {course.instructor?.user?.email && (
                                <span className="text-gray-400 ml-1">({course.instructor.user.email})</span>
                              )}
                            </span>
                            <span>
                              <span className="text-gray-400">제출일:</span>{' '}
                              {formatDate(course.submittedAt)}
                            </span>
                          </div>

                          {course.approvalNote && (
                            <div className={`mt-3 p-3 rounded-lg text-sm ${
                              course.approvalStatus === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-green-50 text-green-700'
                            }`}>
                              <span className="font-medium">
                                {course.approvalStatus === 'rejected' ? '거절 사유: ' : '승인 메모: '}
                              </span>
                              {course.approvalNote}
                            </div>
                          )}
                        </div>

                        {/* 버튼 */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedCourse(course)
                              setShowDetailModal(true)
                            }}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            상세보기
                          </button>
                          {course.approvalStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(course, 'approve')}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handleAction(course, 'reject')}
                                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              >
                                거절
                              </button>
                            </>
                          )}
                          {course.approvalStatus === 'rejected' && (
                            <button
                              onClick={() => handleAction(course, 'approve')}
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              재승인
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 승인/거절 모달 */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? '강의 승인' : '강의 거절'}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                강의명: <span className="font-medium text-gray-900">{selectedCourse.title}</span>
              </p>
              <p className="text-sm text-gray-600">
                강사: <span className="font-medium text-gray-900">{selectedCourse.instructor?.name || '-'}</span>
              </p>
            </div>

            {actionType === 'approve' ? (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>승인 시:</strong><br />
                  • 강의가 사이트에 게시됩니다<br />
                  • 수강생들이 해당 강의를 볼 수 있습니다<br />
                  • 강사가 기수를 추가할 수 있습니다
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>거절 시:</strong><br />
                  • 강의가 비공개 상태로 유지됩니다<br />
                  • 강사에게 거절 사유가 전달됩니다<br />
                  • 강사가 수정 후 재신청할 수 있습니다
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? '승인 메모 (선택)' : '거절 사유'}
                {actionType === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={actionType === 'approve'
                  ? '예: 강의 내용이 우수합니다.'
                  : '예: 강의 설명이 부족합니다. 커리큘럼을 더 상세히 작성해주세요.'
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={executeAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processing ? '처리 중...' : (actionType === 'approve' ? '승인' : '거절')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">강의 상세 정보</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* 기본 정보 */}
              <div className="mb-6">
                <div className="flex gap-6 mb-4">
                  {selectedCourse.thumbnailUrl ? (
                    <img
                      src={selectedCourse.thumbnailUrl}
                      alt={selectedCourse.title}
                      className="w-48 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-4xl text-gray-300">📚</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedCourse.title}</h4>
                    <p className="text-gray-600 mb-2">카테고리: {selectedCourse.category.name}</p>
                    <p className="text-gray-600 mb-2">
                      가격: {selectedCourse.isFree ? '무료' : `${selectedCourse.price.toLocaleString()}원`}
                    </p>
                    <p className="text-gray-600">강사: {selectedCourse.instructor?.name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              <div className="mb-6">
                <h5 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">강의 설명</h5>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedCourse.description }}
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                닫기
              </button>
              {selectedCourse.approvalStatus === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      handleAction(selectedCourse, 'approve')
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      handleAction(selectedCourse, 'reject')
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    거절
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
