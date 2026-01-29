import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRegistrationCompleteNotification } from '@/lib/notification'

// POST /api/auth/complete-profile - 프로필 완성
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
    const { name, email, nickname, phone, termsAgreed, privacyAgreed, marketingConsent } = body

    // 필수 항목 확인 (연락처 제외)
    if (!name || !email || !nickname) {
      return NextResponse.json(
        { error: '이름, 이메일, 별명은 필수 항목입니다' },
        { status: 400 }
      )
    }

    if (!termsAgreed || !privacyAgreed) {
      return NextResponse.json(
        { error: '필수 약관에 동의해주세요' },
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

    // 기존 사용자 정보 조회 (이미 프로필 완성 여부 확인용)
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { profileCompleted: true }
    })

    const isFirstRegistration = !currentUser?.profileCompleted

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        name,
        email,
        nickname,
        phone,
        profileCompleted: true,
        termsAgreed,
        privacyAgreed,
        marketingConsent: marketingConsent || false,
      },
    })

    // 최초 회원가입 완료 시 알림 발송 (SMS + 이메일 + 카카오톡)
    if (isFirstRegistration) {
      try {
        const notificationResult = await sendRegistrationCompleteNotification({
          userId: updatedUser.id,
          phone: phone || '',
          email: email || '',
          userName: nickname || name
        })
        console.log('Registration notification sent:', notificationResult)
      } catch (notifyError) {
        console.error('Registration notification error:', notifyError)
        // 알림 발송 실패해도 회원가입은 성공으로 처리
      }
    }

    return NextResponse.json({
      message: '프로필이 성공적으로 저장되었습니다',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        nickname: updatedUser.nickname,
        phone: updatedUser.phone,
        profileCompleted: updatedUser.profileCompleted,
      },
    })
  } catch (error) {
    console.error('프로필 저장 실패:', error)
    return NextResponse.json(
      { error: '프로필 저장에 실패했습니다' },
      { status: 500 }
    )
  }
}
