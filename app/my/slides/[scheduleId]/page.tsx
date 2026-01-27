'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface Slide {
  id: number
  title: string
  description: string | null
  embedUrl: string | null
  order: number
  createdAt: string
}

interface Schedule {
  id: number
  cohort: number
  courseTitle: string
  endDate: string
}

export default function SlidesListPage() {
  const params = useParams()
  const scheduleId = parseInt(params.scheduleId as string)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null)

  useEffect(() => {
    fetchSlides()
  }, [scheduleId])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cohort-slides?scheduleId=${scheduleId}`)
      const data = await res.json()

      if (res.ok) {
        setSchedule(data.schedule)
        setSlides(data.slides)
        setDaysLeft(data.daysLeft)
        setError(null)
        // 첫 번째 슬라이드를 기본 선택
        if (data.slides.length > 0) {
          setSelectedSlide(data.slides[0])
        }
      } else {
        setError(data.error || '슬라이드를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('슬라이드를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
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
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-red-800">{error}</h3>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/my/enrollments" className="hover:text-indigo-600">내 구매 목록</Link>
            <span>/</span>
            <span>강의슬라이드</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {schedule?.courseTitle} {schedule?.cohort}기 강의슬라이드
          </h1>
          <p className="mt-1 text-gray-600">강의 슬라이드를 확인하세요</p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 열람 기간 안내 */}
          {daysLeft !== null && daysLeft !== undefined && (
            <div className={`mb-6 p-4 rounded-lg ${
              daysLeft <= 7
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                <svg className={`h-5 w-5 mr-2 ${daysLeft <= 7 ? 'text-red-500' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`font-medium ${daysLeft <= 7 ? 'text-red-800' : 'text-blue-800'}`}>
                  슬라이드 열람 가능 기간: <strong>{daysLeft}일</strong> 남음
                </span>
              </div>
              <p className={`mt-1 text-sm ${daysLeft <= 7 ? 'text-red-700' : 'text-blue-700'}`}>
                수강 종료일로부터 1개월간 슬라이드를 열람하실 수 있습니다.
              </p>
            </div>
          )}

          {slides.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 슬라이드가 없습니다</h3>
              <p className="mt-2 text-gray-500">강사가 슬라이드를 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 슬라이드 목록 */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h2 className="font-medium text-gray-900">슬라이드 목록</h2>
                  </div>
                  <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {slides.map((slide, index) => (
                      <li key={slide.id}>
                        <button
                          onClick={() => setSelectedSlide(slide)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition ${
                            selectedSlide?.id === slide.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
                              selectedSlide?.id === slide.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${
                                selectedSlide?.id === slide.id ? 'text-indigo-600' : 'text-gray-900'
                              }`}>
                                {slide.title}
                              </p>
                              {slide.description && (
                                <p className="text-xs text-gray-500 truncate">{slide.description}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 슬라이드 뷰어 */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {selectedSlide ? (
                    <>
                      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                        <h2 className="font-medium text-gray-900">{selectedSlide.title}</h2>
                        {selectedSlide.embedUrl && (
                          <a
                            href={selectedSlide.embedUrl.replace('/embed?', '/edit?')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            새 창에서 열기
                          </a>
                        )}
                      </div>
                      <div className="aspect-[16/9] bg-gray-100">
                        {selectedSlide.embedUrl ? (
                          <iframe
                            src={selectedSlide.embedUrl}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            슬라이드를 불러올 수 없습니다.
                          </div>
                        )}
                      </div>
                      {selectedSlide.description && (
                        <div className="px-4 py-3 border-t bg-gray-50">
                          <p className="text-sm text-gray-600">{selectedSlide.description}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-[16/9] flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">슬라이드를 선택해주세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 뒤로가기 */}
          <div className="mt-6">
            <Link
              href="/my/enrollments"
              className="inline-flex items-center text-gray-600 hover:text-indigo-600"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              내 구매 목록으로
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
