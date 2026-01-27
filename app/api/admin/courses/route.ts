import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 강의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeSchedules = searchParams.get('includeSchedules') === 'true'

    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        instructor: true,
        schedules: includeSchedules ? {
          orderBy: { cohort: 'desc' }
        } : false,
        _count: {
          select: {
            enrollments: true,
            schedules: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, courses })
  } catch (error: any) {
    console.error('Admin courses API error:', error)
    return NextResponse.json({ success: false, error: '강의 목록 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 강의 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title, description, curriculum, instructions, price, isFree, capacity,
      categoryId, instructorId, thumbnailUrl, parentId, level, order, isRequired,
      courseType, location, locationAddress, locationMapUrl, locationLat, locationLng, locationNote
    } = body

    if (!title || !description || !categoryId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        curriculum: curriculum || '',
        instructions: instructions || null,
        price: isFree ? 0 : (parseInt(price) || 0),
        isFree: isFree || false,
        capacity: parseInt(capacity) || 30,
        categoryId: parseInt(categoryId),
        instructorId: instructorId ? parseInt(instructorId) : null,
        thumbnailUrl: thumbnailUrl || null,
        parentId: parentId ? parseInt(parentId) : null,
        level: level || 'basic',
        order: order ? parseInt(order) : 0,
        isRequired: isRequired || false,
        status: 'active',
        courseType: courseType || 'online',
        location: location || null,
        locationAddress: locationAddress || null,
        locationMapUrl: locationMapUrl || null,
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        locationNote: locationNote || null,
      },
      include: {
        category: true,
        instructor: true,
        parent: true,
        children: true,
      }
    })

    return NextResponse.json({ success: true, course })
  } catch (error: any) {
    console.error('Course create error:', error)
    return NextResponse.json({ success: false, error: '강의 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
