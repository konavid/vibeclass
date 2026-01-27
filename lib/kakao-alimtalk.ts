/**
 * 알리고 카카오 알림톡 API 클라이언트
 *
 * 사용 전 필요한 설정:
 * 1. 알리고 사이트(smartsms.aligo.in)에서 카카오채널 등록
 * 2. 발신프로필(senderkey) 발급 받기
 * 3. 템플릿 등록 및 검수 승인 받기
 */

import { prisma } from './prisma'

const KAKAO_API_URL = 'https://kakaoapi.aligo.in'

interface AlimtalkConfig {
  apiKey: string
  userId: string
  senderKey: string
}

interface SendAlimtalkParams {
  receiver: string       // 수신자 전화번호
  tplCode: string        // 템플릿 코드
  subject: string        // 알림톡 제목 (템플릿 제목과 동일해야 함)
  message: string        // 알림톡 내용 (템플릿 내용과 변수 치환 후 일치해야 함)
  button?: {             // 버튼 정보 (선택)
    name: string
    linkType: 'WL' | 'AL' | 'DS' | 'BK' | 'MD'  // WL: 웹링크, AL: 앱링크, DS: 배송조회, BK: 봇키워드, MD: 메시지전달
    linkM?: string       // 모바일 웹 링크
    linkP?: string       // PC 웹 링크
    linkMo?: string      // (deprecated) 모바일 웹 링크 - linkM으로 변환
    linkPc?: string      // (deprecated) PC 웹 링크 - linkP로 변환
  }
  failover?: boolean     // 실패 시 SMS 대체발송 여부
  failoverSubject?: string  // SMS 대체발송 시 제목
  failoverMessage?: string  // SMS 대체발송 시 내용
}

interface AlimtalkResponse {
  code: number
  message: string
  info?: {
    mid: string
    scnt: number
    fcnt: number
  }
}

interface TemplateInfo {
  code: string
  name: string
  content: string
  buttons?: Array<{
    name: string
    linkType: string
    linkM?: string
    linkP?: string
  }>
}

// 알림 유형 키 (DB 저장용)
export const NOTIFICATION_TYPES = {
  REGISTRATION_COMPLETE: 'registration_complete',   // 회원가입 완료
  ENROLLMENT_COMPLETE: 'enrollment_complete',       // 수강신청 완료
  CLASS_REMINDER: 'class_reminder',                 // 수업 시작 1시간 전
  REVIEW_REQUEST: 'review_request',                 // 후기 작성 요청
} as const

// 기본 템플릿 코드 (DB에 저장된 값이 없을 때 사용)
const DEFAULT_TEMPLATE_CODES: Record<string, string> = {
  [NOTIFICATION_TYPES.REGISTRATION_COMPLETE]: 'UD_9850',
  [NOTIFICATION_TYPES.ENROLLMENT_COMPLETE]: 'UD_9851',
  [NOTIFICATION_TYPES.CLASS_REMINDER]: 'UD_9852',
  [NOTIFICATION_TYPES.REVIEW_REQUEST]: 'UD_9853',
}

// 템플릿 코드 캐시
let templateCodesCache: Record<string, string> | null = null
let cacheLoadedAt: number = 0
const CACHE_TTL = 60 * 1000 // 1분

/**
 * DB에서 템플릿 코드 매핑 로드
 */
export async function loadTemplateCodes(): Promise<Record<string, string>> {
  // 캐시가 유효하면 캐시 반환
  if (templateCodesCache && Date.now() - cacheLoadedAt < CACHE_TTL) {
    return templateCodesCache
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'kakao_template_codes' }
    })

    if (setting) {
      templateCodesCache = JSON.parse(setting.value)
      cacheLoadedAt = Date.now()
      return templateCodesCache!
    }
  } catch (error) {
    console.error('템플릿 코드 로드 오류:', error)
  }

  return DEFAULT_TEMPLATE_CODES
}

/**
 * DB에 템플릿 코드 매핑 저장
 */
export async function saveTemplateCodes(codes: Record<string, string>): Promise<boolean> {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'kakao_template_codes' },
      update: { value: JSON.stringify(codes) },
      create: { key: 'kakao_template_codes', value: JSON.stringify(codes) }
    })

    // 캐시 갱신
    templateCodesCache = codes
    cacheLoadedAt = Date.now()

    return true
  } catch (error) {
    console.error('템플릿 코드 저장 오류:', error)
    return false
  }
}

/**
 * 특정 알림 유형의 템플릿 코드 가져오기
 */
export async function getTemplateCode(notificationType: string): Promise<string | null> {
  const codes = await loadTemplateCodes()
  return codes[notificationType] || null
}

// 레거시 호환을 위한 TEMPLATE_CODES (deprecated - getTemplateCode 사용 권장)
export const TEMPLATE_CODES = {
  REGISTRATION_COMPLETE: 'UD_9850',     // 회원가입 완료
  ENROLLMENT_COMPLETE: 'UD_9851',       // 수강신청 완료
  CLASS_REMINDER: 'UD_9852',            // 수업 시작 1시간 전
  REVIEW_REQUEST: 'UD_9853',            // 후기 작성 요청
  PAYMENT_COMPLETE: 'UD_9851',          // 결제 완료 (수강신청 완료와 동일)
}

// 템플릿 정의 (알리고에 등록 필요)
export const TEMPLATES: Record<string, TemplateInfo> = {
  [TEMPLATE_CODES.REGISTRATION_COMPLETE]: {
    code: TEMPLATE_CODES.REGISTRATION_COMPLETE,
    name: '회원가입 완료',
    content: `[바이브클래스] 회원가입 완료

안녕하세요, #{회원명}님!

바이브클래스 회원가입이 완료되었습니다.

AI 시대, 누구나 쉽게 배우는
실전 교육 플랫폼 바이브클래스에서
다양한 강의를 만나보세요.

궁금한 점이 있으시면
언제든 문의해주세요.

감사합니다.`,
    buttons: [{
      name: '강의 둘러보기',
      linkType: 'WL',
      linkM: 'https://vibeclass.kr/courses',
      linkP: 'https://vibeclass.kr/courses'
    }]
  },
  [TEMPLATE_CODES.ENROLLMENT_COMPLETE]: {
    code: TEMPLATE_CODES.ENROLLMENT_COMPLETE,
    name: '수강신청 완료',
    content: `[바이브클래스] 수강신청 완료

안녕하세요, #{회원명}님!

#{강의명} #{기수}기 수강신청이 완료되었습니다.

▶ 수업기간: #{수업기간}
▶ 결제금액: #{결제금액}원

수업 시작 1시간 전에 알림을 보내드립니다.
감사합니다.`,
    buttons: [{
      name: '내 강의 보기',
      linkType: 'WL',
      linkM: 'https://vibeclass.kr/my/enrollments',
      linkP: 'https://vibeclass.kr/my/enrollments'
    }]
  },
  [TEMPLATE_CODES.CLASS_REMINDER]: {
    code: TEMPLATE_CODES.CLASS_REMINDER,
    name: '수업 시작 알림',
    content: `[바이브클래스] 수업 시작 안내

안녕하세요, #{회원명}님!

오늘 #{시작시간}에 수업이 시작됩니다.

▶ 강의: #{강의명}
▶ 회차: #{기수}기 #{회차}회차
▶ 시간: #{시작시간} ~ #{종료시간}

내 강의 페이지에서 수업에 입장해주세요.`,
    buttons: [{
      name: '내 강의 보기',
      linkType: 'WL',
      linkM: 'https://vibeclass.kr/my/enrollments',
      linkP: 'https://vibeclass.kr/my/enrollments'
    }]
  },
  [TEMPLATE_CODES.REVIEW_REQUEST]: {
    code: TEMPLATE_CODES.REVIEW_REQUEST,
    name: '후기 작성 요청',
    content: `[바이브클래스] 수강 후기 작성 안내

안녕하세요, #{회원명}님!

#{강의명} #{기수}기 수강이 완료되었습니다.
수고하셨습니다!

소중한 후기를 남겨주시면
다른 수강생분들께 큰 도움이 됩니다.`,
    buttons: [{
      name: '후기 작성하기',
      linkType: 'WL',
      linkM: 'https://vibeclass.kr/my/enrollments',
      linkP: 'https://vibeclass.kr/my/enrollments'
    }]
  }
}

/**
 * 알리고 설정 가져오기
 */
function getConfig(): AlimtalkConfig {
  const apiKey = process.env.ALIGO_API_KEY
  const userId = process.env.ALIGO_USER_ID
  const senderKey = process.env.ALIGO_SENDER_KEY

  if (!apiKey || !userId) {
    throw new Error('알리고 API 설정이 없습니다')
  }

  if (!senderKey) {
    throw new Error('카카오 알림톡 senderkey가 설정되지 않았습니다')
  }

  return { apiKey, userId, senderKey }
}

/**
 * 알림톡 발송
 */
export async function sendAlimtalk(params: SendAlimtalkParams): Promise<{ success: boolean; mid?: string; error?: string }> {
  try {
    const config = getConfig()

    // 전화번호 정리
    const receiver = params.receiver.replace(/-/g, '')

    const formData = new URLSearchParams()
    formData.append('apikey', config.apiKey)
    formData.append('userid', config.userId)
    formData.append('senderkey', config.senderKey)
    formData.append('tpl_code', params.tplCode)
    formData.append('sender', process.env.ALIGO_SENDER || '')
    formData.append('receiver_1', receiver)
    formData.append('subject_1', params.subject)
    formData.append('message_1', params.message)

    // 버튼 정보
    if (params.button) {
      const buttonJson = JSON.stringify({
        button: [{
          name: params.button.name,
          linkType: params.button.linkType,
          linkM: params.button.linkM || params.button.linkMo,
          linkP: params.button.linkP || params.button.linkPc
        }]
      })
      formData.append('button_1', buttonJson)
    }

    // 실패 시 SMS 대체발송
    if (params.failover) {
      formData.append('failover', 'Y')
      if (params.failoverSubject) {
        formData.append('fsubject_1', params.failoverSubject)
      }
      if (params.failoverMessage) {
        formData.append('fmessage_1', params.failoverMessage)
      }
    }

    const response = await fetch(`${KAKAO_API_URL}/akv10/alimtalk/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data: AlimtalkResponse = await response.json()

    console.log('알림톡 발송 응답:', data)

    if (data.code === 0) {
      return { success: true, mid: data.info?.mid }
    } else {
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('알림톡 발송 오류:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 알림톡 발송 결과 조회
 */
export async function getAlimtalkResult(mid: string): Promise<any> {
  try {
    const config = getConfig()

    const formData = new URLSearchParams()
    formData.append('apikey', config.apiKey)
    formData.append('userid', config.userId)
    formData.append('mid', mid)
    formData.append('page', '1')

    const response = await fetch(`${KAKAO_API_URL}/akv10/history/detail/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    return await response.json()
  } catch (error) {
    console.error('알림톡 결과 조회 오류:', error)
    return null
  }
}

/**
 * 템플릿 목록 조회
 */
export async function getTemplates(): Promise<any> {
  try {
    const config = getConfig()

    const formData = new URLSearchParams()
    formData.append('apikey', config.apiKey)
    formData.append('userid', config.userId)
    formData.append('senderkey', config.senderKey)

    const response = await fetch(`${KAKAO_API_URL}/akv10/template/list/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    return await response.json()
  } catch (error) {
    console.error('템플릿 목록 조회 오류:', error)
    return null
  }
}

/**
 * 템플릿 등록 요청
 * 주의: 등록 후 카카오 검수 기간(4-5일)이 필요합니다
 */
export async function registerTemplate(template: TemplateInfo): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig()

    const formData = new URLSearchParams()
    formData.append('apikey', config.apiKey)
    formData.append('userid', config.userId)
    formData.append('senderkey', config.senderKey)
    formData.append('tpl_code', template.code)
    formData.append('tpl_name', template.name)
    formData.append('tpl_content', template.content)

    if (template.buttons && template.buttons.length > 0) {
      const buttonJson = JSON.stringify({ button: template.buttons })
      formData.append('tpl_button', buttonJson)
    }

    const response = await fetch(`${KAKAO_API_URL}/akv10/template/add/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    console.log('템플릿 등록 응답:', data)

    if (data.code === 0) {
      return { success: true }
    } else {
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('템플릿 등록 오류:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 템플릿 검수 요청
 */
export async function requestTemplateReview(tplCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig()

    const formData = new URLSearchParams()
    formData.append('apikey', config.apiKey)
    formData.append('userid', config.userId)
    formData.append('senderkey', config.senderKey)
    formData.append('tpl_code', tplCode)

    const response = await fetch(`${KAKAO_API_URL}/akv10/template/request/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    console.log('템플릿 검수 요청 응답:', data)

    if (data.code === 0) {
      return { success: true }
    } else {
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('템플릿 검수 요청 오류:', error)
    return { success: false, error: (error as Error).message }
  }
}
