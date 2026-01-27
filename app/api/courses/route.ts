import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/courses - 교육 목록 조회 (필터링, 검색, 정렬)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // 검색 조건 구성
    const where: any = {
      // 비활성화된 강사의 강의 제외 (강사가 없거나 활성화된 강사만)
      OR: [
        { instructorId: null },
        { instructor: { is: { isActive: true } } }
      ]
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ]
        }
      ]
    }

    // 총 개수 조회
    const total = await prisma.course.count({ where })

    // 교육 목록 조회
    const courses = await prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: true,
        schedules: {
          where: {
            status: { in: ['scheduled', 'ongoing'] },
          },
          orderBy: { startDate: 'asc' },
          take: 3,
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    })

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('교육 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '교육 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/courses - 교육 생성 (관리자 전용)
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
    const {
      title,
      description,
      curriculum,
      price,
      capacity,
      categoryId,
      instructorId,
      thumbnailUrl,
      status,
    } = body

    // 필수 필드 검증
    if (!title || !description || !curriculum || price === undefined || !categoryId) {
      return NextResponse.json(
        { error: '필수 필드를 모두 입력해주세요' },
        { status: 400 }
      )
    }

    // 카테고리 존재 확인
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: '존재하지 않는 카테고리입니다' },
        { status: 400 }
      )
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        curriculum,
        price,
        capacity: capacity || 30,
        categoryId,
        instructorId,
        thumbnailUrl,
        status: status || 'active',
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('교육 생성 실패:', error)
    return NextResponse.json(
      { error: '교육 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
