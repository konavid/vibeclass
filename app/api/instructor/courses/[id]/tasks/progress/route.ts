import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 수강생별 과제 진행 상태 조회
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

    // URL 파라미터에서 scheduleId 가져오기 (선택적 필터)
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

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

    // 해당 강의의 모든 과제 조회
    const tasks = await prisma.curriculumTask.findMany({
      where: { courseId },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ]
    })

    // 수강생 조회 (특정 기수 또는 전체)
    const enrollmentWhere: any = {
      courseId,
      status: 'confirmed'
    }
    if (scheduleId) {
      enrollmentWhere.scheduleId = parseInt(scheduleId)
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, phone: true }
        },
        schedule: {
          select: { id: true, cohort: true, startDate: true, endDate: true }
        }
      }
    })

    // 모든 과제 진행 상태 조회
    const allProgress = await prisma.studentTaskProgress.findMany({
      where: {
        taskId: { in: tasks.map(t => t.id) },
        userId: { in: enrollments.map(e => e.user.id) }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    // 도움 요청 목록 (미응답)
    const pendingHelpRequests = allProgress.filter(p => p.helpRequested && !p.helpRespondedAt)

    // 수강생별 진행 상태 정리
    const studentProgress = enrollments.map(enrollment => {
      const userProgress = allProgress.filter(p => p.userId === enrollment.user.id)
      const completedCount = userProgress.filter(p => p.isCompleted).length
      const helpRequestCount = userProgress.filter(p => p.helpRequested && !p.helpRespondedAt).length

      return {
        user: enrollment.user,
        schedule: enrollment.schedule,
        totalTasks: tasks.length,
        completedTasks: completedCount,
        pendingHelpRequests: helpRequestCount,
        progressPercent: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
        progress: userProgress
      }
    })

    // 카테고리별 통계
    const categoryStats = {
      pre: {
        total: tasks.filter(t => t.category === 'pre').length,
        tasks: tasks.filter(t => t.category === 'pre')
      },
      during: {
        total: tasks.filter(t => t.category === 'during').length,
        tasks: tasks.filter(t => t.category === 'during')
      },
      post: {
        total: tasks.filter(t => t.category === 'post').length,
        tasks: tasks.filter(t => t.category === 'post')
      }
    }

    // 기수 목록
    const schedules = await prisma.courseSchedule.findMany({
      where: { courseId },
      orderBy: { cohort: 'desc' },
      select: { id: true, cohort: true, startDate: true, endDate: true }
    })

    return NextResponse.json({
      success: true,
      course: { id: course.id, title: course.title },
      tasks,
      schedules,
      studentProgress,
      pendingHelpRequests,
      categoryStats,
      summary: {
        totalStudents: enrollments.length,
        totalTasks: tasks.length,
        pendingHelpCount: pendingHelpRequests.length
      }
    })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json({ success: false, error: '진행 상태 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}
