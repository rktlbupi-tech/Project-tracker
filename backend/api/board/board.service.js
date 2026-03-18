const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const userService = require('../user/user.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy, loggedinUser) {
    try {
        const criteria = {}
        // logger.debug('Querying boards with loggedinUser:', loggedinUser)
        if (filterBy.title) criteria.title = { $regex: filterBy.title, $options: 'i' }
        
        if (filterBy.workspaceId && filterBy.workspaceId !== 'undefined') {
            criteria.workspaceId = filterBy.workspaceId
        }

        const isStarred = (filterBy.isStarred === 'true' || filterBy.isStarred === true)
        if (isStarred) {
            const user = await userService.getById(loggedinUser._id)
            const starredBoardIds = user.starredBoardIds || []
            criteria._id = { $in: starredBoardIds.map(id => ObjectId(id)) }
        }

        if (loggedinUser) {
            criteria.$or = [
                { 'createdBy._id': loggedinUser._id },
                { 'members._id': loggedinUser._id }
            ]
        } else {
            return []
        }
        
        const collection = await dbService.getCollection('board')
        var boards = await collection.find(criteria).toArray()
        return boards
    } catch (err) {
        logger.error('cannot find boards', err)
        throw err
    }
}

async function getById(boardId, loggedinUser) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await collection.findOne({ _id: ObjectId(boardId) })

        if (!board) return null

        // If no user is provided and it's not a public check, we assume it's a system action 
        // In a real app, we would check if the board is public here.
        if (!loggedinUser) return board

        // Robust permission check
        const loggedinUserId = loggedinUser._id.toString()
        const creatorId = board.createdBy?._id?.toString()
        const isCreator = creatorId === loggedinUserId
        const isMember = board.members?.some(m => m._id && m._id.toString() === loggedinUserId)

        if (!isCreator && !isMember) {
            const error = new Error('Not Authorized to view this board')
            error.status = 403
            throw error
        }

        return board
    } catch (err) {
        logger.error(`while finding board ${boardId}`, err)
        throw err
    }
}

async function remove(boardId, loggedinUser) {
    try {
        await getById(boardId, loggedinUser) // This will throw if no permission
        const collection = await dbService.getCollection('board')
        await collection.deleteOne({ _id: ObjectId(boardId) })
        return boardId
    } catch (err) {
        logger.error(`cannot remove board ${boardId}`, err)
        throw err
    }
}

async function add(board) {
    try {
        const collection = await dbService.getCollection('board')
        await collection.insertOne(board)
        return board
    } catch (err) {
        logger.error('cannot insert board', err)
        throw err
    }
}

async function update(board, loggedinUser) {
    try {
        const prevBoard = await getById(board._id, loggedinUser) // This will throw if no permission
        const boardToSave = {...board}
        delete boardToSave._id
        const collection = await dbService.getCollection('board')
        await collection.updateOne({ _id: ObjectId(board._id) }, { $set: boardToSave })
        
        // Detect task assignment changes across the entire board
        if (loggedinUser) {
            _sendTaskAssignmentNotifications(board, prevBoard, loggedinUser)
        }

        return board
    } catch (err) {
        logger.error(`cannot update board ${board._id}`, err)
        throw err
    }
}

async function _sendTaskAssignmentNotifications(board, prevBoard, loggedinUser) {
    const socketService = require('../../services/socket.service')
    
    // Create a map of previous task members for easy comparison
    const prevTaskMembersMap = {}
    prevBoard.groups.forEach(group => {
        group.tasks.forEach(task => {
            prevTaskMembersMap[task.id] = task.memberIds || []
        })
    })

    board.groups.forEach(group => {
        group.tasks.forEach(task => {
            const prevMemberIds = prevTaskMembersMap[task.id] || []
            const nextMemberIds = task.memberIds || []
            const newMemberIds = nextMemberIds.filter(id => !prevMemberIds.includes(id))

            if (newMemberIds.length > 0) {
                newMemberIds.forEach(async (memberId) => {
                    // Don't notify yourself
                    const memberIdStr = memberId.toString()
                    const loggedinUserIdStr = loggedinUser._id.toString()
                    if (memberIdStr === loggedinUserIdStr) return

                    const notification = {
                        id: userService.makeId(),
                        type: 'task-assigned',
                        from: {
                            _id: loggedinUser._id,
                            fullname: loggedinUser.fullname,
                            imgUrl: loggedinUser.imgUrl
                        },
                        board: {
                            _id: board._id,
                            title: board.title
                        },
                        task: {
                            id: task.id,
                            title: task.title
                        },
                        createdAt: Date.now(),
                        isRead: false
                    }

                    try {
                        await userService.addNotification(memberIdStr, notification)
                        socketService.emitToUser({
                            type: 'notification-received',
                            data: notification,
                            userId: memberIdStr
                        })
                    } catch (notiErr) {
                        logger.error(`Failed to send notification to ${memberIdStr}`, notiErr)
                    }
                })
            }
        })
    })
}

async function updateTask(boardId, groupId, taskId, saveTask, loggedinUser){
    try {
        const board =  await getById(boardId, loggedinUser)
        const group = board.groups.find(group => group.id === groupId)
        
        let targetTaskIdx = group.tasks.findIndex(task => task.id === taskId)
        if (targetTaskIdx === -1) throw new Error(`Task ${taskId} not found`)
        
        const dbTask = group.tasks[targetTaskIdx]

        // 1. Version Check (Optimistic Concurrency)
        if (saveTask.version && dbTask.version && saveTask.version < dbTask.version) {
            const conflictErr = new Error(`Conflict: Task was modified by another user. Refresh to see the latest changes.`)
            conflictErr.status = 409 // HTTP 409 Conflict
            throw conflictErr
        }

        // 2. Increment Version
        saveTask.version = (dbTask.version || 0) + 1

        group.tasks[targetTaskIdx] = saveTask
        await update(board, loggedinUser)
        return board
    } catch (err) {
        logger.error(`cannot update task ${taskId}`, err)
        throw err
    }
}

async function updateGroup(boardId, groupId, saveGroup, loggedinUser){
    try {
        const board =  await getById(boardId, loggedinUser)
        board.groups = board.groups.map(group => (group.id === groupId) ? saveGroup : group)
        await update(board, loggedinUser)
        return board
    } catch (err) {
        logger.error(`cannot update task ${groupId}`, err)
        throw err
    }
}

async function addMember(boardId, loggedinUser) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await collection.findOne({ _id: ObjectId(boardId) })

        if (!board) throw new Error(`Board ${boardId} not found`)

        // Check if member already exists
        const isMember = board.members.some(member => member._id.toString() === loggedinUser._id.toString())
        const isCreator = board.createdBy._id.toString() === loggedinUser._id.toString()

        if (!isMember && !isCreator) {
            board.members.push({
                _id: loggedinUser._id,
                fullname: loggedinUser.fullname,
                imgUrl: loggedinUser.imgUrl
            })
            const boardToSave = { ...board }
            delete boardToSave._id
            await collection.updateOne({ _id: ObjectId(board._id) }, { $set: boardToSave })
        }

        return board
    } catch (err) {
        logger.error(`cannot add member to board ${boardId}`, err)
        throw err
    }
}

module.exports = {
    remove,
    query,
    getById,
    add,
    update,
    updateTask,
    updateGroup,
    addMember
}
