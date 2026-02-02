'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import InstructorLayout from '@/components/instructor/InstructorLayout'
import RichTextEditor from '@/components/ui/RichTextEditor'
import axios from 'axios'

interface InstructorProfile {
  id: number
  name: string
  email: string
  phone: string | null
  bio: string | null
  expertise: string | null
  imageUrl: string | null
  consultingPrice: number
  consultingEnabled: boolean
  youtubeUrl: string | null
  instagramUrl: string | null
  openChatUrl: string | null
  // 서류 정보
  docName: string | null
  docAddress: string | null
  docPhone: string | null
  docBankName: string | null
  docBankAccount: string | null
  docBankHolder: string | null
  docBankCopyUrl: string | null
  docIdCopyUrl: string | null
  docYoutubeEmail: string | null
}

export default function InstructorProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<InstructorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    expertise: '',
    consultingPrice: '0',
    consultingEnabled: true,
    youtubeUrl: '',
    instagramUrl: '',
    openChatUrl: '',
    // 서류 정보
    docName: '',
    docAddress: '',
    docPhone: '',
    docBankName: '',
    docBankAccount: '',
    docBankHolder: '',
    docBankCopyUrl: '',
    docIdCopyUrl: '',
    docYoutubeEmail: ''
  })
  const [uploadingDoc, setUploadingDoc] = useState<'bank' | 'id' | null>(null)
  const bankCopyInputRef = useRef<HTMLInputElement>(null)
  const idCopyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user.role !== 'instructor' && session?.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/instructor/profile')
      if (response.data.success) {
        const data = response.data.profile
        setProfile(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          expertise: data.expertise || '',
          consultingPrice: String(data.consultingPrice || 0),
          consultingEnabled: data.consultingEnabled !== false,
          youtubeUrl: data.youtubeUrl || '',
          instagramUrl: data.instagramUrl || '',
          openChatUrl: data.openChatUrl || '',
          // 서류 정보
          docName: data.docName || '',
          docAddress: data.docAddress || '',
          docPhone: data.docPhone || '',
          docBankName: data.docBankName || '',
          docBankAccount: data.docBankAccount || '',
          docBankHolder: data.docBankHolder || '',
          docBankCopyUrl: data.docBankCopyUrl || '',
          docIdCopyUrl: data.docIdCopyUrl || '',
          docYoutubeEmail: data.docYoutubeEmail || ''
        })
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error)
      setMessage({ type: 'error', text: '프로필을 불러올 수 없습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await axios.put('/api/instructor/profile', formData)
      if (response.data.success) {
        setProfile(response.data.profile)
        setMessage({ type: 'success', text: '프로필이 저장되었습니다.' })
      }
    } catch (error: any) {
      console.error('프로필 저장 실패:', error)
      const errorMsg = error.response?.data?.error || '저장에 실패했습니다.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (4MB)
    if (file.size > 4 * 1024 * 1024) {
      setMessage({ type: 'error', text: '파일 크기는 4MB 이하여야 합니다.' })
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '이미지 파일만 업로드 가능합니다.' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'instructors')

      const uploadResponse = await axios.post('/api/upload', formData)

      if (uploadResponse.data.url) {
        // 프로필 이미지 URL 업데이트
        const updateResponse = await axios.put('/api/instructor/profile', {
          imageUrl: uploadResponse.data.url
        })

        if (updateResponse.data.success) {
          setProfile(updateResponse.data.profile)
          setMessage({ type: 'success', text: '프로필 이미지가 업데이트되었습니다.' })
        }
      }
    } catch (error: any) {
      console.error('이미지 업로드 실패:', error)
      const errorMsg = error.response?.data?.error || '이미지 업로드에 실패했습니다.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setUploading(false)
    }
  }

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bank' | 'id') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      setMessage({ type: 'error', text: '파일 크기는 4MB 이하여야 합니다.' })
      return
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: '이미지 또는 PDF 파일만 업로드 가능합니다.' })
      return
    }

    setUploadingDoc(type)
    setMessage(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'instructor-docs')

      const uploadResponse = await axios.post('/api/upload', uploadFormData)

      if (uploadResponse.data.url) {
        const fieldName = type === 'bank' ? 'docBankCopyUrl' : 'docIdCopyUrl'
        setFormData({ ...formData, [fieldName]: uploadResponse.data.url })
        setMessage({ type: 'success', text: '파일이 업로드되었습니다. 저장 버튼을 눌러주세요.' })
      }
    } catch (error: any) {
      console.error('서류 업로드 실패:', error)
      const errorMsg = error.response?.data?.error || '파일 업로드에 실패했습니다.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setUploadingDoc(null)
    }
  }

  if (loading) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">로딩 중...</div>
      </InstructorLayout>
    )
  }

  return (
    <InstructorLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
          <p className="text-gray-600 mt-1">강사 정보를 수정하세요. 수강생들에게 표시됩니다.</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 이미지</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile?.imageUrl ? (
                <img
                  src={profile.imageUrl}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-4xl text-gray-400">👤</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {uploading ? '업로드 중...' : '이미지 변경'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG 형식 / 최대 5MB
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="강사 이름"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전문 분야
              </label>
              <input
                type="text"
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="예: AI, 마케팅, 스마트스토어"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                소개
              </label>
              <RichTextEditor
                value={formData.bio}
                onChange={(value) => setFormData({ ...formData, bio: value })}
                placeholder="강사 소개를 작성하세요. 경력, 자격증, 수강생에게 하고 싶은 말 등..."
              />
            </div>
          </div>

          {/* 1:1 컨설팅 설정 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">1:1 컨설팅 설정</h2>
            <p className="text-sm text-gray-500 mb-6">수강생들이 1:1 컨설팅을 신청할 수 있도록 설정하세요.</p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consultingEnabled}
                    onChange={(e) => setFormData({ ...formData, consultingEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">1:1 컨설팅 활성화</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  컨설팅 비용 (원)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.consultingPrice}
                    onChange={(e) => setFormData({ ...formData, consultingPrice: e.target.value })}
                    className="w-48 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">0원이면 무료 컨설팅</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  설정한 금액이 1:1 컨설팅 페이지에 표시됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 소셜 링크 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">소셜 링크</h2>
            <p className="text-sm text-gray-500 mb-6">수강생들이 강사님과 소통할 수 있는 채널을 등록하세요.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="https://youtube.com/@채널명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="https://instagram.com/아이디"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z" />
                    </svg>
                    카카오 오픈채팅방
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.openChatUrl}
                  onChange={(e) => setFormData({ ...formData, openChatUrl: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="https://open.kakao.com/o/..."
                />
                <p className="text-sm text-gray-500 mt-1">수강생들이 참여할 수 있는 오픈채팅방 링크</p>
              </div>
            </div>
          </div>

          {/* 서류 정보 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">정산 서류</h2>
            <p className="text-sm text-gray-500 mb-6">정산에 필요한 정보입니다. 개인정보는 안전하게 보관됩니다.</p>

            <div className="space-y-6">
              {/* 개인 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    실명 (주민등록상 이름)
                  </label>
                  <input
                    type="text"
                    value={formData.docName}
                    onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 (정산 안내용)
                  </label>
                  <input
                    type="tel"
                    value={formData.docPhone}
                    onChange={(e) => setFormData({ ...formData, docPhone: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주소
                </label>
                <input
                  type="text"
                  value={formData.docAddress}
                  onChange={(e) => setFormData({ ...formData, docAddress: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="서울특별시 강남구..."
                />
              </div>

              {/* 계좌 정보 */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">계좌 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      은행명
                    </label>
                    <input
                      type="text"
                      value={formData.docBankName}
                      onChange={(e) => setFormData({ ...formData, docBankName: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="신한은행"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계좌번호
                    </label>
                    <input
                      type="text"
                      value={formData.docBankAccount}
                      onChange={(e) => setFormData({ ...formData, docBankAccount: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="110-123-456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예금주
                    </label>
                    <input
                      type="text"
                      value={formData.docBankHolder}
                      onChange={(e) => setFormData({ ...formData, docBankHolder: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="홍길동"
                    />
                  </div>
                </div>
              </div>

              {/* 파일 업로드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 주민등록증 사본 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주민등록증 사본
                  </label>
                  <input
                    ref={idCopyInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocUpload(e, 'id')}
                    className="hidden"
                  />
                  {formData.docIdCopyUrl ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        업로드됨
                      </span>
                      <button
                        type="button"
                        onClick={() => idCopyInputRef.current?.click()}
                        disabled={uploadingDoc === 'id'}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        변경
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => idCopyInputRef.current?.click()}
                      disabled={uploadingDoc === 'id'}
                      className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-sm text-gray-600 disabled:opacity-50 w-full"
                    >
                      {uploadingDoc === 'id' ? '업로드 중...' : '파일 선택'}
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">이미지 또는 PDF / 최대 10MB</p>
                </div>

                {/* 통장사본 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    통장 사본
                  </label>
                  <input
                    ref={bankCopyInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleDocUpload(e, 'bank')}
                    className="hidden"
                  />
                  {formData.docBankCopyUrl ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        업로드됨
                      </span>
                      <button
                        type="button"
                        onClick={() => bankCopyInputRef.current?.click()}
                        disabled={uploadingDoc === 'bank'}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        변경
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bankCopyInputRef.current?.click()}
                      disabled={uploadingDoc === 'bank'}
                      className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-sm text-gray-600 disabled:opacity-50 w-full"
                    >
                      {uploadingDoc === 'bank' ? '업로드 중...' : '파일 선택'}
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">이미지 또는 PDF / 최대 10MB</p>
                </div>
              </div>

              {/* YouTube 편집자 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube 편집자 이메일
                </label>
                <input
                  type="email"
                  value={formData.docYoutubeEmail}
                  onChange={(e) => setFormData({ ...formData, docYoutubeEmail: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="editor@gmail.com"
                />
                <p className="text-sm text-gray-500 mt-1">YouTube 채널 편집 권한을 부여받을 이메일</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </InstructorLayout>
  )
}
