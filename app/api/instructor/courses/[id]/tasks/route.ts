import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 과제 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'admin'
    const isInstructor = session.user.role === 'instructor'

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const courseId = parseInt(id)

    // 강의 조회 및 권한 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    // 강사는 자신의 강의만 조회 가능
    if (isInstructor && course.instructor?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 })
    }

    const tasks = await prisma.curriculumTask.findMany({
      where: { courseId },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ],
      include: {
        _count: {
          select: { progress: true }
        }
      }
    })

    // 카테고리별로 그룹화
    const groupedTasks = {
      pre: tasks.filter(t => t.category === 'pre'),
      during: tasks.filter(t => t.category === 'during'),
      post: tasks.filter(t => t.category === 'post')
    }

    return NextResponse.json({ success: true, tasks, groupedTasks, course: { id: course.id, title: course.title } })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json({ success: false, error: '과제 목록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST: 과제 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'admin'
    const isInstructor = session.user.role === 'instructor'

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const courseId = parseInt(id)

    // 강의 조회 및 권한 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    // 강사는 자신의 강의만 수정 가능
    if (isInstructor && course.instructor?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { category, title, description, solution, isRequired } = body

    if (!category || !title) {
      return NextResponse.json({ success: false, error: '카테고리와 제목은 필수입니다' }, { status: 400 })
    }

    if (!['pre', 'during', 'post'].includes(category)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 카테고리입니다' }, { status: 400 })
    }

    // 같은 카테고리 내 최대 order 값 조회
    const maxOrder = await prisma.curriculumTask.findFirst({
      where: {
        courseId,
        category
      },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const task = await prisma.curriculumTask.create({
      data: {
        courseId,
        category,
        title,
        description: description || null,
        solution: solution || null,
        isRequired: isRequired !== false,
        order: (maxOrder?.order ?? -1) + 1
      }
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Task create error:', error)
    return NextResponse.json({ success: false, error: '과제 생성 중 오류가 발생했습니다' }, { status: 500 })
  }
}
