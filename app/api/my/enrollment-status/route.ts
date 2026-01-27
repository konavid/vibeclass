import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ isEnrolled: false })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId가 필요합니다.' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // Find enrollment for this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: parseInt(courseId),
        status: { in: ['completed', 'confirmed'] }
      },
      include: {
        schedule: {
          select: {
            id: true,
            cohort: true,
            endDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (enrollment) {
      return NextResponse.json({
        isEnrolled: true,
        scheduleId: enrollment.scheduleId,
        schedule: enrollment.schedule
      })
    }

    return NextResponse.json({ isEnrolled: false })
  } catch (error) {
    console.error('Enrollment status check error:', error)
    return NextResponse.json({ error: '수강 상태 확인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
