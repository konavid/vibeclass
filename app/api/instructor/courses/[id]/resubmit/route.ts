import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/instructor/courses/[id]/resubmit - 거절된 강의 재승인 요청
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { id } = await params

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

    // 강의 확인 (본인 강의인지)
    const course = await prisma.course.findFirst({
      where: {
        id: parseInt(id),
        instructorId: instructor.id
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: '강의를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 거절된 강의만 재승인 요청 가능
    if (course.approvalStatus !== 'rejected') {
      return NextResponse.json(
        { success: false, error: '거절된 강의만 재승인 요청이 가능합니다' },
        { status: 400 }
      )
    }

    // 재승인 요청 처리
    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: {
        approvalStatus: 'pending',
        approvalNote: null,
        approvedBy: null,
        approvedAt: null,
        submittedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: '재승인 요청이 완료되었습니다. 어드민 검토 후 승인됩니다.'
    })
  } catch (error) {
    console.error('재승인 요청 실패:', error)
    return NextResponse.json(
      { success: false, error: '재승인 요청에 실패했습니다' },
      { status: 500 }
    )
  }
}
