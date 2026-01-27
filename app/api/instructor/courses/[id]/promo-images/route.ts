import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT: Update promo images
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: '강사 권한이 필요합니다' }, { status: 403 })
    }

    const { id } = await params
    const courseId = parseInt(id)

    if (isNaN(courseId)) {
      return NextResponse.json({ success: false, error: '잘못된 강의 ID입니다' }, { status: 400 })
    }

    // 강사 정보 조회
    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    const isAdmin = session.user.role === 'admin'

    if (!instructor && !isAdmin) {
      return NextResponse.json({ success: false, error: '강사 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // 강의 소유권 확인
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(instructor && !isAdmin ? { instructorId: instructor.id } : {})
      }
    })

    if (!existingCourse) {
      return NextResponse.json({ success: false, error: '강의를 찾을 수 없습니다' }, { status: 404 })
    }

    const body = await request.json()
    const { type, images } = body

    if (!type || !['description', 'curriculum'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
    }

    if (!Array.isArray(images)) {
      return NextResponse.json({ success: false, error: 'Images must be an array' }, { status: 400 })
    }

    // 최대 10장 제한
    if (images.length > 10) {
      return NextResponse.json({ success: false, error: '이미지는 최대 10장까지만 저장할 수 있습니다.' }, { status: 400 })
    }

    const updateData = type === 'description'
      ? { descriptionImages: images }
      : { curriculumImages: images }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData
    })

    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Promo images update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update promo images' }, { status: 500 })
  }
}
