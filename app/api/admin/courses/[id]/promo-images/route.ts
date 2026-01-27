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
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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
      where: { id: parseInt(id) },
      data: updateData
    })

    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Promo images update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update promo images' }, { status: 500 })
  }
}
