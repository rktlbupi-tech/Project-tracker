const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    query,
    getById,
    getByUsername,
    remove,
    update,
    add,
    addInvitation,
    updateInvitationStatus,
    addNotification,
    clearNotifications,
    markNotificationsRead,
    updateLastSeenNotifications,
    toggleStarredBoard,
    makeId
}

async function toggleStarredBoard(userId, boardId) {
    try {
        const user = await getById(userId)
        const collection = await dbService.getCollection('user')
        
        let starredBoardIds = user.starredBoardIds || []
        // Ensure all are strings for consistent comparison
        starredBoardIds = starredBoardIds.map(id => id.toString())
        
        const idx = starredBoardIds.indexOf(boardId.toString())
        
        if (idx === -1) {
            starredBoardIds.push(boardId.toString())
        } else {
            starredBoardIds.splice(idx, 1)
        }

        await collection.updateOne(
            { _id: ObjectId(userId) },
            { $set: { starredBoardIds } }
        )
        return getById(userId)
    } catch (err) {
        logger.error(`cannot toggle starred board for user ${userId}`, err)
        throw err
    }
}

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection('user')
        var users = await collection.find(criteria).toArray()
        users = users.map(user => {
            delete user.password
            user.createdAt = ObjectId(user._id).getTimestamp()
            return user
        })
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}


async function getById(userId) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ _id: ObjectId(userId) })
        delete user.password
        return user
    } catch (err) {
        logger.error(`while finding user by id: ${userId}`, err)
        throw err
    }
}
async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ username })
        return user
    } catch (err) {
        logger.error(`while finding user by username: ${username}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const collection = await dbService.getCollection('user')
        await collection.deleteOne({ _id: ObjectId(userId) })
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(user) {
    try {
        const userToSave = {
            _id: ObjectId(user._id), 
            fullname: user.fullname,
            username: user.username,
            password: user.password,
            imgUrl: user.imgUrl,
            invitations: user.invitations || [],
            notifications: user.notifications || [],
            starredBoardIds: user.starredBoardIds || []
        }
        const collection = await dbService.getCollection('user')
        await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
        delete userToSave.password
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function add(user) {
    try {
        const userToAdd = {
            username: user.username,
            password: user.password,
            fullname: user.fullname,
            imgUrl: user.imgUrl,
            invitations: [],
            notifications: [],
            starredBoardIds: []
        }
        const collection = await dbService.getCollection('user')
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('cannot add user', err)
        throw err
    }
}

async function addInvitation(userId, invitation) {
    try {
        const collection = await dbService.getCollection('user')
        await collection.updateOne(
            { _id: ObjectId(userId) },
            { $push: { invitations: invitation } }
        )
        return getById(userId)
    } catch (err) {
        logger.error(`cannot add invitation to user ${userId}`, err)
        throw err
    }
}

async function updateInvitationStatus(userId, invitationId, status) {
    try {
        const collection = await dbService.getCollection('user')
        if (status === 'accepted' || status === 'rejected') {
            await collection.updateOne(
                { _id: ObjectId(userId), 'invitations.id': invitationId },
                { $set: { 'invitations.$.status': status } }
            )
        } else if (status === 'cleared') {
             await collection.updateOne(
                { _id: ObjectId(userId) },
                { $pull: { invitations: { id: invitationId } } }
            )
        }
        return getById(userId)
    } catch (err) {
        logger.error(`cannot update invitation status for user ${userId}`, err)
        throw err
    }
}

async function addNotification(userId, notification) {
    try {
        const collection = await dbService.getCollection('user')
        await collection.updateOne(
            { _id: ObjectId(userId) },
            { $push: { notifications: { $each: [notification], $position: 0 } } }
        )
        return getById(userId)
    } catch (err) {
        logger.error(`cannot add notification to user ${userId}`, err)
        throw err
    }
}

async function clearNotifications(userId) {
    try {
        const collection = await dbService.getCollection('user')
        await collection.updateOne(
            { _id: ObjectId(userId) },
            { $set: { notifications: [] } }
        )
        return getById(userId)
    } catch (err) {
        logger.error(`cannot clear notifications for user ${userId}`, err)
        throw err
    }
}

async function markNotificationsRead(userId) {
    try {
        const collection = await dbService.getCollection('user')
        await collection.updateOne(
            { _id: ObjectId(userId) },
            { $set: { 'notifications.$[].isRead': true } }
        )
        return getById(userId)
    } catch (err) {
        logger.error(`cannot mark notifications as read for user ${userId}`, err)
        throw err
    }
}

async function updateLastSeenNotifications(userId) {
    try {
        const collection = await dbService.getCollection('user')
        await collection.updateOne(
            { _id: ObjectId(userId) },
            { $set: { lastSeenNotifications: Date.now() } }
        )
        return getById(userId)
    } catch (err) {
        logger.error(`cannot update last seen notifications for user ${userId}`, err)
        throw err
    }
}

function makeId(length = 6) {
    var txt = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (var i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return txt
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [
            {
                username: txtCriteria
            },
            {
                fullname: txtCriteria
            }
        ]
    }
    if (filterBy.minBalance) {
        criteria.score = { $gte: filterBy.minBalance }
    }
    return criteria
}




