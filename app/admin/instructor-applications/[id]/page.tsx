'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  applied: { label: '지원', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  reviewing: { label: '검토중', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  approved: { label: '합격', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '불합격', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  documents_submitted: { label: '서류제출완료', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  contract_pending: { label: '계약서서명대기', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  contract_completed: { label: '계약완료', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' }
}

export default function AdminInstructorApplicationDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionType, setActionType] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractPeriodMonths, setContractPeriodMonths] = useState(12)
  const [contractType, setContractType] = useState<'independent' | 'partnership'>('independent')
  const contractRef = useRef<HTMLDivElement>(null)

  const downloadContract = () => {
    if (!contractRef.current) return

    const contractTypeName = contractType === 'partnership' ? '마케팅공동형' : '강사독립형'
    const title = `강사계약서_${application.docName || application.name}_${contractTypeName}`

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
          h4 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; }
          p { margin-bottom: 8px; }
          ul { margin-left: 20px; margin-bottom: 10px; }
          li { margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
          th { background: #f5f5f5; }
          .font-semibold, .font-bold, strong { font-weight: bold; }
          .text-indigo-700 { color: #4338ca; }
          .text-indigo-600 { color: #4f46e5; }
          .text-red-600 { color: #dc2626; }
          .text-blue-600 { color: #2563eb; }
          .bg-indigo-50, .bg-indigo-100 { background: #eef2ff; padding: 10px; border-radius: 8px; margin: 10px 0; }
          .bg-gray-50 { background: #f9fafb; padding: 10px; border-radius: 8px; }
          .border-t { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: 1fr 1fr; gap: 20px; }
          @media print {
            body { padding: 20px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 30px; font-size: 18px;">강사 활동 계약서</h2>
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

  useEffect(() => {
    fetchApplication()
  }, [])

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/admin/instructor-applications/${resolvedParams.id}`)
      const data = await res.json()
      if (data.success) {
        setApplication(data.application)
        setReviewNote(data.application.reviewNote || '')
        setAdminNote(data.application.adminNote || '')
      } else {
        alert('신청을 찾을 수 없습니다.')
        router.push('/admin/instructor-applications')
      }
    } catch (error) {
      console.error('신청 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action: string) => {
    setActionType(action)
    setShowActionModal(true)
  }

  const executeAction = async () => {
    if ((actionType === 'approve' || actionType === 'reject') && !reviewNote.trim()) {
      alert('사유를 입력해주세요.')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/instructor-applications/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          reviewNote,
          adminNote,
          contractPeriodMonths: actionType === 'contract_start' ? contractPeriodMonths : undefined,
          contractType: actionType === 'contract_start' ? contractType : undefined
        })
      })

      const data = await res.json()
      if (data.success) {
        alert('처리되었습니다.')
        setShowActionModal(false)
        fetchApplication()
      } else {
        alert(data.error || '처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('처리 실패:', error)
      alert('처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR')
  }

  if (loading) {
    return <div className="p-12 text-center text-gray-500">로딩 중...</div>
  }

  if (!application) {
    return <div className="p-12 text-center text-gray-500">신청을 찾을 수 없습니다.</div>
  }

  const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.applied

  return (
    <div className="max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/admin/instructor-applications"
          className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block"
        >
          &larr; 목록으로
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">강사 신청 상세</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">신청자 정보</h2>
        <div className="flex items-start gap-6">
          {application.photoUrl ? (
            <img
              src={application.photoUrl}
              alt={application.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-500">{application.name.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{application.name}</h3>
            <p className="text-gray-600">{application.user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                분야: {application.field}
              </span>
              {application.revenue && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  매출: {application.revenue}
                </span>
              )}
            </div>
            {/* SNS 링크 */}
            <div className="mt-3 flex gap-2">
              {application.instagramUrl && (
                <a href={application.instagramUrl} target="_blank" rel="noopener noreferrer"
                   className="text-pink-600 hover:text-pink-800 text-sm">
                  Instagram
                </a>
              )}
              {application.youtubeUrl && (
                <a href={application.youtubeUrl} target="_blank" rel="noopener noreferrer"
                   className="text-red-600 hover:text-red-800 text-sm">
                  YouTube
                </a>
              )}
              {application.kakaoUrl && (
                <a href={application.kakaoUrl} target="_blank" rel="noopener noreferrer"
                   className="text-yellow-600 hover:text-yellow-800 text-sm">
                  KakaoTalk
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-900 mb-2">자기소개</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{application.bio}</p>
        </div>

        {application.preferredContactTime && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-1">연락하기 편한 시간</h4>
            <p className="text-gray-700">{application.preferredContactTime}</p>
          </div>
        )}
      </div>

      {/* 제출된 서류 (있는 경우) */}
      {(application.status === 'documents_submitted' || application.status === 'contract_pending' || application.status === 'contract_completed') && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">제출된 서류</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">이름:</span>
              <span className="ml-2 text-gray-900">{application.docName}</span>
            </div>
            <div>
              <span className="text-gray-500">전화번호:</span>
              <span className="ml-2 text-gray-900">{application.docPhone}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">주소:</span>
              <span className="ml-2 text-gray-900">{application.docAddress}</span>
            </div>
            <div>
              <span className="text-gray-500">은행:</span>
              <span className="ml-2 text-gray-900">{application.docBankName}</span>
            </div>
            <div>
              <span className="text-gray-500">예금주:</span>
              <span className="ml-2 text-gray-900">{application.docBankHolder}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">계좌번호:</span>
              <span className="ml-2 text-gray-900">{application.docBankAccount}</span>
            </div>
            {application.docYoutubeEmail && (
              <div className="col-span-2">
                <span className="text-gray-500">YouTube 이메일:</span>
                <span className="ml-2 text-gray-900">{application.docYoutubeEmail}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t flex gap-4">
            {application.docBankCopyUrl && (
              <a
                href={application.docBankCopyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                통장사본 보기
              </a>
            )}
            {application.docIdCopyUrl && (
              <a
                href={application.docIdCopyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                주민등록증 보기
              </a>
            )}
          </div>

          {application.docAdditionalInfo && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">추가 이력/매출 정보</h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{application.docAdditionalInfo}</p>
            </div>
          )}
        </div>
      )}

      {/* 검토 기록 */}
      {application.reviewedAt && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">검토 기록</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">검토일:</span>
              <span className="ml-2 text-gray-900">{formatDate(application.reviewedAt)}</span>
            </div>
            {application.reviewer && (
              <div>
                <span className="text-gray-500">검토자:</span>
                <span className="ml-2 text-gray-900">{application.reviewer.name}</span>
              </div>
            )}
            {application.reviewNote && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs mb-1">검토 결과 (신청자에게 공개됨)</p>
                <p className="text-gray-700">{application.reviewNote}</p>
              </div>
            )}
            {application.adminNote && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <p className="text-yellow-600 text-xs mb-1">내부 메모 (비공개)</p>
                <p className="text-gray-700">{application.adminNote}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 타임라인 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">진행 이력</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-gray-500">신청일:</span>
            <span className="text-gray-900">{formatDate(application.createdAt)}</span>
          </div>
          {application.reviewedAt && (
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-500">검토 완료:</span>
              <span className="text-gray-900">{formatDate(application.reviewedAt)}</span>
            </div>
          )}
          {application.documentsSubmittedAt && (
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="text-gray-500">서류 제출:</span>
              <span className="text-gray-900">{formatDate(application.documentsSubmittedAt)}</span>
            </div>
          )}
          {application.contractSignedAt && (
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-gray-500">계약 완료:</span>
              <span className="text-gray-900">{formatDate(application.contractSignedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      {(application.status === 'applied' || application.status === 'reviewing') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">처리</h2>
          <div className="flex gap-3">
            {application.status === 'applied' && (
              <button
                onClick={() => handleAction('reviewing')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                검토 시작
              </button>
            )}
            <button
              onClick={() => handleAction('approve')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              합격 처리
            </button>
            <button
              onClick={() => handleAction('reject')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              불합격 처리
            </button>
          </div>
        </div>
      )}

      {/* 계약서 보기/다운로드 (모든 상태에서 표시) */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">계약서</h2>
        <p className="text-gray-600 text-sm mb-4">
          강사 계약서를 확인하고 PDF로 다운로드할 수 있습니다.
        </p>
        <button
          onClick={() => setShowContractModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          📄 계약서 보기 / 인쇄
        </button>
      </div>

      {application.status === 'documents_submitted' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">계약 처리</h2>
          <p className="text-gray-600 text-sm mb-4">
            서류 확인 후 계약서를 확인하고 강사에게 서명 요청을 보냅니다.
          </p>
          <button
            onClick={() => setShowContractModal(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          >
            계약서 확인 및 서명 요청
          </button>
        </div>
      )}

      {application.status === 'contract_pending' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">계약서 서명 대기 중</h2>
          <p className="text-gray-600 text-sm mb-4">
            강사가 계약서에 서명하면 자동으로 강사로 등록됩니다.<br />
            강사가 서명을 완료하지 않은 경우, 아래 버튼으로 직접 계약 완료 처리할 수 있습니다.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowContractModal(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              계약서 다시 보기
            </button>
            <button
              onClick={() => handleAction('contract_complete')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              계약 완료 처리 (강사 등록)
            </button>
          </div>
        </div>
      )}

      {/* 계약서 모달 */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                강사 위촉 계약서
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadContract}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  🖨️ 인쇄 / PDF 저장
                </button>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* 계약 유형 선택 (documents_submitted 상태일 때만) */}
            {application.status === 'documents_submitted' && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  계약 유형 선택
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setContractType('independent')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      contractType === 'independent'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1">1. 강사 독립형</div>
                    <div className="text-xs text-gray-600">
                      강사 90% / 회사 10%<br />
                      마케팅·CS 강사 담당<br />
                      PG수수료 4% 강사 부담
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractType('partnership')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      contractType === 'partnership'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1">2. 마케팅 공동형</div>
                    <div className="text-xs text-gray-600">
                      순익 50% / 50%<br />
                      광고비·마케팅 공동 부담<br />
                      PG수수료 공동 부담
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div ref={contractRef} className="prose prose-sm max-w-none text-gray-700 bg-white p-4">
              {/* 제1조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제1조 (목적)</h4>
              <p>본 계약은 회사(이하 "회사")가 제공하는 온라인 교육 플랫폼을 통해 강사(이하 "강사")가 제작한 콘텐츠를 판매함에 있어, 판매 운영, 수익 분배, 책임 범위 및 재계약 조건 등 양 당사자의 권리·의무를 규정함을 목적으로 한다.</p>

              {/* 제2조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제2조 (정의)</h4>
              <p className="mb-2">본 계약에서 사용하는 용어의 정의는 다음과 같다.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>"플랫폼"</strong>이라 함은 회사가 운영하는 온라인 강의·콘텐츠 판매 시스템을 말한다.</li>
                <li><strong>"콘텐츠"</strong>란 강사가 제작하여 플랫폼에 등록하는 모든 강의 영상, 이미지, 파일, 문서, 커뮤니티 글 등을 포함한다.</li>
                <li><strong>"총 결제금액"</strong>이라 함은 수강생이 실제 결제한 금액(VAT 포함)을 의미한다.</li>
                <li><strong>"순매출(정산 대상 금액)"</strong>은 총 결제금액에서 부가가치세(VAT)를 제외한 금액을 의미한다.</li>
                <li><strong>"PG수수료"</strong>는 결제대행사(PG)가 부과하는 결제 수수료를 말하며, 본 계약에서는 강사가 해당 비용을 부담한다.</li>
                <li><strong>"평점"</strong>은 수강생 후기 및 만족도 평가를 기반으로 회사가 산정하는 점수를 말한다.</li>
              </ul>

              {/* 제3조 - 계약 유형별 내용 */}
              <h4 className="text-base font-bold mt-4 mb-2">제3조 (역할 및 책임)</h4>
              <p className="font-medium mb-1">① 회사의 역할</p>
              {contractType === 'independent' ? (
                <>
                  <ul className="list-disc pl-5 space-y-1 text-sm mb-2">
                    <li>결제 시스템 운영 및 환불·취소 처리</li>
                    <li>플랫폼 서버, 데이터베이스 및 시스템 유지관리</li>
                    <li>부가세 신고 및 관련 세무 처리</li>
                    <li>플랫폼 내 판매 페이지 제공 및 기본적인 기술 지원</li>
                  </ul>
                  <p className="text-xs text-gray-500 mb-2">※ 회사는 마케팅, 고객 상담, 강의 운영 보조 등 고객 관리 업무를 수행하지 않는다.</p>
                </>
              ) : (
                <ul className="list-disc pl-5 space-y-1 text-sm mb-2">
                  <li>결제 시스템 운영 및 환불·취소 처리</li>
                  <li>플랫폼 서버, 데이터베이스 및 시스템 유지관리</li>
                  <li>부가세 신고 및 관련 세무 처리</li>
                  <li>플랫폼 내 판매 페이지 제공 및 기본적인 기술 지원</li>
                  <li className="text-indigo-700 font-medium">마케팅 기획 및 광고 집행 (광고비 50% 부담)</li>
                  <li className="text-indigo-700 font-medium">고객 문의 응대 및 CS 업무 공동 수행</li>
                </ul>
              )}
              <p className="font-medium mb-1">② 강사의 역할</p>
              {contractType === 'independent' ? (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>콘텐츠 제작, 업로드 및 관리</li>
                  <li>마케팅을 통한 수강생 유입 전 과정</li>
                  <li>고객 문의 응대, 수강생 관리 등 모든 고객 서비스(CS)</li>
                  <li>콘텐츠 품질 유지 및 저작권·초상권 등 법률 준수</li>
                  <li>수강생과의 분쟁 발생 시 직접 처리 및 해결 책임</li>
                </ul>
              ) : (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>콘텐츠 제작, 업로드 및 관리</li>
                  <li className="text-indigo-700 font-medium">마케팅 기획 참여 및 광고비 50% 부담</li>
                  <li className="text-indigo-700 font-medium">고객 문의 응대 및 CS 업무 공동 수행</li>
                  <li>콘텐츠 품질 유지 및 저작권·초상권 등 법률 준수</li>
                  <li>수강생과의 분쟁 발생 시 공동 처리 및 해결</li>
                </ul>
              )}

              {/* 제4조 - 계약 유형별 정산 */}
              <h4 className="text-base font-bold mt-4 mb-2">제4조 (정산 및 수익 배분)</h4>
              {contractType === 'independent' ? (
                <>
                  <p className="font-medium mb-1">① 정산 비율</p>
                  <p className="mb-2 text-sm">본 계약의 정산 비율은 다음과 같이 <strong className="text-red-600">강사 90%</strong> / <strong className="text-blue-600">회사 10%</strong>로 한다.</p>
                  <p className="font-medium mb-1">② 정산 기준</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mb-2">
                    <li>정산 대상 금액은 <strong>총 결제금액 ÷ 1.1 = 순매출(부가세 제외 금액)</strong>으로 한다.</li>
                    <li>PG 결제수수료(4%)는 강사 부담으로 하며, 정산 시 차감한다.</li>
                    <li>회사와 강사는 아래 정산 공식에 따른다.</li>
                  </ul>
                  <p className="font-medium mb-1">③ 정산 공식</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>순매출 = 총 결제금액 ÷ 1.1</li>
                    <li>강사 정산액 = (순매출 × 0.90) − (순매출 × 0.04)</li>
                    <li>회사 수익 = 순매출 × 0.10</li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="bg-indigo-50 p-3 rounded-lg mb-3">
                    <p className="text-sm font-semibold text-indigo-800">마케팅 공동형 계약</p>
                  </div>
                  <p className="font-medium mb-1">① 수익 배분 비율</p>
                  <p className="mb-2 text-sm">본 계약의 순익 배분 비율은 <strong className="text-indigo-600">강사 50%</strong> / <strong className="text-indigo-600">회사 50%</strong>로 한다.</p>
                  <p className="font-medium mb-1">② 광고비 분담</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mb-2">
                    <li>마케팅 광고비는 <strong>강사 50% / 회사 50%</strong>로 분담한다.</li>
                    <li>광고비는 정산 시 매출에서 우선 차감한다.</li>
                  </ul>
                  <p className="font-medium mb-1">③ 정산 기준</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mb-2">
                    <li>순매출 = 총 결제금액 ÷ 1.1 (부가세 제외)</li>
                    <li>PG 결제수수료(4%)는 <strong>공동 부담</strong>으로 하며, 정산 시 차감한다.</li>
                  </ul>
                  <p className="font-medium mb-1">④ 정산 공식</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>순매출 = 총 결제금액 ÷ 1.1</li>
                    <li>순익 = 순매출 − PG수수료 − 광고비</li>
                    <li>강사 정산액 = 순익 × 0.50</li>
                    <li>회사 수익 = 순익 × 0.50</li>
                  </ul>
                </>
              )}

              {/* 제5조 정산 예시 - 계약 유형별 */}
              <h4 className="text-base font-bold mt-4 mb-2">제5조 (정산 예시)</h4>
              {contractType === 'independent' ? (
                <>
                  <p className="text-sm mb-2">예시 조건: 총 결제금액 110,000원(VAT 포함), 순매출 100,000원, PG 수수료 4%</p>
                  <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1 pr-2">항목</th>
                          <th className="text-left py-1 pr-2">계산 방식</th>
                          <th className="text-right py-1">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="py-1 pr-2">총 결제금액(부가세 포함)</td><td className="pr-2"></td><td className="text-right">110,000원</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2">부가세</td><td className="pr-2">자동 제외</td><td className="text-right">-10,000원</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2">순매출(정산 대상)</td><td className="pr-2"></td><td className="text-right">100,000원</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2">PG 수수료(4%)</td><td className="pr-2">강사 부담</td><td className="text-right">-4,000원</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2">강사 정산(90%)</td><td className="pr-2">100,000 × 0.90</td><td className="text-right">90,000원</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2">회사 수익(10%)</td><td className="pr-2">100,000 × 0.10</td><td className="text-right">10,000원</td></tr>
                        <tr className="font-semibold"><td className="py-1 pr-2">강사 실수령액</td><td className="pr-2">90,000 − 4,000</td><td className="text-right">86,000원</td></tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mb-2">예시 조건: 총 결제금액 110,000원(VAT 포함), 순매출 100,000원, PG 수수료 4%, 광고비 20,000원</p>
                  <div className="bg-indigo-50 rounded-lg p-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-indigo-200">
                          <th className="text-left py-1 pr-2">항목</th>
                          <th className="text-left py-1 pr-2">계산 방식</th>
                          <th className="text-right py-1">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-indigo-200"><td className="py-1 pr-2">총 결제금액(부가세 포함)</td><td className="pr-2"></td><td className="text-right">110,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-1 pr-2">부가세</td><td className="pr-2">자동 제외</td><td className="text-right">-10,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-1 pr-2">순매출(정산 대상)</td><td className="pr-2"></td><td className="text-right">100,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-1 pr-2">PG 수수료(4%)</td><td className="pr-2">공동 부담</td><td className="text-right">-4,000원</td></tr>
                        <tr className="border-b border-indigo-200"><td className="py-1 pr-2">광고비</td><td className="pr-2">공동 부담</td><td className="text-right">-20,000원</td></tr>
                        <tr className="border-b border-indigo-200 font-medium"><td className="py-1 pr-2">순익</td><td className="pr-2">100,000 − 4,000 − 20,000</td><td className="text-right">76,000원</td></tr>
                        <tr className="border-b border-indigo-200 text-indigo-700"><td className="py-1 pr-2">강사 정산(50%)</td><td className="pr-2">76,000 × 0.50</td><td className="text-right">38,000원</td></tr>
                        <tr className="border-b border-indigo-200 text-indigo-700"><td className="py-1 pr-2">회사 수익(50%)</td><td className="pr-2">76,000 × 0.50</td><td className="text-right">38,000원</td></tr>
                        <tr className="font-semibold"><td className="py-1 pr-2">강사 실수령액</td><td className="pr-2"></td><td className="text-right">38,000원</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">※ 광고비가 없는 경우 순익이 증가하여 강사 정산액도 증가합니다.</p>
                </>
              )}

              {/* 제6조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제6조 (환불 및 취소)</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>환불 기준은 회사의 환불 정책을 따른다.</li>
                <li>환불 발생 시 해당 금액은 강사 정산에서 차감된다.</li>
                <li>강사의 과장 광고, 허위 정보 제공, 콘텐츠 품질 저하 등 강사 귀책 사유로 환불률 상승 시 회사는 판매 제한·강의 중단·계약 해지를 할 수 있다.</li>
              </ul>

              {/* 제7조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제7조 (저작권 및 법적 책임)</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>콘텐츠의 저작권은 강사에게 귀속되나, 회사는 서비스 제공을 위해 플랫폼 내에서 이를 비독점적으로 사용할 수 있다.</li>
                <li>콘텐츠에 대한 저작권·초상권·상표권 등 분쟁 발생 시 모든 법적 책임은 강사에게 있다.</li>
                <li>회사는 강사의 콘텐츠로 인해 발생한 법적 문제에 대해 책임을 지지 않는다.</li>
              </ul>

              {/* 제8조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제8조 (계약 기간 및 해지)</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm mb-2">
                <li>본 계약의 유효 기간은 체결일로부터 <strong>{contractPeriodMonths}개월</strong>이며, 별도의 해지 통보가 없는 경우 자동으로 1년씩 연장된다.</li>
                <li>다음 각 호의 사유 발생 시 회사는 즉시 계약을 해지할 수 있다.</li>
              </ul>
              <ul className="list-disc pl-10 space-y-1 text-sm">
                <li>지속적 환불 발생</li>
                <li>저작권 분쟁</li>
                <li>법령 위반</li>
                <li>플랫폼 정책 위반</li>
              </ul>

              {/* 제9조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제9조 (평가·후기 및 재계약 조건)</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>회사는 강사 콘텐츠의 품질 유지를 위해 수강생 후기 및 평가(평점)를 정기적으로 수집·분석할 수 있다.</li>
                <li>강사는 후기 및 평가에 성실히 응해야 하며, 평점 산정 방식에 이의를 제기하지 않는다.</li>
                <li>평점은 최근 3개월간 후기를 기준으로 월 1회 산정한다.</li>
                <li>평균 평점이 4.0점 미만일 경우, 회사는 경고·시정 요청·노출 제한 등의 조치를 취할 수 있다.</li>
                <li>평균 평점이 3.5점 이하로 2개월 연속 유지될 경우, 회사는 재계약을 거절하거나 계약을 즉시 해지할 수 있다.</li>
                <li>후기 조작, 금전 제공을 통한 허위 후기 유도 등 부정행위가 적발될 경우 즉시 계약 해지한다.</li>
              </ul>

              {/* 제10조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제10조 (손해배상)</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>강사의 귀책으로 발생한 분쟁, 환불, 법적 분쟁, 손해배상 등은 강사가 전액 부담한다.</li>
                <li>회사는 결제 시스템 오류 등 자사 귀책 사유를 제외한 어떠한 손해에 대해서도 책임지지 않는다.</li>
              </ul>

              {/* 제11조 */}
              <h4 className="text-base font-bold mt-4 mb-2">제11조 (기타)</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>본 계약에서 정하지 아니한 사항은 관련 법령 및 상관례에 따른다.</li>
                <li>계약 변경 시 양 당사자의 서면 합의가 필요하다.</li>
              </ul>

              {/* 서명란 */}
              <div className="border-t pt-6 mt-6">
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div className="space-y-2">
                    <p className="font-semibold">갑 (회사)</p>
                    <p>회사명: <span className="font-medium">주식회사 텐마일즈</span></p>
                    <p>대표자: <span className="font-medium">조훈상</span></p>
                    <p>날짜: <span className="font-medium">{new Date().toLocaleDateString('ko-KR')}</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">을 (강사)</p>
                    <p>강사명: <span className="font-medium">{application.docName || application.name}</span></p>
                    <p>계약 기간: <span className="font-medium">{application.contractPeriodMonths || contractPeriodMonths}개월</span></p>
                    <p>날짜: <span className="font-medium">
                      {application.contractSignedAt
                        ? new Date(application.contractSignedAt).toLocaleDateString('ko-KR')
                        : new Date().toLocaleDateString('ko-KR')}
                    </span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* 계약 기간 입력 (documents_submitted 상태일 때만) */}
            {application.status === 'documents_submitted' && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계약 기간 설정
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={contractPeriodMonths}
                    onChange={(e) => setContractPeriodMonths(parseInt(e.target.value) || 12)}
                    className="w-20 px-3 py-2 border rounded-lg text-center"
                  />
                  <span className="text-gray-600">개월</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">기본값: 12개월 (1년)</p>
              </div>
            )}

            {/* 버튼 */}
            <div className="mt-6 pt-4 border-t flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowContractModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                닫기
              </button>
              {application.status === 'documents_submitted' && (
                <button
                  onClick={() => {
                    handleAction('contract_start')
                    setShowContractModal(false)
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                >
                  {processing ? '처리 중...' : '서명 요청 보내기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 액션 모달 */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'reviewing' && '검토 시작'}
              {actionType === 'approve' && '합격 처리'}
              {actionType === 'reject' && '불합격 처리'}
              {actionType === 'contract_start' && '계약서 서명 요청'}
              {actionType === 'contract_complete' && '계약 완료'}
            </h3>

            {(actionType === 'approve' || actionType === 'reject') && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {actionType === 'approve' ? '합격' : '불합격'} 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="신청자에게 전달될 메시지입니다"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내부 메모 (비공개)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {actionType === 'contract_start' && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>계약서 서명 요청 시:</strong><br />
                  • 신청자에게 계약서 서명 요청이 전달됩니다<br />
                  • 신청자가 계약서를 확인하고 서명해야 합니다<br />
                  • 서명 완료 시 자동으로 강사로 등록됩니다
                </p>
              </div>
            )}

            {actionType === 'contract_complete' && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  계약 완료 처리 시 신청자가 강사로 등록되며,<br />
                  강사 대시보드에 접근할 수 있게 됩니다.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={executeAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  actionType === 'contract_start' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processing ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
