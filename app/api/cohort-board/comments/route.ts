import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 기수 수강생인지 확인
async function isEnrolledInSchedule(userId: number, scheduleId: number): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      scheduleId,
      status: { in: ['confirmed', 'completed'] }
    }
  })
  return !!enrollment
}

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

// POST: 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { postId, content, parentId } = await request.json()

    if (!postId || !content) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    // 게시글 조회
    const post = await prisma.cohortPost.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const userId = parseInt(session.user.id)

    // 권한 확인
    const isEnrolled = await isEnrolledInSchedule(userId, post.scheduleId)
    const isStaff = await isInstructorOrAdmin(userId, post.scheduleId)

    if (!isEnrolled && !isStaff) {
      return NextResponse.json({ error: '댓글을 작성할 권한이 없습니다.' }, { status: 403 })
    }

    // 대댓글인 경우 부모 댓글 확인
    if (parentId) {
      const parentComment = await prisma.cohortComment.findUnique({
        where: { id: parentId }
      })
      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: '잘못된 부모 댓글입니다.' }, { status: 400 })
      }
      // 대댓글의 대댓글 방지 (1단계만 허용)
      if (parentComment.parentId) {
        return NextResponse.json({ error: '대댓글에는 답글을 달 수 없습니다.' }, { status: 400 })
      }
    }

    const comment = await prisma.cohortComment.create({
      data: {
        postId,
        scheduleId: post.scheduleId,
        userId,
        content,
        parentId: parentId || null
      },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true, role: true } }
      }
    })

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error('댓글 작성 오류:', error)
    return NextResponse.json({ error: '댓글 작성 실패' }, { status: 500 })
  }
}
