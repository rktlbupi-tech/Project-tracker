const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

async function query() {
    try {
        const collection = await dbService.getCollection('workspace')
        var workspaces = await collection.find({}).toArray()
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

async function remove(workspaceId) {
    try {
        const collection = await dbService.getCollection('workspace')
        await collection.deleteOne({ _id: ObjectId(workspaceId) })
        return workspaceId
    } catch (err) {
        logger.error(`cannot remove workspace ${workspaceId}`, err)
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

module.exports = {
    query,
    getById,
    remove,
    add,
    update
}
