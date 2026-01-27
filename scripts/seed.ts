// 초기 데이터 시드 스크립트
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 데이터베이스 시딩 시작...')

  // 1. 관리자 계정 생성
  const adminPassword = await bcrypt.hash('admin123!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@edu.com' },
    update: {},
    create: {
      email: 'admin@edu.com',
      name: '관리자',
      role: 'admin',
      password: adminPassword,
      phone: '010-1234-5678',
    },
  })
  console.log('✅ 관리자 계정 생성:', admin.email)

  // 2. 테스트 고객 계정 생성
  const customerPassword = await bcrypt.hash('test123!', 10)
  const customer = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      name: '테스트 고객',
      role: 'customer',
      password: customerPassword,
      phone: '010-9876-5432',
    },
  })
  console.log('✅ 테스트 고객 계정 생성:', customer.email)

  // 3. 카테고리 생성
  const categories = [
    { name: '프로그래밍', slug: 'programming', order: 1 },
    { name: '디자인', slug: 'design', order: 2 },
    { name: '비즈니스', slug: 'business', order: 3 },
    { name: '마케팅', slug: 'marketing', order: 4 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log('✅ 카테고리 생성 완료')

  // 4. 강사 생성
  const instructors = [
    {
      name: '김태현',
      email: 'kim@edu.com',
      phone: '010-1111-2222',
      bio: '10년 경력의 풀스택 개발자이자 교육자입니다. 삼성전자와 네이버에서 시니어 개발자로 근무했으며, 현재는 프리랜서로 활동하며 후배 개발자들을 양성하고 있습니다.',
      expertise: 'Next.js, React, Node.js, TypeScript, 웹 풀스택 개발',
    },
    {
      name: '이서연',
      email: 'lee@edu.com',
      phone: '010-3333-4444',
      bio: 'UX/UI 디자인 전문가로 15년간 다양한 프로젝트를 진행했습니다. 카카오와 라인에서 디자인 리드를 역임했으며, 실무 중심의 교육으로 유명합니다.',
      expertise: 'Figma, Adobe XD, UI/UX 디자인, 디자인 시스템',
    },
    {
      name: '박준호',
      email: 'park@edu.com',
      phone: '010-5555-6666',
      bio: '데이터 과학자이자 AI 엔지니어입니다. 서울대 컴퓨터공학 박사 출신으로 여러 스타트업에서 AI 솔루션을 개발해왔습니다.',
      expertise: 'Python, Machine Learning, Deep Learning, 데이터 분석',
    },
    {
      name: '최민지',
      email: 'choi@edu.com',
      phone: '010-7777-8888',
      bio: '비즈니스 전략 컨설턴트로 McKinsey에서 7년간 근무했습니다. 스타트업 창업 경험도 있으며, 실전 비즈니스 전략을 가르칩니다.',
      expertise: '비즈니스 전략, 스타트업, 경영 컨설팅, MBA 과정',
    },
  ]

  const createdInstructors = []
  for (const instructor of instructors) {
    const created = await prisma.instructor.upsert({
      where: { email: instructor.email },
      update: {},
      create: instructor,
    })
    createdInstructors.push(created)
  }
  console.log('✅ 강사 생성 완료')

  // 5. 샘플 교육 생성
  const programmingCategory = await prisma.category.findFirst({
    where: { slug: 'programming' },
  })
  const designCategory = await prisma.category.findFirst({
    where: { slug: 'design' },
  })
  const businessCategory = await prisma.category.findFirst({
    where: { slug: 'business' },
  })
  const marketingCategory = await prisma.category.findFirst({
    where: { slug: 'marketing' },
  })

  const sampleCourses = [
    {
      id: 1,
      title: 'Next.js 풀스택 개발 마스터',
      description: '100% 온라인 실시간 Zoom 수업. Next.js 14의 모든 기능을 전문 강사와 함께 마스터하세요. 수업 링크 자동 발송, 녹화본 자동 제공.',
      curriculum: `1주차: Next.js 기초와 AI 멘토링 시작
- App Router 완벽 이해
- 서버 컴포넌트 vs 클라이언트 컴포넌트
- AI 멘토에게 실시간으로 질문하기

2주차: 데이터 페칭과 상태 관리
- Server Actions 마스터
- API Routes 설계
- 데이터베이스 연동 실습

3주차: 인증과 보안
- NextAuth.js 완벽 구현
- 미들웨어 활용
- 보안 베스트 프랙티스

4주차: 배포와 최적화
- Vercel 배포 전략
- 성능 최적화 기법
- SEO 최적화 완성`,
      price: 450000,
      capacity: 20,
      categoryId: programmingCategory?.id,
      instructorId: createdInstructors[0]?.id,
    },
    {
      id: 2,
      title: 'Python AI 프로그래밍 완성',
      description: '실시간 Zoom으로 진행되는 100% 온라인 수업. 파이썬으로 AI 애플리케이션 개발을 배우세요. 자동 일정 관리, 녹화본 제공.',
      curriculum: `1주차: Python 기초
- Python 문법 완성
- 데이터 타입과 자료구조
- 함수형 프로그래밍

2주차: AI/ML 기초
- NumPy와 Pandas
- 데이터 전처리
- 기본 알고리즘

3주차: 딥러닝 입문
- TensorFlow 기초
- 신경망 구조
- 모델 학습

4주차: 실전 프로젝트
- 챗봇 만들기
- 이미지 분류기
- 배포하기`,
      price: 380000,
      capacity: 25,
      categoryId: programmingCategory?.id,
      instructorId: createdInstructors[2]?.id,
    },
    {
      id: 3,
      title: 'React Native 모바일 앱 개발',
      description: '100% 온라인 실시간 강의로 크로스 플랫폼 앱을 만드세요. Zoom 링크 자동 발송, 모든 수업 녹화 제공.',
      curriculum: `1주차: React Native 시작
- 개발 환경 구축
- 컴포넌트 기초
- 스타일링

2주차: 네비게이션과 상태관리
- React Navigation
- Redux Toolkit
- 비동기 처리

3주차: 네이티브 기능 활용
- 카메라, 위치정보
- 푸시 알림
- 로컬 저장소

4주차: 앱 배포
- iOS 빌드
- Android 빌드
- 스토어 출시`,
      price: 420000,
      capacity: 20,
      categoryId: programmingCategory?.id,
      instructorId: createdInstructors[0]?.id,
    },
    {
      id: 4,
      title: 'UX/UI 디자인 실전',
      description: '실시간 Zoom 수업으로 전문 디자이너에게 배우세요. 100% 온라인, 자동 일정 관리, 포트폴리오 완성까지.',
      curriculum: `1주차: 디자인 기초
- 색채 이론
- 타이포그래피
- 레이아웃 원칙

2주차: Figma 마스터
- 컴포넌트 시스템
- Auto Layout
- 프로토타이핑

3주차: 사용자 경험
- 사용자 리서치
- 와이어프레임
- 사용성 테스트

4주차: 포트폴리오
- 케이스 스터디 작성
- 디자인 시스템 구축
- 실전 프로젝트`,
      price: 350000,
      capacity: 15,
      categoryId: designCategory?.id,
      instructorId: createdInstructors[1]?.id,
    },
    {
      id: 5,
      title: '브랜딩과 로고 디자인',
      description: '실시간 Zoom으로 브랜딩 전문가에게 배우세요. 100% 온라인 수업, 자동 녹화본 제공으로 복습도 완벽.',
      curriculum: `1주차: 브랜딩 기초
- 브랜드 아이덴티티
- 타겟 분석
- 컨셉 개발

2주차: 로고 디자인
- 로고 유형
- 시안 제작
- 컬러 시스템

3주차: 브랜드 가이드
- 타이포그래피 가이드
- 어플리케이션
- 목업 제작

4주차: 포트폴리오
- 케이스 스터디
- 프레젠테이션
- 클라이언트 커뮤니케이션`,
      price: 320000,
      capacity: 18,
      categoryId: designCategory?.id,
      instructorId: createdInstructors[1]?.id,
    },
    {
      id: 6,
      title: '스타트업 창업 실전',
      description: '실시간 Zoom으로 성공한 창업가에게 직접 배우세요. 100% 온라인 수업, 자동 링크 발송, 녹화본 제공.',
      curriculum: `1주차: 아이디어 검증
- 문제 발견
- 시장 조사
- MVP 설계

2주차: 비즈니스 모델
- 수익 모델
- 고객 세그먼트
- 가치 제안

3주차: 자금 조달
- 투자 유치
- 피칭 기술
- 재무 계획

4주차: 성장 전략
- 마케팅 채널
- 팀 빌딩
- 스케일업`,
      price: 500000,
      capacity: 12,
      categoryId: businessCategory?.id,
      instructorId: createdInstructors[3]?.id,
    },
    {
      id: 7,
      title: '디지털 마케팅 완전정복',
      description: '100% 온라인 실시간 강의로 마케팅 전문가에게 배우세요. Zoom 수업, 자동 일정 관리, 수료증 자동 발급.',
      curriculum: `1주차: 마케팅 기초
- 디지털 마케팅 개요
- 고객 여정 맵
- KPI 설정

2주차: SNS 마케팅
- 인스타그램 전략
- 페이스북 광고
- 콘텐츠 기획

3주차: 검색 마케팅
- SEO 최적화
- 구글 애즈
- 키워드 전략

4주차: 데이터 분석
- GA4 활용
- 전환율 최적화
- 성과 측정`,
      price: 360000,
      capacity: 25,
      categoryId: marketingCategory?.id,
      instructorId: createdInstructors[3]?.id,
    },
    {
      id: 8,
      title: '콘텐츠 마케팅과 스토리텔링',
      description: '실시간 Zoom으로 콘텐츠 전문가에게 배우세요. 100% 온라인, 자동화된 시스템으로 편리하게 수강하세요.',
      curriculum: `1주차: 콘텐츠 기획
- 타겟 분석
- 콘텐츠 전략
- 에디토리얼 캘린더

2주차: 스토리텔링
- 브랜드 스토리
- 감성 마케팅
- 메시지 설계

3주차: 콘텐츠 제작
- 글쓰기 기법
- 비주얼 콘텐츠
- 동영상 마케팅

4주차: 성과 분석
- 인게이지먼트 측정
- A/B 테스팅
- 최적화 전략`,
      price: 330000,
      capacity: 20,
      categoryId: marketingCategory?.id,
      instructorId: createdInstructors[3]?.id,
    },
  ]

  for (const courseData of sampleCourses) {
    if (courseData.categoryId) {
      const course = await prisma.course.upsert({
        where: { id: courseData.id },
        update: {},
        create: {
          title: courseData.title,
          description: courseData.description,
          curriculum: courseData.curriculum,
          price: courseData.price,
          capacity: courseData.capacity,
          categoryId: courseData.categoryId,
          instructorId: courseData.instructorId,
          status: 'active',
        },
      })
      console.log('✅ 샘플 교육 생성:', course.title)

      // 교육 일정 생성
      const now = new Date()
      const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7일 후
      const endDate = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000) // 4주 과정

      await prisma.courseSchedule.upsert({
        where: { id: courseData.id },
        update: {},
        create: {
          courseId: course.id,
          startDate,
          endDate,
          status: 'scheduled',
        },
      })
    }
  }
  console.log('✅ 모든 샘플 교육 및 일정 생성 완료')

  console.log('🎉 시딩 완료!')
  console.log('')
  console.log('=== 로그인 정보 ===')
  console.log('관리자:')
  console.log('  이메일: admin@edu.com')
  console.log('  비밀번호: admin123!')
  console.log('')
  console.log('테스트 고객:')
  console.log('  이메일: test@test.com')
  console.log('  비밀번호: test123!')
  console.log('==================')
}

main()
  .catch((e) => {
    console.error('❌ 시딩 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
