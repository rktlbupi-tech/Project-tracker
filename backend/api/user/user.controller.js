const userService = require('./user.service')
const boardService = require('../board/board.service')
const socketService = require('../../services/socket.service')
const logger = require('../../services/logger.service')
const { sendBoardInviteEmail } = require('../../services/mail.service')

async function getUser(req, res) {
    try {
        const user = await userService.getById(req.params.id)
        res.send(user)
    } catch (err) {
        logger.error('Failed to get user', err)
        res.status(500).send({ err: 'Failed to get user' })
    }
}

async function getUsers(req, res) {
    try {
        const users = await userService.query()
        res.send(users)
    } catch (err) {
        logger.error('Failed to get users', err)
        res.status(500).send({ err: 'Failed to get users' })
    }
}

async function deleteUser(req, res) {
    try {
        await userService.remove(req.params.id)
        res.send({ msg: 'Deleted successfully' })
    } catch (err) {
        logger.error('Failed to delete user', err)
        res.status(500).send({ err: 'Failed to delete user' })
    }
}

async function updateUser(req, res) {
    try {
        const user = req.body
        const savedUser = await userService.update(user)
        res.send(savedUser)
    } catch (err) {
        logger.error('Failed to update user', err)
        res.status(500).send({ err: 'Failed to update user' })
    }
}

async function inviteUser(req, res) {
    try {
        const { invitedUserId, boardId, boardTitle } = req.body
        const fromUser = req.loggedinUser
        let email = ''
        let invitedUser = null

        // Determine the email and check if user exists
        if (invitedUserId.includes('@')) {
            email = invitedUserId
            invitedUser = await userService.getByUsername(email)
        } else {
            invitedUser = await userService.getById(invitedUserId)
            email = invitedUser.username
        }

        // 1. Always send Email Invitation
        const inviteToken = Buffer.from(JSON.stringify({
            boardId,
            boardTitle,
            fromUser: { _id: fromUser._id, fullname: fromUser.fullname, username: fromUser.username }
        })).toString('base64')

        const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000'
        const inviteLink = `${baseUrl}/invite?token=${inviteToken}`
        
        await sendBoardInviteEmail(email, fromUser, boardTitle, inviteLink)

        // 2. If user exists, also add an in-app invitation for real-time notification
        if (invitedUser) {
            const invitation = {
                id: userService.makeId(),
                from: { _id: fromUser._id, fullname: fromUser.fullname, imgUrl: fromUser.imgUrl },
                board: { _id: boardId, title: boardTitle },
                createdAt: Date.now(),
                status: 'pending'
            }

            await userService.addInvitation(invitedUser._id, invitation)
            
            // Notify via socket if online
            socketService.emitToUser({
                type: 'invitation-received',
                data: invitation,
                userId: invitedUser._id.toString()
            })
            
            return res.send(invitedUser)
        }

        res.send({ msg: 'Email invitation sent successfully' })
    } catch (err) {
        logger.error('Failed to invite user', err)
        res.status(500).send({ err: 'Failed to invite user' })
    }
}

async function updateInvitation(req, res) {
    try {
        const { invitationId, status } = req.body
        const loggedinUser = req.loggedinUser

        const user = await userService.updateInvitationStatus(loggedinUser._id, invitationId, status)

        // If accepted, add user to board members
        if (status === 'accepted') {
            const invitation = user.invitations.find(inv => inv.id === invitationId)
            if (invitation) {
                const board = await boardService.getById(invitation.board._id)
                if (board) {
                    const member = { _id: user._id, fullname: user.fullname, imgUrl: user.imgUrl }
                    if (!board.members.find(m => m._id === member._id)) {
                        board.members.push(member)
                        await boardService.update(board)
                        // Notify board members of new member
                        socketService.broadcast({ type: 'board-add-update', data: board, room: board._id })
                    }
                }
            }
        }

        res.send(user)
    } catch (err) {
        logger.error('Failed to update invitation', err)
        res.status(500).send({ err: 'Failed to update invitation' })
    }
}

async function toggleStarred(req, res) {
    try {
        const { boardId } = req.body
        const userId = req.loggedinUser._id
        const user = await userService.toggleStarredBoard(userId, boardId)
        res.send(user)
    } catch (err) {
        logger.error('Failed to toggle starred', err)
        res.status(500).send({ err: 'Failed to toggle starred' })
    }
}

async function clearNotifications(req, res) {
    try {
        const userId = req.loggedinUser._id
        const user = await userService.clearNotifications(userId)
        res.send(user)
    } catch (err) {
        logger.error('Failed to clear notifications', err)
        res.status(500).send({ err: 'Failed to clear notifications' })
    }
}

async function markNotificationsRead(req, res) {
    try {
        const userId = req.loggedinUser._id
        const user = await userService.markNotificationsRead(userId)
        res.send(user)
    } catch (err) {
        logger.error('Failed to mark notifications as read', err)
        res.status(500).send({ err: 'Failed to mark notifications as read' })
    }
}

async function updateLastSeenNotifications(req, res) {
    try {
        const userId = req.loggedinUser._id
        const user = await userService.updateLastSeenNotifications(userId)
        res.send(user)
    } catch (err) {
        logger.error('Failed to update last seen notifications', err)
        res.status(500).send({ err: 'Failed to update last seen notifications' })
    }
}

module.exports = {
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    inviteUser,
    updateInvitation,
    toggleStarred,
    clearNotifications,
    markNotificationsRead,
    updateLastSeenNotifications
}