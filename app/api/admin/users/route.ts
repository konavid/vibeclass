import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, badRequestResponse, serverErrorResponse, safeErrorLog } from '@/lib/security'
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
    const role = searchParams.get('role') || ''

    const skip = (page - 1) * limit

    // 검색 조건 구성 (타입 안전)
    const where: Prisma.UserWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (role && role !== 'all' && ['admin', 'instructor', 'customer'].includes(role)) {
      where.role = role
    }

    // 비활성화된 사용자 제외 (선택적)
    // where.deactivatedAt = null

    // 총 개수
    const total = await prisma.user.count({ where })

    // 사용자 목록 (민감 정보 제외)
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        phone: true,
        role: true,
        createdAt: true,
        deactivatedAt: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    safeErrorLog('Admin users API error:', error)
    return serverErrorResponse('사용자 목록 조회 중 오류가 발생했습니다.')
  }
}
