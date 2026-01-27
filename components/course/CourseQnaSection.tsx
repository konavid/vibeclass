'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuthModal } from '@/contexts/AuthModalContext'

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
  }
}

interface CourseQnaSectionProps {
  courseId: number
  instructorId: number
  instructorName: string
}

export default function CourseQnaSection({ courseId, instructorId, instructorName }: CourseQnaSectionProps) {
  const { data: session } = useSession()
  const { openLoginModal } = useAuthModal()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    isPublic: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      openLoginModal()
      return
    }

    if (!formData.message.trim()) {
      alert('문의 내용을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`/api/courses/${courseId}/qna`, {
        title: formData.title || null,
        message: formData.message,
        isPublic: formData.isPublic
      })

      if (response.data.success) {
        alert(response.data.message)
        setFormData({ title: '', message: '', isPublic: false })
        setShowForm(false)
      }
    } catch (error: any) {
      console.error('문의 등록 실패:', error)
      alert(error.response?.data?.error || '문의 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">강사에게 문의하기</h3>
          <p className="text-sm text-gray-500">{instructorName} 강사님에게 직접 문의하세요</p>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            onClick={() => {
              if (!session) {
                openLoginModal()
                return
              }
              setShowForm(true)
            }}
          >
            문의하기
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 (선택)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="문의 제목을 입력해주세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문의 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="강의에 대해 궁금한 점을 자유롭게 작성해주세요"
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-600">
                답변 공개 (다른 수강생에게도 도움이 될 수 있도록 Q&A를 공개합니다)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ title: '', message: '', isPublic: false })
                }}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? '등록 중...' : '문의 등록'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <p className="text-sm text-gray-500">
        문의를 등록하시면 강사님께 SMS로 알림이 발송됩니다.
      </p>
    </div>
  )
}
