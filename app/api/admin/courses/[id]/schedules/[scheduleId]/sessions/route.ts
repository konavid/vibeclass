import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: 회차 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id, scheduleId } = await params
    const body = await request.json()
    const { sessionNumber, sessionDate, startTime, endTime, topic } = body

    if (!sessionNumber || !sessionDate || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: '필수 항목을 입력해주세요' }, { status: 400 })
    }

    const courseSession = await prisma.courseSession.create({
      data: {
        scheduleId: parseInt(scheduleId),
        sessionNumber: parseInt(sessionNumber),
        sessionDate: new Date(sessionDate),
        startTime,
        endTime,
        topic: topic || null,
        meetLink: null,
        meetId: null,
      }
    })

    return NextResponse.json({ success: true, session: courseSession })
  } catch (error) {
    console.error('Session create error:', error)
    return NextResponse.json({ success: false, error: '회차 생성 중 오류가 발생했습니다' }, { status: 500 })
  }
}
