import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 강사 본인 강의의 기수 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'admin'
    const isInstructor = session.user.role === 'instructor'

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const courseId = parseInt(id)

    // 강의 조회 및 권한 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    // 강사는 자신의 강의만 조회 가능
    if (isInstructor && course.instructor?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 })
    }

    const schedules = await prisma.courseSchedule.findMany({
      where: { courseId },
      orderBy: { cohort: 'desc' },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    })

    return NextResponse.json({ success: true, schedules })
  } catch (error) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json({ success: false, error: '기수 목록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST: 기수 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'admin'
    const isInstructor = session.user.role === 'instructor'

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const courseId = parseInt(id)

    // 강의 조회 및 권한 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    // 강사는 자신의 강의만 수정 가능
    if (isInstructor && course.instructor?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { cohort, startDate, endDate, status, meetId, meetLink, kakaoTalkLink } = body

    if (!cohort || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: '필수 항목을 입력해주세요' }, { status: 400 })
    }

    // 기수 생성
    const schedule = await prisma.courseSchedule.create({
      data: {
        courseId,
        cohort: parseInt(cohort),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        meetLink: meetLink || null,
        meetId: meetId || null,
        kakaoTalkLink: kakaoTalkLink || null,
        status: status || 'scheduled',
      },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    })

    return NextResponse.json({ success: true, schedule })
  } catch (error) {
    console.error('Schedule create error:', error)
    return NextResponse.json({ success: false, error: '기수 생성 중 오류가 발생했습니다' }, { status: 500 })
  }
}
