import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST /api/admin/send-email - 관리자가 회원에게 이메일 발송
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
      role,          // recipientType이 'role'일 때 ('instructor' | 'user')
      directEmails,  // recipientType이 'direct'일 때
      subject,
      html,
      text
    } = body

    if (!subject || !html) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    let recipients: string[] = []

    // 수신자 결정
    switch (recipientType) {
      case 'all':
        // 모든 회원 (활성화된 사용자만)
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { email: true }
        })
        recipients = allUsers.map(u => u.email)
        break

      case 'single':
        // 특정 회원 1명 (활성화된 사용자만)
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
          select: { email: true }
        })
        if (user) recipients = [user.email]
        break

      case 'enrolled':
        // 특정 강의 수강생 (활성화된 사용자만)
        if (!courseId) {
          return NextResponse.json(
            { error: '강의를 선택해주세요' },
            { status: 400 }
          )
        }
        const enrollmentWhere: {
          courseId: number
          status: { in: string[] }
          user: { isActive: boolean }
          scheduleId?: number
        } = {
          courseId: parseInt(courseId),
          status: { in: ['confirmed', 'active', 'completed'] },
          user: { isActive: true }
        }
        // 특정 기수가 선택된 경우
        if (scheduleId) {
          enrollmentWhere.scheduleId = parseInt(scheduleId)
        }
        const enrollments = await prisma.enrollment.findMany({
          where: enrollmentWhere,
          include: { user: { select: { email: true } } }
        })
        recipients = enrollments.map(e => e.user.email)
        break

      case 'role':
        // 특정 역할 (강사 또는 일반 회원, 활성화된 사용자만)
        if (!role) {
          return NextResponse.json(
            { error: '역할을 선택해주세요' },
            { status: 400 }
          )
        }
        const roleUsers = await prisma.user.findMany({
          where: {
            role,
            isActive: true
          },
          select: { email: true }
        })
        recipients = roleUsers.map(u => u.email)
        break

      case 'direct':
        // 직접 입력된 이메일 주소
        if (!directEmails) {
          return NextResponse.json(
            { error: '이메일 주소를 입력해주세요' },
            { status: 400 }
          )
        }
        // 쉼표, 줄바꿈, 세미콜론으로 구분된 이메일 파싱
        const emailList = directEmails
          .split(/[,;\n\r]+/)
          .map((email: string) => email.trim())
          .filter((email: string) => email.length > 0)

        // 간단한 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const invalidEmails = emailList.filter((email: string) => !emailRegex.test(email))

        if (invalidEmails.length > 0) {
          return NextResponse.json(
            { error: `잘못된 이메일 형식: ${invalidEmails.join(', ')}` },
            { status: 400 }
          )
        }

        recipients = emailList
        break

      default:
        return NextResponse.json(
          { error: '수신자 유형을 선택해주세요' },
          { status: 400 }
        )
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: '수신자가 없습니다' },
        { status: 400 }
      )
    }

    // 이메일 발송 (한 명씩 발송)
    const results = {
      success: 0,
      failed: 0,
      total: recipients.length
    }
    const errors: string[] = []

    for (const recipient of recipients) {
      try {
        const sent = await sendEmail({
          to: recipient,
          subject,
          html,
          text
        })

        if (sent) {
          results.success++
        } else {
          results.failed++
          errors.push(`${recipient}: 발송 실패`)
        }
      } catch (emailError) {
        console.error(`이메일 발송 실패 (${recipient}):`, emailError)
        results.failed++
        errors.push(`${recipient}: ${emailError instanceof Error ? emailError.message : '알 수 없는 오류'}`)
      }
    }

    // 이메일 발송 로그 저장
    try {
      await prisma.emailLog.create({
        data: {
          recipientType,
          recipientEmail: recipientType === 'single' ? recipients[0] : null,
          recipientCount: recipients.length,
          subject,
          content: html,
          sentCount: results.success,
          failedCount: results.failed,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          sentBy: parseInt(session.user.id)
        }
      })
    } catch (logError) {
      console.error('이메일 로그 저장 실패:', logError)
      // 로그 저장 실패해도 발송 결과는 반환
    }

    return NextResponse.json({
      message: `이메일 발송 완료: 성공 ${results.success}건, 실패 ${results.failed}건`,
      sent: results.success,
      failed: results.failed,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('이메일 발송 오류:', error)
    return NextResponse.json(
      { error: '이메일 발송에 실패했습니다' },
      { status: 500 }
    )
  }
}
