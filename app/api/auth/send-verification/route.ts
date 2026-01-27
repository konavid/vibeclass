import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, generateVerificationCode, createVerificationMessage } from '@/lib/sms'

// 전역 인증번호 저장소
declare global {
  var verificationStore: Map<string, { code: string; expiresAt: number; attempts: number; verified: boolean }>
}

if (!global.verificationStore) {
  global.verificationStore = new Map()
}

const verificationCodes = global.verificationStore

// 만료된 인증번호 정리 (10분마다)
if (!global.verificationCleanupStarted) {
  setInterval(() => {
    const now = Date.now()
    for (const [phone, data] of verificationCodes.entries()) {
      if (data.expiresAt < now) {
        verificationCodes.delete(phone)
      }
    }
  }, 10 * 60 * 1000)
  global.verificationCleanupStarted = true
}

declare global {
  var verificationCleanupStarted: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 전화번호 형식 검증 (숫자만)
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('010')) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다 (010으로 시작하는 11자리)' },
        { status: 400 }
      )
    }

    // 이전 인증번호 확인 (1분 이내 재발송 방지)
    const existing = verificationCodes.get(cleanPhone)
    if (existing && existing.expiresAt > Date.now()) {
      const remainingSeconds = Math.ceil((existing.expiresAt - Date.now()) / 1000)
      if (remainingSeconds > 240) { // 5분 - 1분 = 4분 = 240초
        return NextResponse.json(
          { error: `인증번호가 이미 발송되었습니다. ${Math.ceil(remainingSeconds / 60)}분 후에 다시 시도해주세요.` },
          { status: 429 }
        )
      }
    }

    // 인증번호 생성
    const code = generateVerificationCode()
    const message = createVerificationMessage(code)

    // SMS 발송
    const sent = await sendSMS({
      receiver: cleanPhone,
      message,
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 인증번호 저장 (5분 유효)
    verificationCodes.set(cleanPhone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5분
      attempts: 0,
      verified: false,
    })

    console.log(`인증번호 발송: ${cleanPhone} - ${code}`)

    return NextResponse.json({
      success: true,
      message: '인증번호가 발송되었습니다',
      expiresIn: 300, // 5분 = 300초
    })
  } catch (error) {
    console.error('인증번호 발송 오류:', error)
    return NextResponse.json(
      { error: '인증번호 발송에 실패했습니다' },
      { status: 500 }
    )
  }
}
