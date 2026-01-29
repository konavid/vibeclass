/**
 * 통합 알림 서비스
 * SMS + 이메일 + 카카오톡 알림톡 3중 발송
 */

import { sendSMS } from './sms'
import { sendAlimtalk, getTemplateCode, NOTIFICATION_TYPES } from './kakao-alimtalk'
import { sendEmail } from './email'
import { prisma } from './prisma'

interface NotificationResult {
  sms: { success: boolean; error?: string }
  email: { success: boolean; error?: string }
  kakao: { success: boolean; mid?: string; error?: string }
}

interface EnrollmentCompleteParams {
  userId: number
  phone: string
  email: string
  userName: string
  courseName: string
  cohort: number
  startDate: Date
  endDate: Date
  amount: number
  enrollmentId: number
}

interface ClassReminderParams {
  userId: number
  phone: string
  email: string
  userName: string
  courseName: string
  cohort: number
  sessionNumber: number
  sessionDate: string
  startTime: string
  endTime: string
  meetLink: string | null
  sessionId: number
}

interface ReviewRequestParams {
  userId: number
  phone: string
  email: string
  userName: string
  courseName: string
  cohort: number
  scheduleId: number
}

interface RegistrationCompleteParams {
  userId: number
  phone: string
  email: string
  userName: string
}

/**
 * 회원가입 완료 알림
 */
export async function sendRegistrationCompleteNotification(params: RegistrationCompleteParams): Promise<NotificationResult> {
  const { userId, phone, email, userName } = params

  // 카카오톡 메시지
  const kakaoMessage = `[바이브클래스] 회원가입 완료

안녕하세요, ${userName}님!

바이브클래스 회원가입이 완료되었습니다.

AI 시대, 누구나 쉽게 배우는
실전 교육 플랫폼 바이브클래스에서
다양한 강의를 만나보세요.

궁금한 점이 있으시면
언제든 문의해주세요.

감사합니다.`

  // 이메일 HTML
  const emailHtml = createRegistrationCompleteEmail(userName)

  // DB에서 템플릿 코드 조회
  const tplCode = await getTemplateCode(NOTIFICATION_TYPES.REGISTRATION_COMPLETE)

  // 간단한 SMS 메시지
  const shortSmsMessage = `[바이브클래스] ${userName}님, 회원가입 완료`

  // 카카오 알림톡/SMS 발송 (전화번호가 있을 경우에만)
  let smsResult: { success: boolean; error?: string } = { success: false, error: '전화번호 없음' }
  let kakaoResult: { success: boolean; mid?: string; error?: string } = { success: false, error: '전화번호 없음' }

  if (phone) {
    // 카카오 알림톡 발송 (실패 시 SMS 대체)
    kakaoResult = await sendKakaoWithLogging({
      receiver: phone,
      tplCode: tplCode || '',
      subject: '회원가입 완료',
      message: kakaoMessage,
      button: {
        name: '강의 둘러보기',
        linkType: 'WL',
        linkM: 'https://vibeclass.kr/courses',
        linkP: 'https://vibeclass.kr/courses'
      },
      failover: true,
      failoverSubject: '[바이브클래스]',
      failoverMessage: shortSmsMessage
    })

    // 카카오 알림톡 실패 시에만 SMS 발송
    smsResult = kakaoResult.success
      ? { success: true, error: '카카오톡 발송 성공으로 SMS 스킵' }
      : await sendSMSWithLogging(phone, shortSmsMessage)
  }

  // 이메일 발송
  const emailResult = await sendEmailWithLogging(email, '[바이브클래스] 회원가입을 환영합니다!', emailHtml)

  // 알림 로그 저장
  await saveNotificationLog({
    userId,
    type: 'registration_complete',
    referenceId: userId,
    referenceType: 'user',
    phone,
    email,
    smsSuccess: smsResult.success,
    emailSuccess: emailResult.success,
    kakaoSuccess: kakaoResult.success,
    smsMessage: shortSmsMessage,
    kakaoMessage
  })

  return { sms: smsResult, email: emailResult, kakao: kakaoResult }
}

/**
 * 수강신청 완료 알림 (결제 완료 시)
 */
export async function sendEnrollmentCompleteNotification(params: EnrollmentCompleteParams): Promise<NotificationResult> {
  const { userId, phone, email, userName, courseName, cohort, startDate, endDate, amount, enrollmentId } = params

  // 날짜 포맷팅
  const periodStr = `${formatDate(startDate)} ~ ${formatDate(endDate)}`
  const amountStr = amount.toLocaleString()

  // 카카오톡 메시지
  const kakaoMessage = `[바이브클래스] 수강신청 완료

안녕하세요, ${userName}님!

${courseName} ${cohort}기 수강신청이 완료되었습니다.

▶ 수업기간: ${periodStr}
▶ 결제금액: ${amountStr}원

수업 시작 1시간 전에 알림을 보내드립니다.
감사합니다.`

  // 이메일 HTML
  const emailHtml = createEnrollmentCompleteEmail({
    userName,
    courseName,
    cohort,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    amount: amountStr
  })

  // DB에서 템플릿 코드 조회
  const tplCode = await getTemplateCode(NOTIFICATION_TYPES.ENROLLMENT_COMPLETE)

  // 간단한 SMS 메시지
  const shortSmsMessage = `[바이브클래스] ${userName}님, ${courseName} ${cohort}기 수강신청 완료. 수업기간: ${periodStr}`

  // 카카오 알림톡 발송 (실패 시 SMS 대체)
  const kakaoResult = await sendKakaoWithLogging({
    receiver: phone,
    tplCode: tplCode || '',
    subject: '수강신청 완료',
    message: kakaoMessage,
    button: {
      name: '내 강의 보기',
      linkType: 'WL',
      linkM: 'https://vibeclass.kr/my/enrollments',
      linkP: 'https://vibeclass.kr/my/enrollments'
    },
    failover: true,
    failoverSubject: '[바이브클래스]',
    failoverMessage: shortSmsMessage
  })

  // 카카오 알림톡 실패 시에만 SMS 발송
  const smsResult = kakaoResult.success
    ? { success: true, error: '카카오톡 발송 성공으로 SMS 스킵' }
    : await sendSMSWithLogging(phone, shortSmsMessage)

  // 이메일 발송
  const emailResult = await sendEmailWithLogging(email, `[바이브클래스] ${courseName} ${cohort}기 수강신청 완료`, emailHtml)

  // 알림 로그 저장
  await saveNotificationLog({
    userId,
    type: 'enrollment_complete',
    referenceId: enrollmentId,
    referenceType: 'enrollment',
    phone,
    email,
    smsSuccess: smsResult.success,
    emailSuccess: emailResult.success,
    kakaoSuccess: kakaoResult.success,
    smsMessage: shortSmsMessage,
    kakaoMessage
  })

  return { sms: smsResult, email: emailResult, kakao: kakaoResult }
}

/**
 * 수업 시작 알림 (1시간 전)
 */
export async function sendClassReminderNotification(params: ClassReminderParams): Promise<NotificationResult> {
  const { userId, phone, email, userName, courseName, cohort, sessionNumber, sessionDate, startTime, endTime, meetLink, sessionId } = params

  // 카카오톡 메시지
  const kakaoMessage = `[바이브클래스] 수업 시작 안내

안녕하세요, ${userName}님!

오늘 ${startTime}에 수업이 시작됩니다.

▶ 강의: ${courseName}
▶ 회차: ${cohort}기 ${sessionNumber}회차
▶ 시간: ${startTime} ~ ${endTime}

내 강의 페이지에서 수업에 입장해주세요.`

  // 이메일 HTML
  const emailHtml = createClassReminderEmail({
    userName,
    courseName,
    cohort,
    sessionNumber,
    sessionDate,
    startTime,
    endTime,
    meetLink
  })

  // DB에서 템플릿 코드 조회
  const tplCode = await getTemplateCode(NOTIFICATION_TYPES.CLASS_REMINDER)

  // 간단한 SMS 메시지
  const shortSmsMessage = `[바이브클래스] ${userName}님, 오늘 ${startTime} "${courseName}" 수업 시작`

  // 카카오 알림톡 발송 (실패 시 SMS 대체)
  const kakaoResult = await sendKakaoWithLogging({
    receiver: phone,
    tplCode: tplCode || '',
    subject: '수업 시작 알림',
    message: kakaoMessage,
    button: {
      name: '내 강의 보기',
      linkType: 'WL',
      linkM: 'https://vibeclass.kr/my/enrollments',
      linkP: 'https://vibeclass.kr/my/enrollments'
    },
    failover: true,
    failoverSubject: '[바이브클래스]',
    failoverMessage: shortSmsMessage
  })

  // 카카오 알림톡 실패 시에만 SMS 발송
  const smsResult = kakaoResult.success
    ? { success: true, error: '카카오톡 발송 성공으로 SMS 스킵' }
    : await sendSMSWithLogging(phone, shortSmsMessage)

  // 이메일 발송
  const emailResult = await sendEmailWithLogging(email, `[바이브클래스] ${courseName} ${sessionNumber}회차 수업 시작 안내`, emailHtml)

  // 알림 로그 저장
  await saveNotificationLog({
    userId,
    type: 'class_reminder',
    referenceId: sessionId,
    referenceType: 'session',
    phone,
    email,
    smsSuccess: smsResult.success,
    emailSuccess: emailResult.success,
    kakaoSuccess: kakaoResult.success,
    smsMessage: shortSmsMessage,
    kakaoMessage
  })

  return { sms: smsResult, email: emailResult, kakao: kakaoResult }
}

/**
 * 후기 작성 요청 알림 (강의 종료 다음날)
 */
export async function sendReviewRequestNotification(params: ReviewRequestParams): Promise<NotificationResult> {
  const { userId, phone, email, userName, courseName, cohort, scheduleId } = params

  // 카카오톡 메시지
  const kakaoMessage = `[바이브클래스] 수강 후기 작성 안내

안녕하세요, ${userName}님!

${courseName} ${cohort}기 수강이 완료되었습니다.
수고하셨습니다!

소중한 후기를 남겨주시면
다른 수강생분들께 큰 도움이 됩니다.`

  // 이메일 HTML
  const emailHtml = createReviewRequestEmail({
    userName,
    courseName,
    cohort
  })

  // DB에서 템플릿 코드 조회
  const tplCode = await getTemplateCode(NOTIFICATION_TYPES.REVIEW_REQUEST)

  // 간단한 SMS 메시지
  const shortSmsMessage = `[바이브클래스] ${userName}님, ${courseName} 수강완료! 후기 부탁드려요`

  // 카카오 알림톡 발송 (실패 시 SMS 대체)
  const kakaoResult = await sendKakaoWithLogging({
    receiver: phone,
    tplCode: tplCode || '',
    subject: '후기 작성 요청',
    message: kakaoMessage,
    button: {
      name: '후기 작성하기',
      linkType: 'WL',
      linkM: 'https://vibeclass.kr/my/enrollments',
      linkP: 'https://vibeclass.kr/my/enrollments'
    },
    failover: true,
    failoverSubject: '[바이브클래스]',
    failoverMessage: shortSmsMessage
  })

  // 카카오 알림톡 실패 시에만 SMS 발송
  const smsResult = kakaoResult.success
    ? { success: true, error: '카카오톡 발송 성공으로 SMS 스킵' }
    : await sendSMSWithLogging(phone, shortSmsMessage)

  // 이메일 발송
  const emailResult = await sendEmailWithLogging(email, `[바이브클래스] ${courseName} 수강 완료! 후기를 남겨주세요`, emailHtml)

  // 알림 로그 저장
  await saveNotificationLog({
    userId,
    type: 'review_request',
    referenceId: scheduleId,
    referenceType: 'schedule',
    phone,
    email,
    smsSuccess: smsResult.success,
    emailSuccess: emailResult.success,
    kakaoSuccess: kakaoResult.success,
    smsMessage: shortSmsMessage,
    kakaoMessage
  })

  return { sms: smsResult, email: emailResult, kakao: kakaoResult }
}

interface EnrollmentCancelParams {
  userId: number
  phone: string
  email: string
  userName: string
  courseName: string
  cohort: number
  refundAmount: number
  refundReason: string
  enrollmentId: number
}

/**
 * 수강 취소 알림
 */
export async function sendEnrollmentCancelNotification(params: EnrollmentCancelParams): Promise<NotificationResult> {
  const { userId, phone, email, userName, courseName, cohort, refundAmount, refundReason, enrollmentId } = params

  const refundText = refundAmount > 0
    ? `환불 예정 금액: ${refundAmount.toLocaleString()}원`
    : '무료 강의 취소'

  // 카카오톡 메시지 (SMS로 대체 발송)
  const kakaoMessage = `[바이브클래스] 수강 취소 완료

안녕하세요, ${userName}님!

${courseName} ${cohort}기 수강이 취소되었습니다.

▶ ${refundText}
▶ 사유: ${refundReason}

${refundAmount > 0 ? '환불은 결제 수단에 따라 3~5 영업일 내에 처리됩니다.' : ''}

문의사항이 있으시면 연락주세요.
감사합니다.`

  // 이메일 HTML
  const emailHtml = createEnrollmentCancelEmail({
    userName,
    courseName,
    cohort,
    refundAmount,
    refundReason
  })

  // SMS 메시지
  const shortSmsMessage = refundAmount > 0
    ? `[바이브클래스] ${userName}님, ${courseName} ${cohort}기 취소 완료. 환불: ${refundAmount.toLocaleString()}원`
    : `[바이브클래스] ${userName}님, ${courseName} ${cohort}기 수강 취소가 완료되었습니다.`

  // SMS 발송 (취소는 알림톡 템플릿이 없으므로 SMS로 발송)
  const smsResult = await sendSMSWithLogging(phone, shortSmsMessage)

  // 이메일 발송
  const emailResult = await sendEmailWithLogging(email, `[바이브클래스] ${courseName} ${cohort}기 수강 취소 완료`, emailHtml)

  // 알림 로그 저장
  await saveNotificationLog({
    userId,
    type: 'enrollment_cancel',
    referenceId: enrollmentId,
    referenceType: 'enrollment',
    phone,
    email,
    smsSuccess: smsResult.success,
    emailSuccess: emailResult.success,
    kakaoSuccess: false, // 취소는 SMS로만 발송
    smsMessage: shortSmsMessage,
    kakaoMessage
  })

  return { sms: smsResult, email: emailResult, kakao: { success: false, error: '취소 알림톡 미지원' } }
}

// ===================== Helper functions =====================

async function sendSMSWithLogging(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!phone) return { success: false, error: '전화번호 없음' }
  try {
    const success = await sendSMS({ receiver: phone, message })
    return { success }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function sendEmailWithLogging(email: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!email) return { success: false, error: '이메일 없음' }
  try {
    const success = await sendEmail({ to: email, subject, html })
    return { success }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function sendKakaoWithLogging(params: {
  receiver: string
  tplCode: string
  subject: string
  message: string
  button?: any
  failover?: boolean
  failoverSubject?: string
  failoverMessage?: string
}): Promise<{ success: boolean; mid?: string; error?: string }> {
  try {
    if (!process.env.ALIGO_SENDER_KEY) {
      console.log('카카오 알림톡 senderkey 미설정 - 스킵')
      return { success: false, error: 'senderkey 미설정' }
    }
    if (!params.tplCode) {
      console.log('카카오 알림톡 템플릿 코드 미설정 - 스킵')
      return { success: false, error: '템플릿 코드 미설정' }
    }
    return await sendAlimtalk(params)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function saveNotificationLog(params: {
  userId: number
  type: string
  referenceId: number
  referenceType: string
  phone: string
  email?: string
  smsSuccess: boolean
  emailSuccess?: boolean
  kakaoSuccess: boolean
  smsMessage: string
  kakaoMessage: string
}): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        userId: params.userId,
        type: params.type,
        referenceId: params.referenceId,
        referenceType: params.referenceType,
        phone: params.phone,
        smsSuccess: params.smsSuccess,
        kakaoSuccess: params.kakaoSuccess,
        smsMessage: params.smsMessage,
        kakaoMessage: params.kakaoMessage,
        sentAt: new Date()
      }
    })
  } catch (error) {
    console.error('알림 로그 저장 실패:', error)
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// ===================== Email Templates =====================

function createRegistrationCompleteEmail(userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background: #f8f9fa; text-align: center; color: #6b7280; font-size: 12px; padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>바이브클래스 회원가입을 환영합니다!</h1>
    </div>
    <div class="content">
      <p>안녕하세요, <strong>${userName}</strong>님!</p>
      <p>바이브클래스 회원가입이 완료되었습니다.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">바이브클래스에서 제공하는 혜택</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>AI 시대를 위한 실전 교육 콘텐츠</li>
          <li>현업 전문가의 생생한 노하우</li>
          <li>소규모 인원으로 밀착 케어</li>
          <li>수강 후기 작성 시 적립금 지급</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://vibeclass.kr/courses" class="button">강의 둘러보기</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        궁금한 점이 있으시면 언제든지 문의해주세요.<br>
        감사합니다.
      </p>
    </div>
    <div class="footer">
      <p>바이브클래스 | AI 시대, 누구나 쉽게 배우는 실전 교육</p>
      <p>문의: hi@vibeclass.kr</p>
    </div>
  </div>
</body>
</html>
`
}

function createEnrollmentCompleteEmail(data: {
  userName: string
  courseName: string
  cohort: number
  startDate: string
  endDate: string
  amount: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { background: #f8f9fa; text-align: center; color: #6b7280; font-size: 12px; padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>수강신청이 완료되었습니다!</h1>
    </div>
    <div class="content">
      <p>안녕하세요, <strong>${data.userName}</strong>님!</p>
      <p><strong>${data.courseName} ${data.cohort}기</strong> 수강신청이 성공적으로 완료되었습니다.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">수강 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280;">강의명</td><td style="padding: 8px 0; font-weight: bold;">${data.courseName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">기수</td><td style="padding: 8px 0; font-weight: bold;">${data.cohort}기</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">수업기간</td><td style="padding: 8px 0; font-weight: bold;">${data.startDate} ~ ${data.endDate}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">결제금액</td><td style="padding: 8px 0; font-weight: bold;">${data.amount}원</td></tr>
        </table>
      </div>

      <div class="highlight">
        <p style="margin: 0;"><strong>안내사항</strong></p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>수업 시작 1시간 전에 알림을 보내드립니다</li>
          <li>수업 링크는 알림에서 확인하실 수 있습니다</li>
          <li>원활한 수업을 위해 마이크와 카메라를 준비해주세요</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://vibeclass.kr/my/enrollments" class="button">내 강의 보기</a>
      </div>
    </div>
    <div class="footer">
      <p>바이브클래스 | AI 시대, 누구나 쉽게 배우는 실전 교육</p>
      <p>문의: hi@vibeclass.kr</p>
    </div>
  </div>
</body>
</html>
`
}

function createClassReminderEmail(data: {
  userName: string
  courseName: string
  cohort: number
  sessionNumber: number
  sessionDate: string
  startTime: string
  endTime: string
  meetLink: string | null
}): string {
  const meetButton = data.meetLink
    ? `<a href="${data.meetLink}" class="button" style="background: #10b981;">수업 입장하기</a>`
    : `<a href="https://vibeclass.kr/my/enrollments" class="button">내 강의 보기</a>`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background: #f8f9fa; text-align: center; color: #6b7280; font-size: 12px; padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>수업이 곧 시작됩니다!</h1>
    </div>
    <div class="content">
      <p>안녕하세요, <strong>${data.userName}</strong>님!</p>
      <p>오늘 <strong>${data.startTime}</strong>에 수업이 시작됩니다.</p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">수업 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280;">강의</td><td style="padding: 8px 0; font-weight: bold;">${data.courseName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">회차</td><td style="padding: 8px 0; font-weight: bold;">${data.cohort}기 ${data.sessionNumber}회차</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">날짜</td><td style="padding: 8px 0; font-weight: bold;">${data.sessionDate}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">시간</td><td style="padding: 8px 0; font-weight: bold;">${data.startTime} ~ ${data.endTime}</td></tr>
        </table>
      </div>

      <div style="text-align: center;">
        ${meetButton}
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        수업 시작 전 마이크와 카메라를 미리 확인해주세요.
      </p>
    </div>
    <div class="footer">
      <p>바이브클래스 | AI 시대, 누구나 쉽게 배우는 실전 교육</p>
      <p>문의: hi@vibeclass.kr</p>
    </div>
  </div>
</body>
</html>
`
}

function createReviewRequestEmail(data: {
  userName: string
  courseName: string
  cohort: number
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .reward-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .footer { background: #f8f9fa; text-align: center; color: #6b7280; font-size: 12px; padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>수강을 완료하셨습니다!</h1>
    </div>
    <div class="content">
      <p>안녕하세요, <strong>${data.userName}</strong>님!</p>
      <p><strong>${data.courseName} ${data.cohort}기</strong> 수강이 완료되었습니다.<br>수고하셨습니다!</p>

      <div class="reward-box">
        <h3 style="margin-top: 0; color: #d97706;">후기 작성 안내</h3>
        <p style="font-size: 18px; margin: 10px 0;">소중한 후기를 남겨주시면<br>다른 수강생분들께 큰 도움이 됩니다.</p>
      </div>

      <p style="text-align: center; color: #6b7280;">
        ${data.userName}님의 솔직한 후기를 기다립니다.
      </p>

      <div style="text-align: center;">
        <a href="https://vibeclass.kr/my/enrollments" class="button">후기 작성하기</a>
      </div>
    </div>
    <div class="footer">
      <p>바이브클래스 | AI 시대, 누구나 쉽게 배우는 실전 교육</p>
      <p>문의: hi@vibeclass.kr</p>
    </div>
  </div>
</body>
</html>
`
}

function createEnrollmentCancelEmail(data: {
  userName: string
  courseName: string
  cohort: number
  refundAmount: number
  refundReason: string
}): string {
  const refundSection = data.refundAmount > 0
    ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">환불 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280;">환불 금액</td><td style="padding: 8px 0; font-weight: bold;">${data.refundAmount.toLocaleString()}원</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">환불 사유</td><td style="padding: 8px 0;">${data.refundReason}</td></tr>
        </table>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        환불은 결제 수단에 따라 3~5 영업일 내에 처리됩니다.
      </p>
    `
    : `
      <div class="info-box">
        <p style="margin: 0; color: #6b7280;">무료 강의 수강 취소가 완료되었습니다.</p>
      </div>
    `

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 40px 30px; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background: #f8f9fa; text-align: center; color: #6b7280; font-size: 12px; padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>수강 취소가 완료되었습니다</h1>
    </div>
    <div class="content">
      <p>안녕하세요, <strong>${data.userName}</strong>님!</p>
      <p><strong>${data.courseName} ${data.cohort}기</strong> 수강이 취소되었습니다.</p>

      ${refundSection}

      <p style="margin-top: 30px; color: #6b7280;">
        문의사항이 있으시면 언제든지 연락주세요.<br>
        감사합니다.
      </p>
    </div>
    <div class="footer">
      <p>바이브클래스 | AI 시대, 누구나 쉽게 배우는 실전 교육</p>
      <p>문의: hi@vibeclass.kr</p>
    </div>
  </div>
</body>
</html>
`
}
