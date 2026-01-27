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

// GET: 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { postId } = await params
    const id = parseInt(postId)

    const post = await prisma.cohortPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true, role: true } },
        schedule: {
          include: { course: { select: { title: true } } }
        },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { id: true, name: true, nickname: true, image: true, role: true } },
            replies: {
              include: {
                user: { select: { id: true, name: true, nickname: true, image: true, role: true } }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { comments: true } }
      }
    })

    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const userId = parseInt(session.user.id)

    // 권한 확인
    const isEnrolled = await isEnrolledInSchedule(userId, post.scheduleId)
    const isStaff = await isInstructorOrAdmin(userId, post.scheduleId)

    if (!isEnrolled && !isStaff) {
      return NextResponse.json({ error: '이 게시글에 접근 권한이 없습니다.' }, { status: 403 })
    }

    // 조회수 증가
    await prisma.cohortPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })

    return NextResponse.json({
      post: { ...post, viewCount: post.viewCount + 1 },
      isOwner: post.userId === userId,
      isStaff
    })
  } catch (error) {
    console.error('게시글 상세 조회 오류:', error)
    return NextResponse.json({ error: '게시글 조회 실패' }, { status: 500 })
  }
}

// PUT: 게시글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { postId } = await params
    const id = parseInt(postId)
    const { title, content, isNotice } = await request.json()

    const post = await prisma.cohortPost.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const userId = parseInt(session.user.id)
    const isStaff = await isInstructorOrAdmin(userId, post.scheduleId)

    // 작성자 또는 관리자/강사만 수정 가능
    if (post.userId !== userId && !isStaff) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    // 공지사항 설정은 강사/관리자만
    const updateData: any = { title, content }
    if (isStaff && typeof isNotice === 'boolean') {
      updateData.isNotice = isNotice
    }

    const updatedPost = await prisma.cohortPost.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true, role: true } }
      }
    })

    return NextResponse.json({ success: true, post: updatedPost })
  } catch (error) {
    console.error('게시글 수정 오류:', error)
    return NextResponse.json({ error: '게시글 수정 실패' }, { status: 500 })
  }
}

// DELETE: 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { postId } = await params
    const id = parseInt(postId)

    const post = await prisma.cohortPost.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const userId = parseInt(session.user.id)
    const isStaff = await isInstructorOrAdmin(userId, post.scheduleId)

    // 작성자 또는 관리자/강사만 삭제 가능
    if (post.userId !== userId && !isStaff) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.cohortPost.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('게시글 삭제 오류:', error)
    return NextResponse.json({ error: '게시글 삭제 실패' }, { status: 500 })
  }
}
