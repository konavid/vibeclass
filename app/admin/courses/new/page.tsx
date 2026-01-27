'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

// Quill 에디터 스타일 정의
const quillEditorStyle = `
  .ql-editor {
    color: #1f2937 !important;
    min-height: 200px;
  }
  .ql-editor p,
  .ql-editor h1,
  .ql-editor h2,
  .ql-editor h3,
  .ql-editor li,
  .ql-editor span {
    color: inherit;
  }
  .ql-editor.ql-blank::before {
    color: #9ca3af !important;
  }
  .prose p,
  .prose h1,
  .prose h2,
  .prose h3,
  .prose li,
  .prose span,
  .prose strong,
  .prose em,
  .prose u {
    color: #1f2937 !important;
  }
  .prose img {
    max-width: 100%;
    height: auto;
  }
  .prose iframe {
    max-width: 100%;
    aspect-ratio: 16/9;
  }
`

interface Category {
  id: number
  name: string
}

interface Instructor {
  id: number
  name: string
  imageUrl?: string
}

interface Course {
  id: number
  title: string
  level: string
}

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [generatingCurriculum, setGeneratingCurriculum] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [includeProfileImage, setIncludeProfileImage] = useState(true)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [showImageSelectModal, setShowImageSelectModal] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    curriculum: '',
    instructions: '',
    price: 0,
    isFree: false,
    capacity: 30,
    categoryId: 0,
    instructorId: 0,
    thumbnailUrl: '',
    parentId: null as number | null,
    level: 'basic',
    order: 0,
    isRequired: false,
    courseType: 'online',
    location: '',
    locationAddress: '',
    locationMapUrl: '',
    locationLat: null as number | null,
    locationLng: null as number | null,
    locationNote: '',
    descriptionImages: [] as string[],
    curriculumImages: [] as string[],
  })
  const [uploadingPromoImage, setUploadingPromoImage] = useState<'description' | 'curriculum' | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchInstructors()
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      if (data.success) {
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('강의 조회 실패:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('카테고리 조회 실패:', error)
    }
  }

  const fetchInstructors = async () => {
    try {
      const res = await fetch('/api/admin/instructors')
      const data = await res.json()
      if (data.success) {
        setInstructors(data.instructors)
      }
    } catch (error) {
      console.error('강사 조회 실패:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 미리보기 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // 파일 업로드
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setFormData(prev => ({ ...prev, thumbnailUrl: data.url }))
        alert('이미지가 업로드되었습니다')
      } else {
        alert(data.error || '업로드에 실패했습니다')
        setPreviewUrl('')
      }
    } catch (error) {
      console.error('업로드 실패:', error)
      alert('업로드에 실패했습니다')
      setPreviewUrl('')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, thumbnailUrl: '' }))
    setPreviewUrl('')
  }

  const handleGenerateImage = async () => {
    if (!formData.title) {
      alert('강의 제목을 먼저 입력해주세요')
      return
    }

    setGenerating(true)
    try {
      const categoryName = categories.find(c => c.id === formData.categoryId)?.name || ''

      const selectedInstructor = instructors.find(i => i.id === formData.instructorId)
      const profileImageUrl = includeProfileImage && selectedInstructor?.imageUrl ? selectedInstructor.imageUrl : undefined

      const res = await fetch('/api/admin/courses/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: categoryName,
          profileImageUrl
        }),
      })

      const data = await res.json()

      if (data.success && data.imageUrl) {
        setFormData(prev => ({ ...prev, thumbnailUrl: data.imageUrl }))
        setPreviewUrl(data.imageUrl)
        alert('AI가 이미지를 생성했습니다!')
      } else {
        alert(data.error || 'AI 이미지 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('이미지 생성 실패:', error)
      alert('AI 이미지 생성에 실패했습니다')
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectImage = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, thumbnailUrl: imageUrl }))
    setPreviewUrl(imageUrl)
    setShowImageSelectModal(false)
    setGeneratedImages([])
  }

  const handleGenerateDescription = async () => {
    if (!formData.title) {
      alert('강의 제목을 먼저 입력해주세요')
      return
    }

    setGeneratingDescription(true)
    try {
      const categoryName = categories.find(c => c.id === formData.categoryId)?.name || ''

      const res = await fetch('/api/admin/courses/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: categoryName,
          instructions: formData.instructions
        }),
      })

      const data = await res.json()

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          description: data.description
        }))
        alert('AI가 강의 설명을 생성했습니다!')
      } else {
        alert(data.error || 'AI 설명 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('설명 생성 실패:', error)
      alert('AI 설명 생성에 실패했습니다')
    } finally {
      setGeneratingDescription(false)
    }
  }

  const handleGenerateCurriculum = async () => {
    if (!formData.title) {
      alert('강의 제목을 먼저 입력해주세요')
      return
    }

    setGeneratingCurriculum(true)
    try {
      const categoryName = categories.find(c => c.id === formData.categoryId)?.name || ''

      const res = await fetch('/api/admin/courses/generate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: categoryName,
          description: formData.description,
          instructions: formData.instructions // 지시사항의 주차/차수/시간 정보 활용
        }),
      })

      const data = await res.json()

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          curriculum: data.curriculum
        }))
        alert('AI가 커리큘럼을 생성했습니다!')
      } else {
        alert(data.error || 'AI 커리큘럼 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('커리큘럼 생성 실패:', error)
      alert('AI 커리큘럼 생성에 실패했습니다')
    } finally {
      setGeneratingCurriculum(false)
    }
  }

  // 프로모션 이미지 업로드
  const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'description' | 'curriculum') => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const currentImages = type === 'description' ? formData.descriptionImages : formData.curriculumImages
    const remainingSlots = 10 - currentImages.length
    if (remainingSlots <= 0) {
      alert('이미지는 최대 10장까지만 추가할 수 있습니다.')
      return
    }

    setUploadingPromoImage(type)
    try {
      const uploadedUrls: string[] = []
      const filesToUpload = Array.from(files).slice(0, remainingSlots)

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 5 * 1024 * 1024) {
          alert('파일 크기는 5MB를 초과할 수 없습니다.')
          continue
        }

        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('type', 'courses')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })
        const data = await res.json()
        if (data.success) {
          uploadedUrls.push(data.url)
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          [type === 'description' ? 'descriptionImages' : 'curriculumImages']: [...currentImages, ...uploadedUrls]
        }))
      }
    } catch (error) {
      console.error('프로모션 이미지 업로드 실패:', error)
      alert('이미지 업로드에 실패했습니다')
    } finally {
      setUploadingPromoImage(null)
      e.target.value = ''
    }
  }

  // 프로모션 이미지 삭제
  const handlePromoImageDelete = (type: 'description' | 'curriculum', index: number) => {
    const key = type === 'description' ? 'descriptionImages' : 'curriculumImages'
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        alert('강의가 생성되었습니다')
        router.push(`/admin/courses/${data.course.id}`)
      } else {
        const error = await res.json()
        alert(error.error || '생성에 실패했습니다')
      }
    } catch (error) {
      console.error('생성 실패:', error)
      alert('생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: quillEditorStyle }} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">강의 추가</h1>
        <p className="mt-2 text-sm text-gray-600">새로운 강의를 생성합니다</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI 생성 버튼들 - 상단에 눈에 잘 띄게 */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-bold text-purple-900">AI 자동 생성</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              강의명을 입력하고 순서대로 <strong>설명</strong> → <strong>커리큘럼</strong> → <strong>이미지</strong>를 생성하세요.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || !formData.title}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {generatingDescription ? '설명 생성 중...' : '1. 설명 생성'}
              </button>
              <button
                type="button"
                onClick={handleGenerateCurriculum}
                disabled={generatingCurriculum || !formData.title}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {generatingCurriculum ? '커리큘럼 생성 중...' : '2. 커리큘럼 생성'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={generating || !formData.title}
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {generating ? '이미지 생성 중...' : '3. 이미지 생성'}
                </button>
                {formData.instructorId > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeProfileImage}
                        onChange={(e) => setIncludeProfileImage(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        disabled={!instructors.find(i => i.id === formData.instructorId)?.imageUrl}
                      />
                      <span>프로필 사진 합성</span>
                    </label>
                    {!instructors.find(i => i.id === formData.instructorId)?.imageUrl && (
                      <span className="text-xs text-red-500">(강사 프로필 이미지 없음)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              강의명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="예: AI 프롬프트 엔지니어링 입문"
            />
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI 생성 지시사항 <span className="text-yellow-600">(설명 & 커리큘럼 자동 생성용)</span>
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 resize-y"
              rows={6}
              placeholder="예: 이 강의는 초보자를 위한 AI 활용법을 다룹니다. ChatGPT, Claude 등의 AI 도구를 실무에서 활용하는 방법을 배웁니다. 특히 마케팅, 콘텐츠 제작, 데이터 분석 분야에 초점을 맞춥니다.

커리큘럼 구조:
- 총 8주차 과정
- 주 2회 수업 (월, 수)
- 회당 2시간
- 1-4주차: AI 기초 이론과 도구 사용법
- 5-8주차: 실무 프로젝트 및 활용"
            />
            <p className="mt-2 text-xs text-gray-600">
              💡 AI가 강의 설명과 커리큘럼을 생성할 때 이 지시사항을 참고합니다.<br/>
              <strong>커리큘럼 생성 시</strong> 주차, 차수, 시간 정보를 포함하면 표 형식으로 구조화된 커리큘럼이 생성됩니다.
            </p>
          </div>

          {/* 강의 유형 설정 (온라인/오프라인) */}
          <div className="border-2 border-emerald-200 rounded-lg p-6 bg-emerald-50">
            <h3 className="text-lg font-bold text-emerald-900 mb-4">📍 강의 유형</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">강의 형태</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="courseType"
                    value="online"
                    checked={formData.courseType === 'online'}
                    onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">온라인</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="courseType"
                    value="offline"
                    checked={formData.courseType === 'offline'}
                    onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">오프라인</span>
                </label>
              </div>
            </div>

            {formData.courseType === 'offline' && (
              <div className="space-y-4 pt-4 border-t border-emerald-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      장소명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="예: 강남 교육센터"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상세 주소
                    </label>
                    <input
                      type="text"
                      value={formData.locationAddress}
                      onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="예: 서울시 강남구 테헤란로 123, 5층"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지도 URL 또는 iframe 코드
                  </label>
                  <textarea
                    value={formData.locationMapUrl}
                    onChange={(e) => setFormData({ ...formData, locationMapUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                    rows={3}
                    placeholder="카카오맵, 네이버지도 공유 URL 또는 iframe 코드를 붙여넣으세요"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    💡 카카오맵/네이버지도에서 공유하기 → 링크 복사 또는 지도 퍼가기 코드를 입력하세요
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">위도 (선택)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.locationLat || ''}
                      onChange={(e) => setFormData({ ...formData, locationLat: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="예: 37.5665"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">경도 (선택)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.locationLng || ''}
                      onChange={(e) => setFormData({ ...formData, locationLng: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="예: 126.9780"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">장소 안내 메모</label>
                  <textarea
                    value={formData.locationNote}
                    onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                    rows={3}
                    placeholder="예: 지하철 2호선 강남역 3번 출구에서 도보 5분. 건물 1층에 편의점이 있습니다. 주차는 건물 지하주차장 이용 (2시간 무료)"
                  />
                </div>

                {/* 지도 미리보기 */}
                {formData.locationMapUrl && formData.locationMapUrl.includes('<iframe') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">지도 미리보기</label>
                    <div
                      className="border border-gray-300 rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: formData.locationMapUrl }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 강의 계층 구조 설정 */}
          <div className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">📚 강의 계층 구조</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  레벨
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="basic">기초 (Basic)</option>
                  <option value="intermediate">중급 (Intermediate)</option>
                  <option value="advanced">고급 (Advanced)</option>
                  <option value="master">마스터 (Master)</option>
                  <option value="prerequisite">필수 기초 (Prerequisite)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부모 강의 (선택)
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">없음 (최상위 강의)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.level})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-600">
                  이 강의가 다른 강의의 하위 과정인 경우 선택하세요
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정렬 순서
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-600">
                  같은 레벨 내에서 표시되는 순서 (낮을수록 먼저 표시)
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">필수 과정</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                설명 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(오른쪽 하단 모서리를 드래그하여 높이 조절)</span>
              </label>
              <label className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 cursor-pointer flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploadingPromoImage === 'description' ? '업로드 중...' : `프로모션 이미지 (${formData.descriptionImages.length}/10)`}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePromoImageUpload(e, 'description')}
                  disabled={uploadingPromoImage !== null}
                  className="hidden"
                />
              </label>
            </div>
            {/* 프로모션 이미지 미리보기 */}
            {formData.descriptionImages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.descriptionImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`설명 이미지 ${index + 1}`} className="w-16 h-20 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => handlePromoImageDelete('description', index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white mb-4 border-2 border-gray-300 rounded resize-y overflow-auto" style={{ height: '400px', minHeight: '200px', maxHeight: '1200px' }}>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image', 'video'],
                    ['clean']
                  ]
                }}
                style={{ height: 'calc(100% - 42px)' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                커리큘럼
                <span className="text-xs text-gray-500 ml-2">(오른쪽 하단 모서리를 드래그하여 높이 조절)</span>
              </label>
              <label className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 cursor-pointer flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploadingPromoImage === 'curriculum' ? '업로드 중...' : `프로모션 이미지 (${formData.curriculumImages.length}/10)`}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePromoImageUpload(e, 'curriculum')}
                  disabled={uploadingPromoImage !== null}
                  className="hidden"
                />
              </label>
            </div>
            {/* 프로모션 이미지 미리보기 */}
            {formData.curriculumImages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.curriculumImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`커리큘럼 이미지 ${index + 1}`} className="w-16 h-20 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => handlePromoImageDelete('curriculum', index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white mb-4 border-2 border-gray-300 rounded resize-y overflow-auto" style={{ height: '400px', minHeight: '200px', maxHeight: '1200px' }}>
              <ReactQuill
                theme="snow"
                value={formData.curriculum}
                onChange={(value) => setFormData({ ...formData, curriculum: value })}
                style={{ height: 'calc(100% - 42px)' }}
                placeholder="주차별 커리큘럼을 입력하세요. 예: 1주차: AI 기초 이론, 2주차: 프롬프트 작성 방법..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={0}>카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">강사</label>
              <select
                value={formData.instructorId}
                onChange={(e) => setFormData({ ...formData, instructorId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={0}>강사 미정</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked, price: e.target.checked ? 0 : formData.price })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">무료 강의</span>
            </label>

            {!formData.isFree && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정원</label>
            <input
              type="number"
              min={1}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">썸네일 이미지</label>

            {/* 이미지 미리보기 */}
            {(previewUrl || formData.thumbnailUrl) && (
              <div className="mb-3 relative inline-block">
                <img
                  src={previewUrl || formData.thumbnailUrl}
                  alt="썸네일 미리보기"
                  className="w-64 h-40 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                  title="이미지 제거"
                >
                  ×
                </button>
              </div>
            )}

            {/* 파일 업로드 및 AI 생성 버튼 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer border border-gray-300">
                  <span>{uploading ? '업로드 중...' : '이미지 선택'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading || generating}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={generating || uploading || !formData.title}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {generating ? 'AI 생성 중...' : 'AI로 자동 생성'}
                </button>
                {formData.instructorId > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeProfileImage}
                        onChange={(e) => setIncludeProfileImage(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        disabled={!instructors.find(i => i.id === formData.instructorId)?.imageUrl}
                      />
                      <span>프로필 사진 합성</span>
                    </label>
                    {!instructors.find(i => i.id === formData.instructorId)?.imageUrl && (
                      <span className="text-xs text-red-500">(강사 프로필 이미지 없음)</span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                JPG, PNG, GIF (최대 5MB) 또는 AI를 사용해 자동으로 생성하세요
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:bg-gray-400"
            >
              {loading ? '생성 중...' : '강의 생성'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
            >
              취소
            </button>
          </div>
        </form>
      </div>

      {/* 이미지 선택 모달 */}
      {showImageSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">AI 생성 이미지 선택</h3>
                <button
                  onClick={() => {
                    setShowImageSelectModal(false)
                    setGeneratedImages([])
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">원하는 이미지를 클릭하여 선택하세요</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectImage(imageUrl)}
                    className="cursor-pointer group relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-500 transition-all"
                  >
                    <img
                      src={imageUrl}
                      alt={`생성된 이미지 ${index + 1}`}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg transition-opacity">
                        이 이미지 선택
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 bg-white text-gray-700 px-2 py-1 rounded text-sm font-medium">
                      {index + 1}번
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImageSelectModal(false)
                  setGeneratedImages([])
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={generating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {generating ? '생성 중...' : '다시 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
