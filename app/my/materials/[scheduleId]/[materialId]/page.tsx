'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface Material {
  id: number
  title: string
  content: string
  order: number
  createdAt: string
  updatedAt: string
}

interface Schedule {
  id: number
  cohort: number
  courseTitle: string
}

export default function MaterialDetailPage() {
  const params = useParams()
  const scheduleId = parseInt(params.scheduleId as string)
  const materialId = parseInt(params.materialId as string)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMaterial()
  }, [scheduleId, materialId])

  const fetchMaterial = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cohort-materials?scheduleId=${scheduleId}&materialId=${materialId}`)
      const data = await res.json()

      if (res.ok) {
        setSchedule(data.schedule)
        setMaterial(data.material)
        setError(null)
      } else {
        setError(data.error || '자료를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('자료를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error || !material) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error || '자료를 찾을 수 없습니다.'}</p>
            <Link
              href={`/my/materials/${scheduleId}`}
              className="mt-4 inline-block text-indigo-600 hover:underline"
            >
              자료실 목록으로 돌아가기
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
            <Link href={`/my/materials/${scheduleId}`} className="hover:text-indigo-600">
              {schedule?.courseTitle} {schedule?.cohort}기 자료실
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            등록일: {formatDate(material.createdAt)}
            {material.updatedAt !== material.createdAt && (
              <span> · 수정일: {formatDate(material.updatedAt)}</span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 자료 내용 */}
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <style dangerouslySetInnerHTML={{ __html: `
              .material-content {
                color: #1f2937;
                line-height: 1.8;
              }
              .material-content h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 1rem; }
              .material-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.75rem; }
              .material-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
              .material-content p { margin: 0.75rem 0; }
              .material-content ul, .material-content ol { padding-left: 1.5rem; margin: 0.75rem 0; }
              .material-content li { margin: 0.25rem 0; }
              .material-content a { color: #4f46e5; text-decoration: underline; }
              .material-content a:hover { color: #4338ca; }
              .material-content img { max-width: 100%; height: auto; margin: 1rem 0; border-radius: 0.5rem; }
              .material-content video, .material-content iframe { max-width: 100%; margin: 1rem 0; }
              .material-content pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
              .material-content code { background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875rem; }
              .material-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; color: #6b7280; }
              .material-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
              .material-content th, .material-content td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
              .material-content th { background: #f9fafb; font-weight: 600; }
            ` }} />
            <div
              className="material-content prose max-w-none"
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          </div>

          {/* 네비게이션 */}
          <div className="mt-6 flex justify-between items-center">
            <Link
              href={`/my/materials/${scheduleId}`}
              className="inline-flex items-center text-gray-600 hover:text-indigo-600"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              자료 목록으로
            </Link>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
