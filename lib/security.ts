/**
 * 보안 유틸리티
 * 인증, 권한 검증, 입력 검증 등 보안 관련 공통 함수
 */

import { getServerSession, Session } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'

// 역할 타입
export type UserRole = 'admin' | 'instructor' | 'customer'

// 인증 실패 응답
export const unauthorizedResponse = (message = '로그인이 필요합니다.') =>
  NextResponse.json({ success: false, error: message }, { status: 401 })

// 권한 없음 응답
export const forbiddenResponse = (message = '접근 권한이 없습니다.') =>
  NextResponse.json({ success: false, error: message }, { status: 403 })

// 잘못된 요청 응답
export const badRequestResponse = (message: string) =>
  NextResponse.json({ success: false, error: message }, { status: 400 })

// 서버 에러 응답
export const serverErrorResponse = (message = '서버 오류가 발생했습니다.') =>
  NextResponse.json({ success: false, error: message }, { status: 500 })

// 리소스 없음 응답
export const notFoundResponse = (message = '리소스를 찾을 수 없습니다.') =>
  NextResponse.json({ success: false, error: message }, { status: 404 })

/**
 * 인증된 세션 가져오기
 * @returns 세션 또는 null
 */
export async function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions)
}

/**
 * 인증 검증
 * @returns { session, error } - session이 있으면 인증됨, error가 있으면 인증 실패
 */
export async function requireAuth(): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return { session: null, error: unauthorizedResponse() }
  }

  return { session, error: null }
}

/**
 * 특정 역할 필수
 * @param allowedRoles 허용된 역할 배열
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const { session, error } = await requireAuth()

  if (error) {
    return { session: null, error }
  }

  const userRole = session!.user.role as UserRole

  if (!allowedRoles.includes(userRole)) {
    return { session: null, error: forbiddenResponse() }
  }

  return { session: session!, error: null }
}

/**
 * 관리자 권한 필수
 */
export async function requireAdmin() {
  return requireRole(['admin'])
}

/**
 * 강사 권한 필수 (관리자도 허용)
 */
export async function requireInstructor() {
  return requireRole(['admin', 'instructor'])
}

// ============================================
// 입력 검증 함수
// ============================================

/**
 * 문자열 길이 검증
 */
export function validateStringLength(
  value: string | null | undefined,
  minLength: number,
  maxLength: number,
  fieldName: string
): string | null {
  if (!value) {
    return `${fieldName}을(를) 입력해주세요.`
  }

  const trimmed = value.trim()

  if (trimmed.length < minLength) {
    return `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.`
  }

  if (trimmed.length > maxLength) {
    return `${fieldName}은(는) ${maxLength}자를 초과할 수 없습니다.`
  }

  return null
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string | null | undefined): string | null {
  if (!email) {
    return '이메일을 입력해주세요.'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '올바른 이메일 형식이 아닙니다.'
  }

  return null
}

/**
 * 전화번호 형식 검증
 */
export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone) {
    return '전화번호를 입력해주세요.'
  }

  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '')

  // 한국 전화번호: 10~11자리
  if (numbers.length < 10 || numbers.length > 11) {
    return '올바른 전화번호 형식이 아닙니다.'
  }

  return null
}

/**
 * 양의 정수 검증
 */
export function validatePositiveInt(
  value: any,
  fieldName: string
): { value: number; error: null } | { value: null; error: string } {
  const num = parseInt(value)

  if (isNaN(num) || num <= 0) {
    return { value: null, error: `${fieldName}은(는) 양의 정수여야 합니다.` }
  }

  return { value: num, error: null }
}

/**
 * 0 이상 정수 검증
 */
export function validateNonNegativeInt(
  value: any,
  fieldName: string
): { value: number; error: null } | { value: null; error: string } {
  const num = parseInt(value)

  if (isNaN(num) || num < 0) {
    return { value: null, error: `${fieldName}은(는) 0 이상의 정수여야 합니다.` }
  }

  return { value: num, error: null }
}

// ============================================
// XSS 방지
// ============================================

/**
 * HTML 특수문자 이스케이프
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * 위험한 HTML 태그 제거 (기본 허용 태그만 남김)
 */
export function sanitizeHtml(html: string): string {
  // 스크립트 태그 제거
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // 이벤트 핸들러 속성 제거
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // javascript: 프로토콜 제거
  sanitized = sanitized.replace(/javascript:/gi, '')

  // data: 프로토콜 제거 (이미지 제외)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '')

  return sanitized
}

// ============================================
// 파일 업로드 보안
// ============================================

// 허용된 이미지 MIME 타입
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]

// 허용된 문서 MIME 타입
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
]

/**
 * 파일 확장자 검증
 */
export function validateFileExtension(
  fileName: string,
  allowedExtensions: string[]
): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext ? allowedExtensions.includes(ext) : false
}

/**
 * 파일명 안전하게 변환
 */
export function sanitizeFileName(fileName: string): string {
  // 경로 구분자 제거
  let safe = fileName.replace(/[\/\\]/g, '')

  // 특수문자를 언더스코어로 변환
  safe = safe.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')

  // 연속된 언더스코어 제거
  safe = safe.replace(/_+/g, '_')

  // 시작/끝 언더스코어 제거
  safe = safe.replace(/^_+|_+$/g, '')

  // 빈 문자열이면 기본값
  return safe || 'unnamed'
}

// ============================================
// Rate Limiting 헬퍼 (메모리 기반 - 간단한 구현)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate Limit 체크
 * @param key 고유 키 (예: IP + endpoint)
 * @param maxRequests 최대 요청 수
 * @param windowMs 윈도우 크기 (밀리초)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // 오래된 레코드 정리 (메모리 누수 방지)
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k)
      }
    }
  }

  if (!record || record.resetTime < now) {
    // 새 윈도우 시작
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// ============================================
// 로깅 유틸리티 (민감 정보 마스킹)
// ============================================

/**
 * 민감 정보 마스킹
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveKeys = [
    'password', 'token', 'secret', 'apikey', 'api_key',
    'authorization', 'cookie', 'session', 'hash', 'creditcard',
    'cardnumber', 'cvv', 'pin'
  ]

  const masked = Array.isArray(data) ? [...data] : { ...data }

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase()

    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      masked[key] = '***MASKED***'
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key])
    }
  }

  return masked
}

/**
 * 안전한 로깅 (민감 정보 마스킹)
 */
export function safeLog(message: string, data?: any): void {
  if (data) {
    console.log(message, maskSensitiveData(data))
  } else {
    console.log(message)
  }
}

/**
 * 안전한 에러 로깅
 */
export function safeErrorLog(message: string, error: any, context?: any): void {
  console.error(message, {
    error: error?.message || error,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    context: context ? maskSensitiveData(context) : undefined,
  })
}
