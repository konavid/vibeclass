import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateRefundAmount } from '@/lib/payment-utils'
import { sendEnrollmentCancelNotification } from '@/lib/notification'
import axios from 'axios'

/**
 * 수강 취소 API
 * POST /api/enrollments/[id]/cancel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const enrollmentId = parseInt(id)

    if (isNaN(enrollmentId)) {
      return NextResponse.json(
        { success: false, error: '잘못된 수강 ID입니다.' },
        { status: 400 }
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

    // 수강 정보 조회
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true,
        schedule: true,
        payment: true,
        user: true
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: '수강 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인 수강인지 확인 (관리자는 모든 수강 취소 가능)
    if (enrollment.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '본인의 수강만 취소할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 이미 취소된 수강인지 확인
    if (enrollment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '이미 취소된 수강입니다.' },
        { status: 400 }
      )
    }

    // 완료된 수강은 취소 불가
    if (enrollment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '이미 완료된 수강은 취소할 수 없습니다.' },
        { status: 400 }
      )
    }

    const { course, schedule, payment } = enrollment
    const isFree = course.price === 0

    let refundInfo = {
      refundAmount: 0,
      refundRate: 0,
      refundReason: '무료 강의',
      canRefund: true
    }

    // 유료 강의인 경우 환불 금액 계산
    if (!isFree && payment) {
      refundInfo = calculateRefundAmount(
        payment.amount,
        schedule.startDate,
        schedule.endDate
      )

      // 환불 불가능한 경우
      if (!refundInfo.canRefund) {
        return NextResponse.json(
          {
            success: false,
            error: refundInfo.refundReason,
            refundInfo
          },
          { status: 400 }
        )
      }

      // 결제선생 결제 취소 (결제 완료 상태인 경우만)
      if (payment.billId && payment.status === 'confirmed') {
        try {
          await cancelPaymentTeacher(payment.billId, refundInfo.refundAmount)
          console.log('결제선생 취소 성공:', payment.billId)
        } catch (cancelError: any) {
          console.error('결제선생 취소 실패:', cancelError)
          // 결제선생 취소 실패 시 전체 취소 중단
          return NextResponse.json(
            {
              success: false,
              error: '결제 취소 처리 중 오류가 발생했습니다. 고객센터에 문의해 주세요.',
              details: cancelError.message
            },
            { status: 500 }
          )
        }
      }

      // Payment 상태 업데이트
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
          failMessage: `환불: ${refundInfo.refundReason} (${refundInfo.refundAmount.toLocaleString()}원)`
        }
      })
    }

    // Enrollment 상태를 cancelled로 업데이트
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'cancelled' }
    })

    // 취소 알림톡 발송
    try {
      await sendEnrollmentCancelNotification({
        userId: enrollment.user.id,
        phone: enrollment.user.phone || '',
        email: enrollment.user.email || '',
        userName: enrollment.user.nickname || enrollment.user.name,
        courseName: course.title,
        cohort: schedule.cohort,
        refundAmount: refundInfo.refundAmount,
        refundReason: refundInfo.refundReason,
        enrollmentId: enrollment.id
      })
      console.log('취소 알림톡 발송 성공')
    } catch (notificationError) {
      console.error('취소 알림톡 발송 실패:', notificationError)
      // 알림 발송 실패해도 취소는 완료
    }

    return NextResponse.json({
      success: true,
      message: isFree ? '수강이 취소되었습니다.' : '수강이 취소되고 환불이 진행됩니다.',
      refundInfo: isFree ? null : refundInfo
    })

  } catch (error: any) {
    console.error('수강 취소 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '수강 취소 처리 중 오류가 발생했습니다.',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * 환불 정보 미리보기 (취소 전 환불 금액 확인)
 * GET /api/enrollments/[id]/cancel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const enrollmentId = parseInt(id)

    if (isNaN(enrollmentId)) {
      return NextResponse.json(
        { success: false, error: '잘못된 수강 ID입니다.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true,
        schedule: true,
        payment: true
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: '수강 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인 수강인지 확인
    if (enrollment.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { course, schedule, payment } = enrollment
    const isFree = course.price === 0

    // 이미 취소된 수강
    if (enrollment.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: '이미 취소된 수강입니다.',
        canCancel: false
      })
    }

    // 완료된 수강
    if (enrollment.status === 'completed') {
      return NextResponse.json({
        success: false,
        error: '완료된 수강은 취소할 수 없습니다.',
        canCancel: false
      })
    }

    // 무료 강의
    if (isFree) {
      return NextResponse.json({
        success: true,
        canCancel: true,
        isFree: true,
        courseName: course.title,
        cohort: schedule.cohort,
        message: '무료 강의는 즉시 취소됩니다.'
      })
    }

    // 유료 강의 환불 정보 계산
    const refundInfo = calculateRefundAmount(
      payment?.amount || 0,
      schedule.startDate,
      schedule.endDate
    )

    return NextResponse.json({
      success: true,
      canCancel: refundInfo.canRefund,
      isFree: false,
      courseName: course.title,
      cohort: schedule.cohort,
      originalAmount: payment?.amount || 0,
      refundAmount: refundInfo.refundAmount,
      refundRate: refundInfo.refundRate,
      refundReason: refundInfo.refundReason,
      startDate: schedule.startDate,
      endDate: schedule.endDate
    })

  } catch (error: any) {
    console.error('환불 정보 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '환불 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 결제선생 결제 취소 API 호출
 */
async function cancelPaymentTeacher(billId: string, refundAmount: number): Promise<void> {
  const apiUrl = process.env.PAYMENT_TEACHER_API_URL || 'https://erp-api.payssam.kr'
  const apiKey = process.env.PAYMENT_TEACHER_API_KEY

  if (!apiKey) {
    throw new Error('결제선생 API 키가 설정되지 않았습니다.')
  }

  // 취소용 해시 생성: SHA256(bill_id + "," + price)
  const crypto = require('crypto')
  const hashInput = `${billId},${refundAmount}`
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex')

  const cancelData = {
    apikey: apiKey,
    member: process.env.PAYMENT_TEACHER_MEMBER || 'TENMILES',
    merchant: process.env.PAYMENT_TEACHER_MERCHANT || 'TENMILES',
    bill_id: billId,
    price: refundAmount,
    hash: hash
  }

  console.log('결제선생 취소 요청:', {
    url: `${apiUrl}/if/bill/cancel`,
    bill_id: billId,
    price: refundAmount,
    hash: hash
  })

  try {
    const response = await axios.post(`${apiUrl}/if/bill/cancel`, cancelData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('결제선생 취소 응답:', response.data)

    if (response.data.code !== '0000') {
      throw new Error(response.data.msg || '결제 취소 실패')
    }
  } catch (error: any) {
    console.error('결제선생 취소 API 오류:', error.response?.data || error.message)
    throw new Error(error.response?.data?.msg || error.message || '결제 취소 실패')
  }
}
