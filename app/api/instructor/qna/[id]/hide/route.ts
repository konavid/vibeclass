import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/instructor/qna/[id]/hide - 문의 가리기
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

    // 해당 Q&A 조회
    const qna = await prisma.instructorConsultation.findUnique({
      where: { id: qnaId }
    })

    if (!qna) {
      return NextResponse.json(
        { error: '문의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 본인 문의인지 확인
    if (qna.instructorId !== instructor.id) {
      return NextResponse.json(
        { error: '본인의 문의만 가리기 처리할 수 있습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: '가리기 사유를 입력해주세요' },
        { status: 400 }
      )
    }

    // 가리기 처리
    await prisma.instructorConsultation.update({
      where: { id: qnaId },
      data: {
        status: 'hidden',
        hiddenReason: reason.trim(),
        hiddenAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '문의가 가리기 처리되었습니다.'
    })
  } catch (error) {
    console.error('문의 가리기 실패:', error)
    return NextResponse.json(
      { error: '문의 가리기에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/instructor/qna/[id]/hide - 가리기 해제
export async function DELETE(
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

    // 해당 Q&A 조회
    const qna = await prisma.instructorConsultation.findUnique({
      where: { id: qnaId }
    })

    if (!qna) {
      return NextResponse.json(
        { error: '문의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 본인 문의인지 확인
    if (qna.instructorId !== instructor.id) {
      return NextResponse.json(
        { error: '본인의 문의만 가리기 해제할 수 있습니다' },
        { status: 403 }
      )
    }

    // 가리기 해제
    await prisma.instructorConsultation.update({
      where: { id: qnaId },
      data: {
        status: qna.response ? 'responded' : 'pending',
        hiddenReason: null,
        hiddenAt: null
      }
    })

    return NextResponse.json({
      success: true,
      message: '가리기가 해제되었습니다.'
    })
  } catch (error) {
    console.error('가리기 해제 실패:', error)
    return NextResponse.json(
      { error: '가리기 해제에 실패했습니다' },
      { status: 500 }
    )
  }
}
