'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useSession } from 'next-auth/react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const { openLoginModal } = useAuthModal()
  const { status } = useSession()

  useEffect(() => {
    // 이미 로그인된 경우 callbackUrl로 이동
    if (status === 'authenticated') {
      router.replace(callbackUrl)
      return
    }

    // 로그인 모달 열기
    if (status === 'unauthenticated') {
      openLoginModal(callbackUrl)
      // 홈으로 이동 (모달은 열린 상태로 유지)
      router.replace('/')
    }
  }, [status, callbackUrl, openLoginModal, router])

  // 로딩 중 표시
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
