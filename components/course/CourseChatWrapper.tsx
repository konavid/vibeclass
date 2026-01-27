'use client'

import dynamic from 'next/dynamic'

// Dynamically import CourseChat to avoid SSR issues with socket.io
const CourseChat = dynamic(() => import('./CourseChat'), {
  ssr: false,
  loading: () => (
    <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    </div>
  )
})

interface Schedule {
  id: number
  cohort: number
  endDate: string
}

interface Props {
  courseId: number
  courseName: string
  schedules: Schedule[]
}

export default function CourseChatWrapper({ courseId, courseName, schedules }: Props) {
  return (
    <CourseChat
      courseId={courseId}
      courseName={courseName}
      schedules={schedules}
    />
  )
}
