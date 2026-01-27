import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 강사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const instructors = await prisma.instructor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            courses: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, instructors })
  } catch (error: any) {
    console.error('Instructors list error:', error)
    return NextResponse.json({ success: false, error: '강사 목록 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 강사 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, bio, expertise, imageUrl, userId } = body

    if (!name || !email) {
      return NextResponse.json({ success: false, error: '필수 항목을 입력해주세요' }, { status: 400 })
    }

    // 이메일 중복 체크
    const existingInstructor = await prisma.instructor.findUnique({
      where: { email }
    })

    if (existingInstructor) {
      return NextResponse.json({ success: false, error: '이미 등록된 이메일입니다' }, { status: 400 })
    }

    // userId가 있으면 해당 사용자가 이미 강사인지 체크
    if (userId) {
      const existingInstructorByUser = await prisma.instructor.findFirst({
        where: { userId: parseInt(userId) }
      })
      if (existingInstructorByUser) {
        return NextResponse.json({ success: false, error: '해당 사용자는 이미 강사로 등록되어 있습니다' }, { status: 400 })
      }
    }

    // 트랜잭션으로 강사 생성 및 사용자 role 변경
    const instructor = await prisma.$transaction(async (tx) => {
      // 강사 생성
      const newInstructor = await tx.instructor.create({
        data: {
          name,
          email,
          phone: phone || null,
          bio: bio || null,
          expertise: expertise || null,
          imageUrl: imageUrl || null,
          userId: userId ? parseInt(userId) : null,
        }
      })

      // userId가 있으면 해당 User의 role을 instructor로 변경 (admin은 유지)
      if (userId) {
        const user = await tx.user.findUnique({
          where: { id: parseInt(userId) },
          select: { role: true }
        })
        // admin이 아닌 경우에만 instructor로 변경
        if (user && user.role !== 'admin') {
          await tx.user.update({
            where: { id: parseInt(userId) },
            data: { role: 'instructor' }
          })
        }
      }

      return newInstructor
    })

    return NextResponse.json({ success: true, instructor })
  } catch (error: any) {
    console.error('Instructor create error:', error)
    return NextResponse.json({ success: false, error: '강사 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
