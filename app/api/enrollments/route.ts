import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaySsamClient } from '@/lib/payssam'
import { sendEmail, createEnrollmentConfirmationEmail } from '@/lib/email'
import { sendEnrollmentCompleteNotification } from '@/lib/notification'

// POST /api/enrollments - 수강 신청
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId, scheduleId } = body

    if (!courseId || !scheduleId) {
      return NextResponse.json(
        { error: '교육과 일정을 선택해주세요' },
        { status: 400 }
      )
    }

    // 교육 정보 조회
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { category: true },
    })

    if (!course) {
      return NextResponse.json(
        { error: '존재하지 않는 교육입니다' },
        { status: 404 }
      )
    }

    // 일정 정보 조회
    const schedule = await prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: '존재하지 않는 일정입니다' },
        { status: 404 }
      )
    }

    // 이미 신청했는지 확인
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: parseInt(session.user.id),
        courseId,
        scheduleId,
        status: { in: ['pending', 'confirmed', 'active', 'completed'] },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: '이미 신청한 교육입니다' },
        { status: 400 }
      )
    }

    // 정원 확인
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        scheduleId,
        status: { in: ['confirmed', 'completed'] },
      },
    })

    if (enrollmentCount >= course.capacity) {
      return NextResponse.json(
        { error: '정원이 마감되었습니다' },
        { status: 400 }
      )
    }

    // 결제 모듈 스킵 - 바로 수강 신청 확정
    // 수강 신청 레코드 생성
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: parseInt(session.user.id),
        courseId,
        scheduleId,
        status: 'confirmed', // 결제 없이 바로 확정
      },
      include: {
        course: {
          include: { category: true },
        },
        schedule: {
          include: {
            sessions: {
              orderBy: { sessionNumber: 'asc' }
            }
          }
        },
        payment: true,
        user: true,
      },
    })

    // 수강신청 완료 알림 (카카오톡 + SMS)
    try {
      const notificationResult = await sendEnrollmentCompleteNotification({
        userId: parseInt(session.user.id),
        phone: enrollment.user.phone || '',
        email: enrollment.user.email,
        userName: enrollment.user.name || '수강생',
        courseName: enrollment.course.title,
        cohort: enrollment.schedule.cohort,
        startDate: enrollment.schedule.startDate,
        endDate: enrollment.schedule.endDate,
        amount: course.isFree ? 0 : course.price,
        enrollmentId: enrollment.id
      })
      console.log(`✅ 수강신청 알림 발송 완료:`, notificationResult)
    } catch (notificationError) {
      console.error('❌ 수강신청 알림 발송 실패:', notificationError)
      // 알림 발송 실패해도 수강신청은 성공으로 처리
    }

    return NextResponse.json({
      enrollment,
      message: '수강 신청이 완료되었습니다',
    }, { status: 201 })
  } catch (error) {
    console.error('수강 신청 실패:', error)
    return NextResponse.json(
      { error: '수강 신청에 실패했습니다' },
      { status: 500 }
    )
  }
}

// GET /api/enrollments - 내 수강 신청 목록
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: parseInt(session.user.id) },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: { category: true },
        },
        schedule: true,
        payment: true,
      },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('수강 신청 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '수강 신청 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
