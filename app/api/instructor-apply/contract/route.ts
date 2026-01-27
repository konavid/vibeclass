import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: 계약서 서명
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        instructorApplication: true
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!user.instructorApplication) {
      return NextResponse.json({ success: false, error: '강사 신청 내역이 없습니다.' }, { status: 404 })
    }

    if (user.instructorApplication.status !== 'contract_pending') {
      return NextResponse.json({ success: false, error: '계약서 서명 대기 상태가 아닙니다.' }, { status: 400 })
    }

    const body = await request.json()
    const { signature, signatureImage, contractContent } = body

    if (!signature) {
      return NextResponse.json({ success: false, error: '서명이 필요합니다.' }, { status: 400 })
    }

    // 트랜잭션으로 처리: 계약 완료 + 강사 생성 + 사용자 role 변경
    const result = await prisma.$transaction(async (tx) => {
      // 1. 신청 상태를 계약 완료로 변경 (계약 내용도 저장)
      const updatedApplication = await tx.instructorApplication.update({
        where: { id: user.instructorApplication!.id },
        data: {
          status: 'contract_completed',
          contractSignedAt: new Date(),
          signatureImage: signatureImage || null,
          contractContent: contractContent || null // 서명 당시 계약 내용 저장
        }
      })

      // 2. 강사 테이블에 추가
      const newInstructor = await tx.instructor.create({
        data: {
          userId: user.id,
          name: user.instructorApplication!.docName || user.instructorApplication!.name,
          email: user.email,
          phone: user.instructorApplication!.docPhone || user.phone || null,
          bio: user.instructorApplication!.bio,
          expertise: user.instructorApplication!.field,
          imageUrl: user.instructorApplication!.photoUrl || user.image
        }
      })

      // 3. 사용자 role을 instructor로 변경
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'instructor' }
      })

      return { application: updatedApplication, instructor: newInstructor }
    })

    return NextResponse.json({
      success: true,
      application: result.application,
      instructor: result.instructor,
      message: '계약서 서명이 완료되었습니다. 강사로 등록되었습니다.'
    })
  } catch (error: any) {
    console.error('계약서 서명 실패:', error)
    return NextResponse.json({ success: false, error: '서명 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
