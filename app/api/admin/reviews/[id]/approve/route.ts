import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/reviews/[id]/approve - 후기 승인
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)

    await prisma.review.update({
      where: { id },
      data: { isApproved: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('후기 승인 실패:', error)
    return NextResponse.json(
      { error: '후기 승인에 실패했습니다' },
      { status: 500 }
    )
  }
}
