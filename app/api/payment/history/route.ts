import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || undefined

    // where 조건 생성
    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    // 결제 이력 조회
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.payment.count({ where })
    ])

    // 강의 정보를 별도로 조회
    const paymentsWithCourse = await Promise.all(
      payments.map(async (payment) => {
        let course = null
        if (payment.courseId) {
          course = await prisma.course.findUnique({
            where: { id: payment.courseId },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true
            }
          })
        }
        return {
          id: payment.id,
          billId: payment.billId,
          status: payment.status,
          amount: payment.amount,
          months: payment.months,
          method: payment.method,
          course: course,
          description: payment.description,
          apprState: payment.apprState,
          apprDt: payment.apprDt,
          paidAt: payment.paidAt,
          newEndDate: payment.newEndDate,
          createdAt: payment.createdAt
        }
      })
    )

    return NextResponse.json({
      success: true,
      payments: paymentsWithCourse,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error: any) {
    console.error('Payment history error:', error)
    return NextResponse.json(
      { success: false, error: '결제 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
