import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/email-logs - 이메일 발송 로그 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          admin: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.emailLog.count()
    ])

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('이메일 로그 조회 오류:', error)
    return NextResponse.json(
      { error: '이메일 로그 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
