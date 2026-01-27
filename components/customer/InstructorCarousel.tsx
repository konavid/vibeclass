'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// HTML 태그 제거 함수
function stripHtml(html: string | null): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&nbsp;/g, ' ') // &nbsp; 를 공백으로
    .replace(/&amp;/g, '&')  // &amp; 를 &로
    .replace(/&lt;/g, '<')   // &lt; 를 <로
    .replace(/&gt;/g, '>')   // &gt; 를 >로
    .replace(/&quot;/g, '"') // &quot; 를 "로
    .replace(/&#39;/g, "'")  // &#39; 를 '로
    .replace(/\s+/g, ' ')    // 연속 공백을 하나로
    .trim()
}

interface Instructor {
  id: number
  name: string
  imageUrl: string | null
  expertise: string | null
  bio: string | null
  consultingEnabled: boolean
  consultingPrice: number | null
  _count: {
    courses: number
  }
}

interface InstructorCarouselProps {
  instructors: Instructor[]
}

export default function InstructorCarousel({ instructors }: InstructorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % instructors.length)
  }, [instructors.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + instructors.length) % instructors.length)
  }, [instructors.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (isPaused || instructors.length <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused, nextSlide, instructors.length])

  if (instructors.length === 0) return null

  const currentInstructor = instructors[currentIndex]

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Featured Instructor */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-[280px] sm:min-h-[320px]">
        {/* Background Image with Animation */}
        <div
          key={currentInstructor.id}
          className="absolute inset-0 transition-opacity duration-700"
        >
          {currentInstructor.imageUrl && (
            <img
              src={currentInstructor.imageUrl}
              alt={currentInstructor.name}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Profile Image */}
          <Link
            href={`/instructors/${currentInstructor.id}`}
            className="flex-shrink-0 transform transition-all duration-500 hover:scale-105"
          >
            {currentInstructor.imageUrl ? (
              <img
                src={currentInstructor.imageUrl}
                alt={currentInstructor.name}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white/30 shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white/30 shadow-2xl">
                {currentInstructor.name.charAt(0)}
              </div>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
              <Link
                href={`/instructors/${currentInstructor.id}`}
                className="text-3xl sm:text-4xl font-bold hover:text-orange-300 transition-colors"
              >
                {currentInstructor.name}
              </Link>
              {currentInstructor.consultingEnabled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500 rounded-full text-sm font-medium self-center sm:self-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  1:1 컨설팅
                </span>
              )}
            </div>

            {currentInstructor.expertise && (
              <p className="text-lg sm:text-xl text-white/80 mb-4">
                {currentInstructor.expertise}
              </p>
            )}

            {currentInstructor.bio && stripHtml(currentInstructor.bio) && (
              <p className="text-sm sm:text-base text-white/60 mb-6 line-clamp-2 max-w-xl">
                {stripHtml(currentInstructor.bio)}
              </p>
            )}

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/70">
              <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                강의 {currentInstructor._count.courses}개
              </span>
              <Link
                href={`/instructors/${currentInstructor.id}`}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-full text-white font-medium transition-colors"
              >
                프로필 보기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {instructors.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-all opacity-60 hover:opacity-100"
              aria-label="이전 강사"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-all opacity-60 hover:opacity-100"
              aria-label="다음 강사"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Progress Bar */}
        {instructors.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / instructors.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {instructors.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-hide">
          {instructors.map((instructor, index) => (
            <button
              key={instructor.id}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {instructor.imageUrl ? (
                <img
                  src={instructor.imageUrl}
                  alt={instructor.name}
                  className={`w-7 h-7 rounded-full object-cover ${
                    index === currentIndex ? 'border-2 border-white' : ''
                  }`}
                />
              ) : (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === currentIndex
                    ? 'bg-white text-orange-500'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {instructor.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium whitespace-nowrap">{instructor.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Dot Indicators (mobile) */}
      {instructors.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 sm:hidden">
          {instructors.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-orange-500 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`${index + 1}번째 강사로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
