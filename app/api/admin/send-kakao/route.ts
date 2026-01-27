import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAlimtalk, TEMPLATE_CODES, TEMPLATES } from '@/lib/kakao-alimtalk'

// POST /api/admin/send-kakao - 카카오 알림톡 발송
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { recipientType, userId, courseId, scheduleId, role, directPhones, templateCode, customMessage } = body

    // 템플릿 코드 필수
    if (!templateCode) {
      return NextResponse.json({ error: '템플릿을 선택해주세요' }, { status: 400 })
    }

    // 수신자 전화번호 목록 조회
    let recipients: { id: number; name: string; phone: string }[] = []

    if (recipientType === 'all') {
      // 전체 회원 (전화번호 있는 회원만)
      const users = await prisma.user.findMany({
        where: {
          phone: { not: null },
          role: { not: 'admin' }
        },
        select: { id: true, name: true, phone: true }
      })
      recipients = users.filter(u => u.phone).map(u => ({
        id: u.id,
        name: u.name || '회원',
        phone: u.phone!
      }))
    } else if (recipientType === 'single' && userId) {
      // 특정 회원 1명
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, name: true, phone: true }
      })
      if (user && user.phone) {
        recipients = [{ id: user.id, name: user.name || '회원', phone: user.phone }]
      }
    } else if (recipientType === 'enrolled' && courseId) {
      // 특정 강의 수강생
      const whereClause: any = {
        enrollment: {
          schedule: {
            courseId: parseInt(courseId)
          },
          status: 'active'
        }
      }

      if (scheduleId) {
        whereClause.enrollment.scheduleId = parseInt(scheduleId)
      }

      const enrollments = await prisma.enrollment.findMany({
        where: {
          schedule: {
            courseId: parseInt(courseId),
            ...(scheduleId ? { id: parseInt(scheduleId) } : {})
          },
          status: 'active'
        },
        include: {
          user: {
            select: { id: true, name: true, phone: true }
          }
        }
      })

      recipients = enrollments
        .filter(e => e.user.phone)
        .map(e => ({
          id: e.user.id,
          name: e.user.name || '회원',
          phone: e.user.phone!
        }))
    } else if (recipientType === 'role' && role) {
      // 역할별 회원
      const users = await prisma.user.findMany({
        where: {
          role,
          phone: { not: null }
        },
        select: { id: true, name: true, phone: true }
      })
      recipients = users.filter(u => u.phone).map(u => ({
        id: u.id,
        name: u.name || '회원',
        phone: u.phone!
      }))
    } else if (recipientType === 'direct' && directPhones) {
      // 직접 입력
      const phones = directPhones
        .split(/[,\n]/)
        .map((p: string) => p.trim().replace(/-/g, ''))
        .filter((p: string) => p.length >= 10)

      recipients = phones.map((phone: string, idx: number) => ({
        id: 0,
        name: '직접입력',
        phone
      }))
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: '수신자가 없습니다' }, { status: 400 })
    }

    // 중복 제거
    const uniqueRecipients = recipients.filter((r, idx, arr) =>
      arr.findIndex(x => x.phone === r.phone) === idx
    )

    // 템플릿 정보 가져오기
    const template = TEMPLATES[templateCode]
    if (!template) {
      return NextResponse.json({ error: '존재하지 않는 템플릿입니다' }, { status: 400 })
    }

    // 알림톡 발송
    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const recipient of uniqueRecipients) {
      try {
        // 메시지 변수 치환
        let message = template.content.replace('#{회원명}', recipient.name)

        // 커스텀 메시지가 있으면 사용 (변수 치환 후)
        if (customMessage) {
          message = customMessage.replace('#{회원명}', recipient.name)
        }

        const result = await sendAlimtalk({
          receiver: recipient.phone,
          tplCode: templateCode,
          subject: template.name,
          message,
          button: template.buttons?.[0] ? {
            name: template.buttons[0].name,
            linkType: template.buttons[0].linkType as any,
            linkM: template.buttons[0].linkM,
            linkP: template.buttons[0].linkP
          } : undefined,
          failover: true,
          failoverMessage: message.substring(0, 90) // SMS 대체 발송
        })

        if (result.success) {
          sentCount++
        } else {
          failedCount++
          errors.push(`${recipient.name}(${recipient.phone}): ${result.error}`)
        }
      } catch (error) {
        failedCount++
        errors.push(`${recipient.name}(${recipient.phone}): ${(error as Error).message}`)
      }
    }

    // 발송 로그 저장
    await prisma.notificationLog.create({
      data: {
        userId: parseInt(session.user.id),
        type: 'kakao_manual',
        referenceId: 0,
        referenceType: recipientType,
        phone: uniqueRecipients.map(r => r.phone).join(',').substring(0, 255),
        smsSuccess: false,
        kakaoSuccess: sentCount > 0,
        smsMessage: '',
        kakaoMessage: template.content.substring(0, 1000),
        sentAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `카카오 알림톡 발송 완료: 성공 ${sentCount}건, 실패 ${failedCount}건`,
      sent: sentCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('카카오 알림톡 발송 실패:', error)
    return NextResponse.json(
      { error: '카카오 알림톡 발송에 실패했습니다', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET /api/admin/send-kakao - 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 사용 가능한 템플릿 목록
    const templates = Object.entries(TEMPLATES).map(([code, template]) => ({
      code,
      name: template.name,
      content: template.content,
      buttons: template.buttons
    }))

    return NextResponse.json({ templates })

  } catch (error) {
    console.error('템플릿 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '템플릿 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
