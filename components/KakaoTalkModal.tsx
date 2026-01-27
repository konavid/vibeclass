'use client'

import { useState, useEffect } from 'react'

interface KakaoTalkModalProps {
  kakaoTalkLink: string
  cohort: number
  courseId: number
  isFree?: boolean
}

export default function KakaoTalkModal({ kakaoTalkLink, cohort, courseId, isFree = false }: KakaoTalkModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const storageKey = `kakao_modal_hidden_${courseId}_${cohort}`

  useEffect(() => {
    // 오늘 하루 안 보기 체크
    const hiddenUntil = localStorage.getItem(storageKey)
    if (hiddenUntil) {
      const hiddenDate = new Date(hiddenUntil)
      const now = new Date()
      if (now < hiddenDate) {
        return // 아직 숨김 기간 중
      }
    }
    // 약간의 딜레이 후 모달 표시
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [storageKey])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleHideToday = () => {
    // 오늘 자정까지 숨기기
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    localStorage.setItem(storageKey, tomorrow.toISOString())
    setIsOpen(false)
  }

  const handleJoin = () => {
    window.open(kakaoTalkLink, '_blank')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* 상단 노란색 헤더 */}
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 p-8 text-center">
          <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg className="w-12 h-12 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z"/>
            </svg>
          </div>
          {isFree ? (
            <>
              <p className="text-sm font-medium text-gray-900/70 mb-1">
                무료 강의
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900">
                무료로 강의 정보 받기
              </h2>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900/70 mb-1">
                {cohort}기 수강생 전용
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900">
                카카오톡 단톡방
              </h2>
            </>
          )}
        </div>

        {/* 본문 */}
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            {isFree ? (
              <>카카오톡 오픈채팅방에서<br />무료 강의 정보를 받아보세요!</>
            ) : (
              <>수강생 전용 카카오톡 오픈채팅방에<br />참여하여 함께 소통하세요!</>
            )}
          </p>

          {/* 버튼들 */}
          <button
            onClick={handleJoin}
            className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg rounded-xl transition-colors mb-3 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z"/>
            </svg>
            {isFree ? '무료로 강의 정보 받기' : '카카오톡방 입장하기'}
          </button>

          <button
            onClick={handleClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>

        {/* 오늘 하루 안 보기 */}
        <div className="border-t px-6 py-4">
          <button
            onClick={handleHideToday}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            오늘 하루 안 보기
          </button>
        </div>
      </div>
    </div>
  )
}
