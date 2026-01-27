import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTemplates, loadTemplateCodes, saveTemplateCodes, NOTIFICATION_TYPES } from '@/lib/kakao-alimtalk'

// GET: 알리고에 등록된 템플릿 목록 + 현재 매핑 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 알리고에 등록된 템플릿 목록 조회
    const aligoTemplates = await getTemplates()

    // 현재 저장된 템플릿 매핑 조회
    const templateMappings = await loadTemplateCodes()

    return NextResponse.json({
      success: true,
      aligoTemplates,
      templateMappings,
      notificationTypes: NOTIFICATION_TYPES
    })

  } catch (error: any) {
    console.error('템플릿 목록 조회 오류:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST: 템플릿 매핑 저장
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { mappings } = await request.json()

    if (!mappings || typeof mappings !== 'object') {
      return NextResponse.json({
        success: false,
        error: '잘못된 요청입니다.'
      }, { status: 400 })
    }

    const result = await saveTemplateCodes(mappings)

    if (result) {
      return NextResponse.json({
        success: true,
        message: '템플릿 매핑이 저장되었습니다.'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '저장 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('템플릿 매핑 저장 오류:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
