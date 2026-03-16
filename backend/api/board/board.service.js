const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy, loggedinUser) {
    try {
        const criteria = {}
        if (filterBy.title) criteria.title = { $regex: filterBy.title, $options: 'i' }
        if (filterBy.isStarred) criteria.isStarred = filterBy.isStarred
        if (filterBy.workspaceId) criteria.workspaceId = filterBy.workspaceId

        if (loggedinUser) {
            criteria.$or = [
                { 'createdBy._id': loggedinUser._id },
                { 'members._id': loggedinUser._id }
            ]
        }
        
        const collection = await dbService.getCollection('board')
        var boards = await collection.find(criteria).toArray()
        return boards
    } catch (err) {
        logger.error('cannot find boards', err)
        throw err
    }
}

async function getById(boardId) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await collection.findOne({ _id: ObjectId(boardId) })
        return board
    } catch (err) {
        logger.error(`while finding board ${boardId}`, err)
        throw err
    }
}

async function remove(boardId) {
    try {
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

async function update(board) {
    try {
        const boardToSave = {...board}
        delete boardToSave._id
        const collection = await dbService.getCollection('board')
        await collection.updateOne({ _id: ObjectId(board._id) }, { $set: boardToSave })
        return board
    } catch (err) {
        logger.error(`cannot update board ${board._id}`, err)
        throw err
    }
}

async function updateTask(boardId, groupId, taskId, saveTask){
    try {
        const board =  await getById(boardId)
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
        await update(board)
        return board
    } catch (err) {
        logger.error(`cannot update task ${taskId}`, err)
        throw err
    }
}

async function updateGroup(boardId, groupId, saveGroup){
    try {
        const board =  await getById(boardId)
        board.groups = board.groups.map(group => (group.id === groupId) ? saveGroup : group)
        await update(board)
        return board
    } catch (err) {
        logger.error(`cannot update task ${groupId}`, err)
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
    updateGroup
}
