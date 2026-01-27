'use client'

import { useState, useEffect } from 'react'

interface Review {
  id: number
  rating: number
  content: string
  isApproved: boolean
  isFeatured: boolean
  createdAt: string
  user: {
    name: string
    email: string
  }
  course: {
    title: string
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews')
      const data = await res.json()
      setReviews(data)
    } catch (error) {
      console.error('후기 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/approve`, {
        method: 'POST',
      })

      if (res.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('승인 실패:', error)
    }
  }

  const handleFeature = async (id: number, featured: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      })

      if (res.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('대표 설정 실패:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }

  if (loading) {
    return <div className="text-gray-600">로딩 중...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">후기 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          수강 후기를 승인하고 관리합니다
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 후기가 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <li key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {review.user.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {review.user.email}
                      </span>
                      {review.isApproved ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          승인됨
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          대기중
                        </span>
                      )}
                      {review.isFeatured && (
                        <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                          대표 후기
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {review.course.title}
                    </p>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {!review.isApproved && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        승인
                      </button>
                    )}
                    {review.isApproved && (
                      <button
                        onClick={() =>
                          handleFeature(review.id, !review.isFeatured)
                        }
                        className={`px-3 py-1 text-sm rounded ${
                          review.isFeatured
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                      >
                        {review.isFeatured ? '대표 해제' : '대표 지정'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
