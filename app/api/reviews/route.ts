import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/reviews - 후기 작성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId, rating, content, imageUrl } = body

    if (!courseId || !rating || !content) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요' },
        { status: 400 }
      )
    }

    // 사용자의 enrollment에서 cohort 정보 가져오기
    const userEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: parseInt(session.user.id),
        courseId,
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

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '평점은 1~5 사이여야 합니다' },
        { status: 400 }
      )
    }

    // 수강 중이거나 수강 완료한 학생인지 확인
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: parseInt(session.user.id),
        courseId,
        status: {
          in: ['confirmed', 'active', 'completed']
        }
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: '이 강의를 수강한 학생만 후기를 작성할 수 있습니다' },
        { status: 403 }
      )
    }

    // 이미 후기 작성했는지 확인
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: parseInt(session.user.id),
        courseId,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: '이미 후기를 작성하셨습니다' },
        { status: 400 }
      )
    }

    // 후기 생성
    const review = await prisma.review.create({
      data: {
        userId: parseInt(session.user.id),
        courseId,
        cohort: userEnrollment?.schedule.cohort || null,
        rating,
        content,
        imageUrl: imageUrl || null,
        isApproved: false, // 관리자 승인 대기
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
      review,
      message: '후기가 등록되었습니다. 관리자 승인 후 공개됩니다.'
    }, { status: 201 })
  } catch (error) {
    console.error('후기 작성 실패:', error)
    return NextResponse.json(
      { error: '후기 작성에 실패했습니다' },
      { status: 500 }
    )
  }
}
