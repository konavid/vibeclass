'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

// 은행 목록
const BANKS = [
  '신한은행', '국민은행', '우리은행', 'NH농협은행', '하나은행',
  '기업은행', 'SC제일은행', '씨티은행', '케이뱅크', '카카오뱅크',
  '토스뱅크', '새마을금고', '신협', '우체국', '수협', '기타'
]

export default function InstructorApplyDocumentsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  const bankCopyRef = useRef<HTMLInputElement>(null)
  const idCopyRef = useRef<HTMLInputElement>(null)
  const additionalRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    docName: '',
    docAddress: '',
    docPhone: '',
    docBankName: '',
    docBankAccount: '',
    docBankHolder: '',
    docBankCopyUrl: '',
    docIdCopyUrl: '',
    docYoutubeEmail: '',
    docAdditionalInfo: '',
    docAdditionalFiles: [] as string[]
  })

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

        // 합격 상태가 아니면 상태 페이지로
        if (data.application.status !== 'approved') {
          router.push('/instructor-apply/status')
          return
        }

        setApplication(data.application)
        // 기존에 입력한 값이 있으면 로드
        setFormData({
          docName: data.application.docName || data.application.name || '',
          docAddress: data.application.docAddress || '',
          docPhone: data.application.docPhone || '',
          docBankName: data.application.docBankName || '',
          docBankAccount: data.application.docBankAccount || '',
          docBankHolder: data.application.docBankHolder || '',
          docBankCopyUrl: data.application.docBankCopyUrl || '',
          docIdCopyUrl: data.application.docIdCopyUrl || '',
          docYoutubeEmail: data.application.docYoutubeEmail || '',
          docAdditionalInfo: data.application.docAdditionalInfo || '',
          docAdditionalFiles: data.application.docAdditionalFiles
            ? JSON.parse(data.application.docAdditionalFiles)
            : []
        })
      }
    } catch (error) {
      console.error('신청 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'docBankCopyUrl' | 'docIdCopyUrl' | 'additional'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setUploading(field)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'instructor-documents')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await res.json()
      if (data.success || data.url) {
        if (field === 'additional') {
          setFormData(prev => ({
            ...prev,
            docAdditionalFiles: [...prev.docAdditionalFiles, data.url]
          }))
        } else {
          setFormData(prev => ({ ...prev, [field]: data.url }))
        }
      } else {
        alert('업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('업로드 실패:', error)
      alert('업로드에 실패했습니다.')
    } finally {
      setUploading(null)
    }
  }

  const removeAdditionalFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      docAdditionalFiles: prev.docAdditionalFiles.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 필수 항목 검증
    if (!formData.docName || !formData.docAddress || !formData.docPhone) {
      alert('이름, 주소, 전화번호는 필수 항목입니다.')
      return
    }

    if (!formData.docBankName || !formData.docBankAccount || !formData.docBankHolder) {
      alert('은행 정보는 필수 항목입니다.')
      return
    }

    if (!formData.docBankCopyUrl) {
      alert('통장 사본을 업로드해주세요.')
      return
    }

    if (!formData.docIdCopyUrl) {
      alert('주민등록증 사본을 업로드해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/instructor-apply/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        alert('서류가 제출되었습니다!')
        router.push('/instructor-apply/status')
      } else {
        alert(data.error || '제출에 실패했습니다.')
      }
    } catch (error) {
      console.error('제출 실패:', error)
      alert('제출 중 오류가 발생했습니다.')
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
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
          <Link
            href="/instructor-apply"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            강사 신청 페이지로
          </Link>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            <span>🎉</span>
            <span>축하합니다! 강사로 합격하셨습니다</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">서류 제출</h1>
          <p className="text-gray-600">정산 및 계약을 위한 서류를 제출해주세요</p>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-yellow-800 mb-2">서류 제출 안내</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 모든 정보는 암호화되어 안전하게 보관됩니다.</li>
            <li>• 정산을 위해 정확한 계좌 정보를 입력해주세요.</li>
            <li>• 주민등록증은 본인 확인 목적으로만 사용됩니다.</li>
            <li>• 유튜브 편집권한 부여를 위해 구글 계정 이메일이 필요합니다.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border shadow-sm p-8">
          {/* 기본 정보 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 (실명) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.docName}
                  onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.docAddress}
                  onChange={(e) => setFormData({ ...formData, docAddress: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="도로명 주소 + 상세주소"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.docPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({ ...formData, docPhone: value })
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="01012345678"
                />
              </div>
            </div>
          </div>

          {/* 계좌 정보 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">계좌 정보</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    은행 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.docBankName}
                    onChange={(e) => setFormData({ ...formData, docBankName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">선택</option>
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예금주 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.docBankHolder}
                    onChange={(e) => setFormData({ ...formData, docBankHolder: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.docBankAccount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9-]/g, '')
                    setFormData({ ...formData, docBankAccount: value })
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="'-' 없이 숫자만 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  통장 사본 <span className="text-red-500">*</span>
                </label>
                <input
                  ref={bankCopyRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'docBankCopyUrl')}
                  className="hidden"
                />
                {formData.docBankCopyUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-600">✓</span>
                    <span className="text-green-700 text-sm flex-1">파일이 업로드되었습니다</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, docBankCopyUrl: '' })}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bankCopyRef.current?.click()}
                    disabled={uploading === 'docBankCopyUrl'}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {uploading === 'docBankCopyUrl' ? '업로드 중...' : '통장 사본 업로드'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 신분증 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">신분 확인</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주민등록증 사본 <span className="text-red-500">*</span>
              </label>
              <input
                ref={idCopyRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, 'docIdCopyUrl')}
                className="hidden"
              />
              {formData.docIdCopyUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600">✓</span>
                  <span className="text-green-700 text-sm flex-1">파일이 업로드되었습니다</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, docIdCopyUrl: '' })}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => idCopyRef.current?.click()}
                  disabled={uploading === 'docIdCopyUrl'}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors disabled:opacity-50"
                >
                  {uploading === 'docIdCopyUrl' ? '업로드 중...' : '주민등록증 사본 업로드'}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2">
                * 뒷자리는 가려주셔도 됩니다. 본인 확인 용도로만 사용됩니다.
              </p>
            </div>
          </div>

          {/* 유튜브 계정 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">유튜브 편집권한</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                유튜브 계정 이메일 (구글 계정)
              </label>
              <input
                type="email"
                value={formData.docYoutubeEmail}
                onChange={(e) => setFormData({ ...formData, docYoutubeEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="example@gmail.com"
              />
              <p className="text-xs text-gray-500 mt-2">
                * 강의 영상 편집권한 부여를 위해 필요합니다.
              </p>
            </div>
          </div>

          {/* 추가 서류 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 서류 (선택)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이력/매출 상세자료
                </label>
                <textarea
                  value={formData.docAdditionalInfo}
                  onChange={(e) => setFormData({ ...formData, docAdditionalInfo: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="학력, 졸업증명서, 자격증, 매출 상세 내역 등 자유롭게 기재해주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  첨부 파일 (졸업증명서, 자격증 등)
                </label>
                <input
                  ref={additionalRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 'additional')}
                  className="hidden"
                />

                {formData.docAdditionalFiles.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.docAdditionalFiles.map((url, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 text-sm flex-1">파일 {index + 1}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm hover:underline">
                          보기
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAdditionalFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => additionalRef.current?.click()}
                  disabled={uploading === 'additional'}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors disabled:opacity-50"
                >
                  {uploading === 'additional' ? '업로드 중...' : '+ 파일 추가'}
                </button>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <Link
              href="/instructor-apply/status"
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
            >
              {submitting ? '제출 중...' : '서류 제출하기'}
            </button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  )
}
