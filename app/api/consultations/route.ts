import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/consultations - 내 상담 목록
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const consultations = await prisma.consultation.findMany({
      where: { userId: parseInt(session.user.id) },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(consultations)
  } catch (error) {
    console.error('상담 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '상담 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/consultations - 새 상담 시작
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, message } = body

    // 상담 생성
    const consultation = await prisma.consultation.create({
      data: {
        userId: parseInt(session.user.id),
        type: type || 'agent',
        status: 'open',
        messages: JSON.stringify([
          {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
          },
        ]),
      },
    })

    return NextResponse.json(consultation)
  } catch (error) {
    console.error('상담 생성 실패:', error)
    return NextResponse.json(
      { error: '상담 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
