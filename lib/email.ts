// 이메일 발송 라이브러리 (SMTP)
import nodemailer from 'nodemailer'

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

// SMTP 설정
function createTransporter() {
  // SMTP 설정이 있으면 SMTP 사용
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // AWS SES SMTP 설정
  if (process.env.AWS_SES_SMTP_USER && process.env.AWS_SES_SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.AWS_SES_SMTP_HOST || 'email-smtp.ap-northeast-2.amazonaws.com',
      port: parseInt(process.env.AWS_SES_SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.AWS_SES_SMTP_USER,
        pass: process.env.AWS_SES_SMTP_PASS,
      },
    })
  }

  return null
}

// 이메일 발송 함수 (SMTP)
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const fromEmail = params.from || process.env.SMTP_FROM_EMAIL || 'hi@vibeclass.kr'
    const transporter = createTransporter()

    if (!transporter) {
      console.warn('⚠️  SMTP 설정이 없어 이메일을 발송하지 않습니다')
      console.log('📧 이메일 발송 시뮬레이션:')
      console.log(`받는사람: ${Array.isArray(params.to) ? params.to.join(', ') : params.to}`)
      console.log(`제목: ${params.subject}`)
      console.log(`보내는사람: ${fromEmail}`)
      // 시뮬레이션 모드에서는 성공으로 반환
      return true
    }

    const toAddresses = Array.isArray(params.to) ? params.to.join(', ') : params.to

    await transporter.sendMail({
      from: fromEmail,
      to: toAddresses,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    console.log(`✅ 이메일 발송 성공: ${toAddresses}`)
    return true
  } catch (error: any) {
    console.error('❌ 이메일 발송 실패:', error.message)
    // 에러를 던지지 않고 false 반환
    return false
  }
}

// Zoom 입장 안내 이메일 템플릿
export function createZoomInviteEmail(data: {
  userName: string
  courseTitle: string
  startDate: string
  endDate: string
  joinUrl: string
  password?: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .button {
      display: inline-block;
      background: #4F46E5;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .info-box {
      background: white;
      border: 1px solid #e5e7eb;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EDU - 온라인 교육 입장 안내</h1>
    </div>

    <div class="content">
      <p>안녕하세요, <strong>${data.userName}</strong>님!</p>

      <p><strong>${data.courseTitle}</strong> 교육 일정이 다가왔습니다.</p>

      <div class="info-box">
        <h3>📅 교육 일정</h3>
        <p><strong>시작:</strong> ${new Date(data.startDate).toLocaleString('ko-KR')}</p>
        <p><strong>종료:</strong> ${new Date(data.endDate).toLocaleString('ko-KR')}</p>
      </div>

      <div class="info-box">
        <h3>💻 Zoom 입장 정보</h3>
        ${data.password ? `<p><strong>비밀번호:</strong> ${data.password}</p>` : ''}
        <p>아래 버튼을 클릭하여 Zoom 미팅에 입장하실 수 있습니다.</p>
      </div>

      <div style="text-align: center;">
        <a href="${data.joinUrl}" class="button">Zoom 입장하기</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        ※ 교육 시작 10분 전부터 입장이 가능합니다.<br>
        ※ 원활한 교육 진행을 위해 마이크와 카메라를 준비해주세요.
      </p>
    </div>

    <div class="footer">
      <p>EDU 온라인 교육 플랫폼</p>
      <p>문의사항이 있으시면 언제든 연락주세요.</p>
    </div>
  </div>
</body>
</html>
  `
}

// 수강신청 확인 이메일 템플릿
export function createEnrollmentConfirmationEmail(data: {
  userName: string
  userEmail: string
  courseTitle: string
  cohort: number
  startDate: string
  endDate: string
  sessions?: Array<{
    sessionNumber: number
    sessionDate: string
    startTime: string
    endTime: string
    topic?: string
    meetLink?: string
  }>
}): string {
  const sessionsHTML = data.sessions && data.sessions.length > 0
    ? `
      <div class="info-box">
        <h3>📚 회차 일정</h3>
        ${data.sessions.map(session => `
          <div style="margin: 10px 0; padding: 10px; background: #f9fafb; border-left: 3px solid #4F46E5;">
            <p style="margin: 5px 0;"><strong>${session.sessionNumber}회차</strong> - ${new Date(session.sessionDate).toLocaleDateString('ko-KR')}</p>
            <p style="margin: 5px 0; color: #6b7280;">시간: ${session.startTime} ~ ${session.endTime}</p>
            ${session.topic ? `<p style="margin: 5px 0; color: #6b7280;">주제: ${session.topic}</p>` : ''}
            ${session.meetLink ? `<p style="margin: 5px 0;"><a href="${session.meetLink}" style="color: #4F46E5;">Zoom 링크</a></p>` : ''}
          </div>
        `).join('')}
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .button {
      display: inline-block;
      background: #4F46E5;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .info-box {
      background: white;
      border: 1px solid #e5e7eb;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
    }
    .highlight {
      background: #fef3c7;
      padding: 15px;
      border-left: 4px solid #f59e0b;
      margin: 20px 0;
    }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 수강신청이 완료되었습니다!</h1>
    </div>

    <div class="content">
      <p>안녕하세요, <strong>${data.userName}</strong>님!</p>

      <p><strong>${data.courseTitle} ${data.cohort}기</strong> 수강신청이 성공적으로 완료되었습니다.</p>

      <div class="info-box">
        <h3>📋 수강 정보</h3>
        <p><strong>강의명:</strong> ${data.courseTitle}</p>
        <p><strong>기수:</strong> ${data.cohort}기</p>
        <p><strong>수강생:</strong> ${data.userName} (${data.userEmail})</p>
      </div>

      <div class="info-box">
        <h3>📅 교육 기간</h3>
        <p><strong>시작:</strong> ${new Date(data.startDate).toLocaleDateString('ko-KR')}</p>
        <p><strong>종료:</strong> ${new Date(data.endDate).toLocaleDateString('ko-KR')}</p>
      </div>

      ${sessionsHTML}

      <div class="highlight">
        <p style="margin: 0;"><strong>💡 안내사항</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>각 회차의 Zoom 링크는 수업 시작 전에 제공됩니다</li>
          <li>수업 시작 30분 전부터 Zoom 입장이 가능합니다</li>
          <li>원활한 수업 진행을 위해 마이크와 카메라를 미리 준비해주세요</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://vibeclass.kr/my/enrollments" class="button">내 수강 목록 보기</a>
      </div>
    </div>

    <div class="footer">
      <p>바이브 클래스 온라인 교육 플랫폼</p>
      <p>문의사항: support@vibeclass.kr</p>
    </div>
  </div>
</body>
</html>
  `
}
