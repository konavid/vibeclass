'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
}

interface CourseSchedule {
  id: number
  cohort: number
  startDate: string
  endDate: string
}

interface Course {
  id: number
  title: string
  schedules?: CourseSchedule[]
}

interface Template {
  code: string
  name: string
  content: string
  buttons?: Array<{
    name: string
    linkType: string
    linkMo?: string
    linkPc?: string
  }>
}

interface Recipient {
  id: number
  name: string
  phone: string
  email?: string
  cohort?: number
}

export default function SendKakaoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [recipientType, setRecipientType] = useState<'all' | 'single' | 'enrolled' | 'role' | 'direct'>('all')
  const [userId, setUserId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [scheduleId, setScheduleId] = useState('')
  const [role, setRole] = useState('customer')
  const [directPhones, setDirectPhones] = useState('')
  const [templateCode, setTemplateCode] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [errorDetails, setErrorDetails] = useState<string[]>([])
  const [successDetails, setSuccessDetails] = useState<{ sent: number, failed: number } | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 수신자 미리보기
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [showRecipients, setShowRecipients] = useState(true)

  // 권한 체크
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
    }
  }, [session, status, router])

  // 템플릿 목록 조회
  useEffect(() => {
    fetch('/api/admin/send-kakao')
      .then(res => res.json())
      .then(data => {
        if (data.templates) {
          setTemplates(data.templates)
        }
      })
      .catch(err => console.error(err))
  }, [])

  // 쿼리 파라미터로 전달된 수신자 정보 처리
  useEffect(() => {
    const phone = searchParams.get('phone')
    const name = searchParams.get('name')
    if (phone) {
      setRecipientType('direct')
      setDirectPhones(phone)
      if (name) {
        setRecipients([{ id: 0, name, phone, email: '' }])
      }
    }
  }, [searchParams])

  // 회원 목록 조회 (전화번호가 있는 회원만)
  useEffect(() => {
    if (recipientType === 'single') {
      fetch('/api/admin/users?hasPhone=true')
        .then(res => res.json())
        .then(data => {
          const usersWithPhone = (data.users || []).filter((u: User) => u.phone)
          setUsers(usersWithPhone)
        })
        .catch(err => console.error(err))
    }
  }, [recipientType])

  // 필터링된 회원 목록
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone && user.phone.includes(searchTerm))
  )

  // 강의 목록 조회 (스케줄 포함)
  useEffect(() => {
    if (recipientType === 'enrolled') {
      fetch('/api/admin/courses?includeSchedules=true')
        .then(res => res.json())
        .then(data => setCourses(data.courses || []))
        .catch(err => console.error(err))
    }
  }, [recipientType])

  // 선택된 강의의 스케줄 목록
  const selectedCourse = courses.find(c => c.id === parseInt(courseId))
  const schedules = selectedCourse?.schedules || []

  // 선택된 템플릿
  const selectedTemplate = templates.find(t => t.code === templateCode)

  // 수신자 미리보기 조회
  useEffect(() => {
    const fetchRecipients = async () => {
      if (recipientType === 'direct') {
        setRecipients([])
        return
      }
      if (recipientType === 'single' && !selectedUser) {
        setRecipients([])
        return
      }
      if (recipientType === 'enrolled' && !courseId) {
        setRecipients([])
        return
      }

      setLoadingRecipients(true)
      try {
        const params = new URLSearchParams({ recipientType })
        if (recipientType === 'single' && selectedUser) {
          params.set('userId', selectedUser.id.toString())
        }
        if (recipientType === 'enrolled') {
          params.set('courseId', courseId)
          if (scheduleId) {
            params.set('scheduleId', scheduleId)
          }
        }
        if (recipientType === 'role') {
          params.set('role', role)
        }

        const res = await fetch(`/api/admin/sms-recipients?${params.toString()}`)
        const data = await res.json()
        if (res.ok) {
          setRecipients(data.recipients || [])
        }
      } catch (error) {
        console.error('수신자 조회 실패:', error)
      } finally {
        setLoadingRecipients(false)
      }
    }

    fetchRecipients()
  }, [recipientType, selectedUser, courseId, scheduleId, role])

  const handleSendKakao = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResultMessage(null)
    setErrorDetails([])
    setSuccessDetails(null)

    try {
      const res = await fetch('/api/admin/send-kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType,
          userId: recipientType === 'single' ? selectedUser?.id : undefined,
          courseId: recipientType === 'enrolled' ? courseId : undefined,
          scheduleId: recipientType === 'enrolled' && scheduleId ? scheduleId : undefined,
          role: recipientType === 'role' ? role : undefined,
          directPhones: recipientType === 'direct' ? directPhones : undefined,
          templateCode,
          customMessage: customMessage || undefined,
        })
      })

      const data = await res.json()

      if (res.ok) {
        setResultMessage({ type: 'success', text: data.message })
        if (data.sent !== undefined && data.failed !== undefined) {
          setSuccessDetails({ sent: data.sent, failed: data.failed })
        }
        if (data.errors && data.errors.length > 0) {
          setErrorDetails(data.errors)
        }
      } else {
        setResultMessage({ type: 'error', text: data.error || '카카오 알림톡 발송에 실패했습니다' })
        if (data.details) {
          setErrorDetails(Array.isArray(data.details) ? data.details : [data.details])
        }
      }
    } catch (error) {
      setResultMessage({ type: 'error', text: '카카오 알림톡 발송에 실패했습니다' })
      setErrorDetails([error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'])
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="p-8 text-center">로딩 중...</div>
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">카카오 알림톡 발송</h1>
          <p className="text-gray-600 mt-2">회원들에게 카카오 알림톡을 발송할 수 있습니다</p>
        </div>

        {/* 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>알림:</strong> 카카오 알림톡 발송을 위해서는 먼저 템플릿이 카카오에서 검수 승인되어야 합니다.
            승인되지 않은 템플릿은 SMS로 대체 발송됩니다.
          </p>
        </div>

        {resultMessage && (
          <div className={`p-4 mb-6 rounded-lg ${
            resultMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="font-semibold">{resultMessage.text}</div>
            {successDetails && (
              <div className="mt-2 text-sm">
                <p>성공: {successDetails.sent}건 | 실패: {successDetails.failed}건</p>
              </div>
            )}
            {errorDetails.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="font-semibold text-sm">상세 오류 내역:</p>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {errorDetails.map((error, idx) => (
                    <li key={idx} className="bg-red-100 px-3 py-1 rounded">• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="max-w-4xl">
          <form onSubmit={handleSendKakao} className="bg-white rounded-lg shadow-md p-6">
            {/* 템플릿 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                템플릿 선택 <span className="text-red-500">*</span>
              </label>
              <select
                value={templateCode}
                onChange={(e) => {
                  setTemplateCode(e.target.value)
                  setCustomMessage('')
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="">템플릿을 선택하세요</option>
                {templates.map(template => (
                  <option key={template.code} value={template.code}>
                    {template.name} ({template.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 템플릿 미리보기 */}
            {selectedTemplate && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">템플릿 미리보기</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-white p-3 rounded border">
                  {selectedTemplate.content}
                </pre>
                {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">버튼:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.buttons.map((btn, idx) => (
                        <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          {btn.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 수신자 유형 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수신자 선택
              </label>
              <select
                value={recipientType}
                onChange={(e) => {
                  setRecipientType(e.target.value as typeof recipientType)
                  setSelectedUser(null)
                  setCourseId('')
                  setScheduleId('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="all">전체 회원 (전화번호 등록자)</option>
                <option value="single">특정 회원 1명</option>
                <option value="enrolled">특정 강의 수강생</option>
                <option value="role">역할별 (강사/일반회원)</option>
                <option value="direct">직접 입력 (전화번호)</option>
              </select>
            </div>

            {/* 특정 회원 선택 */}
            {recipientType === 'single' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  회원 선택
                </label>
                <button
                  type="button"
                  onClick={() => setShowUserModal(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className={selectedUser ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedUser ? `${selectedUser.name} (${selectedUser.phone})` : '회원을 선택하세요'}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            )}

            {/* 특정 강의 선택 */}
            {recipientType === 'enrolled' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  강의 선택
                </label>
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value)
                    setScheduleId('')
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="">강의를 선택하세요</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 특정 기수 선택 */}
            {recipientType === 'enrolled' && courseId && schedules.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기수 선택 (선택사항)
                </label>
                <select
                  value={scheduleId}
                  onChange={(e) => setScheduleId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="">전체 기수</option>
                  {schedules.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.cohort}기 ({new Date(schedule.startDate).toLocaleDateString('ko-KR')} ~ {new Date(schedule.endDate).toLocaleDateString('ko-KR')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 역할 선택 */}
            {recipientType === 'role' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할 선택
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="customer">일반 회원</option>
                  <option value="instructor">강사</option>
                </select>
              </div>
            )}

            {/* 직접 전화번호 입력 */}
            {recipientType === 'direct' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 입력
                </label>
                <textarea
                  value={directPhones}
                  onChange={(e) => setDirectPhones(e.target.value)}
                  required
                  placeholder="전화번호를 입력하세요 (쉼표 또는 줄바꿈으로 구분)"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white resize-y"
                />
              </div>
            )}

            {/* 수신자 미리보기 */}
            {recipientType !== 'direct' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    수신자 목록 ({recipients.length}명)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRecipients(!showRecipients)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showRecipients ? '접기' : '펼치기'}
                  </button>
                </div>
                {showRecipients && (
                  <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-60 overflow-y-auto">
                    {loadingRecipients ? (
                      <div className="text-center py-4 text-gray-500">로딩 중...</div>
                    ) : recipients.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        {recipientType === 'single' && !selectedUser
                          ? '회원을 선택해주세요'
                          : recipientType === 'enrolled' && !courseId
                          ? '강의를 선택해주세요'
                          : '수신자가 없습니다'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{recipient.name}</span>
                              {recipient.cohort && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {recipient.cohort}기
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">{recipient.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 발송 버튼 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !templateCode || (recipientType === 'single' && !selectedUser)}
                className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '발송 중...' : '카카오 알림톡 발송'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                취소
              </button>
            </div>
          </form>
        </div>

        {/* 회원 선택 모달 */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">회원 선택</h3>
                  <button
                    onClick={() => {
                      setShowUserModal(false)
                      setSearchTerm('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="이름, 이메일 또는 전화번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {users.length === 0 ? '전화번호가 등록된 회원이 없습니다' : '검색 결과가 없습니다'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user)
                          setUserId(user.id.toString())
                          setShowUserModal(false)
                          setSearchTerm('')
                        }}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-sm text-yellow-600">{user.phone}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? '관리자' : user.role === 'instructor' ? '강사' : '일반회원'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  전화번호가 등록된 회원 {filteredUsers.length}명이 검색되었습니다
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
