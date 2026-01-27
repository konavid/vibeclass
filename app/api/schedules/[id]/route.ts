import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/schedules/[id] - 일정 수정 (관리자 전용)
export async function PUT(
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
    const id = parseInt(idStr)
    const body = await request.json()
    const { startDate, endDate, meetId, meetLink, status } = body

    // 날짜 유효성 검증
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start >= end) {
        return NextResponse.json(
          { error: '종료일은 시작일보다 이후여야 합니다' },
          { status: 400 }
        )
      }
    }

    const schedule = await prisma.courseSchedule.update({
      where: { id },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(meetId !== undefined && { meetId }),
        ...(meetLink !== undefined && { meetLink }),
        ...(status && { status }),
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('일정 수정 실패:', error)
    return NextResponse.json(
      { error: '일정 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id] - 일정 삭제 (관리자 전용)
export async function DELETE(
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
    const id = parseInt(idStr)

    // 수강 신청이 있는지 확인
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        scheduleId: id,
        status: { in: ['confirmed', 'completed'] },
      },
    })

    if (enrollmentCount > 0) {
      return NextResponse.json(
        { error: '수강 신청이 있는 일정은 삭제할 수 없습니다. 상태를 cancelled로 변경해주세요.' },
        { status: 400 }
      )
    }

    await prisma.courseSchedule.delete({
      where: { id },
    })

    return NextResponse.json({ message: '일정이 삭제되었습니다' })
  } catch (error) {
    console.error('일정 삭제 실패:', error)
    return NextResponse.json(
      { error: '일정 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
