import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 구글 슬라이드 링크를 임베드 가능한 URL로 변환
function convertToEmbedUrl(slideUrl: string): string | null {
  // 형식 1: https://docs.google.com/presentation/d/PRESENTATION_ID/edit
  // 형식 2: https://docs.google.com/presentation/d/PRESENTATION_ID/edit?usp=sharing
  // 형식 3: https://docs.google.com/presentation/d/PRESENTATION_ID/view

  let presentationId: string | null = null

  // /presentation/d/PRESENTATION_ID 패턴
  const presentationMatch = slideUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)
  if (presentationMatch) {
    presentationId = presentationMatch[1]
  }

  if (presentationId) {
    return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`
  }

  return null
}

// GET: 슬라이드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = parseInt(searchParams.get('scheduleId') || '0')

    if (!scheduleId) {
      return NextResponse.json({ error: '기수 ID가 필요합니다.' }, { status: 400 })
    }

    // 기수 정보
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: { select: { title: true } } }
    })

    if (!schedule) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 슬라이드 목록
    const slides = await prisma.cohortSlide.findMany({
      where: { scheduleId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        cohort: schedule.cohort,
        courseTitle: schedule.course.title
      },
      slides
    })
  } catch (error) {
    console.error('슬라이드 목록 조회 오류:', error)
    return NextResponse.json({ error: '슬라이드 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 슬라이드 등록
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { scheduleId, title, description, slideUrl, order, isPublished } = body

    if (!scheduleId || !title || !slideUrl) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    // 임베드 URL 생성
    const embedUrl = convertToEmbedUrl(slideUrl)
    if (!embedUrl) {
      return NextResponse.json({ error: '올바른 구글 슬라이드 링크가 아닙니다.' }, { status: 400 })
    }

    // 기수 확인
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 최대 order 조회
    const maxOrder = await prisma.cohortSlide.aggregate({
      where: { scheduleId },
      _max: { order: true }
    })

    const slide = await prisma.cohortSlide.create({
      data: {
        scheduleId,
        title,
        description: description || null,
        slideUrl,
        embedUrl,
        order: order ?? (maxOrder._max.order ?? 0) + 1,
        isPublished: isPublished ?? true
      }
    })

    return NextResponse.json(slide, { status: 201 })
  } catch (error) {
    console.error('슬라이드 등록 오류:', error)
    return NextResponse.json({ error: '슬라이드 등록 실패' }, { status: 500 })
  }
}
