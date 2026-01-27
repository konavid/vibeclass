'use client'

import { useState } from 'react'
import { siteConfig, getFullUrl } from '@/lib/config'

interface CourseShareButtonProps {
  courseId: number
  courseTitle: string
}

export default function CourseShareButton({ courseId, courseTitle }: CourseShareButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const courseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/courses/${courseId}`
    : getFullUrl(`/courses/${courseId}`)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(courseUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = courseUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleKakaoShare = () => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      const Kakao = (window as any).Kakao
      if (!Kakao.isInitialized()) {
        Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '')
      }
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: courseTitle,
          description: siteConfig.description,
          imageUrl: getFullUrl(siteConfig.ogImage),
          link: {
            mobileWebUrl: courseUrl,
            webUrl: courseUrl,
          },
        },
        buttons: [
          {
            title: '강의 보기',
            link: {
              mobileWebUrl: courseUrl,
              webUrl: courseUrl,
            },
          },
        ],
      })
    } else {
      // Kakao SDK가 없으면 URL 공유
      window.open(`https://story.kakao.com/share?url=${encodeURIComponent(courseUrl)}`, '_blank')
    }
  }

  const handleTwitterShare = () => {
    const text = `${courseTitle} - AI 수익화 교육`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(courseUrl)}`, '_blank')
  }

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseUrl)}`, '_blank')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: courseTitle,
          text: `${courseTitle} - AI 수익화 교육`,
          url: courseUrl,
        })
      } catch (err) {
        // 사용자가 취소했거나 오류
      }
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        이 강의 퍼가기
      </button>

      {/* 공유 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">이 강의 퍼가기</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* 링크 복사 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">링크 복사</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={courseUrl}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
              </div>

              {/* SNS 공유 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">SNS로 공유</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleKakaoShare}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">카카오톡</span>
                  </button>

                  <button
                    onClick={handleFacebookShare}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">페이스북</span>
                  </button>

                  <button
                    onClick={handleTwitterShare}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">X (트위터)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
