const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

async function query(filterBy = {}) {
    try {
        const criteria = {}
        if (filterBy.userId) {
            criteria.$or = [
                { 'createdBy._id': filterBy.userId },
                { 'members._id': filterBy.userId }
            ]
        }
        const collection = await dbService.getCollection('workspace')
        const workspaces = await collection.find(criteria).toArray()
        return workspaces
    } catch (err) {
        logger.error('cannot find workspaces', err)
        throw err
    }
}

async function getById(workspaceId) {
    try {
        const collection = await dbService.getCollection('workspace')
        const workspace = await collection.findOne({ _id: ObjectId(workspaceId) })
        return workspace
    } catch (err) {
        logger.error(`while finding workspace ${workspaceId}`, err)
        throw err
    }
}

async function add(workspace) {
    try {
        const collection = await dbService.getCollection('workspace')
        await collection.insertOne(workspace)
        return workspace
    } catch (err) {
        logger.error('cannot insert workspace', err)
        throw err
    }
}

async function update(workspace) {
    try {
        const workspaceToSave = { ...workspace }
        delete workspaceToSave._id
        const collection = await dbService.getCollection('workspace')
        await collection.updateOne({ _id: ObjectId(workspace._id) }, { $set: workspaceToSave })
        return workspace
    } catch (err) {
        logger.error(`cannot update workspace ${workspace._id}`, err)
        throw err
    }
}

async function remove(workspaceId) {
    try {
        const collection = await dbService.getCollection('workspace')
        await collection.deleteOne({ _id: ObjectId(workspaceId) })

        // Delete associated boards
        const boardCollection = await dbService.getCollection('board')
        const deleteResult = await boardCollection.deleteMany({ workspaceId })
        logger.info(`Deleted ${deleteResult.deletedCount} boards associated with workspace ${workspaceId}`)

        return workspaceId
    } catch (err) {
        logger.error(`cannot remove workspace ${workspaceId}`, err)
        throw err
    }
}

async function addMember(workspaceId, user, role = 'member') {
    try {
        const workspace = await getById(workspaceId)
        if (!workspace) throw new Error('Workspace not found')
        
        // Check if already a member
        const isMember = workspace.members.some(m => m._id.toString() === user._id.toString())
        if (isMember) return workspace

        workspace.members.push({
            _id: user._id,
            fullname: user.fullname,
            imgUrl: user.imgUrl,
            role
        })

        logger.debug(`Adding member ${user.username} to workspace. New members: ${JSON.stringify(workspace.members)}`)
        return await update(workspace)
    } catch (err) {
        logger.error(`cannot add member to workspace ${workspaceId}`, err)
        throw err
    }
}

module.exports = {
    query,
    getById,
    add,
    update,
    remove,
    addMember
}
