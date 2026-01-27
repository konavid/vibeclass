import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT: 강사 서류 제출
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ success: false, error: '강사 신청 내역이 없습니다.' }, { status: 400 })
    }

    // 합격 상태에서만 서류 제출 가능
    if (user.instructorApplication.status !== 'approved') {
      return NextResponse.json({ success: false, error: '합격 상태에서만 서류를 제출할 수 있습니다.' }, { status: 400 })
    }

    const body = await request.json()
    const {
      docName,
      docAddress,
      docPhone,
      docBankName,
      docBankAccount,
      docBankHolder,
      docBankCopyUrl,
      docIdCopyUrl,
      docYoutubeEmail,
      docAdditionalInfo,
      docAdditionalFiles
    } = body

    // 필수 항목 검증
    if (!docName || !docAddress || !docPhone || !docBankName || !docBankAccount || !docBankHolder) {
      return NextResponse.json({ success: false, error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    if (!docBankCopyUrl || !docIdCopyUrl) {
      return NextResponse.json({ success: false, error: '통장사본과 주민등록증 사본을 업로드해주세요.' }, { status: 400 })
    }

    const application = await prisma.instructorApplication.update({
      where: { id: user.instructorApplication.id },
      data: {
        docName,
        docAddress,
        docPhone,
        docBankName,
        docBankAccount,
        docBankHolder,
        docBankCopyUrl,
        docIdCopyUrl,
        docYoutubeEmail: docYoutubeEmail || null,
        docAdditionalInfo: docAdditionalInfo || null,
        docAdditionalFiles: docAdditionalFiles ? JSON.stringify(docAdditionalFiles) : null,
        documentsSubmittedAt: new Date(),
        status: 'documents_submitted'
      }
    })

    return NextResponse.json({ success: true, application })
  } catch (error: any) {
    console.error('서류 제출 실패:', error)
    return NextResponse.json({ success: false, error: '서류 제출 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
