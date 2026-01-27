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
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduleId } = await params
    const body = await request.json()
    const { cohort, startDate, endDate, meetLink, kakaoTalkLink, status } = body

    const schedule = await prisma.courseSchedule.update({
      where: { id: parseInt(scheduleId) },
      data: {
        ...(cohort && { cohort: parseInt(cohort) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(meetLink !== undefined && { meetLink }),
        ...(kakaoTalkLink !== undefined && { kakaoTalkLink }),
        ...(status && { status }),
      },
      include: {
        sessions: {
          orderBy: { sessionNumber: 'asc' }
        },
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
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduleId } = await params

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
