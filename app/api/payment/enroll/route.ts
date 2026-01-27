import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  generateBillId,
  generatePaymentHash,
  normalizePhoneNumber,
  getPaymentExpireDate,
} from '@/lib/payment-utils'
import { sendEnrollmentCompleteNotification } from '@/lib/notification'
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
    const { courseId, scheduleId, kakaoPhone, nickname, customerMemo } = body

    if (!courseId || !scheduleId || !kakaoPhone || !nickname) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
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

    // 강의 조회
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: {
        category: true,
        instructor: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: '강의를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 일정 조회
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: parseInt(scheduleId) }
    })

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: '일정을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 진행중인 강의는 수강신청 불가
    if (schedule.status === 'ongoing') {
      return NextResponse.json(
        { success: false, error: '이미 진행중인 강의는 수강신청이 마감되었습니다.' },
        { status: 400 }
      )
    }

    // 완료된 강의는 수강신청 불가
    if (schedule.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '이미 종료된 강의입니다.' },
        { status: 400 }
      )
    }

    // 취소된 강의는 수강신청 불가
    if (schedule.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '취소된 강의입니다.' },
        { status: 400 }
      )
    }

    // 무료 강의 처리 (price === 0)
    if (course.price === 0) {
      // 중복 신청 체크 - confirmed 상태만 체크
      const confirmedEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId: user.id,
          courseId: course.id,
          scheduleId: schedule.id,
          status: 'confirmed'
        }
      })

      if (confirmedEnrollment) {
        return NextResponse.json(
          { success: false, error: '이미 신청 완료한 강의입니다.' },
          { status: 400 }
        )
      }

      // 기존 pending 상태의 enrollment 취소 처리
      const existingPendingEnrollments = await prisma.enrollment.findMany({
        where: {
          userId: user.id,
          courseId: course.id,
          scheduleId: schedule.id,
          status: { in: ['pending', 'processing'] }
        }
      })

      for (const existingEnrollment of existingPendingEnrollments) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'cancelled' }
        })
      }

      // 무료 강의는 바로 confirmed 상태로 Enrollment 생성
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          scheduleId: schedule.id,
          status: 'confirmed'
        }
      })

      // 알림톡 발송
      try {
        await sendEnrollmentCompleteNotification({
          userId: user.id,
          phone: normalizedPhone,
          email: user.email || '',
          userName: nickname,
          courseName: course.title,
          cohort: schedule.cohort,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          amount: 0,
          enrollmentId: enrollment.id
        })
        console.log('Free course enrollment notification sent:', {
          enrollmentId: enrollment.id,
          courseId: course.id,
          userId: user.id
        })
      } catch (notificationError) {
        console.error('Failed to send free course enrollment notification:', notificationError)
        // 알림 발송 실패해도 수강신청은 완료
      }

      return NextResponse.json({
        success: true,
        enrollment_id: enrollment.id,
        message: '무료 강의 수강신청이 완료되었습니다.',
        amount: 0,
        isFree: true
      })
    }

    // 중복 신청 체크 - confirmed 상태만 체크
    const confirmedEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        scheduleId: schedule.id,
        status: 'confirmed'
      }
    })

    if (confirmedEnrollment) {
      return NextResponse.json(
        { success: false, error: '이미 신청 완료한 강의입니다.' },
        { status: 400 }
      )
    }

    // 기존 pending 상태의 enrollment와 payment 취소 처리
    const existingPendingEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        courseId: course.id,
        scheduleId: schedule.id,
        status: { in: ['pending', 'processing'] }
      },
      include: {
        payment: true
      }
    })

    // 기존 pending/processing 상태의 enrollment들을 cancelled로 변경
    for (const existingEnrollment of existingPendingEnrollments) {
      await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: 'cancelled' }
      })

      // 연결된 payment도 cancelled로 변경
      if (existingEnrollment.paymentId) {
        await prisma.payment.update({
          where: { id: existingEnrollment.paymentId },
          data: { status: 'cancelled' }
        })
      }
    }

    // Payment 레코드 생성 (pending 상태)
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        amount: course.price,
        method: 'kakao',
        status: 'pending',
        kakaoPhone: normalizedPhone,
        months: 1, // 강의는 1회성이므로 1로 설정
        description: `${course.title} 수강료 (${nickname})`,
        customerMemo: customerMemo || null
      }
    })

    // Enrollment 레코드 생성 (pending 상태)
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        scheduleId: schedule.id,
        paymentId: payment.id,
        status: 'pending'
      }
    })

    // bill_id 생성 (20자리)
    const billId = generateBillId(payment.id, 20)

    // 해시 생성
    const hashValue = generatePaymentHash(billId, course.price, normalizedPhone)

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
        product_nm: course.title,
        message: `${course.title} 수강료 결제 안내드립니다.`,
        member_nm: nickname,
        phone: normalizedPhone,
        price: course.price,
        hash: hashValue,
        expire_dt: expireDate,
        callbackURL: process.env.PAYMENT_CALLBACK_URL || 'https://edu.tenmiles.ai/api/payment/callback'
      }
    }

    console.log('Sending payment request for enrollment:', JSON.stringify(paymentData, null, 2))

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

      // Enrollment도 실패 처리
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: 'cancelled' }
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

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: 'cancelled' }
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

    console.log('Enrollment payment request success:', {
      billId,
      enrollmentId: enrollment.id,
      paymentUrl: paymentUrl
    })

    return NextResponse.json({
      success: true,
      bill_id: billId,
      payment_url: paymentUrl,
      enrollment_id: enrollment.id,
      message: '카카오톡으로 결제 링크가 전송되었습니다.',
      amount: course.price
    })

  } catch (error: any) {
    console.error('Enrollment payment request error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '수강 신청 처리 중 오류가 발생했습니다.',
        details: error.message
      },
      { status: 500 }
    )
  }
}
