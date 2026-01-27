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

// GET: 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = parseInt(searchParams.get('scheduleId') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!scheduleId) {
      return NextResponse.json({ error: '기수 ID가 필요합니다.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // 권한 확인: 해당 기수 수강생이거나 강사/관리자
    const isEnrolled = await isEnrolledInSchedule(userId, scheduleId)
    const isStaff = await isInstructorOrAdmin(userId, scheduleId)

    if (!isEnrolled && !isStaff) {
      return NextResponse.json({ error: '이 게시판에 접근 권한이 없습니다.' }, { status: 403 })
    }

    // 기수 정보 조회
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: { select: { title: true } } }
    })

    if (!schedule) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 공지사항 (상단 고정)
    const notices = await prisma.cohortPost.findMany({
      where: { scheduleId, isNotice: true },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true, role: true } },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 일반 게시글 (페이징)
    const skip = (page - 1) * limit
    const [posts, total] = await Promise.all([
      prisma.cohortPost.findMany({
        where: { scheduleId, isNotice: false },
        include: {
          user: { select: { id: true, name: true, nickname: true, image: true, role: true } },
          _count: { select: { comments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cohortPost.count({ where: { scheduleId, isNotice: false } })
    ])

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        cohort: schedule.cohort,
        courseTitle: schedule.course.title
      },
      notices,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      isStaff
    })
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error)
    return NextResponse.json({ error: '게시글 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 게시글 작성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { scheduleId, title, content, isNotice } = await request.json()

    if (!scheduleId || !title || !content) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // 권한 확인
    const isEnrolled = await isEnrolledInSchedule(userId, scheduleId)
    const isStaff = await isInstructorOrAdmin(userId, scheduleId)

    if (!isEnrolled && !isStaff) {
      return NextResponse.json({ error: '이 게시판에 글을 작성할 권한이 없습니다.' }, { status: 403 })
    }

    // 공지사항은 강사/관리자만
    if (isNotice && !isStaff) {
      return NextResponse.json({ error: '공지사항은 강사 또는 관리자만 작성할 수 있습니다.' }, { status: 403 })
    }

    const post = await prisma.cohortPost.create({
      data: {
        scheduleId,
        userId,
        title,
        content,
        isNotice: isNotice && isStaff ? true : false
      },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true, role: true } }
      }
    })

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('게시글 작성 오류:', error)
    return NextResponse.json({ error: '게시글 작성 실패' }, { status: 500 })
  }
}
