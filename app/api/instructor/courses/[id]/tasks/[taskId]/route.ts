import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 개별 과제 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
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

    const { id, taskId } = await params
    const courseId = parseInt(id)

    // 강의 조회 및 권한 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    if (isInstructor && course.instructor?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 })
    }

    const task = await prisma.curriculumTask.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        progress: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '과제를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json({ success: false, error: '과제 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT: 과제 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
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

    const { id, taskId } = await params
    const courseId = parseInt(id)

    // 강의 조회 및 권한 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    if (isInstructor && course.instructor?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, solution, isRequired, order } = body

    const task = await prisma.curriculumTask.update({
      where: { id: parseInt(taskId) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(solution !== undefined && { solution }),
        ...(isRequired !== undefined && { isRequired }),
        ...(order !== undefined && { order })
      }
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json({ success: false, error: '과제 수정 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE: 과제 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
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

    const { id, taskId } = await params
    const courseId = parseInt(id)

    // 강의 조회 및 권한 확인
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    if (isInstructor && course.instructor?.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 })
    }

    await prisma.curriculumTask.delete({
      where: { id: parseInt(taskId) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task delete error:', error)
    return NextResponse.json({ success: false, error: '과제 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
