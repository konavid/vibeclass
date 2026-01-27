import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 자료 목록 조회 (scheduleId로 필터링)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: '기수 ID가 필요합니다.' }, { status: 400 })
    }

    const materials = await prisma.cohortMaterial.findMany({
      where: { scheduleId: parseInt(scheduleId) },
      orderBy: { order: 'asc' },
      include: {
        schedule: {
          include: {
            course: { select: { id: true, title: true } }
          }
        }
      }
    })

    return NextResponse.json({ success: true, materials })
  } catch (error) {
    console.error('자료 목록 조회 오류:', error)
    return NextResponse.json({ success: false, error: '자료 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 자료 등록
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduleId, title, content, fileUrl, fileName, fileSize, order, isPublished } = await request.json()

    if (!scheduleId || !title) {
      return NextResponse.json({ success: false, error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    // 기수 확인
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule) {
      return NextResponse.json({ success: false, error: '기수를 찾을 수 없습니다.' }, { status: 404 })
    }

    const material = await prisma.cohortMaterial.create({
      data: {
        scheduleId,
        title,
        content: content || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        order: order ?? 0,
        isPublished: isPublished ?? true
      }
    })

    return NextResponse.json({ success: true, material })
  } catch (error) {
    console.error('자료 등록 오류:', error)
    return NextResponse.json({ success: false, error: '자료 등록 실패' }, { status: 500 })
  }
}
