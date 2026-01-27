import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'

// GET /api/courses/[id]/qna - 강의 Q&A 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const courseId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: '유효하지 않은 강의 ID입니다' },
        { status: 400 }
      )
    }

    // 개수만 조회하는 경우 (탭에 표시용)
    if (countOnly) {
      const count = await prisma.instructorConsultation.count({
        where: {
          courseId,
          status: { not: 'hidden' }
        }
      })

      return NextResponse.json({
        success: true,
        count
      })
    }

    // 강의 존재 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json(
        { error: '강의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 모든 Q&A 조회 (hidden 제외)
    const qnas = await prisma.instructorConsultation.findMany({
      where: {
        courseId,
        status: { not: 'hidden' }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      qnas
    })
  } catch (error) {
    console.error('Q&A 목록 조회 실패:', error)
    return NextResponse.json(
      { error: 'Q&A 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/courses/[id]/qna - 강의 Q&A 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const courseId = parseInt(id)

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: '유효하지 않은 강의 ID입니다' },
        { status: 400 }
      )
    }

    // 강의 및 강사 정보 조회
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: '강의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!course.instructor) {
      return NextResponse.json(
        { error: '강사 정보가 없는 강의입니다' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, message, isPublic } = body

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: '문의 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // Q&A 생성
    const qna = await prisma.instructorConsultation.create({
      data: {
        userId: parseInt(session.user.id),
        instructorId: course.instructor.id,
        courseId,
        title: title || null,
        message: message.trim(),
        isPublic: isPublic || false,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    })

    // 강사에게 SMS 발송
    if (course.instructor.phone) {
      const smsMessage = `[바이브클래스] 새로운 문의가 도착했습니다.\n강의: ${course.title}\n문의자: ${session.user.name}\n내용: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}\n\n강사페이지에서 확인해주세요.`

      try {
        await sendSMS({
          receiver: course.instructor.phone,
          message: smsMessage
        })
        console.log('강사에게 SMS 발송 완료:', course.instructor.phone)
      } catch (smsError) {
        console.error('SMS 발송 실패:', smsError)
        // SMS 실패해도 문의는 등록됨
      }
    }

    return NextResponse.json({
      success: true,
      qna,
      message: '문의가 등록되었습니다. 강사님이 곧 답변해 드릴 예정입니다.'
    })
  } catch (error: any) {
    console.error('Q&A 등록 실패:', error)
    console.error('에러 상세:', error?.message, error?.code)
    return NextResponse.json(
      { error: 'Q&A 등록에 실패했습니다', details: error?.message },
      { status: 500 }
    )
  }
}
