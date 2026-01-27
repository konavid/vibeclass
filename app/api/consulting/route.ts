import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { company, name, email, phone, service, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: '필수 항목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 전송 설정
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const serviceLabels: { [key: string]: string } = {
      'market-data': 'Global Market Data Engineering',
      'vision-ai': 'Vision AI & Data Training',
      'gen-ai': 'Generative AI Content Production',
      'integrated': 'Integrated AI & Data Engineering',
      'other': 'Other'
    }

    const emailContent = `
      <div style="font-family: 'Syne', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #000; color: #fff;">
        <h1 style="font-size: 24px; margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 20px;">
          New Consulting Inquiry
        </h1>

        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Company</p>
          <p style="font-size: 16px; margin: 0;">${company || 'Not provided'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Name</p>
          <p style="font-size: 16px; margin: 0;">${name}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Email</p>
          <p style="font-size: 16px; margin: 0;"><a href="mailto:${email}" style="color: #fff;">${email}</a></p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Phone</p>
          <p style="font-size: 16px; margin: 0;">${phone || 'Not provided'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Service Interest</p>
          <p style="font-size: 16px; margin: 0;">${serviceLabels[service] || 'Not selected'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Project Overview</p>
          <p style="font-size: 16px; margin: 0; white-space: pre-wrap; background: #111; padding: 15px; border-radius: 4px;">${message}</p>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">ABC Studio Consulting Inquiry System</p>
        </div>
      </div>
    `

    // ABC 스튜디오로 이메일 전송
    await transporter.sendMail({
      from: `"ABC Studio Website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: 'contact@abcstudio.com',
      replyTo: email,
      subject: `[ABC Studio] New Consulting Inquiry from ${name}`,
      html: emailContent,
    })

    return NextResponse.json({ success: true, message: '문의가 전송되었습니다.' })
  } catch (error: any) {
    console.error('Consulting inquiry error:', error)
    return NextResponse.json(
      { success: false, error: '문의 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
