import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('과거 강의 샘플 데이터 추가 시작...')

  // 기존 강사 조회
  const instructors = await prisma.instructor.findMany()
  const categories = await prisma.category.findMany()

  if (instructors.length === 0 || categories.length === 0) {
    console.error('강사 또는 카테고리가 없습니다. 먼저 기본 데이터를 추가해주세요.')
    return
  }

  // 과거 강의 데이터
  const pastCourses = [
    {
      title: 'Python 기초 완성 (종료)',
      description: '파이썬 기초부터 실전까지 4주 완성 과정',
      curriculum: '1주차: 기본 문법\n2주차: 자료구조\n3주차: 함수와 모듈\n4주차: 실전 프로젝트',
      price: 390000,
      capacity: 30,
      categoryId: categories.find(c => c.name === '프로그래밍')?.id || categories[0].id,
      instructorId: instructors[0].id,
      status: 'active' as const,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      cohort: 1,
      // 2개월 전 시작, 1개월 전 종료
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'JavaScript ES6+ 마스터 (종료)',
      description: 'ES6+ 최신 JavaScript 완벽 정리',
      curriculum: '1주차: ES6 기초\n2주차: 비동기 프로그래밍\n3주차: 모던 JS 패턴\n4주차: 프로젝트',
      price: 450000,
      capacity: 25,
      categoryId: categories.find(c => c.name === '프로그래밍')?.id || categories[0].id,
      instructorId: instructors[1]?.id || instructors[0].id,
      status: 'active' as const,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      cohort: 2,
      // 3개월 전 시작, 2개월 전 종료
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      title: '데이터베이스 설계 기초 (종료)',
      description: 'SQL과 데이터베이스 설계 실전 과정',
      curriculum: '1주차: SQL 기초\n2주차: 정규화\n3주차: 인덱싱\n4주차: 실전 설계',
      price: 420000,
      capacity: 20,
      categoryId: categories.find(c => c.name === '데이터베이스')?.id || categories[0].id,
      instructorId: instructors[2]?.id || instructors[0].id,
      status: 'active' as const,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      cohort: 1,
      // 2개월 전 시작, 1개월 전 종료
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Git & GitHub 활용법 (무료 특강 종료)',
      description: '버전 관리의 모든 것, 1일 완성',
      curriculum: '오전: Git 기초\n오후: GitHub 협업',
      price: 0,
      capacity: 50,
      categoryId: categories.find(c => c.name === '프로그래밍')?.id || categories[0].id,
      instructorId: instructors[3]?.id || instructors[0].id,
      status: 'active' as const,
      isFree: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800',
      cohort: 1,
      // 2주 전
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8시간
    },
    {
      title: 'Docker 컨테이너 입문 (무료 특강 종료)',
      description: 'Docker 기초부터 실전 배포까지',
      curriculum: '오전: Docker 기초\n오후: 실전 배포',
      price: 0,
      capacity: 40,
      categoryId: categories.find(c => c.name === '클라우드/DevOps')?.id || categories[0].id,
      instructorId: instructors[4]?.id || instructors[0].id,
      status: 'active' as const,
      isFree: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800',
      cohort: 1,
      // 3주 전
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8시간
    },
    {
      title: 'React 심화 과정 (종료)',
      description: 'React 고급 패턴과 성능 최적화',
      curriculum: '1주차: Hooks 심화\n2주차: 성능 최적화\n3주차: 상태관리\n4주차: 실전 프로젝트',
      price: 520000,
      capacity: 20,
      categoryId: categories.find(c => c.name === '웹 개발')?.id || categories[0].id,
      instructorId: instructors[1]?.id || instructors[0].id,
      status: 'active' as const,
      isFree: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      cohort: 3,
      // 4개월 전 시작, 3개월 전 종료
      startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const courseData of pastCourses) {
    const { cohort, startDate, endDate, ...courseInfo } = courseData

    // 강의 생성
    const course = await prisma.course.create({
      data: courseInfo,
    })

    console.log(`✅ 강의 생성: ${course.title}`)

    // 스케줄 생성
    const schedule = await prisma.courseSchedule.create({
      data: {
        courseId: course.id,
        cohort,
        startDate,
        endDate,
        status: 'completed',
        meetId: `past-${course.id}-${cohort}`,
        meetLink: `https://meet.google.com/past${course.id}${cohort}`,
      },
    })

    console.log(`  📅 스케줄 생성: ${cohort}기 (${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()})`)

    // 무료 특강이 아닌 경우 세션 생성
    if (!course.isFree) {
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      const sessionsToCreate = []

      for (let i = 0; i < duration; i++) {
        const sessionDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
        sessionsToCreate.push({
          scheduleId: schedule.id,
          sessionNumber: i + 1,
          sessionDate,
          startTime: '19:00',
          endTime: '21:00',
          topic: `${i + 1}주차 수업`,
        })
      }

      await prisma.courseSession.createMany({
        data: sessionsToCreate,
      })

      console.log(`  🎯 ${sessionsToCreate.length}개 세션 생성`)
    }
  }

  console.log('\n✨ 과거 강의 샘플 데이터 추가 완료!')
  console.log(`총 ${pastCourses.length}개 과거 강의 추가됨`)
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
