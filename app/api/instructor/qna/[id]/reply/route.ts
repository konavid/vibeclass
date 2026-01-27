import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'

// POST /api/instructor/qna/[id]/reply - 강사가 Q&A에 답변
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { id } = await params
    const qnaId = parseInt(id)

    if (isNaN(qnaId)) {
      return NextResponse.json(
        { error: '유효하지 않은 문의 ID입니다' },
        { status: 400 }
      )
    }

    // 강사 정보 조회
    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    if (!instructor) {
      return NextResponse.json(
        { error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Q&A 조회 및 권한 확인
    const qna = await prisma.instructorConsultation.findUnique({
      where: { id: qnaId },
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    })

    if (!qna) {
      return NextResponse.json(
        { error: '문의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (qna.instructorId !== instructor.id) {
      return NextResponse.json(
        { error: '이 문의에 답변할 권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { response, isPublic } = body

    if (!response || response.trim() === '') {
      return NextResponse.json(
        { error: '답변 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // 답변 저장
    const updatedQna = await prisma.instructorConsultation.update({
      where: { id: qnaId },
      data: {
        response: response.trim(),
        status: 'responded',
        respondedAt: new Date(),
        isPublic: isPublic !== undefined ? isPublic : qna.isPublic
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    })

    // 문의자에게 SMS 발송
    if (qna.user.phone) {
      const courseName = qna.course?.title || '강의'
      const smsMessage = `[바이브클래스] ${instructor.name} 강사님이 문의에 답변하셨습니다.\n강의: ${courseName}\n\n홈페이지에서 확인해주세요.`

      try {
        await sendSMS({
          receiver: qna.user.phone,
          message: smsMessage
        })
        console.log('문의자에게 SMS 발송 완료:', qna.user.phone)
      } catch (smsError) {
        console.error('SMS 발송 실패:', smsError)
      }
    }

    return NextResponse.json({
      success: true,
      qna: updatedQna,
      message: '답변이 등록되었습니다.'
    })
  } catch (error) {
    console.error('Q&A 답변 실패:', error)
    return NextResponse.json(
      { error: '답변 등록에 실패했습니다' },
      { status: 500 }
    )
  }
}
