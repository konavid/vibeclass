import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 내 강사 신청 현황 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        instructorApplication: true
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      application: user.instructorApplication,
      userRole: user.role
    })
  } catch (error: any) {
    console.error('강사 신청 조회 실패:', error)
    return NextResponse.json({ success: false, error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 강사 신청
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        instructorApplication: true
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 신청한 경우
    if (user.instructorApplication) {
      return NextResponse.json({ success: false, error: '이미 강사 신청을 하셨습니다.' }, { status: 400 })
    }

    // 이미 강사인 경우
    if (user.role === 'instructor') {
      return NextResponse.json({ success: false, error: '이미 강사입니다.' }, { status: 400 })
    }

    const body = await request.json()
    const {
      privacyAgreed,
      name,
      field,
      revenue,
      bio,
      photoUrl,
      instagramUrl,
      youtubeUrl,
      kakaoUrl,
      preferredContactTime
    } = body

    // 필수 항목 검증
    if (!privacyAgreed) {
      return NextResponse.json({ success: false, error: '개인정보 보호 동의가 필요합니다.' }, { status: 400 })
    }

    if (!name || !field || !bio) {
      return NextResponse.json({ success: false, error: '이름, 분야, 자기소개는 필수 항목입니다.' }, { status: 400 })
    }

    const application = await prisma.instructorApplication.create({
      data: {
        userId: user.id,
        privacyAgreed,
        name,
        field,
        revenue: revenue || null,
        bio,
        photoUrl: photoUrl || null,
        instagramUrl: instagramUrl || null,
        youtubeUrl: youtubeUrl || null,
        kakaoUrl: kakaoUrl || null,
        preferredContactTime: preferredContactTime || null,
        status: 'applied'
      }
    })

    return NextResponse.json({ success: true, application })
  } catch (error: any) {
    console.error('강사 신청 실패:', error)
    return NextResponse.json({ success: false, error: '신청 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
