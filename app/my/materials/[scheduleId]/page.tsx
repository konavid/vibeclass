'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface Material {
  id: number
  title: string
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  order: number
  createdAt: string
  updatedAt: string
}

interface Schedule {
  id: number
  cohort: number
  courseTitle: string
}

export default function MaterialsListPage() {
  const params = useParams()
  const scheduleId = parseInt(params.scheduleId as string)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMaterials()
  }, [scheduleId])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cohort-materials?scheduleId=${scheduleId}`)
      const data = await res.json()

      if (res.ok) {
        setSchedule(data.schedule)
        setMaterials(data.materials)
        setError(null)
      } else {
        setError(data.error || '자료실을 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('자료실을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </CustomerLayout>
    )
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <Link
              href="/my/enrollments"
              className="mt-4 inline-block text-indigo-600 hover:underline"
            >
              내 구매 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/my/enrollments" className="hover:text-indigo-600">내 구매 목록</Link>
            <span>/</span>
            <span>자료실</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {schedule?.courseTitle} {schedule?.cohort}기 자료실
          </h1>
          <p className="mt-1 text-gray-600">강의 자료를 다운로드하세요</p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {materials.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 자료가 없습니다</h3>
              <p className="mt-2 text-gray-500">강사가 자료를 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {materials.map((material, index) => (
                  <li key={material.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{material.title}</h3>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {material.fileName && (
                              <>
                                <span>{material.fileName}</span>
                                {material.fileSize && (
                                  <span className="text-gray-400">({formatFileSize(material.fileSize)})</span>
                                )}
                                <span className="text-gray-300">|</span>
                              </>
                            )}
                            <span>등록일: {formatDate(material.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {material.fileUrl ? (
                        <a
                          href={material.fileUrl}
                          download={material.fileName || true}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          다운로드
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">파일 없음</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 뒤로가기 */}
          <div className="mt-6">
            <Link
              href="/my/enrollments"
              className="inline-flex items-center text-gray-600 hover:text-indigo-600"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              내 구매 목록으로
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
