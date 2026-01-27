import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'

// POST /api/admin/send-sms - 관리자가 회원에게 SMS 발송
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      recipientType, // 'all' | 'single' | 'enrolled' | 'role' | 'direct'
      userId,        // recipientType이 'single'일 때
      courseId,      // recipientType이 'enrolled'일 때
      scheduleId,    // recipientType이 'enrolled'일 때 (특정 기수, 선택사항)
      role,          // recipientType이 'role'일 때 ('instructor' | 'customer')
      directPhones,  // recipientType이 'direct'일 때
      message
    } = body

    if (!message) {
      return NextResponse.json(
        { error: '메시지 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: '메시지는 2000자 이하로 입력해주세요' },
        { status: 400 }
      )
    }

    let recipients: { phone: string; name?: string }[] = []

    // 수신자 결정
    switch (recipientType) {
      case 'all':
        // 모든 회원 (활성화되고 전화번호가 있는 사용자만)
        const allUsers = await prisma.user.findMany({
          where: {
            isActive: true,
            phone: { not: null }
          },
          select: { phone: true, name: true }
        })
        recipients = allUsers
          .filter(u => u.phone)
          .map(u => ({ phone: u.phone!, name: u.name }))
        break

      case 'single':
        // 특정 회원 1명
        if (!userId) {
          return NextResponse.json(
            { error: '회원을 선택해주세요' },
            { status: 400 }
          )
        }
        const user = await prisma.user.findUnique({
          where: {
            id: parseInt(userId),
            isActive: true
          },
          select: { phone: true, name: true }
        })
        if (user?.phone) {
          recipients = [{ phone: user.phone, name: user.name }]
        }
        break

      case 'enrolled':
        // 특정 강의 수강생 (활성화되고 전화번호가 있는 사용자만)
        if (!courseId) {
          return NextResponse.json(
            { error: '강의를 선택해주세요' },
            { status: 400 }
          )
        }
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
        // 특정 기수가 선택된 경우
        if (scheduleId) {
          enrollmentWhere.scheduleId = parseInt(scheduleId)
        }
        const enrollments = await prisma.enrollment.findMany({
          where: enrollmentWhere,
          include: { user: { select: { phone: true, name: true } } }
        })
        recipients = enrollments
          .filter(e => e.user.phone)
          .map(e => ({ phone: e.user.phone!, name: e.user.name }))
        break

      case 'role':
        // 특정 역할 (강사 또는 일반 회원)
        if (!role) {
          return NextResponse.json(
            { error: '역할을 선택해주세요' },
            { status: 400 }
          )
        }
        const roleUsers = await prisma.user.findMany({
          where: {
            role,
            isActive: true,
            phone: { not: null }
          },
          select: { phone: true, name: true }
        })
        recipients = roleUsers
          .filter(u => u.phone)
          .map(u => ({ phone: u.phone!, name: u.name }))
        break

      case 'direct':
        // 직접 입력된 전화번호
        if (!directPhones) {
          return NextResponse.json(
            { error: '전화번호를 입력해주세요' },
            { status: 400 }
          )
        }
        // 쉼표, 줄바꿈, 세미콜론으로 구분된 전화번호 파싱
        const phoneList = directPhones
          .split(/[,;\n\r]+/)
          .map((phone: string) => phone.trim().replace(/-/g, ''))
          .filter((phone: string) => phone.length > 0)

        // 전화번호 형식 검증 (한국 전화번호: 010, 011, 016, 017, 018, 019)
        const phoneRegex = /^01[0-9]\d{7,8}$/
        const invalidPhones = phoneList.filter((phone: string) => !phoneRegex.test(phone))

        if (invalidPhones.length > 0) {
          return NextResponse.json(
            { error: `잘못된 전화번호 형식: ${invalidPhones.join(', ')}` },
            { status: 400 }
          )
        }

        recipients = phoneList.map((phone: string) => ({ phone }))
        break

      default:
        return NextResponse.json(
          { error: '수신자 유형을 선택해주세요' },
          { status: 400 }
        )
    }

    // 중복 전화번호 제거
    const uniqueRecipients = recipients.filter(
      (recipient, index, self) =>
        index === self.findIndex(r => r.phone.replace(/-/g, '') === recipient.phone.replace(/-/g, ''))
    )

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        { error: '수신 가능한 전화번호가 없습니다' },
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
          recipientType,
          recipientPhone: recipientType === 'single' ? uniqueRecipients[0]?.phone : null,
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
      // 로그 저장 실패해도 발송 결과는 반환
    }

    return NextResponse.json({
      message: `SMS 발송 완료: 성공 ${results.success}건, 실패 ${results.failed}건`,
      sent: results.success,
      failed: results.failed,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('SMS 발송 오류:', error)
    return NextResponse.json(
      { error: 'SMS 발송에 실패했습니다' },
      { status: 500 }
    )
  }
}
