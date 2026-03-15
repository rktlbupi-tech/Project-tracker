const userService = require('./user.service')
const boardService = require('../board/board.service')
const socketService = require('../../services/socket.service')
const logger = require('../../services/logger.service')

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
        
        const invitation = {
            id: userService.makeId(),
            from: { _id: fromUser._id, fullname: fromUser.fullname, imgUrl: fromUser.imgUrl },
            board: { _id: boardId, title: boardTitle },
            createdAt: Date.now(),
            expiresAt: Date.now() + (1000 * 60 * 60 * 48), // 48 hours expiry
            status: 'pending'
        }

        const invitedUser = await userService.addInvitation(invitedUserId, invitation)
        
        // Notify via socket if online
        socketService.emitToUser({
            type: 'invitation-received',
            data: invitation,
            userId: invitedUserId
        })

        res.send(invitedUser)
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

module.exports = {
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    inviteUser,
    updateInvitation
}