'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useAuthModal } from '@/contexts/AuthModalContext'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface Instructor {
  id: number
  name: string
  email: string
  bio: string | null
  expertise: string | null
  imageUrl: string | null
  consultingPrice: number
  consultingEnabled: boolean
  courses: {
    id: number
    title: string
  }[]
}

export default function OneOnOneConsultingPage() {
  const { data: session, status } = useSession()
  const { openLoginModal } = useAuthModal()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchInstructors()
  }, [])

  // 비로그인 시 자동으로 로그인 모달 표시
  useEffect(() => {
    if (status === 'unauthenticated') {
      openLoginModal('/consulting/1on1')
    }
  }, [status, openLoginModal])

  const fetchInstructors = async () => {
    try {
      const res = await fetch('/api/instructors')
      if (res.ok) {
        const data = await res.json()
        setInstructors(data)
      }
    } catch (error) {
      console.error('Failed to fetch instructors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInstructor || !message.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/instructor-consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: selectedInstructor.id,
          message: message.trim()
        })
      })

      if (res.ok) {
        setSubmitted(true)
        setMessage('')
        setSelectedInstructor(null)
      } else {
        const data = await res.json()
        alert(data.error || '컨설팅 신청에 실패했습니다')
      }
    } catch (error) {
      alert('컨설팅 신청 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-sm text-orange-200 mb-2 tracking-wide">현업 강사의 지식 플랫폼</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">1:1 강사 컨설팅</h1>
            <p className="text-lg text-orange-100 max-w-2xl mx-auto">
              현업 전문가 강사와 1:1로 상담하고 맞춤형 조언을 받으세요.
              학습, 커리어, 프로젝트 등 다양한 주제로 상담이 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submitted ? (
          <div className="max-w-lg mx-auto text-center bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">컨설팅 신청 완료!</h2>
            <p className="text-gray-600 mb-8">
              강사가 확인 후 빠른 시일 내에 답변드리겠습니다.
              답변은 '나의 에셋 &gt; 문의 내역'에서 확인하실 수 있습니다.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                다른 강사에게 문의하기
              </button>
              <Link
                href="/my/qna"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                문의 내역 보기
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Instructor List */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-6">강사 선택</h2>
              {instructors.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                  현재 등록된 강사가 없습니다.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {instructors.map((instructor) => (
                    <div
                      key={instructor.id}
                      onClick={() => setSelectedInstructor(instructor)}
                      className={`bg-white rounded-xl shadow-sm p-6 transition-all cursor-pointer ${
                        selectedInstructor?.id === instructor.id
                          ? 'ring-2 ring-orange-500 shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {instructor.imageUrl ? (
                          <img
                            src={instructor.imageUrl}
                            alt={instructor.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-xl font-bold">
                            {instructor.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg">{instructor.name}</h3>
                            {instructor.consultingPrice === 0 ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">무료</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                                {instructor.consultingPrice.toLocaleString()}원
                              </span>
                            )}
                          </div>
                          {instructor.expertise && (
                            <p className="text-sm text-orange-600 font-medium mt-1">
                              {instructor.expertise.length > 50
                                ? instructor.expertise.substring(0, 50) + '...'
                                : instructor.expertise}
                            </p>
                          )}
                          {instructor.bio && (
                            <p
                              className="text-sm text-gray-500 mt-2 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: instructor.bio.replace(/<[^>]*>/g, ' ').substring(0, 100) }}
                            />
                          )}
                          {instructor.courses.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {instructor.courses.slice(0, 2).map((course) => (
                                <span
                                  key={course.id}
                                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                >
                                  {course.title.length > 15
                                    ? course.title.substring(0, 15) + '...'
                                    : course.title}
                                </span>
                              ))}
                              {instructor.courses.length > 2 && (
                                <span className="text-xs text-gray-400">
                                  +{instructor.courses.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedInstructor?.id === instructor.id && (
                          <div className="shrink-0">
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consultation Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">컨설팅 신청</h2>
                {selectedInstructor ? (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {selectedInstructor.imageUrl ? (
                          <img
                            src={selectedInstructor.imageUrl}
                            alt={selectedInstructor.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold">
                            {selectedInstructor.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{selectedInstructor.name} 강사</p>
                          <p className="text-sm text-orange-600">에게 컨설팅 요청</p>
                        </div>
                        <div className="text-right">
                          {selectedInstructor.consultingPrice === 0 ? (
                            <span className="text-lg font-bold text-green-600">무료</span>
                          ) : (
                            <span className="text-lg font-bold text-orange-600">
                              {selectedInstructor.consultingPrice.toLocaleString()}원
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상담 내용 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="궁금한 점이나 상담받고 싶은 내용을 자세히 작성해주세요."
                        rows={6}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        학습 방향, 커리어 상담, 프로젝트 피드백 등 다양한 주제로 상담 가능합니다.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {submitting ? '신청 중...' : '컨설팅 신청하기'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>좌측에서 강사를 선택해주세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">1:1 컨설팅 안내</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">1. 강사 선택</h3>
              <p className="text-sm text-gray-600">
                관심 분야의 강사를 선택하고 상담 내용을 작성합니다.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">2. 답변 수령</h3>
              <p className="text-sm text-gray-600">
                강사가 검토 후 상세한 답변을 드립니다.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">3. 확인하기</h3>
              <p className="text-sm text-gray-600">
                '나의 에셋 &gt; 문의 내역'에서 답변을 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </CustomerLayout>
  )
}
