'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

// 신청 상태 정보
const STATUS_INFO: Record<string, { label: string; color: string; icon: string; description: string }> = {
  applied: {
    label: '강사 지원',
    color: 'blue',
    icon: '📝',
    description: '신청서가 접수되었습니다. 검토를 기다려주세요.'
  },
  reviewing: {
    label: '강사 검토중',
    color: 'yellow',
    icon: '🔍',
    description: '신청서를 검토하고 있습니다. 결과를 기다려주세요.'
  },
  approved: {
    label: '강사 합격',
    color: 'green',
    icon: '🎉',
    description: '축하합니다! 합격하셨습니다. 서류를 제출해주세요.'
  },
  rejected: {
    label: '강사 불합격',
    color: 'red',
    icon: '😢',
    description: '아쉽게도 이번에는 함께하기 어렵습니다.'
  },
  documents_submitted: {
    label: '서류 제출 완료',
    color: 'purple',
    icon: '📋',
    description: '서류가 제출되었습니다. 서류 검토를 기다려주세요.'
  },
  contract_pending: {
    label: '계약서 서명 대기',
    color: 'orange',
    icon: '✍️',
    description: '계약서 서명이 필요합니다. 계약서를 확인하고 서명해주세요.'
  },
  contract_completed: {
    label: '계약 완료',
    color: 'green',
    icon: '✅',
    description: '계약이 완료되었습니다! 이제 강사로 활동하실 수 있습니다.'
  }
}

// 단계 목록
const STEPS = ['applied', 'reviewing', 'approved', 'documents_submitted', 'contract_pending', 'contract_completed']

export default function InstructorApplyStatusPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (authStatus === 'authenticated') {
      fetchApplication()
    }
  }, [authStatus, router])

  const fetchApplication = async () => {
    try {
      const res = await fetch('/api/instructor-apply')
      const data = await res.json()
      if (data.success) {
        if (!data.application) {
          // 신청 내역이 없으면 신청 페이지로
          router.push('/instructor-apply')
          return
        }
        setApplication(data.application)
      }
    } catch (error) {
      console.error('신청 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </CustomerLayout>
    )
  }

  if (!application) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">신청 내역이 없습니다</h1>
          <p className="text-gray-600 mb-6">강사 신청을 먼저 진행해주세요.</p>
          <Link
            href="/instructor-apply"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            강사 신청하기
          </Link>
        </div>
      </CustomerLayout>
    )
  }

  const currentStatus = STATUS_INFO[application.status] || STATUS_INFO.applied
  const currentStepIndex = STEPS.indexOf(application.status)
  const isRejected = application.status === 'rejected'

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">강사 신청 현황</h1>
          <p className="text-gray-600">신청 진행 상황을 확인하세요</p>
        </div>

        {/* 현재 상태 카드 */}
        <div className={`rounded-2xl p-8 mb-8 text-center ${
          currentStatus.color === 'green' ? 'bg-green-50 border-2 border-green-200' :
          currentStatus.color === 'red' ? 'bg-red-50 border-2 border-red-200' :
          currentStatus.color === 'yellow' ? 'bg-yellow-50 border-2 border-yellow-200' :
          currentStatus.color === 'purple' ? 'bg-purple-50 border-2 border-purple-200' :
          currentStatus.color === 'orange' ? 'bg-orange-50 border-2 border-orange-200' :
          'bg-blue-50 border-2 border-blue-200'
        }`}>
          <div className="text-6xl mb-4">{currentStatus.icon}</div>
          <h2 className={`text-2xl font-bold mb-2 ${
            currentStatus.color === 'green' ? 'text-green-800' :
            currentStatus.color === 'red' ? 'text-red-800' :
            currentStatus.color === 'yellow' ? 'text-yellow-800' :
            currentStatus.color === 'purple' ? 'text-purple-800' :
            currentStatus.color === 'orange' ? 'text-orange-800' :
            'text-blue-800'
          }`}>
            {currentStatus.label}
          </h2>
          <p className={`${
            currentStatus.color === 'green' ? 'text-green-700' :
            currentStatus.color === 'red' ? 'text-red-700' :
            currentStatus.color === 'yellow' ? 'text-yellow-700' :
            currentStatus.color === 'purple' ? 'text-purple-700' :
            currentStatus.color === 'orange' ? 'text-orange-700' :
            'text-blue-700'
          }`}>
            {currentStatus.description}
          </p>

          {/* 검토 결과 메시지 */}
          {application.reviewNote && (
            <div className="mt-6 p-4 bg-white rounded-lg text-left">
              <h4 className="font-semibold text-gray-900 mb-2">검토 결과</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{application.reviewNote}</p>
            </div>
          )}
        </div>

        {/* 진행 단계 표시 (불합격이 아닌 경우) */}
        {!isRejected && (
          <div className="bg-white rounded-2xl border p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-6">진행 단계</h3>
            <div className="relative">
              {/* 진행 바 */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {/* 단계 표시 */}
              <div className="relative flex justify-between">
                {STEPS.map((step, index) => {
                  const stepInfo = STATUS_INFO[step]
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                        ${isCompleted ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'}
                        ${isCurrent ? 'ring-4 ring-indigo-200' : ''}
                      `}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <span className={`mt-2 text-xs text-center max-w-[80px] ${
                        isCompleted ? 'text-indigo-600 font-medium' : 'text-gray-400'
                      }`}>
                        {stepInfo.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 행동 버튼 */}
        <div className="space-y-4">
          {/* 합격 상태: 서류 제출 버튼 */}
          {application.status === 'approved' && (
            <Link
              href="/instructor-apply/documents"
              className="block w-full py-4 bg-indigo-600 text-white text-center rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            >
              서류 제출하기
            </Link>
          )}

          {/* 계약서 서명 대기: 계약서 서명 버튼 */}
          {application.status === 'contract_pending' && (
            <Link
              href="/instructor-apply/contract"
              className="block w-full py-4 bg-orange-600 text-white text-center rounded-xl hover:bg-orange-700 transition-colors font-semibold"
            >
              계약서 확인 및 서명하기
            </Link>
          )}

          {/* 계약 완료: 강사 대시보드 버튼 */}
          {application.status === 'contract_completed' && (
            <>
              <Link
                href="/instructor"
                className="block w-full py-4 bg-green-600 text-white text-center rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                강사 대시보드 바로가기
              </Link>
              <Link
                href="/instructor-apply/contract-view"
                className="block w-full py-4 bg-blue-600 text-white text-center rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                🖨️ 계약서 보기 / 인쇄
              </Link>
            </>
          )}

          {/* 불합격: 재신청 안내 */}
          {application.status === 'rejected' && (
            <div className="bg-gray-100 rounded-xl p-6 text-center">
              <p className="text-gray-600 mb-4">
                다음에 다시 지원해주세요. 더 발전된 모습으로 만나뵙기를 기대합니다.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>
          )}
        </div>

        {/* 신청 정보 요약 */}
        <div className="bg-white rounded-2xl border p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">신청 정보</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">이름</span>
              <span className="text-gray-900">{application.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">분야</span>
              <span className="text-gray-900">{application.field}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">신청일</span>
              <span className="text-gray-900">
                {new Date(application.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            {application.reviewedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">검토일</span>
                <span className="text-gray-900">
                  {new Date(application.reviewedAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
