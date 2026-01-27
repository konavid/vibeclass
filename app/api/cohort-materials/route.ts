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

// GET: 자료 목록 조회 (수강생용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = parseInt(searchParams.get('scheduleId') || '0')
    const materialId = searchParams.get('materialId')

    if (!scheduleId) {
      return NextResponse.json({ error: '기수 ID가 필요합니다.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // 권한 확인
    const isEnrolled = await isEnrolledInSchedule(userId, scheduleId)
    const isStaff = await isInstructorOrAdmin(userId, scheduleId)

    if (!isEnrolled && !isStaff) {
      return NextResponse.json({ error: '자료실에 접근 권한이 없습니다.' }, { status: 403 })
    }

    // 기수 정보 조회
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: { select: { title: true } } }
    })

    if (!schedule) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 특정 자료 상세 조회
    if (materialId) {
      const material = await prisma.cohortMaterial.findFirst({
        where: {
          id: parseInt(materialId),
          scheduleId,
          isPublished: true
        }
      })

      if (!material) {
        return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
      }

      return NextResponse.json({
        schedule: {
          id: schedule.id,
          cohort: schedule.cohort,
          courseTitle: schedule.course.title
        },
        material
      })
    }

    // 자료 목록 조회 (공개된 것만)
    const materials = await prisma.cohortMaterial.findMany({
      where: {
        scheduleId,
        isPublished: true
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        cohort: schedule.cohort,
        courseTitle: schedule.course.title
      },
      materials
    })
  } catch (error) {
    console.error('자료 조회 오류:', error)
    return NextResponse.json({ error: '자료 조회 실패' }, { status: 500 })
  }
}
