'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

export default function WriteBoardPostPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = parseInt(params.scheduleId as string)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isNotice, setIsNotice] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scheduleInfo, setScheduleInfo] = useState<{ courseTitle: string; cohort: number } | null>(null)

  useEffect(() => {
    checkAccess()
  }, [scheduleId])

  const checkAccess = async () => {
    try {
      const res = await fetch(`/api/cohort-board/posts?scheduleId=${scheduleId}&limit=1`)
      const data = await res.json()

      if (res.ok) {
        setScheduleInfo(data.schedule)
        setIsStaff(data.isStaff)
        setError(null)
      } else {
        setError(data.error || '접근 권한이 없습니다.')
      }
    } catch (err) {
      setError('권한을 확인하는 중 오류가 발생했습니다.')
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/cohort-board/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          title: title.trim(),
          content: content.trim(),
          isNotice: isStaff ? isNotice : false
        })
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/my/board/${scheduleId}/${data.post.id}`)
      } else {
        alert(data.error || '글 작성에 실패했습니다.')
      }
    } catch (err) {
      alert('글 작성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </CustomerLayout>
    )
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <Link
              href="/my/enrollments"
              className="mt-4 inline-block text-indigo-600 hover:underline"
            >
              내 구매 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/my/enrollments" className="hover:text-indigo-600">내 구매 목록</Link>
            <span>/</span>
            <Link href={`/my/board/${scheduleId}`} className="hover:text-indigo-600">기수 게시판</Link>
            <span>/</span>
            <span>글쓰기</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            글쓰기
          </h1>
          <p className="mt-1 text-gray-600">
            {scheduleInfo?.courseTitle} {scheduleInfo?.cohort}기 게시판
          </p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            {isStaff && (
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isNotice}
                    onChange={(e) => setIsNotice(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">공지사항으로 등록</span>
                </label>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="제목을 입력하세요"
                maxLength={100}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="내용을 입력하세요"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href={`/my/board/${scheduleId}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
              >
                {loading ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </CustomerLayout>
  )
}
