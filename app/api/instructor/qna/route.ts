import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/instructor/qna - 강사의 Q&A 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 강사 정보 조회
    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    // 관리자는 강사 정보 없이도 접근 가능 (모든 Q&A 조회)
    const isAdmin = session.user.role === 'admin'

    if (!instructor && !isAdmin) {
      return NextResponse.json(
        { error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, responded, closed, all
    const courseId = searchParams.get('courseId')

    // 필터 조건 구성
    const whereCondition: any = {}

    // 강사인 경우 자신의 Q&A만, 관리자인 경우 모든 Q&A
    if (instructor) {
      whereCondition.instructorId = instructor.id
    }

    if (status && status !== 'all') {
      whereCondition.status = status
    }

    if (courseId) {
      whereCondition.courseId = parseInt(courseId)
    }

    // Q&A 목록 조회
    const qnas = await prisma.instructorConsultation.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // pending 먼저
        { createdAt: 'desc' }
      ]
    })

    // 통계
    const statsWhere: any = {}
    if (instructor) {
      statsWhere.instructorId = instructor.id
    }
    const stats = await prisma.instructorConsultation.groupBy({
      by: ['status'],
      where: statsWhere,
      _count: true
    })

    const statusCounts = {
      pending: 0,
      responded: 0,
      closed: 0,
      hidden: 0,
      total: 0
    }

    stats.forEach(stat => {
      statusCounts[stat.status as keyof typeof statusCounts] = stat._count
      statusCounts.total += stat._count
    })

    return NextResponse.json({
      success: true,
      qnas,
      stats: statusCounts
    })
  } catch (error) {
    console.error('강사 Q&A 목록 조회 실패:', error)
    return NextResponse.json(
      { error: 'Q&A 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
