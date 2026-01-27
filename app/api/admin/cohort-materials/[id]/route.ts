import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 자료 상세 조회
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

    const material = await prisma.cohortMaterial.findUnique({
      where: { id: parseInt(id) },
      include: {
        schedule: {
          include: {
            course: { select: { id: true, title: true } }
          }
        }
      }
    })

    if (!material) {
      return NextResponse.json({ success: false, error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, material })
  } catch (error) {
    console.error('자료 조회 오류:', error)
    return NextResponse.json({ success: false, error: '자료 조회 실패' }, { status: 500 })
  }
}

// PATCH: 자료 수정
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
    const { title, content, fileUrl, fileName, fileSize, order, isPublished } = await request.json()

    const material = await prisma.cohortMaterial.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileName !== undefined && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { isPublished })
      }
    })

    return NextResponse.json({ success: true, material })
  } catch (error) {
    console.error('자료 수정 오류:', error)
    return NextResponse.json({ success: false, error: '자료 수정 실패' }, { status: 500 })
  }
}

// DELETE: 자료 삭제
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

    await prisma.cohortMaterial.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('자료 삭제 오류:', error)
    return NextResponse.json({ success: false, error: '자료 삭제 실패' }, { status: 500 })
  }
}
