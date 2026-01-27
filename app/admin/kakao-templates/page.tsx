'use client'

import { useState, useEffect } from 'react'

interface AligoTemplate {
  templtCode: string
  templtName: string
  templtContent: string
  status: string
  inspStatus: string
  cdate: string
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  registration_complete: '회원가입 완료',
  enrollment_complete: '수강신청 완료',
  class_reminder: '수업 시작 알림',
  review_request: '후기 작성 요청',
}

export default function KakaoTemplatesPage() {
  const [aligoTemplates, setAligoTemplates] = useState<AligoTemplate[]>([])
  const [templateMappings, setTemplateMappings] = useState<Record<string, string>>({})
  const [notificationTypes, setNotificationTypes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/kakao-templates')
      const data = await res.json()

      if (data.success) {
        setAligoTemplates(data.aligoTemplates?.list || [])
        setTemplateMappings(data.templateMappings || {})
        setNotificationTypes(data.notificationTypes || {})
      } else {
        setMessage({ type: 'error', text: data.error || '템플릿 조회 실패' })
      }
    } catch (error) {
      console.error('템플릿 조회 실패:', error)
      setMessage({ type: 'error', text: '템플릿 조회 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleMappingChange = (notificationType: string, templateCode: string) => {
    setTemplateMappings(prev => ({
      ...prev,
      [notificationType]: templateCode
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/kakao-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: templateMappings })
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: '템플릿 연결이 저장되었습니다.' })
      } else {
        setMessage({ type: 'error', text: data.error || '저장 실패' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string, inspStatus: string) => {
    // inspStatus가 APR이면 검수 승인된 상태 (발송 가능)
    if (inspStatus === 'APR') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">승인</span>
    }
    if (inspStatus === 'REQ') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">검수중</span>
    }
    if (inspStatus === 'REG') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">검수대기</span>
    }
    if (inspStatus === 'REJ') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">반려</span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">대기</span>
  }

  // 승인된 템플릿만 필터링 (inspStatus가 APR이면 발송 가능)
  const approvedTemplates = aligoTemplates.filter(t => t.inspStatus === 'APR')

  if (loading) {
    return <div className="text-gray-600">로딩 중...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">알림톡 템플릿 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          알리고에 등록된 템플릿을 알림 유형에 연결합니다.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">안내</h3>
        <p className="text-sm text-blue-800">
          템플릿 등록/수정/삭제는{' '}
          <a
            href="https://smartsms.aligo.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-blue-900"
          >
            알리고 사이트
          </a>
          에서 직접 관리 → 검수 승인 후 아래에서 연결해주세요.
        </p>
      </div>

      {/* 템플릿 연결 설정 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">템플릿 연결</h2>

        <div className="space-y-4">
          {Object.entries(notificationTypes).map(([key, typeKey]) => (
            <div key={key} className="flex items-center gap-4">
              <label className="w-40 text-sm font-medium text-gray-700">
                {NOTIFICATION_TYPE_LABELS[typeKey] || typeKey}
              </label>
              <select
                value={templateMappings[typeKey] || ''}
                onChange={(e) => handleMappingChange(typeKey, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">선택 안함</option>
                {approvedTemplates.length > 0 ? (
                  approvedTemplates.map((template) => (
                    <option key={template.templtCode} value={template.templtCode}>
                      {template.templtCode} - {template.templtName}
                    </option>
                  ))
                ) : (
                  aligoTemplates.map((template) => (
                    <option key={template.templtCode} value={template.templtCode}>
                      {template.templtCode} - {template.templtName} ({template.inspStatus === 'APR' ? '승인' : '미승인'})
                    </option>
                  ))
                )}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={fetchTemplates}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 알리고 등록 템플릿 목록 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">알리고 등록 템플릿</h2>
        </div>

        {aligoTemplates.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aligoTemplates.map((template) => (
                <tr key={template.templtCode} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {template.templtCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.templtName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(template.status, template.inspStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.cdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            등록된 템플릿이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
