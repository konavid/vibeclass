'use client'
import { Suspense } from 'react'

import CustomerLayout from '@/components/customer/CustomerLayout'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Section from '@/components/ui/Section'

function RegisterContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [codeVerifying, setCodeVerifying] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const [termsAgreed, setTermsAgreed] = useState(true)
  const [privacyAgreed, setPrivacyAgreed] = useState(true)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    nickname: '',
    phone: '',
    verification: '',
    terms: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/register`)
      return
    }

    if (status === 'authenticated' && session?.user) {
      // 이미 프로필이 완성된 경우 리다이렉트
      if ((session.user as any).profileCompleted) {
        router.push(callbackUrl)
        return
      }

      // 카카오에서 가져온 정보 자동 입력 (한 번만)
      if (!initialized) {
        if (session.user.name) {
          setName(session.user.name)
          setNickname(session.user.name)
        }
        if (session.user.email) {
          // 임시 이메일인지 확인
          const isTempEmail = session.user.email.includes('@temp.vibeclass.kr')
          if (!isTempEmail) {
            setEmail(session.user.email)
          }
          // 임시 이메일이면 비워두고 사용자가 입력하도록 함
        }
        setInitialized(true)
      }
    }
  }, [status, session?.user?.profileCompleted, router, callbackUrl])

  // 인증번호 타이머
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(remainingTime - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [remainingTime])

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

  // 실시간 검증 함수들
  const validateName = (value: string) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, name: '이름을 입력해주세요' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, name: '' }))
    return true
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, email: '이메일을 입력해주세요' }))
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setFieldErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, email: '' }))
    return true
  }

  const validateNickname = (value: string) => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, nickname: '별명을 입력해주세요' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, nickname: '' }))
    return true
  }

  const validatePhone = (value: string) => {
    if (!value.trim()) {
      // 선택항목으로 변경
      setFieldErrors(prev => ({ ...prev, phone: '' }))
      return true
    }
    const cleanPhone = value.replace(/[^0-9]/g, '')
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('010')) {
      setFieldErrors(prev => ({ ...prev, phone: '010으로 시작하는 11자리 번호를 입력해주세요' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, phone: '' }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 모든 필드 검증
    const isNameValid = validateName(name)
    const isEmailValid = validateEmail(email)
    const isNicknameValid = validateNickname(nickname)
    const isPhoneValid = validatePhone(phone)

    if (!termsAgreed || !privacyAgreed) {
      setFieldErrors(prev => ({ ...prev, terms: '필수 약관에 동의해주세요' }))
      setError('필수 약관에 동의해주세요')
      return
    } else {
      setFieldErrors(prev => ({ ...prev, terms: '' }))
    }

    if (phone.trim() && !isVerified) {
      setFieldErrors(prev => ({ ...prev, verification: '전화번호를 입력한 경우 인증을 완료해주세요' }))
      setError('전화번호를 입력한 경우 인증을 완료해주세요')
      return
    } else {
      setFieldErrors(prev => ({ ...prev, verification: '' }))
    }

    if (!isNameValid || !isEmailValid || !isNicknameValid || !isPhoneValid) {
      setError('입력 정보를 확인해주세요')
      return
    }

    setLoading(true)
    setError('')
    setFieldErrors({ name: '', email: '', nickname: '', phone: '', verification: '', terms: '' })

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          nickname,
          phone,
          termsAgreed,
          privacyAgreed,
          marketingConsent,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // 세션 업데이트
        await update()
        alert('회원가입이 완료되었습니다!')
        // 세션이 완전히 업데이트되도록 페이지 새로고침
        window.location.href = callbackUrl
      } else {
        setError(data.error || '프로필 저장에 실패했습니다')
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error)
      setError('프로필 저장에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </CustomerLayout>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <CustomerLayout>
      <div className="bg-white min-h-screen">
        <Section background="white" padding="md" className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              바이브 클래스에 오신 것을 환영합니다
            </h1>
            <p className="text-base text-gray-600">
              몇 가지 정보만 입력하면 바로 시작할 수 있습니다
            </p>
          </div>

          <Card padding="lg">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
                  {session?.user?.image && (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {session?.user?.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {session?.user?.email}
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <Input
                    type="text"
                    id="name"
                    label="이름"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      validateName(e.target.value)
                    }}
                    onBlur={() => validateName(name)}
                    placeholder="실명을 입력하세요"
                    error={fieldErrors.name}
                    required
                  />
                </div>

                <div className="mb-5">
                  {session?.user?.email?.includes('@temp.vibeclass.kr') && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>카카오 로그인 시 이메일 제공에 동의하지 않으셨습니다. 강의 신청 및 중요 안내를 받으실 수 있도록 실제 이메일 주소를 입력해주세요.</span>
                      </p>
                    </div>
                  )}
                  <Input
                    type="email"
                    id="email"
                    label="이메일"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      validateEmail(e.target.value)
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder="example@email.com"
                    helperText={!fieldErrors.email ? "강의 신청 및 중요 정보 전달을 위해 정확한 이메일을 입력해주세요" : undefined}
                    error={fieldErrors.email}
                    required
                  />
                </div>

                <div className="mb-5">
                  <Input
                    type="text"
                    id="nickname"
                    label="별명"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value)
                      validateNickname(e.target.value)
                    }}
                    onBlur={() => validateNickname(nickname)}
                    placeholder="별명을 입력하세요"
                    error={fieldErrors.nickname}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 <span className="text-gray-400 text-xs font-normal ml-1">(선택)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setPhone(value)
                        setIsCodeSent(false)
                        setIsVerified(false)
                        setVerificationCode('')
                        validatePhone(value)
                      }}
                      onBlur={() => validatePhone(phone)}
                      placeholder="01012345678"
                      disabled={isVerified}
                      className={`flex-1 px-4 py-2 border rounded-lg text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors outline-none ${fieldErrors.phone
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      required
                    />
                    <Button
                      type="button"
                      onClick={handleSendCode}
                      disabled={codeSending || isVerified || phone.length !== 11}
                      variant={isVerified ? "secondary" : "primary"}
                      size="md"
                      className="whitespace-nowrap"
                    >
                      {codeSending ? '발송중...' : isVerified ? '인증완료' : isCodeSent ? '재발송' : '인증번호'}
                    </Button>
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                  )}
                  {!isVerified && !fieldErrors.phone && phone.length === 11 && !isCodeSent && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>오른쪽 '인증번호' 버튼을 클릭하여 SMS 인증을 진행해주세요!</span>
                      </p>
                    </div>
                  )}
                  {!isVerified && !fieldErrors.phone && phone.length === 11 && isCodeSent && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>문자로 받은 6자리 인증번호를 아래에 입력해주세요</span>
                      </p>
                    </div>
                  )}
                  {!isVerified && !fieldErrors.phone && phone.length !== 11 && (
                    <p className="text-xs text-gray-500 mt-1">
                      강의 신청 및 중요 정보 전달을 위해 정확한 연락처를 입력해주세요
                    </p>
                  )}
                  {isVerified && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      인증이 완료되었습니다
                    </p>
                  )}
                </div>

                {isCodeSent && !isVerified && (
                  <div className="mb-6">
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                      인증번호 <span className="text-red-500">*</span>
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
                          setFieldErrors(prev => ({ ...prev, verification: '' }))
                        }}
                        placeholder="6자리 숫자"
                        maxLength={6}
                        className={`flex-1 px-4 py-2 border rounded-lg text-gray-900 bg-white transition-colors outline-none ${fieldErrors.verification
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        required
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={codeVerifying || verificationCode.length !== 6}
                        variant="primary"
                        size="md"
                        className="whitespace-nowrap"
                      >
                        {codeVerifying ? '확인중...' : '확인'}
                      </Button>
                    </div>
                    {fieldErrors.verification && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.verification}</p>
                    )}
                    {remainingTime > 0 && !fieldErrors.verification && (
                      <p className="text-xs text-orange-600 mt-1">
                        남은 시간: {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <label className="flex items-start cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => {
                          setTermsAgreed(e.target.checked)
                          if (e.target.checked && privacyAgreed) {
                            setFieldErrors(prev => ({ ...prev, terms: '' }))
                          }
                        }}
                        className="mt-0.5 w-5 h-5 border border-gray-400 rounded focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                      />
                      <span className="ml-3 text-base text-gray-900">
                        이용약관에 동의합니다
                      </span>
                    </label>
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-sm text-gray-600 hover:text-gray-900 underline ml-2"
                    >
                      보기
                    </Link>
                  </div>

                  <div className="flex items-start">
                    <label className="flex items-start cursor-pointer group flex-1">
                      <input
                        type="checkbox"
                        checked={privacyAgreed}
                        onChange={(e) => {
                          setPrivacyAgreed(e.target.checked)
                          if (e.target.checked && termsAgreed) {
                            setFieldErrors(prev => ({ ...prev, terms: '' }))
                          }
                        }}
                        className="mt-0.5 w-5 h-5 border border-gray-400 rounded focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                      />
                      <span className="ml-3 text-base text-gray-900">
                        개인정보 수집 및 이용에 동의합니다
                      </span>
                    </label>
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-sm text-gray-600 hover:text-gray-900 underline ml-2"
                    >
                      보기
                    </Link>
                  </div>

                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 w-5 h-5 border border-gray-400 rounded focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                    />
                    <span className="ml-3 text-base text-gray-600">
                      마케팅 정보 수신 동의 (선택)
                    </span>
                  </label>
                </div>

                {fieldErrors.terms && (
                  <p className="text-xs text-red-600 mt-3">{fieldErrors.terms}</p>
                )}

                <div className="mt-6">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    수집 항목: 이메일, 이름, 별명, 연락처 / 수집 목적: 회원 관리, 교육 서비스 제공 / 보유 기간: 회원 탈퇴 시까지
                  </p>
                </div>
              </div>

              {error && (
                <Card padding="md" className="mb-6 bg-red-50 border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </Card>
              )}

              {!isVerified && phone.length === 11 && (
                <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                  <p className="text-sm text-orange-800 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>전화번호를 입력하신 경우 SMS 인증이 필수입니다!</span>
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !termsAgreed || !privacyAgreed || (phone.trim().length > 0 && !isVerified)}
                variant="primary"
                fullWidth
                size="lg"
              >
                {loading ? '처리 중...' : '회원가입 완료'}
              </Button>

              {!isVerified && (
                <p className="text-center text-sm text-gray-600 mt-3">
                  ※ 연락처 입력은 선택사항입니다
                </p>
              )}
            </form>
          </Card>
        </Section>
      </div>
    </CustomerLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  )
}
