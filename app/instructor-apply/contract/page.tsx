'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CustomerLayout from '@/components/customer/CustomerLayout'

export default function InstructorContractPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const contractRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const downloadContract = () => {
    if (!contractRef.current || !application) return

    const contractTypeName = application.contractType === 'partnership' ? '마케팅공동형' : '강사독립형'
    const title = `강사계약서_${application.name}_${contractTypeName}`

    // 새 창에서 인쇄
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.')
      return
    }

    const content = contractRef.current.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
            padding: 40px;
            line-height: 1.6;
            font-size: 12px;
          }
          h2 { font-size: 18px; text-align: center; margin-bottom: 30px; }
          h3 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; }
          p { margin-bottom: 8px; }
          ul { margin-left: 20px; margin-bottom: 10px; }
          li { margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
          th { background: #f5f5f5; }
          .font-semibold, .font-bold, strong { font-weight: bold; }
          .text-indigo-700 { color: #4338ca; }
          .text-indigo-600 { color: #4f46e5; }
          .bg-indigo-50, .bg-indigo-100 { background: #eef2ff; padding: 10px; border-radius: 8px; margin: 10px 0; }
          .bg-gray-50 { background: #f9fafb; padding: 10px; border-radius: 8px; }
          .border-t { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; }
          .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          @media print {
            body { padding: 20px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `)

    printWindow.document.close()

    // 잠시 대기 후 인쇄 다이얼로그 표시
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  // 캔버스 초기화
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기 설정
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    // 배경색 설정
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 펜 설정
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [application])

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    const { x, y } = getCanvasCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const getSignatureDataUrl = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }

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
          router.push('/instructor-apply')
          return
        }
        if (data.application.status !== 'contract_pending') {
          router.push('/instructor-apply/status')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      alert('계약 내용에 동의해주세요.')
      return
    }

    if (!hasSignature) {
      alert('서명을 해주세요.')
      return
    }

    const signatureDataUrl = getSignatureDataUrl()
    if (!signatureDataUrl) {
      alert('서명을 해주세요.')
      return
    }

    setSubmitting(true)
    try {
      // 서명 당시 계약서 HTML 내용 저장 (서명 이미지 포함)
      const contractContentHtml = contractRef.current?.innerHTML || ''

      const res = await fetch('/api/instructor-apply/contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: application.name,
          signatureImage: signatureDataUrl,
          contractContent: contractContentHtml // 서명 당시 계약 내용 저장
        })
      })

      const data = await res.json()
      if (data.success) {
        alert('계약서 서명이 완료되었습니다!')
        router.push('/instructor-apply/status')
      } else {
        alert(data.error || '서명 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('계약서 서명 실패:', error)
      alert('서명 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
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
    return null
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">강사 계약서</h1>
          <p className="text-gray-600">계약 내용을 확인하고 서명해주세요</p>
        </div>

        {/* 인쇄 버튼 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadContract}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            🖨️ 인쇄 / PDF 저장
          </button>
        </div>

        {/* 계약서 내용 */}
        <div ref={contractRef} className="bg-white rounded-2xl border shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center border-b pb-4">
            강사 활동 계약서
          </h2>

          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제1조 (목적)</h3>
              <p>
                본 계약은 회사(이하 "회사")가 제공하는 온라인 교육 플랫폼을 통해 강사(이하 "강사")가 제작한 콘텐츠를 판매함에 있어, 판매 운영, 수익 분배, 책임 범위 및 재계약 조건 등 양 당사자의 권리·의무를 규정함을 목적으로 한다.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제2조 (정의)</h3>
              <p className="mb-2">본 계약에서 사용하는 용어의 정의는 다음과 같다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>"플랫폼"</strong>이라 함은 회사가 운영하는 온라인 강의·콘텐츠 판매 시스템을 말한다.</li>
                <li><strong>"콘텐츠"</strong>란 강사가 제작하여 플랫폼에 등록하는 모든 강의 영상, 이미지, 파일, 문서, 커뮤니티 글 등을 포함한다.</li>
                <li><strong>"총 결제금액"</strong>이라 함은 수강생이 실제 결제한 금액(VAT 포함)을 의미한다.</li>
                <li><strong>"순매출(정산 대상 금액)"</strong>은 총 결제금액에서 부가가치세(VAT)를 제외한 금액을 의미한다.</li>
                <li><strong>"PG수수료"</strong>는 결제대행사(PG)가 부과하는 결제 수수료를 말하며, 본 계약에서는 강사가 해당 비용을 부담한다.</li>
                <li><strong>"평점"</strong>은 수강생 후기 및 만족도 평가를 기반으로 회사가 산정하는 점수를 말한다.</li>
              </ul>
            </div>

            {/* 계약 유형 배지 */}
            {application.contractType === 'partnership' && (
              <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg text-center font-semibold mb-4">
                마케팅 공동형 계약
              </div>
            )}

            {/* 제3조 - 계약 유형별 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제3조 (역할 및 책임)</h3>
              <p className="font-medium mb-2">① 회사의 역할</p>
              {application.contractType === 'partnership' ? (
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>결제 시스템 운영 및 환불·취소 처리</li>
                  <li>플랫폼 서버, 데이터베이스 및 시스템 유지관리</li>
                  <li>부가세 신고 및 관련 세무 처리</li>
                  <li>플랫폼 내 판매 페이지 제공 및 기본적인 기술 지원</li>
                  <li className="text-indigo-700 font-medium">마케팅 기획 및 광고 집행 (광고비 50% 부담)</li>
                  <li className="text-indigo-700 font-medium">고객 문의 응대 및 CS 업무 공동 수행</li>
                </ul>
              ) : (
                <>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>결제 시스템 운영 및 환불·취소 처리</li>
                    <li>플랫폼 서버, 데이터베이스 및 시스템 유지관리</li>
                    <li>부가세 신고 및 관련 세무 처리</li>
                    <li>플랫폼 내 판매 페이지 제공 및 기본적인 기술 지원</li>
                  </ul>
                  <p className="text-xs text-gray-500 mb-3">※ 회사는 마케팅, 고객 상담, 강의 운영 보조 등 고객 관리 업무를 수행하지 않는다.</p>
                </>
              )}
              <p className="font-medium mb-2">② 강사의 역할</p>
              {application.contractType === 'partnership' ? (
                <ul className="list-disc pl-5 space-y-1">
                  <li>콘텐츠 제작, 업로드 및 관리</li>
                  <li className="text-indigo-700 font-medium">마케팅 기획 참여 및 광고비 50% 부담</li>
                  <li className="text-indigo-700 font-medium">고객 문의 응대 및 CS 업무 공동 수행</li>
                  <li>콘텐츠 품질 유지 및 저작권·초상권 등 법률 준수</li>
                  <li>수강생과의 분쟁 발생 시 공동 처리 및 해결</li>
                </ul>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  <li>콘텐츠 제작, 업로드 및 관리</li>
                  <li>마케팅을 통한 수강생 유입 전 과정</li>
                  <li>고객 문의 응대, 수강생 관리 등 모든 고객 서비스(CS)</li>
                  <li>콘텐츠 품질 유지 및 저작권·초상권 등 법률 준수</li>
                  <li>수강생과의 분쟁 발생 시 직접 처리 및 해결 책임</li>
                </ul>
              )}
            </div>

            {/* 제4조 - 계약 유형별 정산 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제4조 (정산 및 수익 배분)</h3>
              {application.contractType === 'partnership' ? (
                <>
                  <p className="font-medium mb-2">① 수익 배분 비율</p>
                  <p className="mb-3">본 계약의 순익 배분 비율은 <strong className="text-indigo-600">강사 50% / 회사 50%</strong>로 한다.</p>
                  <p className="font-medium mb-2">② 광고비 분담</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>마케팅 광고비는 <strong>강사 50% / 회사 50%</strong>로 분담한다.</li>
                    <li>광고비는 정산 시 매출에서 우선 차감한다.</li>
                  </ul>
                  <p className="font-medium mb-2">③ 정산 기준</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>순매출 = 총 결제금액 ÷ 1.1 (부가세 제외)</li>
                    <li>PG 결제수수료(4%)는 <strong>공동 부담</strong>으로 하며, 정산 시 차감한다.</li>
                  </ul>
                  <p className="font-medium mb-2">④ 정산 공식</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>순매출 = 총 결제금액 ÷ 1.1</li>
                    <li>순익 = 순매출 − PG수수료 − 광고비</li>
                    <li>강사 정산액 = 순익 × 0.50</li>
                    <li>회사 수익 = 순익 × 0.50</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="font-medium mb-2">① 정산 비율</p>
                  <p className="mb-3">본 계약의 정산 비율은 다음과 같이 <strong>강사 90% / 회사 10%</strong>로 한다.</p>
                  <p className="font-medium mb-2">② 정산 기준</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>정산 대상 금액은 <strong>총 결제금액 ÷ 1.1 = 순매출(부가세 제외 금액)</strong>으로 한다.</li>
                    <li>PG 결제수수료(4%)는 강사 부담으로 하며, 정산 시 차감한다.</li>
                    <li>회사와 강사는 아래 정산 공식에 따른다.</li>
                  </ul>
                  <p className="font-medium mb-2">③ 정산 공식</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>순매출 = 총 결제금액 ÷ 1.1</li>
                    <li>강사 정산액 = (순매출 × 0.90) − (순매출 × 0.04)</li>
                    <li>회사 수익 = 순매출 × 0.10</li>
                  </ul>
                </>
              )}
            </div>

            {/* 제5조 - 계약 유형별 정산 예시 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제5조 (정산 예시)</h3>
              {application.contractType === 'partnership' ? (
                <>
                  <p className="mb-2">예시 조건: 총 결제금액 110,000원(VAT 포함), 순매출 100,000원, PG 수수료 4%, 광고비 20,000원</p>
                  <div className="bg-indigo-50 rounded-lg p-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-indigo-200">
                          <th className="text-left py-2 pr-4">항목</th>
                          <th className="text-left py-2 pr-4">계산 방식</th>
                          <th className="text-right py-2">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-indigo-200"><td className="py-2 pr-4">총 결제금액(부가세 포함)</td><td className="pr-4"></td><td className="text-right">110,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-2 pr-4">부가세</td><td className="pr-4">자동 제외</td><td className="text-right">-10,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-2 pr-4">순매출(정산 대상)</td><td className="pr-4"></td><td className="text-right">100,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-2 pr-4">PG 수수료(4%)</td><td className="pr-4">공동 부담</td><td className="text-right">-4,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-2 pr-4">광고비</td><td className="pr-4">공동 부담</td><td className="text-right">-20,000원</td></tr>
                        <tr className="border-b border-indigo-200 font-medium"><td className="py-2 pr-4">순익</td><td className="pr-4">100,000 − 4,000 − 20,000</td><td className="text-right">76,000원</td></tr>
                        <tr className="border-b border-indigo-200 text-indigo-700"><td className="py-2 pr-4">강사 정산(50%)</td><td className="pr-4">76,000 × 0.50</td><td className="text-right">38,000원</td></tr>
                        <tr className="border-b border-indigo-200 text-indigo-700"><td className="py-2 pr-4">회사 수익(50%)</td><td className="pr-4">76,000 × 0.50</td><td className="text-right">38,000원</td></tr>
                        <tr className="font-semibold"><td className="py-2 pr-4">강사 실수령액</td><td className="pr-4"></td><td className="text-right">38,000원</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">※ 광고비가 없는 경우 순익이 증가하여 강사 정산액도 증가합니다.</p>
                </>
              ) : (
                <>
                  <p className="mb-2">예시 조건: 총 결제금액 110,000원(VAT 포함), 순매출 100,000원, PG 수수료 4%</p>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">항목</th>
                          <th className="text-left py-2 pr-4">계산 방식</th>
                          <th className="text-right py-2">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="py-2 pr-4">총 결제금액(부가세 포함)</td><td className="pr-4"></td><td className="text-right">110,000원</td></tr>
                        <tr className="border-b"><td className="py-2 pr-4">부가세</td><td className="pr-4">자동 제외</td><td className="text-right">-10,000원</td></tr>
                        <tr className="border-b"><td className="py-2 pr-4">순매출(정산 대상)</td><td className="pr-4"></td><td className="text-right">100,000원</td></tr>
                        <tr className="border-b"><td className="py-2 pr-4">PG 수수료(4%)</td><td className="pr-4">강사 부담</td><td className="text-right">-4,000원</td></tr>
                        <tr className="border-b"><td className="py-2 pr-4">강사 정산(90%)</td><td className="pr-4">100,000 × 0.90</td><td className="text-right">90,000원</td></tr>
                        <tr className="border-b"><td className="py-2 pr-4">회사 수익(10%)</td><td className="pr-4">100,000 × 0.10</td><td className="text-right">10,000원</td></tr>
                        <tr className="font-semibold"><td className="py-2 pr-4">강사 실수령액</td><td className="pr-4">90,000 − 4,000</td><td className="text-right">86,000원</td></tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제6조 (환불 및 취소)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>환불 기준은 회사의 환불 정책을 따른다.</li>
                <li>환불 발생 시 해당 금액은 강사 정산에서 차감된다.</li>
                <li>강사의 과장 광고, 허위 정보 제공, 콘텐츠 품질 저하 등 강사 귀책 사유로 환불률 상승 시 회사는 판매 제한·강의 중단·계약 해지를 할 수 있다.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제7조 (저작권 및 법적 책임)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>콘텐츠의 저작권은 강사에게 귀속되나, 회사는 서비스 제공을 위해 플랫폼 내에서 이를 비독점적으로 사용할 수 있다.</li>
                <li>콘텐츠에 대한 저작권·초상권·상표권 등 분쟁 발생 시 모든 법적 책임은 강사에게 있다.</li>
                <li>회사는 강사의 콘텐츠로 인해 발생한 법적 문제에 대해 책임을 지지 않는다.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제8조 (계약 기간 및 해지)</h3>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>본 계약의 유효 기간은 체결일로부터 <strong>{application.contractPeriodMonths || 12}개월</strong>이며, 별도의 해지 통보가 없는 경우 자동으로 1년씩 연장된다.</li>
                <li>다음 각 호의 사유 발생 시 회사는 즉시 계약을 해지할 수 있다.</li>
              </ul>
              <ul className="list-disc pl-10 space-y-1">
                <li>지속적 환불 발생</li>
                <li>저작권 분쟁</li>
                <li>법령 위반</li>
                <li>플랫폼 정책 위반</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제9조 (평가·후기 및 재계약 조건)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>회사는 강사 콘텐츠의 품질 유지를 위해 수강생 후기 및 평가(평점)를 정기적으로 수집·분석할 수 있다.</li>
                <li>강사는 후기 및 평가에 성실히 응해야 하며, 평점 산정 방식에 이의를 제기하지 않는다.</li>
                <li>평점은 최근 3개월간 후기를 기준으로 월 1회 산정한다.</li>
                <li>평균 평점이 4.0점 미만일 경우, 회사는 경고·시정 요청·노출 제한 등의 조치를 취할 수 있다.</li>
                <li>평균 평점이 3.5점 이하로 2개월 연속 유지될 경우, 회사는 재계약을 거절하거나 계약을 즉시 해지할 수 있다.</li>
                <li>후기 조작, 금전 제공을 통한 허위 후기 유도 등 부정행위가 적발될 경우 즉시 계약 해지한다.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제10조 (손해배상)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>강사의 귀책으로 발생한 분쟁, 환불, 법적 분쟁, 손해배상 등은 강사가 전액 부담한다.</li>
                <li>회사는 결제 시스템 오류 등 자사 귀책 사유를 제외한 어떠한 손해에 대해서도 책임지지 않는다.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">제11조 (기타)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>본 계약에서 정하지 아니한 사항은 관련 법령 및 상관례에 따른다.</li>
                <li>계약 변경 시 양 당사자의 서면 합의가 필요하다.</li>
              </ul>
            </div>

            {/* 계약 서명란 */}
            <div className="border-t pt-6 mt-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="font-semibold">갑 (회사)</p>
                  <p>회사명: <span className="font-medium">주식회사 텐마일즈</span></p>
                  <p>대표자: <span className="font-medium">조훈상</span></p>
                  <p>날짜: <span className="font-medium">{new Date().toLocaleDateString('ko-KR')}</span></p>
                </div>
                <div className="space-y-3">
                  <p className="font-semibold">을 (강사)</p>
                  <p>강사명: <span className="font-medium">{application.docName || application.name}</span></p>
                  <p>계약 기간: <span className="font-medium">{application.contractPeriodMonths || 12}개월</span></p>
                  <p>서명일: <span className="font-medium">{new Date().toLocaleDateString('ko-KR')}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 계약자 정보 */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">계약자 정보</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">이름:</span>
              <span className="ml-2 text-gray-900 font-medium">{application.name}</span>
            </div>
            <div>
              <span className="text-gray-500">분야:</span>
              <span className="ml-2 text-gray-900 font-medium">{application.field}</span>
            </div>
            <div>
              <span className="text-gray-500">연락처:</span>
              <span className="ml-2 text-gray-900 font-medium">{application.docPhone || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">계약일:</span>
              <span className="ml-2 text-gray-900 font-medium">
                {new Date().toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>

        {/* 서명 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border shadow-sm p-8">
          <h3 className="font-semibold text-gray-900 mb-6">계약서 서명</h3>

          {/* 동의 체크박스 */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-700">
                위 계약 내용을 충분히 읽고 이해하였으며, 모든 조항에 동의합니다.
              </span>
            </label>
          </div>

          {/* 자필 서명 캔버스 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자필 서명 <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-3">
              아래 박스에 마우스 또는 터치로 서명해주세요.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50">
              <canvas
                ref={canvasRef}
                className="w-full h-40 bg-white rounded cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                서명자: <strong>{application.name}</strong>
              </span>
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-red-600 hover:text-red-800"
              >
                서명 지우기
              </button>
            </div>
            {hasSignature && (
              <p className="text-sm text-green-600 mt-2">✓ 서명이 입력되었습니다.</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting || !agreed || !hasSignature}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '서명 처리 중...' : '계약서 서명 완료'}
          </button>
        </form>
      </div>
    </CustomerLayout>
  )
}
