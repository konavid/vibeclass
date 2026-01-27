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

interface Props {
  scheduleId: number
  courseName: string
  cohort: number
  onClose: () => void
}

export default function ChatRoom({ scheduleId, courseName, cohort, onClose }: Props) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?scheduleId=${scheduleId}&limit=100`)
        const data = await res.json()
        if (res.ok) {
          setMessages(data.messages)
          setIsEnded(data.isEnded)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [scheduleId])

  // Connect to Socket.io
  useEffect(() => {
    if (!session?.user || isEnded) return

    const socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected')
      setConnected(true)

      // Join room
      socketInstance.emit('join-room', {
        scheduleId,
        userId: parseInt(session.user.id),
        userName: (session.user as any).nickname || session.user.name,
        userImage: session.user.image
      })
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    socketInstance.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })

    socketInstance.on('users-online', (users: ChatUser[]) => {
      setOnlineUsers(users)
    })

    socketInstance.on('user-typing', ({ userName }) => {
      setTypingUser(userName)
    })

    socketInstance.on('user-stop-typing', () => {
      setTypingUser(null)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session, scheduleId, isEnded, scrollToBottom])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || isEnded) return

    const messageText = newMessage.trim()
    setNewMessage('')

    if (socket && connected) {
      // Send via WebSocket
      socket.emit('send-message', {
        scheduleId,
        userId: parseInt(session!.user.id),
        message: messageText
      })
      socket.emit('stop-typing', { scheduleId })
    } else {
      // Fallback to HTTP
      setSending(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId, message: messageText })
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

  const handleTyping = () => {
    if (!socket || !connected || isEnded) return

    socket.emit('typing', { scheduleId, userName: (session?.user as any)?.nickname || session?.user?.name })

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { scheduleId })
    }, 1000)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
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

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, ChatMessage[]>)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="font-bold text-gray-900">{courseName} {cohort}기 채팅방</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span>{connected ? '연결됨' : '연결 중...'}</span>
              {onlineUsers.length > 0 && (
                <span className="ml-2">{onlineUsers.length}명 접속 중</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>아직 대화가 없습니다.</p>
              <p className="text-sm">첫 번째 메시지를 보내보세요!</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">{date}</span>
                  </div>
                  <div className="space-y-3">
                    {msgs.map((msg) => {
                      const isMe = msg.user.id === parseInt(session?.user?.id || '0')
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 mr-2 overflow-hidden">
                              {msg.user.image ? (
                                <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                  {(msg.user.nickname || msg.user.name).charAt(0)}
                                </div>
                              )}
                            </div>
                          )}
                          <div className={`max-w-[70%] ${isMe ? 'order-1' : ''}`}>
                            {!isMe && (
                              <div className="text-xs text-gray-600 mb-1 flex items-center">
                                {msg.user.nickname || msg.user.name}
                                {getRoleBadge(msg.user.role)}
                              </div>
                            )}
                            <div className={`flex items-end gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <div
                                className={`px-3 py-2 rounded-2xl break-words ${
                                  isMe
                                    ? 'bg-gray-900 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                                }`}
                              >
                                {msg.message}
                              </div>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {typingUser && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>{typingUser}님이 입력 중...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          {isEnded ? (
            <div className="text-center py-2 text-gray-500 bg-gray-100 rounded-lg">
              강의가 종료되어 채팅이 비활성화되었습니다.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
