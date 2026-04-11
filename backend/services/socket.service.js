const logger = require('./logger.service')

var gIo = null
var gBoardUsers = {} // { boardId: { socketId: user } }

function setupSocketAPI(http) {
    gIo = require('socket.io')(http, {
        cors: {
            origin: function (origin, callback) {
                if (!origin || origin.includes('incitedigital.com') || origin.includes('vercel.app') || origin.includes('localhost')) {
                    callback(null, true)
                } else {
                    callback(new Error('Not allowed by CORS'))
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    })
    gIo.on('connection', socket => {
        logger.info(`New connected socket [id: ${socket.id}]`)
        socket.on('disconnect', () => {
            logger.info(`Socket disconnected [id: ${socket.id}]`)
            _removeFromBoard(socket)
        })
        socket.on('chat-set-topic', topic => {
            if (socket.myTopic === topic) return
            if (socket.myTopic) {
                socket.leave(socket.myTopic)
                logger.info(`Socket is leaving topic ${socket.myTopic} [id: ${socket.id}]`)
            }
            socket.join(topic)
            socket.myTopic = topic
        })
        socket.on('chat-send-msg', msg => {
            console.log('msg:', msg)
            logger.info(`New chat msg from socket [id: ${socket.id}], emitting to topic ${socket.myTopic}`)
            socket.broadcast.to(socket.myTopic).emit('chat-add-msg', msg)
        })
        socket.on('watch-board', async (boardId) => {
            if (socket.myBoard === boardId) return
            if (socket.myBoard) {
                socket.leave(socket.myBoard)
                _removeFromBoard(socket)
                logger.info(`Socket is leaving board ${socket.myBoard} [id: ${socket.id}]`)
            }
            socket.join(boardId)
            socket.myBoard = boardId
            logger.info(`Socket joined board room ${boardId} [id: ${socket.id}]`)

            const user = socket.user || { _id: socket.id, fullname: 'Guest', imgUrl: '' }
            _addToBoard(socket, boardId, user)
        })

        socket.on('unwatch-board', boardId => {
            if (socket.myBoard === boardId) {
                socket.leave(boardId)
                _removeFromBoard(socket)
                socket.myBoard = null
                logger.info(`Socket unwatched board room ${boardId} [id: ${socket.id}]`)
            }
        })
        socket.on('set-user-socket', userId => {
            logger.info(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`)
            socket.userId = userId
            // We'll also attach the user object if we want richer presence later
            // For now, let's look up the user or just use the ID
        })

        socket.on('set-user-presence', user => {
            logger.info(`Setting socket.user and socket.userId for presence [id: ${socket.id}, userId: ${user?._id}]`)
            socket.user = user
            if (user?._id) socket.userId = user._id.toString()
            if (socket.myBoard) {
                _addToBoard(socket, socket.myBoard, user)
            }
        })

        socket.on('task-editing-start', ({ boardId, taskId }) => {
            const user = socket.user || { _id: socket.id, fullname: 'Guest' }
            socket.broadcast.to(boardId).emit('task-is-editing', { taskId, user })
        })

        socket.on('task-editing-stop', ({ boardId, taskId }) => {
            socket.broadcast.to(boardId).emit('task-stopped-editing', { taskId })
        })

        socket.on('unset-user-socket', () => {
            logger.info(`Removing socket.userId for socket [id: ${socket.id}]`)
            delete socket.userId
        })

    })
}

function emitTo({ type, data, label }) {
    if (label) gIo.to('watching:' + label.toString()).emit(type, data)
    else gIo.emit(type, data)
}

async function emitToUser({ type, data, userId }) {
    if (!userId) {
        logger.info(`Cannot emit to user without an explicit userId for event: ${type}`)
        return
    }
    userId = userId.toString()
    const socket = await _getUserSocket(userId)

    if (socket) {
        logger.info(`Emiting event: ${type} to user: ${userId} socket [id: ${socket.id}]`)
        socket.emit(type, data)
    } else {
        logger.info(`No active socket for user: ${userId}`)
        // _printSockets()
    }
}

// If possible, send to all sockets BUT not the current socket 
// Optionally, broadcast to a room / to all
async function broadcast({ type, data, room = null, userId }) {
    if (room) room = room.toString()
    logger.info(`Broadcasting event: ${type} to room: ${room}`)

    let excludedSocket = null
    if (userId) {
        userId = userId.toString()
        excludedSocket = await _getUserSocket(userId)
    }

    if (room && excludedSocket) {
        logger.info(`Broadcast to room ${room} excluding user: ${userId}`)
        excludedSocket.broadcast.to(room).emit(type, data)
    } else if (excludedSocket) {
        logger.info(`Broadcast to all excluding user: ${userId}`)
        excludedSocket.broadcast.emit(type, data)
    } else if (room) {
        logger.info(`Emit to room: ${room}`)
        gIo.to(room).emit(type, data)
    } else {
        logger.info(`Emit to all`)
        gIo.emit(type, data)
    }
}

async function _getUserSocket(userId) {
    const sockets = await _getAllSockets()
    const socket = sockets.find(s => s.userId === userId)
    return socket
}
async function _getAllSockets() {
    // return all Socket instances
    const sockets = await gIo.fetchSockets()
    return sockets
}

async function _printSockets() {
    const sockets = await _getAllSockets()
    console.log(`Sockets: (count: ${sockets.length}):`)
    sockets.forEach(_printSocket)
}
function _printSocket(socket) {
    console.log(`Socket - socketId: ${socket.id} userId: ${socket.userId}`)
}

function _addToBoard(socket, boardId, user) {
    if (!gBoardUsers[boardId]) gBoardUsers[boardId] = {}
    gBoardUsers[boardId][socket.id] = user
    _broadcastBoardUsers(boardId)
}

function _removeFromBoard(socket) {
    const boardId = socket.myBoard
    if (!boardId || !gBoardUsers[boardId]) return
    delete gBoardUsers[boardId][socket.id]
    if (Object.keys(gBoardUsers[boardId]).length === 0) delete gBoardUsers[boardId]
    _broadcastBoardUsers(boardId)
}

function _broadcastBoardUsers(boardId) {
    const usersMap = gBoardUsers[boardId] || {}
    const users = Object.values(usersMap)
    // Filter out duplicates if same user has multiple sockets
    const uniqueUsers = []
    const userIds = new Set()
    users.forEach(u => {
        if (!userIds.has(u._id)) {
            userIds.add(u._id)
            uniqueUsers.push(u)
        }
    })
    gIo.to(boardId).emit('board-users-online', uniqueUsers)
}

module.exports = {
    // set up the sockets service and define the API
    setupSocketAPI,
    // emit to everyone / everyone in a specific room (label)
    emitTo,
    // emit to a specific user (if currently active in system)
    emitToUser,
    // Send to all sockets BUT not the current socket - if found
    // (otherwise broadcast to a room / to all)
    broadcast,
}
