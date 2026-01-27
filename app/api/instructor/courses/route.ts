import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_COURSES_PER_INSTRUCTOR = 3

// GET /api/instructor/courses - 강사의 강의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 강사 정보 조회
    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    const isAdmin = session.user.role === 'admin'

    if (!instructor && !isAdmin) {
      return NextResponse.json(
        { error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 강사의 강의 목록 조회 (admin은 모든 강의)
    const courses = await prisma.course.findMany({
      where: instructor ? { instructorId: instructor.id } : {},
      include: {
        category: true,
        instructor: true,
        schedules: {
          where: {
            status: { in: ['scheduled', 'ongoing'] }
          },
          include: {
            _count: {
              select: {
                enrollments: {
                  where: {
                    status: { in: ['confirmed', 'active', 'completed'] }
                  }
                }
              }
            }
          },
          orderBy: { startDate: 'asc' }
        },
        _count: {
          select: {
            enrollments: true,
            schedules: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      courses
    })
  } catch (error) {
    console.error('강사 강의 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '강의 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/instructor/courses - 강사가 직접 강의 등록
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 강사 정보 조회
    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    if (!instructor) {
      return NextResponse.json(
        { success: false, error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 현재 강사의 강의 개수 확인
    const existingCourseCount = await prisma.course.count({
      where: { instructorId: instructor.id }
    })

    if (existingCourseCount >= MAX_COURSES_PER_INSTRUCTOR) {
      return NextResponse.json(
        { success: false, error: `강의는 최대 ${MAX_COURSES_PER_INSTRUCTOR}개까지만 등록할 수 있습니다.` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, curriculum, instructions, price, isFree, capacity, categoryId, thumbnailUrl } = body

    console.log('강의 등록 요청 데이터:', { title, description: description?.substring(0, 50), categoryId, price, isFree, capacity })

    if (!title || !description || !categoryId) {
      return NextResponse.json(
        { success: false, error: '제목, 설명, 카테고리는 필수입니다.' },
        { status: 400 }
      )
    }

    // 타입 안전한 값 변환
    const parsedCategoryId = typeof categoryId === 'number' ? categoryId : parseInt(String(categoryId)) || 0
    const parsedPrice = typeof price === 'number' ? price : parseInt(String(price)) || 0
    const parsedCapacity = typeof capacity === 'number' ? capacity : parseInt(String(capacity)) || 30

    // 카테고리 존재 확인
    const category = await prisma.category.findUnique({
      where: { id: parsedCategoryId }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 카테고리입니다.' },
        { status: 400 }
      )
    }

    // 강의 생성 (바로 활성화 상태로)
    const course = await prisma.course.create({
      data: {
        title: String(title),
        description: String(description),
        curriculum: curriculum ? String(curriculum) : '',
        instructions: instructions ? String(instructions) : null,
        price: isFree ? 0 : parsedPrice,
        isFree: Boolean(isFree),
        capacity: parsedCapacity,
        categoryId: parsedCategoryId,
        instructorId: instructor.id,
        thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : null,
        status: 'active', // 바로 활성화
        approvalStatus: 'approved', // 바로 승인
        submittedAt: new Date(),
        approvedAt: new Date(),
      },
      include: {
        category: true,
        instructor: true,
      }
    })

    return NextResponse.json({
      success: true,
      course,
      message: '강의가 등록되어 바로 게시되었습니다.'
    })
  } catch (error) {
    console.error('강사 강의 등록 실패:', error)
    return NextResponse.json(
      { success: false, error: '강의 등록에 실패했습니다' },
      { status: 500 }
    )
  }
}
