'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

// HTML 콘텐츠 스타일 - 기본 텍스트 색상을 검은색으로 설정
const htmlContentStyle = `
  .course-html-content {
    color: #1f2937 !important;
  }
  .course-html-content img {
    max-width: 100%;
    height: auto;
  }
  .course-html-content iframe {
    max-width: 100%;
    aspect-ratio: 16/9;
  }
  .course-html-content p,
  .course-html-content h1,
  .course-html-content h2,
  .course-html-content h3,
  .course-html-content h4,
  .course-html-content h5,
  .course-html-content h6,
  .course-html-content li,
  .course-html-content span,
  .course-html-content div {
    color: #1f2937 !important;
  }
`

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

interface Review {
  id: number
  userId: number
  cohort: number | null
  rating: number
  content: string
  imageUrl: string | null
  createdAt: Date
  user: {
    name: string
  }
}

interface Qna {
  id: number
  title: string | null
  message: string
  response: string | null
  status: string
  isPublic: boolean
  createdAt: string
  respondedAt: string | null
  user: {
    id: number
    name: string
    nickname: string | null
  }
}

interface Instructor {
  id: number
  name: string
  imageUrl: string | null
}

interface CourseDetailTabsProps {
  schedules: Schedule[]
  description: string
  curriculum: string
  isFree: boolean
  courseId: number
  reviews: Review[]
  avgRating: number
  canWriteReview: boolean
  instructor: Instructor | null
  descriptionImages?: string[]
  curriculumImages?: string[]
}

export default function CourseDetailTabs({
  schedules,
  description,
  curriculum,
  isFree,
  courseId,
  reviews,
  avgRating,
  canWriteReview,
  instructor,
  descriptionImages = [],
  curriculumImages = [],
}: CourseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'curriculum' | 'schedule' | 'reviews' | 'qna' | 'refund'>('description')
  const [descriptionViewMode, setDescriptionViewMode] = useState<'image' | 'text'>(descriptionImages.length > 0 ? 'image' : 'text')
  const [curriculumViewMode, setCurriculumViewMode] = useState<'image' | 'text'>(curriculumImages.length > 0 ? 'image' : 'text')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)

  // Q&A 상태
  const [qnas, setQnas] = useState<Qna[]>([])
  const [qnaCount, setQnaCount] = useState(0)
  const [qnaLoading, setQnaLoading] = useState(false)
  const [qnaTitle, setQnaTitle] = useState('')
  const [qnaMessage, setQnaMessage] = useState('')
  const [qnaIsPublic, setQnaIsPublic] = useState(true)
  const [qnaSubmitting, setQnaSubmitting] = useState(false)
  const [qnaSubmitMessage, setQnaSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { data: session } = useSession()
  const router = useRouter()

  // Q&A 개수 조회 (초기 로드)
  const fetchQnaCount = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/qna?countOnly=true`)
      if (response.data.success) {
        setQnaCount(response.data.count)
      }
    } catch (error) {
      console.error('Q&A 개수 조회 실패:', error)
    }
  }

  // Q&A 목록 조회
  const fetchQnas = async () => {
    setQnaLoading(true)
    try {
      const response = await axios.get(`/api/courses/${courseId}/qna`)
      if (response.data.success) {
        setQnas(response.data.qnas)
        setQnaCount(response.data.qnas.length)
      }
    } catch (error) {
      console.error('Q&A 목록 조회 실패:', error)
    } finally {
      setQnaLoading(false)
    }
  }

  // 초기 로드 시 Q&A 개수 조회
  useEffect(() => {
    fetchQnaCount()
  }, [courseId])

  // Q&A 탭 클릭 시 목록 조회
  useEffect(() => {
    if (activeTab === 'qna') {
      fetchQnas()
    }
  }, [activeTab, courseId])

  // Q&A 등록
  const handleSubmitQna = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      router.push('/login')
      return
    }

    if (!qnaMessage.trim()) {
      setQnaSubmitMessage({ type: 'error', text: '문의 내용을 입력해주세요' })
      return
    }

    setQnaSubmitting(true)
    setQnaSubmitMessage(null)

    try {
      const response = await axios.post(`/api/courses/${courseId}/qna`, {
        title: qnaTitle.trim() || null,
        message: qnaMessage.trim(),
        isPublic: true // 모든 문의는 공개
      })

      if (response.data.success) {
        setQnaSubmitMessage({ type: 'success', text: response.data.message || '문의가 등록되었습니다.' })
        setQnaTitle('')
        setQnaMessage('')
        // Q&A 목록 새로고침
        fetchQnas()
      }
    } catch (error: any) {
      setQnaSubmitMessage({
        type: 'error',
        text: error.response?.data?.error || '문의 등록에 실패했습니다'
      })
    } finally {
      setQnaSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Q&A 삭제
  const handleDeleteQna = async (qnaId: number) => {
    if (!confirm('정말 이 문의를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await axios.delete(`/api/courses/${courseId}/qna/${qnaId}`)
      if (response.data.success) {
        alert('문의가 삭제되었습니다.')
        fetchQnas()
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '문의 삭제에 실패했습니다.')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      let imageUrl = null

      // 이미지가 있으면 먼저 업로드
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('folder', 'reviews')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          throw new Error('이미지 업로드에 실패했습니다')
        }

        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url
      }

      // 수정 모드인 경우
      if (editingReviewId) {
        const reviewRes = await fetch(`/api/reviews/${editingReviewId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating,
            content,
            imageUrl,
          }),
        })

        const reviewData = await reviewRes.json()

        if (!reviewRes.ok) {
          throw new Error(reviewData.error || '후기 수정에 실패했습니다')
        }

        setSubmitMessage({
          type: 'success',
          text: reviewData.message || '후기가 수정되었습니다.'
        })

        setEditingReviewId(null)
      } else {
        // 새 후기 작성
        const reviewRes = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            rating,
            content,
            imageUrl,
          }),
        })

        const reviewData = await reviewRes.json()

        if (!reviewRes.ok) {
          throw new Error(reviewData.error || '후기 작성에 실패했습니다')
        }

        setSubmitMessage({
          type: 'success',
          text: reviewData.message || '후기가 등록되었습니다. 관리자 승인 후 공개됩니다.'
        })
      }

      // 폼 초기화
      setRating(5)
      setContent('')
      setImageFile(null)
      setImagePreview(null)

      // 페이지 새로고침하여 후기 목록 갱신
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.message || '후기 작성에 실패했습니다'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id)
    setRating(review.rating)
    setContent(review.content)
    setImagePreview(review.imageUrl)
    setActiveTab('reviews')
    // 폼으로 스크롤
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setRating(5)
    setContent('')
    setImageFile(null)
    setImagePreview(null)
    setSubmitMessage(null)
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('정말 이 후기를 삭제하시겠습니까?')) {
      return
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '후기 삭제에 실패했습니다')
      }

      alert(data.message || '후기가 삭제되었습니다.')
      router.refresh()
    } catch (error: any) {
      alert(error.message || '후기 삭제에 실패했습니다')
    }
  }

  return (
    <div id="qna-section">
      <style dangerouslySetInnerHTML={{ __html: htmlContentStyle }} />
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-3 text-base sm:text-lg font-semibold transition-colors border-b-3 ${
              activeTab === 'description'
                ? 'border-b-2 border-gray-900 text-gray-900 bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            } rounded-t-lg`}
          >
            설명
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-3 text-base sm:text-lg font-semibold transition-colors border-b-3 ${
              activeTab === 'curriculum'
                ? 'border-b-2 border-gray-900 text-gray-900 bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            } rounded-t-lg`}
          >
            커리큘럼
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-3 text-base sm:text-lg font-semibold transition-colors border-b-3 ${
              activeTab === 'schedule'
                ? 'border-b-2 border-gray-900 text-gray-900 bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            } rounded-t-lg`}
          >
            일정
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-3 text-base sm:text-lg font-semibold transition-colors border-b-3 ${
              activeTab === 'reviews'
                ? 'border-b-2 border-gray-900 text-gray-900 bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            } rounded-t-lg`}
          >
            후기 ({reviews.length})
          </button>
          <button
            data-tab="qna"
            onClick={() => setActiveTab('qna')}
            className={`px-4 py-3 text-base sm:text-lg font-semibold transition-colors border-b-3 ${
              activeTab === 'qna'
                ? 'border-b-2 border-gray-900 text-gray-900 bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            } rounded-t-lg`}
          >
            Q&A ({qnaCount})
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`px-4 py-3 text-base sm:text-lg font-semibold transition-colors border-b-3 ${
              activeTab === 'refund'
                ? 'border-b-2 border-gray-900 text-gray-900 bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            } rounded-t-lg`}
          >
            주의사항
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === 'description' && (
          <div>
            {/* 이미지/텍스트 서브탭 */}
            {descriptionImages.length > 0 && (
              <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                  onClick={() => setDescriptionViewMode('image')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    descriptionViewMode === 'image'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  이미지 보기
                </button>
                <button
                  onClick={() => setDescriptionViewMode('text')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    descriptionViewMode === 'text'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  텍스트 보기
                </button>
              </div>
            )}

            {descriptionViewMode === 'image' && descriptionImages.length > 0 ? (
              <div className="flex flex-col items-center gap-2">
                {descriptionImages.map((url, index) => (
                  <div
                    key={index}
                    className="relative w-full max-w-[400px] aspect-[9/16] bg-gray-100 overflow-hidden cursor-pointer group"
                    onClick={() => setPreviewImage(url)}
                  >
                    <img
                      src={url}
                      alt={`강의 설명 이미지 ${index + 1}`}
                      className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="course-html-content"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div>
            {/* 이미지/텍스트 서브탭 */}
            {curriculumImages.length > 0 && (
              <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                  onClick={() => setCurriculumViewMode('image')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    curriculumViewMode === 'image'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  이미지 보기
                </button>
                <button
                  onClick={() => setCurriculumViewMode('text')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    curriculumViewMode === 'text'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  텍스트 보기
                </button>
              </div>
            )}

            {curriculumViewMode === 'image' && curriculumImages.length > 0 ? (
              <div className="flex flex-col items-center gap-2">
                {curriculumImages.map((url, index) => (
                  <div
                    key={index}
                    className="relative w-full max-w-[400px] aspect-[9/16] bg-gray-100 overflow-hidden cursor-pointer group"
                    onClick={() => setPreviewImage(url)}
                  >
                    <img
                      src={url}
                      alt={`커리큘럼 이미지 ${index + 1}`}
                      className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="course-html-content"
                dangerouslySetInnerHTML={{ __html: curriculum }}
              />
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            {schedules.length > 0 ? (
              <div className="space-y-6">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {schedule.cohort}기
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        new Date(schedule.endDate) < new Date()
                          ? 'bg-gray-200 text-gray-600'
                          : new Date(schedule.startDate) > new Date()
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {new Date(schedule.endDate) < new Date()
                          ? '종료'
                          : new Date(schedule.startDate) > new Date()
                          ? '모집중'
                          : '진행중'}
                      </span>
                    </div>

                    {schedule.sessions && schedule.sessions.length > 0 ? (
                      <div className="space-y-3">
                        {schedule.sessions.map((session) => {
                          const sessionDate = new Date(session.sessionDate)
                          const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][sessionDate.getDay()]
                          const year = sessionDate.getFullYear()
                          const month = sessionDate.getMonth() + 1
                          const date = sessionDate.getDate()

                          return (
                            <div key={session.id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1">
                                <div className="text-gray-900 font-medium">
                                  {year}년 {month}월 {date}일 {dayOfWeek}요일
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {schedule.cohort}기 {session.sessionNumber}차 ({session.startTime}~{session.endTime})
                                </div>
                                {session.topic && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {session.topic}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        <div className="mb-2">
                          시작: {new Date(schedule.startDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </div>
                        <div>
                          종료: {new Date(schedule.endDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                등록된 일정이 없습니다
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                수강 후기
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                  <span className="text-yellow-400 ml-2">★</span>
                </div>
                <span>({reviews.length}개의 후기)</span>
              </div>
            </div>

            {/* 후기 작성 폼 */}
            {(canWriteReview || editingReviewId) && session && (
              <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingReviewId ? '후기 수정하기' : '후기 작성하기'}
                </h3>
                <form onSubmit={handleSubmitReview}>
                  {/* 평점 선택 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      평점
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-3xl focus:outline-none"
                        >
                          <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        </button>
                      ))}
                      <span className="ml-2 text-gray-700 self-center">{rating}점</span>
                    </div>
                  </div>

                  {/* 후기 내용 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      후기 내용
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                      placeholder="수강 후기를 작성해주세요"
                    />
                  </div>

                  {/* 이미지 업로드 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이미지 첨부 (선택)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-700"
                    />
                    {imagePreview && (
                      <div className="mt-3 relative inline-block">
                        <img
                          src={imagePreview}
                          alt="미리보기"
                          className="max-w-xs rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 제출 메시지 */}
                  {submitMessage && (
                    <div className={`mb-4 p-4 rounded-lg ${
                      submitMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {submitMessage.text}
                    </div>
                  )}

                  {/* 제출 버튼 */}
                  <div className="flex gap-3">
                    {editingReviewId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-300 text-gray-900 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                      >
                        취소
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || !content.trim()}
                      className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (editingReviewId ? '수정 중...' : '등록 중...') : (editingReviewId ? '후기 수정하기' : '후기 등록하기')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 로그인 안내 */}
            {!session && (
              <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <p className="text-gray-600 mb-4">후기를 작성하려면 로그인이 필요합니다</p>
                <button
                  onClick={() => router.push('/login')}
                  className="inline-block bg-gray-900 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  로그인하기
                </button>
              </div>
            )}

            {/* 수강 필요 안내 */}
            {session && !canWriteReview && (
              <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <p className="text-gray-600">이 강의를 수강한 학생만 후기를 작성할 수 있습니다</p>
              </div>
            )}

            {/* 후기 목록 */}
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                아직 등록된 후기가 없습니다
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{review.user.name}</span>
                          {review.cohort && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {review.cohort}기
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {/* 본인 후기인 경우 수정/삭제 버튼 */}
                        {session && review.userId === parseInt(session.user.id) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{review.content}</p>
                    {review.imageUrl && (
                      <img
                        src={review.imageUrl}
                        alt="후기 이미지"
                        className="max-w-md rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'qna' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Q&A
              </h2>
              <p className="text-gray-600">
                {instructor ? `${instructor.name} 강사님께 궁금한 점을 질문하세요` : '강사님께 궁금한 점을 질문하세요'}
              </p>
            </div>

            {/* Q&A 작성 폼 */}
            {session ? (
              <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  문의하기
                </h3>
                <form onSubmit={handleSubmitQna}>
                  {/* 제목 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 (선택)
                    </label>
                    <input
                      type="text"
                      value={qnaTitle}
                      onChange={(e) => setQnaTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                      placeholder="문의 제목을 입력해주세요"
                    />
                  </div>

                  {/* 문의 내용 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문의 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={qnaMessage}
                      onChange={(e) => setQnaMessage(e.target.value)}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                      placeholder="강의에 대한 궁금한 점을 작성해주세요"
                    />
                  </div>

                  {/* 공개 안내 */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      모든 문의는 다른 수강생에게도 공개됩니다. 문의자는 별명으로 표시됩니다.
                    </p>
                  </div>

                  {/* 제출 메시지 */}
                  {qnaSubmitMessage && (
                    <div className={`mb-4 p-4 rounded-lg ${
                      qnaSubmitMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {qnaSubmitMessage.text}
                    </div>
                  )}

                  {/* 제출 버튼 */}
                  <button
                    type="submit"
                    disabled={qnaSubmitting || !qnaMessage.trim()}
                    className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {qnaSubmitting ? '등록 중...' : '문의 등록하기'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <p className="text-gray-600 mb-4">문의를 작성하려면 로그인이 필요합니다</p>
                <button
                  onClick={() => router.push('/login')}
                  className="inline-block bg-gray-900 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  로그인하기
                </button>
              </div>
            )}

            {/* Q&A 목록 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Q&A 목록
              </h3>
              {qnaLoading ? (
                <div className="text-center py-12 text-gray-500">
                  로딩 중...
                </div>
              ) : qnas.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  아직 등록된 Q&A가 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {qnas.map((qna) => (
                    <div key={qna.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* 질문 */}
                      <div className="p-5 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">Q</span>
                            <span className="text-sm text-gray-600">{qna.user.nickname || qna.user.name}</span>
                            <span className="text-xs text-gray-400">{formatDate(qna.createdAt)}</span>
                          </div>
                          {/* 본인 문의인 경우 삭제 버튼 */}
                          {session && qna.user.id === parseInt(session.user.id) && (
                            <button
                              onClick={() => handleDeleteQna(qna.id)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        {qna.title && (
                          <h4 className="font-semibold text-gray-900 mb-2">{qna.title}</h4>
                        )}
                        <p className="text-gray-700 whitespace-pre-wrap">{qna.message}</p>
                      </div>

                      {/* 답변 */}
                      {qna.response ? (
                        <div className="p-5 bg-green-50 border-t border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-green-800">A</span>
                            <span className="text-sm text-green-700">{instructor?.name || '강사'} 강사님</span>
                            {qna.respondedAt && (
                              <span className="text-xs text-green-600">{formatDate(qna.respondedAt)}</span>
                            )}
                          </div>
                          <p className="text-green-900 whitespace-pre-wrap">{qna.response}</p>
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-center">
                          <span className="text-sm text-yellow-700">답변 대기중입니다</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="space-y-6">
            {/* 환불 정책 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  환불 정책
                </h2>
                <p className="text-sm text-gray-500">2025.06.08</p>
              </div>

              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">제 1 조 (목적)</h3>
                  <p className="text-sm leading-relaxed">
                    본 환불 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 「평생교육법 시행령」에 근거하여, 수강 철회 및 환불 요청에 대한 기준을 정함으로써 이용자의 권익 보호를 목적으로 합니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">제 2 조 (수강 시작 전 환불)</h3>
                  <p className="text-sm mb-2">① 개강일 이전까지는 전액 환불이 가능합니다.</p>
                  <p className="text-sm mb-2">② 단, 아래 각 호의 사유에 해당하는 경우에는 환불이 제한됩니다.</p>
                  <div className="ml-4 space-y-1 text-sm">
                    <p>1. 콘텐츠를 열람 또는 다운로드한 경우</p>
                    <p>2. 부가 혜택(템플릿, 자료 등)을 수령한 경우</p>
                    <p>3. 환불 제한에 동의한 경우</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">제 3 조 (수강 시작 후 환불)</h3>
                  <p className="text-sm mb-2">① 수강 개시 후 환불은 다음 기준에 따라 처리됩니다.</p>
                  <div className="ml-4 space-y-1 text-sm mb-2">
                    <p>1. 전체 강의의 1/3 경과 전: 수강료의 2/3 환불</p>
                    <p>2. 전체 강의의 1/3 초과 ~ 1/2 경과 전: 수강료의 1/3 환불</p>
                    <p>3. 전체 강의의 1/2 경과 후: 환불 불가</p>
                  </div>
                  <p className="text-sm">② 경과 기준은 이용자의 개인 진도와 무관하며, 회사가 제공한 커리큘럼 주차를 기준으로 산정합니다.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">제 4 조 (디지털 콘텐츠 열람 시 환불 제한)</h3>
                  <p className="text-sm">
                    강의 영상, 자료, 템플릿, 과제, 퀴즈 등 콘텐츠에 1회 이상 접근한 경우, 해당 수강권은 환불이 불가합니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">제 5 조 (수강 혜택 제공 시 환불 제한)</h3>
                  <p className="text-sm">
                    유료 템플릿, 피드백, 멘토링, 기타 프로모션 혜택이 제공된 경우, 해당 수강권은 환불이 제한됩니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">제 6 조 (환불 신청 및 처리)</h3>
                  <p className="text-sm mb-2">① 환불 신청은 고객센터를 통해 접수하며, 접수일로부터 영업일 기준 5일 이내에 처리됩니다.</p>
                  <p className="text-sm">② 환불은 원 결제수단을 통해 진행되며, 결제사 정책에 따라 환불 완료까지 일정 기간이 소요될 수 있습니다.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">제 7 조 (기타 사항)</h3>
                  <p className="text-sm mb-1">① 수강 등록일로부터 6개월간 [내 강의실]에서 반복 수강이 가능합니다.</p>
                  <p className="text-sm mb-1">② 본 환불 정책은 수강 등록(결제) 시 이용자에게 고지되며, 이용자가 이에 동의함으로써 적용됩니다.</p>
                  <p className="text-sm">③ 정당한 사유 없이 환불이 반복될 경우, 플랫폼 서비스 이용에 제한될 수 있습니다.</p>
                </div>
              </div>
            </div>

            {/* 개인정보처리방침 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  개인정보처리방침
                </h2>
                <p className="text-sm text-gray-500">2025.06.08</p>
              </div>

              <div className="space-y-6 text-gray-700 text-sm">
                <p className="leading-relaxed">
                  '텐마일즈'(이하 "회사"는) 고객님의 개인정보를 중요시하며, "개인정보 보호법" 등 관련 법령을 준수하고 있습니다.
                  회사는 개인정보처리방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                </p>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">■ 수집하는 개인정보 항목 및 수집방법</h3>
                  <div className="space-y-2">
                    <p className="font-medium">가. 수집하는 개인정보의 항목</p>
                    <p>회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                    <ul className="ml-4 space-y-1">
                      <li>- 회원가입시: 이름, 생년월일, 성별, 로그인ID, 비밀번호, 자택 전화번호, 휴대전화번호, 이메일</li>
                      <li>- 서비스 신청시: 주소, 결제 정보</li>
                    </ul>
                    <p className="mt-2">서비스 이용 과정이나 사업 처리 과정에서 서비스이용기록, 접속로그, 쿠키, 접속 IP, 결제 기록, 불량이용 기록이 생성되어 수집될 수 있습니다.</p>

                    <p className="font-medium mt-4">나. 수집방법</p>
                    <p>홈페이지, 서면양식, 게시판, 이메일, 이벤트 응모, 배송요청, 전화, 팩스, 생성 정보 수집 툴을 통한 수집</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">■ 개인정보의 수집 및 이용목적</h3>
                  <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                  <ul className="ml-4 space-y-2 mt-2">
                    <li>• 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산</li>
                    <li>• 회원 관리: 본인확인, 개인 식별, 불량회원의 부정 이용 방지, 가입 의사 확인, 민원처리, 고지사항 전달</li>
                    <li>• 마케팅 및 광고에 활용: 이벤트 등 광고성 정보 전달, 접속 빈도 파악</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">■ 개인정보의 보유 및 이용기간</h3>
                  <p className="mb-2">원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                  <p className="font-medium mt-3">관련 법령에 의한 정보 보유:</p>
                  <ul className="ml-4 space-y-1 mt-2">
                    <li>• 계약 또는 청약철회 등에 관한 기록: 5년</li>
                    <li>• 대금 결제 및 재화 등의 공급에 관한 기록: 5년</li>
                    <li>• 소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                    <li>• 로그 기록: 3개월</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">■ 개인정보의 파기절차 및 방법</h3>
                  <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다.</p>
                  <p className="mt-2">전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">■ 개인정보에 관한 민원서비스</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="font-medium text-gray-900 mb-1">개인정보보호담당자</p>
                      <ul className="space-y-0.5">
                        <li>성명: 조훈상</li>
                        <li>소속: 텐마일즈</li>
                        <li>전화번호: 010-2590-2434</li>
                        <li>이메일: hi@vibeclass.kr</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">개인정보보호책임자</p>
                      <ul className="space-y-0.5">
                        <li>성명: 조훈상</li>
                        <li>소속: 텐마일즈</li>
                        <li>전화번호: 010-2590-2434</li>
                        <li>이메일: hi@vibeclass.kr</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="font-medium">기타 개인정보침해 신고 및 상담 기관:</p>
                    <ul className="ml-4 space-y-0.5">
                      <li>• 개인정보침해신고센터 (privacy.kisa.or.kr / 국번 없이 118)</li>
                      <li>• 개인정보분쟁조정위원회 (kopico.go.kr / 1833-6972)</li>
                      <li>• 대검찰청 사이버수사과 (spo.go.kr / 지역번호+1301)</li>
                      <li>• 경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                수강 주의사항
              </h2>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">•</span>
                  <span>수강 신청 후 강의 시작 전까지 취소가 가능합니다.</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">•</span>
                  <span>강의 시작 시간 10분 전부터 Zoom 링크를 통해 입장할 수 있습니다.</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">•</span>
                  <span>강의 자료는 수강 기간 동안 다운로드 가능합니다.</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">•</span>
                  <span>강의 녹화본은 저작권 보호를 위해 제공되지 않습니다.</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">•</span>
                  <span>최소 인원 미달 시 강의가 취소될 수 있으며, 이 경우 전액 환불됩니다.</span>
                </div>
              </div>
            </div>

          </div>
        )}
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
    </div>
  )
}
