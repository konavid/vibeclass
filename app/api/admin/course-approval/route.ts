import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/course-approval - 승인 대기 중인 강의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending' // pending, approved, rejected, all

    const whereClause = status === 'all'
      ? {}
      : { approvalStatus: status }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        category: true,
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
      },
      orderBy: { submittedAt: 'desc' }
    })

    // 각 상태별 카운트
    const counts = await prisma.course.groupBy({
      by: ['approvalStatus'],
      _count: true
    })

    const statusCounts = {
      pending: counts.find(c => c.approvalStatus === 'pending')?._count || 0,
      approved: counts.find(c => c.approvalStatus === 'approved')?._count || 0,
      rejected: counts.find(c => c.approvalStatus === 'rejected')?._count || 0,
    }

    return NextResponse.json({
      success: true,
      courses,
      counts: statusCounts
    })
  } catch (error) {
    console.error('강의 승인 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '강의 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/admin/course-approval - 강의 승인/거절 처리
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { courseId, action, note } = body // action: 'approve' | 'reject'

    if (!courseId || !action) {
      return NextResponse.json(
        { success: false, error: '강의 ID와 처리 유형은 필수입니다.' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 처리 유형입니다.' },
        { status: 400 }
      )
    }

    // 강의 확인
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: {
        instructor: {
          include: {
            user: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: '강의를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 승인/거절 처리
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(courseId) },
      data: {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        approvalNote: note || null,
        approvedBy: parseInt(session.user.id),
        approvedAt: new Date(),
        status: action === 'approve' ? 'active' : 'inactive', // 승인 시 활성화
      },
      include: {
        category: true,
        instructor: true,
      }
    })

    const actionText = action === 'approve' ? '승인' : '거절'

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: `강의가 ${actionText}되었습니다.`
    })
  } catch (error) {
    console.error('강의 승인 처리 실패:', error)
    return NextResponse.json(
      { success: false, error: '강의 승인 처리에 실패했습니다' },
      { status: 500 }
    )
  }
}
