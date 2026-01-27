import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/courses/[id] - 교육 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: true,
        schedules: {
          orderBy: { startDate: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: '교육을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 비활성화된 강사의 강의는 접근 불가
    if (course.instructor && course.instructor.isActive === false) {
      return NextResponse.json(
        { error: '교육을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 평균 평점 계산
    const avgRating = await prisma.review.aggregate({
      where: {
        courseId: id,
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
    })

    return NextResponse.json({
      ...course,
      avgRating: avgRating._avg.rating || 0,
    })
  } catch (error) {
    console.error('교육 상세 조회 실패:', error)
    return NextResponse.json(
      { error: '교육 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT /api/courses/[id] - 교육 수정 (관리자 전용)
export async function PUT(
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

    // 카테고리 존재 확인
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return NextResponse.json(
          { error: '존재하지 않는 카테고리입니다' },
          { status: 400 }
        )
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(curriculum && { curriculum }),
        ...(price !== undefined && { price }),
        ...(capacity !== undefined && { capacity }),
        ...(categoryId && { categoryId }),
        ...(instructorId !== undefined && { instructorId }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(status && { status }),
      },
      include: {
        category: true,
        schedules: true,
      },
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('교육 수정 실패:', error)
    return NextResponse.json(
      { error: '교육 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id] - 교육 삭제 (관리자 전용)
export async function DELETE(
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

    // 수강 신청이 있는지 확인
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        courseId: id,
        status: { in: ['confirmed', 'completed'] },
      },
    })

    if (enrollmentCount > 0) {
      return NextResponse.json(
        { error: '수강 신청이 있는 교육은 삭제할 수 없습니다. 상태를 inactive로 변경해주세요.' },
        { status: 400 }
      )
    }

    await prisma.course.delete({
      where: { id },
    })

    return NextResponse.json({ message: '교육이 삭제되었습니다' })
  } catch (error) {
    console.error('교육 삭제 실패:', error)
    return NextResponse.json(
      { error: '교육 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
