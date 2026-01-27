'use client'
import { Suspense } from 'react'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import CustomerLayout from '@/components/customer/CustomerLayout'
import axios from 'axios'

interface PriceOption {
  months: number
  baseAmount: number
  discountRate: number
  discountAmount: number
  finalAmount: number
  monthlyPrice: number
}

function PaymentContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')

  const [phone, setPhone] = useState('')
  const [selectedMonths, setSelectedMonths] = useState(3)
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 로그인 체크
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/payment')
    }
  }, [status, router])

  // 가격 옵션 조회
  useEffect(() => {
    const fetchPriceOptions = async () => {
      try {
        const response = await axios.get('/api/payment/price-options')
        if (response.data.success) {
          setPriceOptions(response.data.options)
        }
      } catch (error) {
        console.error('Failed to fetch price options:', error)
      }
    }

    fetchPriceOptions()
  }, [])

  const selectedOption = priceOptions.find(opt => opt.months === selectedMonths)

  const handlePayment = async () => {
    if (!phone) {
      setError('전화번호를 입력해주세요.')
      return
    }

    if (!/^010\d{8}$/.test(phone.replace(/-/g, ''))) {
      setError('올바른 전화번호 형식이 아닙니다. (예: 01012345678)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/payment/request', {
        kakaoPhone: phone,
        months: selectedMonths,
        courseId: courseId || null
      })

      if (response.data.success) {
        alert('카카오톡으로 결제 링크가 전송되었습니다!\n카카오톡을 확인해주세요.')
        router.push(`/payment/status?billId=${response.data.bill_id}`)
      } else {
        setError(response.data.error || '결제 요청에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('Payment request error:', error)
      setError(error.response?.data?.error || '결제 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3">
              구독 결제
            </h1>
            <p className="text-lg text-gray-600">
              카카오페이로 간편하게 결제하세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽: 결제 정보 입력 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">결제 정보</h2>

              {/* 전화번호 입력 */}
              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  카카오톡 전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setPhone(value)
                  }}
                  placeholder="01012345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-base text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  결제 링크를 받을 카카오톡 전화번호를 입력해주세요
                </p>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 결제 버튼 */}
              <button
                onClick={handlePayment}
                disabled={loading || !phone}
                className="w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '처리 중...' : '카카오페이로 결제하기'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                결제 링크가 카카오톡으로 전송됩니다
              </p>
            </div>

            {/* 오른쪽: 결제 금액 정보 */}
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">결제 금액</h2>

                {selectedOption && (
                  <div className="space-y-4">
                    {/* 기본 금액 */}
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-600">기본 금액</span>
                      <span className="text-gray-900 font-medium">
                        {selectedOption.baseAmount.toLocaleString()}원
                      </span>
                    </div>

                    {/* 할인 */}
                    {selectedOption.discountRate > 0 && (
                      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                        <span className="text-green-600">
                          할인 ({Math.floor(selectedOption.discountRate * 100)}%)
                        </span>
                        <span className="text-green-600 font-medium">
                          -{selectedOption.discountAmount.toLocaleString()}원
                        </span>
                      </div>
                    )}

                    {/* 최종 금액 */}
                    <div className="flex justify-between items-center pt-4">
                      <span className="text-lg font-semibold text-gray-900">최종 결제 금액</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedOption.finalAmount.toLocaleString()}원
                      </span>
                    </div>

                    {/* 월 평균 금액 */}
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">월 평균</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {selectedOption.monthlyPrice.toLocaleString()}원/월
                        </span>
                      </div>
                    </div>

                    {/* 혜택 안내 */}
                    {selectedOption.discountRate > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 mt-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              {selectedOption.discountAmount.toLocaleString()}원 할인 적용
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {selectedOption.months}개월 구독 시 특별 할인
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 결제 안내 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">결제 안내</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      카카오페이를 통한 안전한 결제
                    </li>
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      결제 링크는 3일간 유효합니다
                    </li>
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      환불 정책에 따라 환불 가능
                    </li>
                  </ul>
                </div>

                {/* 환불 규정 안내 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">환불 규정</h3>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p>수업 시작 전: 전액 환불</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p>총 수업 기간의 1/3 경과 전: 2/3 환불</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p>총 수업 기간의 1/2 경과 전: 1/2 환불</p>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p>총 수업 기간의 1/2 경과 후: 환불 불가</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      * 취소 신청 시 24시간 이내 처리<br />
                      * 자세한 환불 규정은 평생교육법 시행령 제23조를 따릅니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
