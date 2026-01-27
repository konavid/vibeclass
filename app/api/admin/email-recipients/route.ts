import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/email-recipients - 이메일 수신자 미리보기
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recipientType = searchParams.get('recipientType')
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const scheduleId = searchParams.get('scheduleId')
    const role = searchParams.get('role')

    let recipients: { id: number; name: string; email: string; cohort?: number }[] = []

    switch (recipientType) {
      case 'all':
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: 'asc' }
        })
        recipients = allUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
        break

      case 'single':
        if (userId) {
          const user = await prisma.user.findUnique({
            where: {
              id: parseInt(userId),
              isActive: true
            },
            select: { id: true, name: true, email: true }
          })
          if (user) {
            recipients = [{ id: user.id, name: user.name, email: user.email }]
          }
        }
        break

      case 'enrolled':
        if (courseId) {
          const enrollmentWhere: {
            courseId: number
            status: { in: string[] }
            user: { isActive: boolean }
            scheduleId?: number
          } = {
            courseId: parseInt(courseId),
            status: { in: ['confirmed', 'active', 'completed'] },
            user: { isActive: true }
          }
          if (scheduleId) {
            enrollmentWhere.scheduleId = parseInt(scheduleId)
          }
          const enrollments = await prisma.enrollment.findMany({
            where: enrollmentWhere,
            include: {
              user: { select: { id: true, name: true, email: true } },
              schedule: { select: { cohort: true } }
            },
            orderBy: { user: { name: 'asc' } }
          })
          recipients = enrollments.map(e => ({
            id: e.user.id,
            name: e.user.name,
            email: e.user.email,
            cohort: e.schedule.cohort
          }))
        }
        break

      case 'role':
        if (role) {
          const roleUsers = await prisma.user.findMany({
            where: {
              role,
              isActive: true
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' }
          })
          recipients = roleUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
        }
        break
    }

    // 중복 제거 (이메일 기준)
    const uniqueRecipients = recipients.filter(
      (recipient, index, self) =>
        index === self.findIndex(r => r.email === recipient.email)
    )

    return NextResponse.json({
      recipients: uniqueRecipients,
      count: uniqueRecipients.length
    })
  } catch (error) {
    console.error('수신자 조회 오류:', error)
    return NextResponse.json(
      { error: '수신자 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
