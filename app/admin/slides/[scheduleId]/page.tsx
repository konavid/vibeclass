'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Slide {
  id: number
  title: string
  description: string | null
  slideUrl: string
  embedUrl: string | null
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface Schedule {
  id: number
  cohort: number
  courseTitle: string
}

export default function AdminSlidesPage() {
  const params = useParams()
  const scheduleId = parseInt(params.scheduleId as string)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slideUrl: '',
    order: 0,
    isPublished: true
  })
  const [error, setError] = useState('')
  const [previewSlide, setPreviewSlide] = useState<Slide | null>(null)

  useEffect(() => {
    fetchSlides()
  }, [scheduleId])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/cohort-slides?scheduleId=${scheduleId}`)
      const data = await res.json()

      if (res.ok) {
        setSchedule(data.schedule)
        setSlides(data.slides)
      }
    } catch (err) {
      console.error('슬라이드 목록 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (slide?: Slide) => {
    if (slide) {
      setEditingSlide(slide)
      setFormData({
        title: slide.title,
        description: slide.description || '',
        slideUrl: slide.slideUrl,
        order: slide.order,
        isPublished: slide.isPublished
      })
    } else {
      setEditingSlide(null)
      setFormData({
        title: '',
        description: '',
        slideUrl: '',
        order: slides.length + 1,
        isPublished: true
      })
    }
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingSlide(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title || !formData.slideUrl) {
      setError('제목과 구글 슬라이드 링크를 입력해주세요.')
      return
    }

    try {
      const url = editingSlide
        ? `/api/admin/cohort-slides/${editingSlide.id}`
        : '/api/admin/cohort-slides'
      const method = editingSlide ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduleId
        })
      })

      const data = await res.json()

      if (res.ok) {
        fetchSlides()
        closeModal()
      } else {
        setError(data.error || '저장에 실패했습니다.')
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (slideId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/cohort-slides/${slideId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSlides()
      }
    } catch (err) {
      console.error('삭제 실패:', err)
    }
  }

  const togglePublished = async (slide: Slide) => {
    try {
      const res = await fetch(`/api/admin/cohort-slides/${slide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !slide.isPublished })
      })

      if (res.ok) {
        fetchSlides()
      }
    } catch (err) {
      console.error('상태 변경 실패:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin/courses" className="hover:text-indigo-600">과정 관리</Link>
              <span>/</span>
              <span>슬라이드 관리</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {schedule?.courseTitle} {schedule?.cohort}기 강의슬라이드 관리
            </h1>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            슬라이드 추가
          </button>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">구글 슬라이드 연결 방법</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>구글 슬라이드에서 발표 자료를 만듭니다.</li>
            <li>우측 상단의 &quot;공유&quot; 버튼을 클릭합니다.</li>
            <li>&quot;링크가 있는 모든 사용자&quot;로 공유 설정을 변경합니다.</li>
            <li>&quot;링크 복사&quot;를 클릭하여 링크를 복사합니다.</li>
            <li>복사한 링크를 아래 &quot;구글 슬라이드 링크&quot; 필드에 붙여넣기 합니다.</li>
          </ol>
        </div>

        {/* 슬라이드 목록 */}
        {slides.length === 0 ? (
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
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 슬라이드가 없습니다</h3>
            <p className="mt-2 text-gray-500">슬라이드 추가 버튼을 클릭하여 슬라이드를 등록하세요.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">순서</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slides.map((slide) => (
                  <tr key={slide.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {slide.order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{slide.title}</div>
                      {slide.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{slide.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePublished(slide)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          slide.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {slide.isPublished ? '공개' : '비공개'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(slide.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => setPreviewSlide(slide)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        미리보기
                      </button>
                      <button
                        onClick={() => openModal(slide)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 슬라이드 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingSlide ? '슬라이드 수정' : '슬라이드 추가'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="1회차 강의자료"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="슬라이드에 대한 설명 (선택사항)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  구글 슬라이드 링크 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.slideUrl}
                  onChange={(e) => setFormData({ ...formData, slideUrl: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://docs.google.com/presentation/d/..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  구글 슬라이드에서 &quot;공유&quot; → &quot;링크가 있는 모든 사용자&quot;로 설정 후 링크를 복사해주세요.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    순서
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    공개 여부
                  </label>
                  <select
                    value={formData.isPublished ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.value === 'true' })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="true">공개</option>
                    <option value="false">비공개</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingSlide ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewSlide && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-5xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{previewSlide.title}</h2>
              <button
                onClick={() => setPreviewSlide(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
              {previewSlide.embedUrl ? (
                <iframe
                  src={previewSlide.embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  슬라이드를 불러올 수 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
