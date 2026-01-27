import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 내 사업일기 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await params
    const parsedCourseId = parseInt(courseId)
    const userId = parseInt(session.user.id)

    // 수강 여부 확인
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: parsedCourseId,
        userId,
        status: 'confirmed'
      },
      include: {
        schedule: true,
        course: { select: { id: true, title: true } }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ success: false, error: '수강 중인 강의가 아닙니다' }, { status: 403 })
    }

    // 내 일기 목록 조회
    const diaries = await prisma.execDiary.findMany({
      where: {
        userId,
        courseId: parsedCourseId
      },
      orderBy: { date: 'desc' }
    })

    // 강의 시작일부터 오늘까지의 날짜 목록 생성
    const startDate = new Date(enrollment.schedule.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dateList: { date: string; hasEntry: boolean }[] = []
    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0)

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hasEntry = diaries.some(d => {
        const diaryDate = new Date(d.date).toISOString().split('T')[0]
        return diaryDate === dateStr
      })
      dateList.push({ date: dateStr, hasEntry })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 작성률 계산
    const totalDays = dateList.length
    const writtenDays = dateList.filter(d => d.hasEntry).length
    const completionRate = totalDays > 0 ? Math.round((writtenDays / totalDays) * 100) : 0

    return NextResponse.json({
      success: true,
      course: enrollment.course,
      schedule: enrollment.schedule,
      diaries,
      dateList: dateList.reverse(), // 최신순
      stats: {
        totalDays,
        writtenDays,
        missingDays: totalDays - writtenDays,
        completionRate
      }
    })
  } catch (error) {
    console.error('Diary list fetch error:', error)
    return NextResponse.json({ success: false, error: '일기 목록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST: 사업일기 작성/수정
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await params
    const parsedCourseId = parseInt(courseId)
    const userId = parseInt(session.user.id)

    // 수강 여부 확인
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: parsedCourseId,
        userId,
        status: 'confirmed'
      }
    })

    if (!enrollment) {
      return NextResponse.json({ success: false, error: '수강 중인 강의가 아닙니다' }, { status: 403 })
    }

    const body = await request.json()
    const { date, todayGoal, todayWork, todayLearn, tomorrow, feeling } = body

    const diaryDate = date ? new Date(date) : new Date()
    diaryDate.setHours(0, 0, 0, 0)

    // 일기 작성/수정 (upsert)
    const diary = await prisma.execDiary.upsert({
      where: {
        userId_courseId_date: {
          userId,
          courseId: parsedCourseId,
          date: diaryDate
        }
      },
      update: {
        todayGoal,
        todayWork,
        todayLearn,
        tomorrow,
        feeling,
        isPublic: true // 항상 공개
      },
      create: {
        userId,
        courseId: parsedCourseId,
        scheduleId: enrollment.scheduleId,
        date: diaryDate,
        todayGoal,
        todayWork,
        todayLearn,
        tomorrow,
        feeling,
        isPublic: true // 항상 공개
      }
    })

    return NextResponse.json({ success: true, diary })
  } catch (error) {
    console.error('Diary save error:', error)
    return NextResponse.json({ success: false, error: '일기 저장 중 오류가 발생했습니다' }, { status: 500 })
  }
}
