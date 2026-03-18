const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const mailService = require('../../services/mail.service')
const { v4: uuidv4 } = require('uuid')
const ObjectId = require('mongodb').ObjectId

async function createInvite(inviteData, fromUser) {
    try {
        const token = uuidv4()
        const invite = {
            token,
            email: inviteData.email,
            workspaceId: inviteData.workspaceId,
            boardId: inviteData.boardId || null,
            role: inviteData.role || 'member',
            status: 'pending',
            invitedBy: {
                _id: fromUser._id,
                fullname: fromUser.fullname,
                imgUrl: fromUser.imgUrl
            },
            createdAt: Date.now(),
            expiresAt: Date.now() + (1000 * 60 * 60 * 24 * 7) // 7 days
        }

        const collection = await dbService.getCollection('invite')
        await collection.insertOne(invite)

        // Build the link
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
        const inviteLink = `${baseUrl}/invite/${token}`

        // Send email
        let targetTitle = 'a workspace'
        if (inviteData.boardId) {
            const boardCollection = await dbService.getCollection('board')
            const board = await boardCollection.findOne({ _id: ObjectId(inviteData.boardId) })
            if (board) targetTitle = `board: ${board.title}`
        } else if (inviteData.workspaceId) {
            const workspaceCollection = await dbService.getCollection('workspace')
            const workspace = await workspaceCollection.findOne({ _id: ObjectId(inviteData.workspaceId) })
            if (workspace) targetTitle = `workspace: ${workspace.title}`
        }

        await mailService.sendInviteEmail(invite.email, fromUser, targetTitle, inviteLink)
        return invite
    } catch (err) {
        logger.error('cannot create invite', err)
        throw err
    }
}

async function getByToken(token) {
    try {
        const collection = await dbService.getCollection('invite')
        const invite = await collection.findOne({ token })
        return invite
    } catch (err) {
        logger.error(`cannot find invite by token ${token}`, err)
        throw err
    }
}

async function acceptInvite(token, user) {
    try {
        const collection = await dbService.getCollection('invite')
        const invite = await collection.findOne({ token })

        if (!invite) throw new Error('Invitation not found')
        if (invite.status !== 'pending') throw new Error('Invitation already processed')
        if (invite.expiresAt < Date.now()) {
            await collection.updateOne({ token }, { $set: { status: 'expired' } })
            throw new Error('Invitation expired')
        }
        if (invite.email.toLowerCase() !== user.username.toLowerCase()) {
            throw new Error(`This invitation was sent to ${invite.email}, but you are logged in as ${user.username}`)
        }

        // 1. Add user to Workspace
        if (invite.workspaceId) {
            const workspaceService = require('../workspace/workspace.service')
            await workspaceService.addMember(invite.workspaceId, user, invite.role)
            logger.info(`User ${user.username} successfully added to workspace ${invite.workspaceId}`)
        }

        // 2. Add user to Board (if applicable)
        if (invite.boardId) {
            const boardService = require('../board/board.service')
            const board = await boardService.getById(invite.boardId, null)
            if (board) {
                const isMember = board.members.some(m => m._id.toString() === user._id.toString())
                if (!isMember) {
                    board.members.push({
                        _id: user._id,
                        fullname: user.fullname,
                        imgUrl: user.imgUrl
                    })
                    await boardService.update(board, null)
                    logger.info(`User ${user.username} successfully added to board ${invite.boardId}`)
                }
            }
        }

        // 3. Update invite status
        await collection.updateOne({ token }, { $set: { status: 'accepted', activatedAt: Date.now() } })
        return invite
    } catch (err) {
        logger.error(`cannot accept invite ${token}`, err)
        throw err
    }
}

module.exports = {
    createInvite,
    getByToken,
    acceptInvite
}
