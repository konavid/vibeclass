import CustomerLayout from '@/components/customer/CustomerLayout'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import CourseDetailTabs from '@/components/course/CourseDetailTabs'
import InstructorQnaButton from '@/components/course/InstructorQnaButton'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Section from '@/components/ui/Section'
import CourseShareButton from '@/components/course/CourseShareButton'
import type { Metadata } from 'next'

// 페이지 캐싱 비활성화 - 항상 최신 데이터 표시
export const dynamic = 'force-dynamic'
export const revalidate = 0

// HTML 태그 제거 및 텍스트 정제 함수
function stripHtml(html: string): string {
  if (!html) return ''
  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, ' ')
  // HTML 엔티티 디코딩
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  // 연속 공백 제거
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

// SEO용 description 생성 (최대 160자)
function createSeoDescription(text: string, maxLength: number = 155): string {
  const cleaned = stripHtml(text)
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength - 3) + '...'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const courseId = parseInt(id)
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      instructor: true,
    },
  })

  if (!course) {
    return {
      title: '강의를 찾을 수 없습니다 | 바이브클래스',
      description: 'AI 수익화 교육 플랫폼 바이브클래스',
    }
  }

  // HTML 태그 제거한 description 생성
  const rawDescription = course.description || ''
  const cleanDescription = createSeoDescription(rawDescription)
  const fallbackDescription = `${course.instructor?.name || '전문 강사'}의 ${course.category.name} 강의. AI를 활용한 수익화 방법을 배워보세요.`
  const seoDescription = cleanDescription || fallbackDescription

  // 메인 타이틀 (브랜드 강조)
  const pageTitle = `${course.title} - AI 수익화 강의`
  const fullTitle = `${pageTitle} | 바이브클래스`

  // 키워드 생성
  const keywords = [
    course.title,
    course.category.name,
    'AI 수익화',
    'AI 강의',
    'AI 부업',
    'AI 자동화',
    '온라인 교육',
    course.instructor?.name,
    '바이브클래스'
  ].filter(Boolean).join(', ')

  return {
    title: fullTitle,
    description: seoDescription,
    keywords,
    authors: course.instructor ? [{ name: course.instructor.name }] : undefined,
    openGraph: {
      title: pageTitle,
      description: seoDescription,
      type: 'article',
      locale: 'ko_KR',
      siteName: '바이브클래스',
      url: `https://vibeclass.kr/courses/${courseId}`,
      images: course.thumbnailUrl ? [
        {
          url: course.thumbnailUrl.startsWith('http') ? course.thumbnailUrl : `https://vibeclass.kr${course.thumbnailUrl}`,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ] : [
        {
          url: 'https://vibeclass.kr/og-image.png',
          width: 1200,
          height: 630,
          alt: '바이브클래스 - AI 수익화 교육',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: seoDescription,
      images: course.thumbnailUrl ? [course.thumbnailUrl.startsWith('http') ? course.thumbnailUrl : `https://vibeclass.kr${course.thumbnailUrl}`] : ['https://vibeclass.kr/og-image.png'],
    },
    alternates: {
      canonical: `https://vibeclass.kr/courses/${courseId}`,
    },
  }
}

// 강의별 고유 색상 팔레트
const courseColors = [
  { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', lightBg: 'bg-blue-50', hover: 'hover:bg-blue-700' },
  { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', lightBg: 'bg-purple-50', hover: 'hover:bg-purple-700' },
  { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', lightBg: 'bg-green-50', hover: 'hover:bg-green-700' },
  { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600', lightBg: 'bg-orange-50', hover: 'hover:bg-orange-700' },
  { bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-600', lightBg: 'bg-pink-50', hover: 'hover:bg-pink-700' },
  { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', lightBg: 'bg-indigo-50', hover: 'hover:bg-indigo-700' },
  { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-600', lightBg: 'bg-teal-50', hover: 'hover:bg-teal-700' },
  { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', lightBg: 'bg-rose-50', hover: 'hover:bg-rose-700' },
]

// 강의 ID로 색상 가져오기
const getCourseColor = (courseId: number) => {
  return courseColors[courseId % courseColors.length]
}

async function getCourse(id: number) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      instructor: {
        include: {
          user: {
            include: {
              instructorApplication: {
                select: {
                  youtubeUrl: true,
                  instagramUrl: true,
                  kakaoUrl: true
                }
              }
            }
          }
        }
      },
      schedules: {
        where: {
          status: { in: ['scheduled', 'ongoing'] },
        },
        select: {
          id: true,
          cohort: true,
          startDate: true,
          endDate: true,
          status: true,
          meetLink: true,
          kakaoTalkLink: true,
          sessions: {
            orderBy: { sessionDate: 'asc' },
          },
        },
        orderBy: { cohort: 'desc' },
        take: 5,
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              name: true,
            },
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
  })

  if (!course) {
    return null
  }

  // 비활성화된 강사의 강의는 접근 불가
  if (course.instructor && course.instructor.isActive === false) {
    return null
  }

  // 평균 평점 계산
  const avgRating = await prisma.review.aggregate({
    where: {
      courseId: id,
      isApproved: true,
    },
    _avg: {
      rating: true,
    },
  })

  return {
    ...course,
    avgRating: avgRating._avg.rating || 0,
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const courseId = parseInt(id)
  const course = await getCourse(courseId)

  if (!course) {
    notFound()
  }

  // 현재 사용자가 후기를 작성할 수 있는지 확인
  const session = await getServerSession(authOptions)
  let canWriteReview = false

  if (session) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: parseInt(session.user.id),
        courseId: courseId,
        status: {
          in: ['confirmed', 'active', 'completed']
        }
      },
    })

    // 수강 중이거나 완료했고, 아직 후기를 작성하지 않았으면 작성 가능
    if (enrollment) {
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: parseInt(session.user.id),
          courseId: courseId,
        },
      })
      canWriteReview = !existingReview
    }
  }

  // 스케줄 데이터를 달력 컴포넌트에 맞게 변환
  const calendarSchedules = course.schedules.map((schedule) => ({
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

  // 강의 색상 가져오기
  const courseColor = getCourseColor(course.id)

  return (
    <CustomerLayout>
      <div className="bg-white min-h-screen">
        <Section background="white" padding="md">
          {/* 유튜브 영상 섹션 */}
          {course.youtubeUrls && Array.isArray(course.youtubeUrls) && course.youtubeUrls.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">참조 영상</h2>
              <div className={`grid gap-4 ${course.youtubeUrls.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2'}`}>
                {(course.youtubeUrls as string[]).map((url: string, index: number) => {
                  // YouTube URL에서 video ID 추출
                  let videoId = ''
                  try {
                    if (url.includes('youtu.be/')) {
                      videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
                    } else if (url.includes('youtube.com/watch')) {
                      const urlObj = new URL(url)
                      videoId = urlObj.searchParams.get('v') || ''
                    } else if (url.includes('youtube.com/embed/')) {
                      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || ''
                    }
                  } catch (e) {
                    console.error('Invalid YouTube URL:', url)
                  }

                  if (!videoId) return null

                  return (
                    <div key={index} className="aspect-video rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`참조 영상 ${index + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Breadcrumb */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-3 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  홈
                </Link>
              </li>
              <li>
                <span className="text-gray-400">›</span>
              </li>
              <li>
                <Link href="/courses" className="text-gray-600 hover:text-gray-900 transition-colors">
                  교육 과정
                </Link>
              </li>
              <li>
                <span className="text-gray-400">›</span>
              </li>
              <li className="text-gray-900 font-medium">{course.title}</li>
            </ol>
          </nav>

          {/* 모바일 상단 버튼들 */}
          <div className="lg:hidden space-y-3 mb-6">
            {/* 모바일 수강신청 버튼 */}
            {course.schedules.some((s: any) => s.status === 'scheduled') && (
              <Link href={`/courses/${course.id}/enroll`} className="block">
                <button className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2">
                  {course.isFree ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      무료로 강의 듣기
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      수강 신청하기
                    </>
                  )}
                </button>
              </Link>
            )}

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 교육 정보 */}
            <div className="lg:col-span-2">
              {/* 썸네일 */}
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg
                      className="h-20 w-20 text-gray-300"
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
              </div>

              {/* 제목 및 기본 정보 */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="primary">{course.category.name}</Badge>
                  </div>
                  <CourseShareButton courseId={course.id} courseTitle={course.title} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  {course.title}
                </h1>
                {course.avgRating > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-gray-900 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium text-gray-900">{course.avgRating.toFixed(1)}</span>
                    <span className="ml-1">({course._count.reviews})</span>
                  </div>
                )}
              </div>

              {/* 강사 정보 */}
              {course.instructor && (
                <div className="mb-8">
                  <Link href={`/instructors/${course.instructor.id}`}>
                    <Card hover padding="lg">
                    <div className="flex items-start gap-4">
                      {course.instructor.imageUrl ? (
                        <img
                          src={course.instructor.imageUrl}
                          alt={course.instructor.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                          {course.instructor.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {course.instructor.name}
                          </h3>
                          <span className="text-sm text-gray-500">강사</span>
                        </div>
                        {course.instructor.expertise && (
                          <p className="text-sm text-gray-600 mb-2">
                            {course.instructor.expertise}
                          </p>
                        )}
                        {course.instructor.bio && (
                          <div
                            className="text-sm text-gray-600 line-clamp-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: course.instructor.bio }}
                          />
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    </Card>
                  </Link>

                  {/* Q&A 버튼 */}
                  <InstructorQnaButton instructorName={course.instructor.name} />

                  {/* 강사 오픈채팅방 버튼 */}
                  {course.instructor.user?.instructorApplication?.kakaoUrl && (
                    <a
                      href={course.instructor.user.instructorApplication.kakaoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z"/>
                      </svg>
                      강사 오픈채팅방 참여하기
                    </a>
                  )}
                </div>
              )}

              {/* 오프라인 강의 장소 정보 */}
              {course.courseType === 'offline' && course.location && (
                <div className="mb-8">
                  <Card padding="lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="gray">오프라인</Badge>
                          <h3 className="text-lg font-semibold text-gray-900">{course.location}</h3>
                        </div>
                        {course.locationAddress && (
                          <p className="text-sm text-gray-600 mb-2">{course.locationAddress}</p>
                        )}
                        {course.locationNote && (
                          <p className="text-sm text-gray-500 whitespace-pre-wrap">{course.locationNote}</p>
                        )}
                      </div>
                    </div>
                    {/* 지도 표시 */}
                    {course.locationMapUrl && course.locationMapUrl.includes('<iframe') && (
                      <div className="mt-4 rounded-lg overflow-hidden border border-gray-200" dangerouslySetInnerHTML={{ __html: course.locationMapUrl }} />
                    )}
                    {course.locationMapUrl && !course.locationMapUrl.includes('<iframe') && (
                      <a
                        href={course.locationMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        지도에서 보기
                      </a>
                    )}
                  </Card>
                </div>
              )}

              {/* 탭 콘텐츠 */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <CourseDetailTabs
                  schedules={calendarSchedules}
                  description={course.description}
                  curriculum={course.curriculum}
                  isFree={course.isFree}
                  courseId={course.id}
                  reviews={course.reviews}
                  avgRating={course.avgRating}
                  canWriteReview={canWriteReview}
                  instructor={course.instructor ? {
                    id: course.instructor.id,
                    name: course.instructor.name,
                    imageUrl: course.instructor.imageUrl
                  } : null}
                  descriptionImages={(course.descriptionImages as string[]) || []}
                  curriculumImages={(course.curriculumImages as string[]) || []}
                />
              </div>

            </div>

            {/* 오른쪽: 신청 카드 */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">수강료</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {course.isFree ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span>무료</span>
                          <Badge variant="success" size="sm">FREE</Badge>
                        </div>
                        <div className="text-sm text-gray-600 font-normal mt-2">
                          1일 특강
                        </div>
                      </div>
                    ) : (
                      `${course.price.toLocaleString()}원`
                    )}
                  </div>
                </div>

                {/* 수강신청 수 */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">누적 수강생</span>
                    <span className="font-bold text-gray-900">
                      {(course._count.enrollments + (course.id === 50 ? 531 : 0)).toLocaleString()}명
                    </span>
                  </div>
                </div>

                {/* 신청 버튼 */}
                {(() => {
                  const scheduledSchedules = course.schedules.filter((s: any) => s.status === 'scheduled')
                  const ongoingSchedules = course.schedules.filter((s: any) => s.status === 'ongoing')

                  if (scheduledSchedules.length > 0) {
                    return (
                      <Link href={`/courses/${course.id}/enroll`}>
                        <Button variant="primary" fullWidth className="mb-3">
                          {course.isFree ? '무료로 강의 듣기' : '수강 신청하기'}
                        </Button>
                      </Link>
                    )
                  } else if (ongoingSchedules.length > 0) {
                    return (
                      <Card padding="lg" className="mb-4 text-center bg-yellow-50 border border-yellow-200">
                        <p className="text-sm text-yellow-800 font-medium">수강 신청이 마감되었습니다</p>
                        <p className="text-xs text-yellow-600 mt-1">다음 기수 오픈 시 알림을 받으시려면 문의해주세요</p>
                      </Card>
                    )
                  } else {
                    return (
                      <Card padding="lg" className="mb-4 text-center bg-gray-50">
                        <p className="text-sm text-gray-600">현재 예정된 일정이 없습니다</p>
                      </Card>
                    )
                  }
                })()}

                {/* 강의 일정 정보 */}
                {(() => {
                  const activeSchedule = course.schedules.find((s: any) => s.status === 'scheduled' || s.status === 'ongoing')
                  if (activeSchedule) {
                    return (
                      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-bold text-gray-900">{activeSchedule.cohort}기 강의 일정</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">수업 기간</span>
                            <span className="font-medium text-gray-900">
                              {new Date(activeSchedule.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ~ {new Date(activeSchedule.endDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">총 수업</span>
                            <span className="font-medium text-gray-900">{activeSchedule.sessions?.length || 0}회</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">수업 방식</span>
                            <span className="font-medium text-gray-900">실시간 온라인 (Zoom)</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                {/* 수업 특징 */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center border border-blue-200">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-bold text-blue-900">온라인 수업</div>
                    <div className="text-xs text-blue-700 mt-0.5">실시간 HD 화질</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl text-center border border-green-200">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-bold text-green-900">이메일 안내</div>
                    <div className="text-xs text-green-700 mt-0.5">수업 전 자동 발송</div>
                  </div>
                </div>

                {/* 녹화파일 안내 - 강조 */}
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-base font-bold">녹화파일 제공</div>
                      <div className="text-sm text-white/90">강의 1~2일 후 업로드 · 1개월간 무제한 시청</div>
                    </div>
                  </div>
                </div>

                {/* 수강 후 이용 안내 */}
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-sm font-bold text-amber-900 mb-1">수강 후 이용 안내</div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        강의실 입장, Q&A, 게시판, 자료실, 녹화영상은<br/>
                        <span className="font-semibold">내 구매목록</span> 메뉴에서 이용하실 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>

              </Card>
            </div>
          </div>
        </Section>
      </div>
    </CustomerLayout>
  )
}
