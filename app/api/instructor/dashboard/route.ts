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

    // 강사의 강의 목록 (admin은 모든 강의, 강사는 자기 강의만)
    const courses = await prisma.course.findMany({
      where: instructor ? { instructorId: instructor.id } : {},
      include: {
        schedules: {
          include: {
            enrollments: {
              where: { status: { in: ['confirmed', 'completed'] } }
            },
            sessions: true
          }
        },
        reviews: {
          where: { isApproved: true }
        }
      }
    })

    // 통계 계산
    const totalCourses = courses.length
    const totalStudents = courses.reduce((acc, course) => {
      return acc + course.schedules.reduce((sAcc, schedule) => sAcc + schedule.enrollments.length, 0)
    }, 0)
    const allReviews = courses.flatMap(c => c.reviews)
    const totalReviews = allReviews.length
    const averageRating = totalReviews > 0
      ? allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0

    // 진행 중인 강의 수
    const now = new Date()
    const ongoingCourses = courses.filter(course =>
      course.schedules.some(schedule =>
        new Date(schedule.startDate) <= now && new Date(schedule.endDate) >= now
      )
    ).length

    // 최근 수강 신청 (최근 10개)
    const recentEnrollments = await prisma.enrollment.findMany({
      where: {
        schedule: {
          course: instructor ? { instructorId: instructor.id } : {}
        },
        status: { in: ['confirmed', 'completed'] }
      },
      include: {
        user: {
          select: { name: true, nickname: true }
        },
        schedule: {
          include: {
            course: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // 예정된 수업 세션 (7일 이내)
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    const upcomingSessions = await prisma.courseSession.findMany({
      where: {
        schedule: {
          course: instructor ? { instructorId: instructor.id } : {}
        },
        sessionDate: {
          gte: now,
          lte: sevenDaysLater
        }
      },
      include: {
        schedule: {
          include: {
            course: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { sessionDate: 'asc' },
      take: 5
    })

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
