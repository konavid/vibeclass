import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const enrollmentId = parseInt(id)

    // 수강 조회
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        payment: true,
        user: true,
        schedule: {
          include: {
            course: true
          }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: '수강 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 확정된 경우
    if (enrollment.status === 'confirmed' || enrollment.status === 'active' || enrollment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '이미 확정된 수강입니다.' },
        { status: 400 }
      )
    }

    // 수강 상태 업데이트
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'confirmed' }
    })

    // 연결된 결제가 있으면 결제도 확정 처리
    if (enrollment.paymentId) {
      await prisma.payment.update({
        where: { id: enrollment.paymentId },
        data: { status: 'completed' }
      })
    }

    return NextResponse.json({
      success: true,
      message: '수강이 확정되었습니다.'
    })

  } catch (error: any) {
    console.error('Enrollment confirm error:', error)
    return NextResponse.json(
      { success: false, error: '수강 확정 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
