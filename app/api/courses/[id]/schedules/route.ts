import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/courses/[id]/schedules - 특정 교육의 일정 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const courseId = parseInt(idStr)

    const schedules = await prisma.courseSchedule.findMany({
      where: { courseId },
      orderBy: { startDate: 'asc' },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('일정 조회 실패:', error)
    return NextResponse.json(
      { error: '일정 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/courses/[id]/schedules - 일정 생성 (관리자 전용)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { id: idStr } = await params
    const courseId = parseInt(idStr)
    const body = await request.json()
    const { startDate, endDate, status, cohort, meetLink } = body

    // 필수 필드 검증
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: '시작일과 종료일은 필수입니다' },
        { status: 400 }
      )
    }

    // 교육 존재 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { error: '존재하지 않는 교육입니다' },
        { status: 404 }
      )
    }

    // 날짜 유효성 검증
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: '종료일은 시작일보다 이후여야 합니다' },
        { status: 400 }
      )
    }

    // 기수 번호 계산 (제공되지 않은 경우)
    let cohortNumber = cohort
    if (!cohortNumber) {
      const lastSchedule = await prisma.courseSchedule.findFirst({
        where: { courseId },
        orderBy: { cohort: 'desc' },
      })
      cohortNumber = lastSchedule ? lastSchedule.cohort + 1 : 1
    }

    const schedule = await prisma.courseSchedule.create({
      data: {
        courseId,
        cohort: cohortNumber,
        startDate: start,
        endDate: end,
        meetLink: meetLink || null,
        status: status || 'scheduled',
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('일정 생성 실패:', error)
    return NextResponse.json(
      { error: '일정 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
