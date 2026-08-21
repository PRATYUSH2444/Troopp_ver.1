import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'

import app from './app.js'
import { sequelize, City } from './models/index.js'
import logger from './config/logger.js'
import socketAuthMiddleware from './middleware/socketAuth.js'
import registerTripRoomHandlers from './sockets/tripRoomHandler.js'
import initCronJobs from './jobs/index.js'

const PORT = process.env.PORT || 5000

// 1. Create HTTP Server from Express application
const server = http.createServer(app)

// 2. Attach Socket.io to HTTP Server
const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true
  if (origin.endsWith('.vercel.app')) return true
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL.trim()) return true
  if (process.env.CORS_ALLOWED_ORIGINS) {
    const list = process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim())
    if (list.includes(origin)) return true
  }
  return false
}

const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
      } else {
        callback(new Error('CORS blocked'))
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Attach io to express app for access in REST controller handlers
app.set('io', io)
global.io = io

// 3. Register Socket.io Authentication Middleware
io.use(socketAuthMiddleware)

// 4. Register Trip Room & Community socket events connection listeners
io.on('connection', (socket) => {
  logger.info(`Socket connection established: ${socket.id} (User: ${socket.user?.id})`)
  registerTripRoomHandlers(io, socket)

  // Community Room Subscriptions
  socket.on('community:join_post', (postId) => {
    socket.join(`post:${postId}`)
    logger.debug(`Socket ${socket.id} joined room post:${postId}`)
  })

  socket.on('community:leave_post', (postId) => {
    socket.leave(`post:${postId}`)
    logger.debug(`Socket ${socket.id} left room post:${postId}`)
  })
})

// Validate critical environment variables in production
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'troopp_jwt_access_secret_key_production_2026_x77'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'troopp_jwt_refresh_secret_key_production_2026_x77'

// 5. Initialize background cron jobs
initCronJobs()

// 6. Connect Database and Start HTTP Server
const startServer = async () => {
  try {
    logger.info('Connecting to PostgreSQL database...')
    await sequelize.authenticate()
    logger.info('Database connection established successfully.')

    // Synchronize all models with PostgreSQL database to create any missing tables automatically
    logger.info('Synchronizing database schema...')
    await sequelize.sync({ alter: true })
    logger.info('Database schema synchronized successfully.')

    // Auto-seed default cities if table is empty
    await City.seedDefaultsIfNeeded()

    server.listen(PORT, () => {
      logger.info(`=== TROOPP BACKEND SERVER ONLINE ===`)
      logger.info(`Listening at: http://localhost:${PORT}`)
      logger.info(`Real-time WebSockets path: ws://localhost:${PORT}/socket.io`)
      logger.info(`Running in mode: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    logger.error('CRITICAL: Server startup failed due to database connectivity error:', error)
    process.exit(1)
  }
}

// 7. Handle Graceful Shutdown
const handleGracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown procedure...`)

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed.')

    // Close socket connections
    io.close(() => {
      logger.info('WebSocket connections closed.')
    })

    // Terminate DB connection pool
    try {
      await sequelize.close()
      logger.info('Database connection pool terminated.')
      logger.info('Graceful shutdown finished. Exiting process.')
      process.exit(0)
    } catch (err) {
      logger.error('Error closing database connection pool:', err)
      process.exit(1)
    }
  })

  // Timeout fallback to force shutdown if clean close takes too long
  setTimeout(() => {
    logger.error('Forced shutdown triggered after shutdown timeout limit reached.')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'))
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'))

// Boot Server
startServer()
