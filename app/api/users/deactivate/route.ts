import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/users/deactivate - 회원 탈퇴 (비활성화)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // 현재 사용자 정보 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: '이미 탈퇴한 계정입니다' },
        { status: 400 }
      )
    }

    // 관리자 계정은 탈퇴 불가
    const userRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (userRole?.role === 'admin') {
      return NextResponse.json(
        { error: '관리자 계정은 탈퇴할 수 없습니다' },
        { status: 403 }
      )
    }

    // 활성 수강 확인 (진행 중인 강의가 있는지)
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: { in: ['confirmed', 'active'] }
      },
      include: {
        course: {
          select: { title: true }
        }
      }
    })

    if (activeEnrollments.length > 0) {
      const courseNames = activeEnrollments.map(e => e.course.title).join(', ')
      return NextResponse.json(
        {
          error: '진행 중인 강의가 있어 탈퇴할 수 없습니다',
          details: `다음 강의를 수강 중입니다: ${courseNames}. 고객센터로 문의해주세요.`
        },
        { status: 400 }
      )
    }

    // 계정 비활성화
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      }
    })

    // 모든 세션 삭제 (로그아웃)
    await prisma.session.deleteMany({
      where: { userId }
    })

    console.log(`User deactivated: ${user.email} (ID: ${userId})`)

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.'
    })
  } catch (error) {
    console.error('회원 탈퇴 오류:', error)
    return NextResponse.json(
      { error: '회원 탈퇴 처리에 실패했습니다' },
      { status: 500 }
    )
  }
}
