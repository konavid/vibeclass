import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT: 과제 완료/미완료 토글
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params
    const parsedTaskId = parseInt(taskId)
    const userId = parseInt(session.user.id)

    // 과제 조회
    const task = await prisma.curriculumTask.findUnique({
      where: { id: parsedTaskId },
      include: { course: true }
    })

    if (!task) {
      return NextResponse.json({ success: false, error: '과제를 찾을 수 없습니다' }, { status: 404 })
    }

    // 수강 여부 확인
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: task.courseId,
        userId,
        status: 'confirmed'
      }
    })

    if (!enrollment) {
      return NextResponse.json({ success: false, error: '수강 중인 강의가 아닙니다' }, { status: 403 })
    }

    const body = await request.json()
    const { isCompleted } = body

    // 기존 진행 상태 조회 또는 생성
    const progress = await prisma.studentTaskProgress.upsert({
      where: {
        taskId_userId: {
          taskId: parsedTaskId,
          userId
        }
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      },
      create: {
        taskId: parsedTaskId,
        userId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    })

    return NextResponse.json({
      success: true,
      progress,
      // 미완료 시 해결방법 포함
      solution: !isCompleted ? task.solution : null
    })
  } catch (error) {
    console.error('Task complete toggle error:', error)
    return NextResponse.json({ success: false, error: '과제 상태 변경 중 오류가 발생했습니다' }, { status: 500 })
  }
}
