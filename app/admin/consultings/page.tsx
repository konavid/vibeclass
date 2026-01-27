'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const EmailEditor = dynamic(() => import('@/components/admin/EmailEditor'), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">에디터 로딩 중...</div>
})

export default function ConsultingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [useTemplate, setUseTemplate] = useState(true)
  const [greeting, setGreeting] = useState('안녕하세요, 바이브클래스입니다.')
  const [closing, setClosing] = useState('감사합니다.')
  const [includeUnsubscribe, setIncludeUnsubscribe] = useState(false)

  // ABC 스튜디오 이메일 주소
  const ABC_STUDIO_EMAIL = 'contact@abcstudio.com'

  // 권한 체크
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
    }
  }, [session, status, router])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // 템플릿 적용
    let finalContent = content
    if (useTemplate) {
      const unsubscribeLink = includeUnsubscribe
        ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
             <p style="color: #6b7280; font-size: 12px; margin: 0;">
               이메일 수신을 원하지 않으시면
               <a href="mailto:hi@vibeclass.kr?subject=수신거부" style="color: #3b82f6; text-decoration: underline;">여기</a>를 클릭하세요.
             </p>
           </div>`
        : ''

      finalContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- 로고 -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://vibeclass.kr/uploads/image/logo/fulllogo_transparent.png" alt="바이브클래스" style="height: 50px; width: auto;" />
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #1f2937; margin: 0;">${greeting}</p>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            ${content}
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px;">
            <p style="font-size: 16px; color: #1f2937; margin: 0;">${closing}</p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 10px; margin-bottom: 0;">바이브클래스 드림</p>
          </div>

          <!-- 홈페이지 링크 -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              <a href="https://vibeclass.kr" style="color: #3b82f6; text-decoration: none; font-weight: 500;">vibeclass.kr</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              AI 교육의 새로운 기준, 바이브클래스
            </p>
          </div>

          ${unsubscribeLink}
        </div>
      `
    }

    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType: 'direct',
          directEmails: ABC_STUDIO_EMAIL,
          subject,
          html: finalContent,
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'ABC 스튜디오에 이메일이 발송되었습니다.' })
        setSubject('')
        setContent('')
      } else {
        setMessage({ type: 'error', text: data.error || '이메일 발송에 실패했습니다' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '이메일 발송에 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="p-8 text-center">로딩 중...</div>
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">컨설팅</h1>
          <p className="text-gray-600 mt-2">ABC 스튜디오에 이메일을 발송합니다</p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="font-semibold">{message.text}</div>
          </div>
        )}

        <form onSubmit={handleSendEmail} className="bg-white rounded-lg shadow-md p-6">
          {/* 수신자 정보 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수신자
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-medium">ABC 스튜디오</span>
              <span className="text-gray-500">({ABC_STUDIO_EMAIL})</span>
            </div>
          </div>

          {/* 템플릿 사용 여부 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">템플릿 사용</span>
              </label>
            </div>

            {useTemplate && (
              <div className="space-y-3 mt-4">
                {/* 인사말 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    인사말
                  </label>
                  <input
                    type="text"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="예: 안녕하세요, 바이브클래스입니다."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                  />
                </div>

                {/* 종료인사 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    종료인사
                  </label>
                  <input
                    type="text"
                    value={closing}
                    onChange={(e) => setClosing(e.target.value)}
                    placeholder="예: 감사합니다."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                  />
                </div>

                {/* 수신거부 링크 */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeUnsubscribe}
                      onChange={(e) => setIncludeUnsubscribe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-700">수신거부 링크 포함</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 이메일 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 제목
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="이메일 제목을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>

          {/* 이메일 내용 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 내용
            </label>
            <EmailEditor content={content} onChange={setContent} />
            <p className="text-xs text-gray-500 mt-2">
              에디터를 사용하여 이메일 내용을 작성하세요. HTML로 자동 변환됩니다.
            </p>
          </div>

          {/* 발송 버튼 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '발송 중...' : 'ABC 스튜디오에 이메일 발송'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
