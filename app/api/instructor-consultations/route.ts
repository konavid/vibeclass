import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { instructorId, message } = await request.json()

    if (!instructorId || !message) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 강사 존재 확인
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
    })

    if (!instructor) {
      return NextResponse.json(
        { error: '강사를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 상담 신청 생성
    const consultation = await prisma.instructorConsultation.create({
      data: {
        userId: user.id,
        instructorId,
        message,
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, consultation })
  } catch (error) {
    console.error('강사 상담 신청 오류:', error)
    return NextResponse.json(
      { error: '상담 신청 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
