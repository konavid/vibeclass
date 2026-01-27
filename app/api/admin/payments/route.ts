import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, serverErrorResponse, safeErrorLog } from '@/lib/security'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const { session, error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search')?.trim().slice(0, 100) || undefined
    const courseId = searchParams.get('courseId') || ''
    const scheduleId = searchParams.get('scheduleId') || ''

    const skip = (page - 1) * limit

    // Where 조건 생성 (타입 안전)
    const where: Prisma.PaymentWhereInput = {}

    if (status && ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'].includes(status)) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { billId: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } }
      ]
    }

    // 특정 기수가 선택된 경우
    const scheduleIdNum = parseInt(scheduleId)
    const courseIdNum = parseInt(courseId)

    if (scheduleId && scheduleId !== 'all' && !isNaN(scheduleIdNum)) {
      where.enrollments = { some: { scheduleId: scheduleIdNum } }
    } else if (courseId && courseId !== 'all' && !isNaN(courseIdNum)) {
      where.enrollments = { some: { schedule: { courseId: courseIdNum } } }
    }

    // 결제 목록 조회
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          },
          enrollments: {
            include: {
              schedule: {
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                      isFree: true,
                      price: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ])

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    safeErrorLog('Admin payments API error:', error)
    return serverErrorResponse('결제 목록 조회 중 오류가 발생했습니다.')
  }
}
