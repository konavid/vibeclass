import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: 기수 생성
export async function POST(
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
    const { cohort, startDate, endDate, status, meetId, meetLink, kakaoTalkLink } = body

    if (!cohort || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: '필수 항목을 입력해주세요' }, { status: 400 })
    }

    // 기수 생성 (강의실 링크는 직접 등록)
    const schedule = await prisma.courseSchedule.create({
      data: {
        courseId: parseInt(id),
        cohort: parseInt(cohort),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        meetLink: meetLink || null,
        meetId: meetId || null,
        kakaoTalkLink: kakaoTalkLink || null,
        status: status || 'scheduled',
      }
    })

    // 최종 결과 조회
    const finalSchedule = await prisma.courseSchedule.findUnique({
      where: { id: schedule.id },
      include: {
        sessions: {
          orderBy: { sessionNumber: 'asc' }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    })

    return NextResponse.json({ success: true, schedule: finalSchedule })
  } catch (error) {
    console.error('Schedule create error:', error)
    return NextResponse.json({ success: false, error: '기수 생성 중 오류가 발생했습니다' }, { status: 500 })
  }
}
