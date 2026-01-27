'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import axios from 'axios'
import InstructorLayout from '@/components/instructor/InstructorLayout'

interface Course {
  id: number
  title: string
  description: string
  status: string
  approvalStatus: string
  approvalNote: string | null
  isFree: boolean
  price: number
  capacity: number
  thumbnailUrl: string | null
  category: {
    name: string
  }
  schedules: Array<{
    id: number
    cohort: number
    startDate: string
    endDate: string
    status: string
    _count: {
      enrollments: number
    }
  }>
  _count: {
    enrollments: number
    schedules: number
    reviews: number
  }
}

export default function InstructorCoursesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [resubmitting, setResubmitting] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user.role !== 'instructor' && session?.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchCourses()
  }, [session, status, router])

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/instructor/courses')
      if (response.data.success) {
        setCourses(response.data.courses)
      }
    } catch (error) {
      console.error('강의 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getApprovalBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'pending':
        return { className: 'bg-yellow-100 text-yellow-800', text: '승인대기' }
      case 'approved':
        return { className: 'bg-green-100 text-green-800', text: '승인됨' }
      case 'rejected':
        return { className: 'bg-red-100 text-red-800', text: '거절됨' }
      default:
        return { className: 'bg-gray-100 text-gray-800', text: approvalStatus }
    }
  }

  const handleResubmit = async (courseId: number) => {
    if (!confirm('재승인 요청을 하시겠습니까?')) return

    setResubmitting(courseId)
    try {
      const response = await axios.post(`/api/instructor/courses/${courseId}/resubmit`)
      if (response.data.success) {
        alert(response.data.message)
        fetchCourses()
      } else {
        alert(response.data.error || '재승인 요청에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('재승인 요청 실패:', error)
      alert(error.response?.data?.error || '재승인 요청에 실패했습니다.')
    } finally {
      setResubmitting(null)
    }
  }

  if (loading) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">로딩 중...</div>
      </InstructorLayout>
    )
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">강의 관리</h1>
            <p className="text-gray-600 mt-1">내 강의 정보를 수정하세요.</p>
          </div>
          {courses.length < 3 && (
            <Link
              href="/instructor/courses/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              강의 등록
            </Link>
          )}
        </div>

        {/* 강의 등록 현황 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-blue-800">
            등록된 강의: <strong>{courses.length}</strong>/3개
          </span>
          {courses.length >= 3 && (
            <span className="text-sm text-blue-600">
              최대 등록 한도에 도달했습니다
            </span>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 강의가 없습니다</h3>
            <p className="text-gray-500 mb-4">새 강의를 등록해보세요.</p>
            <Link
              href="/instructor/courses/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              첫 강의 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* 썸네일 */}
                    <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 thumbnail-animated">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-3xl">📚</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900 truncate">
                          {course.title}
                        </h2>
                        {/* 승인 상태 배지 */}
                        {(() => {
                          const approvalBadge = getApprovalBadge(course.approvalStatus)
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${approvalBadge.className}`}>
                              {approvalBadge.text}
                            </span>
                          )
                        })()}
                        {/* 게시 상태 배지 (승인된 경우만) */}
                        {course.approvalStatus === 'approved' && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadge(course.status)}`}>
                            {course.status === 'active' ? '게시중' : '비게시'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {course.category.name} • {course.isFree ? '무료' : `${course.price.toLocaleString()}원`}
                      </p>
                      {/* 승인 대기 안내 */}
                      {course.approvalStatus === 'pending' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">승인 대기 중</span> - 어드민 검토 후 강의가 게시됩니다.
                          </p>
                        </div>
                      )}

                      {/* 거절 사유 표시 */}
                      {course.approvalStatus === 'rejected' && course.approvalNote && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">거절 사유:</span> {course.approvalNote}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            수정 후 다시 승인 요청을 하실 수 있습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 통계 */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">총 수강생</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {course._count.enrollments}명
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">진행 기수</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {course._count.schedules}기
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">후기</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {course._count.reviews}개
                      </p>
                    </div>
                  </div>

                  {/* 진행 중인 기수 */}
                  {course.schedules.length > 0 && (
                    <div className="border-t mt-6 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">진행 중인 기수</h3>
                      <div className="space-y-2">
                        {course.schedules.slice(0, 3).map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium text-gray-900">
                                {schedule.cohort}기
                              </span>
                              <span className="text-sm text-gray-500 ml-3">
                                {new Date(schedule.startDate).toLocaleDateString('ko-KR')} ~ {new Date(schedule.endDate).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              {schedule._count.enrollments}명 수강 중
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 버튼 */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/instructor/courses/${course.id}/edit`}
                      className="flex-1 min-w-[120px] px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-center"
                    >
                      강의 수정
                    </Link>
                    {/* 거절된 강의는 재승인 요청 버튼 표시 */}
                    {course.approvalStatus === 'rejected' && (
                      <button
                        onClick={() => handleResubmit(course.id)}
                        disabled={resubmitting === course.id}
                        className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
                      >
                        {resubmitting === course.id ? '요청 중...' : '재승인 요청'}
                      </button>
                    )}
                    {/* 승인된 강의만 미리보기, 수강생 버튼 표시 */}
                    {course.approvalStatus === 'approved' && (
                      <>
                        <Link
                          href={`/courses/${course.id}`}
                          target="_blank"
                          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          미리보기
                        </Link>
                        <Link
                          href={`/instructor/students?courseId=${course.id}`}
                          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          수강생
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </InstructorLayout>
  )
}
