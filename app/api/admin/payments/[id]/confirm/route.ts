import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/payments/[id]/confirm - 결제 수동 확정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const paymentId = parseInt(resolvedParams.id)

    if (isNaN(paymentId)) {
      return NextResponse.json(
        { error: '잘못된 결제 ID입니다' },
        { status: 400 }
      )
    }

    // 결제 정보 조회
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        enrollments: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 이미 확정된 경우
    if (payment.status === 'confirmed' || payment.status === 'completed') {
      return NextResponse.json(
        { error: '이미 확정된 결제입니다' },
        { status: 400 }
      )
    }

    // 결제 확정
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'confirmed',
        paidAt: payment.paidAt || new Date()
      }
    })

    // 연결된 수강신청도 확정
    if (payment.enrollments.length > 0) {
      await prisma.enrollment.updateMany({
        where: { paymentId: paymentId },
        data: { status: 'confirmed' }
      })
    }

    return NextResponse.json({
      success: true,
      message: '결제가 확정되었습니다'
    })
  } catch (error) {
    console.error('결제 확정 실패:', error)
    return NextResponse.json(
      { error: '결제 확정에 실패했습니다' },
      { status: 500 }
    )
  }
}
