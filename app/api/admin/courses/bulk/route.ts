import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/courses/bulk - 일괄 작업
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
    const { action, courseIds } = body

    if (!action || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: '작업 유형과 강의를 선택해주세요' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'delete':
        // 강의 삭제 - 연관 데이터를 순서대로 삭제
        const ids = courseIds.map((id: string) => parseInt(id))

        // 1. 먼저 리뷰 삭제
        await prisma.review.deleteMany({
          where: { courseId: { in: ids } }
        })

        // 2. 수강신청 삭제
        await prisma.enrollment.deleteMany({
          where: { courseId: { in: ids } }
        })

        // 3. 스케줄 삭제 (세션도 cascade로 삭제됨)
        await prisma.courseSchedule.deleteMany({
          where: { courseId: { in: ids } }
        })

        // 4. 마지막으로 강의 삭제
        result = await prisma.course.deleteMany({
          where: { id: { in: ids } }
        })
        break

      case 'deactivate':
        // 강의 비활성화
        result = await prisma.course.updateMany({
          where: {
            id: { in: courseIds.map((id: string) => parseInt(id)) }
          },
          data: {
            status: 'inactive'
          }
        })
        break

      case 'activate':
        // 강의 활성화
        result = await prisma.course.updateMany({
          where: {
            id: { in: courseIds.map((id: string) => parseInt(id)) }
          },
          data: {
            status: 'active'
          }
        })
        break

      default:
        return NextResponse.json(
          { error: '잘못된 작업 유형입니다' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `${result.count}개의 강의가 처리되었습니다`,
      count: result.count
    })
  } catch (error) {
    console.error('일괄 작업 실패:', error)
    return NextResponse.json(
      { error: '일괄 작업에 실패했습니다' },
      { status: 500 }
    )
  }
}
