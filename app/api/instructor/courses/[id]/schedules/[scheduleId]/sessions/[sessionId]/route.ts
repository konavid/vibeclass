import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH: 회차 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string; sessionId: string }> }
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

    const { id, sessionId } = await params
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
    const { sessionNumber, sessionDate, startTime, endTime, topic } = body

    const courseSession = await prisma.courseSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        ...(sessionNumber && { sessionNumber: parseInt(sessionNumber) }),
        ...(sessionDate && { sessionDate: new Date(sessionDate) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(topic !== undefined && { topic }),
      }
    })

    return NextResponse.json({ success: true, session: courseSession })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json({ success: false, error: '회차 수정 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE: 회차 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string; sessionId: string }> }
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

    const { id, sessionId } = await params
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

    await prisma.courseSession.delete({
      where: { id: parseInt(sessionId) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session delete error:', error)
    return NextResponse.json({ success: false, error: '회차 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
