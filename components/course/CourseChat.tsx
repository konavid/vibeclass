'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface ChatUser {
  id: number
  name: string
  nickname: string | null
  image: string | null
  role: string
}

interface ChatMessage {
  id: number
  message: string
  createdAt: string
  user: ChatUser
}

interface Schedule {
  id: number
  cohort: number
  endDate: string
}

interface Props {
  courseId: number
  courseName: string
  schedules: Schedule[]
}

export default function CourseChat({ courseId, courseName, schedules }: Props) {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [enrolledSchedule, setEnrolledSchedule] = useState<Schedule | null>(null)
  const [isEnded, setIsEnded] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  // Check enrollment status
  useEffect(() => {
    const checkEnrollment = async () => {
      if (status === 'loading') return
      if (!session?.user) {
        setLoading(false)
        return
      }

      const isAdmin = session.user.role === 'admin'
      const isInstructor = session.user.role === 'instructor'

      // 관리자/강사는 수강신청 없이도 접근 가능 - 가장 최근 진행중인 기수 선택
      if (isAdmin || isInstructor) {
        const now = new Date()
        // 진행중이거나 예정된 기수 찾기
        const activeSchedule = schedules.find(s => new Date(s.endDate) >= now) || schedules[0]
        if (activeSchedule) {
          setEnrolledSchedule(activeSchedule)
          setIsEnded(new Date(activeSchedule.endDate) < now)
        }
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/my/enrollment-status?courseId=${courseId}`)
        const data = await res.json()

        if (res.ok && data.isEnrolled && data.scheduleId) {
          const schedule = schedules.find(s => s.id === data.scheduleId)
          if (schedule) {
            setEnrolledSchedule(schedule)
            const ended = new Date(schedule.endDate) < new Date()
            setIsEnded(ended)
          }
        }
      } catch (error) {
        console.error('Failed to check enrollment:', error)
      } finally {
        setLoading(false)
      }
    }

    checkEnrollment()
  }, [session, status, courseId, schedules])

  // Fetch messages when enrolled and chat is shown
  useEffect(() => {
    const fetchMessages = async () => {
      if (!enrolledSchedule || !showChat) return

      try {
        const res = await fetch(`/api/chat?scheduleId=${enrolledSchedule.id}&limit=100`)
        const data = await res.json()
        if (res.ok) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    fetchMessages()
  }, [enrolledSchedule, showChat])

  // Connect to Socket.io
  useEffect(() => {
    if (!session?.user || !enrolledSchedule || isEnded || !showChat) return

    const socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      setConnected(true)
      socketInstance.emit('join-room', {
        scheduleId: enrolledSchedule.id,
        userId: parseInt(session.user.id),
        userName: (session.user as any).nickname || session.user.name,
        userImage: session.user.image
      })
    })

    socketInstance.on('disconnect', () => {
      setConnected(false)
    })

    socketInstance.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session, enrolledSchedule, isEnded, showChat, scrollToBottom])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (showChat) {
      scrollToBottom()
    }
  }, [messages, showChat, scrollToBottom])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || isEnded || !enrolledSchedule) return

    const messageText = newMessage.trim()
    setNewMessage('')

    if (socket && connected) {
      socket.emit('send-message', {
        scheduleId: enrolledSchedule.id,
        userId: parseInt(session!.user.id),
        message: messageText
      })
    } else {
      setSending(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId: enrolledSchedule.id, message: messageText })
        })
        const data = await res.json()
        if (res.ok) {
          setMessages(prev => [...prev, data])
        }
      } catch (error) {
        console.error('Failed to send message:', error)
      } finally {
        setSending(false)
      }
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded">관리자</span>
      case 'instructor':
        return <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">강사</span>
      default:
        return null
    }
  }

  if (loading) {
    return null
  }

  // Not logged in
  if (!session?.user) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">수강생 채팅방</p>
            <p className="text-xs text-gray-500">로그인 후 수강 신청하면 채팅에 참여할 수 있습니다</p>
          </div>
        </div>
      </div>
    )
  }

  // Not enrolled
  if (!enrolledSchedule) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">수강생 전용 채팅방</p>
            <p className="text-xs text-gray-500">수강 신청 후 강사, 다른 수강생들과 실시간 대화하세요</p>
          </div>
        </div>
      </div>
    )
  }

  // Course ended
  if (isEnded) {
    return (
      <div className="mt-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{enrolledSchedule.cohort}기 채팅방 종료</p>
            <p className="text-xs text-gray-500">강의가 종료되어 채팅방이 닫혔습니다</p>
          </div>
        </div>
      </div>
    )
  }

  // Enrolled - show chat toggle or chat interface
  return (
    <div className="mt-6">
      {!showChat ? (
        <button
          onClick={() => setShowChat(true)}
          className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-green-900">{enrolledSchedule.cohort}기 채팅방</p>
                <p className="text-xs text-green-700">강사, 수강생들과 실시간 대화하기</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium text-gray-900">{courseName} {enrolledSchedule.cohort}기 채팅</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>아직 대화가 없습니다</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user.id === parseInt(session?.user?.id || '0')
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0 mr-2 overflow-hidden">
                        {msg.user.image ? (
                          <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            {(msg.user.nickname || msg.user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[75%]`}>
                      {!isMe && (
                        <div className="text-xs text-gray-500 mb-1 flex items-center">
                          {msg.user.nickname || msg.user.name}
                          {getRoleBadge(msg.user.role)}
                        </div>
                      )}
                      <div className={`flex items-end gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`px-3 py-1.5 rounded-2xl text-sm break-words ${
                            isMe
                              ? 'bg-green-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    {isMe && (
                      <div className="w-7 h-7 rounded-full bg-green-100 flex-shrink-0 ml-2 overflow-hidden">
                        {msg.user.image ? (
                          <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-green-600 text-xs font-medium">
                            {(msg.user.nickname || msg.user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-3 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
