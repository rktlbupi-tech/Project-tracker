const inviteService = require('./invite.service.js')
const logger = require('../../services/logger.service')

async function createInvite(req, res) {
    const { loggedinUser } = req
    try {
        const inviteData = req.body
        const invite = await inviteService.createInvite(inviteData, loggedinUser)
        res.json(invite)
    } catch (err) {
        logger.error('Failed to create invite', err)
        res.status(500).send({ err: 'Failed to create invite' })
    }
}

async function getInviteByToken(req, res) {
    try {
        const token = req.params.token
        const invite = await inviteService.getByToken(token)
        if (!invite) return res.status(404).send({ err: 'Invite not found' })
        res.json(invite)
    } catch (err) {
        logger.error('Failed to get invite', err)
        res.status(500).send({ err: 'Failed to get invite' })
    }
}

async function acceptInvite(req, res) {
    const { loggedinUser } = req
    try {
        const token = req.params.token
        const invite = await inviteService.acceptInvite(token, loggedinUser)
        res.json(invite)
    } catch (err) {
        logger.error('Failed to accept invite', err)
        // Send actual error message to the client for UI feedback
        res.status(400).send({ err: err.message })
    }
}

module.exports = {
    createInvite,
    getInviteByToken,
    acceptInvite
}
