import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { billId } = await params

    // 결제 조회
    const payment = await prisma.payment.findUnique({
      where: { billId: billId }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인의 결제인지 확인
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 강의 정보 조회 (있는 경우)
    let course = null
    if (payment.courseId) {
      course = await prisma.course.findUnique({
        where: { id: payment.courseId },
        select: {
          id: true,
          title: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        billId: payment.billId,
        status: payment.status,
        amount: payment.amount,
        months: payment.months,
        method: payment.method,
        course: course,
        description: payment.description,
        kakaoPhone: payment.kakaoPhone,
        apprState: payment.apprState,
        apprDt: payment.apprDt,
        apprPayType: payment.apprPayType,
        apprIssuer: payment.apprIssuer,
        apprIssuerNum: payment.apprIssuerNum,
        apprNum: payment.apprNum,
        paidAt: payment.paidAt,
        newEndDate: payment.newEndDate,
        createdAt: payment.createdAt
      }
    })

  } catch (error: any) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { success: false, error: '결제 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
