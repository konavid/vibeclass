'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface Post {
  id: number
  title: string
  content: string
  isNotice: boolean
  viewCount: number
  createdAt: string
  user: {
    id: number
    name: string
    nickname: string | null
    image: string | null
    role: string
  }
  _count: {
    comments: number
  }
}

interface Schedule {
  id: number
  cohort: number
  courseTitle: string
}

export default function CohortBoardPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = parseInt(params.scheduleId as string)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [notices, setNotices] = useState<Post[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [scheduleId, page])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cohort-board/posts?scheduleId=${scheduleId}&page=${page}`)
      const data = await res.json()

      if (res.ok) {
        setSchedule(data.schedule)
        setNotices(data.notices)
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
        setIsStaff(data.isStaff)
        setError(null)
      } else {
        setError(data.error || '게시판을 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('게시판을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return '방금 전'
    if (hours < 24) return `${hours}시간 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  if (loading) {
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
            <span>기수 게시판</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {schedule?.courseTitle} {schedule?.cohort}기 게시판
          </h1>
          <p className="mt-1 text-gray-600">같은 기수 수강생들과 소통하세요</p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 글쓰기 버튼 */}
          <div className="flex justify-end mb-4">
            <Link
              href={`/my/board/${scheduleId}/write`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              글쓰기
            </Link>
          </div>

          {/* 공지사항 */}
          {notices.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-4">
              {notices.map((post) => (
                <Link
                  key={post.id}
                  href={`/my/board/${scheduleId}/${post.id}`}
                  className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded mr-3">
                    공지
                  </span>
                  <span className="flex-1 font-medium text-gray-900 truncate">
                    {post.title}
                  </span>
                  {post._count.comments > 0 && (
                    <span className="text-sm text-indigo-600 mr-3">[{post._count.comments}]</span>
                  )}
                  <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}

          {/* 게시글 목록 */}
          <div className="bg-white rounded-lg shadow">
            {posts.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                아직 작성된 글이 없습니다.
                <br />
                첫 번째 글을 작성해보세요!
              </div>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/my/board/${scheduleId}/${post.id}`}
                  className="flex items-center px-4 py-4 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{post.title}</span>
                      {post._count.comments > 0 && (
                        <span className="text-sm text-indigo-600">[{post._count.comments}]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>{post.user.nickname || post.user.name}</span>
                      <span>·</span>
                      <span>조회 {post.viewCount}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 ml-4">{formatDate(post.createdAt)}</span>
                </Link>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                  이전
                </button>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 border rounded ${
                    p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              {page < totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                  다음
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
