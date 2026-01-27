import CustomerLayout from '@/components/customer/CustomerLayout'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import CourseCalendar from '@/components/calendar/CourseCalendar'
import type { Metadata } from 'next'

// 페이지 캐싱 비활성화 - 항상 최신 데이터 표시
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const instructorId = parseInt(id)
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: {
      name: true,
      expertise: true,
      imageUrl: true,
      bio: true,
    },
  })

  if (!instructor) {
    return {
      title: '강사를 찾을 수 없습니다 | 바이브 클래스',
    }
  }

  // HTML 태그 제거
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()
  const description = instructor.bio
    ? stripHtml(instructor.bio).substring(0, 150) + (stripHtml(instructor.bio).length > 150 ? '...' : '')
    : `${instructor.name} 강사의 프로필. ${instructor.expertise || '전문 강사'}와 함께하는 온라인 교육.`

  return {
    title: `${instructor.name} 강사 | 바이브 클래스`,
    description,
    keywords: `${instructor.name}, 강사, AI 교육, 온라인 강의, ${instructor.expertise || ''}`,
    openGraph: {
      title: `${instructor.name} 강사 | 바이브 클래스`,
      description,
      type: 'profile',
      locale: 'ko_KR',
      url: `https://vibeclass.kr/instructors/${instructorId}`,
      images: instructor.imageUrl ? [
        {
          url: instructor.imageUrl,
          width: 400,
          height: 400,
          alt: instructor.name,
        },
      ] : [],
    },
  }
}

async function getInstructor(id: number) {
  const instructor = await prisma.instructor.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          instructorApplication: {
            select: {
              kakaoUrl: true,
            },
          },
        },
      },
      courses: {
        where: { status: 'active' },
        include: {
          category: true,
          schedules: {
            where: {
              status: { in: ['scheduled', 'ongoing'] },
            },
            include: {
              sessions: {
                orderBy: { sessionDate: 'asc' },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
      },
    },
  })

  // 비활성화된 강사는 접근 불가
  if (instructor && instructor.isActive === false) {
    return null
  }

  return instructor
}

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const instructorId = parseInt(id)
  const instructor = await getInstructor(instructorId)

  if (!instructor) {
    notFound()
  }

  // 모든 강의의 스케줄을 모아서 달력에 표시
  const allSchedules = instructor.courses.flatMap((course) =>
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
      instructor: {
        name: instructor.name,
        imageUrl: instructor.imageUrl,
      },
    }))
  )

  return (
    <CustomerLayout>
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* 강사 프로필 */}
          <div className="mb-16">
            <div className="flex items-start gap-8">
              {instructor.imageUrl ? (
                <img
                  src={instructor.imageUrl}
                  alt={instructor.name}
                  className="w-32 h-32 rounded-full object-cover flex-shrink-0 border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center text-white text-5xl font-semibold flex-shrink-0">
                  {instructor.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-semibold text-gray-900 mb-2">
                  {instructor.name}
                </h1>
                {instructor.expertise && (
                  <p className="text-xl text-gray-600 mb-4">
                    {instructor.expertise}
                  </p>
                )}
                {instructor.bio && (
                  <div
                    className="text-gray-600 leading-relaxed max-w-3xl prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: instructor.bio }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 강의 일정 달력 */}
          {allSchedules.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-semibold text-gray-900 mb-8">
                강의 일정
              </h2>
              <CourseCalendar schedules={allSchedules} />
            </div>
          )}

          {/* 강의 목록 */}
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8">
              {instructor.name} 강사의 강의
            </h2>
            {instructor.courses.length === 0 ? (
              <p className="text-gray-500">등록된 강의가 없습니다</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {instructor.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="group elegant-hover block"
                  >
                    <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg
                            className="h-12 w-12 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Course Info Overlay - Always Visible */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {instructor.imageUrl && (
                                <img
                                  src={instructor.imageUrl}
                                  alt={instructor.name}
                                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                                />
                              )}
                              <span className="text-sm font-medium">{instructor.name}</span>
                            </div>
                            <span className="text-sm bg-white/20 px-2 py-1 rounded">{course.category.name}</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">
                              {course.price.toLocaleString()}원
                            </div>
                            <div className="flex items-center gap-1 text-white/90 text-xs">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {course._count.enrollments}/{course.capacity}명
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        수강생 {course._count.enrollments}명
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 오픈채팅방 */}
          {instructor.user?.instructorApplication?.kakaoUrl && (
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-8">
                강사에게 문의하기
              </h2>
              <div className="max-w-2xl">
                <div className="bg-white border border-gray-200 rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
                      <svg className="w-10 h-10 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3C6.5 3 2 6.58 2 11c0 2.89 1.86 5.44 4.64 7.03-.18.64-.67 2.38-.77 2.75-.13.5.18.5.38.36.16-.11 2.48-1.67 3.44-2.32.75.14 1.54.21 2.31.21 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      카카오톡 오픈채팅방
                    </h3>
                    <p className="text-gray-600 text-sm">
                      강사에게 궁금한 점을 오픈채팅방에서 문의하세요
                    </p>
                  </div>

                  <a
                    href={instructor.user.instructorApplication.kakaoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-4 rounded-xl transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.5 3 2 6.58 2 11c0 2.89 1.86 5.44 4.64 7.03-.18.64-.67 2.38-.77 2.75-.13.5.18.5.38.36.16-.11 2.48-1.67 3.44-2.32.75.14 1.54.21 2.31.21 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
                    </svg>
                    강사 오픈채팅방 참여하기
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </CustomerLayout>
  )
}
