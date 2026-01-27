'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Schedule {
  id: number
  cohort: number
}

interface Course {
  id: number
  title: string
  schedules?: Schedule[]
}

interface Payment {
  id: number
  billId: string | null
  amount: number
  method: string
  status: string
  apprState: string | null
  apprPayType: string | null
  apprDt: string | null
  apprIssuer: string | null
  apprIssuerNum: string | null
  apprNum: string | null
  customerMemo: string | null
  kakaoPhone: string | null
  createdAt: string
  user: {
    id: number
    name: string
    email: string
    phone: string | null
  }
  enrollments: Array<{
    id: number
    status: string
    schedule: {
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
  }>
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [scheduleFilter, setScheduleFilter] = useState('all')
  const [selectedCourseSchedules, setSelectedCourseSchedules] = useState<Schedule[]>([])

  // 모달 상태
  const [detailModal, setDetailModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    fetchPayments()
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

  const fetchPayments = async () => {
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

      const response = await axios.get(`/api/admin/payments?${params}`)
      if (response.data.success) {
        setPayments(response.data.payments)
        setTotal(response.data.pagination.total)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput)
    setCurrentPage(1)
  }

  const handleDetailClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailModal(true)
  }

  const handleConfirmPayment = async (paymentId: number) => {
    if (!confirm('이 결제를 수동으로 확정하시겠습니까?')) {
      return
    }

    try {
      const response = await axios.put(`/api/admin/payments/${paymentId}/confirm`)
      if (response.data.success) {
        alert('결제가 확정되었습니다')
        fetchPayments()
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '결제 확정에 실패했습니다')
    }
  }

  const handleCheckStatus = async (paymentId: number) => {
    try {
      const response = await axios.post(`/api/admin/payments/${paymentId}/check-status`)
      if (response.data.success) {
        alert(response.data.message)
        fetchPayments()
      } else {
        alert(response.data.error || '상태 확인에 실패했습니다')
      }
    } catch (error: any) {
      console.error('Check status error:', error)
      alert(error.response?.data?.error || '상태 확인에 실패했습니다')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'confirmed': return '확정'
      case 'processing': return '처리중'
      case 'pending': return '대기중'
      case 'failed': return '실패'
      case 'cancelled': return '취소'
      case 'refunded': return '환불'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">결제 관리</h1>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="결제번호, 이름, 이메일, 연락처로 검색"
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
              <option value="">전체 상태</option>
              <option value="completed">완료</option>
              <option value="confirmed">확정</option>
              <option value="processing">처리중</option>
              <option value="pending">대기중</option>
              <option value="failed">실패</option>
              <option value="cancelled">취소</option>
              <option value="refunded">환불</option>
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
          총 {total}건의 결제
        </div>
      </div>

      {/* 결제 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-600">로딩 중...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-600">결제 내역이 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">결제번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">결제수단</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">{payment.billId || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{payment.user.name}</div>
                        <div className="text-sm text-gray-500">{payment.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{payment.kakaoPhone || payment.user.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.amount.toLocaleString()}원</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {payment.apprPayType === 'CARD' ? '카드' :
                         payment.apprPayType === 'BANK' ? '계좌이체' :
                         payment.apprPayType ? payment.apprPayType : '결제선생'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDetailClick(payment)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            상세
                          </button>
                          {(payment.kakaoPhone || payment.user.phone) && (
                            <button
                              onClick={() => router.push(`/admin/send-sms?phone=${encodeURIComponent(payment.kakaoPhone || payment.user.phone!)}&name=${encodeURIComponent(payment.user.name)}`)}
                              className="text-purple-600 hover:text-purple-800 hover:underline"
                            >
                              문자
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/admin/send-email?email=${encodeURIComponent(payment.user.email)}&name=${encodeURIComponent(payment.user.name)}`)}
                            className="text-orange-600 hover:text-orange-800 hover:underline"
                          >
                            이메일
                          </button>
                          {(payment.status === 'processing' || payment.status === 'pending') && (
                            <>
                              <button
                                onClick={() => handleCheckStatus(payment.id)}
                                className="text-cyan-600 hover:text-cyan-800 hover:underline"
                              >
                                조회
                              </button>
                              <button
                                onClick={() => handleConfirmPayment(payment.id)}
                                className="text-green-600 hover:text-green-800 hover:underline font-medium"
                              >
                                확정
                              </button>
                            </>
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
      {detailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">결제 상세 정보</h2>
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
              {/* 결제 기본 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">결제 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제번호:</span>
                    <span className="font-mono text-gray-900">{selectedPayment.billId || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제금액:</span>
                    <span className="font-semibold text-gray-900">{selectedPayment.amount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제수단:</span>
                    <span className="text-gray-900">
                      {selectedPayment.apprPayType === 'CARD' ? '카드 (결제선생)' :
                       selectedPayment.apprPayType === 'BANK' ? '계좌이체 (결제선생)' :
                       selectedPayment.apprPayType ? `${selectedPayment.apprPayType} (결제선생)` : '결제선생'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제상태:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                      {getStatusLabel(selectedPayment.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제일시:</span>
                    <span className="text-gray-900">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 승인 정보 (있을 경우) */}
              {selectedPayment.apprDt && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">승인 정보</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedPayment.apprDt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">승인일시:</span>
                        <span className="text-gray-900">{new Date(selectedPayment.apprDt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedPayment.apprNum && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">승인번호:</span>
                        <span className="font-mono text-gray-900">{selectedPayment.apprNum}</span>
                      </div>
                    )}
                    {selectedPayment.apprIssuer && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">발급사:</span>
                        <span className="text-gray-900">{selectedPayment.apprIssuer}</span>
                      </div>
                    )}
                    {selectedPayment.apprIssuerNum && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">카드번호:</span>
                        <span className="font-mono text-gray-900">{selectedPayment.apprIssuerNum}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 사용자 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">사용자 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이름:</span>
                    <span className="font-medium text-gray-900">{selectedPayment.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일:</span>
                    <span className="text-gray-900">{selectedPayment.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">전화번호:</span>
                    <span className="text-gray-900">{selectedPayment.user.phone || '-'}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm">
                      <span className="text-gray-600 font-medium">고객 메모:</span>
                      <div className="mt-2 p-3 bg-white rounded border border-gray-200 text-gray-900 whitespace-pre-wrap">
                        {selectedPayment.customerMemo || '메모 없음'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 수강 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">수강 정보</h3>
                {selectedPayment.enrollments.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                    연결된 수강 정보가 없습니다 (구독 결제)
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPayment.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{enrollment.schedule.course.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {enrollment.schedule.cohort}기 | {new Date(enrollment.schedule.startDate).toLocaleDateString()} ~ {new Date(enrollment.schedule.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            enrollment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            enrollment.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {enrollment.status === 'completed' ? '수료' :
                             enrollment.status === 'active' ? '수강중' : '대기'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          강의 금액: {enrollment.schedule.course.isFree ? '무료' : `${enrollment.schedule.course.price.toLocaleString()}원`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
