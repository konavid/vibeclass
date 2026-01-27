'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import axios from 'axios'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface Qna {
  id: number
  title: string | null
  message: string
  response: string | null
  status: string
  isPublic: boolean
  createdAt: string
  respondedAt: string | null
  instructor: {
    id: number
    name: string
    imageUrl: string | null
  }
  course: {
    id: number
    title: string
  } | null
}

export default function MyQnaPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [qnas, setQnas] = useState<Qna[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchQnas()
    }
  }, [status, router])

  const fetchQnas = async () => {
    try {
      const response = await axios.get('/api/my/qna')
      if (response.data.success) {
        setQnas(response.data.qnas)
      }
    } catch (error) {
      console.error('문의 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { className: 'bg-yellow-100 text-yellow-800', text: '답변대기' }
      case 'responded':
        return { className: 'bg-green-100 text-green-800', text: '답변완료' }
      case 'closed':
        return { className: 'bg-gray-100 text-gray-800', text: '종료' }
      default:
        return { className: 'bg-gray-100 text-gray-800', text: status }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">로딩 중...</div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">내 문의 내역</h1>
          <p className="text-gray-600 mt-1">강사님께 문의한 내역을 확인하세요</p>
        </div>

        {qnas.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">문의 내역이 없습니다</h3>
            <p className="text-gray-500 mb-4">강의 페이지에서 강사님께 문의해보세요</p>
            <Link
              href="/courses"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              교육과정 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {qnas.map((qna) => {
              const statusBadge = getStatusBadge(qna.status)
              return (
                <div
                  key={qna.id}
                  className="bg-white rounded-xl border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {qna.instructor.imageUrl ? (
                          <img
                            src={qna.instructor.imageUrl}
                            alt={qna.instructor.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium">
                            {qna.instructor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{qna.instructor.name} 강사님</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                              {statusBadge.text}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {qna.course ? (
                              <Link href={`/courses/${qna.course.id}`} className="hover:underline">
                                {qna.course.title}
                              </Link>
                            ) : (
                              '일반 문의'
                            )} · {formatDate(qna.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 문의 내용 */}
                    {qna.title && (
                      <h3 className="font-semibold text-gray-900 mb-2">{qna.title}</h3>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{qna.message}</p>
                    </div>

                    {/* 답변 */}
                    {qna.response ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-green-800">강사님 답변</span>
                          {qna.respondedAt && (
                            <span className="text-xs text-green-600">
                              {formatDate(qna.respondedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-green-900 whitespace-pre-wrap">{qna.response}</p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-yellow-800">
                          강사님이 답변을 준비 중입니다. 답변이 등록되면 SMS로 알려드립니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
