'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Enrollment {
  id: number
  status: string
  createdAt: string
  updatedAt?: string
  user: {
    id: number
    name: string
    email: string
    phone: string | null
  }
  schedule: {
    id: number
    cohort: number
    startDate: string
    endDate: string
    course: {
      id: number
      title: string
      isFree: boolean
      price: number
    }
  }
  payment: {
    id: number
    amount: number
    status: string
    method: string
    createdAt: string
    customerMemo: string | null
    kakaoPhone: string | null
    refundedAt: string | null
    failMessage: string | null
  } | null
}

interface Schedule {
  id: number
  cohort: number
}

interface Course {
  id: number
  title: string
  schedules?: Schedule[]
}

export default function AdminEnrollmentsPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [scheduleFilter, setScheduleFilter] = useState('all')
  const [selectedCourseSchedules, setSelectedCourseSchedules] = useState<Schedule[]>([])

  // 모달 상태
  const [detailModal, setDetailModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    fetchEnrollments()
  }, [currentPage, search, statusFilter, courseFilter, scheduleFilter])

  // 강의 선택 시 해당 강의의 기수 목록 업데이트
  useEffect(() => {
    if (courseFilter && courseFilter !== 'all') {
      const course = courses.find(c => c.id === parseInt(courseFilter))
      setSelectedCourseSchedules(course?.schedules || [])
    } else {
      setSelectedCourseSchedules([])
    }
    setScheduleFilter('all')
  }, [courseFilter, courses])

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/admin/courses?includeSchedules=true')
      if (response.data.success) {
        setCourses(response.data.courses)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })

      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (courseFilter) params.append('courseId', courseFilter)
      if (scheduleFilter) params.append('scheduleId', scheduleFilter)

      const response = await axios.get(`/api/admin/enrollments?${params}`)
      if (response.data.success) {
        setEnrollments(response.data.enrollments)
        setTotal(response.data.pagination.total)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput)
    setCurrentPage(1)
  }

  const handleDetailClick = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setDetailModal(true)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '확정'
      case 'active': return '수강중'
      case 'completed': return '수료'
      case 'pending': return '대기'
      case 'processing': return '처리중'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConfirmEnrollment = async (enrollmentId: number) => {
    if (!confirm('이 수강을 확정하시겠습니까?')) return

    try {
      const response = await axios.put(`/api/admin/enrollments/${enrollmentId}/confirm`)
      if (response.data.success) {
        alert('수강이 확정되었습니다.')
        fetchEnrollments()
      } else {
        alert(response.data.error || '확정 처리에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('Confirm enrollment error:', error)
      alert(error.response?.data?.error || '확정 처리에 실패했습니다.')
    }
  }

  const handleCancelEnrollment = async (enrollment: Enrollment) => {
    const confirmMsg = enrollment.payment && enrollment.payment.status === 'confirmed'
      ? '이 수강을 취소하시겠습니까?\n유료 강의의 경우 환불 규정에 따라 환불이 진행됩니다.'
      : '이 수강을 취소하시겠습니까?'

    if (!confirm(confirmMsg)) return

    try {
      const response = await fetch(`/api/enrollments/${enrollment.id}/cancel`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        alert('수강이 취소되었습니다.')
        fetchEnrollments()
      } else {
        alert(data.error || '취소 처리에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('Cancel enrollment error:', error)
      alert('취소 처리에 실패했습니다.')
    }
  }

  const renderPagination = () => {
    const pages = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>)
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 border rounded ${
            currentPage === i
              ? 'bg-gray-900 text-white border-gray-900'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>)
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
        >
          {totalPages}
        </button>
      )
    }

    return pages
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">수강 관리</h1>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="이름, 이메일, 연락처, 강의명으로 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                검색
              </button>
              {search && (
                <button
                  onClick={() => {
                    setSearch('')
                    setSearchInput('')
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기</option>
              <option value="processing">처리중</option>
              <option value="confirmed">확정</option>
              <option value="active">수강중</option>
              <option value="completed">수료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <div>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
            >
              <option value="all">전체 강의</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={scheduleFilter}
              onChange={(e) => {
                setScheduleFilter(e.target.value)
                setCurrentPage(1)
              }}
              disabled={selectedCourseSchedules.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="all">전체 기수</option>
              {selectedCourseSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.cohort}기
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          총 {total}건의 수강 신청
        </div>
      </div>

      {/* 수강 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-600">로딩 중...</div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12 text-gray-600">수강 신청이 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">강의</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{enrollment.user.name}</div>
                        <div className="text-sm text-gray-500">{enrollment.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{enrollment.payment?.kakaoPhone || enrollment.user.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{enrollment.schedule.course.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{enrollment.schedule.cohort}기</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(enrollment.status)}`}>
                            {getStatusLabel(enrollment.status)}
                          </span>
                          {enrollment.status === 'cancelled' && enrollment.payment?.status === 'refunded' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 w-fit">
                              환불완료
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>
                          {new Date(enrollment.createdAt).toLocaleDateString()}
                          {enrollment.status === 'cancelled' && enrollment.payment?.refundedAt && (
                            <div className="text-xs text-red-500">
                              취소: {new Date(enrollment.payment.refundedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDetailClick(enrollment)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            상세
                          </button>
                          {(enrollment.status === 'pending' || enrollment.status === 'processing') && (
                            <button
                              onClick={() => handleConfirmEnrollment(enrollment.id)}
                              className="text-green-600 hover:text-green-800 hover:underline font-medium"
                            >
                              확정
                            </button>
                          )}
                          {(enrollment.payment?.kakaoPhone || enrollment.user.phone) && (
                            <button
                              onClick={() => router.push(`/admin/send-sms?phone=${encodeURIComponent(enrollment.payment?.kakaoPhone || enrollment.user.phone!)}&name=${encodeURIComponent(enrollment.user.name)}`)}
                              className="text-purple-600 hover:text-purple-800 hover:underline"
                            >
                              문자
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/admin/send-email?email=${encodeURIComponent(enrollment.user.email)}&name=${encodeURIComponent(enrollment.user.name)}`)}
                            className="text-orange-600 hover:text-orange-800 hover:underline"
                          >
                            이메일
                          </button>
                          {enrollment.status !== 'cancelled' && enrollment.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelEnrollment(enrollment)}
                              className="text-red-600 hover:text-red-800 hover:underline"
                            >
                              취소
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이징 */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} / 총 {total}건
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  {renderPagination()}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 상세 모달 */}
      {detailModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">수강 상세 정보</h2>
              <button
                onClick={() => setDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* 강의 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">강의 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">강의명:</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.schedule.course.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">기수:</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.schedule.cohort}기</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">강의 기간:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedEnrollment.schedule.startDate).toLocaleDateString()} ~ {new Date(selectedEnrollment.schedule.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">가격:</span>
                    <span className="font-medium text-gray-900">
                      {selectedEnrollment.schedule.course.isFree ? '무료' : `${selectedEnrollment.schedule.course.price.toLocaleString()}원`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 학생 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">학생 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이름:</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일:</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">전화번호:</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.user.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">인증 전화번호:</span>
                    <span className="font-medium text-gray-900">{selectedEnrollment.payment?.kakaoPhone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 수강 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">수강 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEnrollment.status)}`}>
                      {getStatusLabel(selectedEnrollment.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">신청일:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedEnrollment.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 결제 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">결제 정보</h3>
                {!selectedEnrollment.payment ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                    결제 정보가 없습니다 {selectedEnrollment.schedule.course.isFree || selectedEnrollment.schedule.course.price === 0 ? '(무료 강의)' : ''}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">결제금액: </span>
                        <span className="font-semibold text-gray-900">{selectedEnrollment.payment.amount.toLocaleString()}원</span>
                      </div>
                      <div>
                        <span className="text-gray-600">결제수단: </span>
                        <span className="text-gray-900">결제선생</span>
                      </div>
                      <div>
                        <span className="text-gray-600">결제상태: </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedEnrollment.payment.status === 'completed' || selectedEnrollment.payment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          selectedEnrollment.payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedEnrollment.payment.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                          selectedEnrollment.payment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedEnrollment.payment.status === 'completed' || selectedEnrollment.payment.status === 'confirmed' ? '완료' :
                           selectedEnrollment.payment.status === 'pending' ? '대기중' :
                           selectedEnrollment.payment.status === 'refunded' ? '환불됨' :
                           selectedEnrollment.payment.status === 'cancelled' ? '취소' :
                           selectedEnrollment.payment.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">결제일시: </span>
                        <span className="text-gray-900">{new Date(selectedEnrollment.payment.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* 환불 정보 */}
                    {selectedEnrollment.payment.status === 'refunded' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <h4 className="font-semibold text-purple-800 mb-2">환불 정보</h4>
                          <div className="text-sm space-y-1">
                            {selectedEnrollment.payment.refundedAt && (
                              <div>
                                <span className="text-purple-600">환불일시: </span>
                                <span className="text-purple-900">{new Date(selectedEnrollment.payment.refundedAt).toLocaleString()}</span>
                              </div>
                            )}
                            {selectedEnrollment.payment.failMessage && (
                              <div>
                                <span className="text-purple-600">환불내역: </span>
                                <span className="text-purple-900">{selectedEnrollment.payment.failMessage}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 고객 메모 */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">고객 메모:</span>
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200 text-gray-900 whitespace-pre-wrap">
                          {selectedEnrollment.payment.customerMemo || '메모 없음'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 취소 정보 (취소된 경우) */}
              {selectedEnrollment.status === 'cancelled' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-red-700 mb-3">취소 정보</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-700">
                      이 수강은 취소되었습니다.
                      {selectedEnrollment.payment?.status === 'refunded' && selectedEnrollment.payment?.failMessage && (
                        <div className="mt-2 font-medium">{selectedEnrollment.payment.failMessage}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
