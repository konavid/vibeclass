'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Types
interface Video {
  id: number
  title: string
  description: string | null
  order: number
  createdAt: string
}

interface Slide {
  id: number
  title: string
  description: string | null
  embedUrl: string | null
  order: number
  createdAt: string
}

interface Material {
  id: number
  title: string
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  order: number
  createdAt: string
}

interface Qna {
  id: number
  title: string
  question: string
  answer: string | null
  isPublic: boolean
  createdAt: string
  answeredAt: string | null
  user: { id: number; name: string; nickname: string | null }
  admin: { id: number; name: string } | null
}

interface Post {
  id: number
  title: string
  content: string
  isNotice: boolean
  viewCount: number
  createdAt: string
  user: { id: number; name: string; nickname: string | null; image: string | null; role: string }
  _count: { comments: number }
}

interface Schedule {
  id: number
  cohort: number
  courseTitle: string
  endDate?: string
}

type ModalType = 'videos' | 'slides' | 'materials' | 'qna' | 'board' | null

interface Props {
  scheduleId: number
  courseName: string
  cohort: number
  modalType: ModalType
  onClose: () => void
}

export default function EnrollmentContentModals({ scheduleId, courseName, cohort, modalType, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Videos state
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null)

  // Slides state
  const [slides, setSlides] = useState<Slide[]>([])
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null)

  // Materials state
  const [materials, setMaterials] = useState<Material[]>([])

  // QnA state
  const [qnas, setQnas] = useState<Qna[]>([])
  const [selectedQna, setSelectedQna] = useState<Qna | null>(null)
  const [showQnaForm, setShowQnaForm] = useState(false)
  const [qnaForm, setQnaForm] = useState({ title: '', question: '', isPublic: true })
  const [submitting, setSubmitting] = useState(false)

  // Board state
  const [posts, setPosts] = useState<Post[]>([])
  const [notices, setNotices] = useState<Post[]>([])
  const [boardPage, setBoardPage] = useState(1)
  const [boardTotalPages, setBoardTotalPages] = useState(1)

  // QnA pagination
  const [qnaPage, setQnaPage] = useState(1)
  const [qnaTotalPages, setQnaTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    if (modalType) {
      setLoading(true)
      setError(null)
      fetchData(modalType)
    }
  }, [modalType, scheduleId])

  // Fetch QnA when page changes
  useEffect(() => {
    if (modalType === 'qna' && !loading) {
      fetchQnaData(qnaPage)
    }
  }, [qnaPage])

  // Fetch Board when page changes
  useEffect(() => {
    if (modalType === 'board' && !loading) {
      fetchBoardData(boardPage)
    }
  }, [boardPage])

  const fetchData = async (type: ModalType) => {
    try {
      let endpoint = ''
      switch (type) {
        case 'videos': endpoint = `/api/cohort-videos?scheduleId=${scheduleId}`; break
        case 'slides': endpoint = `/api/cohort-slides?scheduleId=${scheduleId}`; break
        case 'materials': endpoint = `/api/cohort-materials?scheduleId=${scheduleId}`; break
        case 'qna': endpoint = `/api/cohort-qna?scheduleId=${scheduleId}&page=1&limit=${ITEMS_PER_PAGE}`; break
        case 'board': endpoint = `/api/cohort-board/posts?scheduleId=${scheduleId}&page=1`; break
      }

      const res = await fetch(endpoint)
      const data = await res.json()

      if (res.ok) {
        switch (type) {
          case 'videos':
            setVideos(data.videos)
            setDaysLeft(data.daysLeft)
            break
          case 'slides':
            setSlides(data.slides)
            setDaysLeft(data.daysLeft)
            if (data.slides.length > 0) setSelectedSlide(data.slides[0])
            break
          case 'materials':
            setMaterials(data.materials)
            break
          case 'qna':
            setQnas(data.qnas)
            setQnaPage(1)
            setQnaTotalPages(data.pagination?.totalPages || Math.ceil((data.total || data.qnas.length) / ITEMS_PER_PAGE))
            break
          case 'board':
            setPosts(data.posts)
            setNotices(data.notices)
            setBoardPage(1)
            setBoardTotalPages(data.pagination?.totalPages || 1)
            break
        }
      } else {
        setError(data.error || '데이터를 불러올 수 없습니다.')
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchQnaData = async (page: number) => {
    try {
      const res = await fetch(`/api/cohort-qna?scheduleId=${scheduleId}&page=${page}&limit=${ITEMS_PER_PAGE}`)
      const data = await res.json()
      if (res.ok) {
        setQnas(data.qnas)
        setQnaTotalPages(data.pagination?.totalPages || Math.ceil((data.total || data.qnas.length) / ITEMS_PER_PAGE))
      }
    } catch (err) {
      console.error('QnA fetch error:', err)
    }
  }

  const fetchBoardData = async (page: number) => {
    try {
      const res = await fetch(`/api/cohort-board/posts?scheduleId=${scheduleId}&page=${page}`)
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts)
        setNotices(data.notices)
        setBoardTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err) {
      console.error('Board fetch error:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleQnaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qnaForm.title || !qnaForm.question) {
      alert('제목과 질문 내용을 입력해주세요.')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/cohort-qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, ...qnaForm })
      })
      if (res.ok) {
        setShowQnaForm(false)
        setQnaForm({ title: '', question: '', isPublic: true })
        fetchData('qna')
      } else {
        const data = await res.json()
        alert(data.error || '질문 등록에 실패했습니다.')
      }
    } catch (err) {
      alert('질문 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!modalType) return null

  const getTitle = () => {
    const titles = {
      videos: '녹화영상',
      slides: '슬라이드',
      materials: '자료실',
      qna: 'Q&A',
      board: '게시판'
    }
    return `${courseName} ${cohort}기 ${titles[modalType]}`
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-600">{error}</div>
          ) : (
            <>
              {/* Videos Content */}
              {modalType === 'videos' && (
                <div>
                  {daysLeft !== null && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${daysLeft <= 7 ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                      영상 열람 가능 기간: <strong>{daysLeft}일</strong> 남음
                    </div>
                  )}
                  {videos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">등록된 영상이 없습니다.</div>
                  ) : (
                    <div className="space-y-2">
                      {videos.map((video, index) => (
                        <Link
                          key={video.id}
                          href={`/my/videos/${scheduleId}/${video.id}`}
                          className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                        >
                          <span className="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-lg mr-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-500">{index + 1}회차</span>
                            <h3 className="font-medium text-gray-900">{video.title}</h3>
                            {video.description && <p className="text-sm text-gray-500">{video.description}</p>}
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Slides Content */}
              {modalType === 'slides' && (
                <div>
                  {daysLeft !== null && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${daysLeft <= 7 ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                      슬라이드 열람 가능 기간: <strong>{daysLeft}일</strong> 남음
                    </div>
                  )}
                  {slides.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">등록된 슬라이드가 없습니다.</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-gray-100 border-b text-sm font-medium">슬라이드 목록</div>
                          <ul className="divide-y max-h-[400px] overflow-y-auto">
                            {slides.map((slide, index) => (
                              <li key={slide.id}>
                                <button
                                  onClick={() => setSelectedSlide(slide)}
                                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-sm ${selectedSlide?.id === slide.id ? 'bg-gray-200' : ''}`}
                                >
                                  <span className="font-medium">{index + 1}. {slide.title}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="lg:col-span-3">
                        {selectedSlide?.embedUrl ? (
                          <div className="bg-gray-100 rounded-lg overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                              <span className="font-medium">{selectedSlide.title}</span>
                              <a
                                href={selectedSlide.embedUrl.replace('/embed?', '/edit?')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-gray-900"
                              >
                                새 창에서 열기
                              </a>
                            </div>
                            <div className="aspect-[16/9]">
                              <iframe src={selectedSlide.embedUrl} className="w-full h-full" allowFullScreen />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg text-gray-500">
                            슬라이드를 선택해주세요
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Materials Content */}
              {modalType === 'materials' && (
                <div>
                  {materials.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">등록된 자료가 없습니다.</div>
                  ) : (
                    <div className="space-y-2">
                      {materials.map((material, index) => (
                        <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900">{material.title}</h3>
                              <div className="text-sm text-gray-500">
                                {material.fileName && <span>{material.fileName}</span>}
                                {material.fileSize && <span className="ml-2">({formatFileSize(material.fileSize)})</span>}
                              </div>
                            </div>
                          </div>
                          {material.fileUrl ? (
                            <a
                              href={material.fileUrl}
                              download={material.fileName || true}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                            >
                              다운로드
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">파일 없음</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* QnA Content */}
              {modalType === 'qna' && (
                <div>
                  {!showQnaForm && !selectedQna && (
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setShowQnaForm(true)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                      >
                        질문하기
                      </button>
                    </div>
                  )}

                  {showQnaForm ? (
                    <form onSubmit={handleQnaSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                        <input
                          type="text"
                          value={qnaForm.title}
                          onChange={(e) => setQnaForm({ ...qnaForm, title: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="질문 제목"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">질문 내용</label>
                        <textarea
                          value={qnaForm.question}
                          onChange={(e) => setQnaForm({ ...qnaForm, question: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                          rows={5}
                          placeholder="궁금한 점을 자세히 적어주세요"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={qnaForm.isPublic}
                          onChange={(e) => setQnaForm({ ...qnaForm, isPublic: e.target.checked })}
                        />
                        <span className="text-sm">다른 수강생에게도 공개</span>
                      </label>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowQnaForm(false)} className="px-4 py-2 border rounded-lg">
                          취소
                        </button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50">
                          {submitting ? '등록 중...' : '등록'}
                        </button>
                      </div>
                    </form>
                  ) : selectedQna ? (
                    <div>
                      <button onClick={() => setSelectedQna(null)} className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        목록으로
                      </button>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${selectedQna.answer ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {selectedQna.answer ? '답변완료' : '답변대기'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{selectedQna.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{selectedQna.user.nickname || selectedQna.user.name} · {formatDate(selectedQna.createdAt)}</p>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Q</span>
                          <span className="text-sm font-medium">질문</span>
                        </div>
                        <p className="whitespace-pre-wrap">{selectedQna.question}</p>
                      </div>
                      {selectedQna.answer ? (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">A</span>
                            <span className="text-sm font-medium">답변</span>
                          </div>
                          <p className="whitespace-pre-wrap">{selectedQna.answer}</p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-lg p-4 text-center text-yellow-800">
                          아직 답변이 등록되지 않았습니다.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {qnas.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">등록된 질문이 없습니다.</div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {qnas.map((qna) => (
                              <div
                                key={qna.id}
                                onClick={() => setSelectedQna(qna)}
                                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${qna.answer ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {qna.answer ? '답변완료' : '답변대기'}
                                  </span>
                                </div>
                                <h3 className="font-medium">{qna.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-1">{qna.question}</p>
                                <p className="text-xs text-gray-400 mt-1">{qna.user.nickname || qna.user.name} · {formatDate(qna.createdAt)}</p>
                              </div>
                            ))}
                          </div>
                          {/* QnA Pagination */}
                          {qnaTotalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                              <button
                                onClick={() => setQnaPage(p => Math.max(1, p - 1))}
                                disabled={qnaPage === 1}
                                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                              >
                                이전
                              </button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, qnaTotalPages) }, (_, i) => {
                                  let pageNum: number
                                  if (qnaTotalPages <= 5) {
                                    pageNum = i + 1
                                  } else if (qnaPage <= 3) {
                                    pageNum = i + 1
                                  } else if (qnaPage >= qnaTotalPages - 2) {
                                    pageNum = qnaTotalPages - 4 + i
                                  } else {
                                    pageNum = qnaPage - 2 + i
                                  }
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setQnaPage(pageNum)}
                                      className={`w-8 h-8 rounded-lg text-sm ${qnaPage === pageNum ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
                                    >
                                      {pageNum}
                                    </button>
                                  )
                                })}
                              </div>
                              <button
                                onClick={() => setQnaPage(p => Math.min(qnaTotalPages, p + 1))}
                                disabled={qnaPage === qnaTotalPages}
                                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Board Content */}
              {modalType === 'board' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <Link
                      href={`/my/board/${scheduleId}/write`}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                    >
                      글쓰기
                    </Link>
                  </div>
                  {notices.length > 0 && (
                    <div className="mb-4">
                      {notices.map((post) => (
                        <Link
                          key={post.id}
                          href={`/my/board/${scheduleId}/${post.id}`}
                          className="flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 mb-2"
                        >
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded mr-3">공지</span>
                          <span className="flex-1 font-medium truncate">{post.title}</span>
                          {post._count.comments > 0 && <span className="text-sm text-gray-600 mr-2">[{post._count.comments}]</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                  {posts.length === 0 && notices.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">아직 작성된 글이 없습니다.</div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        {posts.map((post) => (
                          <Link
                            key={post.id}
                            href={`/my/board/${scheduleId}/${post.id}`}
                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{post.title}</span>
                                {post._count.comments > 0 && <span className="text-sm text-gray-600">[{post._count.comments}]</span>}
                              </div>
                              <p className="text-xs text-gray-500">{post.user.nickname || post.user.name} · 조회 {post.viewCount}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {/* Board Pagination */}
                      {boardTotalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                          <button
                            onClick={() => setBoardPage(p => Math.max(1, p - 1))}
                            disabled={boardPage === 1}
                            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            이전
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, boardTotalPages) }, (_, i) => {
                              let pageNum: number
                              if (boardTotalPages <= 5) {
                                pageNum = i + 1
                              } else if (boardPage <= 3) {
                                pageNum = i + 1
                              } else if (boardPage >= boardTotalPages - 2) {
                                pageNum = boardTotalPages - 4 + i
                              } else {
                                pageNum = boardPage - 2 + i
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setBoardPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg text-sm ${boardPage === pageNum ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                          </div>
                          <button
                            onClick={() => setBoardPage(p => Math.min(boardTotalPages, p + 1))}
                            disabled={boardPage === boardTotalPages}
                            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
