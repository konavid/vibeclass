import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        instructor: true,
        schedules: {
          include: {
            sessions: {
              orderBy: { sessionNumber: 'asc' }
            },
            _count: {
              select: { enrollments: true }
            }
          },
          orderBy: { cohort: 'desc' }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Course detail error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch course' }, { status: 500 })
  }
}

// PATCH: Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      title, description, curriculum, instructions, price, isFree, capacity,
      categoryId, instructorId, thumbnailUrl, status, parentId, level, order, isRequired,
      courseType, location, locationAddress, locationMapUrl, locationLat, locationLng, locationNote,
      youtubeUrls
    } = body

    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(curriculum !== undefined && { curriculum }),
        ...(instructions !== undefined && { instructions }),
        ...(isFree !== undefined && {
          isFree,
          price: isFree ? 0 : (price ? parseInt(price) : undefined)
        }),
        ...(price !== undefined && !isFree && { price: parseInt(price) }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(instructorId !== undefined && { instructorId: instructorId ? parseInt(instructorId) : null }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(status && { status }),
        ...(parentId !== undefined && { parentId: parentId ? parseInt(parentId) : null }),
        ...(level && { level }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(isRequired !== undefined && { isRequired }),
        ...(courseType !== undefined && { courseType }),
        ...(location !== undefined && { location: location || null }),
        ...(locationAddress !== undefined && { locationAddress: locationAddress || null }),
        ...(locationMapUrl !== undefined && { locationMapUrl: locationMapUrl || null }),
        ...(locationLat !== undefined && { locationLat: locationLat ? parseFloat(locationLat) : null }),
        ...(locationLng !== undefined && { locationLng: locationLng ? parseFloat(locationLng) : null }),
        ...(locationNote !== undefined && { locationNote: locationNote || null }),
        ...(youtubeUrls !== undefined && { youtubeUrls: youtubeUrls || [] }),
        ...(body.descriptionImages !== undefined && { descriptionImages: body.descriptionImages || [] }),
        ...(body.curriculumImages !== undefined && { curriculumImages: body.curriculumImages || [] }),
      },
      include: {
        category: true,
        instructor: true,
      }
    })

    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Course update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE: Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if there are any enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId: parseInt(id) }
    })

    if (enrollmentCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete course with active enrollments'
      }, { status: 400 })
    }

    await prisma.course.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Course delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete course' }, { status: 500 })
  }
}
