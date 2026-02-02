'use client'

import { useEffect, useState, useRef, use, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
import InstructorLayout from '@/components/instructor/InstructorLayout'
import PromoImageModal from '@/components/course/PromoImageModal'
import axios from 'axios'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-[200px] border rounded-lg bg-gray-50 animate-pulse" />
})

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-[200px] border rounded-lg bg-gray-50 animate-pulse" />
})

interface CourseData {
  id: number
  title: string
  description: string
  curriculum: string
  instructions: string | null
  thumbnailUrl: string | null
  category: {
    id: number
    name: string
  }
  price: number
  isFree: boolean
  status: string
  capacity: number
}

interface Session {
  id: number
  sessionNumber: number
  sessionDate: string
  startTime: string
  endTime: string
  topic: string | null
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
  sessions?: Session[]
  _count: {
    enrollments: number
  }
}

export default function InstructorCourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const courseId = resolvedParams.id
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const descriptionImageRef = useRef<HTMLInputElement>(null)
  const curriculumImageRef = useRef<HTMLInputElement>(null)
  const [showImageManager, setShowImageManager] = useState<'description' | 'curriculum' | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [generatingCurriculum, setGeneratingCurriculum] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [showImageSelectModal, setShowImageSelectModal] = useState(false)
  const [includeProfileImage, setIncludeProfileImage] = useState(true)
  const [instructorProfile, setInstructorProfile] = useState<{ imageUrl?: string } | null>(null)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoModalTab, setPromoModalTab] = useState<'description' | 'curriculum'>('description')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    curriculum: '',
    instructions: '',
    price: 0,
    isFree: false,
    status: 'active',
    capacity: 30,
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
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([])

  // 기수 관리 상태
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [scheduleFormData, setScheduleFormData] = useState({
    cohort: '',
    startDate: '',
    endDate: '',
    meetLink: '',
    kakaoTalkLink: '',
    status: 'scheduled'
  })

  // 차수(세션) 관리 상태
  const [expandedScheduleId, setExpandedScheduleId] = useState<number | null>(null)
  const [sessions, setSessions] = useState<{ [key: number]: Session[] }>({})
  const [sessionsLoading, setSessionsLoading] = useState<{ [key: number]: boolean }>({})
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [sessionFormData, setSessionFormData] = useState({
    sessionNumber: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    topic: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user.role !== 'instructor' && session?.user.role !== 'admin') {
      router.push('/')
      return
    }

    fetchCourse()
    fetchSchedules()
    fetchCategories()
    fetchProfile()
  }, [session, status, router, courseId])

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/instructor/profile')
      if (response.data && !response.data.error) {
        setInstructorProfile(response.data)
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories')
      if (Array.isArray(response.data)) {
        setCategories(response.data)
      } else if (response.data.categories) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error)
    }
  }

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/instructor/courses/${courseId}`)
      if (response.data.success) {
        const data = response.data.course
        setCourse(data)
        setFormData({
          title: data.title || '',
          description: data.description || '',
          curriculum: data.curriculum || '',
          instructions: data.instructions || '',
          price: data.price || 0,
          isFree: data.isFree || false,
          status: data.status || 'active',
          capacity: data.capacity || 30,
          courseType: data.courseType || 'online',
          location: data.location || '',
          locationAddress: data.locationAddress || '',
          locationMapUrl: data.locationMapUrl || '',
          locationLat: data.locationLat || null,
          locationLng: data.locationLng || null,
          locationNote: data.locationNote || '',
          youtubeUrls: data.youtubeUrls || [],
          descriptionImages: data.descriptionImages || [],
          curriculumImages: data.curriculumImages || [],
        })
      }
    } catch (error: any) {
      console.error('강의 조회 실패:', error)
      if (error.response?.status === 403) {
        router.push('/instructor/courses')
      }
      setMessage({ type: 'error', text: '강의를 불러올 수 없습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    setSchedulesLoading(true)
    try {
      const response = await axios.get(`/api/instructor/courses/${courseId}/schedules`)
      if (response.data.success) {
        setSchedules(response.data.schedules)
      }
    } catch (error) {
      console.error('기수 목록 조회 실패:', error)
    } finally {
      setSchedulesLoading(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!scheduleFormData.cohort || !scheduleFormData.startDate || !scheduleFormData.endDate) {
      setMessage({ type: 'error', text: '기수, 시작일, 종료일을 입력해주세요.' })
      return
    }

    try {
      if (editingSchedule) {
        // 수정
        const response = await axios.patch(
          `/api/instructor/courses/${courseId}/schedules/${editingSchedule.id}`,
          scheduleFormData
        )
        if (response.data.success) {
          setMessage({ type: 'success', text: '기수가 수정되었습니다.' })
          fetchSchedules()
        }
      } else {
        // 생성
        const response = await axios.post(
          `/api/instructor/courses/${courseId}/schedules`,
          scheduleFormData
        )
        if (response.data.success) {
          setMessage({ type: 'success', text: '기수가 추가되었습니다.' })
          fetchSchedules()
        }
      }
      resetScheduleForm()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '기수 저장에 실패했습니다.' })
    }
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setScheduleFormData({
      cohort: schedule.cohort.toString(),
      startDate: schedule.startDate.split('T')[0],
      endDate: schedule.endDate.split('T')[0],
      meetLink: schedule.meetLink || '',
      kakaoTalkLink: schedule.kakaoTalkLink || '',
      status: schedule.status
    })
    setShowScheduleForm(true)
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('이 기수를 삭제하시겠습니까?')) return

    try {
      const response = await axios.delete(`/api/instructor/courses/${courseId}/schedules/${scheduleId}`)
      if (response.data.success) {
        setMessage({ type: 'success', text: '기수가 삭제되었습니다.' })
        fetchSchedules()
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '기수 삭제에 실패했습니다.' })
    }
  }

  const resetScheduleForm = () => {
    setShowScheduleForm(false)
    setEditingSchedule(null)
    setScheduleFormData({
      cohort: '',
      startDate: '',
      endDate: '',
      meetLink: '',
      kakaoTalkLink: '',
      status: 'scheduled'
    })
  }

  // 세션(차수) 관련 함수들
  const fetchSessions = async (scheduleId: number) => {
    setSessionsLoading(prev => ({ ...prev, [scheduleId]: true }))
    try {
      const response = await axios.get(`/api/instructor/courses/${courseId}/schedules/${scheduleId}/sessions`)
      if (response.data.success) {
        setSessions(prev => ({ ...prev, [scheduleId]: response.data.sessions }))
      }
    } catch (error) {
      console.error('회차 목록 조회 실패:', error)
    } finally {
      setSessionsLoading(prev => ({ ...prev, [scheduleId]: false }))
    }
  }

  const toggleScheduleExpand = (scheduleId: number) => {
    if (expandedScheduleId === scheduleId) {
      setExpandedScheduleId(null)
    } else {
      setExpandedScheduleId(scheduleId)
      if (!sessions[scheduleId]) {
        fetchSessions(scheduleId)
      }
    }
  }

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedScheduleId) return

    if (!sessionFormData.sessionNumber || !sessionFormData.sessionDate || !sessionFormData.startTime || !sessionFormData.endTime) {
      setMessage({ type: 'error', text: '차수, 날짜, 시작시간, 종료시간을 입력해주세요.' })
      return
    }

    try {
      if (editingSession) {
        const response = await axios.patch(
          `/api/instructor/courses/${courseId}/schedules/${expandedScheduleId}/sessions/${editingSession.id}`,
          sessionFormData
        )
        if (response.data.success) {
          setMessage({ type: 'success', text: '차수가 수정되었습니다.' })
          fetchSessions(expandedScheduleId)
        }
      } else {
        const response = await axios.post(
          `/api/instructor/courses/${courseId}/schedules/${expandedScheduleId}/sessions`,
          sessionFormData
        )
        if (response.data.success) {
          setMessage({ type: 'success', text: '차수가 추가되었습니다.' })
          fetchSessions(expandedScheduleId)
        }
      }
      resetSessionForm()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '차수 저장에 실패했습니다.' })
    }
  }

  const handleEditSession = (session: Session) => {
    setEditingSession(session)
    setSessionFormData({
      sessionNumber: session.sessionNumber.toString(),
      sessionDate: session.sessionDate.split('T')[0],
      startTime: session.startTime,
      endTime: session.endTime,
      topic: session.topic || ''
    })
    setShowSessionForm(true)
  }

  const handleDeleteSession = async (sessionId: number) => {
    if (!expandedScheduleId) return
    if (!confirm('이 차수를 삭제하시겠습니까?')) return

    try {
      const response = await axios.delete(`/api/instructor/courses/${courseId}/schedules/${expandedScheduleId}/sessions/${sessionId}`)
      if (response.data.success) {
        setMessage({ type: 'success', text: '차수가 삭제되었습니다.' })
        fetchSessions(expandedScheduleId)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '차수 삭제에 실패했습니다.' })
    }
  }

  const resetSessionForm = () => {
    setShowSessionForm(false)
    setEditingSession(null)
    setSessionFormData({
      sessionNumber: '',
      sessionDate: '',
      startTime: '',
      endTime: '',
      topic: ''
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return { label: '예정', color: 'bg-blue-100 text-blue-700' }
      case 'ongoing': return { label: '진행중', color: 'bg-green-100 text-green-700' }
      case 'completed': return { label: '종료', color: 'bg-gray-100 text-gray-700' }
      case 'cancelled': return { label: '취소', color: 'bg-red-100 text-red-700' }
      default: return { label: status, color: 'bg-gray-100 text-gray-700' }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await axios.put(`/api/instructor/courses/${courseId}`, formData)
      if (response.data.success) {
        setCourse(response.data.course)
        setMessage({ type: 'success', text: '강의가 저장되었습니다.' })
      }
    } catch (error: any) {
      console.error('강의 저장 실패:', error)
      setMessage({ type: 'error', text: error.response?.data?.error || '저장에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '파일 크기는 5MB 이하여야 합니다.' })
      return
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '이미지 파일만 업로드 가능합니다.' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'courses')

      const uploadResponse = await axios.post('/api/upload', uploadFormData)

      if (uploadResponse.data.url) {
        const updateResponse = await axios.put(`/api/instructor/courses/${courseId}`, {
          thumbnailUrl: uploadResponse.data.url
        })

        if (updateResponse.data.success) {
          setCourse(updateResponse.data.course)
          setMessage({ type: 'success', text: '썸네일이 업데이트되었습니다.' })
        }
      }
    } catch (error: any) {
      console.error('이미지 업로드 실패:', error)
      const errorMsg = error.response?.data?.error || '이미지 업로드에 실패했습니다.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!formData.title) {
      setMessage({ type: 'error', text: '강의 제목을 먼저 입력해주세요' })
      return
    }

    setGenerating(true)
    setMessage(null)

    try {
      const categoryName = course?.category?.name || ''

      const response = await axios.post('/api/instructor/courses/generate-image', {
        title: formData.title,
        description: formData.description,
        category: categoryName,
        profileImageUrl: includeProfileImage && instructorProfile?.imageUrl ? instructorProfile.imageUrl : undefined
      })

      if (response.data.success && response.data.imageUrl) {
        const updateResponse = await axios.put(`/api/instructor/courses/${courseId}`, {
          thumbnailUrl: response.data.imageUrl
        })
        if (updateResponse.data.success) {
          setCourse(updateResponse.data.course)
          setMessage({ type: 'success', text: 'AI가 썸네일 이미지를 생성했습니다.' })
        }
      } else {
        setMessage({ type: 'error', text: response.data.error || 'AI 이미지 생성에 실패했습니다' })
      }
    } catch (error: any) {
      console.error('이미지 생성 실패:', error)
      setMessage({ type: 'error', text: 'AI 이미지 생성에 실패했습니다' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectImage = async (imageUrl: string) => {
    try {
      const updateResponse = await axios.put(`/api/instructor/courses/${courseId}`, {
        thumbnailUrl: imageUrl
      })
      if (updateResponse.data.success) {
        setCourse(updateResponse.data.course)
        setMessage({ type: 'success', text: '썸네일이 업데이트되었습니다.' })
      }
    } catch (error: any) {
      console.error('썸네일 업데이트 실패:', error)
      setMessage({ type: 'error', text: '썸네일 업데이트에 실패했습니다.' })
    }
    setShowImageSelectModal(false)
    setGeneratedImages([])
  }

  const handleGenerateDescription = async () => {
    if (!formData.title) {
      setMessage({ type: 'error', text: '강의 제목을 먼저 입력해주세요' })
      return
    }

    setGeneratingDescription(true)
    setMessage(null)

    try {
      const categoryName = course?.category?.name || ''

      const response = await axios.post('/api/instructor/courses/generate-description', {
        title: formData.title,
        category: categoryName,
        instructions: formData.instructions
      })

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          description: response.data.description
        }))
        setMessage({ type: 'success', text: 'AI가 강의 설명을 생성했습니다!' })
      } else {
        setMessage({ type: 'error', text: response.data.error || 'AI 설명 생성에 실패했습니다' })
      }
    } catch (error: any) {
      console.error('설명 생성 실패:', error)
      setMessage({ type: 'error', text: 'AI 설명 생성에 실패했습니다' })
    } finally {
      setGeneratingDescription(false)
    }
  }

  const handleGenerateCurriculum = async () => {
    if (!formData.title) {
      setMessage({ type: 'error', text: '강의 제목을 먼저 입력해주세요' })
      return
    }

    setGeneratingCurriculum(true)
    setMessage(null)

    try {
      const categoryName = course?.category?.name || ''

      const response = await axios.post('/api/instructor/courses/generate-curriculum', {
        title: formData.title,
        category: categoryName,
        description: formData.description,
        instructions: formData.instructions
      })

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          curriculum: response.data.curriculum
        }))
        setMessage({ type: 'success', text: 'AI가 커리큘럼을 생성했습니다!' })
      } else {
        setMessage({ type: 'error', text: response.data.error || 'AI 커리큘럼 생성에 실패했습니다' })
      }
    } catch (error: any) {
      console.error('커리큘럼 생성 실패:', error)
      setMessage({ type: 'error', text: 'AI 커리큘럼 생성에 실패했습니다' })
    } finally {
      setGeneratingCurriculum(false)
    }
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

  // 에디터 이미지 업로드 처리
  const handleEditorImageChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'description' | 'curriculum') => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '이미지 파일만 업로드 가능합니다' })
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '파일 크기는 5MB를 초과할 수 없습니다' })
      return
    }

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await res.json()

      if (data.success && data.url) {
        // 절대 URL로 변환
        const fullUrl = data.url.startsWith('http') ? data.url : `${window.location.origin}${data.url}`
        // 이미지 태그를 현재 값 끝에 추가
        const imgHtml = `<p><img src="${fullUrl}" alt="uploaded image" /></p>`
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
        setMessage({ type: 'success', text: '이미지가 추가되었습니다' })
      } else {
        setMessage({ type: 'error', text: data.error || '이미지 업로드에 실패했습니다' })
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      setMessage({ type: 'error', text: '이미지 업로드에 실패했습니다' })
    }

    // 입력 초기화
    e.target.value = ''
  }

  if (loading) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">로딩 중...</div>
      </InstructorLayout>
    )
  }

  if (!course) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">강의를 찾을 수 없습니다.</p>
          <Link href="/instructor/courses" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            강의 목록으로 돌아가기
          </Link>
        </div>
      </InstructorLayout>
    )
  }

  return (
    <InstructorLayout>
      <div className="max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/instructor/courses" className="hover:text-gray-700">
                강의 관리
              </Link>
              <span>/</span>
              <span>수정</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">강의 수정</h1>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            {course.category.name}
          </span>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {message.text}
          </div>
        )}

        {/* 썸네일 섹션 */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">강의 썸네일</h2>
          <div className="flex items-start gap-6">
            <div className="relative">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-48 h-32 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center border">
                  <span className="text-4xl text-gray-400">📚</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || generating}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {uploading ? '업로드 중...' : '이미지 변경'}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={generating || uploading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {generating ? 'AI 생성 중...' : 'AI로 생성'}
                </button>
              </div>
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
              <p className="text-sm text-gray-500">
                권장 크기: 800 x 450px (16:9)<br />
                JPG, PNG 형식 / 최대 5MB
              </p>
            </div>
          </div>
        </div>

        {/* 강의 정보 수정 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">강의 정보</h2>

          {/* AI 자동 생성 섹션 */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-base font-bold text-purple-900">AI 자동 생성</h3>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              강의 제목을 기반으로 설명과 커리큘럼을 자동으로 생성합니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || !formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {generatingDescription ? '설명 생성 중...' : '설명 생성'}
              </button>
              <button
                type="button"
                onClick={handleGenerateCurriculum}
                disabled={generatingCurriculum || !formData.title}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {generatingCurriculum ? '커리큘럼 생성 중...' : '커리큘럼 생성'}
              </button>
              <button
                type="button"
                onClick={() => setShowPromoModal(true)}
                disabled={!formData.title}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                프로모션 이미지 ({formData.descriptionImages.length + formData.curriculumImages.length}/6)
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="강의 제목을 입력하세요"
              />
            </div>

            {/* AI 생성 지시사항 */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI 생성 지시사항 <span className="text-yellow-600">(설명 & 커리큘럼 자동 생성용)</span>
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 resize-y"
                rows={6}
                placeholder="예: 이 강의는 초보자를 위한 AI 활용법을 다룹니다. ChatGPT, Claude 등의 AI 도구를 실무에서 활용하는 방법을 배웁니다.

커리큘럼 구조:
- 총 8주차 과정
- 주 2회 수업 (월, 수)
- 회당 2시간"
              />
              <p className="mt-2 text-xs text-gray-600">
                AI가 강의 설명과 커리큘럼을 생성할 때 이 지시사항을 참고합니다.
                <strong> 커리큘럼 생성 시</strong> 주차, 차수, 시간 정보를 포함하면 표 형식으로 구조화된 커리큘럼이 생성됩니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의 설명 <span className="text-red-500">*</span>
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
              <div className="bg-white mb-4 border rounded-lg resize-y overflow-auto" style={{ height: '400px', minHeight: '200px', maxHeight: '1200px' }}>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  modules={quillModules}
                  style={{ height: 'calc(100% - 42px)' }}
                  placeholder="강의에 대한 소개를 작성하세요"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                커리큘럼 <span className="text-red-500">*</span>
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
              <div className="bg-white mb-4 border rounded-lg resize-y overflow-auto" style={{ height: '400px', minHeight: '200px', maxHeight: '1200px' }}>
                <ReactQuill
                  theme="snow"
                  value={formData.curriculum}
                  onChange={(value) => setFormData({ ...formData, curriculum: value })}
                  modules={quillModules}
                  style={{ height: 'calc(100% - 42px)' }}
                  placeholder="강의 커리큘럼을 작성하세요"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수강 안내
              </label>
              <RichTextEditor
                value={formData.instructions}
                onChange={(value) => setFormData({ ...formData, instructions: value })}
                placeholder="수강생들에게 전달할 안내사항을 작성하세요"
              />
            </div>

            {/* 가격 설정 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">가격 설정</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({
                      ...formData,
                      isFree: e.target.checked,
                      price: e.target.checked ? 0 : formData.price
                    })}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">무료 강의</span>
                </label>

                {!formData.isFree && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      가격 (원)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full max-w-xs px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.price > 0 ? `${formData.price.toLocaleString()}원` : '가격을 입력하세요'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정원 (명)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })}
                    className="w-full max-w-xs px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="30"
                  />
                </div>
              </div>
            </div>

            {/* 상태 설정 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">게시 상태</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">게시중</span>
                  <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">공개</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="text-sm font-medium text-gray-700">비공개</span>
                  <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">숨김</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                비공개로 설정하면 학생들에게 강의가 노출되지 않습니다.
              </p>
            </div>

            {/* 강의 유형 설정 (온라인/오프라인) */}
            <div className="border-t pt-6">
              <div className="border-2 border-emerald-200 rounded-lg p-6 bg-emerald-50">
                <h3 className="text-lg font-bold text-emerald-900 mb-4">강의 유형</h3>

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
                        카카오맵/네이버지도에서 공유하기 → 링크 복사 또는 지도 퍼가기 코드를 입력하세요
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        오시는 길 안내
                      </label>
                      <textarea
                        value={formData.locationNote}
                        onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                        rows={2}
                        placeholder="예: 강남역 3번 출구에서 도보 5분"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 유튜브 링크 */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참조 유튜브 영상
                <span className="text-gray-500 font-normal ml-2">(강의 페이지 상단에 표시됩니다)</span>
              </label>
              <div className="space-y-2">
                {formData.youtubeUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...formData.youtubeUrls]
                        newUrls[index] = e.target.value
                        setFormData({ ...formData, youtubeUrls: newUrls })
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newUrls = formData.youtubeUrls.filter((_, i) => i !== index)
                        setFormData({ ...formData, youtubeUrls: newUrls })
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, youtubeUrls: [...formData.youtubeUrls, ''] })}
                  className="mt-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  유튜브 링크 추가
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center pt-6 border-t">
            <Link
              href="/instructor/courses"
              className="text-gray-500 hover:text-gray-700"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>

        {/* 기수 관리 섹션 */}
        <div className="bg-white rounded-xl border p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">기수 관리</h2>
            <button
              type="button"
              onClick={() => {
                resetScheduleForm()
                setShowScheduleForm(true)
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              + 기수 추가
            </button>
          </div>

          {/* 기수 추가/수정 폼 */}
          {showScheduleForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-4">
                {editingSchedule ? `${editingSchedule.cohort}기 수정` : '새 기수 추가'}
              </h3>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      기수 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={scheduleFormData.cohort}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, cohort: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="1"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태
                    </label>
                    <select
                      value={scheduleFormData.status}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      <option value="scheduled">예정</option>
                      <option value="ongoing">진행중</option>
                      <option value="completed">종료</option>
                      <option value="cancelled">취소</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={scheduleFormData.startDate}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={scheduleFormData.endDate}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    강의실 링크 (Zoom, Google Meet 등)
                  </label>
                  <input
                    type="url"
                    value={scheduleFormData.meetLink}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, meetLink: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z" />
                      </svg>
                      카카오톡 단톡방 주소
                    </span>
                  </label>
                  <input
                    type="url"
                    value={scheduleFormData.kakaoTalkLink}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, kakaoTalkLink: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="https://open.kakao.com/o/..."
                  />
                  <p className="mt-1 text-xs text-gray-500">기수별 카카오톡 오픈채팅방 주소를 입력하세요</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetScheduleForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {editingSchedule ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 기수 목록 */}
          {schedulesLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 기수가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => {
                const statusInfo = getStatusLabel(schedule.status)
                const isExpanded = expandedScheduleId === schedule.id
                return (
                  <div key={schedule.id} className="bg-gray-50 rounded-lg border overflow-hidden">
                    {/* 기수 헤더 */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleScheduleExpand(schedule.id)}>
                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="text-lg font-semibold text-gray-900">
                          {schedule.cohort}기
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <div className="text-sm text-gray-600">
                          {formatDate(schedule.startDate)} ~ {formatDate(schedule.endDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          수강생 {schedule._count.enrollments}명
                        </div>
                        {schedule.meetLink && (
                          <a
                            href={schedule.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            강의실
                          </a>
                        )}
                        {schedule.kakaoTalkLink && (
                          <a
                            href={schedule.kakaoTalkLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-yellow-600 hover:text-yellow-800 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3c-5.523 0-10 3.585-10 8.014 0 2.932 1.919 5.514 4.804 6.978l-1.218 4.505c-.108.4.348.727.702.504l5.256-3.469a11.47 11.47 0 0 0 .456.019c5.523 0 10-3.585 10-8.014S17.523 3 12 3z" />
                            </svg>
                            카톡방
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditSchedule(schedule)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {schedule._count.enrollments === 0 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                            title="삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 차수(세션) 관리 - 펼침 영역 */}
                    {isExpanded && (
                      <div className="border-t bg-white p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">차수 관리</h4>
                          <button
                            type="button"
                            onClick={() => {
                              resetSessionForm()
                              setShowSessionForm(true)
                            }}
                            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            + 차수 추가
                          </button>
                        </div>

                        {/* 차수 추가/수정 폼 */}
                        {showSessionForm && (
                          <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h5 className="font-medium text-gray-900 mb-3">
                              {editingSession ? `${editingSession.sessionNumber}차 수정` : '새 차수 추가'}
                            </h5>
                            <form onSubmit={handleSessionSubmit} className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">차수 *</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={sessionFormData.sessionNumber}
                                    onChange={(e) => setSessionFormData({ ...sessionFormData, sessionNumber: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="1"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">날짜 *</label>
                                  <input
                                    type="date"
                                    value={sessionFormData.sessionDate}
                                    onChange={(e) => setSessionFormData({ ...sessionFormData, sessionDate: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">시작시간 *</label>
                                  <input
                                    type="time"
                                    value={sessionFormData.startTime}
                                    onChange={(e) => setSessionFormData({ ...sessionFormData, startTime: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">종료시간 *</label>
                                  <input
                                    type="time"
                                    value={sessionFormData.endTime}
                                    onChange={(e) => setSessionFormData({ ...sessionFormData, endTime: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">주제</label>
                                  <input
                                    type="text"
                                    value={sessionFormData.topic}
                                    onChange={(e) => setSessionFormData({ ...sessionFormData, topic: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="수업 주제"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={resetSessionForm}
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  취소
                                </button>
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                  {editingSession ? '수정' : '추가'}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* 차수 목록 */}
                        {sessionsLoading[schedule.id] ? (
                          <div className="text-center py-4 text-gray-500 text-sm">로딩 중...</div>
                        ) : !sessions[schedule.id] || sessions[schedule.id].length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">등록된 차수가 없습니다.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium text-gray-700">차수</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-700">날짜</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-700">시간</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-700">주제</th>
                                  <th className="px-3 py-2 text-center font-medium text-gray-700">관리</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {sessions[schedule.id].map((session) => (
                                  <tr key={session.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium">{session.sessionNumber}차</td>
                                    <td className="px-3 py-2">{formatDate(session.sessionDate)}</td>
                                    <td className="px-3 py-2">{session.startTime} ~ {session.endTime}</td>
                                    <td className="px-3 py-2 text-gray-600">{session.topic || '-'}</td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleEditSession(session)}
                                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                                        title="수정"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded ml-1"
                                        title="삭제"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>안내:</strong> 강의 정보, 가격, 게시 상태를 직접 수정할 수 있습니다. 기수별로 차수(회차)를 추가하여 세부 일정을 관리하세요.
          </p>
        </div>
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

      {/* AI 이미지 선택 모달 */}
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

      {/* 프로모션 이미지 생성 모달 */}
      <PromoImageModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        courseId={parseInt(courseId)}
        title={formData.title}
        description={formData.description}
        curriculum={formData.curriculum}
        category={course?.category?.name || ''}
        descriptionImages={formData.descriptionImages}
        curriculumImages={formData.curriculumImages}
        onImagesUpdate={(type, images) => {
          setFormData(prev => ({
            ...prev,
            [type === 'description' ? 'descriptionImages' : 'curriculumImages']: images
          }))
        }}
        initialTab={promoModalTab}
        apiBasePath="/api/instructor"
      />
    </InstructorLayout>
  )
}
