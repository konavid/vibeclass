import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: 도움 요청에 답변
export async function POST(
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
    const { userId, helpResponse } = body

    if (!userId || !helpResponse) {
      return NextResponse.json({ success: false, error: '사용자 ID와 답변 내용은 필수입니다' }, { status: 400 })
    }

    // 기존 진행 상태 조회
    const progress = await prisma.studentTaskProgress.findUnique({
      where: {
        taskId_userId: {
          taskId: parseInt(taskId),
          userId: parseInt(userId)
        }
      }
    })

    if (!progress) {
      return NextResponse.json({ success: false, error: '진행 상태를 찾을 수 없습니다' }, { status: 404 })
    }

    if (!progress.helpRequested) {
      return NextResponse.json({ success: false, error: '도움 요청이 없습니다' }, { status: 400 })
    }

    // 답변 저장
    const updatedProgress = await prisma.studentTaskProgress.update({
      where: {
        taskId_userId: {
          taskId: parseInt(taskId),
          userId: parseInt(userId)
        }
      },
      data: {
        helpResponse,
        helpRespondedAt: new Date()
      },
      include: {
        task: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ success: true, progress: updatedProgress })
  } catch (error) {
    console.error('Help respond error:', error)
    return NextResponse.json({ success: false, error: '답변 저장 중 오류가 발생했습니다' }, { status: 500 })
  }
}
