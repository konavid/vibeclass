import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/instructor/profile - 강사 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    // 소셜 링크 및 서류 정보는 instructorApplication에서 가져옴
    const instructorApplication = await prisma.instructorApplication.findFirst({
      where: { userId: parseInt(session.user.id) },
      select: {
        youtubeUrl: true,
        instagramUrl: true,
        kakaoUrl: true,
        docName: true,
        docAddress: true,
        docPhone: true,
        docBankName: true,
        docBankAccount: true,
        docBankHolder: true,
        docBankCopyUrl: true,
        docIdCopyUrl: true,
        docYoutubeEmail: true
      }
    })

    const isAdmin = session.user.role === 'admin'

    if (!instructor && !isAdmin) {
      return NextResponse.json(
        { error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // admin이면서 강사 정보가 없으면 기본 프로필 반환
    if (!instructor) {
      return NextResponse.json({
        success: true,
        profile: {
          id: 0,
          name: session.user.name || '관리자',
          email: session.user.email || '',
          phone: null,
          bio: null,
          expertise: null,
          imageUrl: null,
          youtubeUrl: null,
          instagramUrl: null,
          openChatUrl: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        phone: instructor.phone,
        bio: instructor.bio,
        expertise: instructor.expertise,
        imageUrl: instructor.imageUrl,
        consultingPrice: instructor.consultingPrice,
        consultingEnabled: instructor.consultingEnabled,
        youtubeUrl: instructorApplication?.youtubeUrl || null,
        instagramUrl: instructorApplication?.instagramUrl || null,
        openChatUrl: instructorApplication?.kakaoUrl || null,
        // 서류 정보
        docName: instructorApplication?.docName || null,
        docAddress: instructorApplication?.docAddress || null,
        docPhone: instructorApplication?.docPhone || null,
        docBankName: instructorApplication?.docBankName || null,
        docBankAccount: instructorApplication?.docBankAccount || null,
        docBankHolder: instructorApplication?.docBankHolder || null,
        docBankCopyUrl: instructorApplication?.docBankCopyUrl || null,
        docIdCopyUrl: instructorApplication?.docIdCopyUrl || null,
        docYoutubeEmail: instructorApplication?.docYoutubeEmail || null
      }
    })
  } catch (error) {
    console.error('강사 프로필 조회 실패:', error)
    return NextResponse.json(
      { error: '프로필 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT /api/instructor/profile - 강사 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: '강사 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const instructor = await prisma.instructor.findFirst({
      where: { userId: parseInt(session.user.id) }
    })

    const isAdmin = session.user.role === 'admin'

    if (!instructor && !isAdmin) {
      return NextResponse.json(
        { error: '강사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 강사 정보가 없으면 생성, 있으면 업데이트
    let updatedInstructor;

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (bio !== undefined) updateData.bio = bio
    if (expertise !== undefined) updateData.expertise = expertise
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (consultingPrice !== undefined) updateData.consultingPrice = parseInt(consultingPrice) || 0
    if (consultingEnabled !== undefined) updateData.consultingEnabled = consultingEnabled

    if (!instructor) {
      if (isAdmin) {
        // Admin인 경우 새로 생성
        updatedInstructor = await prisma.instructor.create({
          data: {
            userId: parseInt(session.user.id),
            name: name || session.user.name || '강사',
            email: session.user.email || '',
            phone: phone || null,
            bio: bio || null,
            expertise: expertise || null,
            imageUrl: imageUrl || null,
            consultingPrice: parseInt(consultingPrice) || 0,
            consultingEnabled: consultingEnabled !== undefined ? consultingEnabled : false,
          }
        })
      } else {
        return NextResponse.json(
          { error: '강사 정보가 존재하지 않습니다.' },
          { status: 404 }
        )
      }
    } else {
      updatedInstructor = await prisma.instructor.update({
        where: { id: instructor.id },
        data: updateData
      })
    }

    // 프로필 이미지가 변경되면 User.image와 InstructorApplication.photoUrl도 함께 업데이트
    if (imageUrl !== undefined) {
      await prisma.user.update({
        where: { id: parseInt(session.user.id) },
        data: { image: imageUrl || null }
      })

      // InstructorApplication.photoUrl도 업데이트
      await prisma.instructorApplication.updateMany({
        where: { userId: parseInt(session.user.id) },
        data: { photoUrl: imageUrl || null }
      })
    }

    // 소셜 링크 및 서류 정보는 instructorApplication에 저장
    const hasApplicationUpdate =
      youtubeUrl !== undefined || instagramUrl !== undefined || openChatUrl !== undefined ||
      docName !== undefined || docAddress !== undefined || docPhone !== undefined ||
      docBankName !== undefined || docBankAccount !== undefined || docBankHolder !== undefined ||
      docBankCopyUrl !== undefined || docIdCopyUrl !== undefined || docYoutubeEmail !== undefined

    if (hasApplicationUpdate) {
      // 기존 InstructorApplication 확인
      const existingApplication = await prisma.instructorApplication.findUnique({
        where: { userId: parseInt(session.user.id) }
      })

      const applicationUpdateData: any = {
        ...(youtubeUrl !== undefined && { youtubeUrl: youtubeUrl || null }),
        ...(instagramUrl !== undefined && { instagramUrl: instagramUrl || null }),
        ...(openChatUrl !== undefined && { kakaoUrl: openChatUrl || null }),
        // 서류 정보
        ...(docName !== undefined && { docName: docName || null }),
        ...(docAddress !== undefined && { docAddress: docAddress || null }),
        ...(docPhone !== undefined && { docPhone: docPhone || null }),
        ...(docBankName !== undefined && { docBankName: docBankName || null }),
        ...(docBankAccount !== undefined && { docBankAccount: docBankAccount || null }),
        ...(docBankHolder !== undefined && { docBankHolder: docBankHolder || null }),
        ...(docBankCopyUrl !== undefined && { docBankCopyUrl: docBankCopyUrl || null }),
        ...(docIdCopyUrl !== undefined && { docIdCopyUrl: docIdCopyUrl || null }),
        ...(docYoutubeEmail !== undefined && { docYoutubeEmail: docYoutubeEmail || null })
      }

      if (existingApplication) {
        // 있으면 업데이트
        await prisma.instructorApplication.update({
          where: { userId: parseInt(session.user.id) },
          data: applicationUpdateData
        })
      } else {
        // 없으면 생성 (어드민에서 직접 추가된 강사의 경우)
        // instructor가 null일 수 있으므로 body 데이터나 기본값 사용
        await prisma.instructorApplication.create({
          data: {
            userId: parseInt(session.user.id),
            name: updatedInstructor.name,
            field: updatedInstructor.expertise || '강사',
            bio: updatedInstructor.bio || '',
            photoUrl: updatedInstructor.imageUrl || null,
            status: 'contracted', // 이미 강사로 등록된 상태
            privacyAgreed: true,
            ...applicationUpdateData
          }
        })
      }
    }

    // 업데이트된 소셜 링크 및 서류 정보 조회
    const updatedApplication = await prisma.instructorApplication.findFirst({
      where: { userId: parseInt(session.user.id) },
      select: {
        youtubeUrl: true,
        instagramUrl: true,
        kakaoUrl: true,
        docName: true,
        docAddress: true,
        docPhone: true,
        docBankName: true,
        docBankAccount: true,
        docBankHolder: true,
        docBankCopyUrl: true,
        docIdCopyUrl: true,
        docYoutubeEmail: true
      }
    })

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedInstructor.id,
        name: updatedInstructor.name,
        email: updatedInstructor.email,
        phone: updatedInstructor.phone,
        bio: updatedInstructor.bio,
        expertise: updatedInstructor.expertise,
        imageUrl: updatedInstructor.imageUrl,
        consultingPrice: updatedInstructor.consultingPrice,
        consultingEnabled: updatedInstructor.consultingEnabled,
        youtubeUrl: updatedApplication?.youtubeUrl || null,
        instagramUrl: updatedApplication?.instagramUrl || null,
        openChatUrl: updatedApplication?.kakaoUrl || null,
        // 서류 정보
        docName: updatedApplication?.docName || null,
        docAddress: updatedApplication?.docAddress || null,
        docPhone: updatedApplication?.docPhone || null,
        docBankName: updatedApplication?.docBankName || null,
        docBankAccount: updatedApplication?.docBankAccount || null,
        docBankHolder: updatedApplication?.docBankHolder || null,
        docBankCopyUrl: updatedApplication?.docBankCopyUrl || null,
        docIdCopyUrl: updatedApplication?.docIdCopyUrl || null,
        docYoutubeEmail: updatedApplication?.docYoutubeEmail || null
      }
    })
  } catch (error: any) {
    console.error('강사 프로필 수정 실패:', error)
    return NextResponse.json(
      { error: `프로필 수정 실패: ${error.message || '알 수 없는 오류'}` },
      { status: 500 }
    )
  }
}
