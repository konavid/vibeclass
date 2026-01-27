import crypto from 'crypto'

interface SendSmsParams {
  receiver: string
  message: string
}

interface AligoResponse {
  result_code: string
  message: string
  msg_id?: string
  success_cnt?: number
  error_cnt?: number
  msg_type?: string
}

/**
 * 알리고 SMS 발송
 */
export async function sendSMS({ receiver, message }: SendSmsParams): Promise<boolean> {
  try {
    const apiKey = process.env.ALIGO_API_KEY
    const userId = process.env.ALIGO_USER_ID
    const sender = process.env.ALIGO_SENDER

    if (!apiKey || !userId || !sender) {
      console.error('알리고 SMS 설정이 누락되었습니다')
      return false
    }

    // 전화번호에서 하이픈 제거
    const cleanReceiver = receiver.replace(/-/g, '')
    const cleanSender = sender.replace(/-/g, '')

    const params = new URLSearchParams({
      key: apiKey,
      user_id: userId,
      sender: cleanSender,
      receiver: cleanReceiver,
      msg: message,
      msg_type: 'SMS',
      title: '바이브클래스',
    })

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data: AligoResponse = await response.json()

    console.log('알리고 SMS 응답:', data)

    if (data.result_code === '1') {
      return true
    } else {
      console.error('SMS 발송 실패:', data.message)
      return false
    }
  } catch (error) {
    console.error('SMS 발송 오류:', error)
    return false
  }
}

/**
 * 6자리 랜덤 인증번호 생성
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * 인증번호 포맷팅된 메시지 생성
 */
export function createVerificationMessage(code: string): string {
  return `[바이브클래스] 인증번호는 [${code}]입니다. 정확히 입력해주세요.`
}
