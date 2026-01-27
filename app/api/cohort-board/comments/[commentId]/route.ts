import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 강사 또는 관리자인지 확인
async function isInstructorOrAdmin(userId: number, scheduleId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { instructor: true }
  })

  if (!user) return false
  if (user.role === 'admin') return true

  if (user.instructor) {
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: true }
    })
    return schedule?.course.instructorId === user.instructor.id
  }

  return false
}

// PUT: 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { commentId } = await params
    const id = parseInt(commentId)
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
    }

    const comment = await prisma.cohortComment.findUnique({
      where: { id }
    })

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const userId = parseInt(session.user.id)
    const isStaff = await isInstructorOrAdmin(userId, comment.scheduleId)

    // 작성자 또는 관리자/강사만 수정 가능
    if (comment.userId !== userId && !isStaff) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const updatedComment = await prisma.cohortComment.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true, role: true } }
      }
    })

    return NextResponse.json({ success: true, comment: updatedComment })
  } catch (error) {
    console.error('댓글 수정 오류:', error)
    return NextResponse.json({ error: '댓글 수정 실패' }, { status: 500 })
  }
}

// DELETE: 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { commentId } = await params
    const id = parseInt(commentId)

    const comment = await prisma.cohortComment.findUnique({
      where: { id }
    })

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const userId = parseInt(session.user.id)
    const isStaff = await isInstructorOrAdmin(userId, comment.scheduleId)

    // 작성자 또는 관리자/강사만 삭제 가능
    if (comment.userId !== userId && !isStaff) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.cohortComment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('댓글 삭제 오류:', error)
    return NextResponse.json({ error: '댓글 삭제 실패' }, { status: 500 })
  }
}
