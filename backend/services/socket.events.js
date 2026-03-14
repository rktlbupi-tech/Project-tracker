const eventBus = require('./event-bus.service')
const socketService = require('./socket.service')

function registerSocketEvents() {
  eventBus.on('TASK_UPDATED', async (payload) => {
    // When a task updates, we broadcast the updated board to the room
    const boardService = require('../api/board/board.service')
    try {
      const updatedBoard = await boardService.getById(payload.boardId)
      socketService.broadcast({ type: 'board-add-update', data: updatedBoard, room: payload.boardId })
    } catch(err) {
      console.error('Failed to broadcast TASK_UPDATED', err)
    }
  })

  eventBus.on('GROUP_UPDATED', async (payload) => {
    // When a group updates, we broadcast the updated board to the room
    const boardService = require('../api/board/board.service')
    try {
      const updatedBoard = await boardService.getById(payload.boardId)
      socketService.broadcast({ type: 'board-add-update', data: updatedBoard, room: payload.boardId })
    } catch(err) {
      console.error('Failed to broadcast GROUP_UPDATED', err)
    }
  })

  eventBus.on('BOARD_UPDATED', (board) => {
    // When the automation engine updates the whole board, broadcast it
    socketService.broadcast({ type: 'board-add-update', data: board, room: board._id })
  })
}

module.exports = { registerSocketEvents }
