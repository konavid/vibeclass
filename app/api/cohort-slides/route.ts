import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 수강생이 슬라이드 접근 가능한지 확인 (수강 완료/확정 후 한 달 이내)
async function canAccessSlides(userId: number, scheduleId: number): Promise<{ canAccess: boolean; reason?: string; daysLeft?: number }> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      scheduleId,
      status: { in: ['confirmed', 'completed'] }
    },
    include: {
      schedule: true
    }
  })

  if (!enrollment) {
    return { canAccess: false, reason: '수강 내역이 없습니다.' }
  }

  // 수강 완료일 또는 기수 종료일 기준
  const endDate = enrollment.schedule.endDate
  const now = new Date()
  const accessDeadline = new Date(endDate)
  accessDeadline.setMonth(accessDeadline.getMonth() + 1) // 한 달 추가

  if (now > accessDeadline) {
    return { canAccess: false, reason: '슬라이드 열람 기간이 만료되었습니다. (수강 종료 후 1개월)' }
  }

  // 남은 일수 계산
  const diffTime = accessDeadline.getTime() - now.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return { canAccess: true, daysLeft }
}

// 강사 또는 관리자인지 확인
async function isInstructorOrAdmin(userId: number, scheduleId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { instructor: true }
  })

  if (!user) return false
  if (user.role === 'admin') return true

  if (user.instructor) {
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: true }
    })
    return schedule?.course.instructorId === user.instructor.id
  }

  return false
}

// GET: 슬라이드 목록/상세 조회 (수강생용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = parseInt(searchParams.get('scheduleId') || '0')
    const slideId = searchParams.get('slideId')

    if (!scheduleId) {
      return NextResponse.json({ error: '기수 ID가 필요합니다.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // 권한 확인 (강사/관리자는 무조건 허용)
    const isStaff = await isInstructorOrAdmin(userId, scheduleId)

    let daysLeft: number | undefined = undefined
    if (!isStaff) {
      const result = await canAccessSlides(userId, scheduleId)
      if (!result.canAccess) {
        return NextResponse.json({ error: result.reason }, { status: 403 })
      }
      daysLeft = result.daysLeft
    }

    // 기수 정보 조회
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: { select: { title: true } } }
    })

    if (!schedule) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 특정 슬라이드 상세 조회
    if (slideId) {
      const slide = await prisma.cohortSlide.findFirst({
        where: {
          id: parseInt(slideId),
          scheduleId,
          isPublished: true
        }
      })

      if (!slide) {
        return NextResponse.json({ error: '슬라이드를 찾을 수 없습니다.' }, { status: 404 })
      }

      return NextResponse.json({
        schedule: {
          id: schedule.id,
          cohort: schedule.cohort,
          courseTitle: schedule.course.title
        },
        slide,
        daysLeft
      })
    }

    // 슬라이드 목록 조회 (공개된 것만)
    const slides = await prisma.cohortSlide.findMany({
      where: {
        scheduleId,
        isPublished: true
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        embedUrl: true,
        order: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        cohort: schedule.cohort,
        courseTitle: schedule.course.title,
        endDate: schedule.endDate
      },
      slides,
      daysLeft
    })
  } catch (error) {
    console.error('슬라이드 조회 오류:', error)
    return NextResponse.json({ error: '슬라이드 조회 실패' }, { status: 500 })
  }
}
