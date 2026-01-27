'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InstructorLayout from '@/components/instructor/InstructorLayout'
import axios from 'axios'

interface DashboardData {
  instructor: {
    id: number
    name: string
    email: string
    imageUrl: string | null
  }
  stats: {
    totalCourses: number
    totalStudents: number
    totalReviews: number
    averageRating: number
    ongoingCourses: number
  }
  recentEnrollments: Array<{
    id: number
    userName: string
    courseName: string
    cohort: number
    enrolledAt: string
  }>
  upcomingSessions: Array<{
    id: number
    courseName: string
    cohort: number
    sessionNumber: number
    sessionDate: string
    startTime: string
    endTime: string
  }>
}

export default function InstructorDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user.role !== 'instructor' && session?.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchDashboard()
  }, [session, status, router])

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/instructor/dashboard')
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('대시보드 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">로딩 중...</div>
      </InstructorLayout>
    )
  }

  if (!data) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </InstructorLayout>
    )
  }

  return (
    <InstructorLayout>
      <div className="space-y-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              안녕하세요, {data.instructor.name} 강사님!
            </h1>
            <p className="text-gray-600 mt-1">오늘의 강의 현황을 확인하세요.</p>
          </div>
          <Link
            href="/instructor/profile"
            className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
          >
            {data.instructor.imageUrl ? (
              <img
                src={data.instructor.imageUrl}
                alt={data.instructor.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-lg">👤</span>
              </div>
            )}
            <span className="text-sm font-medium">프로필 수정</span>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">총 강의</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalCourses}개</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">진행 중</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.ongoingCourses}개</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">총 수강생</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalStudents}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">평균 평점</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.averageRating > 0 ? data.stats.averageRating.toFixed(1) : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">후기</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalReviews}개</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 예정된 수업 */}
          <div className="bg-white rounded-xl border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">예정된 수업</h2>
            </div>
            <div className="p-6">
              {data.upcomingSessions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">예정된 수업이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {data.upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{session.courseName}</p>
                        <p className="text-sm text-gray-500">
                          {session.cohort}기 {session.sessionNumber}회차
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(session.sessionDate).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.startTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 최근 수강 신청 */}
          <div className="bg-white rounded-xl border">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">최근 수강 신청</h2>
              <Link
                href="/instructor/students"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                전체 보기
              </Link>
            </div>
            <div className="p-6">
              {data.recentEnrollments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">최근 수강 신청이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {data.recentEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{enrollment.userName}</p>
                        <p className="text-sm text-gray-500">
                          {enrollment.courseName} {enrollment.cohort}기
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/instructor/courses"
            className="flex items-center gap-4 p-6 bg-white rounded-xl border hover:border-gray-300 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">강의 관리</p>
              <p className="text-sm text-gray-500">강의 정보 수정하기</p>
            </div>
          </Link>

          <Link
            href="/instructor/students"
            className="flex items-center gap-4 p-6 bg-white rounded-xl border hover:border-gray-300 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">수강생 관리</p>
              <p className="text-sm text-gray-500">수강생 목록 확인</p>
            </div>
          </Link>

          <Link
            href="/instructor/profile"
            className="flex items-center gap-4 p-6 bg-white rounded-xl border hover:border-gray-300 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">프로필 수정</p>
              <p className="text-sm text-gray-500">강사 정보 수정하기</p>
            </div>
          </Link>

          <Link
            href="/instructor-apply/contract-view"
            className="flex items-center gap-4 p-6 bg-white rounded-xl border hover:border-gray-300 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">계약서 보기</p>
              <p className="text-sm text-gray-500">계약서 확인 및 인쇄</p>
            </div>
          </Link>
        </div>
      </div>
    </InstructorLayout>
  )
}
