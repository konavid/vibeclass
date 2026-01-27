'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function LoginModal() {
  const { isLoginModalOpen, callbackUrl, closeLoginModal } = useAuthModal()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLoginModal()
      }
    }
    if (isLoginModalOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isLoginModalOpen, closeLoginModal])

  const handleKakaoSignIn = () => {
    setIsLoggingIn(true)
    signIn('kakao', { callbackUrl })
  }

  if (!isLoginModalOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeLoginModal}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 닫기 버튼 */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          aria-label="닫기"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 상단 장식 */}
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400" />

        {/* 컨텐츠 */}
        <div className="px-8 py-10">
          {/* 로고 & 타이틀 */}
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="바이브 클래스"
              className="h-12 w-auto mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              로그인
            </h2>
            <p className="text-gray-500">
              카카오 계정으로 간편하게 시작하세요
            </p>
          </div>

          {/* 카카오 로그인 버튼 */}
          <button
            onClick={handleKakaoSignIn}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] hover:bg-[#FDD800] disabled:bg-[#FEE500]/70 text-gray-900 font-semibold rounded-2xl transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoggingIn ? (
              <>
                <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>연결 중...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.5 3 2 6.58 2 11c0 2.89 1.86 5.44 4.64 7.03-.18.64-.67 2.38-.77 2.75-.13.5.18.5.38.36.16-.11 2.48-1.67 3.44-2.32.75.14 1.54.21 2.31.21 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
                </svg>
                <span>카카오로 시작하기</span>
              </>
            )}
          </button>

          {/* 안내 문구 */}
          <p className="text-center text-sm text-gray-400 mt-6">
            카카오 계정으로 로그인하면 자동으로 회원가입됩니다
          </p>

          {/* 카카오톡 채널 안내 - 비활성화
          <a
            href="http://pf.kakao.com/_iFVpn"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.5 3 2 6.58 2 11c0 2.89 1.86 5.44 4.64 7.03-.18.64-.67 2.38-.77 2.75-.13.5.18.5.38.36.16-.11 2.48-1.67 3.44-2.32.75.14 1.54.21 2.31.21 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">바이브 클래스 카카오톡 채널 추가하기</p>
                <p className="text-xs text-gray-500">강의 알림, 이벤트 소식을 받아보세요!</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
          */}
        </div>
      </div>
    </div>
  )
}
