import CustomerLayout from '@/components/customer/CustomerLayout'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회사 소개 | 바이브 클래스',
  description: 'AI를 도구로 활용해 돈 버는 법을 가르치는 실전 교육 플랫폼. ChatGPT, 클로드 등 AI 도구로 온라인 셀링, 콘텐츠 제작, 업무 자동화를 통해 실제 수익을 만드는 방법을 배웁니다.',
  keywords: '바이브 클래스, 바이브클래스, 회사 소개, AI 부업, AI 수익화, ChatGPT 활용, 온라인 셀링, 콘텐츠 자동화',
  openGraph: {
    title: '회사 소개 | 바이브 클래스',
    description: 'AI를 도구로 활용해 돈 버는 법을 가르치는 실전 교육 플랫폼',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://vibeclass.kr/about',
  },
}

export default function AboutPage() {
  return (
    <CustomerLayout>
      <div className="bg-white">
        {/* Hero Section with Pattern - 개선된 디자인 */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-transparent"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-8">
                <img
                  src="/uploads/image/logo/fulllogo_transparent.png"
                  alt="바이브 클래스"
                  className="h-32 sm:h-40 lg:h-48 w-auto mx-auto object-contain"
                />
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-tight">
                AI로 돈 버는 법을 가르칩니다
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                ChatGPT, 클로드 등 AI 도구를 활용해<br />
                실제 수익을 만드는 실전 교육 플랫폼
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="group bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    AI 온라인 셀링
                  </span>
                </div>
                <div className="group bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M14 2V8H20M8 13H16M8 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    AI 콘텐츠 제작
                  </span>
                </div>
                <div className="group bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    AI 업무 자동화
                  </span>
                </div>
                <div className="group bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    실전 수익화
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements - 향상된 효과 */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* 브랜드 목적 - 더 풍성하게 확장 */}
        <div className="py-24 bg-gradient-to-b from-white via-blue-50/30 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 tracking-wider uppercase bg-blue-100 px-6 py-2.5 rounded-full">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  Our Purpose
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8">브랜드 목적</h2>
              <div className="max-w-5xl mx-auto">
                <p className="text-2xl sm:text-3xl text-gray-900 font-bold mb-6 leading-relaxed">
                  AI를 도구로 활용해 실제 수익을 만드는<br className="hidden sm:block" />
                  실전 교육을 제공하는 것
                </p>
                <p className="text-xl text-gray-600 leading-relaxed">
                  바이브클래스는 단순히 AI 지식을 전달하는 것에 그치지 않습니다.<br className="hidden sm:block" />
                  ChatGPT, 클로드 등 AI 도구를 활용해 온라인 셀링, 콘텐츠 제작,<br className="hidden sm:block" />
                  업무 자동화를 통해 실제로 돈을 버는 방법을 가르칩니다.<br className="hidden sm:block" />
                  배우면 바로 수익으로 연결되는 실전 교육이 우리의 목표입니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: 'AI 온라인 셀링',
                  text: 'AI로 상품 소싱, 상세페이지 작성, 마케팅까지. 스마트스토어, 해외구매대행으로 월 수익을 만듭니다.',
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M14 2V8H20M8 13H16M8 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  title: 'AI 콘텐츠 수익화',
                  text: 'AI로 블로그 글, 유튜브 대본, SNS 콘텐츠를 자동 생성. 애드센스, 협찬으로 부수입을 만듭니다.',
                  color: 'from-emerald-500 to-emerald-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  title: 'AI 업무 자동화',
                  text: '반복 업무를 AI가 대신. 문서 작성, 이메일, 데이터 정리를 자동화해서 시간을 벌어드립니다.',
                  color: 'from-purple-500 to-purple-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: '현업 전문가 강의',
                  text: '실제로 AI로 수익을 내고 있는 전문가가 직접 가르칩니다. 이론이 아닌 실전 노하우를 전수합니다.',
                  color: 'from-orange-500 to-orange-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  title: '배우면 바로 수익',
                  text: '교육 후 바로 적용 가능한 실습 자료와 템플릿 제공. 배운 내용이 곧바로 수익으로 연결됩니다.',
                  color: 'from-pink-500 to-pink-600'
                },
              ].map((item, index) => (
                <div key={index} className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <div className="relative z-10">
                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 p-3 shadow-lg group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 미션 & 비전 - 개선된 디자인 */}
        <div className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 미션 */}
              <div className="group relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-10 shadow-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="inline-block mb-6">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 tracking-wider uppercase bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L4 20L12 17L20 20L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Mission
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-6">미션</h2>
                  <p className="text-xl text-white font-semibold mb-8 leading-relaxed">
                    AI를 도구로 활용해 누구나 수익을 만들 수 있도록 실전 교육을 제공한다
                  </p>
                  <div className="space-y-4">
                    {[
                      { text: 'AI 도구로 실제 돈 버는 방법을 가르침', icon: '🎯' },
                      { text: '초보자도 따라할 수 있는 실전 커리큘럼', icon: '📚' },
                      { text: '온라인 셀링, 콘텐츠 제작, 업무 자동화 교육', icon: '⚡' },
                      { text: '배운 내용을 바로 수익으로 연결하는 실습', icon: '🔧' },
                      { text: '실제 수익을 내는 현업 전문가가 직접 강의', icon: '🔄' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 group/item">
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mt-0.5 group-hover/item:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/90 text-base leading-relaxed">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
              </div>

              {/* 비전 */}
              <div className="group relative bg-white rounded-3xl p-10 shadow-2xl overflow-hidden border-2 border-gray-900 hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="inline-block mb-6">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 tracking-wider uppercase bg-gray-100 px-4 py-2 rounded-full">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Vision
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">비전</h2>
                  <p className="text-xl text-gray-900 font-semibold mb-8 leading-relaxed">
                    한국에서 가장 실전적인 AI 수익화 교육 플랫폼으로 성장하는 것
                  </p>
                  <div className="space-y-4">
                    {[
                      '누구나 AI로 부수입을 만들 수 있는 교육 플랫폼',
                      'AI 온라인 셀링, 콘텐츠 수익화, 업무 자동화 전문 교육',
                      '100% 온라인 ZOOM 실시간 강의로 언제 어디서나 학습',
                      'AI로 돈 버는 사람들의 커뮤니티를 만든다',
                    ].map((text, index) => (
                      <div key={index} className="flex items-start gap-3 group/item">
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center mt-0.5 group-hover/item:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 text-base leading-relaxed">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-gray-900/5 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 핵심 가치 - SVG 아이콘으로 개선 */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 tracking-wider uppercase bg-gray-100 px-6 py-2.5 rounded-full">
                  <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
                  Core Values
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">핵심 가치</h2>
              <p className="text-xl text-gray-600">바이브클래스를 움직이는 5가지 원칙</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                    </svg>
                  ),
                  title: '실전성',
                  description: '배운 내용이 \'바로 비즈니스 자동화\'로 연결됨',
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: '완성형 제공',
                  items: ['강의 = 프로그램 제공', '프로그램 = 즉시 작동', '컨설팅 = 커스텀 개발'],
                  color: 'from-green-500 to-green-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 4V10H17M1 20V14H7M3.51 9A9 9 0 0 1 20.49 15M20.49 9A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: '지속가능성',
                  items: ['유지보수', '업데이트', '기능 확장 주기 제공'],
                  color: 'from-purple-500 to-purple-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: '맞춤형',
                  description: '고객 비즈니스 맞춤 프로그램 제작',
                  color: 'from-pink-500 to-pink-600'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                    </svg>
                  ),
                  title: '전문성',
                  description: 'AI·자동화·API·크롤링 등 고급 기술을 쉬운 방식으로 가르치고 적용',
                  color: 'from-orange-500 to-orange-600'
                },
              ].map((value, index) => (
                <div key={index} className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden hover:scale-105">
                  <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg p-3.5`}>
                      {value.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                    {value.description && (
                      <p className="text-gray-600 leading-relaxed text-lg">{value.description}</p>
                    )}
                    {value.items && (
                      <div className="space-y-2">
                        {value.items.map((item, i) => (
                          <p key={i} className="text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            {item}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 고객이 얻는 결과 - SVG 아이콘으로 개선 */}
        <div className="relative py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 tracking-wider uppercase bg-white/10 backdrop-blur-sm px-6 py-2.5 rounded-full border border-white/20">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Results
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">고객이 얻는 결과</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">바이브클래스를 통해 고객이 경험하는 실질적인 변화</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  number: '70-90%',
                  text: '반복 업무 자동화'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  number: '5-20배',
                  text: '콘텐츠 생산량 증가'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  number: '50%+',
                  text: '비용 및 시간 절감'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  number: '95%↓',
                  text: '업무 실수 감소'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  number: '100%',
                  text: '프로세스 시스템화'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 4V10H17M1 20V14H7M3.51 9A9 9 0 0 1 20.49 15M20.49 9A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  number: '24/7',
                  text: '자동 운영 구조'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L4 20L12 17L20 20L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  number: '3배',
                  text: '비즈니스 효율 증가'
                },
                {
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  number: '0→100',
                  text: '초보자도 전문가처럼'
                },
              ].map((item, index) => (
                <div key={index} className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 text-blue-300 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{item.number}</div>
                    <p className="text-gray-300 text-sm">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* 서비스 구조 - SVG 아이콘으로 개선 */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 tracking-wider uppercase bg-gray-100 px-6 py-2.5 rounded-full">
                  <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
                  Service Structure
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">서비스 구조</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">교육부터 유지보수까지, 완전한 AI 자동화 솔루션</p>
            </div>
            <div className="space-y-6">
              {[
                {
                  number: '01',
                  title: '기본 강의 (입문~실전)',
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  items: ['AI 기초부터 실전 자동화까지', '일부 강의에 소스코드 + 프로그램 제공', '실시간 온라인 + 녹화 강의'],
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  number: '02',
                  title: '프로그램 패키지',
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                    </svg>
                  ),
                  items: ['쇼핑몰 자동화', '유튜브 자동화', '블로그 자동 글쓰기', 'CS 자동응답', '인스타 업로드 자동화 등'],
                  color: 'from-green-500 to-green-600'
                },
                {
                  number: '02-1',
                  title: 'AI 수익화 교육',
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 12C16 13.1046 15.1046 14 14 14C12.8954 14 12 13.1046 12 12C12 10.8954 12.8954 10 14 10C15.1046 10 16 10.8954 16 12Z" fill="currentColor"/>
                      <path d="M7 10H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  items: ['온라인 셀링 자동화 (구매대행·리셀)', '블로그 수익화 자동 시스템', 'SNS/유튜브 콘텐츠 자동 제작', 'AI 도구로 실제 수익 창출 방법'],
                  color: 'from-emerald-500 to-emerald-600'
                },
                {
                  number: '03',
                  title: '실전 컨설팅',
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  items: ['비즈니스 분석', '자동화 도입 상담', 'AI 비즈니스 전략 수립'],
                  color: 'from-purple-500 to-purple-600'
                },
                {
                  number: '04',
                  title: '커스텀 개발',
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="2" fill="currentColor"/>
                    </svg>
                  ),
                  items: ['고객 비즈니스 전용 자동화 제작', '다양한 API 연동', '비즈니스 자동 운영 시스템 구축'],
                  color: 'from-orange-500 to-orange-600'
                },
                {
                  number: '05',
                  title: '유지보수 / 기능 확장',
                  icon: (
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 4V10H17M1 20V14H7M3.51 9A9 9 0 0 1 20.49 15M20.49 9A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  items: ['월 단위 정액 업데이트', '기능 추가', '장애 대응'],
                  color: 'from-pink-500 to-pink-600'
                },
              ].map((service, index) => (
                <div key={index} className="group relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-300 overflow-hidden hover:scale-[1.01]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  <div className="relative flex items-start gap-6">
                    <div className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br ${service.color} text-white rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:scale-110 transition-transform p-3.5`}>
                      <div className="w-9 h-9 mb-1">
                        {service.icon}
                      </div>
                      <div className="text-xs font-bold opacity-80">{service.number}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {service.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center mt-0.5">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-700 text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA - 개선된 디자인 */}
        <div className="relative py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-transparent"></div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-block mb-6">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 tracking-wider uppercase bg-white/10 backdrop-blur-sm px-6 py-2.5 rounded-full border border-white/20">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 20L12 17L20 20L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Get Started
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                AI로 돈 버는 법,<br />
                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  지금 바로 시작하세요
                </span>
              </h2>
              <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                ChatGPT, 클로드 등 AI 도구 활용법을 배우고<br className="hidden sm:block" />
                바로 수익으로 연결하세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/courses">
                  <Button variant="secondary" size="lg" className="shadow-2xl hover:shadow-3xl hover:scale-105">
                    교육 둘러보기
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/consultation">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 hover:scale-105">
                    무료 상담 신청
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { number: '1000+', label: '수강생' },
                  { number: '50+', label: '강의 프로그램' },
                  { number: '90%', label: '만족도' },
                  { number: '24/7', label: '자동화' },
                ].map((stat, index) => (
                  <div key={index} className="text-center group hover:scale-110 transition-transform">
                    <div className="text-4xl sm:text-5xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{stat.number}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </CustomerLayout>
  )
}
