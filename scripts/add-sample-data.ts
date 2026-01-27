import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('샘플 데이터 추가 시작...')

  // 기존 카테고리 가져오기
  const categories = await prisma.category.findMany()
  console.log('카테고리:', categories.length, '개')

  // 새로운 강사 추가
  const newInstructors = [
    {
      name: '최지훈',
      email: 'choi@example.com',
      phone: '010-5678-1234',
      bio: '현업 개발자 출신의 실전 코딩 전문가입니다. 10년 이상의 개발 경험을 바탕으로 실무에 바로 적용 가능한 기술을 가르칩니다.',
      expertise: '풀스택 개발, 클라우드 아키텍처, DevOps',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
    },
    {
      name: '박서연',
      email: 'park@example.com',
      phone: '010-8765-4321',
      bio: 'UX/UI 디자인 전문가로 사용자 중심의 디자인을 가르칩니다. 다수의 글로벌 프로젝트 경험을 보유하고 있습니다.',
      expertise: 'UX/UI 디자인, 프로토타이핑, 사용자 리서치',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop',
    },
    {
      name: '정민수',
      email: 'jung@example.com',
      phone: '010-2468-1357',
      bio: '빅데이터 분석 및 머신러닝 전문가입니다. 복잡한 개념을 쉽게 설명하는 것을 좋아합니다.',
      expertise: '데이터 분석, 머신러닝, 통계학',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop',
    },
    {
      name: '강은지',
      email: 'kang@example.com',
      phone: '010-9876-5432',
      bio: '마케팅 전략 및 브랜딩 전문가입니다. 실제 성공 사례를 바탕으로 실전 마케팅을 가르칩니다.',
      expertise: '디지털 마케팅, 브랜드 전략, 콘텐츠 마케팅',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop',
    },
  ]

  const createdInstructors = []
  for (const instructor of newInstructors) {
    const existing = await prisma.instructor.findUnique({
      where: { email: instructor.email },
    })
    if (!existing) {
      const created = await prisma.instructor.create({ data: instructor })
      createdInstructors.push(created)
      console.log('강사 생성:', created.name)
    }
  }

  // 모든 강사 가져오기
  const allInstructors = await prisma.instructor.findMany()
  console.log('총 강사:', allInstructors.length, '명')

  // 새로운 강의 추가
  const newCourses = [
    // 프로그래밍 카테고리
    {
      title: 'React 실전 프로젝트',
      description: 'React를 활용하여 실제 서비스를 개발하는 과정을 배웁니다. 현대적인 웹 개발 기술을 습득하고 포트폴리오를 완성할 수 있습니다.',
      curriculum: '1주차: React 기초\n2주차: 상태관리 (Redux, Zustand)\n3주차: API 연동과 데이터 페칭\n4주차: 최적화 및 배포',
      price: 490000,
      isFree: false,
      capacity: 25,
      categoryId: categories.find(c => c.slug === 'programming')?.id || 1,
      instructorId: allInstructors[0]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
    },
    {
      title: 'Python 데이터 분석 기초',
      description: 'Python을 활용한 데이터 분석의 기초를 배웁니다. Pandas, NumPy 등 필수 라이브러리를 다룹니다.',
      curriculum: '1주차: Python 기초 문법\n2주차: Pandas로 데이터 다루기\n3주차: NumPy와 시각화\n4주차: 실전 데이터 분석 프로젝트',
      price: 420000,
      isFree: false,
      capacity: 30,
      categoryId: categories.find(c => c.slug === 'programming')?.id || 1,
      instructorId: allInstructors[2]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop',
    },
    {
      title: '웹 개발 첫걸음 (무료 특강)',
      description: '웹 개발에 관심 있는 분들을 위한 무료 입문 특강입니다. HTML, CSS, JavaScript의 기초를 배웁니다.',
      curriculum: '1일 특강: 웹 개발 소개 및 실습\n- HTML/CSS 기초\n- JavaScript 맛보기\n- 간단한 웹페이지 만들기',
      price: 0,
      isFree: true,
      capacity: 50,
      categoryId: categories.find(c => c.slug === 'programming')?.id || 1,
      instructorId: allInstructors[0]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop',
    },
    // 디자인 카테고리
    {
      title: 'Figma 실무 UI/UX 디자인',
      description: 'Figma를 활용하여 실무에서 사용하는 UI/UX 디자인을 배웁니다. 프로토타입 제작부터 디자인 시스템 구축까지.',
      curriculum: '1주차: Figma 기초와 인터페이스\n2주차: UI 컴포넌트 디자인\n3주차: 프로토타이핑\n4주차: 디자인 시스템 구축',
      price: 450000,
      isFree: false,
      capacity: 20,
      categoryId: categories.find(c => c.slug === 'design')?.id || 2,
      instructorId: allInstructors[1]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
    },
    {
      title: '디자인 씽킹 워크샵 (무료)',
      description: '디자인 사고방식을 배우는 1일 워크샵입니다. 실제 문제를 해결하는 과정을 경험합니다.',
      curriculum: '1일 특강: 디자인 씽킹 프로세스\n- 공감하기\n- 문제 정의\n- 아이디어 도출\n- 프로토타입 제작',
      price: 0,
      isFree: true,
      capacity: 40,
      categoryId: categories.find(c => c.slug === 'design')?.id || 2,
      instructorId: allInstructors[1]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&auto=format&fit=crop',
    },
    // 마케팅 카테고리
    {
      title: '소셜 미디어 마케팅 마스터',
      description: '인스타그램, 페이스북, 유튜브 등 소셜 미디어를 활용한 마케팅 전략을 배웁니다.',
      curriculum: '1주차: 소셜 미디어 플랫폼 이해\n2주차: 콘텐츠 전략 수립\n3주차: 광고 캠페인 운영\n4주차: 데이터 분석 및 최적화',
      price: 380000,
      isFree: false,
      capacity: 35,
      categoryId: categories.find(c => c.slug === 'marketing')?.id || 3,
      instructorId: allInstructors[3]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop',
    },
    {
      title: 'SEO 최적화 실전 가이드',
      description: '검색엔진 최적화를 통해 웹사이트 트래픽을 증가시키는 방법을 배웁니다.',
      curriculum: '1주차: SEO 기초 개념\n2주차: 키워드 리서치\n3주차: 온페이지 최적화\n4주차: 링크 빌딩과 성과 측정',
      price: 350000,
      isFree: false,
      capacity: 30,
      categoryId: categories.find(c => c.slug === 'marketing')?.id || 3,
      instructorId: allInstructors[3]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop',
    },
    {
      title: '퍼스널 브랜딩 특강 (무료)',
      description: '개인 브랜드를 구축하는 방법을 배우는 무료 특강입니다.',
      curriculum: '1일 특강: 퍼스널 브랜딩 전략\n- 나만의 브랜드 정의\n- SNS 프로필 최적화\n- 콘텐츠 방향 설정',
      price: 0,
      isFree: true,
      capacity: 60,
      categoryId: categories.find(c => c.slug === 'marketing')?.id || 3,
      instructorId: allInstructors[3]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop',
    },
    // 비즈니스 카테고리
    {
      title: '스타트업 창업 실전 과정',
      description: '스타트업 창업의 전 과정을 배웁니다. 아이디어 검증부터 투자 유치까지.',
      curriculum: '1주차: 비즈니스 모델 설계\n2주차: MVP 개발과 검증\n3주차: 고객 확보 전략\n4주차: 투자 유치와 성장 전략',
      price: 520000,
      isFree: false,
      capacity: 20,
      categoryId: categories.find(c => c.slug === 'business')?.id || 4,
      instructorId: allInstructors[4]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&auto=format&fit=crop',
    },
    {
      title: '데이터 기반 의사결정',
      description: '데이터를 활용하여 비즈니스 의사결정을 하는 방법을 배웁니다.',
      curriculum: '1주차: 데이터 리터러시\n2주차: 핵심 지표 설정\n3주차: 데이터 시각화\n4주차: 인사이트 도출과 실행',
      price: 420000,
      isFree: false,
      capacity: 25,
      categoryId: categories.find(c => c.slug === 'business')?.id || 4,
      instructorId: allInstructors[2]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
    },
    {
      title: '효과적인 프레젠테이션 스킬 (무료)',
      description: '설득력 있는 프레젠테이션 기술을 배우는 무료 특강입니다.',
      curriculum: '1일 특강: 프레젠테이션 마스터클래스\n- 스토리텔링 기법\n- 슬라이드 디자인\n- 발표 연습과 피드백',
      price: 0,
      isFree: true,
      capacity: 50,
      categoryId: categories.find(c => c.slug === 'business')?.id || 4,
      instructorId: allInstructors[4]?.id,
      status: 'active',
      thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop',
    },
  ]

  const createdCourses = []
  for (const course of newCourses) {
    const created = await prisma.course.create({ data: course })
    createdCourses.push(created)
    console.log('강의 생성:', created.title, '-', created.isFree ? '무료' : '유료')
  }

  // 스케줄 생성
  console.log('\n스케줄 생성 중...')
  for (const course of createdCourses) {
    // 각 강의마다 1~2개의 스케줄 생성
    const scheduleCount = course.isFree ? 2 : 1 // 무료 강의는 2개, 유료는 1개

    for (let i = 0; i < scheduleCount; i++) {
      const cohort = i + 1
      const startDate = new Date()

      if (course.isFree) {
        // 무료 강의: 1일 특강
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 5)
        const endDate = new Date(startDate)

        const schedule = await prisma.courseSchedule.create({
          data: {
            courseId: course.id,
            cohort,
            startDate,
            endDate,
            status: 'scheduled',
          },
        })

        // 1개 세션만 생성
        await prisma.courseSession.create({
          data: {
            scheduleId: schedule.id,
            sessionNumber: 1,
            sessionDate: startDate,
            startTime: '14:00',
            endTime: '17:00',
            topic: '특강',
          },
        })

        console.log(`  - ${course.title} ${cohort}기 (1일 특강) 생성`)
      } else {
        // 유료 강의: 4주 과정
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 20) + 10)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 28) // 4주

        const schedule = await prisma.courseSchedule.create({
          data: {
            courseId: course.id,
            cohort,
            startDate,
            endDate,
            status: 'scheduled',
          },
        })

        // 4개 세션 생성 (매주 수요일 저녁)
        for (let sessionNum = 1; sessionNum <= 4; sessionNum++) {
          const sessionDate = new Date(startDate)
          sessionDate.setDate(sessionDate.getDate() + (sessionNum - 1) * 7)

          await prisma.courseSession.create({
            data: {
              scheduleId: schedule.id,
              sessionNumber: sessionNum,
              sessionDate,
              startTime: '19:00',
              endTime: '21:00',
              topic: `${sessionNum}주차`,
            },
          })
        }

        console.log(`  - ${course.title} ${cohort}기 (4주 과정) 생성`)
      }
    }
  }

  // 최종 통계
  console.log('\n=== 샘플 데이터 추가 완료 ===')
  const finalCounts = {
    instructors: await prisma.instructor.count(),
    courses: await prisma.course.count(),
    schedules: await prisma.courseSchedule.count(),
    sessions: await prisma.courseSession.count(),
  }
  console.log('총 강사:', finalCounts.instructors, '명')
  console.log('총 강의:', finalCounts.courses, '개')
  console.log('총 스케줄:', finalCounts.schedules, '개')
  console.log('총 세션:', finalCounts.sessions, '개')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
