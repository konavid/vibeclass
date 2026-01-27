import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 내 과제 목록 조회 (수강생)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await params
    const parsedCourseId = parseInt(courseId)
    const userId = parseInt(session.user.id)

    // 수강 여부 확인
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: parsedCourseId,
        userId,
        status: 'confirmed'
      },
      include: {
        schedule: true,
        course: {
          select: { id: true, title: true }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ success: false, error: '수강 중인 강의가 아닙니다' }, { status: 403 })
    }

    // 해당 강의의 모든 과제 조회
    const tasks = await prisma.curriculumTask.findMany({
      where: { courseId: parsedCourseId },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ]
    })

    // 내 진행 상태 조회
    const myProgress = await prisma.studentTaskProgress.findMany({
      where: {
        userId,
        taskId: { in: tasks.map(t => t.id) }
      }
    })

    // 과제에 진행 상태 결합
    const tasksWithProgress = tasks.map(task => {
      const progress = myProgress.find(p => p.taskId === task.id)
      return {
        ...task,
        isCompleted: progress?.isCompleted || false,
        completedAt: progress?.completedAt || null,
        helpRequested: progress?.helpRequested || false,
        helpMessage: progress?.helpMessage || null,
        helpRequestedAt: progress?.helpRequestedAt || null,
        helpResponse: progress?.helpResponse || null,
        helpRespondedAt: progress?.helpRespondedAt || null
      }
    })

    // 카테고리별 그룹화
    const groupedTasks = {
      pre: tasksWithProgress.filter(t => t.category === 'pre'),
      during: tasksWithProgress.filter(t => t.category === 'during'),
      post: tasksWithProgress.filter(t => t.category === 'post')
    }

    // 통계
    const completedCount = tasksWithProgress.filter(t => t.isCompleted).length
    const totalCount = tasksWithProgress.length

    // 오늘 사업일기 작성 여부
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDiary = await prisma.execDiary.findFirst({
      where: {
        userId,
        courseId: parsedCourseId,
        date: today
      }
    })

    return NextResponse.json({
      success: true,
      course: enrollment.course,
      schedule: {
        id: enrollment.schedule.id,
        cohort: enrollment.schedule.cohort,
        startDate: enrollment.schedule.startDate,
        endDate: enrollment.schedule.endDate
      },
      tasks: tasksWithProgress,
      groupedTasks,
      stats: {
        total: totalCount,
        completed: completedCount,
        remaining: totalCount - completedCount,
        progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      },
      todayDiaryWritten: !!todayDiary
    })
  } catch (error) {
    console.error('My tasks fetch error:', error)
    return NextResponse.json({ success: false, error: '과제 목록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}
