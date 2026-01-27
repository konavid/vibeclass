'use client'
import { Suspense } from 'react'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'
import axios from 'axios'

interface Payment {
  id: number
  billId: string
  status: string
  amount: number
  months: number
  method: string
  course: {
    id: number
    title: string
  } | null
  description: string
  kakaoPhone: string
  apprState: string | null
  apprDt: string | null
  apprPayType: string | null
  apprIssuer: string | null
  apprIssuerNum: string | null
  apprNum: string | null
  paidAt: string | null
  newEndDate: string | null
  createdAt: string
}

function PaymentStatusPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const billId = searchParams.get('billId')

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // 로그인 체크
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/payment/status')
    }
  }, [status, router])

  // 결제 상태 조회 함수
  const fetchPaymentStatus = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    }
    try {
      const response = await axios.get(`/api/payment/status/${billId}`)
      if (response.data.success) {
        setPayment(response.data.payment)
        setError('')
      } else {
        setError(response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to fetch payment status:', error)
      setError(error.response?.data?.error || '결제 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
      if (isRefresh) {
        setRefreshing(false)
      }
    }
  }

  // 초기 결제 상태 조회
  useEffect(() => {
    if (!billId || status !== 'authenticated') return
    fetchPaymentStatus()
  }, [billId, status])

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '결제 대기 중', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' }
      case 'processing':
        return { text: '결제 처리 중', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
      case 'confirmed':
        return { text: '결제 완료', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
      case 'failed':
        return { text: '결제 실패', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
      case 'cancelled':
        return { text: '결제 취소', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
    }
  }

  if (status === 'loading' || loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">결제 정보를 불러오는 중...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (error || !payment) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-6">{error || '결제 정보를 찾을 수 없습니다.'}</p>
            <Link
              href="/payment"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              결제 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  const statusDisplay = getStatusDisplay(payment.status)

  return (
    <CustomerLayout>
      <div className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 상태 아이콘 */}
          <div className="text-center mb-8">
            {payment.status === 'confirmed' ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            ) : payment.status === 'failed' || payment.status === 'cancelled' ? (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}

            <h1 className="text-3xl font-semibold text-gray-900 mb-2">결제 상태</h1>
            <div className={`inline-block px-4 py-2 rounded-full ${statusDisplay.bg} ${statusDisplay.border} border`}>
              <span className={`text-sm font-semibold ${statusDisplay.color}`}>
                {statusDisplay.text}
              </span>
            </div>
          </div>

          {/* 결제 정보 카드 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">결제 정보</h2>
              {(payment.status === 'pending' || payment.status === 'processing') && (
                <button
                  onClick={() => fetchPaymentStatus(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? '확인 중...' : '상태 확인'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600">결제 번호</span>
                <span className="text-gray-900 font-mono text-sm">{payment.billId}</span>
              </div>

              {payment.course && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">강의</span>
                  <span className="text-gray-900 font-medium">{payment.course.title}</span>
                </div>
              )}

              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600">구독 기간</span>
                <span className="text-gray-900 font-medium">{payment.months}개월</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600">결제 금액</span>
                <span className="text-2xl font-bold text-gray-900">{payment.amount.toLocaleString()}원</span>
              </div>

              {payment.apprDt && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">결제 일시</span>
                  <span className="text-gray-900">{new Date(payment.apprDt).toLocaleString('ko-KR')}</span>
                </div>
              )}

              {payment.apprPayType && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">결제 수단</span>
                  <span className="text-gray-900">{payment.apprPayType === 'CARD' ? '카드' : payment.apprPayType}</span>
                </div>
              )}

              {payment.apprIssuer && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">카드사</span>
                  <span className="text-gray-900">{payment.apprIssuer}</span>
                </div>
              )}

              {payment.apprNum && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600">승인 번호</span>
                  <span className="text-gray-900 font-mono text-sm">{payment.apprNum}</span>
                </div>
              )}

              {payment.newEndDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">구독 종료일</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(payment.newEndDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 안내 메시지 */}
          {payment.status === 'pending' || payment.status === 'processing' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">카카오톡을 확인해주세요</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    {payment.kakaoPhone}로 결제 링크가 전송되었습니다.<br />
                    카카오톡에서 결제를 완료해주세요.
                  </p>
                  <p className="text-xs text-blue-600">
                    결제 완료 후 위의 "상태 확인" 버튼을 눌러 결제 상태를 업데이트할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          ) : payment.status === 'confirmed' ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-2">결제가 완료되었습니다</h3>
                    <p className="text-sm text-green-700">
                      구독이 시작되었습니다. 이제 모든 강의를 수강하실 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 취소/환불 안내 */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">취소 및 환불 안내</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p>결제 취소 및 환불은 내 구매 목록에서 별도로 신청하실 수 있습니다.</p>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p>취소 신청 시 영업일 기준 24시간 이내에 처리됩니다.</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <p className="font-medium text-gray-900 mb-2">환불 규정</p>
                    <ul className="space-y-1.5 ml-4 list-disc">
                      <li>수업 시작 전: 전액 환불</li>
                      <li>총 수업 기간의 1/3 경과 전: 2/3 환불</li>
                      <li>총 수업 기간의 1/2 경과 전: 1/2 환불</li>
                      <li>총 수업 기간의 1/2 경과 후: 환불 불가</li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * 자세한 환불 규정은 평생교육법 시행령 제23조를 따릅니다.
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {payment.status === 'confirmed' && (
              <Link
                href="/courses"
                className="flex-1 bg-gray-900 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                강의 둘러보기
              </Link>
            )}
            <Link
              href="/my/enrollments"
              className="flex-1 bg-white text-gray-900 border border-gray-300 text-center py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              내 구매 목록
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentStatusPageContent />
    </Suspense>
  )
}
