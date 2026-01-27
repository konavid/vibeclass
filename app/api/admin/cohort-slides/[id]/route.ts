import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 구글 슬라이드 링크를 임베드 가능한 URL로 변환
function convertToEmbedUrl(slideUrl: string): string | null {
  let presentationId: string | null = null

  const presentationMatch = slideUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)
  if (presentationMatch) {
    presentationId = presentationMatch[1]
  }

  if (presentationId) {
    return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`
  }

  return null
}

// GET: 슬라이드 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const slideId = parseInt(id)

    const slide = await prisma.cohortSlide.findUnique({
      where: { id: slideId },
      include: {
        schedule: {
          include: { course: { select: { title: true } } }
        }
      }
    })

    if (!slide) {
      return NextResponse.json({ error: '슬라이드를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(slide)
  } catch (error) {
    console.error('슬라이드 조회 오류:', error)
    return NextResponse.json({ error: '슬라이드 조회 실패' }, { status: 500 })
  }
}

// PATCH: 슬라이드 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const slideId = parseInt(id)
    const body = await request.json()
    const { title, description, slideUrl, order, isPublished } = body

    const existingSlide = await prisma.cohortSlide.findUnique({
      where: { id: slideId }
    })

    if (!existingSlide) {
      return NextResponse.json({ error: '슬라이드를 찾을 수 없습니다.' }, { status: 404 })
    }

    // URL 변경 시 임베드 URL도 업데이트
    let embedUrl = existingSlide.embedUrl
    if (slideUrl && slideUrl !== existingSlide.slideUrl) {
      embedUrl = convertToEmbedUrl(slideUrl)
      if (!embedUrl) {
        return NextResponse.json({ error: '올바른 구글 슬라이드 링크가 아닙니다.' }, { status: 400 })
      }
    }

    const slide = await prisma.cohortSlide.update({
      where: { id: slideId },
      data: {
        title: title ?? existingSlide.title,
        description: description !== undefined ? description : existingSlide.description,
        slideUrl: slideUrl ?? existingSlide.slideUrl,
        embedUrl,
        order: order ?? existingSlide.order,
        isPublished: isPublished ?? existingSlide.isPublished
      }
    })

    return NextResponse.json(slide)
  } catch (error) {
    console.error('슬라이드 수정 오류:', error)
    return NextResponse.json({ error: '슬라이드 수정 실패' }, { status: 500 })
  }
}

// DELETE: 슬라이드 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const slideId = parseInt(id)

    const slide = await prisma.cohortSlide.findUnique({
      where: { id: slideId }
    })

    if (!slide) {
      return NextResponse.json({ error: '슬라이드를 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.cohortSlide.delete({
      where: { id: slideId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('슬라이드 삭제 오류:', error)
    return NextResponse.json({ error: '슬라이드 삭제 실패' }, { status: 500 })
  }
}
