import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/categories/[id] - 카테고리 수정 (관리자 전용)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()
    const { name, slug, order } = body

    // 슬러그 중복 체크 (자신 제외)
    if (slug) {
      const existing = await prisma.category.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: '이미 존재하는 슬러그입니다' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(order !== undefined && { order }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('카테고리 수정 실패:', error)
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - 카테고리 삭제 (관리자 전용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)

    // 해당 카테고리의 교육이 있는지 확인
    const courseCount = await prisma.course.count({
      where: { categoryId: id },
    })

    if (courseCount > 0) {
      return NextResponse.json(
        { error: '교육이 등록된 카테고리는 삭제할 수 없습니다' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: '카테고리가 삭제되었습니다' })
  } catch (error) {
    console.error('카테고리 삭제 실패:', error)
    return NextResponse.json(
      { error: '카테고리 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
