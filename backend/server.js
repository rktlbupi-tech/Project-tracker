require('dotenv').config({ path: ['.env.local', '.env'] })
const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')

const app = express()
const http = require('http').createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Request Logging Middleware
const logger = require('./services/logger.service')
app.use((req, res, next) => {
    logger.debug(`[${req.method}] ${req.url}`)
    next()
})


const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'https://workio-neon.vercel.app',
        'https://project-tracker-nine-pied.vercel.app',
        'https://project-tracker-bice-omega.vercel.app',
        'https://project.incitedigital.com',
        'https://project-tracker-gilt.vercel.app'
    ],
    credentials: true
}
app.use(cors(corsOptions))


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
}

const authRoutes = require('./api/auth/auth.routes')
const userRoutes = require('./api/user/user.routes')
const boardRoutes = require('./api/board/board.routes')
const workspaceRoutes = require('./api/workspace/workspace.routes')
const inviteRoutes = require('./api/invite/invite.routes')
const { setupSocketAPI } = require('./services/socket.service')
const { registerSocketEvents } = require('./services/socket.events')

// routes
const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
app.all('*', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/board', boardRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/invite', inviteRoutes)
setupSocketAPI(http)

// Initialize Database and Services
const dbService = require('./services/db.service')
dbService.connect()
require('./services/automation.service')
require('./services/deadline-reminder.service')
registerSocketEvents()

app.get('/api', (req, res) => {
    res.send('<h1>project tracker workio backend running</h1>')
})

app.get('/**', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})



const port = process.env.PORT || 3031

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    http.listen(port, () => {
        logger.info('Server is running on port: ' + port)
    })
}

module.exports = app