import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: 도움 요청하기
export async function POST(
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
    const { helpMessage } = body

    // 기존 진행 상태 조회 또는 생성/업데이트
    const progress = await prisma.studentTaskProgress.upsert({
      where: {
        taskId_userId: {
          taskId: parsedTaskId,
          userId
        }
      },
      update: {
        helpRequested: true,
        helpMessage: helpMessage || '도움이 필요합니다.',
        helpRequestedAt: new Date(),
        // 도움 요청 시 이전 답변은 유지 (새 질문이므로)
        helpResponse: null,
        helpRespondedAt: null
      },
      create: {
        taskId: parsedTaskId,
        userId,
        isCompleted: false,
        helpRequested: true,
        helpMessage: helpMessage || '도움이 필요합니다.',
        helpRequestedAt: new Date()
      },
      include: {
        task: {
          select: { title: true, category: true }
        }
      }
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Help request error:', error)
    return NextResponse.json({ success: false, error: '도움 요청 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE: 도움 요청 취소
export async function DELETE(
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

    // 기존 진행 상태 조회
    const progress = await prisma.studentTaskProgress.findUnique({
      where: {
        taskId_userId: {
          taskId: parsedTaskId,
          userId
        }
      }
    })

    if (!progress) {
      return NextResponse.json({ success: false, error: '진행 상태를 찾을 수 없습니다' }, { status: 404 })
    }

    // 도움 요청 취소
    const updatedProgress = await prisma.studentTaskProgress.update({
      where: {
        taskId_userId: {
          taskId: parsedTaskId,
          userId
        }
      },
      data: {
        helpRequested: false,
        helpMessage: null,
        helpRequestedAt: null,
        helpResponse: null,
        helpRespondedAt: null
      }
    })

    return NextResponse.json({ success: true, progress: updatedProgress })
  } catch (error) {
    console.error('Help cancel error:', error)
    return NextResponse.json({ success: false, error: '도움 요청 취소 중 오류가 발생했습니다' }, { status: 500 })
  }
}
