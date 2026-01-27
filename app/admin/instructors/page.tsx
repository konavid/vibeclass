'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="text-gray-500">에디터 로딩 중...</div>
})

interface Instructor {
  id: number
  name: string
  email: string
  phone: string | null
  bio: string | null
  expertise: string | null
  imageUrl: string | null
  userId: number | null
  isActive: boolean
  user?: {
    id: number
    name: string
    email: string
  } | null
  _count?: {
    courses: number
  }
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    expertise: '',
    imageUrl: '',
    userId: '' as string | number,
  })

  // 사용자 검색 관련 상태
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    try {
      const res = await fetch('/api/admin/instructors')
      const data = await res.json()
      if (data.success) {
        setInstructors(data.instructors)
      }
    } catch (error) {
      console.error('강사 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 사용자 검색
  const searchUsers = async () => {
    if (!userSearchQuery.trim()) {
      alert('검색어를 입력해주세요')
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearchQuery)}&limit=20`)
      const data = await res.json()
      if (data.success) {
        // 이미 강사로 등록된 사용자 제외 (단, 수정 중인 강사의 userId는 제외하지 않음)
        const instructorUserIds = instructors
          .filter(i => !editingId || i.id !== editingId) // 수정 중인 강사는 제외
          .map(i => i.userId)
          .filter(Boolean)
        const filteredUsers = data.users.filter((u: User) => !instructorUserIds.includes(u.id))
        setUserSearchResults(filteredUsers)
        if (filteredUsers.length === 0) {
          alert('검색 결과가 없습니다')
        }
      }
    } catch (error) {
      console.error('사용자 검색 실패:', error)
      alert('검색 중 오류가 발생했습니다')
    } finally {
      setIsSearching(false)
    }
  }

  // 사용자 선택
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setFormData({
      ...formData,
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    setUserSearchResults([])
    setUserSearchQuery('')
  }

  // 사용자 선택 취소
  const handleClearSelectedUser = () => {
    setSelectedUser(null)
    if (editingId) {
      // 수정 모드: userId만 초기화 (name, email은 유지)
      setFormData({
        ...formData,
        userId: '',
      })
    } else {
      // 신규 등록 모드: 전부 초기화
      setFormData({
        ...formData,
        userId: '',
        name: '',
        email: '',
      })
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
      uploadFormData.append('type', 'instructors')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await res.json()

      if (data.success) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
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
    setFormData(prev => ({ ...prev, imageUrl: '' }))
    setPreviewUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 신규 등록 시 사용자 선택 필수
    if (!editingId && !formData.userId) {
      alert('사용자를 검색하여 선택해주세요')
      return
    }

    try {
      const url = editingId
        ? `/api/admin/instructors/${editingId}`
        : '/api/admin/instructors'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        fetchInstructors()
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: '', email: '', phone: '', bio: '', expertise: '', imageUrl: '', userId: '' })
        setPreviewUrl('')
        setSelectedUser(null)
        setUserSearchQuery('')
        setUserSearchResults([])
        alert(editingId ? '강사가 수정되었습니다' : '강사가 추가되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다')
    }
  }

  const handleEdit = (instructor: Instructor) => {
    setEditingId(instructor.id)
    setFormData({
      name: instructor.name,
      email: instructor.email,
      phone: instructor.phone || '',
      bio: instructor.bio || '',
      expertise: instructor.expertise || '',
      imageUrl: instructor.imageUrl || '',
      userId: instructor.userId || '',
    })
    // 기존 이미지가 있으면 미리보기에 표시
    if (instructor.imageUrl) {
      setPreviewUrl(instructor.imageUrl)
    } else {
      setPreviewUrl('')
    }
    // 기존에 연결된 사용자가 있으면 selectedUser에 설정
    if (instructor.user) {
      setSelectedUser({
        id: instructor.user.id,
        name: instructor.user.name,
        email: instructor.user.email,
        role: 'instructor'
      })
    } else {
      setSelectedUser(null)
    }
    setUserSearchQuery('')
    setUserSearchResults([])
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/instructors/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchInstructors()
        alert('강사가 삭제되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다')
    }
  }

  // 활성화/비활성화 토글
  const handleToggleActive = async (instructor: Instructor) => {
    const newStatus = !instructor.isActive
    const message = newStatus
      ? '강사를 활성화하시겠습니까? 강사와 관련 강의가 사용자에게 보입니다.'
      : '강사를 비활성화하시겠습니까? 강사와 관련 강의가 사용자에게 보이지 않습니다.'

    if (!confirm(message)) return

    try {
      const res = await fetch(`/api/admin/instructors/${instructor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (res.ok) {
        fetchInstructors()
        alert(newStatus ? '강사가 활성화되었습니다' : '강사가 비활성화되었습니다')
      } else {
        const error = await res.json()
        alert(error.error || '상태 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다')
    }
  }

  if (loading) {
    return <div className="text-gray-600">로딩 중...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">강사 관리</h1>
          <p className="mt-2 text-sm text-gray-600">강사를 등록하고 관리합니다</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData({ name: '', email: '', phone: '', bio: '', expertise: '', imageUrl: '', userId: '' })
            setPreviewUrl('')
            setSelectedUser(null)
            setUserSearchQuery('')
            setUserSearchResults([])
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          강사 추가
        </button>
      </div>

      {/* 폼 */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? '강사 수정' : '강사 추가'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 사용자 연결 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사용자 연결 {!editingId && <span className="text-red-500">*</span>}
              </label>

              {selectedUser ? (
                // 선택된 사용자가 있는 경우
                <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">{selectedUser.name}</p>
                    <p className="text-xs text-indigo-700">{selectedUser.email}</p>
                    <p className="text-xs text-indigo-600">
                      {selectedUser.role === 'admin' ? '관리자' : selectedUser.role === 'instructor' ? '강사' : '일반 사용자'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedUser}
                    className="px-3 py-1 text-sm bg-white text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    {editingId ? '연결 해제' : '취소'}
                  </button>
                </div>
              ) : (
                // 사용자 검색 UI
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          searchUsers()
                        }
                      }}
                      placeholder="이름, 이메일 또는 전화번호로 검색"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={searchUsers}
                      disabled={isSearching}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSearching ? '검색 중...' : '검색'}
                    </button>
                  </div>

                  {/* 검색 결과 */}
                  {userSearchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                      {userSearchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            {user.role === 'admin' ? '관리자' : user.role === 'instructor' ? '강사' : '일반 사용자'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    등록된 사용자를 검색하여 선택하면 강사 페이지에 접근할 수 있습니다. 선택 시 해당 사용자의 role이 instructor로 변경됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  disabled={!!formData.userId}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <input
                type="tel"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  setFormData({ ...formData, phone: value })
                }}
                placeholder="01012345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소개
              </label>
              <RichTextEditor
                value={formData.bio}
                onChange={(html) => setFormData({ ...formData, bio: html })}
                placeholder="강사 소개를 입력하세요"
              />
              <p className="mt-1 text-xs text-gray-500">
                위 에디터에서 텍스트 서식을 지정할 수 있습니다.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전문 분야</label>
              <textarea
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                rows={2}
                placeholder="AI, 머신러닝, 프롬프트 엔지니어링 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로필 이미지</label>

              {/* 이미지 미리보기 */}
              {(previewUrl || formData.imageUrl) && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={previewUrl || formData.imageUrl}
                    alt="프로필 미리보기"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                    title="이미지 제거"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* 파일 업로드 버튼 */}
              <div className="flex items-center gap-3">
                <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer border border-gray-300">
                  <span>{uploading ? '업로드 중...' : '이미지 선택'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500">JPG, PNG, GIF (최대 5MB)</span>
              </div>
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
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ name: '', email: '', phone: '', bio: '', expertise: '', imageUrl: '', userId: '' })
                  setPreviewUrl('')
                  setSelectedUser(null)
                  setUserSearchQuery('')
                  setUserSearchResults([])
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 강사 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {instructors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">등록된 강사가 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {instructors.map((instructor) => (
              <li key={instructor.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {instructor.imageUrl ? (
                      <img
                        src={instructor.imageUrl}
                        alt={instructor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl text-gray-500">
                          {instructor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {instructor.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          instructor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {instructor.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{instructor.email}</p>
                      {instructor.phone && (
                        <p className="text-sm text-gray-600">{instructor.phone}</p>
                      )}
                      {instructor.expertise && (
                        <p className="text-sm text-gray-500 mt-1">
                          전문분야: {instructor.expertise}
                        </p>
                      )}
                      {instructor.bio && (
                        <div
                          className="text-sm text-gray-700 mt-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: instructor.bio }}
                        />
                      )}
                      <p className="text-sm text-indigo-600 mt-2">
                        담당 강의: {instructor._count?.courses || 0}개
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(instructor)}
                      className={`px-3 py-1 text-sm rounded ${
                        instructor.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {instructor.isActive ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => handleEdit(instructor)}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(instructor.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
