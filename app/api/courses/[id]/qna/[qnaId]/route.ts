import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/courses/[id]/qna/[qnaId] - Q&A 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qnaId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id, qnaId } = await params
    const courseId = parseInt(id)
    const consultationId = parseInt(qnaId)

    if (isNaN(courseId) || isNaN(consultationId)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID입니다' },
        { status: 400 }
      )
    }

    // Q&A 조회
    const qna = await prisma.instructorConsultation.findUnique({
      where: { id: consultationId },
      include: {
        course: {
          include: {
            instructor: true
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

    // 권한 확인: 본인, 관리자, 또는 해당 강사만 삭제 가능
    const userId = parseInt(session.user.id)
    const isOwner = qna.userId === userId
    const isAdmin = session.user.role === 'admin'
    const isInstructor = qna.course?.instructor?.userId === userId

    if (!isOwner && !isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다' },
        { status: 403 }
      )
    }

    // Q&A 삭제
    await prisma.instructorConsultation.delete({
      where: { id: consultationId }
    })

    return NextResponse.json({
      success: true,
      message: '문의가 삭제되었습니다'
    })
  } catch (error: any) {
    console.error('Q&A 삭제 실패:', error)
    return NextResponse.json(
      { error: 'Q&A 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
