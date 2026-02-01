import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/instructor/dashboard - 강사 대시보드 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 강사 정보 조회 (admin인 경우 첫 번째 강사 또는 모든 강의 조회)
    let instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    const isAdmin = session.user.role === 'admin'

    // admin이면서 강사 정보가 없는 경우 - 모든 강의를 조회
    if (!instructor && !isAdmin) {
      return NextResponse.json(
        { error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 4. 통계 및 데이터 조회 (병렬 처리)
    const [
      totalCourses,
      totalStudentsData,
      reviewStats,
      ongoingCourses,
      recentEnrollments,
      upcomingSessions
    ] = await Promise.all([
      // 총 강의 수
      prisma.course.count({
        where: instructor ? { instructorId: instructor.id } : {}
      }),

      // 총 수강생 수 (Enrollment 기준)
      prisma.enrollment.count({
        where: {
          status: { in: ['confirmed', 'completed'] },
          schedule: {
            course: instructor ? { instructorId: instructor.id } : {}
          }
        }
      }),

      // 리뷰 통계 (총 개수 및 평균 평점)
      prisma.review.aggregate({
        where: {
          isApproved: true,
          course: instructor ? { instructorId: instructor.id } : {}
        },
        _count: true,
        _avg: { rating: true }
      }),

      // 진행 중인 강의 수
      prisma.course.count({
        where: {
          ...(instructor ? { instructorId: instructor.id } : {}),
          status: 'active',
          schedules: {
            some: {
              startDate: { lte: new Date() },
              endDate: { gte: new Date() }
            }
          }
        }
      }),

      // 최근 수강 신청 (최근 10개)
      prisma.enrollment.findMany({
        where: {
          status: { in: ['confirmed', 'completed'] },
          schedule: {
            course: instructor ? { instructorId: instructor.id } : {}
          }
        },
        include: {
          user: { select: { name: true, nickname: true } },
          schedule: {
            include: {
              course: { select: { title: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // 예정된 수업 세션 (7일 이내)
      prisma.courseSession.findMany({
        where: {
          schedule: {
            course: instructor ? { instructorId: instructor.id } : {}
          },
          sessionDate: {
            gte: new Date(),
            lte: new Date(new Date().setDate(new Date().getDate() + 7))
          }
        },
        include: {
          schedule: {
            include: {
              course: { select: { title: true } }
            }
          }
        },
        orderBy: { sessionDate: 'asc' },
        take: 5
      })
    ])

    // 통계 데이터 정리
    const totalStudents = totalStudentsData
    const totalReviews = reviewStats._count
    const averageRating = reviewStats._avg.rating || 0

    return NextResponse.json({
      success: true,
      data: {
        instructor: instructor ? {
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          imageUrl: instructor.imageUrl
        } : {
          id: 0,
          name: session.user.name || '관리자',
          email: session.user.email || '',
          imageUrl: null
        },
        stats: {
          totalCourses,
          totalStudents,
          totalReviews,
          averageRating,
          ongoingCourses
        },
        recentEnrollments: recentEnrollments.map(e => ({
          id: e.id,
          userName: e.user.nickname || e.user.name,
          courseName: e.schedule.course.title,
          cohort: e.schedule.cohort,
          enrolledAt: e.createdAt.toISOString()
        })),
        upcomingSessions: upcomingSessions.map(s => ({
          id: s.id,
          courseName: s.schedule.course.title,
          cohort: s.schedule.cohort,
          sessionNumber: s.sessionNumber,
          sessionDate: s.sessionDate.toISOString(),
          startTime: s.startTime,
          endTime: s.endTime
        }))
      }
    })
  } catch (error) {
    console.error('강사 대시보드 조회 실패:', error)
    return NextResponse.json(
      { error: '대시보드 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
