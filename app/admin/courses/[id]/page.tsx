'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
import PromoImageModal from '@/components/course/PromoImageModal'

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

interface Course {
  id: number
  title: string
  description: string
  curriculum: string
  price: number
  isFree: boolean
  capacity: number
  status: string
  thumbnailUrl: string | null
  category: {
    id: number
    name: string
  }
  instructor: {
    id: number
    name: string
  } | null
  schedules: Schedule[]
}

interface Schedule {
  id: number
  cohort: number
  startDate: string
  endDate: string
  meetId: string | null
  meetLink: string | null
  kakaoTalkLink: string | null
  status: string
  sessions: Session[]
  _count: {
    enrollments: number
  }
}

interface Session {
  id: number
  sessionNumber: number
  sessionDate: string
  startTime: string
  endTime: string
  topic: string | null
  meetLink: string | null
  meetId: string | null
}

interface Student {
  id: number
  status: string
  createdAt: string
  user: {
    id: number
    name: string
    email: string
    phone: string | null
  }
  payment: {
    amount: number
    status: string
    method: string
    apprDt: string | null
  } | null
}

export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [courseId, setCourseId] = useState<string | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [currentScheduleId, setCurrentScheduleId] = useState<number | null>(null)
  const [viewingStudents, setViewingStudents] = useState<number | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [generatingCurriculum, setGeneratingCurriculum] = useState(false)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoModalTab, setPromoModalTab] = useState<'description' | 'curriculum'>('description')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // 페이지당 기수 개수

  const [courses, setCourses] = useState<any[]>([])
  const descriptionImageRef = useRef<HTMLInputElement>(null)
  const curriculumImageRef = useRef<HTMLInputElement>(null)
  const [showImageManager, setShowImageManager] = useState<'description' | 'curriculum' | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
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
    status: 'active',
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
    youtubeUrls: [] as string[],
    descriptionImages: [] as string[],
    curriculumImages: [] as string[],
  })

  const [scheduleForm, setScheduleForm] = useState({
    cohort: '',
    startDate: '',
    endDate: '',
    status: 'scheduled',
    meetLink: '',
    kakaoTalkLink: '',
  })

  const [sessionForm, setSessionForm] = useState({
    sessionNumber: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    topic: '',
  })

  useEffect(() => {
    params.then(({ id }) => {
      setCourseId(id)
    })
  }, [params])

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchCategories()
      fetchInstructors()
      fetchCourses()
    }
  }, [courseId])

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

  const fetchCourse = async () => {
    if (!courseId) return
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      const data = await res.json()
      if (data.success) {
        setCourse(data.course)
        setFormData({
          title: data.course.title,
          description: data.course.description,
          curriculum: data.course.curriculum || '',
          instructions: data.course.instructions || '',
          price: data.course.price,
          isFree: data.course.isFree,
          capacity: data.course.capacity,
          categoryId: data.course.category.id,
          instructorId: data.course.instructor?.id || 0,
          thumbnailUrl: data.course.thumbnailUrl || '',
          status: data.course.status,
          parentId: data.course.parentId || null,
          level: data.course.level || 'basic',
          order: data.course.order || 0,
          isRequired: data.course.isRequired || false,
          courseType: data.course.courseType || 'online',
          location: data.course.location || '',
          locationAddress: data.course.locationAddress || '',
          locationMapUrl: data.course.locationMapUrl || '',
          locationLat: data.course.locationLat || null,
          locationLng: data.course.locationLng || null,
          locationNote: data.course.locationNote || '',
          youtubeUrls: data.course.youtubeUrls || [],
          descriptionImages: data.course.descriptionImages || [],
          curriculumImages: data.course.curriculumImages || [],
        })
        // 기존 썸네일이 있으면 미리보기에 표시
        if (data.course.thumbnailUrl) {
          setPreviewUrl(data.course.thumbnailUrl)
        }
      }
    } catch (error) {
      console.error('강의 조회 실패:', error)
    } finally {
      setLoading(false)
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
    } catch (error: any) {
      console.error('업로드 실패:', error)
      const errorMsg = error.message || '업로드에 실패했습니다'
      alert(errorMsg)
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

  // 에디터 이미지 업로드 처리
  const handleEditorImageChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'description' | 'curriculum') => {
    console.log('handleEditorImageChange called', target)
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name, file.type, file.size)

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다')
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다')
      return
    }

    try {
      console.log('Starting upload...')
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      console.log('Upload response status:', res.status)
      const data = await res.json()
      console.log('Upload response data:', data)

      if (data.success && data.url) {
        // 절대 URL로 변환
        const fullUrl = data.url.startsWith('http') ? data.url : `${window.location.origin}${data.url}`
        console.log('Full URL:', fullUrl)
        // 이미지 태그를 현재 값 끝에 추가
        const imgHtml = `<p><img src="${fullUrl}" alt="uploaded image" /></p>`
        console.log('Image HTML:', imgHtml)
        if (target === 'description') {
          setFormData(prev => ({
            ...prev,
            description: prev.description + imgHtml
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            curriculum: prev.curriculum + imgHtml
          }))
        }
        alert('이미지가 추가되었습니다')
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다')
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드에 실패했습니다')
    }

    // 입력 초기화
    e.target.value = ''
  }

  // Quill 모듈 설정
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'video'],
      ['clean']
    ]
  }), [])

  // HTML에서 이미지 URL 추출
  const extractImages = (html: string): string[] => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g
    const images: string[] = []
    let match
    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1])
    }
    return images
  }

  // 이미지 순서 변경
  const moveImage = (target: 'description' | 'curriculum', fromIndex: number, toIndex: number) => {
    const html = target === 'description' ? formData.description : formData.curriculum
    const images = extractImages(html)

    if (fromIndex < 0 || fromIndex >= images.length || toIndex < 0 || toIndex >= images.length) return

    // 이미지 순서 변경
    const [movedImage] = images.splice(fromIndex, 1)
    images.splice(toIndex, 0, movedImage)

    // HTML 재구성 - 이미지를 제거하고 새 순서로 다시 추가
    let newHtml = html.replace(/<p>\s*<img[^>]+>\s*<\/p>/g, '').replace(/<img[^>]+>/g, '')

    // 이미지 태그들을 끝에 추가
    const imageTags = images.map(src => `<p><img src="${src}" alt="uploaded image" /></p>`).join('')
    newHtml = newHtml + imageTags

    if (target === 'description') {
      setFormData(prev => ({ ...prev, description: newHtml }))
    } else {
      setFormData(prev => ({ ...prev, curriculum: newHtml }))
    }
  }

  // 이미지 삭제
  const deleteImage = (target: 'description' | 'curriculum', index: number) => {
    const html = target === 'description' ? formData.description : formData.curriculum
    const images = extractImages(html)

    if (index < 0 || index >= images.length) return

    const imageToDelete = images[index]
    // 해당 이미지만 삭제
    const newHtml = html
      .replace(new RegExp(`<p>\\s*<img[^>]+src="${imageToDelete.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>\\s*</p>`, 'g'), '')
      .replace(new RegExp(`<img[^>]+src="${imageToDelete.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'), '')

    if (target === 'description') {
      setFormData(prev => ({ ...prev, description: newHtml }))
    } else {
      setFormData(prev => ({ ...prev, curriculum: newHtml }))
    }
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await fetchCourse()
        setEditing(false)
        alert('강의가 수정되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '수정에 실패했습니다')
      }
    } catch (error) {
      console.error('수정 실패:', error)
      alert('수정에 실패했습니다')
    }
  }

  const handleDeleteCourse = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    if (!courseId) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('강의가 삭제되었습니다')
        router.push('/admin/courses')
      } else {
        const error = await res.json()
        alert(error.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return
    try {
      const url = editingScheduleId
        ? `/api/admin/courses/${courseId}/schedules/${editingScheduleId}`
        : `/api/admin/courses/${courseId}/schedules`
      const method = editingScheduleId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      })

      if (res.ok) {
        await fetchCourse()
        setShowScheduleForm(false)
        setEditingScheduleId(null)
        setCurrentPage(1) // 페이지를 첫 페이지로 리셋
        setScheduleForm({
          cohort: '',
          startDate: '',
          endDate: '',
          status: 'scheduled',
          meetLink: '',
          kakaoTalkLink: '',
        })
        alert(editingScheduleId ? '기수가 수정되었습니다' : '기수가 추가되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다')
    }
  }

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !currentScheduleId) return
    try {
      const url = editingSessionId
        ? `/api/admin/courses/${courseId}/schedules/${currentScheduleId}/sessions/${editingSessionId}`
        : `/api/admin/courses/${courseId}/schedules/${currentScheduleId}/sessions`
      const method = editingSessionId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      })

      if (res.ok) {
        await fetchCourse()
        setShowSessionForm(false)
        setEditingSessionId(null)
        setCurrentScheduleId(null)
        setSessionForm({
          sessionNumber: '',
          sessionDate: '',
          startTime: '',
          endTime: '',
          topic: '',
        })
        alert(editingSessionId ? '회차가 수정되었습니다' : '회차가 추가되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다')
    }
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id)
    setScheduleForm({
      cohort: schedule.cohort.toString(),
      startDate: schedule.startDate.split('T')[0],
      endDate: schedule.endDate.split('T')[0],
      status: schedule.status,
      meetLink: schedule.meetLink || '',
      kakaoTalkLink: schedule.kakaoTalkLink || '',
    })
    setShowScheduleForm(true)
  }

  const handleEditSession = (scheduleId: number, session: Session) => {
    setCurrentScheduleId(scheduleId)
    setEditingSessionId(session.id)
    setSessionForm({
      sessionNumber: session.sessionNumber.toString(),
      sessionDate: session.sessionDate.split('T')[0],
      startTime: session.startTime,
      endTime: session.endTime,
      topic: session.topic || '',
    })
    setShowSessionForm(true)
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    if (!courseId) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchCourse()
        // 현재 페이지에서 마지막 항목을 삭제한 경우 이전 페이지로 이동
        if (course && course.schedules.length % itemsPerPage === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
        alert('기수가 삭제되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const handleDeleteSession = async (scheduleId: number, sessionId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    if (!courseId) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/schedules/${scheduleId}/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchCourse()
        alert('회차가 삭제되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const handleViewStudents = async (scheduleId: number) => {
    if (!courseId) return
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/schedules/${scheduleId}/students`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.enrollments)
        setViewingStudents(scheduleId)
      }
    } catch (error) {
      console.error('수강생 조회 실패:', error)
      alert('수강생 조회에 실패했습니다')
    }
  }

  const handleToggleStatus = async () => {
    if (!courseId) return
    const newStatus = course?.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        await fetchCourse()
        alert(`강의가 ${newStatus === 'active' ? '활성화' : '비활성화'}되었습니다`)
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다')
    }
  }

  const handleCreateMeetLink = async (scheduleId: number, sessionId: number) => {
    if (!courseId) return
    if (!confirm('Zoom 미팅 링크를 생성하시겠습니까?\n(회차 시작 30분 전 ~ 종료 30분 후)')) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/schedules/${scheduleId}/sessions/${sessionId}/create-meet`, {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success) {
        await fetchCourse()
        const passwordInfo = data.password ? `\n비밀번호: ${data.password}` : ''
        alert(`Zoom 미팅 링크가 생성되었습니다!\n${data.meetLink}${passwordInfo}`)
      } else {
        alert(data.error || 'Zoom 미팅 링크 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Zoom 미팅 링크 생성 실패:', error)
      alert('Zoom 미팅 링크 생성에 실패했습니다')
    }
  }

  if (loading) {
    return <div className="text-gray-600">로딩 중...</div>
  }

  if (!course) {
    return <div className="text-gray-600">강의를 찾을 수 없습니다</div>
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: quillEditorStyle }} />
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {course.category.name} | {course.instructor?.name || '강사 미정'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-md text-white font-medium ${course.status === 'active'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {course.status === 'active' ? '비활성화' : '활성화'}
            </button>
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  수정
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  삭제
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 강의 정보 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        {editing ? (
          <form onSubmit={handleUpdateCourse} className="space-y-4">
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
                <button
                  type="button"
                  onClick={() => setShowPromoModal(true)}
                  disabled={!formData.title}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  4. 프로모션 이미지 ({formData.descriptionImages.length + formData.curriculumImages.length}/6)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              />
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI 생성 지시사항 <span className="text-yellow-600">(설명 & 커리큘럼 자동 생성용)</span>
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
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
                💡 AI가 강의 설명과 커리큘럼을 생성할 때 이 지시사항을 참고합니다.<br />
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
                      placeholder="예: 지하철 2호선 강남역 3번 출구에서 도보 5분. 건물 1층에 편의점이 있습니다."
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
                    {courses.filter(c => c.id !== parseInt(courseId || '0')).map((course) => (
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
                <span className="text-xs text-gray-500 ml-2">(오른쪽 하단 모서리를 드래그하여 높이 조절)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  ref={descriptionImageRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditorImageChange(e, 'description')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => descriptionImageRef.current?.click()}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  이미지 추가
                </button>
                {extractImages(formData.description).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowImageManager('description')}
                    className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    이미지 순서 ({extractImages(formData.description).length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPromoModalTab('description')
                    setShowPromoModal(true)
                  }}
                  disabled={!formData.title}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded hover:from-pink-600 hover:to-rose-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  프로모션 이미지 ({formData.descriptionImages.length})
                </button>
              </div>
              <div className="bg-white mb-4 border-2 border-gray-300 rounded resize-y overflow-auto" style={{ height: '400px', minHeight: '200px', maxHeight: '1200px' }}>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  modules={quillModules}
                  style={{ height: 'calc(100% - 42px)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                커리큘럼
                <span className="text-xs text-gray-500 ml-2">(오른쪽 하단 모서리를 드래그하여 높이 조절)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  ref={curriculumImageRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditorImageChange(e, 'curriculum')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => curriculumImageRef.current?.click()}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  이미지 추가
                </button>
                {extractImages(formData.curriculum).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowImageManager('curriculum')}
                    className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    이미지 순서 ({extractImages(formData.curriculum).length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPromoModalTab('curriculum')
                    setShowPromoModal(true)
                  }}
                  disabled={!formData.title}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded hover:from-pink-600 hover:to-rose-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  프로모션 이미지 ({formData.curriculumImages.length})
                </button>
              </div>
              <div className="bg-white mb-4 border-2 border-gray-300 rounded resize-y overflow-auto" style={{ height: '400px', minHeight: '200px', maxHeight: '1200px' }}>
                <ReactQuill
                  theme="snow"
                  value={formData.curriculum}
                  onChange={(value) => setFormData({ ...formData, curriculum: value })}
                  modules={quillModules}
                  style={{ height: 'calc(100% - 42px)' }}
                  placeholder="주차별 커리큘럼을 입력하세요"
                />
              </div>
            </div>

            {/* 유튜브 링크 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참조 유튜브 영상
                <span className="text-gray-500 font-normal ml-2">(강의 페이지 상단에 표시됩니다)</span>
              </label>
              <div className="space-y-2">
                {formData.youtubeUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...formData.youtubeUrls]
                        newUrls[index] = e.target.value
                        setFormData({ ...formData, youtubeUrls: newUrls })
                      }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newUrls = formData.youtubeUrls.filter((_, i) => i !== index)
                        setFormData({ ...formData, youtubeUrls: newUrls })
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, youtubeUrls: [...formData.youtubeUrls, ''] })}
                  className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md border border-indigo-300"
                >
                  + 유튜브 링크 추가
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700">무료 강의</span>
                </label>
              </div>
              {!formData.isFree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정원</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                />
              </div>
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                저장
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">설명</h3>
              <div
                className="mt-1 text-gray-900 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </div>
            {course.curriculum && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">커리큘럼</h3>
                <div
                  className="mt-1 text-gray-900 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: course.curriculum }}
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">가격</h3>
                <p className="mt-1 text-gray-900">
                  {course.isFree ? '무료' : `${course.price.toLocaleString()}원`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">정원</h3>
                <p className="mt-1 text-gray-900">{course.capacity}명</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">상태</h3>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs rounded ${course.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                    {course.status === 'active' ? '활성' : '비활성'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 기수 관리 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">기수 관리</h2>
          <button
            onClick={() => {
              setShowScheduleForm(true)
              setEditingScheduleId(null)
              // 자동으로 다음 기수 번호 설정
              const nextCohort = course?.schedules.length
                ? Math.max(...course.schedules.map(s => s.cohort)) + 1
                : 1
              setScheduleForm({
                cohort: nextCohort.toString(),
                startDate: '',
                endDate: '',
                status: 'scheduled',
                meetLink: '',
                kakaoTalkLink: '',
              })
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            기수 추가
          </button>
        </div>

        {/* 기수 추가/수정 폼 */}
        {showScheduleForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingScheduleId ? '기수 수정' : '기수 추가'}
            </h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기수</label>
                  <input
                    type="number"
                    required
                    value={scheduleForm.cohort}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, cohort: e.target.value })}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.startDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.endDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={scheduleForm.status}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="scheduled">예정</option>
                    <option value="ongoing">진행중</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zoom 주소
                    <span className="text-xs text-gray-500 ml-1">(선택)</span>
                  </label>
                  <input
                    type="url"
                    value={scheduleForm.meetLink}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetLink: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z" />
                    </svg>
                    카카오톡 단톡방 주소
                    <span className="text-xs text-gray-500">(선택)</span>
                  </span>
                </label>
                <input
                  type="url"
                  value={scheduleForm.kakaoTalkLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, kakaoTalkLink: e.target.value })}
                  placeholder="https://open.kakao.com/o/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="mt-1 text-xs text-gray-500">기수별 카카오톡 오픈채팅방 주소를 입력하세요</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleForm(false)
                    setEditingScheduleId(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 기수 목록 */}
        {course.schedules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 기수가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                전체 {course.schedules.length}개 기수 (페이지 {currentPage} / {Math.ceil(course.schedules.length / itemsPerPage)})
              </p>
            </div>
            <div className="space-y-6">
              {course.schedules
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((schedule) => (
                  <div key={schedule.id} className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{schedule.cohort}기</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(schedule.startDate).toLocaleDateString('ko-KR')} ~ {new Date(schedule.endDate).toLocaleDateString('ko-KR')}
                        </p>
                        {schedule.meetLink && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                              Zoom
                            </span>
                            <a
                              href={schedule.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline truncate max-w-md"
                            >
                              {schedule.meetLink}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(schedule.meetLink!)
                                alert('링크가 복사되었습니다!')
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="링크 복사"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {schedule.kakaoTalkLink && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z" />
                              </svg>
                              카카오톡
                            </span>
                            <a
                              href={schedule.kakaoTalkLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-yellow-600 hover:underline truncate max-w-md"
                            >
                              {schedule.kakaoTalkLink}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(schedule.kakaoTalkLink!)
                                alert('링크가 복사되었습니다!')
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="링크 복사"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded ${schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            schedule.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                              schedule.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {schedule.status === 'scheduled' ? '예정' :
                            schedule.status === 'ongoing' ? '진행중' :
                              schedule.status === 'completed' ? '완료' : '취소'}
                        </span>
                        <span className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded">
                          수강생 {schedule._count.enrollments}명
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => {
                          setCurrentScheduleId(schedule.id)
                          setShowSessionForm(true)
                          setEditingSessionId(null)
                          // 자동으로 다음 회차 번호 설정
                          const nextSessionNumber = schedule.sessions.length
                            ? Math.max(...schedule.sessions.map(s => s.sessionNumber)) + 1
                            : 1
                          setSessionForm({
                            sessionNumber: nextSessionNumber.toString(),
                            sessionDate: '',
                            startTime: '',
                            endTime: '',
                            topic: '',
                          })
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        회차 추가
                      </button>
                      <button
                        onClick={() => handleViewStudents(schedule.id)}
                        className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                      >
                        수강생 보기
                      </button>
                      <button
                        onClick={() => router.push(`/admin/materials/${schedule.id}`)}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        자료실 관리
                      </button>
                      <button
                        onClick={() => router.push(`/admin/slides/${schedule.id}`)}
                        className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                      >
                        슬라이드 관리
                      </button>
                      <button
                        onClick={() => router.push(`/admin/videos/${schedule.id}`)}
                        className="px-3 py-1 text-sm bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                      >
                        영상 관리
                      </button>
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        기수 수정
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        기수 삭제
                      </button>
                    </div>

                    {/* 회차 추가/수정 폼 - 이 기수에만 표시 */}
                    {showSessionForm && currentScheduleId === schedule.id && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          {editingSessionId ? '회차 수정' : '회차 추가'}
                        </h3>
                        <form onSubmit={handleSessionSubmit} className="space-y-4">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">회차</label>
                              <input
                                type="number"
                                required
                                value={sessionForm.sessionNumber}
                                onChange={(e) => setSessionForm({ ...sessionForm, sessionNumber: e.target.value })}
                                placeholder="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                              <input
                                type="date"
                                required
                                value={sessionForm.sessionDate}
                                onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                              <select
                                required
                                value={sessionForm.startTime}
                                onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                              >
                                <option value="">선택하세요</option>
                                {Array.from({ length: 48 }, (_, i) => {
                                  const hour = Math.floor(i / 2).toString().padStart(2, '0')
                                  const minute = i % 2 === 0 ? '00' : '30'
                                  return `${hour}:${minute}`
                                }).map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                              <select
                                required
                                value={sessionForm.endTime}
                                onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                              >
                                <option value="">선택하세요</option>
                                {Array.from({ length: 48 }, (_, i) => {
                                  const hour = Math.floor(i / 2).toString().padStart(2, '0')
                                  const minute = i % 2 === 0 ? '00' : '30'
                                  return `${hour}:${minute}`
                                }).map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">주제</label>
                            <input
                              type="text"
                              value={sessionForm.topic}
                              onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                              placeholder="예: AI 기초 이론"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSessionForm(false)
                                setEditingSessionId(null)
                                setCurrentScheduleId(null)
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                              취소
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* 회차 목록 */}
                    {schedule.sessions.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">회차 목록</h4>
                        <div className="space-y-2">
                          {schedule.sessions.map((session) => (
                            <div key={session.id} className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="font-medium text-gray-900">{session.sessionNumber}회차</span>
                                  <span className="text-gray-600 ml-3">
                                    {new Date(session.sessionDate).toLocaleDateString('ko-KR')} {session.startTime} ~ {session.endTime}
                                  </span>
                                  {session.topic && (
                                    <span className="text-gray-500 ml-2">| {session.topic}</span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!session.meetLink && (
                                    <button
                                      onClick={() => handleCreateMeetLink(schedule.id, session.id)}
                                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      링크 생성
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleEditSession(schedule.id, session)}
                                    className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSession(schedule.id, session.id)}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                              {session.meetLink && (
                                <div className="text-xs text-gray-600 mt-1">
                                  <span className="font-medium">Zoom: </span>
                                  <a
                                    href={session.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {session.meetLink}
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 수강생 목록 */}
                    {viewingStudents === schedule.id && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">수강생 목록</h4>
                          <button
                            onClick={() => setViewingStudents(null)}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            닫기
                          </button>
                        </div>
                        {students.length === 0 ? (
                          <p className="text-sm text-gray-500">수강생이 없습니다</p>
                        ) : (
                          <div className="space-y-2">
                            {students.map((enrollment) => (
                              <div key={enrollment.id} className="bg-white p-3 rounded border border-gray-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">{enrollment.user.name}</p>
                                    <p className="text-sm text-gray-600">{enrollment.user.email}</p>
                                    {enrollment.user.phone && (
                                      <p className="text-sm text-gray-600">{enrollment.user.phone}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 text-xs rounded ${enrollment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                      }`}>
                                      {enrollment.status === 'confirmed' ? '수강중' :
                                        enrollment.status === 'completed' ? '수료' : '대기'}
                                    </span>
                                    {enrollment.payment && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {enrollment.payment.amount.toLocaleString()}원 ({enrollment.payment.method})
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* 페이지네이션 */}
            {course.schedules.length > itemsPerPage && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                <div className="flex gap-1">
                  {(() => {
                    const totalPages = Math.ceil(course.schedules.length / itemsPerPage)
                    const maxPagesToShow = 7
                    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
                    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

                    if (endPage - startPage + 1 < maxPagesToShow) {
                      startPage = Math.max(1, endPage - maxPagesToShow + 1)
                    }

                    const pages = []

                    // 첫 페이지
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => setCurrentPage(1)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          1
                        </button>
                      )
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis-start" className="px-2 text-gray-500">...</span>
                        )
                      }
                    }

                    // 중간 페이지들
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === i
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {i}
                        </button>
                      )
                    }

                    // 마지막 페이지
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis-end" className="px-2 text-gray-500">...</span>
                        )
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      )
                    }

                    return pages
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(course.schedules.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(course.schedules.length / itemsPerPage)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="미리보기"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* 이미지 순서 관리 모달 */}
      {showImageManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {showImageManager === 'description' ? '설명' : '커리큘럼'} 이미지 순서 관리
              </h3>
              <button
                onClick={() => setShowImageManager(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                const images = extractImages(showImageManager === 'description' ? formData.description : formData.curriculum)
                if (images.length === 0) {
                  return <p className="text-gray-500 text-center py-8">이미지가 없습니다</p>
                }
                return (
                  <div className="space-y-4">
                    {images.map((src, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <span className="text-lg font-bold text-gray-500 w-8">{index + 1}</span>
                        <img
                          src={src}
                          alt={`이미지 ${index + 1}`}
                          className="w-24 h-32 object-contain rounded border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors bg-white"
                          onClick={() => setPreviewImage(src)}
                        />
                        <div className="flex-1 text-sm text-gray-600 truncate">
                          {src}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(src)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                            title="미리보기"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(showImageManager, index, index - 1)}
                            disabled={index === 0}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="위로 이동"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(showImageManager, index, index + 1)}
                            disabled={index === images.length - 1}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="아래로 이동"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('이 이미지를 삭제하시겠습니까?')) {
                                deleteImage(showImageManager, index)
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                            title="삭제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowImageManager(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* 프로모션 이미지 생성 모달 */}
      {courseId && (
        <PromoImageModal
          isOpen={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          courseId={parseInt(courseId)}
          title={formData.title}
          description={formData.description}
          curriculum={formData.curriculum}
          category={categories.find(c => c.id === formData.categoryId)?.name || ''}
          descriptionImages={formData.descriptionImages}
          curriculumImages={formData.curriculumImages}
          onImagesUpdate={(type, images) => {
            setFormData(prev => ({
              ...prev,
              [type === 'description' ? 'descriptionImages' : 'curriculumImages']: images
            }))
          }}
          initialTab={promoModalTab}
          apiBasePath="/api/admin"
        />
      )}
    </div>
  )
}
