'use client'

import CustomerLayout from '@/components/customer/CustomerLayout'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: number
  email: string
  name: string
  nickname: string | null
  phone: string | null
  image: string | null
  marketingConsent: boolean
  termsAgreed: boolean
  privacyAgreed: boolean
}

export default function MyProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [originalPhone, setOriginalPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerified, setIsVerified] = useState(true) // 초기에는 인증된 상태
  const [codeSending, setCodeSending] = useState(false)
  const [codeVerifying, setCodeVerifying] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my/profile')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setName(data.name || '')
        setEmail(data.email || '')
        setNickname(data.nickname || '')
        setPhone(data.phone || '')
        setOriginalPhone(data.phone || '')
        setMarketingConsent(data.marketingConsent)
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error)
    }
  }

  // 인증번호 타이머
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(remainingTime - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [remainingTime])

  // 연락처 변경 감지
  const handlePhoneChange = (value: string) => {
    setPhone(value)
    // 연락처가 원래 번호와 다르면 인증 필요
    if (value !== originalPhone) {
      setIsVerified(false)
      setIsCodeSent(false)
      setVerificationCode('')
    } else {
      // 원래 번호로 돌아오면 인증된 상태
      setIsVerified(true)
      setIsCodeSent(false)
      setVerificationCode('')
    }
  }

  // 인증번호 발송
  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError('연락처를 입력해주세요')
      return
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('010')) {
      setError('올바른 전화번호 형식이 아닙니다 (010으로 시작하는 11자리)')
      return
    }

    setCodeSending(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsCodeSent(true)
        setRemainingTime(300) // 5분
        alert('인증번호가 발송되었습니다')
      } else {
        setError(data.error || '인증번호 발송에 실패했습니다')
      }
    } catch (error) {
      console.error('인증번호 발송 오류:', error)
      setError('인증번호 발송에 실패했습니다')
    } finally {
      setCodeSending(false)
    }
  }

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('인증번호를 입력해주세요')
      return
    }

    setCodeVerifying(true)
    setError('')

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: verificationCode
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsVerified(true)
        setRemainingTime(0)
        alert('인증되었습니다')
      } else {
        setError(data.error || '인증에 실패했습니다')
      }
    } catch (error) {
      console.error('인증 확인 오류:', error)
      setError('인증에 실패했습니다')
    } finally {
      setCodeVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('이름을 입력해주세요')
      return
    }

    if (!email.trim()) {
      setError('이메일을 입력해주세요')
      return
    }

    if (!nickname.trim()) {
      setError('별명을 입력해주세요')
      return
    }

    if (!phone.trim()) {
      setError('연락처를 입력해주세요')
      return
    }

    // 연락처가 변경되었는데 인증하지 않은 경우
    if (phone !== originalPhone && !isVerified) {
      setError('변경된 연락처 인증을 완료해주세요')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          nickname,
          phone,
          marketingConsent,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setProfile(data)
        setOriginalPhone(phone) // 저장 성공 시 원래 번호 업데이트
        setIsVerified(true) // 저장 후 인증 상태 유지
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || '프로필 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('프로필 수정 실패:', error)
      setError('프로필 수정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('정말로 회원 탈퇴하시겠습니까?\n\n탈퇴 후 계정이 비활성화되며, 진행 중인 강의가 있는 경우 탈퇴가 제한될 수 있습니다.')) {
      return
    }

    setDeactivateLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users/deactivate', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message || '회원 탈퇴가 완료되었습니다.')
        // 로그아웃 후 홈으로 이동
        window.location.href = '/'
      } else {
        setError(data.error || '회원 탈퇴에 실패했습니다')
        if (data.details) {
          alert(data.details)
        }
      }
    } catch (error) {
      console.error('회원 탈퇴 오류:', error)
      setError('회원 탈퇴에 실패했습니다')
    } finally {
      setDeactivateLoading(false)
      setShowDeactivateModal(false)
    }
  }

  if (status === 'loading' || !profile) {
    return (
      <CustomerLayout>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3">
            내 프로필
          </h1>
          <p className="text-lg text-gray-600">
            프로필 정보를 수정할 수 있습니다
          </p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  {profile.image && (
                    <img
                      src={profile.image}
                      alt="Profile"
                      className="w-20 h-20 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">
                      카카오 계정으로 로그인됨
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      아래 정보를 입력해주세요
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    이름 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="실명을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    이메일 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="nickname"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    별명 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="사용하실 별명을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    연락처 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        handlePhoneChange(value)
                      }}
                      placeholder="01000000000"
                      disabled={isVerified && phone === originalPhone}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100"
                      required
                    />
                    {phone !== originalPhone && (
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={codeSending || isVerified || phone.length !== 11}
                        className="px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {codeSending ? '발송중...' : isVerified ? '인증완료' : isCodeSent ? '재발송' : '인증번호'}
                      </button>
                    )}
                  </div>
                  {phone !== originalPhone && !isVerified && (
                    <p className="text-xs text-orange-600 mt-1">
                      연락처가 변경되었습니다. 인증을 완료해주세요.
                    </p>
                  )}
                  {isVerified && phone !== originalPhone && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      인증이 완료되었습니다
                    </p>
                  )}
                </div>

                {isCodeSent && !isVerified && phone !== originalPhone && (
                  <div className="mb-6">
                    <label
                      htmlFor="verificationCode"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      인증번호 <span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                          setVerificationCode(value)
                        }}
                        placeholder="6자리 숫자"
                        maxLength={6}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors text-gray-900 placeholder:text-gray-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={codeVerifying || verificationCode.length !== 6}
                        className="px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {codeVerifying ? '확인중...' : '확인'}
                      </button>
                    </div>
                    {remainingTime > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        남은 시간: {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  약관 및 동의 현황
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">[필수]</span>{' '}
                      이용약관
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      동의함
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">[필수]</span>{' '}
                      개인정보 수집 및 이용
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      동의함
                    </span>
                  </div>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="text-sm text-gray-700">
                      <span className="font-normal text-gray-600">[선택]</span>{' '}
                      마케팅 정보 수신
                    </span>
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="w-5 h-5 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-900"
                    />
                  </label>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ 프로필이 성공적으로 수정되었습니다
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '저장 중...' : '프로필 저장'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>

            {/* 회원탈퇴 섹션 */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                회원 탈퇴
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                회원 탈퇴 시 계정이 비활성화되며, 진행 중인 강의가 있는 경우 탈퇴가 제한될 수 있습니다.
                탈퇴 후에도 데이터는 일정 기간 보관됩니다.
              </p>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                disabled={deactivateLoading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              정말 탈퇴하시겠습니까?
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                ⚠️ 탈퇴 후 계정이 비활성화되며, 로그인할 수 없습니다.
              </p>
              <p className="text-sm text-gray-600">
                📚 진행 중인 강의가 있는 경우 탈퇴가 제한됩니다.
              </p>
              <p className="text-sm text-gray-600">
                💾 데이터는 일정 기간 보관되며, 완전 삭제를 원하시면 고객센터로 문의해주세요.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeactivate}
                disabled={deactivateLoading}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deactivateLoading ? '처리 중...' : '탈퇴하기'}
              </button>
              <button
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivateLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}
