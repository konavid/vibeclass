'use client'

import CustomerLayout from '@/components/customer/CustomerLayout'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { useAuthModal } from '@/contexts/AuthModalContext'

interface Course {
  id: number
  title: string
  price: number
  isFree: boolean
  thumbnailUrl: string | null
  category: {
    name: string
  }
  instructor: {
    name: string
  }
}

interface Schedule {
  id: number
  cohort: number
  startDate: string
  endDate: string
  status: string
}

interface UserInfo {
  name: string
  email: string
  phone: string | null
  marketingConsent?: boolean
}

export default function EnrollPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { openLoginModal } = useAuthModal()
  const courseId = parseInt(params.id as string)

  const [course, setCourse] = useState<Course | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false)
  const [enrolledSchedule, setEnrolledSchedule] = useState<Schedule | null>(null)

  // 사용자 정보
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [customerMemo, setCustomerMemo] = useState('')
  const [savingField, setSavingField] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      openLoginModal(`/courses/${courseId}/enroll`)
      return
    }

    if (status === 'authenticated') {
      fetchCourseData()
      fetchUserInfo()
    }
  }, [status, courseId, openLoginModal])

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
        setSchedules(data.schedules || [])
        // 모집중인 일정만 기본 선택
        const availableSchedules = (data.schedules || []).filter((s: Schedule) => s.status === 'scheduled')
        if (availableSchedules.length > 0) {
          setSelectedScheduleId(availableSchedules[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      setError('교육 정보를 불러올 수 없습니다')
    }
  }

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setUserInfo(data.user)
        setName(data.user.name || '')
        setEmail(data.user.email || '')
        setPhone((data.user.phone || '').replace(/-/g, ''))
        setNickname(data.user.nickname || '')
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  // 개별 필드 저장 (blur 시 자동 저장)
  const handleFieldBlur = async (fieldName: string, value: string) => {
    // 값이 변경되지 않았으면 저장하지 않음
    const originalValue = fieldName === 'name' ? userInfo?.name
      : fieldName === 'email' ? userInfo?.email
      : fieldName === 'phone' ? userInfo?.phone
      : fieldName === 'nickname' ? nickname : ''

    if (value === originalValue) return
    if (!value.trim()) return

    setSavingField(fieldName)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          nickname,
          marketingConsent: userInfo?.marketingConsent || false
        })
      })

      if (res.ok) {
        const data = await res.json()
        setUserInfo({
          name: data.name,
          email: data.email,
          phone: data.phone
        })
        setError('')
      } else {
        const data = await res.json()
        setError(data.error || '정보 저장에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to save user info:', error)
      setError('정보 저장에 실패했습니다')
    } finally {
      setSavingField(null)
    }
  }

  const handleEnroll = async () => {
    if (!selectedScheduleId) {
      setError('일정을 선택해주세요')
      return
    }

    if (!nickname.trim()) {
      setError('별명을 입력해주세요')
      return
    }

    if (!phone || !phone.trim()) {
      setError('연락처를 입력해주세요. 카카오톡이 설치된 전화번호를 입력하셔야 결제 링크를 받을 수 있습니다.')
      return
    }

    if (!/^010\d{8}$/.test(phone.replace(/-/g, ''))) {
      setError('올바른 전화번호 형식이 아닙니다. 010으로 시작하는 11자리 숫자를 입력해주세요 (예: 01012345678)')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 무료 강의인 경우 바로 수강 신청
      if (course?.isFree) {
        const res = await axios.post('/api/enrollments', {
          courseId,
          scheduleId: selectedScheduleId,
        })

        if (res.data.enrollment) {
          const selectedSched = schedules.find(s => s.id === selectedScheduleId) || null
          setEnrolledSchedule(selectedSched)
          setEnrollmentSuccess(true)
        }
        return
      }

      // 유료 강의인 경우 결제 프로세스 시작
      const response = await axios.post('/api/payment/enroll', {
        courseId,
        scheduleId: selectedScheduleId,
        kakaoPhone: phone,
        nickname: nickname,
        customerMemo: customerMemo,
      })

      if (response.data.success) {
        alert('카카오톡으로 결제 링크가 전송되었습니다!\n결제를 완료하시면 수강 신청이 확정됩니다.')
        router.push(`/payment/status?billId=${response.data.bill_id}`)
      } else {
        setError(response.data.error || '수강 신청에 실패했습니다')
      }
    } catch (error: any) {
      console.error('수강 신청 실패:', error)
      setError(error.response?.data?.error || '수강 신청에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !course) {
    return (
      <CustomerLayout>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </CustomerLayout>
    )
  }

  // 수강신청 성공 화면
  if (enrollmentSuccess) {
    return (
      <CustomerLayout>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3">
              수강 신청 완료
            </h1>
          </div>
        </div>

        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* 성공 아이콘 */}
              <div className="bg-green-50 p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  수강 신청이 완료되었습니다!
                </h2>
                <p className="text-gray-600">
                  강의 정보는 내 구매 목록에서 확인하실 수 있습니다
                </p>
              </div>

              {/* 강의 정보 */}
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{course.category.name}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <div className="text-sm text-gray-600">{course.instructor.name} 강사</div>
                  </div>
                </div>

                {enrolledSchedule && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-500 mb-1">수강 일정</div>
                    <div className="font-semibold text-gray-900">
                      {enrolledSchedule.cohort}기
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(enrolledSchedule.startDate).toLocaleDateString('ko-KR')} ~ {new Date(enrolledSchedule.endDate).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/my/enrollments')}
                    className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  >
                    내 구매 목록으로 이동
                  </button>
                  <button
                    onClick={() => router.push('/courses')}
                    className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    다른 강의 둘러보기
                  </button>
                </div>
              </div>
            </div>

            {/* 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <div className="font-semibold mb-1">수강 안내</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>수업 시작 전 카카오톡 알림메세지로 Zoom 링크를 보내드립니다</li>
                    <li>내 구매 목록에서 수업 정보를 확인할 수 있습니다</li>
                    <li>문의사항은 카카오톡 오픈채팅방으로 연락해주세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3">
            수강 신청
          </h1>
          <p className="text-lg text-gray-600">
            수강할 일정을 선택하고 신청을 완료하세요
          </p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                {course.thumbnailUrl && (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-1">{course.category.name}</div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h2>
                  <div className="text-sm text-gray-600">{course.instructor.name} 강사</div>
                </div>
              </div>

              {/* 신청자 정보 */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">신청자 정보</h3>
                  <span className="text-xs text-gray-500">수정 시 자동 저장됩니다</span>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>강의 신청 및 중요 정보 전달을 위해 정확한 정보를 입력해주세요</strong>
                    {!course?.isFree && (
                      <span className="block mt-1">
                        연락처는 결제를 위해 카카오톡이 설치된 전화번호를 입력해주세요.
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 <span className="text-red-500">*</span>
                      {savingField === 'name' && <span className="ml-2 text-xs text-blue-600">저장 중...</span>}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={(e) => handleFieldBlur('name', e.target.value)}
                      placeholder="실명을 입력하세요"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 <span className="text-red-500">*</span>
                      {savingField === 'email' && <span className="ml-2 text-xs text-blue-600">저장 중...</span>}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={(e) => handleFieldBlur('email', e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      별명 <span className="text-red-500">*</span>
                      {savingField === 'nickname' && <span className="ml-2 text-xs text-blue-600">저장 중...</span>}
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onBlur={(e) => handleFieldBlur('nickname', e.target.value)}
                      placeholder="별명을 입력하세요"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처 <span className="text-red-500">*</span>
                      {savingField === 'phone' && <span className="ml-2 text-xs text-blue-600">저장 중...</span>}
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setPhone(value)
                      }}
                      onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                      placeholder="01012345678"
                      className={`w-full px-4 py-3 border rounded-lg text-base transition-all text-gray-900 focus:outline-none ${
                        !course?.isFree && !phone ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${!course?.isFree && !phone ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {!course?.isFree
                        ? (phone ? '결제를 위해 카카오톡이 설치된 전화번호를 입력해주세요' : '⚠️ 결제 링크를 받으려면 카카오톡이 설치된 전화번호가 필요합니다')
                        : '강의 안내를 위해 정확한 연락처를 입력해주세요'}
                    </p>
                  </div>

                  {!course?.isFree && (
                    <div>
                      <label htmlFor="customerMemo" className="block text-sm font-medium text-gray-700 mb-2">
                        메모 (선택사항)
                      </label>
                      <textarea
                        id="customerMemo"
                        value={customerMemo}
                        onChange={(e) => setCustomerMemo(e.target.value)}
                        placeholder="강의 신청과 관련하여 전달하실 내용이 있으시면 작성해주세요 (예: 특별한 요청사항, 문의사항 등)"
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-base text-gray-900 placeholder:text-gray-400 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {customerMemo.length}/500자
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 기수 선택 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">수강 일정 선택</h3>

                {(() => {
                  const availableSchedules = schedules.filter(s => s.status === 'scheduled')
                  const ongoingSchedules = schedules.filter(s => s.status === 'ongoing')

                  if (availableSchedules.length === 0 && ongoingSchedules.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        현재 예정된 일정이 없습니다
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      {availableSchedules.map((schedule) => (
                        <label
                          key={schedule.id}
                          className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedScheduleId === schedule.id
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="schedule"
                            value={schedule.id}
                            checked={selectedScheduleId === schedule.id}
                            onChange={() => setSelectedScheduleId(schedule.id)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">
                                {schedule.cohort}기
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(schedule.startDate).toLocaleDateString('ko-KR')} ~ {new Date(schedule.endDate).toLocaleDateString('ko-KR')}
                              </div>
                            </div>
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                              모집중
                            </span>
                          </div>
                        </label>
                      ))}
                      {ongoingSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="block border-2 rounded-lg p-4 border-gray-200 bg-gray-50 opacity-60"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-500 mb-1">
                                {schedule.cohort}기
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(schedule.startDate).toLocaleDateString('ko-KR')} ~ {new Date(schedule.endDate).toLocaleDateString('ko-KR')}
                              </div>
                            </div>
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                              마감
                            </span>
                          </div>
                        </div>
                      ))}
                      {availableSchedules.length === 0 && ongoingSchedules.length > 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 text-center">
                            현재 모집중인 일정이 없습니다. 다음 기수 오픈 시 알림을 받으시려면 문의해주세요.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-semibold text-gray-900">수강료</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {course.isFree ? '무료' : `${course.price.toLocaleString()}원`}
                  </span>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleEnroll}
                  disabled={loading || schedules.length === 0 || !selectedScheduleId}
                  className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '처리 중...' : '수강 신청하기'}
                </button>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.back()}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    돌아가기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">수강 안내</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>수강 신청 즉시 확정됩니다</li>
                  <li>수업 시작 전 카카오톡 알림메세지로 Zoom 링크를 보내드립니다</li>
                  <li>내 구매 목록에서 수업 정보를 확인할 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
