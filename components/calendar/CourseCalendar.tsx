'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CourseSession {
  id: number
  sessionNumber: number
  sessionDate: Date
  startTime: string
  endTime: string
  topic?: string | null
}

interface Schedule {
  id: number
  cohort: number
  startDate: Date
  endDate: Date
  status: string
  course: {
    id: number
    title: string
    isFree: boolean
  }
  instructor?: {
    name: string
    imageUrl: string | null
  } | null
  sessions?: CourseSession[]
}

// 강의별 고유 색상 팔레트
const courseColors = [
  { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', lightBg: 'bg-blue-50' },
  { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', lightBg: 'bg-purple-50' },
  { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', lightBg: 'bg-green-50' },
  { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-200', lightBg: 'bg-orange-50' },
  { bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-200', lightBg: 'bg-pink-50' },
  { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200', lightBg: 'bg-indigo-50' },
  { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-200', lightBg: 'bg-teal-50' },
  { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-200', lightBg: 'bg-rose-50' },
]

// 강의 ID로 색상 가져오기
const getCourseColor = (courseId: number) => {
  return courseColors[courseId % courseColors.length]
}

interface CourseCalendarProps {
  schedules: Schedule[]
  showCourseTitle?: boolean // 강의 제목 표시 여부 (기본: 여러 강의가 있으면 표시)
}

export default function CourseCalendar({ schedules, showCourseTitle }: CourseCalendarProps) {
  // 여러 강의가 있는지 확인
  const uniqueCourseIds = new Set(schedules.map(s => s.course.id))
  const hasMultipleCourses = uniqueCourseIds.size > 1
  const shouldShowTitle = showCourseTitle !== undefined ? showCourseTitle : hasMultipleCourses
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 달의 첫날과 마지막날
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 달력 시작일 (이전 달의 마지막 주 포함)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  // 달력에 표시할 날짜들 생성 (6주)
  const calendarDays: Date[] = []
  const currentDateIter = new Date(startDate)
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(currentDateIter))
    currentDateIter.setDate(currentDateIter.getDate() + 1)
  }

  // 특정 날짜에 해당하는 스케줄 찾기
  const getSchedulesForDate = (date: Date) => {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return schedules.filter((schedule) => {
      // 세션이 있으면 세션 날짜로 확인
      if (schedule.sessions && schedule.sessions.length > 0) {
        return schedule.sessions.some((session) => {
          const sessionDate = new Date(session.sessionDate)
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === targetDate.getTime()
        })
      }

      // 세션이 없으면 기존 범위로 확인 (시작일과 종료일만)
      const scheduleStart = new Date(schedule.startDate)
      const scheduleEnd = new Date(schedule.endDate)
      scheduleStart.setHours(0, 0, 0, 0)
      scheduleEnd.setHours(0, 0, 0, 0)

      // 시작일 또는 종료일인 경우만 표시
      return (
        scheduleStart.getTime() === targetDate.getTime() ||
        scheduleEnd.getTime() === targetDate.getTime()
      )
    })
  }


  // 이전/다음 달로 이동
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-3 sm:p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <h3 className="text-lg sm:text-2xl font-semibold text-gray-900">
          {year}년 {month + 1}월
        </h3>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={previousMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-[10px] sm:text-sm font-semibold py-1 sm:py-2 ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((date, index) => {
          const daySchedules = getSchedulesForDate(date)
          const hasSchedule = daySchedules.length > 0
          const isTodayDate = isToday(date)
          const isCurrentMonthDate = isCurrentMonth(date)

          // 첫 번째 강의의 색상 가져오기
          const firstCourseColor = hasSchedule ? getCourseColor(daySchedules[0].course.id) : null

          return (
            <div
              key={index}
              className={`${shouldShowTitle ? 'min-h-[120px] sm:min-h-[200px]' : 'min-h-[100px] sm:min-h-[180px]'} p-1 sm:p-2 rounded-lg border ${
                !isCurrentMonthDate
                  ? 'bg-gray-50 border-gray-100'
                  : hasSchedule && firstCourseColor
                  ? `${firstCourseColor.lightBg} ${firstCourseColor.border}`
                  : 'bg-white border-gray-200'
              } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <div
                  className={`text-[10px] sm:text-sm font-medium ${
                    !isCurrentMonthDate
                      ? 'text-gray-400'
                      : isTodayDate
                      ? 'text-white bg-blue-600 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold'
                      : index % 7 === 0
                      ? 'text-red-500'
                      : index % 7 === 6
                      ? 'text-blue-500'
                      : 'text-gray-900'
                  }`}
                >
                  {date.getDate()}
                </div>
                {isTodayDate && (
                  <span className="text-[8px] sm:text-[10px] font-bold text-blue-600">오늘</span>
                )}
              </div>
              {hasSchedule && (
                <div className="space-y-0.5 sm:space-y-1">
                  {daySchedules.slice(0, 3).map((schedule) => {
                    // 해당 날짜의 세션 찾기
                    const targetDate = new Date(date)
                    targetDate.setHours(0, 0, 0, 0)
                    const todaySession = schedule.sessions?.find((session) => {
                      const sessionDate = new Date(session.sessionDate)
                      sessionDate.setHours(0, 0, 0, 0)
                      return sessionDate.getTime() === targetDate.getTime()
                    })

                    // 강의별 고유 색상
                    const color = getCourseColor(schedule.course.id)

                    return (
                      <Link
                        key={schedule.id}
                        href={`/courses/${schedule.course.id}`}
                        className={`block text-xs text-white px-1 py-1 sm:px-2 sm:py-1.5 rounded font-medium ${color.bg} hover:opacity-90 transition-opacity cursor-pointer`}
                        title={`${schedule.course.title} ${schedule.cohort}기${todaySession ? ` ${todaySession.sessionNumber}회 (${todaySession.startTime}-${todaySession.endTime})` : ''}`}
                      >
                        {todaySession ? (
                          <div className="space-y-0.5 sm:space-y-1">
                            {shouldShowTitle && (
                              <div className="text-left text-[9px] sm:text-[11px] font-semibold truncate">
                                {schedule.course.title}
                              </div>
                            )}
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              {schedule.instructor?.imageUrl && (
                                <img
                                  src={schedule.instructor.imageUrl}
                                  alt={schedule.instructor.name}
                                  className="hidden sm:block w-6 h-6 rounded-full border border-white/50 object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-left font-bold text-[9px] sm:text-[11px]">
                                  {schedule.cohort}기 {todaySession.sessionNumber}회
                                </div>
                                <div className="text-left text-[8px] sm:text-[10px] opacity-90 hidden sm:block">
                                  {todaySession.startTime}-{todaySession.endTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5 sm:space-y-1">
                            {shouldShowTitle && (
                              <div className="text-left text-[9px] sm:text-[11px] font-semibold truncate">
                                {schedule.course.title}
                              </div>
                            )}
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              {schedule.instructor?.imageUrl && (
                                <img
                                  src={schedule.instructor.imageUrl}
                                  alt={schedule.instructor.name}
                                  className="hidden sm:block w-6 h-6 rounded-full border border-white/50 object-cover flex-shrink-0"
                                />
                              )}
                              <div className="text-left text-[9px] sm:text-[11px]">
                                {schedule.cohort}기
                              </div>
                            </div>
                          </div>
                        )}
                      </Link>
                    )
                  })}
                  {daySchedules.length > 3 && (
                    <div className="text-[8px] sm:text-xs text-gray-600 font-medium text-left">
                      +{daySchedules.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
