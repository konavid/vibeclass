'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/admin/courses')
      if (response.data.success) {
        setCourses(response.data.courses)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCourses(courses.map(c => c.id))
    } else {
      setSelectedCourses([])
    }
  }

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId)
      } else {
        return [...prev, courseId]
      }
    })
  }

  const handleBulkAction = async (action: 'delete' | 'deactivate' | 'activate') => {
    if (selectedCourses.length === 0) {
      alert('강의를 선택해주세요')
      return
    }

    const actionText = action === 'delete' ? '삭제' : action === 'deactivate' ? '비활성화' : '활성화'

    if (!confirm(`선택한 ${selectedCourses.length}개의 강의를 ${actionText}하시겠습니까?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await axios.post('/api/admin/courses/bulk', {
        action,
        courseIds: selectedCourses
      })

      if (response.data.success) {
        alert(response.data.message)
        setSelectedCourses([])
        fetchCourses()
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '작업 실패')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">강의 관리</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/courses/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
          >
            강의 추가
          </button>
        </div>
      </div>

      {/* 일괄 작업 버튼 */}
      {selectedCourses.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedCourses.length}개 선택됨
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              활성화
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:bg-gray-400 font-medium"
            >
              비활성화
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 font-medium"
            >
              삭제
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-600">로딩 중...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-600">강의가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={courses.length > 0 && selectedCourses.length === courses.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">썸네일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">강의명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">강사</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수강생</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기수</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => handleSelectCourse(course.id)}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer group"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      <div className="w-24 h-14 rounded-lg overflow-hidden thumbnail-animated">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      {course.title}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      {course.category?.name || '-'}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      {course.instructor?.name || '-'}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      {course.isFree ? '무료' : course.price.toLocaleString() + '원'}
                    </td>
                    <td
                      className="px-6 py-4 text-sm cursor-pointer"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      <span className={`px-2 py-1 text-xs rounded ${
                        course.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      {course._count?.enrollments || 0}명
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700 cursor-pointer"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      {course._count?.schedules || 0}개
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
