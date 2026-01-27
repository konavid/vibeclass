'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()

  const handleKakaoLogin = () => {
    signIn('kakao', { callbackUrl: '/admin' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">뒤로가기</span>
        </button>
        <h1 className="text-center text-3xl font-bold text-gray-900">
          관리자 로그인
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          관리자 계정으로 로그인하세요
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <button
            onClick={handleKakaoLogin}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-md shadow-sm text-sm font-medium text-[#191919] bg-[#FEE500] hover:bg-[#FDD800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 2.5C5.30558 2.5 1.5 5.52428 1.5 9.22222C1.5 11.6214 3.07462 13.7289 5.47037 14.9348L4.53703 18.1481C4.46296 18.4074 4.75926 18.6111 4.98148 18.463L8.7037 15.8889C9.12963 15.9259 9.56296 15.9444 10 15.9444C14.6944 15.9444 18.5 12.9201 18.5 9.22222C18.5 5.52428 14.6944 2.5 10 2.5Z" fill="#191919"/>
            </svg>
            카카오로 로그인
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  관리자 전용 페이지입니다
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-gray-500">
              관리자 권한이 있는 카카오 계정으로 로그인하세요.
              <br />
              권한이 없으면 접근이 제한됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
