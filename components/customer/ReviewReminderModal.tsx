'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface PendingReview {
  enrollmentId: number
  courseId: number
  courseTitle: string
  thumbnailUrl: string | null
  instructorName: string
  instructorImage: string | null
  cohort: number
  endDate: string
}

// 간단한 후기 문구 선택지
const quickPhrases = [
  { id: 1, text: '강의 내용이 실무에 바로 적용할 수 있어서 좋았어요!' },
  { id: 2, text: '강사님의 설명이 쉽고 이해하기 좋았습니다.' },
  { id: 3, text: '체계적인 커리큘럼 덕분에 많이 배웠습니다.' },
  { id: 4, text: '질문에 친절하게 답변해주셔서 감사합니다.' },
  { id: 5, text: '기대 이상으로 만족스러운 강의였어요!' },
  { id: 6, text: '초보자도 따라하기 쉬운 강의입니다.' },
  { id: 7, text: '다음 강의도 꼭 듣고 싶어요!' },
  { id: 8, text: '시간 가는 줄 모르고 재미있게 들었습니다.' },
]

export default function ReviewReminderModal() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [selectedPhrases, setSelectedPhrases] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 로그인 시 후기 확인
  useEffect(() => {
    if (status === 'authenticated') {
      checkPendingReviews()
    }
  }, [status])

  const checkPendingReviews = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/my/pending-reviews')
      const data = await res.json()

      if (data.success && data.pendingReviews.length > 0) {
        setPendingReviews(data.pendingReviews)
        // 후기를 안 쓴 강의가 있으면 항상 모달 표시
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Failed to check pending reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhraseToggle = (phraseId: number) => {
    setSelectedPhrases(prev => {
      if (prev.includes(phraseId)) {
        return prev.filter(id => id !== phraseId)
      }
      return [...prev, phraseId]
    })
  }

  const handleSubmit = async () => {
    const currentReview = pendingReviews[currentIndex]
    if (!currentReview) return

    // 선택된 문구들 + 직접 작성한 내용 합치기
    const selectedTexts = selectedPhrases.map(id =>
      quickPhrases.find(p => p.id === id)?.text || ''
    ).filter(Boolean)

    const finalContent = [...selectedTexts, content].filter(Boolean).join(' ')

    if (!finalContent.trim()) {
      alert('후기 내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: currentReview.courseId,
          rating,
          content: finalContent,
          cohort: currentReview.cohort,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // 다음 후기로 이동하거나 모달 닫기
        if (currentIndex < pendingReviews.length - 1) {
          setCurrentIndex(prev => prev + 1)
          setRating(5)
          setContent('')
          setSelectedPhrases([])
        } else {
          setIsOpen(false)
          // 모든 후기 작성 완료
        }
      } else {
        alert(data.error || '후기 등록에 실패했습니다.')
      }
    } catch (error) {
      alert('후기 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = () => {
    setIsOpen(false)
    // 닫아도 다음 페이지 이동 시 다시 표시됨
  }

  const handleSkip = () => {
    if (currentIndex < pendingReviews.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setRating(5)
      setContent('')
      setSelectedPhrases([])
    } else {
      handleDismiss()
    }
  }

  if (!isOpen || isLoading || pendingReviews.length === 0) return null

  const currentReview = pendingReviews[currentIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* 헤더 */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">수강 후기를 남겨주세요!</h2>
              <p className="text-white/80 text-sm mt-0.5">
                {pendingReviews.length > 1
                  ? `${currentIndex + 1}/${pendingReviews.length}개의 강의 후기가 기다리고 있어요`
                  : '소중한 후기가 다른 수강생에게 큰 도움이 됩니다'}
              </p>
            </div>
          </div>
        </div>

        {/* 강의 정보 */}
        <div className="p-5 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {currentReview.thumbnailUrl ? (
                <img src={currentReview.thumbnailUrl} alt={currentReview.courseTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 line-clamp-1">{currentReview.courseTitle}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span>{currentReview.instructorName}</span>
                <span className="text-gray-300">|</span>
                <span>{currentReview.cohort}기</span>
              </div>
            </div>
          </div>
        </div>

        {/* 별점 */}
        <div className="p-5 border-b">
          <label className="block text-sm font-semibold text-gray-700 mb-3">만족도를 선택해주세요</label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <svg
                  className={`w-10 h-10 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* 간단 문구 선택 */}
        <div className="p-5 border-b bg-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-3">간단히 선택해주세요 (복수 선택 가능)</label>
          <div className="flex flex-wrap gap-2">
            {quickPhrases.map((phrase) => (
              <button
                key={phrase.id}
                onClick={() => handlePhraseToggle(phrase.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedPhrases.includes(phrase.id)
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {phrase.text.length > 20 ? phrase.text.substring(0, 20) + '...' : phrase.text}
              </button>
            ))}
          </div>
        </div>

        {/* 추가 내용 입력 */}
        <div className="p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">추가로 하고 싶은 말 (선택)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="강의에 대한 솔직한 후기를 남겨주세요..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            rows={3}
          />
        </div>

        {/* 버튼 */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            {currentIndex < pendingReviews.length - 1 ? '다음에 하기' : '닫기'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedPhrases.length === 0 && !content.trim())}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {isSubmitting ? '등록 중...' : '후기 등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
