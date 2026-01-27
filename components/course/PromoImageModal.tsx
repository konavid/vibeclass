'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

// 스타일 옵션 정의
const STYLE_OPTIONS = [
  {
    id: 'modern',
    name: '모던 미니멀',
    description: '깔끔하고 심플한 디자인',
    prompt: 'Modern minimalist design with clean lines, ample white space, subtle shadows, and elegant typography. Professional and sleek appearance.'
  },
  {
    id: 'gradient',
    name: '그라데이션',
    description: '부드러운 색상 전환',
    prompt: 'Beautiful gradient backgrounds with smooth color transitions, vibrant yet harmonious colors, modern floating elements, and soft glows.'
  },
  {
    id: 'neon',
    name: '네온 사이버펑크',
    description: '화려한 네온 효과',
    prompt: 'Cyberpunk neon style with glowing neon lights, dark background, electric blue and pink accents, futuristic tech elements, holographic effects.'
  },
  {
    id: '3d',
    name: '3D 입체',
    description: '입체적이고 역동적인',
    prompt: '3D isometric design with depth and dimension, floating geometric shapes, realistic shadows, vibrant colors, modern tech aesthetic.'
  },
  {
    id: 'illustration',
    name: '일러스트',
    description: '친근한 일러스트 스타일',
    prompt: 'Flat illustration style with friendly cartoon elements, hand-drawn feel, warm colors, playful icons, and approachable design.'
  },
  {
    id: 'luxury',
    name: '럭셔리 프리미엄',
    description: '고급스럽고 세련된',
    prompt: 'Luxury premium design with gold accents, dark elegant backgrounds, sophisticated typography, subtle textures, and high-end aesthetic.'
  },
  {
    id: 'nature',
    name: '자연/오가닉',
    description: '자연 친화적인 느낌',
    prompt: 'Organic natural design with earth tones, plant elements, soft textures, eco-friendly aesthetic, calming green and brown palette.'
  },
  {
    id: 'bold',
    name: '볼드 팝',
    description: '강렬하고 눈에 띄는',
    prompt: 'Bold pop art style with vibrant contrasting colors, large typography, geometric shapes, high contrast, attention-grabbing design.'
  },
  {
    id: 'glass',
    name: '글래스모피즘',
    description: '투명한 유리 효과',
    prompt: 'Glassmorphism design with frosted glass effects, transparent layers, soft blur backgrounds, subtle gradients, light and airy feel with depth.'
  },
  {
    id: 'dark',
    name: '다크 모드',
    description: '어두운 배경의 모던함',
    prompt: 'Dark mode design with deep black/navy backgrounds, bright accent colors, subtle glows, high contrast text, sleek and mysterious atmosphere.'
  },
  {
    id: 'pastel',
    name: '파스텔 소프트',
    description: '부드럽고 따뜻한 톤',
    prompt: 'Soft pastel color palette with gentle pinks, blues, lavenders, mint greens. Dreamy, calm aesthetic with rounded shapes and soft shadows.'
  },
  {
    id: 'retro',
    name: '레트로 빈티지',
    description: '복고풍 감성',
    prompt: 'Retro vintage style with warm sepia tones, classic typography, nostalgic elements, film grain effect, 70s-80s aesthetic with modern twist.'
  },
  {
    id: 'tech',
    name: '테크 서킷',
    description: '기술적이고 미래적인',
    prompt: 'Tech circuit board aesthetic with digital patterns, data visualization elements, binary code backgrounds, blue/green tech colors, futuristic AI vibe.'
  },
  {
    id: 'watercolor',
    name: '수채화',
    description: '예술적인 수채화 느낌',
    prompt: 'Watercolor artistic style with soft color bleeds, paint splash effects, artistic brush strokes, organic textures, elegant and creative feel.'
  },
  {
    id: 'geometric',
    name: '기하학 패턴',
    description: '세련된 기하학적 무늬',
    prompt: 'Geometric pattern design with triangles, hexagons, abstract shapes, mathematical precision, modern art influence, clean intersecting lines.'
  },
  {
    id: 'cosmic',
    name: '우주/갤럭시',
    description: '신비로운 우주 테마',
    prompt: 'Cosmic galaxy theme with starry backgrounds, nebula colors, deep space aesthetic, purple and blue hues, ethereal and infinite feel.'
  }
]

interface PromoImageModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: number
  title: string
  description: string
  curriculum: string
  category: string
  descriptionImages: string[]
  curriculumImages: string[]
  onImagesUpdate: (type: 'description' | 'curriculum', images: string[]) => void
  initialTab?: 'description' | 'curriculum'
  apiBasePath: '/api/admin' | '/api/instructor'
}

// HTML에서 텍스트만 추출하는 함수
function extractTextFromHtml(html: string): string {
  if (!html) return ''

  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  text = text.replace(/\s+/g, ' ').trim()
  return text.length > 200 ? text.substring(0, 200) + '...' : text
}

export default function PromoImageModal({
  isOpen,
  onClose,
  courseId,
  title,
  description,
  curriculum,
  category,
  descriptionImages,
  curriculumImages,
  onImagesUpdate,
  initialTab = 'description',
  apiBasePath
}: PromoImageModalProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'curriculum'>(initialTab)
  const [generating, setGenerating] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [includeProfile, setIncludeProfile] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null)
        } else if (!generating) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, previewImage, generating])

  // 모달이 열릴 때 initialTab으로 탭 설정
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  const currentImages = activeTab === 'description' ? descriptionImages : curriculumImages
  const currentContent = activeTab === 'description' ? description : curriculum
  const contentPreview = extractTextFromHtml(currentContent)

  // 1장씩 순차 생성 (실시간 업데이트)
  const handleGenerateAll = async () => {
    setGenerating(true)
    setError(null)
    setGenerationProgress(0)

    try {
      const styleOption = STYLE_OPTIONS.find(s => s.id === selectedStyle)

      // 1단계: 기존 이미지 삭제 + 프롬프트 생성
      setGenerationProgress(5)
      const promptResponse = await axios.post(`${apiBasePath}/courses/generate-promo-image`, {
        courseId,
        type: activeTab,
        title,
        content: currentContent,
        category,
        stylePrompt: styleOption?.prompt || '',
        includeProfile: activeTab === 'description' ? includeProfile : false,
        getPrompts: true,
        clearExisting: true
      })

      if (!promptResponse.data.success || !promptResponse.data.prompts) {
        throw new Error(promptResponse.data.error || '프롬프트 생성 실패')
      }

      const prompts = promptResponse.data.prompts
      const totalImages = prompts.length

      // 이미지 초기화 (UI 업데이트)
      onImagesUpdate(activeTab, [])

      // 2단계: 1장씩 순차 생성
      for (let i = 0; i < totalImages; i++) {
        setGenerationProgress(Math.round(10 + (i / totalImages) * 85))

        try {
          const imageResponse = await axios.post(`${apiBasePath}/courses/generate-promo-image`, {
            courseId,
            type: activeTab,
            title,
            content: currentContent,
            category,
            stylePrompt: styleOption?.prompt || '',
            includeProfile: activeTab === 'description' ? includeProfile : false,
            singleIndex: i,
            prompts: prompts
          })

          if (imageResponse.data.success && imageResponse.data.images) {
            // 매 이미지 생성 후 UI 업데이트
            onImagesUpdate(activeTab, imageResponse.data.images)
          }
        } catch (singleError: any) {
          console.error(`Image ${i + 1} generation failed:`, singleError)
          // 개별 이미지 실패해도 계속 진행
        }
      }

      setGenerationProgress(100)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '이미지 생성에 실패했습니다.')
    } finally {
      setGenerating(false)
      setGenerationProgress(0)
    }
  }

  // 개별 이미지 재생성
  const handleRegenerate = async (index: number) => {
    setRegeneratingIndex(index)
    setError(null)

    try {
      const styleOption = STYLE_OPTIONS.find(s => s.id === selectedStyle)
      const response = await axios.post(`${apiBasePath}/courses/generate-promo-image`, {
        courseId,
        type: activeTab,
        title,
        content: currentContent,
        category,
        stylePrompt: styleOption?.prompt || '',
        includeProfile: activeTab === 'description' ? includeProfile : false,
        regenerateIndex: index
      })

      if (response.data.success) {
        onImagesUpdate(activeTab, response.data.images)
      } else {
        setError(response.data.error || '이미지 재생성에 실패했습니다.')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '이미지 재생성에 실패했습니다.')
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const handleDelete = async (index: number) => {
    setDeleting(index)
    setError(null)

    try {
      const response = await axios.delete(
        `${apiBasePath}/courses/generate-promo-image?courseId=${courseId}&type=${activeTab}&imageIndex=${index}`
      )

      if (response.data.success) {
        onImagesUpdate(activeTab, response.data.images)
      } else {
        setError(response.data.error || '이미지 삭제에 실패했습니다.')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '이미지 삭제에 실패했습니다.')
    } finally {
      setDeleting(null)
    }
  }

  // 수동 이미지 업로드
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 최대 10장까지만 허용
    const remainingSlots = 10 - currentImages.length
    if (remainingSlots <= 0) {
      setError('이미지는 최대 10장까지만 추가할 수 있습니다.')
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        // 이미지 타입 검증
        if (!file.type.startsWith('image/')) {
          setError('이미지 파일만 업로드 가능합니다.')
          continue
        }

        // 5MB 제한
        if (file.size > 5 * 1024 * 1024) {
          setError('파일 크기는 5MB를 초과할 수 없습니다.')
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'courses')

        const response = await axios.post('/api/upload', formData)
        if (response.data.success) {
          uploadedUrls.push(response.data.url)
        }
      }

      if (uploadedUrls.length > 0) {
        // 업로드 후 DB에 저장
        const newImages = [...currentImages, ...uploadedUrls]
        const saveResponse = await axios.put(
          `${apiBasePath}/courses/${courseId}/promo-images`,
          {
            type: activeTab,
            images: newImages
          }
        )

        if (saveResponse.data.success) {
          onImagesUpdate(activeTab, newImages)
        } else {
          setError(saveResponse.data.error || '이미지 저장에 실패했습니다.')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      {/* 메인 모달 */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={generating ? undefined : onClose}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">프로모션 이미지 생성</h2>
                    <p className="text-sm text-white/80">AI 자동 생성 또는 직접 이미지를 업로드하세요</p>
                  </div>
                </div>
                <button
                  onClick={generating ? undefined : onClose}
                  disabled={generating}
                  className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 탭 선택 */}
            <div className="px-6 pt-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setActiveTab('description')}
                  disabled={generating}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'description'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } disabled:opacity-50`}
                >
                  강의 설명 ({descriptionImages.length}/10)
                </button>
                <button
                  onClick={() => setActiveTab('curriculum')}
                  disabled={generating}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'curriculum'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } disabled:opacity-50`}
                >
                  커리큘럼 ({curriculumImages.length}/10)
                </button>
              </div>
            </div>

            {/* 본문 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* 에러 메시지 */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* 생성 진행 상황 */}
              {generating && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-6 h-6 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <div>
                      <p className="font-medium text-purple-900">AI가 프로모션 이미지를 생성하고 있습니다...</p>
                      <p className="text-sm text-purple-700">선택한 스타일과 강의 내용을 기반으로 생성됩니다</p>
                    </div>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-purple-600 mt-2 text-center">
                    약 1-2분 정도 소요됩니다. 잠시만 기다려주세요...
                  </p>
                </div>
              )}

              {/* 숨겨진 파일 입력 */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleManualUpload}
                accept="image/*"
                multiple
                className="hidden"
              />

              {/* 기존 이미지 목록 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    이미지 목록 ({currentImages.length}/10)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || generating || currentImages.length >= 10}
                      className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {uploading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          업로드 중...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          이미지 추가
                        </>
                      )}
                    </button>
                    {currentImages.length > 0 && (
                      <span className="text-xs text-gray-500">
                        클릭하여 확대 / 호버하여 삭제
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {currentImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative group aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-colors"
                    >
                      <img
                        src={url}
                        alt={`프로모션 이미지 ${index + 1}`}
                        className="w-full h-full object-contain cursor-pointer bg-gray-200"
                        onClick={() => setPreviewImage(url)}
                      />
                      {/* 이미지 번호 뱃지 */}
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                      {/* 호버 오버레이 */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewImage(url)}
                          className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="확대 보기"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRegenerate(index)}
                          disabled={regeneratingIndex === index || generating}
                          className="p-1.5 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
                          title="재생성"
                        >
                          {regeneratingIndex === index ? (
                            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          disabled={deleting === index || generating}
                          className="p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                          title="삭제"
                        >
                          {deleting === index ? (
                            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 빈 슬롯 - 클릭하면 업로드 */}
                  {currentImages.length < 10 && (
                    <div
                      onClick={() => !uploading && !generating && fileInputRef.current?.click()}
                      className="aspect-[9/16] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <div className="text-center text-gray-400 hover:text-purple-500">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs">추가</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 텍스트 미리보기 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {activeTab === 'description' ? '강의 설명' : '커리큘럼'} 미리보기
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600">
                  {contentPreview || '(내용이 없습니다)'}
                </div>
              </div>

              {/* 옵션 영역 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 스타일 선택 */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    배경 스타일 ({STYLE_OPTIONS.length}가지)
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-[150px] overflow-y-auto p-1">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        disabled={generating}
                        title={style.description}
                        className={`p-2 rounded-lg border-2 text-center transition-all ${
                          selectedStyle === style.id
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        } disabled:opacity-50`}
                      >
                        <div className={`text-xs font-medium truncate ${
                          selectedStyle === style.id ? 'text-purple-700' : 'text-gray-700'
                        }`}>
                          {style.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 프로필 포함 옵션 (강의 설명만) */}
                {activeTab === 'description' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      추가 옵션
                    </h3>
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeProfile}
                        onChange={(e) => setIncludeProfile(e.target.checked)}
                        disabled={generating}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">강사 프로필 이미지 포함</p>
                        <p className="text-xs text-gray-500">이미지에 강사의 프로필 사진을 합성합니다</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* 생성 버튼 */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleGenerateAll}
                  disabled={generating || regeneratingIndex !== null}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 shadow-lg text-lg"
                >
                  {generating ? (
                    <>
                      <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      8-10장 생성 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI로 8-10장 자동 생성
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500">
                  {currentImages.length > 0
                    ? '기존 이미지를 모두 삭제하고 새로 8-10장을 생성합니다'
                    : '강의 내용을 기반으로 8-10장의 카드뉴스 스타일 홍보 이미지를 자동 생성합니다'
                  }
                </p>
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={onClose}
                disabled={generating}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={previewImage}
            alt="확대 이미지"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
