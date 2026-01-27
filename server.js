const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const prisma = new PrismaClient()

// Store active users per room
const roomUsers = new Map()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join a chat room (scheduleId)
    socket.on('join-room', async ({ scheduleId, userId, userName, userImage }) => {
      const roomId = `schedule-${scheduleId}`
      socket.join(roomId)

      // Store user info
      socket.data = { scheduleId, userId, userName, userImage, roomId }

      // Track users in room
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map())
      }
      roomUsers.get(roomId).set(socket.id, { id: userId, name: userName, image: userImage })

      // Notify others
      socket.to(roomId).emit('user-joined', { userId, userName })

      // Send current online users
      const usersInRoom = Array.from(roomUsers.get(roomId).values())
      io.to(roomId).emit('users-online', usersInRoom)

      console.log(`User ${userName} joined room ${roomId}`)
    })

    // Handle new message
    socket.on('send-message', async ({ scheduleId, userId, message }) => {
      try {
        // Save message to database
        const savedMessage = await prisma.chatMessage.create({
          data: {
            scheduleId: parseInt(scheduleId),
            userId: parseInt(userId),
            message: message
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                image: true,
                role: true
              }
            }
          }
        })

        const roomId = `schedule-${scheduleId}`

        // Broadcast message to all users in room
        io.to(roomId).emit('new-message', {
          id: savedMessage.id,
          message: savedMessage.message,
          createdAt: savedMessage.createdAt.toISOString(),
          user: savedMessage.user
        })
      } catch (error) {
        console.error('Error saving message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicator
    socket.on('typing', ({ scheduleId, userName }) => {
      const roomId = `schedule-${scheduleId}`
      socket.to(roomId).emit('user-typing', { userName })
    })

    socket.on('stop-typing', ({ scheduleId }) => {
      const roomId = `schedule-${scheduleId}`
      socket.to(roomId).emit('user-stop-typing')
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const { roomId, userId, userName } = socket.data || {}

      if (roomId && roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id)

        // Notify others
        socket.to(roomId).emit('user-left', { userId, userName })

        // Send updated online users
        const usersInRoom = Array.from(roomUsers.get(roomId).values())
        io.to(roomId).emit('users-online', usersInRoom)

        // Clean up empty rooms
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId)
        }
      }

      console.log('Client disconnected:', socket.id)
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
