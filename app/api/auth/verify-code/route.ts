import { NextRequest, NextResponse } from 'next/server'

// 동일한 Map 참조를 사용하기 위해 별도 모듈로 분리하는 것이 좋지만,
// 간단하게 하기 위해 여기서는 전역 변수 사용
// 실제로는 Redis나 데이터베이스를 사용하는 것이 권장됩니다
declare global {
  var verificationStore: Map<string, { code: string; expiresAt: number; attempts: number; verified: boolean }>
}

if (!global.verificationStore) {
  global.verificationStore = new Map()
}

const verificationCodes = global.verificationStore

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json(
        { error: '전화번호와 인증번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 전화번호 정규화
    const cleanPhone = phone.replace(/[^0-9]/g, '')

    // 인증번호 확인
    const stored = verificationCodes.get(cleanPhone)

    if (!stored) {
      return NextResponse.json(
        { error: '인증번호가 발송되지 않았습니다. 먼저 인증번호를 요청해주세요.' },
        { status: 400 }
      )
    }

    // 만료 확인
    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(cleanPhone)
      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      )
    }

    // 시도 횟수 확인 (5회 제한)
    if (stored.attempts >= 5) {
      verificationCodes.delete(cleanPhone)
      return NextResponse.json(
        { error: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.' },
        { status: 400 }
      )
    }

    // 인증번호 검증
    if (stored.code !== code) {
      stored.attempts++
      const remainingAttempts = 5 - stored.attempts

      return NextResponse.json(
        {
          error: `인증번호가 일치하지 않습니다. (남은 시도: ${remainingAttempts}회)`,
          remainingAttempts
        },
        { status: 400 }
      )
    }

    // 인증 성공
    stored.verified = true
    console.log(`인증 성공: ${cleanPhone}`)

    return NextResponse.json({
      success: true,
      message: '인증되었습니다',
    })
  } catch (error) {
    console.error('인증번호 검증 오류:', error)
    return NextResponse.json(
      { error: '인증번호 검증에 실패했습니다' },
      { status: 500 }
    )
  }
}
