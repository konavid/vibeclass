import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch chat messages for a schedule
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId가 필요합니다.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)
    const isAdmin = session.user.role === 'admin'
    const isInstructor = session.user.role === 'instructor'

    // 관리자와 강사는 모든 채팅방에 접근 가능
    if (!isAdmin && !isInstructor) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          scheduleId: parseInt(scheduleId),
          userId: userId,
          status: { in: ['completed', 'confirmed'] }
        }
      })

      if (!enrollment) {
        return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
      }
    }

    // Check if course has ended
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: parseInt(scheduleId) },
      include: {
        course: true
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: '존재하지 않는 기수입니다.' }, { status: 404 })
    }

    const now = new Date()
    const isEnded = schedule.endDate < now

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: { scheduleId: parseInt(scheduleId) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there are more
      ...(cursor && {
        cursor: { id: parseInt(cursor) },
        skip: 1
      }),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
            role: true
          }
        }
      }
    })

    const hasMore = messages.length > limit
    const nextCursor = hasMore ? messages[limit - 1].id : null

    return NextResponse.json({
      messages: messages.slice(0, limit).reverse(), // Return in chronological order
      nextCursor,
      hasMore,
      isEnded,
      schedule: {
        id: schedule.id,
        cohort: schedule.cohort,
        courseTitle: schedule.course.title,
        endDate: schedule.endDate.toISOString()
      }
    })
  } catch (error) {
    console.error('Chat fetch error:', error)
    return NextResponse.json({ error: '채팅 내역을 불러올 수 없습니다.' }, { status: 500 })
  }
}

// POST - Send a message (fallback if WebSocket is not available)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { scheduleId, message } = await request.json()

    if (!scheduleId || !message) {
      return NextResponse.json({ error: 'scheduleId와 message가 필요합니다.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)
    const isAdmin = session.user.role === 'admin'

    // Check if course has ended
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: parseInt(scheduleId) }
    })

    if (!schedule) {
      return NextResponse.json({ error: '존재하지 않는 기수입니다.' }, { status: 404 })
    }

    const now = new Date()
    if (schedule.endDate < now) {
      return NextResponse.json({ error: '종료된 강의의 채팅방입니다.' }, { status: 400 })
    }

    // 관리자와 강사는 모든 채팅방에 메시지 전송 가능
    const isInstructor = session.user.role === 'instructor'
    if (!isAdmin && !isInstructor) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          scheduleId: parseInt(scheduleId),
          userId: userId,
          status: { in: ['completed', 'confirmed'] }
        }
      })

      if (!enrollment) {
        return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
      }
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        scheduleId: parseInt(scheduleId),
        userId: userId,
        message: message.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      id: chatMessage.id,
      message: chatMessage.message,
      createdAt: chatMessage.createdAt.toISOString(),
      user: chatMessage.user
    })
  } catch (error) {
    console.error('Chat send error:', error)
    return NextResponse.json({ error: '메시지 전송에 실패했습니다.' }, { status: 500 })
  }
}
