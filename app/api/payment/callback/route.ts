import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  isPaymentSuccess,
  isPaymentFailed,
  isPaymentCancelled,
  calculateNewEndDate
} from '@/lib/payment-utils'
import { sendEnrollmentCompleteNotification } from '@/lib/notification'

// 결제선생 날짜 형식 파싱 (YYYYMMDDHHmmss -> Date)
function parsePaymentDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr.length !== 14) return null
  try {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    const hour = dateStr.substring(8, 10)
    const minute = dateStr.substring(10, 12)
    const second = dateStr.substring(12, 14)
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Payment callback received:', body)

    const {
      apikey,
      bill_id,
      appr_state,
      appr_pay_type,
      appr_card_type,
      appr_dt,
      appr_origin_dt,
      appr_price,
      appr_issuer,
      appr_issuer_cd,
      appr_issuer_num,
      appr_acquirer_cd,
      appr_acquirer_nm,
      appr_num,
      appr_origin_num,
      appr_res_cd,
      appr_monthly,
      msg
    } = body

    // API 키 검증
    if (apikey !== process.env.PAYMENT_TEACHER_API_KEY) {
      console.error('Invalid API key in callback')
      return NextResponse.json(
        { code: '9999', msg: '잘못된 API 키' },
        { status: 401 }
      )
    }

    // bill_id로 결제 찾기
    const payment = await prisma.payment.findUnique({
      where: { billId: bill_id },
      include: {
        user: true
      }
    })

    if (!payment) {
      console.error('Payment not found for bill_id:', bill_id)
      return NextResponse.json(
        { code: '9999', msg: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 중복 처리 체크
    const existingLog = await prisma.paymentCallbackLog.findFirst({
      where: { billId: bill_id }
    })

    if (existingLog) {
      console.warn('Duplicate callback for bill_id:', bill_id)
      return NextResponse.json({ code: '0000', msg: '이미 처리된 결제입니다.' })
    }

    // 콜백 로그 저장
    await prisma.paymentCallbackLog.create({
      data: {
        paymentId: payment.id,
        apikey,
        billId: bill_id,
        apprState: appr_state,
        apprPayType: appr_pay_type,
        apprCardType: appr_card_type,
        apprDt: parsePaymentDate(appr_dt),
        apprOriginDt: parsePaymentDate(appr_origin_dt),
        apprPrice: appr_price,
        apprIssuer: appr_issuer,
        apprIssueCd: appr_issuer_cd,
        apprIssuerNum: appr_issuer_num,
        apprAcquirerCd: appr_acquirer_cd,
        apprAcquirerNm: appr_acquirer_nm,
        apprNum: appr_num,
        apprOriginNum: appr_origin_num,
        apprResCd: appr_res_cd,
        apprMonthly: appr_monthly,
        message: msg,
        rawData: JSON.stringify(body)
      }
    })

    // 결제 상태별 처리
    if (isPaymentSuccess(appr_state)) {
      // 결제 성공 처리
      console.log('Payment success for bill_id:', bill_id)

      // 현재 종료일 조회 (예: 기존 프리미엄 기간이 있다면)
      // 현재는 구독 개념이므로 기존 payment에서 newEndDate를 가져올 수 있음
      const currentEndDate = payment.newEndDate || null

      // 새 종료일 계산
      const newEndDate = calculateNewEndDate(currentEndDate, payment.months || 1)
      const daysAdded = payment.months ? payment.months * 30 : 30

      // Payment 업데이트
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'confirmed',
          apprState: appr_state,
          apprPayType: appr_pay_type,
          apprCardType: appr_card_type,
          apprDt: parsePaymentDate(appr_dt),
          apprPrice: appr_price,
          apprIssuer: appr_issuer,
          apprIssuerNum: appr_issuer_num,
          apprNum: appr_num,
          apprOriginNum: appr_origin_num,
          apprResCd: appr_res_cd,
          paidAt: new Date(),
          previousEndDate: currentEndDate,
          newEndDate: newEndDate,
          daysAdded: daysAdded
        }
      })

      // Enrollment이 있다면 상태 업데이트 및 알림 발송
      if (payment.courseId) {
        const enrollment = await prisma.enrollment.findFirst({
          where: { paymentId: payment.id },
          include: {
            schedule: {
              include: {
                course: true
              }
            }
          }
        })

        if (enrollment) {
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { status: 'confirmed' }
          })

          // 수강신청 완료 알림 발송 (SMS + 이메일 + 카카오톡)
          const userPhone = payment.kakaoPhone || payment.user.phone
          const userEmail = payment.user.email
          if (enrollment.schedule) {
            try {
              const notificationResult = await sendEnrollmentCompleteNotification({
                userId: payment.userId,
                phone: userPhone || '',
                email: userEmail || '',
                userName: payment.user.nickname || payment.user.name || '회원',
                courseName: enrollment.schedule.course.title,
                cohort: enrollment.schedule.cohort,
                startDate: enrollment.schedule.startDate,
                endDate: enrollment.schedule.endDate,
                amount: parseInt(appr_price) || payment.amount,
                enrollmentId: enrollment.id
              })
              console.log('Enrollment notification sent:', notificationResult)
            } catch (notifyError) {
              console.error('Notification error:', notifyError)
              // 알림 발송 실패해도 결제 처리는 성공으로
            }
          }
        }
      }

      // 영상 구매가 있다면 상태 업데이트
      const videoPurchase = await prisma.videoPurchase.findFirst({
        where: { paymentId: payment.id }
      })

      if (videoPurchase) {
        await prisma.videoPurchase.update({
          where: { id: videoPurchase.id },
          data: {
            status: 'confirmed',
            purchasedAt: new Date()
          }
        })
        console.log('Video purchase confirmed:', videoPurchase.id)
      }

      // 디지털 상품 구매가 있다면 상태 업데이트
      const digitalProductPurchase = await prisma.digitalProductPurchase.findFirst({
        where: { paymentId: payment.id }
      }).catch(() => null) // 테이블이 없을 수 있음

      if (digitalProductPurchase) {
        await prisma.digitalProductPurchase.update({
          where: { id: digitalProductPurchase.id },
          data: {
            status: 'confirmed',
            purchasedAt: new Date()
          }
        })
        console.log('Digital product purchase confirmed:', digitalProductPurchase.id)
      }

      console.log('Payment confirmed successfully:', {
        billId: bill_id,
        userId: payment.userId,
        amount: appr_price,
        newEndDate
      })

      return NextResponse.json({ code: '0000', msg: '결제 완료 처리 성공' })

    } else if (isPaymentCancelled(appr_state)) {
      // 결제 취소 처리
      console.log('Payment cancelled for bill_id:', bill_id)

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'cancelled',
          apprState: appr_state,
          apprDt: parsePaymentDate(appr_dt),
          failMessage: msg
        }
      })

      // Enrollment 취소
      if (payment.courseId) {
        await prisma.enrollment.updateMany({
          where: { paymentId: payment.id },
          data: { status: 'cancelled' }
        })
      }

      // 영상 구매 취소
      await prisma.videoPurchase.updateMany({
        where: { paymentId: payment.id },
        data: { status: 'cancelled' }
      })

      // 디지털 상품 구매 취소
      await prisma.digitalProductPurchase.updateMany({
        where: { paymentId: payment.id },
        data: { status: 'cancelled' }
      }).catch(() => null)

      return NextResponse.json({ code: '0000', msg: '결제 취소 처리 성공' })

    } else if (isPaymentFailed(appr_state)) {
      // 결제 실패 처리
      console.log('Payment failed for bill_id:', bill_id)

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          apprState: appr_state,
          apprDt: parsePaymentDate(appr_dt),
          failMessage: msg
        }
      })

      return NextResponse.json({ code: '0000', msg: '결제 실패 처리 완료' })

    } else {
      // 알 수 없는 상태
      console.warn('Unknown payment state:', appr_state)

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          apprState: appr_state,
          failMessage: `알 수 없는 상태: ${appr_state} - ${msg}`
        }
      })

      return NextResponse.json({ code: '0000', msg: '콜백 수신 완료' })
    }

  } catch (error: any) {
    console.error('Payment callback error:', error)
    return NextResponse.json(
      { code: '9999', msg: '콜백 처리 중 오류 발생', error: error.message },
      { status: 500 }
    )
  }
}
