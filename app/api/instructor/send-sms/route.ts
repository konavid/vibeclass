import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'

// POST /api/instructor/send-sms - 강사가 자기 수강생에게 SMS 발송
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 강사 정보 조회
    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    if (!instructor) {
      return NextResponse.json(
        { success: false, error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      courseId,      // 강의 ID (필수)
      scheduleId,    // 특정 기수 (선택사항)
      message
    } = body

    if (!message) {
      return NextResponse.json(
        { success: false, error: '메시지 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: '메시지는 2000자 이하로 입력해주세요' },
        { status: 400 }
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: '강의를 선택해주세요' },
        { status: 400 }
      )
    }

    // 해당 강의가 강사의 강의인지 확인
    const course = await prisma.course.findFirst({
      where: {
        id: parseInt(courseId),
        instructorId: instructor.id
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: '해당 강의에 접근 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 수강생 조회 (전화번호가 있는 사용자만)
    const enrollmentWhere: {
      courseId: number
      status: { in: string[] }
      user: { isActive: boolean; phone: { not: null } }
      scheduleId?: number
    } = {
      courseId: parseInt(courseId),
      status: { in: ['confirmed', 'active', 'completed'] },
      user: {
        isActive: true,
        phone: { not: null }
      }
    }

    if (scheduleId) {
      enrollmentWhere.scheduleId = parseInt(scheduleId)
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: { user: { select: { phone: true, name: true } } }
    })

    const recipients = enrollments
      .filter(e => e.user.phone)
      .map(e => ({ phone: e.user.phone!, name: e.user.name }))

    // 중복 전화번호 제거
    const uniqueRecipients = recipients.filter(
      (recipient, index, self) =>
        index === self.findIndex(r => r.phone.replace(/-/g, '') === recipient.phone.replace(/-/g, ''))
    )

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        { success: false, error: '수신 가능한 전화번호가 없습니다' },
        { status: 400 }
      )
    }

    // SMS 발송
    const results = {
      success: 0,
      failed: 0,
      total: uniqueRecipients.length
    }
    const errors: string[] = []

    for (const recipient of uniqueRecipients) {
      try {
        const sent = await sendSMS({
          receiver: recipient.phone,
          message
        })

        if (sent) {
          results.success++
        } else {
          results.failed++
          errors.push(`${recipient.phone}${recipient.name ? ` (${recipient.name})` : ''}: 발송 실패`)
        }
      } catch (smsError) {
        console.error(`SMS 발송 실패 (${recipient.phone}):`, smsError)
        results.failed++
        errors.push(`${recipient.phone}: ${smsError instanceof Error ? smsError.message : '알 수 없는 오류'}`)
      }
    }

    // SMS 발송 로그 저장
    try {
      await prisma.smsLog.create({
        data: {
          recipientType: 'enrolled',
          recipientPhone: null,
          recipientCount: uniqueRecipients.length,
          message,
          sentCount: results.success,
          failedCount: results.failed,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          sentBy: parseInt(session.user.id)
        }
      })
    } catch (logError) {
      console.error('SMS 로그 저장 실패:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `SMS 발송 완료: 성공 ${results.success}건, 실패 ${results.failed}건`,
      sent: results.success,
      failed: results.failed,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('강사 SMS 발송 오류:', error)
    return NextResponse.json(
      { success: false, error: 'SMS 발송에 실패했습니다' },
      { status: 500 }
    )
  }
}
