import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/my/qna - 내 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const qnas = await prisma.instructorConsultation.findMany({
      where: {
        userId: parseInt(session.user.id)
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      qnas
    })
  } catch (error) {
    console.error('내 문의 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '문의 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
