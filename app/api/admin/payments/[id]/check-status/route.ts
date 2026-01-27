import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { generatePaymentHash } from '@/lib/payment-utils'

// POST /api/admin/payments/[id]/check-status - 결제 상태 수동 조회
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const paymentId = parseInt(id)

    // 결제 조회
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!payment.billId) {
      return NextResponse.json(
        { success: false, error: '결제 ID가 없습니다.' },
        { status: 400 }
      )
    }

    // 결제선생 상태 조회 API 호출
    const checkUrl = process.env.PAYMENT_TEACHER_CHECK_URL || 'https://erp-api.payssam.kr/if/bill/check'

    const checkData = {
      apikey: process.env.PAYMENT_TEACHER_API_KEY,
      member: process.env.PAYMENT_TEACHER_MEMBER || 'TENMILES',
      merchant: process.env.PAYMENT_TEACHER_MERCHANT || 'TENMILES',
      bill_id: payment.billId
    }

    console.log('Checking payment status:', { billId: payment.billId })

    const response = await axios.post(checkUrl, checkData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('Payment status response:', response.data)

    const { code, msg, data } = response.data

    if (code !== '0000') {
      return NextResponse.json({
        success: false,
        error: msg || '상태 조회 실패',
        response: response.data
      })
    }

    // 결제 상태 업데이트
    if (data && data.appr_state) {
      const apprState = data.appr_state

      let newStatus = payment.status
      if (apprState === '00' || apprState === '10') {
        newStatus = 'confirmed'
      } else if (apprState === '20' || apprState === '21') {
        newStatus = 'cancelled'
      } else if (apprState === '30' || apprState === '31') {
        newStatus = 'failed'
      }

      // 상태가 변경되었으면 업데이트
      if (newStatus !== payment.status) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: newStatus,
            apprState: apprState,
            apprPayType: data.appr_pay_type || null,
            apprDt: data.appr_dt ? new Date(data.appr_dt) : null,
            apprIssuer: data.appr_issuer || null,
            apprIssuerNum: data.appr_issuer_num || null,
            apprNum: data.appr_num || null,
            paidAt: newStatus === 'confirmed' ? new Date() : null
          }
        })

        // Enrollment 상태도 업데이트
        if (newStatus === 'confirmed') {
          await prisma.enrollment.updateMany({
            where: { paymentId: paymentId },
            data: { status: 'confirmed' }
          })
        } else if (newStatus === 'cancelled' || newStatus === 'failed') {
          await prisma.enrollment.updateMany({
            where: { paymentId: paymentId },
            data: { status: 'cancelled' }
          })
        }

        return NextResponse.json({
          success: true,
          message: `결제 상태가 ${newStatus}(으)로 업데이트되었습니다.`,
          previousStatus: payment.status,
          newStatus: newStatus,
          gatewayResponse: data
        })
      }

      return NextResponse.json({
        success: true,
        message: '결제 상태가 동일합니다.',
        status: payment.status,
        gatewayResponse: data
      })
    }

    return NextResponse.json({
      success: true,
      message: '상태 조회 완료',
      response: response.data
    })

  } catch (error: any) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 중 오류가 발생했습니다.',
        details: error.response?.data || error.message
      },
      { status: 500 }
    )
  }
}
