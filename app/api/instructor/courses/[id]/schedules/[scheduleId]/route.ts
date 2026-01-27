import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH: 기수 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
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

    const { id, scheduleId } = await params
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
    const { cohort, startDate, endDate, meetId, meetLink, kakaoTalkLink, status } = body

    const schedule = await prisma.courseSchedule.update({
      where: { id: parseInt(scheduleId) },
      data: {
        ...(cohort && { cohort: parseInt(cohort) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(meetId !== undefined && { meetId }),
        ...(meetLink !== undefined && { meetLink }),
        ...(kakaoTalkLink !== undefined && { kakaoTalkLink }),
        ...(status && { status }),
      },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    })

    return NextResponse.json({ success: true, schedule })
  } catch (error) {
    console.error('Schedule update error:', error)
    return NextResponse.json({ success: false, error: '기수 수정 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE: 기수 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
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

    const { id, scheduleId } = await params
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

    // 수강생이 있는지 확인
    const enrollmentCount = await prisma.enrollment.count({
      where: { scheduleId: parseInt(scheduleId) }
    })

    if (enrollmentCount > 0) {
      return NextResponse.json({
        success: false,
        error: '수강생이 있는 기수는 삭제할 수 없습니다'
      }, { status: 400 })
    }

    await prisma.courseSchedule.delete({
      where: { id: parseInt(scheduleId) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Schedule delete error:', error)
    return NextResponse.json({ success: false, error: '기수 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
