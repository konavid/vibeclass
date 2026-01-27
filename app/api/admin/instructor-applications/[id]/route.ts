import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'

// 강사 신청 상태별 SMS 메시지 정의
const STATUS_SMS_MESSAGES: Record<string, string> = {
  reviewing: '[바이브클래스] 강사 신청서가 검토 중입니다. 검토가 완료되면 다시 안내드리겠습니다.',
  approved: '[바이브클래스] 축하합니다! 강사 신청이 승인되었습니다. 바이브클래스에서 서류 제출을 진행해주세요. vibeclass.kr',
  rejected: '[바이브클래스] 강사 신청이 승인되지 않았습니다. 자세한 내용은 바이브클래스에서 확인해주세요. vibeclass.kr',
  contract_pending: '[바이브클래스] 서류 검토가 완료되었습니다. 바이브클래스에서 계약서 서명을 진행해주세요. vibeclass.kr',
  contract_completed: '[바이브클래스] 계약이 완료되었습니다. 강사 등록이 완료되어 이제 강의를 등록할 수 있습니다. vibeclass.kr'
}

// 상태 변경 시 SMS 발송 헬퍼 함수
async function sendStatusChangeSMS(phone: string | null, status: string): Promise<void> {
  if (!phone) {
    console.log('전화번호가 없어 SMS 발송 생략:', status)
    return
  }

  const message = STATUS_SMS_MESSAGES[status]
  if (!message) {
    console.log('SMS 메시지 템플릿 없음:', status)
    return
  }

  try {
    const result = await sendSMS({ receiver: phone, message })
    console.log(`강사 신청 상태 변경 SMS 발송 (${status}):`, result ? '성공' : '실패')
  } catch (error) {
    console.error('강사 신청 상태 변경 SMS 발송 오류:', error)
  }
}

// GET: 개별 강사 신청 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    const application = await prisma.instructorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            createdAt: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ success: false, error: '신청을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, application })
  } catch (error: any) {
    console.error('강사 신청 조회 실패:', error)
    return NextResponse.json({ success: false, error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PUT: 강사 신청 상태 변경 (합격/불합격/계약완료 등)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const application = await prisma.instructorApplication.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!application) {
      return NextResponse.json({ success: false, error: '신청을 찾을 수 없습니다.' }, { status: 404 })
    }

    const body = await request.json()
    const { action, reviewNote, adminNote, contractFileUrl, contractPeriodMonths, contractType } = body

    let updateData: any = {}

    switch (action) {
      case 'reviewing':
        // 검토중으로 변경
        updateData = {
          status: 'reviewing',
          reviewedBy: admin.id,
          reviewedAt: new Date()
        }
        break

      case 'approve':
        // 합격
        if (!reviewNote) {
          return NextResponse.json({ success: false, error: '합격 사유를 입력해주세요.' }, { status: 400 })
        }
        updateData = {
          status: 'approved',
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          reviewNote,
          adminNote: adminNote || null
        }
        break

      case 'reject':
        // 불합격
        if (!reviewNote) {
          return NextResponse.json({ success: false, error: '불합격 사유를 입력해주세요.' }, { status: 400 })
        }
        updateData = {
          status: 'rejected',
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          reviewNote,
          adminNote: adminNote || null
        }
        break

      case 'contract_start':
        // 계약 진행 - 서류 검토 완료 후 계약서 서명 요청
        if (application.status !== 'documents_submitted') {
          return NextResponse.json({ success: false, error: '서류 제출 완료 상태에서만 계약 진행이 가능합니다.' }, { status: 400 })
        }
        updateData = {
          status: 'contract_pending',
          contractType: contractType || 'independent',
          contractPeriodMonths: contractPeriodMonths || 12
        }
        break

      case 'contract_complete':
        // 계약 완료 - 강사로 전환
        if (application.status !== 'contract_pending') {
          return NextResponse.json({ success: false, error: '계약서 서명 대기 상태에서만 계약 완료가 가능합니다.' }, { status: 400 })
        }

        // 트랜잭션으로 처리: 신청 상태 변경 + 강사 생성 + 사용자 role 변경
        const result = await prisma.$transaction(async (tx) => {
          // 1. 신청 상태를 계약 완료로 변경
          const updatedApplication = await tx.instructorApplication.update({
            where: { id },
            data: {
              status: 'contract_completed',
              contractSignedAt: new Date(),
              contractFileUrl: contractFileUrl || null
            }
          })

          // 2. 강사 테이블에 추가
          const newInstructor = await tx.instructor.create({
            data: {
              userId: application.userId,
              name: application.docName || application.name,
              email: application.user.email,
              phone: application.docPhone || application.user.phone || null,
              bio: application.bio,
              expertise: application.field,
              imageUrl: application.photoUrl || application.user.image
            }
          })

          // 3. 사용자 role을 instructor로 변경
          await tx.user.update({
            where: { id: application.userId },
            data: { role: 'instructor' }
          })

          return { application: updatedApplication, instructor: newInstructor }
        })

        // 계약 완료 SMS 발송
        const userPhone = application.docPhone || application.user.phone
        sendStatusChangeSMS(userPhone, 'contract_completed')

        return NextResponse.json({
          success: true,
          application: result.application,
          instructor: result.instructor,
          message: '계약이 완료되었습니다. 강사로 등록되었습니다.'
        })

      default:
        return NextResponse.json({ success: false, error: '유효하지 않은 작업입니다.' }, { status: 400 })
    }

    const updatedApplication = await prisma.instructorApplication.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // 상태 변경 SMS 발송
    const userPhone = application.docPhone || application.user.phone
    sendStatusChangeSMS(userPhone, updatedApplication.status)

    return NextResponse.json({ success: true, application: updatedApplication })
  } catch (error: any) {
    console.error('강사 신청 상태 변경 실패:', error)
    return NextResponse.json({ success: false, error: '상태 변경 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
