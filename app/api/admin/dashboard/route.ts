import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 인증 및 관리자 권한 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 체크
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 전체 통계
    const [totalUsers, totalCourses, totalEnrollments, revenueAggregation] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count({ where: { status: 'confirmed' } }),
      prisma.payment.aggregate({
        where: { status: 'confirmed' },
        _sum: { amount: true }
      })
    ])

    const totalRevenue = revenueAggregation._sum.amount || 0

    // 최근 결제 (최근 10개)
    const recentPayments = await prisma.payment.findMany({
      where: { status: 'confirmed' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // 최근 수강신청 (최근 10개)
    const recentEnrollments = await prisma.enrollment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true }
        },
        course: {
          select: { title: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalRevenue,
        recentPayments,
        recentEnrollments
      }
    })

  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: '대시보드 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
