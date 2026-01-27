import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/categories - 전체 카테고리 조회
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('카테고리 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/categories - 카테고리 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, order } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: '이름과 슬러그는 필수입니다' },
        { status: 400 }
      )
    }

    // 슬러그 중복 체크
    const existing = await prisma.category.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 슬러그입니다' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        order: order || 0,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('카테고리 생성 실패:', error)
    return NextResponse.json(
      { error: '카테고리 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
