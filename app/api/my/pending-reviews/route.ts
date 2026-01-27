import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 후기를 작성하지 않은 완료된 강의 목록
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const today = new Date()

    // 수강 완료된 강의 (종료일이 지난 스케줄에 등록된 강의)
    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'active',
        schedule: {
          endDate: { lt: today }, // 종료일이 오늘 이전
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            instructor: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        schedule: {
          select: {
            cohort: true,
            endDate: true,
          },
        },
      },
    })

    // 이미 후기를 작성한 강의 ID 목록
    const writtenReviews = await prisma.review.findMany({
      where: {
        userId,
        courseId: { in: completedEnrollments.map(e => e.courseId) },
      },
      select: { courseId: true },
    })

    const reviewedCourseIds = new Set(writtenReviews.map(r => r.courseId))

    // 후기를 작성하지 않은 강의 필터링
    const pendingReviews = completedEnrollments
      .filter(e => !reviewedCourseIds.has(e.courseId))
      .map(e => ({
        enrollmentId: e.id,
        courseId: e.course.id,
        courseTitle: e.course.title,
        thumbnailUrl: e.course.thumbnailUrl,
        instructorName: e.course.instructor?.name || '강사',
        instructorImage: e.course.instructor?.imageUrl,
        cohort: e.schedule.cohort,
        endDate: e.schedule.endDate,
      }))

    return NextResponse.json({
      success: true,
      pendingReviews,
      count: pendingReviews.length,
    })

  } catch (error: any) {
    console.error('Pending reviews error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch pending reviews',
    }, { status: 500 })
  }
}
