import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/instructor/courses/[id] - 강사의 특정 강의 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { id } = await params
    const courseId = parseInt(id)

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: '잘못된 강의 ID입니다' },
        { status: 400 }
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

    // 강의 조회 (강사는 본인 강의만, admin은 모든 강의)
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(instructor ? { instructorId: instructor.id } : {})
      },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: '강의를 찾을 수 없거나 권한이 없습니다' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        curriculum: course.curriculum,
        instructions: course.instructions,
        thumbnailUrl: course.thumbnailUrl,
        category: course.category,
        price: course.price,
        isFree: course.isFree,
        status: course.status,
        capacity: course.capacity,
        courseType: course.courseType,
        location: course.location,
        locationAddress: course.locationAddress,
        locationMapUrl: course.locationMapUrl,
        locationLat: course.locationLat,
        locationLng: course.locationLng,
        locationNote: course.locationNote,
        youtubeUrls: course.youtubeUrls,
        descriptionImages: course.descriptionImages,
        curriculumImages: course.curriculumImages
      }
    })
  } catch (error) {
    console.error('강의 조회 실패:', error)
    return NextResponse.json(
      { error: '강의 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT /api/instructor/courses/[id] - 강사의 강의 수정 (제한된 필드만)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { id } = await params
    const courseId = parseInt(id)

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: '잘못된 강의 ID입니다' },
        { status: 400 }
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

    // 강의가 본인 것인지 확인 (admin은 모든 강의 수정 가능)
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(instructor ? { instructorId: instructor.id } : {})
      }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: '강의를 찾을 수 없거나 권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title, description, curriculum, instructions, thumbnailUrl, price, isFree, status, capacity, categoryId,
      courseType, location, locationAddress, locationMapUrl, locationLat, locationLng, locationNote, youtubeUrls
    } = body

    // 강사가 수정 가능한 필드 업데이트
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (curriculum !== undefined) updateData.curriculum = curriculum
    if (instructions !== undefined) updateData.instructions = instructions
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (price !== undefined) updateData.price = isFree ? 0 : parseInt(String(price)) || 0
    if (isFree !== undefined) {
      updateData.isFree = Boolean(isFree)
      if (isFree) updateData.price = 0
    }
    if (status !== undefined) updateData.status = status
    if (capacity !== undefined) updateData.capacity = parseInt(String(capacity)) || 30
    if (categoryId !== undefined) updateData.categoryId = parseInt(String(categoryId))
    // 강의 유형 및 장소 정보
    if (courseType !== undefined) updateData.courseType = courseType
    if (location !== undefined) updateData.location = location || null
    if (locationAddress !== undefined) updateData.locationAddress = locationAddress || null
    if (locationMapUrl !== undefined) updateData.locationMapUrl = locationMapUrl || null
    if (locationLat !== undefined) updateData.locationLat = locationLat ? parseFloat(String(locationLat)) : null
    if (locationLng !== undefined) updateData.locationLng = locationLng ? parseFloat(String(locationLng)) : null
    if (locationNote !== undefined) updateData.locationNote = locationNote || null
    // 유튜브 링크
    if (youtubeUrls !== undefined) updateData.youtubeUrls = youtubeUrls || []

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        curriculum: updatedCourse.curriculum,
        instructions: updatedCourse.instructions,
        thumbnailUrl: updatedCourse.thumbnailUrl,
        category: updatedCourse.category,
        price: updatedCourse.price,
        isFree: updatedCourse.isFree,
        status: updatedCourse.status,
        capacity: updatedCourse.capacity,
        courseType: updatedCourse.courseType,
        location: updatedCourse.location,
        locationAddress: updatedCourse.locationAddress,
        locationMapUrl: updatedCourse.locationMapUrl,
        locationLat: updatedCourse.locationLat,
        locationLng: updatedCourse.locationLng,
        locationNote: updatedCourse.locationNote,
        youtubeUrls: updatedCourse.youtubeUrls,
        descriptionImages: updatedCourse.descriptionImages,
        curriculumImages: updatedCourse.curriculumImages
      }
    })
  } catch (error) {
    console.error('강의 수정 실패:', error)
    return NextResponse.json(
      { error: '강의 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}
