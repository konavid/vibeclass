'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import InstructorLayout from '@/components/instructor/InstructorLayout'
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

const MAX_COURSES = 3

export default function InstructorCourseNewPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [courseCount, setCourseCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [generatingCurriculum, setGeneratingCurriculum] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [instructorProfile, setInstructorProfile] = useState<{ imageUrl?: string } | null>(null)
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
    thumbnailUrl: '',
    descriptionImages: [] as string[],
    curriculumImages: [] as string[],
  })
  const [uploadingPromoImage, setUploadingPromoImage] = useState<'description' | 'curriculum' | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user.role !== 'instructor' && session?.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [categoriesRes, coursesRes, profileRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/instructor/courses'),
        fetch('/api/instructor/profile')
      ])

      const categoriesData = await categoriesRes.json()
      if (categoriesData.success !== false) {
        setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || [])
      }

      const coursesData = await coursesRes.json()
      if (coursesData.success) {
        setCourseCount(coursesData.courses.length)
      }

      const profileData = await profileRes.json()
      if (profileData && !profileData.error) {
        setInstructorProfile(profileData)
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error)
    } finally {
      setInitialLoading(false)
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
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
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

      const res = await fetch('/api/instructor/courses/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: categoryName,
          profileImageUrl: includeProfileImage && instructorProfile?.imageUrl ? instructorProfile.imageUrl : undefined
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

      const res = await fetch('/api/instructor/courses/generate-description', {
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

      const res = await fetch('/api/instructor/courses/generate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: categoryName,
          description: formData.description,
          instructions: formData.instructions
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

    if (courseCount >= MAX_COURSES) {
      alert(`강의는 최대 ${MAX_COURSES}개까지만 등록할 수 있습니다.`)
      return
    }

    // 필수 필드 검증
    if (!formData.title.trim()) {
      alert('강의 제목을 입력해주세요.')
      return
    }

    if (!formData.description.trim() || formData.description === '<p><br></p>') {
      alert('강의 설명을 입력해주세요.')
      return
    }

    if (!formData.categoryId || formData.categoryId === 0) {
      alert('카테고리를 선택해주세요.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        alert('강의가 등록되었습니다')
        router.push('/instructor/courses')
      } else {
        alert(data.error || '등록에 실패했습니다')
      }
    } catch (error) {
      console.error('등록 실패:', error)
      alert('등록에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">로딩 중...</div>
      </InstructorLayout>
    )
  }

  if (courseCount >= MAX_COURSES) {
    return (
      <InstructorLayout>
        <div className="max-w-4xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">강의 등록 한도 초과</h3>
            <p className="text-yellow-700 mb-4">
              강의는 최대 {MAX_COURSES}개까지만 등록할 수 있습니다.<br />
              추가 등록이 필요하시면 관리자에게 문의해주세요.
            </p>
            <Link
              href="/instructor/courses"
              className="inline-block px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              강의 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </InstructorLayout>
    )
  }

  return (
    <InstructorLayout>
      <style dangerouslySetInnerHTML={{ __html: quillEditorStyle }} />
      <div className="max-w-4xl">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/instructor/courses" className="hover:text-gray-700">
                강의 관리
              </Link>
              <span>/</span>
              <span>새 강의 등록</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">새 강의 등록</h1>
            <p className="mt-1 text-sm text-gray-600">AI 자동 생성 기능을 활용하여 강의를 쉽게 등록하세요.</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {courseCount}/{MAX_COURSES} 강의 등록됨
          </span>
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
                  {instructorProfile?.imageUrl && (
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeProfileImage}
                        onChange={(e) => setIncludeProfileImage(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span>프로필 사진 합성</span>
                    </label>
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
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) || 0 })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">정원</label>
                <input
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
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
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
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
                  {instructorProfile?.imageUrl && (
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeProfileImage}
                        onChange={(e) => setIncludeProfileImage(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span>프로필 사진 합성</span>
                    </label>
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
                {loading ? '등록 중...' : '강의 등록'}
              </button>
              <Link
                href="/instructor/courses"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
              >
                취소
              </Link>
            </div>
          </form>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>안내:</strong> 강의 등록 후 바로 게시됩니다. 기수(스케줄) 및 차수(세션)는 강의 수정 페이지에서 직접 관리할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 이미지 선택 모달 */}
      {showImageSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">AI 생성 이미지 선택</h3>
                <button
                  onClick={() => {
                    setShowImageSelectModal(false)
                    setGeneratedImages([])
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">마음에 드는 이미지를 선택하세요</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer border-2 border-transparent hover:border-purple-500 rounded-lg overflow-hidden transition-all"
                    onClick={() => handleSelectImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`생성된 이미지 ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-all">
                        선택하기
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      옵션 {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={handleGenerateImage}
                disabled={generating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {generating ? '생성 중...' : '다시 생성'}
              </button>
              <button
                onClick={() => {
                  setShowImageSelectModal(false)
                  setGeneratedImages([])
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </InstructorLayout>
  )
}
