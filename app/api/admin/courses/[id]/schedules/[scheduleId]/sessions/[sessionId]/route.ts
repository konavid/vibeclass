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
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
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
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params

    await prisma.courseSession.delete({
      where: { id: parseInt(sessionId) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session delete error:', error)
    return NextResponse.json({ success: false, error: '회차 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
