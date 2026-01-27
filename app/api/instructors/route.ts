import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/instructors - 공개용 강사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const instructors = await prisma.instructor.findMany({
      where: {
        // 활성화되고 컨설팅 가능한 강사만 조회
        isActive: true,
        consultingEnabled: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        expertise: true,
        imageUrl: true,
        consultingPrice: true,
        consultingEnabled: true,
        courses: {
          where: {
            approvalStatus: 'approved'
          },
          select: {
            id: true,
            title: true
          },
          take: 5
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(instructors)
  } catch (error) {
    console.error('강사 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '강사 목록을 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}
