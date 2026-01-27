import CustomerLayout from '@/components/customer/CustomerLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '솔루션 문의 | 바이브 클래스',
  description: '바이브 클래스와 동일한 교육 플랫폼을 구축해 드립니다. 귀사의 브랜드에 맞게 완벽하게 커스터마이징 가능합니다.',
  openGraph: {
    title: '솔루션 문의 | 바이브 클래스',
    description: '바이브 클래스와 동일한 교육 플랫폼을 구축해 드립니다.',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://vibeclass.kr/solution',
  },
}

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'orange',
    title: '강의 관리 시스템',
    description: '온/오프라인 강의, 기수별 관리, 커리큘럼, 수강생 관리까지 올인원',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'blue',
    title: '결제 시스템',
    description: '카카오톡 알림톡 결제, 자동 수강 등록, 결제 내역 관리',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'purple',
    title: 'AI 자동화',
    description: 'AI 커리큘럼 생성, 썸네일 자동 생성, 강의 설명 자동 작성',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'green',
    title: '마케팅 도구',
    description: '이메일, SMS, 카카오톡 발송, 알림톡 템플릿 관리',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'yellow',
    title: '콘텐츠 관리',
    description: '영상, 디지털 상품, 자료실, 블로그 통합 관리',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'pink',
    title: '강사 시스템',
    description: '강사 신청, 승인, 강사별 대시보드, 수강생 관리',
  },
]

const colorClasses: Record<string, { bg: string; text: string }> = {
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
}

export default function SolutionPage() {
  return (
    <CustomerLayout>
      <section className="relative hero-gradient-bg min-h-screen overflow-hidden">
        {/* 배경 글로우 오브 */}
        <div className="hero-glow-orb w-80 h-80 bg-orange-500/20 -top-40 -right-40" />
        <div className="hero-glow-orb w-64 h-64 bg-pink-500/15 bottom-0 -left-32" style={{ animationDelay: '1.5s' }} />
        <div className="hero-glow-orb w-48 h-48 bg-purple-500/10 top-1/2 right-1/4" style={{ animationDelay: '3s' }} />

        {/* 별 반짝임 효과 */}
        <div className="hero-star" style={{ top: '10%', left: '5%', animationDelay: '0s' }} />
        <div className="hero-star" style={{ top: '20%', right: '10%', animationDelay: '0.5s' }} />
        <div className="hero-star" style={{ top: '60%', left: '15%', animationDelay: '1s' }} />
        <div className="hero-star" style={{ top: '80%', right: '20%', animationDelay: '1.5s' }} />
        <div className="hero-star" style={{ top: '40%', left: '70%', animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              완벽한 커스터마이징 가능
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow">
              강의 플랫폼 솔루션
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              지금 보고 계신 이 교육 플랫폼을 그대로 구매하실 수 있습니다.
              <br />
              귀사의 브랜드에 맞게 완벽하게 커스터마이징해 드립니다.
            </p>
          </div>

          {/* 기능 카드 그리드 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${colorClasses[feature.color].bg} rounded-xl flex items-center justify-center mb-4`}>
                  <div className={colorClasses[feature.color].text}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA 섹션 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              관심이 있으신가요?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              귀사만의 교육 플랫폼을 구축해 드립니다.
              <br />
              아래 이메일로 편하게 문의해 주세요.
            </p>

            <a
              href="mailto:johunsang@tenmiles.ai"
              className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              johunsang@tenmiles.ai
            </a>

            <p className="text-gray-500 text-sm mt-6">
              빠른 시일 내에 답변 드리겠습니다
            </p>
          </div>
        </div>
      </section>
    </CustomerLayout>
  )
}
