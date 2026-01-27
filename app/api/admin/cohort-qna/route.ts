import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 모든 QnA 조회 (어드민용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const status = searchParams.get('status') // answered, unanswered, all

    const where: any = {}

    if (scheduleId) {
      where.scheduleId = parseInt(scheduleId)
    }

    if (status === 'answered') {
      where.answer = { not: null }
    } else if (status === 'unanswered') {
      where.answer = null
    }

    const qnas = await prisma.cohortQna.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, nickname: true, email: true } },
        admin: { select: { id: true, name: true } },
        schedule: {
          include: {
            course: { select: { title: true } }
          }
        }
      },
      orderBy: [
        { answer: 'asc' }, // 미답변 먼저
        { createdAt: 'desc' }
      ]
    })

    // 통계
    const stats = await prisma.cohortQna.groupBy({
      by: ['scheduleId'],
      _count: { id: true },
      where: { answer: null }
    })

    const unansweredCount = await prisma.cohortQna.count({
      where: { answer: null }
    })

    return NextResponse.json({
      qnas,
      unansweredCount
    })
  } catch (error) {
    console.error('QnA 조회 오류:', error)
    return NextResponse.json({ error: 'QnA 조회 실패' }, { status: 500 })
  }
}

// PATCH: 답변 등록/수정 (어드민용)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { id, answer } = body

    if (!id) {
      return NextResponse.json({ error: 'QnA ID가 필요합니다.' }, { status: 400 })
    }

    const qna = await prisma.cohortQna.update({
      where: { id },
      data: {
        answer,
        answeredBy: answer ? parseInt(session.user.id) : null,
        answeredAt: answer ? new Date() : null
      }
    })

    return NextResponse.json(qna)
  } catch (error) {
    console.error('답변 등록 오류:', error)
    return NextResponse.json({ error: '답변 등록 실패' }, { status: 500 })
  }
}

// DELETE: QnA 삭제 (어드민용)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json({ error: 'QnA ID가 필요합니다.' }, { status: 400 })
    }

    await prisma.cohortQna.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('QnA 삭제 오류:', error)
    return NextResponse.json({ error: 'QnA 삭제 실패' }, { status: 500 })
  }
}
