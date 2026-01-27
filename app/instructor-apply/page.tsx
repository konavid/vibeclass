'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

// 신청 단계 정보
const STEPS = [
  {
    number: 1,
    title: '강사 지원',
    description: '개인정보 동의 후 기본 정보와 이력을 입력하여 지원합니다.',
    status: 'applied'
  },
  {
    number: 2,
    title: '강사 검토중',
    description: '바이브클래스 전문가 팀에서 신청서를 검토합니다. (약 3-5 영업일 소요)',
    status: 'reviewing'
  },
  {
    number: 3,
    title: '강사 합격',
    description: '합격 시 축하 메시지와 함께 다음 단계를 안내받습니다.',
    status: 'approved'
  },
  {
    number: 4,
    title: '강사 서류 입력',
    description: '정산을 위한 계좌 정보와 신분 확인 서류를 제출합니다.',
    status: 'documents_submitted'
  },
  {
    number: 5,
    title: '강사 계약서 완료',
    description: '최종 계약 후 정식 강사로 활동을 시작합니다!',
    status: 'contract_completed'
  }
]

export default function InstructorApplyPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    privacyAgreed: false,
    name: '',
    field: '',
    revenue: '',
    bio: '',
    photoUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    kakaoUrl: '',
    preferredContactTime: ''
  })

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchApplication()
    } else if (authStatus === 'unauthenticated') {
      setLoading(false)
    }
  }, [authStatus])

  const fetchApplication = async () => {
    try {
      const res = await fetch('/api/instructor-apply')
      const data = await res.json()
      if (data.success) {
        setApplication(data.application)
        setUserRole(data.userRole)
        if (data.application && data.application.status !== 'rejected') {
          // 이미 신청한 경우 상태 페이지로 리다이렉트
          router.push('/instructor-apply/status')
        }
      }
    } catch (error) {
      console.error('신청 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'instructor-applications')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await res.json()
      if (data.success || data.url) {
        setFormData(prev => ({ ...prev, photoUrl: data.url }))
      } else {
        alert('업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('업로드 실패:', error)
      alert('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.privacyAgreed) {
      alert('개인정보 보호 정책에 동의해주세요.')
      return
    }

    if (!formData.name || !formData.field || !formData.bio) {
      alert('이름, 분야, 자기소개는 필수 항목입니다.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/instructor-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        alert('강사 신청이 완료되었습니다!')
        router.push('/instructor-apply/status')
      } else {
        alert(data.error || '신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('신청 실패:', error)
      alert('신청 중 오류가 발생했습니다.')
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

  // 이미 강사인 경우
  if (userRole === 'instructor') {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">이미 강사로 활동 중입니다!</h1>
            <p className="text-green-700 mb-6">강사 대시보드에서 강의를 관리해보세요.</p>
            <Link
              href="/instructor"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              강사 대시보드 바로가기
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      {/* 히어로 섹션 */}
      <section className="relative text-white py-24">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80)' }}
        >
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4">
          {/* 90% 수익 배분 강조 */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-black px-6 py-3 rounded-full text-lg font-bold mb-6 animate-pulse shadow-2xl">
              업계 최고 수익 배분
            </div>

            <div className="mb-8">
              <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 drop-shadow-2xl leading-none">
                90%
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-300 mt-2">
                강사 수익
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-yellow-400/50 rounded-2xl p-6 max-w-2xl mx-auto mb-8">
              <p className="text-lg sm:text-xl text-white font-medium">
                "본 계약의 정산 비율은<br className="sm:hidden" />
                <span className="text-yellow-300 font-bold text-xl sm:text-2xl"> 강사 90% </span> /
                <span className="text-gray-300"> 회사 10%</span> 로 합니다."
              </p>
            </div>

            <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
              바이브클래스 강사 모집
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              당신의 전문성을<br />
              <span className="text-white">
                세상과 나누세요
              </span>
            </h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
              바이브클래스는 진심으로 강사님들을 케어합니다.<br />
              분야별 전문가를 모시고, 함께 성장하는 교육 플랫폼입니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gradient-to-br from-yellow-400/30 to-yellow-600/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-yellow-400/30">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2 text-yellow-300">강사 90% 수익</h3>
              <p className="text-gray-200 text-sm">업계 최고 수준의 수익 배분율</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
              <div className="text-5xl mb-4">📹</div>
              <h3 className="text-xl font-bold mb-2">전문 촬영/편집 지원</h3>
              <p className="text-gray-200 text-sm">유튜브 편집권한 제공 및 콘텐츠 제작 지원</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">마케팅 & 홍보</h3>
              <p className="text-gray-200 text-sm">강의 홍보와 수강생 모집을 함께 진행합니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* 신청 단계 설명 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">강사 신청 프로세스</h2>
            <p className="text-gray-600">단계별로 진행 상황을 확인하실 수 있습니다</p>
          </div>

          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className="flex items-start gap-4 bg-white rounded-xl p-6 border shadow-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 신청 폼 섹션 */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">강사 신청하기</h2>
            <p className="text-gray-600">아래 정보를 입력하여 강사로 지원해주세요</p>
          </div>

          {!session ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">로그인이 필요합니다</h3>
              <p className="text-yellow-700 mb-6">바이브클래스 회원으로 가입 후 강사 신청이 가능합니다.</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                로그인 / 회원가입
              </Link>
            </div>
          ) : !showForm ? (
            <div className="text-center">
              <button
                onClick={() => setShowForm(true)}
                className="px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
              >
                강사 신청 시작하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border shadow-sm p-8">
              {/* 개인정보 동의 */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacyAgreed}
                    onChange={(e) => setFormData({ ...formData, privacyAgreed: e.target.checked })}
                    className="mt-1 w-5 h-5 text-gray-900 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold text-red-500">[필수]</span>{' '}
                    개인정보 수집 및 이용에 동의합니다. 강사 신청을 위해 입력하신 정보는 심사 및
                    계약 목적으로만 사용되며, 관련 법령에 따라 안전하게 보관됩니다.
                  </span>
                </label>
              </div>

              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="실명을 입력해주세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전문 분야 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.field}
                      onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="예: AI, 마케팅, 디자인 등"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    매출/실적
                  </label>
                  <input
                    type="text"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="예: 월 매출 1억, 구독자 10만명 등"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자기소개 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="본인의 경력, 전문성, 강의 경험 등을 자유롭게 작성해주세요"
                  />
                </div>

                {/* 프로필 사진 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프로필 사진
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.photoUrl ? (
                      <div className="relative">
                        <img
                          src={formData.photoUrl}
                          alt="프로필"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: '' })}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {uploading ? '업로드 중...' : '사진 선택'}
                    </button>
                  </div>
                </div>

                {/* SNS 링크 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">SNS 링크 (선택)</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">인스타그램</label>
                      <input
                        type="url"
                        value={formData.instagramUrl}
                        onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">유튜브</label>
                      <input
                        type="url"
                        value={formData.youtubeUrl}
                        onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">카카오톡 오픈채팅</label>
                      <input
                        type="url"
                        value={formData.kakaoUrl}
                        onChange={(e) => setFormData({ ...formData, kakaoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="https://open.kakao.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락하기 편한 시간
                  </label>
                  <input
                    type="text"
                    value={formData.preferredContactTime}
                    onChange={(e) => setFormData({ ...formData, preferredContactTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="예: 평일 오후 2시-6시"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
                >
                  {submitting ? '신청 중...' : '강사 신청하기'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </CustomerLayout>
  )
}
