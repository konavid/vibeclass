'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface User {
  id: number
  email: string
  name: string
  nickname: string | null
  phone: string | null
  role: string
  createdAt: string
  _count: {
    enrollments: number
  }
}

interface Enrollment {
  id: number
  status: string
  createdAt: string
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
}

interface Payment {
  id: number
  amount: number
  status: string
  method: string
  createdAt: string
  enrollments: Array<{
    schedule: {
      cohort: number
      course: {
        id: number
        title: string
      }
    }
  }>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // 모달 상태
  const [enrollmentsModal, setEnrollmentsModal] = useState(false)
  const [paymentsModal, setPaymentsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
  }, [currentPage, search, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })

      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)

      const response = await axios.get(`/api/admin/users?${params}`)
      if (response.data.success) {
        setUsers(response.data.users)
        setTotal(response.data.pagination.total)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetails = async (userId: number) => {
    try {
      setModalLoading(true)
      const response = await axios.get(`/api/admin/users/${userId}`)
      if (response.data.success) {
        setEnrollments(response.data.enrollments)
        setPayments(response.data.payments)
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput)
    setCurrentPage(1)
  }

  const handleEnrollmentsClick = async (user: User) => {
    setSelectedUser(user)
    setEnrollmentsModal(true)
    await fetchUserDetails(user.id)
  }

  const handlePaymentsClick = async (user: User) => {
    setSelectedUser(user)
    setPaymentsModal(true)
    await fetchUserDetails(user.id)
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!confirm(`사용자 역할을 ${newRole === 'admin' ? '관리자' : newRole === 'instructor' ? '강사' : '일반 사용자'}로 변경하시겠습니까?`)) {
      return
    }

    try {
      const response = await axios.put(`/api/admin/users/${userId}/role`, { role: newRole })
      if (response.data.success) {
        alert('역할이 변경되었습니다')
        fetchUsers()
      }
    } catch (error) {
      console.error('역할 변경 실패:', error)
      alert('역할 변경에 실패했습니다')
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">사용자 관리</h1>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색"
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
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
            >
              <option value="all">전체 역할</option>
              <option value="customer">일반 사용자</option>
              <option value="instructor">강사</option>
              <option value="admin">관리자</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          총 {total}명의 사용자
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-600">로딩 중...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-600">사용자가 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수강 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border-0 focus:ring-2 focus:ring-gray-900 ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'instructor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="customer">일반</option>
                          <option value="instructor">강사</option>
                          <option value="admin">관리자</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <button
                          onClick={() => handleEnrollmentsClick(user)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {user._count?.enrollments || 0}건
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handlePaymentsClick(user)}
                          className="text-green-600 hover:text-green-800 hover:underline"
                        >
                          결제이력
                        </button>
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
                  {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} / 총 {total}명
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

      {/* 수강 내역 모달 */}
      {enrollmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedUser?.name}님의 수강 내역
              </h2>
              <button
                onClick={() => setEnrollmentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {modalLoading ? (
                <div className="text-center py-12 text-gray-600">로딩 중...</div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12 text-gray-600">수강 내역이 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{enrollment.schedule.course.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {enrollment.schedule.cohort}기 | {new Date(enrollment.schedule.startDate).toLocaleDateString()} ~ {new Date(enrollment.schedule.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          enrollment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          enrollment.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {enrollment.status === 'completed' ? '수료' :
                           enrollment.status === 'active' ? '수강중' : '대기'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          신청일: {new Date(enrollment.createdAt).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {enrollment.schedule.course.isFree ? '무료' : `${enrollment.schedule.course.price.toLocaleString()}원`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 결제 이력 모달 */}
      {paymentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedUser?.name}님의 결제 이력
              </h2>
              <button
                onClick={() => setPaymentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {modalLoading ? (
                <div className="text-center py-12 text-gray-600">로딩 중...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-gray-600">결제 이력이 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => {
                    const enrollment = payment.enrollments?.[0]
                    return (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {enrollment ? enrollment.schedule.course.title : '구독 결제'}
                            </h3>
                            {enrollment && (
                              <p className="text-sm text-gray-600 mt-1">
                                {enrollment.schedule.cohort}기
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status === 'completed' ? '완료' :
                             payment.status === 'pending' ? '대기중' : '실패'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">결제금액: </span>
                            <span className="font-semibold text-gray-900">{payment.amount.toLocaleString()}원</span>
                          </div>
                          <div>
                            <span className="text-gray-600">결제수단: </span>
                            <span className="text-gray-900">결제선생</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">결제일시: </span>
                            <span className="text-gray-900">
                              {new Date(payment.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
