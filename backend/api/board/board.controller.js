const boardService = require('./board.service.js')

const logger = require('../../services/logger.service')
const eventBus = require('../../services/event-bus.service')
const socketService = require('../../services/socket.service')

async function getBoards(req, res) {
  try {
    logger.debug('Getting Boards')
    const filterBy = {
      title: req.query.title || '',
    }
    filterBy.isStarred = req.query.isStarred === 'true' ? true : false

    const boards = await boardService.query(filterBy, req.loggedinUser)
    res.json(boards)
  } catch (err) {
    logger.error('Failed to get boards', err)
    res.status(500).send({ err: 'Failed to get boards' })
  }
}

async function getBoardById(req, res) {
  try {
    const boardId = req.params.boardId
    const board = await boardService.getById(boardId)
    res.json(board)
  } catch (err) {
    logger.error('Failed to get board', err)
    res.status(500).send({ err: 'Failed to get board' })
  }
}

async function addBoard(req, res) {
  try {
    const board = req.body
    const addedBoard = await boardService.add(board)
    
    socketService.broadcast({ type: 'board-add-update', data: addedBoard, room: addedBoard._id })
    res.json(addedBoard)
  } catch (err) {
    logger.error('Failed to add board', err)
    res.status(500).send({ err: 'Failed to add board' })
  }
}


async function updateBoard(req, res) {
  try {
    const board = req.body
    const updatedBoard = await boardService.update(board)
    
    socketService.broadcast({ type: 'board-add-update', data: updatedBoard, room: updatedBoard._id })
    res.json(updatedBoard)
  } catch (err) {
    logger.error('Failed to update board', err)
    res.status(500).send({ err: 'Failed to update board' })

  }
}

async function removeBoard(req, res) {
  try {
    const boardId = req.params.boardId
    const removedId = await boardService.remove(boardId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove board', err)
    res.status(500).send({ err: 'Failed to remove board' })
  }
}

async function updateTask(req, res) {
  try {
    const task = req.body
    const { boardId, groupId, taskId } = req.params
    
    // Get old board to compare members
    const oldBoard = await boardService.getById(boardId)
    const oldGroup = oldBoard.groups.find(g => (g.id === groupId || g._id === groupId))
    const oldTask = oldGroup?.tasks.find(t => (t.id === taskId || t._id === taskId))
    const oldMemberIds = oldTask?.memberIds || []

    const board = await boardService.updateTask(boardId, groupId, taskId, task)
    
    // Detect new members
    const newMemberIds = task.memberIds || []
    const addedMemberIds = newMemberIds.filter(id => !oldMemberIds.includes(id))

    if (addedMemberIds.length > 0) {
      const fromUser = req.loggedinUser
      const userService = require('../user/user.service')
      
      for (const userId of addedMemberIds) {
        const notification = {
          id: userService.makeId(),
          type: 'task-assigned',
          from: { _id: fromUser._id, fullname: fromUser.fullname, imgUrl: fromUser.imgUrl },
          board: { _id: boardId, title: board.title },
          task: { id: taskId, title: task.title },
          createdAt: Date.now(),
          status: 'pending' // For task notifications, maybe just 'unread'? Using pending for consistency
        }
        await userService.addNotification(userId, notification)
        
        // Notify via socket
        socketService.emitToUser({
          type: 'notification-received',
          data: notification,
          userId: userId
        })
      }
    }

    // Find the specific task in the updated board to send to the automation engine
    const group = board.groups.find(g => (g.id === groupId || g._id === groupId))
    const taskToSend = group.tasks.find(t => (t.id === taskId || t._id === taskId))
    
    // Event emitted for the Automation Engine
    eventBus.emit('TASK_UPDATED', { boardId, groupId, task: taskToSend })

    res.send(board)
  } catch (err) {
    logger.error('Failed to update task', err)
    res.status(500).send({ err: 'Failed to update task' })
  }
}

async function updateGroup(req, res) {
  try {
    const group = req.body
    const {boardId, groupId} = req.params
    const groupToSend = await boardService.updateGroup(boardId, groupId, group)
    
    // Event emitted for the Automation Engine (which now bridges to sockets)
    eventBus.emit('GROUP_UPDATED', { boardId, group: groupToSend })

    res.send(groupToSend)
  } catch (err) {
    logger.error('Failed to update group', err)
    res.status(500).send({ err: 'Failed to update group' })
  }
}

// async function addCarMsg(req, res) {
//   const {loggedinUser} = req
//   try {
//     const carId = req.params.id
//     const msg = {
//       txt: req.body.txt,
//       by: loggedinUser
//     }
//     const savedMsg = await carService.addCarMsg(carId, msg)
//     res.json(savedMsg)
//   } catch (err) {
//     logger.error('Failed to update car', err)
//     res.status(500).send({ err: 'Failed to update car' })

//   }
// }

// async function removeCarMsg(req, res) {
//   const {loggedinUser} = req
//   try {
//     const carId = req.params.id
//     const {msgId} = req.params

//     const removedId = await carService.removeCarMsg(carId, msgId)
//     res.send(removedId)
//   } catch (err) {
//     logger.error('Failed to remove car msg', err)
//     res.status(500).send({ err: 'Failed to remove car msg' })

//   }
// }

module.exports = {
  getBoards,
  getBoardById,
  addBoard,
  updateBoard,
  removeBoard,
  updateTask,
  updateGroup
}
