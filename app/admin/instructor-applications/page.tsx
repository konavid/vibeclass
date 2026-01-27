'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Application {
  id: number
  status: string
  name: string
  field: string
  revenue: string | null
  bio: string
  photoUrl: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
  kakaoUrl: string | null
  preferredContactTime: string | null
  reviewNote: string | null
  adminNote: string | null
  docName: string | null
  docPhone: string | null
  documentsSubmittedAt: string | null
  createdAt: string
  reviewedAt: string | null
  user: {
    id: number
    name: string
    email: string
    image: string | null
  }
  reviewer: {
    id: number
    name: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  applied: { label: '지원', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  reviewing: { label: '검토중', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  approved: { label: '합격', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '불합격', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  documents_submitted: { label: '서류제출완료', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  contract_pending: { label: '계약서서명대기', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  contract_completed: { label: '계약완료', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' }
}

export default function AdminInstructorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<string>('')
  const [reviewNote, setReviewNote] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [statusFilter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/instructor-applications?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('신청 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (app: Application, action: string) => {
    setSelectedApp(app)
    setActionType(action)
    setReviewNote(app.reviewNote || '')
    setAdminNote(app.adminNote || '')
    setShowModal(true)
  }

  const executeAction = async () => {
    if (!selectedApp) return

    if ((actionType === 'approve' || actionType === 'reject') && !reviewNote.trim()) {
      alert('사유를 입력해주세요.')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/instructor-applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          reviewNote,
          adminNote
        })
      })

      const data = await res.json()
      if (data.success) {
        alert(actionType === 'contract_complete' ? '계약이 완료되었습니다!' : '처리되었습니다.')
        setShowModal(false)
        fetchApplications()
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
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">강사 신청 관리</h1>
          <p className="mt-2 text-sm text-gray-600">강사 신청을 검토하고 승인합니다</p>
        </div>
      </div>

      {/* 필터 & 검색 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {[
              { value: 'all', label: '전체' },
              { value: 'applied', label: '지원' },
              { value: 'reviewing', label: '검토중' },
              { value: 'approved', label: '합격' },
              { value: 'rejected', label: '불합격' },
              { value: 'documents_submitted', label: '서류제출' },
              { value: 'contract_pending', label: '계약서서명' },
              { value: 'contract_completed', label: '계약완료' }
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === item.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <input
              type="text"
              placeholder="이름, 이메일, 분야 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
              className="px-3 py-2 border rounded-lg text-sm w-64"
            />
            <button
              onClick={fetchApplications}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 신청 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">신청 내역이 없습니다</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">분야</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => {
                const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
                return (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {app.photoUrl || app.user.image ? (
                          <img
                            src={app.photoUrl || app.user.image!}
                            alt={app.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">{app.name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{app.name}</p>
                          <p className="text-sm text-gray-500">{app.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{app.field}</span>
                      {app.revenue && (
                        <p className="text-xs text-gray-500">{app.revenue}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/instructor-applications/${app.id}`}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          상세
                        </Link>
                        {app.status === 'applied' && (
                          <button
                            onClick={() => handleAction(app, 'reviewing')}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            검토시작
                          </button>
                        )}
                        {(app.status === 'applied' || app.status === 'reviewing') && (
                          <>
                            <button
                              onClick={() => handleAction(app, 'approve')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              합격
                            </button>
                            <button
                              onClick={() => handleAction(app, 'reject')}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              불합격
                            </button>
                          </>
                        )}
                        {app.status === 'documents_submitted' && (
                          <button
                            onClick={() => handleAction(app, 'contract_start')}
                            className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                          >
                            계약진행
                          </button>
                        )}
                        {app.status === 'contract_pending' && (
                          <button
                            onClick={() => handleAction(app, 'contract_complete')}
                            className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                          >
                            계약완료
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 액션 모달 */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'reviewing' && '검토 시작'}
              {actionType === 'approve' && '합격 처리'}
              {actionType === 'reject' && '불합격 처리'}
              {actionType === 'contract_start' && '계약 진행'}
              {actionType === 'contract_complete' && '계약 완료'}
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">신청자: <span className="font-medium text-gray-900">{selectedApp.name}</span></p>
              <p className="text-sm text-gray-600">분야: <span className="font-medium text-gray-900">{selectedApp.field}</span></p>
            </div>

            {(actionType === 'approve' || actionType === 'reject') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? '합격' : '불합격'} 사유 (신청자에게 공개됨) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={actionType === 'approve'
                    ? '예: 풍부한 경험과 전문성을 인정합니다. 다음 단계로 진행해주세요.'
                    : '예: 현재 모집 중인 분야와 맞지 않아 아쉽게도 함께하기 어렵습니다.'
                  }
                />
              </div>
            )}

            {(actionType === 'approve' || actionType === 'reject') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내부 메모 (신청자에게 비공개)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="관리자 참고용 메모"
                />
              </div>
            )}

            {actionType === 'contract_start' && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>계약 진행 처리 시:</strong><br />
                  • 서류 검토가 완료됨을 의미합니다<br />
                  • 신청자에게 계약서 서명 요청이 전달됩니다<br />
                  • 신청자가 계약서에 서명해야 합니다
                </p>
              </div>
            )}

            {actionType === 'contract_complete' && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <strong>계약 완료 처리 시:</strong><br />
                  • 신청자가 강사로 등록됩니다<br />
                  • 사용자 권한이 강사(instructor)로 변경됩니다<br />
                  • 강사 대시보드에 접근할 수 있게 됩니다
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={executeAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  actionType === 'approve' || actionType === 'contract_complete' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'contract_start' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
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
