import CustomerLayout from '@/components/customer/CustomerLayout'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ type?: string }> }): Promise<Metadata> {
  const params = await searchParams
  const type = params.type

  const typeTitle = type === 'online' ? '온라인 교육' : type === 'offline' ? '오프라인 교육' : '강의'
  const typeDesc = type === 'online'
    ? '실시간 Zoom 화상 강의로 어디서든 참여하세요.'
    : type === 'offline'
    ? '현장에서 직접 만나는 오프라인 교육 프로그램.'
    : '전문 강사진과 함께하는 온라인/오프라인 교육 프로그램.'

  return {
    title: `${typeTitle} | 바이브 클래스`,
    description: `${typeDesc} AI, 자동화, 프로그래밍 등 다양한 강의를 만나보세요.`,
    keywords: 'AI 강의, 온라인 교육, 오프라인 교육, 프로그래밍 강의, 자동화 교육, Zoom 수업, 실시간 강의',
    openGraph: {
      title: `${typeTitle} | 바이브 클래스`,
      description: typeDesc,
      type: 'website',
      locale: 'ko_KR',
      url: 'https://vibeclass.kr/courses',
    },
  }
}

// 페이지 캐싱 비활성화 - 항상 최신 데이터 표시
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { order: 'asc' },
  })
}

async function getCourses(categoryId?: string, courseType?: string, isFree?: boolean) {
  const where: any = {
    status: 'active',
    instructorId: { not: null }, // 강사가 있는 강의만
    instructor: { is: { isActive: true } }, // 활성화된 강사만
  }

  if (categoryId) {
    where.categoryId = parseInt(categoryId)
  }

  // 온라인/오프라인 필터
  if (courseType === 'online' || courseType === 'offline') {
    where.courseType = courseType
  }

  // 무료 필터
  if (isFree) {
    where.isFree = true
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      instructor: true,
      schedules: {
        where: {
          status: { in: ['scheduled', 'ongoing'] },
        },
        orderBy: { cohort: 'desc' },
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          enrollments: true, // 누적 수강생
          reviews: {
            where: { isApproved: true },
          },
        },
      },
    },
  })

  return courses
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string; isFree?: string }>
}) {
  const params = await searchParams
  const categories = await getCategories()
  const courses = await getCourses(params.category, params.type, params.isFree === 'true')
  const courseType = params.type
  const isFreeFilter = params.isFree === 'true'

  return (
    <CustomerLayout>
      <section className="relative hero-gradient-bg min-h-screen overflow-hidden">
        {/* 배경 글로우 오브 */}
        <div className="hero-glow-orb w-80 h-80 bg-purple-500/20 -top-40 -right-40" />
        <div className="hero-glow-orb w-64 h-64 bg-blue-500/15 bottom-0 -left-32" style={{ animationDelay: '1.5s' }} />
        <div className="hero-glow-orb w-48 h-48 bg-indigo-500/10 top-1/2 right-1/4" style={{ animationDelay: '3s' }} />

        {/* 별 반짝임 효과 */}
        <div className="hero-star" style={{ top: '10%', left: '5%', animationDelay: '0s' }} />
        <div className="hero-star" style={{ top: '20%', right: '10%', animationDelay: '0.5s' }} />
        <div className="hero-star" style={{ top: '60%', left: '15%', animationDelay: '1s' }} />
        <div className="hero-star" style={{ top: '80%', right: '20%', animationDelay: '1.5s' }} />
        <div className="hero-star" style={{ top: '40%', left: '70%', animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight hero-title-glow">
              {isFreeFilter ? '무료 강의' : courseType === 'online' ? '온라인 강의' : courseType === 'offline' ? '오프라인 강의' : '강의'}
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              {isFreeFilter && '부담 없이 시작할 수 있는 무료 강의 프로그램입니다.'}
              {!isFreeFilter && courseType === 'online' && '실시간 Zoom 화상 강의로 어디서든 참여할 수 있습니다.'}
              {!isFreeFilter && courseType === 'offline' && '현장에서 직접 만나는 대면 강의 프로그램입니다.'}
              {!isFreeFilter && !courseType && 'AI 시대를 위한 실전 강의를 만나보세요.'}
            </p>
          </div>

          {/* 필터 영역 */}
          <div className="mb-8">
            {/* 온라인/오프라인/무료 타입 필터 */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Link
                href="/courses"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  !courseType && !isFreeFilter
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                전체
              </Link>
              <Link
                href="/courses?isFree=true"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  isFreeFilter
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                무료
              </Link>
              <Link
                href="/courses?type=online"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  courseType === 'online'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                온라인
              </Link>
              <Link
                href="/courses?type=offline"
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  courseType === 'offline'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                오프라인
              </Link>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={courseType ? `/courses?type=${courseType}` : '/courses'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !params.category
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                전체
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={courseType ? `/courses?type=${courseType}&category=${category.id}` : `/courses?category=${category.id}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    params.category === category.id.toString()
                      ? 'bg-white/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* 교육 목록 */}
          {courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">등록된 강의가 없습니다</h3>
              <p className="text-gray-400">
                다른 카테고리를 선택하거나 나중에 다시 확인해주세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => {
                // 미래 시작일을 가진 스케줄 찾기 (모집중인 기수)
                const recruitingSchedule = course.schedules.find(s => new Date(s.startDate) > new Date())
                const isRecruiting = !!recruitingSchedule
                const avgRating = course.reviews.length > 0
                  ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
                  : 0
                const reviewCount = course._count.reviews

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="group block"
                  >
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300">
                      {/* 썸네일 영역 */}
                      <div className="relative aspect-[4/3] bg-gray-900/50 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <>
                            <div className="absolute inset-0">
                              <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover blur-xl scale-110 opacity-40" />
                            </div>
                            <img src={course.thumbnailUrl} alt={course.title} className="relative w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}

                        {/* 뱃지 */}
                        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                          {(course as any).courseType === 'offline' ? (
                            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              오프라인
                            </span>
                          ) : (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              온라인
                            </span>
                          )}
                          {course.isFree && (
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">무료</span>
                          )}
                          {!course.isFree && isRecruiting && recruitingSchedule && (
                            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                              {recruitingSchedule.cohort}기 모집중
                            </span>
                          )}
                        </div>

                        {/* 가격/강사 오버레이 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
                          <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                              {course.instructor?.imageUrl && (
                                <img src={course.instructor.imageUrl} alt={course.instructor.name} className="w-6 h-6 rounded-full border border-white/50 object-cover" />
                              )}
                              <span className="text-sm font-medium">{course.instructor?.name || '강사'}</span>
                            </div>
                            <span className="text-lg font-bold">{course.isFree ? '무료' : `${course.price.toLocaleString()}원`}</span>
                          </div>
                        </div>
                      </div>

                      {/* 정보 영역 */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded">{course.category.name}</span>
                          {reviewCount > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-yellow-400">★</span>
                              <span className="text-gray-300">{avgRating.toFixed(1)}</span>
                              <span className="text-gray-500">({reviewCount})</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-white leading-tight line-clamp-2 mb-3 group-hover:text-purple-300 transition-colors">
                          {course.title}
                        </h3>
                        {/* 날짜 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                          {recruitingSchedule ? (
                            <>
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{new Date(recruitingSchedule.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                                <span className="text-gray-600">~</span>
                                <span>{new Date(recruitingSchedule.endDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              {(() => {
                                const today = new Date()
                                const daysUntil = Math.ceil((new Date(recruitingSchedule.startDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                if (daysUntil > 0) {
                                  return <span className="text-purple-400 font-semibold">{daysUntil}일 후</span>
                                } else if (new Date(recruitingSchedule.endDate) >= today) {
                                  return <span className="text-green-400 font-semibold">진행중</span>
                                } else {
                                  return <span className="text-gray-500 font-medium">종료</span>
                                }
                              })()}
                            </>
                          ) : (
                            <>
                              <span>{new Date(course.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <span className="text-gray-500">일정 준비중</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </CustomerLayout>
  )
}
