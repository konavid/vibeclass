/**
 * 사이트 설정
 *
 * 이 파일의 값들을 수정하거나 환경변수로 설정하여 사이트를 커스터마이징하세요.
 */

// ============================================
// 기본 사이트 정보
// ============================================
export const siteConfig = {
  // 사이트 이름
  name: process.env.NEXT_PUBLIC_SITE_NAME || '바이브클래스',

  // 사이트 URL
  url: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // 사이트 설명
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'AI와 함께하는 온라인 교육 플랫폼',

  // 키워드 (SEO)
  keywords: process.env.NEXT_PUBLIC_SITE_KEYWORDS || '온라인 교육, 코딩, 프로그래밍',

  // 연락처 이메일
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@example.com',

  // 발신 이메일
  fromEmail: process.env.SMTP_FROM_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'noreply@example.com',

  // 로고
  logo: {
    default: '/logo.png',
    transparent: '/uploads/image/logo/print_transparent.svg',
    full: '/uploads/image/logo/fulllogo_transparent.png',
  },

  // OG 이미지 (없으면 로고 사용)
  ogImage: '/logo.png',

  // 소셜 미디어
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    threads: process.env.NEXT_PUBLIC_THREADS_URL || '',
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || '',
  },
} as const

// ============================================
// 회사 정보 (푸터용)
// ============================================
export const companyConfig = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || '',
  ceo: process.env.NEXT_PUBLIC_COMPANY_CEO || '',
  businessNumber: process.env.NEXT_PUBLIC_BUSINESS_NUMBER || '',
  salesNumber: process.env.NEXT_PUBLIC_SALES_NUMBER || '',
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '',
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '',
} as const

// ============================================
// 페이지 텍스트
// ============================================
export const textConfig = {
  // 히어로 섹션
  hero: {
    title: process.env.NEXT_PUBLIC_HERO_TITLE || '바이브 코딩',
    subtitle: process.env.NEXT_PUBLIC_HERO_SUBTITLE || 'AI와 함께라면 누구나 코딩할 수 있습니다.',
    cta1: '강의 둘러보기',
    cta2: '무료로 시작하기',
    tags: ['Python', 'JavaScript', 'React', 'AI', 'ChatGPT', 'Claude'],
  },

  // 섹션 타이틀
  sections: {
    instructors: '강사',
    instructorsDesc: '현업 전문가의 지식을 만나보세요',
    recruiting: '지금 신청 가능한 강의',
    recruitingDesc: '마감 전 서둘러 신청하세요',
    free: '무료로 시작하세요',
    freeDesc: '교육, 영상강의, 전자책까지 무료 콘텐츠',
    schedule: '전체 강의 일정',
    scheduleDesc: '모든 강의 일정을 한눈에 확인하세요',
    popular: '인기 강의',
    popularDesc: '전문 강사의 실시간 수업을 만나보세요',
  },

  // 로그인/회원가입
  auth: {
    loginTitle: '로그인',
    loginDesc: '간편하게 로그인하세요',
    registerTitle: '회원가입',
    registerDesc: '간편하게 가입하고 시작하세요',
  },

  // 공통
  common: {
    viewAll: '전체보기',
    viewMore: '더보기',
    apply: '신청하기',
    free: '무료',
    online: '온라인',
    offline: '오프라인',
  },
} as const

// ============================================
// 도메인/쿠키 설정
// ============================================
export const domainConfig = {
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  isProduction: process.env.NODE_ENV === 'production',
} as const

// ============================================
// 결제 설정
// ============================================
export const paymentConfig = {
  apiUrl: process.env.PAYMENT_TEACHER_API_URL || 'https://erp-api.payssam.kr/if/bill/send',
  checkUrl: process.env.PAYMENT_TEACHER_CHECK_URL || 'https://erp-api.payssam.kr/if/bill/check',
  callbackUrl: process.env.PAYMENT_CALLBACK_URL || `${siteConfig.url}/api/payment/callback`,
  isSpecialMode: process.env.OPEN_SPECIAL_MODE === 'true',
  normalPrice: parseInt(process.env.NORMAL_MONTHLY_PRICE || '165000'),
  specialPrice: parseInt(process.env.SPECIAL_MONTHLY_PRICE || '88000'),
} as const

// ============================================
// 헬퍼 함수
// ============================================

// 전체 URL 생성
export const getFullUrl = (path: string): string => {
  const baseUrl = siteConfig.url.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

// 알림톡 링크 생성
export const getNotificationLinks = () => ({
  courses: getFullUrl('/courses'),
  enrollments: getFullUrl('/my/enrollments'),
  reviews: getFullUrl('/my/enrollments'),
})

// 임시 이메일 생성 (소셜 로그인용)
export const generateTempEmail = (provider: string, id: string): string => {
  try {
    const domain = new URL(siteConfig.url).hostname || 'temp.local'
    return `${provider}_${id}@temp.${domain}`
  } catch {
    return `${provider}_${id}@temp.local`
  }
}

// 이메일 설정
export const emailConfig = {
  siteName: siteConfig.name,
  siteUrl: siteConfig.url,
  contactEmail: siteConfig.contactEmail,
  fromEmail: siteConfig.fromEmail,
  logoUrl: getFullUrl(siteConfig.logo.full),
}

// 메타데이터 생성 헬퍼
export const getMetadata = (title?: string, description?: string) => ({
  title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
  description: description || siteConfig.description,
  openGraph: {
    title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
    description: description || siteConfig.description,
    type: 'website' as const,
    locale: 'ko_KR',
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [{ url: getFullUrl(siteConfig.ogImage), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
    description: description || siteConfig.description,
    images: [getFullUrl(siteConfig.ogImage)],
  },
})
