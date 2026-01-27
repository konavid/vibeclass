import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/profile - 내 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        phone: true,
        image: true,
        marketingConsent: true,
        termsAgreed: true,
        privacyAgreed: true,
        profileCompleted: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('프로필 조회 실패:', error)
    return NextResponse.json(
      { error: '프로필 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT /api/users/profile - 내 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, nickname, phone, marketingConsent } = body

    // 필수 항목 확인
    if (!name || !email || !nickname || !phone) {
      return NextResponse.json(
        { error: '이름, 이메일, 별명, 연락처는 필수 항목입니다' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인 (자신의 이메일이 아닌 경우만)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: parseInt(session.user.id)
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다' },
        { status: 400 }
      )
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        name,
        email,
        nickname,
        phone,
        marketingConsent: marketingConsent || false,
        profileCompleted: true, // 프로필 완성 처리
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        phone: true,
        image: true,
        marketingConsent: true,
        termsAgreed: true,
        privacyAgreed: true,
        profileCompleted: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('프로필 수정 실패:', error)
    return NextResponse.json(
      { error: '프로필 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}
