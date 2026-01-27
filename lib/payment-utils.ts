import crypto from 'crypto'

/**
 * bill_id 생성 함수
 * @param payId - 결제 ID
 * @param length - bill_id 길이 (기본 20자리)
 * @returns 고유한 bill_id
 */
export function generateBillId(payId: number, length: number = 20): string {
  const timestamp = Date.now().toString().slice(-6)
  let numberString = payId.toString()

  // payId를 0으로 패딩하여 길이 맞추기
  while (numberString.length < length - 6) {
    numberString = '0' + numberString
  }

  return numberString + timestamp
}

/**
 * SHA256 해시 생성 함수 (보안 검증용)
 * @param billId - bill_id
 * @param price - 금액
 * @param phone - 전화번호
 * @returns SHA256 해시값
 */
export function generatePaymentHash(billId: string, price: number, phone: string): string {
  const inputString = `${billId},${phone},${price}`
  return crypto.createHash('sha256').update(inputString).digest('hex')
}

/**
 * 할인율 계산 함수
 * @param months - 개월 수
 * @returns 할인율 (0.0 ~ 0.3)
 */
export function getDiscountRate(months: number): number {
  if (months >= 12) return 0.30  // 12개월: 30% 할인
  if (months >= 9) return 0.25   // 9-11개월: 25% 할인
  if (months >= 6) return 0.20   // 6-8개월: 20% 할인
  if (months >= 3) return 0.10   // 3-5개월: 10% 할인
  return 0                        // 1-2개월: 할인 없음
}

/**
 * 최종 결제 금액 계산 함수
 * @param months - 개월 수
 * @returns 최종 결제 금액
 */
export function calculatePaymentAmount(months: number): {
  baseAmount: number
  discountRate: number
  discountAmount: number
  finalAmount: number
  monthlyPrice: number
} {
  const openSpecialMode = process.env.OPEN_SPECIAL_MODE === 'true'
  const normalPrice = parseInt(process.env.NORMAL_MONTHLY_PRICE || '165000')
  const specialPrice = parseInt(process.env.SPECIAL_MONTHLY_PRICE || '88000')

  const monthlyPrice = openSpecialMode ? specialPrice : normalPrice
  const baseAmount = monthlyPrice * months
  const discountRate = getDiscountRate(months)
  const discountAmount = Math.floor(baseAmount * discountRate)
  const finalAmount = baseAmount - discountAmount

  return {
    baseAmount,
    discountRate,
    discountAmount,
    finalAmount,
    monthlyPrice: Math.floor(finalAmount / months)
  }
}

/**
 * 가격 옵션 전체 조회
 * @returns 1~12개월 가격 옵션 배열
 */
export function getPriceOptions() {
  const options = []

  for (let months = 1; months <= 12; months++) {
    options.push({
      months,
      ...calculatePaymentAmount(months)
    })
  }

  return options
}

/**
 * 전화번호 형식 검증 및 정제
 * @param phone - 전화번호
 * @returns 정제된 전화번호 (하이픈 제거)
 */
export function normalizePhoneNumber(phone: string): string {
  // 하이픈, 공백 제거
  const cleaned = phone.replace(/[-\s]/g, '')

  // 010으로 시작하는 11자리 숫자 검증
  if (!/^010\d{8}$/.test(cleaned)) {
    throw new Error('올바른 전화번호 형식이 아닙니다. (010으로 시작하는 11자리)')
  }

  // 010 다음 자리가 0으로 시작하면 안됨 (0100, 0101 등은 유효하지 않음)
  if (/^010[0-1]/.test(cleaned)) {
    throw new Error('올바른 전화번호가 아닙니다. 전화번호를 다시 확인해주세요.')
  }

  return cleaned
}

/**
 * 만료일 계산 (결제 요청 후 3일)
 * @returns YYYY-MM-DD 형식의 만료일
 */
export function getPaymentExpireDate(): string {
  const expireDate = new Date()
  expireDate.setDate(expireDate.getDate() + 3)

  const year = expireDate.getFullYear()
  const month = String(expireDate.getMonth() + 1).padStart(2, '0')
  const day = String(expireDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 프리미엄 종료일 계산
 * @param currentEndDate - 현재 종료일 (없으면 현재 시각)
 * @param months - 추가할 개월 수
 * @returns 새로운 종료일
 */
export function calculateNewEndDate(currentEndDate: Date | null, months: number): Date {
  const baseDate = currentEndDate && currentEndDate > new Date()
    ? new Date(currentEndDate)
    : new Date()

  const newEndDate = new Date(baseDate)
  newEndDate.setMonth(newEndDate.getMonth() + months)

  return newEndDate
}

/**
 * 결제 상태 검증
 * @param apprState - 승인 상태 코드
 * @returns 결제 성공 여부
 */
export function isPaymentSuccess(apprState: string): boolean {
  return ['F', 'A', '0000'].includes(apprState)
}

/**
 * 결제 실패 여부 검증
 * @param apprState - 승인 상태 코드
 * @returns 결제 실패 여부
 */
export function isPaymentFailed(apprState: string): boolean {
  return ['W', 'N'].includes(apprState)
}

/**
 * 결제 취소 여부 검증
 * @param apprState - 승인 상태 코드
 * @returns 결제 취소 여부
 */
export function isPaymentCancelled(apprState: string): boolean {
  return ['C', 'D'].includes(apprState)
}

/**
 * 결제 설명 생성
 * @param courseName - 강의명 (선택)
 * @param months - 개월 수
 * @returns 결제 설명 문자열
 */
export function generatePaymentDescription(months: number, courseName?: string): string {
  const { discountRate } = calculatePaymentAmount(months)
  const discountText = discountRate > 0 ? ` (${Math.floor(discountRate * 100)}% 할인)` : ''

  if (courseName) {
    return `${courseName} ${months}개월 이용권${discountText}`
  }

  return `교육 플랫폼 ${months}개월 이용권${discountText}`
}

/**
 * 환불 금액 계산 (이용약관 제9조 기준)
 * - 수강 시작 전: 전액 환불
 * - 수강 시작 후 1/3 경과 전: 2/3 해당액 환불
 * - 수강 시작 후 1/2 경과 전: 1/2 해당액 환불
 * - 수강 시작 후 1/2 경과 후: 환불 불가
 */
export function calculateRefundAmount(
  originalAmount: number,
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
): {
  refundAmount: number
  refundRate: number
  refundReason: string
  canRefund: boolean
} {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = currentDate

  // 수강 시작 전
  if (now < start) {
    return {
      refundAmount: originalAmount,
      refundRate: 1.0,
      refundReason: '수강 시작 전 취소 (전액 환불)',
      canRefund: true
    }
  }

  // 총 수강 기간 (밀리초)
  const totalDuration = end.getTime() - start.getTime()
  // 경과 기간 (밀리초)
  const elapsedDuration = now.getTime() - start.getTime()
  // 경과 비율
  const elapsedRatio = elapsedDuration / totalDuration

  // 수강 시작 후 1/3 경과 전
  if (elapsedRatio < 1/3) {
    const refundAmount = Math.floor(originalAmount * (2/3))
    return {
      refundAmount,
      refundRate: 2/3,
      refundReason: '수강 시작 후 1/3 경과 전 (2/3 환불)',
      canRefund: true
    }
  }

  // 수강 시작 후 1/2 경과 전
  if (elapsedRatio < 1/2) {
    const refundAmount = Math.floor(originalAmount * (1/2))
    return {
      refundAmount,
      refundRate: 1/2,
      refundReason: '수강 시작 후 1/2 경과 전 (1/2 환불)',
      canRefund: true
    }
  }

  // 수강 시작 후 1/2 경과 후
  return {
    refundAmount: 0,
    refundRate: 0,
    refundReason: '수강 시작 후 1/2 경과 (환불 불가)',
    canRefund: false
  }
}
