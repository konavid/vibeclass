import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: QnA 목록 조회 (학생용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = parseInt(searchParams.get('scheduleId') || '0')

    if (!scheduleId) {
      return NextResponse.json({ error: '기수 ID가 필요합니다.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // 수강 확인
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        scheduleId,
        status: { in: ['confirmed', 'completed'] }
      }
    })

    if (!enrollment && session.user.role !== 'admin') {
      return NextResponse.json({ error: '수강 권한이 없습니다.' }, { status: 403 })
    }

    // 기수 정보
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: { select: { title: true } } }
    })

    if (!schedule) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 })
    }

    // QnA 목록 조회 (본인 것 + 공개된 것)
    const qnas = await prisma.cohortQna.findMany({
      where: {
        scheduleId,
        OR: [
          { userId }, // 본인이 작성한 것
          { isPublic: true } // 공개된 것
        ]
      },
      include: {
        user: { select: { id: true, name: true, nickname: true } },
        admin: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        cohort: schedule.cohort,
        courseTitle: schedule.course.title
      },
      qnas
    })
  } catch (error) {
    console.error('QnA 조회 오류:', error)
    return NextResponse.json({ error: 'QnA 조회 실패' }, { status: 500 })
  }
}

// POST: 질문 등록 (학생용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { scheduleId, title, question, isPublic = true } = body

    if (!scheduleId || !title || !question) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // 수강 확인
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        scheduleId,
        status: { in: ['confirmed', 'completed'] }
      }
    })

    if (!enrollment && session.user.role !== 'admin') {
      return NextResponse.json({ error: '수강 권한이 없습니다.' }, { status: 403 })
    }

    const qna = await prisma.cohortQna.create({
      data: {
        scheduleId,
        userId,
        title,
        question,
        isPublic
      }
    })

    return NextResponse.json(qna, { status: 201 })
  } catch (error) {
    console.error('QnA 등록 오류:', error)
    return NextResponse.json({ error: 'QnA 등록 실패' }, { status: 500 })
  }
}
