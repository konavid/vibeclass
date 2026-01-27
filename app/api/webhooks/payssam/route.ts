import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/webhooks/payssam - PaySsam 결제 Webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { billId, status, txId, paidAt } = body

    console.log('PaySsam Webhook:', body)

    if (!billId) {
      return NextResponse.json(
        { error: 'billId가 필요합니다' },
        { status: 400 }
      )
    }

    // 결제 레코드 조회
    const payment = await prisma.payment.findUnique({
      where: { payssamBillId: billId },
      include: {
        enrollments: true,
      },
    })

    if (!payment) {
      console.error('결제 정보를 찾을 수 없습니다:', billId)
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 결제 상태 업데이트
    let paymentStatus = payment.status

    if (status === 'paid' || status === 'completed') {
      paymentStatus = 'completed'
    } else if (status === 'cancelled' || status === 'failed') {
      paymentStatus = 'failed'
    }

    // 결제 정보 업데이트
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        payssamTxId: txId,
        paidAt: paidAt ? new Date(paidAt) : null,
      },
    })

    // 결제 완료시 수강 신청 상태 업데이트
    if (paymentStatus === 'completed') {
      await prisma.enrollment.updateMany({
        where: { paymentId: payment.id },
        data: { status: 'confirmed' },
      })

      console.log('✅ 결제 완료 및 수강 확정:', billId)
    } else if (paymentStatus === 'failed') {
      await prisma.enrollment.updateMany({
        where: { paymentId: payment.id },
        data: { status: 'cancelled' },
      })

      console.log('❌ 결제 실패:', billId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PaySsam Webhook 처리 실패:', error)
    return NextResponse.json(
      { error: 'Webhook 처리 실패' },
      { status: 500 }
    )
  }
}
