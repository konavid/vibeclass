'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Material {
  id: number
  title: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

interface Schedule {
  id: number
  cohort: number
  course: {
    id: number
    title: string
  }
}

export default function AdminMaterialsPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = parseInt(params.scheduleId as string)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    order: 0,
    isPublished: true
  })

  useEffect(() => {
    fetchMaterials()
  }, [scheduleId])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/cohort-materials?scheduleId=${scheduleId}`)
      const data = await res.json()

      if (data.success) {
        setMaterials(data.materials)
        if (data.materials.length > 0) {
          setSchedule(data.materials[0].schedule)
        }
      }
    } catch (error) {
      console.error('자료 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      alert('파일 크기는 50MB를 초과할 수 없습니다.')
      return
    }

    try {
      setUploading(true)
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'materials')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await res.json()
      if (data.url) {
        setFormData({
          ...formData,
          title: formData.title || file.name.replace(/\.[^/.]+$/, ''),
          fileUrl: data.url,
          fileName: file.name,
          fileSize: file.size
        })
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    if (!formData.fileUrl && !editingId) {
      alert('파일을 업로드해주세요.')
      return
    }

    try {
      const url = editingId
        ? `/api/admin/cohort-materials/${editingId}`
        : '/api/admin/cohort-materials'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduleId
        })
      })

      const data = await res.json()

      if (data.success) {
        await fetchMaterials()
        resetForm()
        alert(editingId ? '자료가 수정되었습니다.' : '자료가 등록되었습니다.')
      } else {
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const handleEdit = (material: Material) => {
    setEditingId(material.id)
    setFormData({
      title: material.title,
      fileUrl: material.fileUrl || '',
      fileName: material.fileName || '',
      fileSize: material.fileSize || 0,
      order: material.order,
      isPublished: material.isPublished
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/cohort-materials/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchMaterials()
        alert('자료가 삭제되었습니다.')
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleTogglePublish = async (material: Material) => {
    try {
      const res = await fetch(`/api/admin/cohort-materials/${material.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !material.isPublished })
      })

      if (res.ok) {
        await fetchMaterials()
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      title: '',
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      order: materials.length,
      isPublished: true
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return <div className="text-gray-600">로딩 중...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          뒤로가기
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {schedule ? `${schedule.course.title} ${schedule.cohort}기` : `기수 #${scheduleId}`} 자료실 관리
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          수강생들이 다운로드할 수 있는 파일을 등록하세요.
        </p>
      </div>

      {/* 자료 등록/수정 폼 */}
      {showForm ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '자료 수정' : '자료 등록'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  placeholder="자료 제목"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">파일</label>
              {formData.fileUrl ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{formData.fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(formData.fileSize)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fileUrl: '', fileName: '', fileSize: 0 })}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer border border-gray-300">
                    <span>{uploading ? '업로드 중...' : '파일 선택'}</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">PDF, Word, Excel, ZIP 등 (최대 50MB)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm text-gray-700">공개</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingId ? '수정' : '등록'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => {
              setFormData({
                title: '',
                fileUrl: '',
                fileName: '',
                fileSize: 0,
                order: materials.length,
                isPublished: true
              })
              setShowForm(true)
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            자료 등록
          </button>
        </div>
      )}

      {/* 자료 목록 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">등록된 자료 ({materials.length}개)</h2>
        </div>

        {materials.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            등록된 자료가 없습니다.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">순서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">파일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {material.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.fileName ? (
                      <div>
                        <span className="text-gray-900">{material.fileName}</span>
                        {material.fileSize && (
                          <span className="ml-2 text-xs text-gray-400">
                            ({formatFileSize(material.fileSize)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">파일 없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublish(material)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        material.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {material.isPublished ? '공개' : '비공개'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(material.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {material.fileUrl && (
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        다운로드
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(material)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
