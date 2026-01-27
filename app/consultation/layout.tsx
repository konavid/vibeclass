import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '상담 신청',
  description: '카카오톡 채널을 통해 편리하게 AI 교육 상담을 받으세요. 바이브 클래스 전문 상담원이 무료로 상담해드립니다.',
  keywords: ['AI 교육 상담', '무료 상담', '카카오톡 상담', '교육 문의'],
  openGraph: {
    title: '상담 신청 | 바이브 클래스',
    description: '카카오톡 채널을 통해 편리하게 AI 교육 상담을 받으세요',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://vibeclass.kr/consultation',
  },
}

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
