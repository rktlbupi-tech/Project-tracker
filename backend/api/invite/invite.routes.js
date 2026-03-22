const express = require('express')
const { requireAuth } = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
const { createInvite, getInviteByToken, acceptInvite } = require('./invite.controller')
const router = express.Router()

router.post('/', log, requireAuth, createInvite)
router.get('/:token', log, getInviteByToken)
router.post('/:token/accept', log, requireAuth, acceptInvite)

module.exports = router
