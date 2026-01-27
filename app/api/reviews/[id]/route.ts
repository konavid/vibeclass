import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/reviews/[id] - 후기 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const reviewId = parseInt(id)
    const body = await request.json()
    const { rating, content, imageUrl } = body

    if (!rating || !content) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '평점은 1~5 사이여야 합니다' },
        { status: 400 }
      )
    }

    // 후기 존재 여부 및 작성자 확인
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: '후기를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (existingReview.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: '본인이 작성한 후기만 수정할 수 있습니다' },
        { status: 403 }
      )
    }

    // 사용자의 enrollment에서 cohort 정보 가져오기
    const userEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: parseInt(session.user.id),
        courseId: existingReview.courseId,
        status: {
          in: ['confirmed', 'active', 'completed']
        }
      },
      include: {
        schedule: {
          select: {
            cohort: true
          }
        }
      }
    })

    // 후기 수정
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        cohort: userEnrollment?.schedule.cohort || null,
        rating,
        content,
        imageUrl: imageUrl || null,
        isApproved: false, // 수정 시 다시 승인 대기
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: true,
      },
    })

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: '후기가 수정되었습니다. 관리자 승인 후 공개됩니다.'
    })
  } catch (error) {
    console.error('후기 수정 실패:', error)
    return NextResponse.json(
      { error: '후기 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - 후기 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const reviewId = parseInt(id)

    // 후기 존재 여부 및 작성자 확인
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: '후기를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (existingReview.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: '본인이 작성한 후기만 삭제할 수 있습니다' },
        { status: 403 }
      )
    }

    // 후기 삭제
    await prisma.review.delete({
      where: { id: reviewId },
    })

    return NextResponse.json({
      success: true,
      message: '후기가 삭제되었습니다.'
    })
  } catch (error) {
    console.error('후기 삭제 실패:', error)
    return NextResponse.json(
      { error: '후기 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
