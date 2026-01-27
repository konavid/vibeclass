import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, notFoundResponse, serverErrorResponse, safeErrorLog, validatePositiveInt } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 검증
    const { session, error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const { value: userId, error: idError } = validatePositiveInt(id, '사용자 ID')
    if (idError) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    // 사용자 정보 (민감 정보 제외)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        phone: true,
        role: true,
        createdAt: true,
        deactivatedAt: true,
      }
    })

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.')
    }

    // 수강 내역
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        schedule: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                isFree: true,
                price: true,
              }
            }
          }
        }
      }
    })

    // 결제 내역 (민감 정보 마스킹)
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        createdAt: true,
        enrollments: {
          include: {
            schedule: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      user,
      enrollments,
      payments
    })
  } catch (error) {
    safeErrorLog('Admin user detail API error:', error)
    return serverErrorResponse('사용자 정보 조회 중 오류가 발생했습니다.')
  }
}
