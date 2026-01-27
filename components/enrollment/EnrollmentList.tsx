'use client'

import { useState } from 'react'
import Link from 'next/link'
import CancelButton from '@/components/enrollment/CancelButton'
import EnrollmentContentModals from '@/components/enrollment/EnrollmentContentModals'
import ChatRoom from '@/components/chat/ChatRoom'

type ModalType = 'videos' | 'slides' | 'materials' | 'qna' | 'board' | null

interface Enrollment {
  id: number
  status: string
  createdAt: string
  course: {
    id: number
    title: string
    price: number
    category: { name: string }
  }
  schedule: {
    id: number
    cohort: number
    startDate: string
    endDate: string
    meetLink: string | null
  }
  payment: {
    status: string
    billUrl: string | null
  } | null
}

interface Props {
  enrollments: Enrollment[]
}

const statusText: Record<string, string> = {
  pending: '결제 대기',
  confirmed: '수강 중',
  completed: '수강 완료',
  cancelled: '취소됨',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function EnrollmentList({ enrollments }: Props) {
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [chatEnrollment, setChatEnrollment] = useState<Enrollment | null>(null)

  const activeEnrollments = enrollments.filter(e => e.status !== 'cancelled')
  const cancelledEnrollments = enrollments.filter(e => e.status === 'cancelled')

  const openModal = (enrollment: Enrollment, type: ModalType) => {
    setSelectedEnrollment(enrollment)
    setModalType(type)
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedEnrollment(null)
  }

  const openChat = (enrollment: Enrollment) => {
    setChatEnrollment(enrollment)
  }

  const closeChat = () => {
    setChatEnrollment(null)
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">수강 신청 내역이 없습니다</h3>
        <p className="text-gray-400 mb-6">교육 과정을 둘러보고 수강 신청해보세요</p>
        <Link href="/courses" className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors">
          교육 과정 둘러보기
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {activeEnrollments.length > 0 && (
          <div className="grid gap-6">
            {activeEnrollments.map((enrollment) => {
              const isUpcoming = new Date(enrollment.schedule.startDate) > new Date()
              const isOngoing = !isUpcoming && new Date(enrollment.schedule.endDate) > new Date()
              // 수강 확정 상태이고 meetLink가 있으면 강의실 입장 버튼 표시
              const canJoinMeet =
                (enrollment.status === 'confirmed' || enrollment.status === 'completed') &&
                enrollment.schedule.meetLink

              return (
                <div key={enrollment.id} className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300">
                  <div className="p-6 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white text-gray-900">
                            {enrollment.schedule.cohort}기
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            enrollment.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            enrollment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            enrollment.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {statusText[enrollment.status]}
                          </span>
                          <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                            {enrollment.course.category.name}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{enrollment.course.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {new Date(enrollment.schedule.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              {' ~ '}
                              {new Date(enrollment.schedule.endDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{enrollment.course.price === 0 ? '무료' : `${enrollment.course.price.toLocaleString()}원`}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        {canJoinMeet && (
                          <a href={enrollment.schedule.meetLink!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            강의실 들어가기
                          </a>
                        )}
                        {enrollment.payment?.billUrl && enrollment.payment.status === 'pending' && (
                          <a href={enrollment.payment.billUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">
                            결제하기
                          </a>
                        )}
                        <Link href={`/courses/${enrollment.course.id}`} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">
                          상세보기
                        </Link>
                      </div>
                    </div>
                  </div>

                  {(enrollment.status === 'confirmed' || enrollment.status === 'completed') && (
                    <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => openModal(enrollment, 'videos')}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                          >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            녹화영상
                          </button>
                          <button
                            onClick={() => openModal(enrollment, 'slides')}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                          >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            슬라이드
                          </button>
                          <button
                            onClick={() => openModal(enrollment, 'materials')}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                          >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            자료실
                          </button>
                          <button
                            onClick={() => openModal(enrollment, 'qna')}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                          >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Q&A
                          </button>
                          <button
                            onClick={() => openModal(enrollment, 'board')}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                          >
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                            게시판
                          </button>
                        </div>
                        <div className="flex-shrink-0">
                          <CancelButton
                            enrollmentId={enrollment.id}
                            courseName={enrollment.course.title}
                            cohort={enrollment.schedule.cohort}
                            status={enrollment.status}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {enrollment.status === 'pending' && (
                    <div className="px-6 py-4 bg-yellow-500/10 border-t border-yellow-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-yellow-400">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          결제 완료 후 수강 확정됩니다
                        </div>
                        <CancelButton
                          enrollmentId={enrollment.id}
                          courseName={enrollment.course.title}
                          cohort={enrollment.schedule.cohort}
                          status={enrollment.status}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {cancelledEnrollments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              취소된 수강 내역
            </h2>
            <div className="space-y-3">
              {cancelledEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white/5 rounded-xl border border-white/10 p-4 opacity-60 hover:opacity-80 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">{enrollment.schedule.cohort}기</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-sm text-gray-500 line-through">{enrollment.course.title}</span>
                      {enrollment.payment?.status === 'refunded' && (
                        <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded">환불완료</span>
                      )}
                    </div>
                    <Link href={`/courses/${enrollment.course.id}`} className="text-xs text-gray-400 hover:text-white">
                      다시 신청
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedEnrollment && (
        <EnrollmentContentModals
          scheduleId={selectedEnrollment.schedule.id}
          courseName={selectedEnrollment.course.title}
          cohort={selectedEnrollment.schedule.cohort}
          modalType={modalType}
          onClose={closeModal}
        />
      )}

      {chatEnrollment && (
        <ChatRoom
          scheduleId={chatEnrollment.schedule.id}
          courseName={chatEnrollment.course.title}
          cohort={chatEnrollment.schedule.cohort}
          onClose={closeChat}
        />
      )}
    </>
  )
}
