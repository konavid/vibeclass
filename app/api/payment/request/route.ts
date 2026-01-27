import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  generateBillId,
  generatePaymentHash,
  calculatePaymentAmount,
  normalizePhoneNumber,
  getPaymentExpireDate,
  generatePaymentDescription
} from '@/lib/payment-utils'
import axios from 'axios'

export async function POST(request: NextRequest) {
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

    // 요청 데이터 검증
    const body = await request.json()
    const { kakaoPhone, months, courseId } = body

    if (!kakaoPhone || !months) {
      return NextResponse.json(
        { success: false, error: '전화번호와 구독 기간은 필수입니다.' },
        { status: 400 }
      )
    }

    if (months < 1 || months > 12) {
      return NextResponse.json(
        { success: false, error: '구독 기간은 1~12개월 사이여야 합니다.' },
        { status: 400 }
      )
    }

    // 전화번호 정제
    let normalizedPhone: string
    try {
      normalizedPhone = normalizePhoneNumber(kakaoPhone)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      )
    }

    // 가격 계산
    const { finalAmount } = calculatePaymentAmount(months)

    // 강의 정보 조회 (선택적)
    let course = null
    if (courseId) {
      course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
      })
    }

    // 결제 레코드 생성 (pending 상태)
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: courseId ? parseInt(courseId) : null,
        amount: finalAmount,
        method: 'kakao',
        status: 'pending',
        kakaoPhone: normalizedPhone,
        months: months,
        description: generatePaymentDescription(months, course?.title)
      }
    })

    // bill_id 생성 (20자리)
    const billId = generateBillId(payment.id, 20)

    // 해시 생성
    const hashValue = generatePaymentHash(billId, finalAmount, normalizedPhone)

    // 만료일 계산 (3일 후)
    const expireDate = getPaymentExpireDate()

    // 결제선생 API 호출
    const baseUrl = process.env.PAYMENT_TEACHER_API_URL || 'https://erp-api.payssam.kr'
    const paymentTeacherUrl = `${baseUrl}/if/bill/send`

    const paymentData = {
      apikey: process.env.PAYMENT_TEACHER_API_KEY,
      member: process.env.PAYMENT_TEACHER_MEMBER || 'TENMILES',
      merchant: process.env.PAYMENT_TEACHER_MERCHANT || 'TENMILES',
      bill: {
        bill_id: billId,
        product_nm: course?.title || '교육 플랫폼 구독',
        message: `${months}개월 구독 결제 안내드립니다.`,
        member_nm: user.name,
        phone: normalizedPhone,
        price: finalAmount,
        hash: hashValue,
        expire_dt: expireDate,
        callbackURL: process.env.PAYMENT_CALLBACK_URL || 'https://edu.tenmiles.ai/api/payment/callback'
      }
    }

    console.log('Sending payment request to PaymentTeacher:', {
      billId,
      amount: finalAmount,
      phone: normalizedPhone
    })

    let paymentResponse
    try {
      paymentResponse = await axios.post(paymentTeacherUrl, paymentData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (axiosError: any) {
      console.error('PaymentTeacher API error:', axiosError.response?.data || axiosError.message)

      // 결제 실패 처리
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failMessage: axiosError.response?.data?.msg || axiosError.message
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: '결제 요청 중 오류가 발생했습니다.',
          details: axiosError.response?.data || axiosError.message
        },
        { status: 500 }
      )
    }

    const { code, msg, payment_url, shortURL } = paymentResponse.data
    const paymentUrl = payment_url || shortURL

    if (code !== '0000') {
      // 결제선생 API 오류
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failMessage: msg
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: '결제 요청이 실패했습니다.',
          message: msg
        },
        { status: 400 }
      )
    }

    // bill_id 업데이트
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        billId: billId,
        billUrl: paymentUrl,
        status: 'processing'
      }
    })

    console.log('Payment request success:', {
      billId,
      paymentUrl: paymentUrl
    })

    return NextResponse.json({
      success: true,
      bill_id: billId,
      payment_url: paymentUrl,
      message: '카카오톡으로 결제 링크가 전송되었습니다.',
      amount: finalAmount,
      months: months
    })

  } catch (error: any) {
    console.error('Payment request error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '결제 요청 처리 중 오류가 발생했습니다.',
        details: error.message
      },
      { status: 500 }
    )
  }
}
