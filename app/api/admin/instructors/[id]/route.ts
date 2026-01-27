import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 강사 상세 조회
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
    const instructor = await prisma.instructor.findUnique({
      where: { id: parseInt(id) },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        _count: {
          select: {
            courses: true,
          }
        }
      }
    })

    if (!instructor) {
      return NextResponse.json({ success: false, error: '강사를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, instructor })
  } catch (error) {
    console.error('Instructor detail error:', error)
    return NextResponse.json({ success: false, error: '강사 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// PATCH: 강사 수정
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
    const body = await request.json()
    const { name, email, phone, bio, expertise, imageUrl, isActive, userId } = body

    // 현재 강사 정보 조회
    const currentInstructor = await prisma.instructor.findUnique({
      where: { id: parseInt(id) }
    })

    if (!currentInstructor) {
      return NextResponse.json({ success: false, error: '강사를 찾을 수 없습니다' }, { status: 404 })
    }

    // 이메일 변경 시 중복 체크
    if (email) {
      const existingInstructor = await prisma.instructor.findFirst({
        where: {
          email,
          NOT: { id: parseInt(id) }
        }
      })

      if (existingInstructor) {
        return NextResponse.json({ success: false, error: '이미 등록된 이메일입니다' }, { status: 400 })
      }
    }

    // userId 변경 시 중복 체크
    if (userId !== undefined && userId !== currentInstructor.userId) {
      if (userId) {
        const existingInstructorByUser = await prisma.instructor.findFirst({
          where: { userId: parseInt(userId) }
        })
        if (existingInstructorByUser) {
          return NextResponse.json({ success: false, error: '해당 사용자는 이미 다른 강사로 등록되어 있습니다' }, { status: 400 })
        }
      }
    }

    // 트랜잭션으로 강사 수정 및 사용자 role 변경
    const instructor = await prisma.$transaction(async (tx) => {
      // userId 변경 처리
      if (userId !== undefined && userId !== currentInstructor.userId) {
        // 기존 연결된 사용자의 role을 customer로 변경 (admin은 유지)
        if (currentInstructor.userId) {
          const oldUser = await tx.user.findUnique({
            where: { id: currentInstructor.userId },
            select: { role: true }
          })
          // admin이 아닌 경우에만 customer로 변경
          if (oldUser && oldUser.role !== 'admin') {
            await tx.user.update({
              where: { id: currentInstructor.userId },
              data: { role: 'customer' }
            })
          }
        }

        // 새로 연결된 사용자의 role을 instructor로 변경 (admin은 유지)
        if (userId) {
          const newUser = await tx.user.findUnique({
            where: { id: parseInt(userId) },
            select: { role: true }
          })
          // admin이 아닌 경우에만 instructor로 변경
          if (newUser && newUser.role !== 'admin') {
            await tx.user.update({
              where: { id: parseInt(userId) },
              data: { role: 'instructor' }
            })
          }
        }
      }

      // 강사 정보 업데이트
      const updatedInstructor = await tx.instructor.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone }),
          ...(bio !== undefined && { bio }),
          ...(expertise !== undefined && { expertise }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(isActive !== undefined && { isActive }),
          ...(userId !== undefined && { userId: userId ? parseInt(userId) : null }),
        },
        include: {
          user: true
        }
      })

      return updatedInstructor
    })

    // 강사에게 연결된 User가 있고, 이미지가 변경되면 User.image도 함께 업데이트
    if (imageUrl !== undefined && instructor.userId) {
      await prisma.user.update({
        where: { id: instructor.userId },
        data: { image: imageUrl || null }
      })
    }

    return NextResponse.json({ success: true, instructor })
  } catch (error) {
    console.error('Instructor update error:', error)
    return NextResponse.json({ success: false, error: '강사 수정 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE: 강사 삭제
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

    // 강의가 연결되어 있는지 확인
    const courseCount = await prisma.course.count({
      where: { instructorId: parseInt(id) }
    })

    if (courseCount > 0) {
      return NextResponse.json({
        success: false,
        error: '강의가 등록된 강사는 삭제할 수 없습니다'
      }, { status: 400 })
    }

    await prisma.instructor.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Instructor delete error:', error)
    return NextResponse.json({ success: false, error: '강사 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
