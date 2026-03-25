const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const userService = require('../user/user.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy, loggedinUser) {
    try {
        // If no logged-in user or guest, they see no boards
        if (!loggedinUser || !loggedinUser._id) return []

        const criteria = {}
        if (filterBy.title) criteria.title = { $regex: filterBy.title, $options: 'i' }
        if (filterBy.workspaceId && filterBy.workspaceId !== 'undefined') {
            criteria.workspaceId = filterBy.workspaceId
        }

        // Only return boards where the user is creator OR an accepted member
        const userId = loggedinUser._id.toString()
        criteria.$or = [
            { 'createdBy._id': userId },
            { 'members._id': userId }
        ]

        const isStarred = (filterBy.isStarred === 'true' || filterBy.isStarred === true)
        if (isStarred) {
            const user = await userService.getById(loggedinUser._id)
            const starredBoardIds = user.starredBoardIds || []
            criteria._id = { $in: starredBoardIds.map(id => ObjectId(id)) }
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
        if (!board) throw new Error(`Board ${boardId} not found`)

        // Access check: user must be creator or an accepted member
        if (loggedinUser && loggedinUser._id) {
            const userId = loggedinUser._id.toString()
            const isCreator = board.createdBy?._id?.toString() === userId
            const isMember = board.members?.some(m => m._id?.toString() === userId)
            if (!isCreator && !isMember) {
                const err = new Error('Forbidden')
                err.status = 403
                throw err
            }
        }

        return board
    } catch (err) {
        logger.error(`cannot find board ${boardId}`, err)
        throw err
    }
}

async function remove(boardId, loggedinUser) {
    try {
        await getById(boardId, loggedinUser)
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
        const prevBoard = await getById(board._id, loggedinUser)
        const boardToSave = {...board}
        delete boardToSave._id

        // Logging: Detect group deletion
        const prevGroupIds = prevBoard.groups.map(g => (g.id || g._id?.toString()))
        const nextGroupIds = board.groups.map(g => (g.id || g._id?.toString()))
        const deletedGroupId = prevGroupIds.find(id => !nextGroupIds.includes(id))
        
        if (deletedGroupId && loggedinUser) {
            const deletedGroup = prevBoard.groups.find(g => (g.id === deletedGroupId || g._id?.toString() === deletedGroupId))
            if (deletedGroup) {
                const activity = {
                    id: _makeId(),
                    txt: `Deleted group: ${deletedGroup.title}`,
                    createdAt: Date.now(),
                    byMember: {
                        _id: loggedinUser._id,
                        fullname: loggedinUser.fullname,
                        imgUrl: loggedinUser.imgUrl
                    }
                }
                if (!boardToSave.activities) boardToSave.activities = []
                boardToSave.activities.unshift(activity)
                if (boardToSave.activities.length > 30) boardToSave.activities.pop()
            }
        }

        const collection = await dbService.getCollection('board')
        await collection.updateOne({ _id: ObjectId(board._id) }, { $set: boardToSave })
        
        // Detect task assignment changes
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
                    const memberIdStr = memberId.toString()
                    // No self-check for testing
                    // if (memberIdStr === loggedinUser._id.toString()) return

                    const notification = {
                        id: userService.makeId(),
                        type: 'task-assigned',
                        txt: `Assigned you task: ${task.title}`,
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

async function _sendDeadlineUpdateNotifications(board, task, loggedinUser) {
    const socketService = require('../../services/socket.service')
    const memberIds = task.memberIds || []
    
    if (!memberIds.length) return

    const notification = {
        id: userService.makeId(),
        type: 'deadline-assigned',
        txt: `New deadline set for: ${task.title}`,
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

    memberIds.forEach(async (memberId) => {
        const memberIdStr = memberId.toString()
        // No self-check for testing
        // if (memberIdStr === loggedinUser._id.toString()) return

        try {
            await userService.addNotification(memberIdStr, notification)
            socketService.emitToUser({
                type: 'notification-received',
                data: notification,
                userId: memberIdStr
            })
        } catch (err) {
            logger.error(`Failed to send deadline notification to ${memberIdStr}`, err)
        }
    })
}

async function updateTask(boardId, groupId, taskId, saveTask, loggedinUser){
    try {
        const board =  await getById(boardId, loggedinUser)
        const group = board.groups.find(group => group.id === groupId)
        
        let targetTaskIdx = group.tasks.findIndex(task => task.id === taskId)
        if (targetTaskIdx === -1) throw new Error(`Task ${taskId} not found`)
        
        const dbTask = group.tasks[targetTaskIdx]

        // 1. Version Check
        if (saveTask.version && dbTask.version && saveTask.version < dbTask.version) {
            const conflictErr = new Error(`Conflict`)
            conflictErr.status = 409 
            throw conflictErr
        }

        saveTask.version = (dbTask.version || 0) + 1
        group.tasks[targetTaskIdx] = saveTask
        
        // Instant Notification: Detect deadline changes
        if (dbTask.deadline !== saveTask.deadline && saveTask.deadline && loggedinUser) {
            _sendDeadlineUpdateNotifications(board, saveTask, loggedinUser)
        }

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
        const isMember = board.members.some(member => member._id.toString() === loggedinUser._id.toString())
        if (isMember) return board
        board.members.push({
            _id: loggedinUser._id,
            fullname: loggedinUser.fullname,
            imgUrl: loggedinUser.imgUrl
        })
        const boardToSave = {...board}
        delete boardToSave._id
        await collection.updateOne({ _id: ObjectId(boardId) }, { $set: boardToSave })
        return board
    } catch (err) {
        logger.error('cannot add member', err)
        throw err
    }
}

function _makeId(length = 6) {
    var txt = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (var i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return txt
}

module.exports = {
    query,
    getById,
    remove,
    add,
    update,
    updateTask,
    updateGroup,
    addMember
}
