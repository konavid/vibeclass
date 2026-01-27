import CustomerLayout from '@/components/customer/CustomerLayout'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CourseCalendar from '@/components/calendar/CourseCalendar'
import InstructorCarousel from '@/components/customer/InstructorCarousel'
import { siteConfig, textConfig, getMetadata } from '@/lib/config'

export const metadata = getMetadata()

// 페이지 캐싱 비활성화 - 항상 최신 데이터 표시
export const dynamic = 'force-dynamic'
export const revalidate = 0

// 강의별 고유 색상 팔레트
const courseColors = [
  { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', lightBg: 'bg-blue-50' },
  { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', lightBg: 'bg-purple-50' },
  { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', lightBg: 'bg-green-50' },
  { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600', lightBg: 'bg-orange-50' },
  { bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-600', lightBg: 'bg-pink-50' },
  { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', lightBg: 'bg-indigo-50' },
  { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-600', lightBg: 'bg-teal-50' },
  { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', lightBg: 'bg-rose-50' },
]

// 강의 ID로 색상 가져오기
const getCourseColor = (courseId: number) => {
  return courseColors[courseId % courseColors.length]
}

async function getFeaturedCourses() {
  const courses = await prisma.course.findMany({
    where: {
      status: 'active',
      instructorId: { not: null }, // 강사가 있는 강의만
      instructor: { is: { isActive: true } }, // 활성화된 강사만
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      category: true,
      instructor: true,
      schedules: {
        where: {
          status: { in: ['scheduled', 'ongoing'] },
        },
        orderBy: { startDate: 'asc' },
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true, // 누적 수강생
          reviews: true,
        },
      },
    },
  })

  return courses
}

async function getInstructorsWithCourses() {
  const instructors = await prisma.instructor.findMany({
    where: {
      isActive: true, // 활성화된 강사만
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      expertise: true,
      bio: true,
      consultingEnabled: true,
      consultingPrice: true,
      courses: {
        where: { status: 'active' },
        take: 3,
        include: {
          category: true,
          schedules: {
            where: {
              status: { in: ['scheduled', 'ongoing'] },
            },
            orderBy: { startDate: 'asc' },
            include: {
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true, // 누적 수강생
              reviews: true,
            },
          },
        },
      },
      _count: {
        select: {
          courses: {
            where: { status: 'active' },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return instructors
}

async function getAllSchedules() {
  const courses = await prisma.course.findMany({
    where: {
      status: 'active',
      instructorId: { not: null }, // 강사가 있는 강의만
      instructor: { is: { isActive: true } }, // 활성화된 강사만
    },
    include: {
      instructor: true,
      schedules: {
        where: {
          status: { in: ['scheduled', 'ongoing'] },
        },
        include: {
          sessions: {
            orderBy: { sessionDate: 'asc' },
          },
        },
        orderBy: { startDate: 'asc' },
      },
    },
  })

  return courses.flatMap((course) =>
    course.schedules.map((schedule) => ({
      id: schedule.id,
      cohort: schedule.cohort,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      status: schedule.status,
      sessions: schedule.sessions,
      course: {
        id: course.id,
        title: course.title,
        isFree: course.isFree,
      },
      instructor: course.instructor ? {
        name: course.instructor.name,
        imageUrl: course.instructor.imageUrl,
      } : null,
    }))
  )
}

async function getFreeCourses() {
  const courses = await prisma.course.findMany({
    where: {
      status: 'active',
      isFree: true,
      instructorId: { not: null }, // 강사가 있는 강의만
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      category: true,
      instructor: true,
      schedules: {
        where: {
          status: { in: ['scheduled', 'ongoing'] },
        },
        orderBy: { startDate: 'asc' },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  })

  return courses
}

async function getFreeVideos() {
  const videos = await prisma.video.findMany({
    where: {
      isPublished: true,
      isFree: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      category: true,
      instructor: true,
    },
  })
  return videos
}

async function getFreeProducts() {
  const products = await prisma.digitalProduct.findMany({
    where: {
      isPublished: true,
      isFree: true,
      type: { in: ['ebook', 'program'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      category: true,
      instructor: true,
    },
  })
  return products
}

async function getFreeSlides() {
  const slides = await prisma.digitalProduct.findMany({
    where: {
      isPublished: true,
      isFree: true,
      type: 'slides',
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      category: true,
      instructor: true,
    },
  })
  return slides
}

// 모집중인 강의 가져오기 (무료 포함)
async function getRecruitingCourses() {
  const today = new Date()
  const courses = await prisma.course.findMany({
    where: {
      status: 'active',
      instructorId: { not: null },
      instructor: { is: { isActive: true } },
      schedules: {
        some: {
          status: 'scheduled',
          startDate: { gt: today }, // 시작일이 오늘 이후
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      category: true,
      instructor: true,
      schedules: {
        where: {
          status: 'scheduled',
          startDate: { gt: today },
        },
        orderBy: { startDate: 'asc' },
        take: 1,
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
      },
      _count: {
        select: { enrollments: true, reviews: true },
      },
    },
  })
  return courses.filter(c => c.schedules.length > 0) // 일정이 있는 것만
}

export default async function Home() {
  const courses = await getFeaturedCourses()
  const instructors = await getInstructorsWithCourses()
  const allSchedules = await getAllSchedules()
  const freeCourses = await getFreeCourses()
  const freeVideos = await getFreeVideos()
  const freeProducts = await getFreeProducts()
  const freeSlides = await getFreeSlides()
  const recruitingCourses = await getRecruitingCourses()

  // 무료 에셋 총 개수
  const totalFreeAssets = freeCourses.length + freeVideos.length + freeProducts.length + freeSlides.length
  return (
    <CustomerLayout>
      {/* Hero Section - Apple Style with Fun Animations */}
      <section className="relative hero-gradient-bg overflow-hidden min-h-screen flex items-center justify-center">
        {/* 배경 글로우 오브 */}
        <div className="hero-glow-orb w-96 h-96 bg-blue-500/30 top-1/4 -left-48" />
        <div className="hero-glow-orb w-80 h-80 bg-purple-500/20 bottom-1/4 -right-40" style={{ animationDelay: '2s' }} />
        <div className="hero-glow-orb w-64 h-64 bg-cyan-500/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '1s' }} />

        {/* 별 반짝임 효과 */}
        <div className="hero-star" style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
        <div className="hero-star" style={{ top: '25%', left: '85%', animationDelay: '0.5s' }} />
        <div className="hero-star" style={{ top: '60%', left: '5%', animationDelay: '1s' }} />
        <div className="hero-star" style={{ top: '70%', left: '90%', animationDelay: '1.5s' }} />
        <div className="hero-star" style={{ top: '40%', left: '15%', animationDelay: '0.3s' }} />
        <div className="hero-star" style={{ top: '80%', left: '75%', animationDelay: '0.8s' }} />
        <div className="hero-star" style={{ top: '20%', left: '60%', animationDelay: '1.2s' }} />
        <div className="hero-star" style={{ top: '85%', left: '25%', animationDelay: '0.6s' }} />

        {/* 플로팅 코드 블록 - 왼쪽 */}
        <div className="absolute left-4 sm:left-10 top-1/3 floating-code opacity-30 hidden sm:block">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <pre className="text-xs sm:text-sm text-green-400 font-mono">
{`const ai = new AI();
ai.learn(data);
ai.code();`}
            </pre>
          </div>
        </div>

        {/* 플로팅 코드 블록 - 오른쪽 */}
        <div className="absolute right-4 sm:right-10 bottom-1/3 floating-code opacity-30 hidden sm:block" style={{ animationDelay: '3s' }}>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <pre className="text-xs sm:text-sm text-cyan-400 font-mono">
{`function vibe() {
  return "코딩"
}`}
            </pre>
          </div>
        </div>

        {/* 물결 효과 링 */}
        <div className="hero-ripple w-32 h-32 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="hero-ripple w-48 h-48 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '1s' }} />
        <div className="hero-ripple w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-32 text-center z-10">
          {/* 메인 타이틀 */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold text-white tracking-tight leading-none mb-6 animate-[fadeInUp_1s_ease-out_forwards] hero-title-glow" style={{ opacity: 0 }}>
            {textConfig.hero.title}
          </h1>

          {/* 서브 타이틀 */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-400 font-light mb-12 animate-[fadeInUp_1s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.2s' }}>
            {textConfig.hero.subtitle}
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center animate-[fadeInUp_1s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.4s' }}>
            <Link
              href="/courses"
              className="hero-button-shine inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-black bg-white rounded-full hover:bg-gray-200 hover:scale-105 transition-all duration-300"
            >
              {textConfig.hero.cta1}
            </Link>
            <Link
              href="/courses?isFree=true"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border border-gray-600 rounded-full hover:border-white hover:bg-white/10 hover:scale-105 transition-all duration-300"
            >
              {textConfig.hero.cta2}
            </Link>
          </div>

          {/* 기술 태그 */}
          <div className="mt-16 flex flex-wrap justify-center gap-3 animate-[fadeInUp_1s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.6s' }}>
            {textConfig.hero.tags.map((tech, i) => (
              <span
                key={tech}
                className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-full hover:border-gray-500 hover:text-gray-300 transition-all cursor-default"
                style={{ animationDelay: `${0.8 + i * 0.1}s` }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 scroll-hint">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-gray-400 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* 강사 섹션 - 다크 스타일 */}
      {instructors.length > 0 && (
        <section className="relative hero-gradient-bg py-20 overflow-hidden">
          <div className="hero-glow-orb w-80 h-80 bg-purple-500/20 -top-40 -right-40" />
          <div className="hero-glow-orb w-64 h-64 bg-blue-500/15 bottom-0 -left-32" style={{ animationDelay: '1.5s' }} />
          <div className="hero-star" style={{ top: '15%', left: '8%', animationDelay: '0.3s' }} />
          <div className="hero-star" style={{ top: '25%', right: '12%', animationDelay: '0.9s' }} />
          <div className="hero-star" style={{ bottom: '20%', left: '5%', animationDelay: '1.5s' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="mb-8 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0 }}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow">{textConfig.sections.instructors}</h2>
              <p className="text-gray-400 mt-2 text-lg">{textConfig.sections.instructorsDesc}</p>
            </div>
            <div className="animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.2s' }}>
              <InstructorCarousel instructors={instructors} />
            </div>
          </div>
        </section>
      )}

      {/* 모집중 강의 섹션 - 다크 스타일 */}
      {recruitingCourses.length > 0 && (
        <section className="relative hero-gradient-bg py-20 overflow-hidden">
          <div className="hero-glow-orb w-72 h-72 bg-orange-500/20 -top-36 -left-36" />
          <div className="hero-glow-orb w-56 h-56 bg-red-500/15 bottom-0 -right-28" style={{ animationDelay: '2s' }} />
          <div className="hero-star" style={{ top: '10%', right: '15%', animationDelay: '0.4s' }} />
          <div className="hero-star" style={{ bottom: '25%', left: '10%', animationDelay: '1.1s' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0 }}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🔥</span>
                  <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full animate-pulse">
                    {recruitingCourses.length}개 모집중
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow">{textConfig.sections.recruiting}</h2>
                <p className="text-gray-400 mt-2 text-lg">{textConfig.sections.recruitingDesc}</p>
              </div>
              <Link href="/courses" className="hero-button-shine inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 hover:scale-105 transition-all font-medium">
                {textConfig.common.viewAll}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.2s' }}>
              {recruitingCourses.map((course, index) => {
                const schedule = course.schedules[0]
                const daysUntil = Math.ceil((new Date(schedule.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="group block"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/50 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20">
                      {/* 썸네일 */}
                      <div className="relative aspect-[16/10] bg-gray-900 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <>
                            <div className="absolute inset-0">
                              <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover blur-xl scale-110 opacity-30" />
                            </div>
                            <img src={course.thumbnailUrl} alt={course.title} className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}

                        {/* 상단 뱃지 */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`px-3 py-1.5 ${daysUntil <= 7 ? 'bg-red-500' : 'bg-orange-500'} text-white text-xs font-bold rounded-full shadow-lg`}>
                            D-{daysUntil}
                          </span>
                          {course.isFree && (
                            <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">무료</span>
                          )}
                        </div>

                        {/* 가격 */}
                        <div className="absolute bottom-3 right-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${course.isFree ? 'bg-emerald-500 text-white' : 'bg-white text-gray-900'}`}>
                            {course.isFree ? 'FREE' : `${course.price.toLocaleString()}원`}
                          </span>
                        </div>
                      </div>

                      {/* 정보 */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-400 bg-white/10 px-2.5 py-1 rounded-full">{course.category.name}</span>
                          <span className="text-xs text-orange-400 font-medium">{schedule.cohort}기</span>
                        </div>
                        <h3 className="font-bold text-white leading-snug line-clamp-2 mb-4 group-hover:text-orange-400 transition-colors">{course.title}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {course.instructor?.imageUrl && (
                              <img src={course.instructor.imageUrl} alt={course.instructor.name} className="w-7 h-7 rounded-full object-cover border-2 border-white/20" />
                            )}
                            <span className="text-sm text-gray-300">{course.instructor?.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(schedule.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 시작
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* 무료 에셋 섹션 - 다크 스타일 */}
      {totalFreeAssets > 0 && (
        <section className="relative hero-gradient-bg py-20 overflow-hidden">
          <div className="hero-glow-orb w-80 h-80 bg-emerald-500/20 -top-40 -left-40" />
          <div className="hero-glow-orb w-64 h-64 bg-cyan-500/15 bottom-0 -right-32" style={{ animationDelay: '1.5s' }} />
          <div className="hero-star" style={{ top: '12%', left: '20%', animationDelay: '0.6s' }} />
          <div className="hero-star" style={{ bottom: '18%', right: '10%', animationDelay: '1.3s' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            {/* 섹션 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0 }}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🎁</span>
                  <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full animate-pulse">
                    {totalFreeAssets}개 무료
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow">{textConfig.sections.free}</h2>
                <p className="text-gray-400 mt-2 text-lg">{textConfig.sections.freeDesc}</p>
              </div>
            </div>

          {/* 무료 교육 */}
          {freeCourses.length > 0 && (
            <div className="mb-10 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                  무료 교육
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">{freeCourses.length}</span>
                </h3>
                <Link href="/courses?isFree=true" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors">
                  전체보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {freeCourses.map((course, index) => {
                  const today = new Date()
                  const nextSchedule = course.schedules.find(schedule =>
                    new Date(schedule.endDate) >= today
                  ) || course.schedules[0]

                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group block"
                    >
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20">
                        <div className="relative aspect-[16/10] bg-gray-900 overflow-hidden">
                          {course.thumbnailUrl ? (
                            <>
                              <div className="absolute inset-0">
                                <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover blur-xl scale-110 opacity-30" />
                              </div>
                              <img src={course.thumbnailUrl} alt={course.title} className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">무료</span>
                          </div>
                          <div className="absolute bottom-3 right-3">
                            <span className="px-4 py-2 rounded-full text-sm font-bold bg-emerald-500 text-white shadow-lg">FREE</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-400 bg-white/10 px-2.5 py-1 rounded-full">{course.category.name}</span>
                          </div>
                          <h4 className="font-bold text-white leading-snug line-clamp-2 mb-3 group-hover:text-emerald-400 transition-colors">{course.title}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {course.instructor?.imageUrl && (
                                <img src={course.instructor.imageUrl} alt={course.instructor.name} className="w-6 h-6 rounded-full object-cover border-2 border-white/20" />
                              )}
                              <span className="text-sm text-gray-300">{course.instructor?.name}</span>
                            </div>
                            {nextSchedule && (
                              <span className="text-xs text-gray-500">
                                {new Date(nextSchedule.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* 무료 영상강의 */}
          {freeVideos.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </span>
                  무료 영상강의
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{freeVideos.length}</span>
                </h3>
                <Link href="/contents?type=video&isFree=true" className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm">
                  전체보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {freeVideos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/contents/video/${video.id}`}
                    className="group block"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-200">
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">영상</span>
                          <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">무료</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-red-600 transition-colors">{video.title}</h4>
                        <div className="flex items-center justify-between">
                          {video.instructor && (
                            <div className="flex items-center gap-2">
                              {video.instructor.imageUrl ? (
                                <img src={video.instructor.imageUrl} alt={video.instructor.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                  {video.instructor.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm text-gray-600">{video.instructor.name}</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500">{new Date(video.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 무료 전자책/프로그램 */}
          {freeProducts.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </span>
                  무료 전자책/프로그램
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">{freeProducts.length}</span>
                </h3>
                <Link href="/contents?type=ebook&isFree=true" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm">
                  전체보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {freeProducts.map((product) => {
                  const isEbook = product.type === 'ebook'
                  return (
                    <Link
                      key={product.id}
                      href={`/contents/product/${product.id}`}
                      className="group block"
                    >
                      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
                        <div className={`${isEbook ? 'aspect-[3/4]' : 'aspect-video'} bg-gray-100 relative overflow-hidden`}>
                          {product.thumbnailUrl ? (
                            <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              {isEbook ? (
                                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              ) : (
                                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-2.5 py-1 ${isEbook ? 'bg-indigo-500' : 'bg-purple-500'} text-white text-xs font-bold rounded-lg`}>
                              {isEbook ? '전자책' : '프로그램'}
                            </span>
                            <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">무료</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-purple-600 transition-colors">{product.title}</h4>
                          <div className="flex items-center justify-between">
                            {product.instructor && (
                              <div className="flex items-center gap-2">
                                {product.instructor.imageUrl ? (
                                  <img src={product.instructor.imageUrl} alt={product.instructor.name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                    {product.instructor.name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-sm text-gray-600">{product.instructor.name}</span>
                              </div>
                            )}
                            <span className="text-xs text-gray-500">{new Date(product.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* 무료 강의자료 */}
          {freeSlides.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </span>
                  무료 강의자료
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{freeSlides.length}</span>
                </h3>
                <Link href="/contents?type=slides&isFree=true" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm">
                  전체보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {freeSlides.map((slide) => (
                  <a
                    key={slide.id}
                    href={slide.externalUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all duration-200">
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        {slide.thumbnailUrl ? (
                          <img src={slide.thumbnailUrl} alt={slide.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg">강의자료</span>
                          <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">무료</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-amber-600 transition-colors">{slide.title}</h4>
                        <div className="flex items-center justify-between">
                          {slide.instructor && (
                            <div className="flex items-center gap-2">
                              {slide.instructor.imageUrl ? (
                                <img src={slide.instructor.imageUrl} alt={slide.instructor.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                  {slide.instructor.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm text-gray-600">{slide.instructor.name}</span>
                            </div>
                          )}
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            바로보기
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          </div>
        </section>
      )}

      {/* 전체 강의 일정 달력 - 다크 스타일 */}
      {allSchedules.length > 0 && (
        <section className="relative hero-gradient-bg py-20 overflow-hidden">
          <div className="hero-glow-orb w-72 h-72 bg-blue-500/20 -top-36 -right-36" />
          <div className="hero-glow-orb w-56 h-56 bg-indigo-500/15 bottom-0 -left-28" style={{ animationDelay: '2s' }} />
          <div className="hero-star" style={{ top: '15%', left: '12%', animationDelay: '0.5s' }} />
          <div className="hero-star" style={{ bottom: '20%', right: '8%', animationDelay: '1.2s' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="mb-10 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0 }}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow mb-3">
                {textConfig.sections.schedule}
              </h2>
              <p className="text-lg text-gray-400">
                {textConfig.sections.scheduleDesc}
              </p>
            </div>
            <div className="animate-[fadeInUp_0.8s_ease-out_forwards] bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10" style={{ opacity: 0, animationDelay: '0.2s' }}>
              <CourseCalendar schedules={allSchedules} showCourseTitle={true} />
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses Section - 다크 스타일 */}
      <section className="relative hero-gradient-bg py-20 overflow-hidden">
        <div className="hero-glow-orb w-80 h-80 bg-violet-500/20 -top-40 -left-40" />
        <div className="hero-glow-orb w-64 h-64 bg-pink-500/15 bottom-0 -right-32" style={{ animationDelay: '1.5s' }} />
        <div className="hero-star" style={{ top: '10%', right: '18%', animationDelay: '0.3s' }} />
        <div className="hero-star" style={{ bottom: '25%', left: '8%', animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="mb-10 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0 }}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow mb-3">
              {textConfig.sections.popular}
            </h2>
            <p className="text-lg text-gray-400">
              {textConfig.sections.popularDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.2s' }}>
            {courses.length === 0 ? (
              <div className="text-center py-20 col-span-full">
                <p className="text-gray-400">등록된 강의가 없습니다</p>
              </div>
            ) : (
              courses.map((course) => {
                const today = new Date()
                const nextSchedule = course.schedules.find(schedule =>
                  new Date(schedule.endDate) >= today
                ) || course.schedules[0]
                const isRecruiting = nextSchedule && new Date(nextSchedule.startDate) > today
                const courseColor = getCourseColor(course.id)

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="group block"
                  >
                    {/* 카드 컨테이너 - 다크 스타일 */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10">
                      {/* 썸네일 영역 - 블러 배경 + 전체 이미지 */}
                      <div className="relative aspect-[4/3] sm:aspect-square bg-gray-100 overflow-hidden thumbnail-animated">
                        {course.thumbnailUrl ? (
                          <>
                            {/* 블러 배경 */}
                            <div className="absolute inset-0">
                              <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover blur-xl scale-110 opacity-60" />
                            </div>
                            {/* 메인 이미지 - 잘림 없이 전체 표시 */}
                            <img src={course.thumbnailUrl} alt={course.title} className="relative w-full h-full object-contain drop-shadow-lg" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}

                        {/* 뱃지 */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1.5 z-10">
                          {(course as any).courseType === 'offline' ? (
                            <span className="bg-green-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              오프라인
                            </span>
                          ) : (
                            <span className="bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              온라인
                            </span>
                          )}
                          {course.isFree && (
                            <span className="bg-green-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow">무료</span>
                          )}
                          {!course.isFree && isRecruiting && nextSchedule && (
                            <span className={`${courseColor.bg} text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow`}>
                              {nextSchedule.cohort}기 모집중
                            </span>
                          )}
                        </div>

                        {/* 로고 */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                          <img src="/uploads/image/logo/print_transparent.svg" alt="바이브 클래스" className="h-5 sm:h-6 w-auto opacity-90" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                        </div>

                        {/* 가격/강사 오버레이 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
                          <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                              {course.instructor?.imageUrl && (
                                <img src={course.instructor.imageUrl} alt={course.instructor.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white object-cover" />
                              )}
                              <span className="text-xs sm:text-sm font-medium">{course.instructor?.name || '강사'}</span>
                            </div>
                            <span className="text-sm sm:text-lg font-bold">{course.isFree ? '무료' : `${course.price.toLocaleString()}원`}</span>
                          </div>
                        </div>
                      </div>

                      {/* 정보 영역 - 썸네일과 연결된 하단 (고정 높이) */}
                      <div className="p-3 sm:p-4 bg-white h-[110px] sm:h-[120px] flex flex-col">
                        <div className="flex items-center gap-2 mb-1.5 flex-shrink-0">
                          <span className={`text-[10px] sm:text-xs ${courseColor.bg} text-white px-1.5 py-0.5 rounded font-medium`}>{course.category.name}</span>
                          {course.isFree && (
                            <span className="text-[10px] sm:text-xs text-green-600 font-medium">1일 특강</span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-tight line-clamp-2 flex-grow">
                          {course.title}
                        </h3>
                        {/* 날짜 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 mt-auto flex-shrink-0">
                          {nextSchedule ? (
                            <>
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{new Date(nextSchedule.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                                <span className="text-gray-300">~</span>
                                <span>{new Date(nextSchedule.endDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              {(() => {
                                const daysUntil = Math.ceil((new Date(nextSchedule.startDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                if (daysUntil > 0) {
                                  return <span className="text-orange-600 font-semibold">{daysUntil}일 후</span>
                                } else if (new Date(nextSchedule.endDate) >= today) {
                                  return <span className="text-green-600 font-semibold">진행중</span>
                                } else {
                                  return <span className="text-gray-400 font-medium">종료</span>
                                }
                              })()}
                            </>
                          ) : (
                            <>
                              <span>{new Date(course.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <span className="text-gray-400">일정 준비중</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          <div className="mt-12 text-center animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ opacity: 0, animationDelay: '0.4s' }}>
            <Link href="/courses" className="hero-button-shine inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-black bg-white rounded-full hover:bg-gray-200 hover:scale-105 transition-all duration-300">
              모든 강의 보기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </CustomerLayout>
  )
}
