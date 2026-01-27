'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CancelButtonProps {
  enrollmentId: number
  courseName: string
  cohort: number
  status: string
}

interface RefundInfo {
  canCancel: boolean
  isFree: boolean
  originalAmount?: number
  refundAmount?: number
  refundRate?: number
  refundReason?: string
  message?: string
  error?: string
}

export default function CancelButton({ enrollmentId, courseName, cohort, status }: CancelButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 취소 불가능한 상태
  if (status === 'cancelled' || status === 'completed') {
    return null
  }

  const handleOpenModal = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/cancel`)
      const data = await res.json()

      if (data.success) {
        setRefundInfo(data)
        setShowModal(true)
      } else {
        setError(data.error || '환불 정보를 가져올 수 없습니다.')
        setRefundInfo({ canCancel: false, isFree: false, error: data.error })
        setShowModal(true)
      }
    } catch (err) {
      setError('환불 정보 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/cancel`, {
        method: 'POST'
      })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          setShowModal(false)
          router.refresh()
        }, 2000)
      } else {
        setError(data.error || '취소 처리 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('취소 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        수강 취소
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 z-[9999]" onClick={() => !loading && setShowModal(false)} />

            <div className="relative z-[10000] w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {success ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">취소 완료</h3>
                  <p className="mt-2 text-sm text-gray-500">수강 취소가 완료되었습니다.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">수강 취소</h3>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>{courseName} {cohort}기</strong> 수강을 취소하시겠습니까?
                    </p>
                  </div>

                  {refundInfo && refundInfo.canCancel && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      {refundInfo.isFree ? (
                        <p className="text-sm text-gray-600">{refundInfo.message || '무료 강의는 즉시 취소됩니다.'}</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">결제 금액</span>
                            <span className="font-medium">{refundInfo.originalAmount?.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">환불율</span>
                            <span className="font-medium">{refundInfo.refundRate ? Math.round(refundInfo.refundRate * 100) : 0}%</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                            <span className="text-gray-600 font-medium">환불 금액</span>
                            <span className="font-bold text-indigo-600 text-base">{refundInfo.refundAmount?.toLocaleString()}원</span>
                          </div>
                          <div className="bg-blue-50 rounded p-3 mt-2">
                            <p className="text-xs font-medium text-blue-800 mb-1">적용 사유</p>
                            <p className="text-xs text-blue-700">{refundInfo.refundReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 환불 정책 안내 */}
                  {refundInfo && !refundInfo.isFree && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-amber-800 mb-2">환불 정책 안내 (이용약관 제9조)</p>
                      <table className="w-full text-xs">
                        <tbody className="text-amber-700">
                          <tr className={refundInfo.refundRate === 1 ? 'bg-amber-100 font-medium' : ''}>
                            <td className="py-1">수강 시작 전</td>
                            <td className="py-1 text-right">전액 환불 (100%)</td>
                          </tr>
                          <tr className={refundInfo.refundRate === 2/3 ? 'bg-amber-100 font-medium' : ''}>
                            <td className="py-1">1/3 경과 전</td>
                            <td className="py-1 text-right">2/3 환불 (66%)</td>
                          </tr>
                          <tr className={refundInfo.refundRate === 0.5 ? 'bg-amber-100 font-medium' : ''}>
                            <td className="py-1">1/2 경과 전</td>
                            <td className="py-1 text-right">1/2 환불 (50%)</td>
                          </tr>
                          <tr className={refundInfo.refundRate === 0 ? 'bg-amber-100 font-medium' : ''}>
                            <td className="py-1">1/2 경과 후</td>
                            <td className="py-1 text-right">환불 불가</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {refundInfo && !refundInfo.canCancel && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-700">{refundInfo.error || '환불이 불가능합니다.'}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                      닫기
                    </button>
                    {refundInfo?.canCancel && (
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? '처리 중...' : '취소 확정'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
