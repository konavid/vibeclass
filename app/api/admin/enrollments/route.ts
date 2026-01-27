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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search')?.trim().slice(0, 100) || ''
    const status = searchParams.get('status') || ''
    const courseId = searchParams.get('courseId') || ''
    const scheduleId = searchParams.get('scheduleId') || ''

    const skip = (page - 1) * limit

    // 검색 조건 구성 (타입 안전)
    const where: Prisma.EnrollmentWhereInput = {}

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
        { schedule: { course: { title: { contains: search } } } },
      ]
    }

    if (status && status !== 'all' && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      where.status = status
    }

    // 특정 기수가 선택된 경우
    const scheduleIdNum = parseInt(scheduleId)
    const courseIdNum = parseInt(courseId)

    if (scheduleId && scheduleId !== 'all' && !isNaN(scheduleIdNum)) {
      where.scheduleId = scheduleIdNum
    } else if (courseId && courseId !== 'all' && !isNaN(courseIdNum)) {
      where.schedule = { courseId: courseIdNum }
    }

    // 총 개수
    const total = await prisma.enrollment.count({ where })

    // 수강 목록
    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
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
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            createdAt: true,
            customerMemo: true,
            kakaoPhone: true,
            refundedAt: true,
            failMessage: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      enrollments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    safeErrorLog('Admin enrollments API error:', error)
    return serverErrorResponse('수강 목록 조회 중 오류가 발생했습니다.')
  }
}
